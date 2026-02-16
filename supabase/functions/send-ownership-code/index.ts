import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple hash using Web Crypto API (SHA-256)
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user client to get user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { business_id, email } = await req.json();
    if (!business_id || !email) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for DB operations
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Rate limit: max 3 requests per business+email in 30 min
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentRequests } = await admin
      .from("ownership_claim_requests")
      .select("id, created_at")
      .eq("business_id", business_id)
      .eq("email", email)
      .gte("created_at", thirtyMinAgo);

    if (recentRequests && recentRequests.length >= 3) {
      // Silent success (anti-enumeration)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cooldown: 60 seconds since last request for this business+email
    if (recentRequests && recentRequests.length > 0) {
      const lastRequest = recentRequests.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const elapsed =
        Date.now() - new Date(lastRequest.created_at).getTime();
      if (elapsed < 60000) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Supersede all old pending requests for this business
    await admin
      .from("ownership_claim_requests")
      .update({ status: "superseded" })
      .eq("business_id", business_id)
      .eq("status", "pending");

    // Generate and hash code
    const code = generateCode();
    const codeHash = await hashCode(code);

    // Insert new request
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await admin.from("ownership_claim_requests").insert({
      business_id,
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
      requester_user_id: user.id,
      ip,
      user_agent: userAgent,
    });

    // Send email via Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "ZadarIQ <onboarding@resend.dev>",
        to: [email],
        subject: "ZadarIQ — Verifikacijski kod za preuzimanje vlasništva",
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">ZadarIQ potvrda vlasništva</h2>
            <p style="color: #666; font-size: 14px;">Vaš verifikacijski kod:</p>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; color: #1a1a1a;">${code}</span>
            </div>
            <p style="color: #666; font-size: 13px;">Kod vrijedi 15 minuta. Ako niste zatražili ovu potvrdu, ignorirajte ovu poruku.</p>
          </div>
        `,
      }),
    });

    // Audit log
    await admin.from("ownership_audit_log").insert({
      business_id,
      action: "claim_requested",
      actor_user_id: user.id,
      email,
      ip,
      user_agent: userAgent,
      details: { expires_at: expiresAt },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
