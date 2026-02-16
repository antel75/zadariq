import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "generic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "generic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { business_id, email, code } = await req.json();
    if (!business_id || !email || !code) {
      return new Response(
        JSON.stringify({ success: false, error: "generic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Find pending request
    const { data: requests } = await admin
      .from("ownership_claim_requests")
      .select("*")
      .eq("business_id", business_id)
      .eq("email", email)
      .eq("status", "pending")
      .eq("requester_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "generic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request = requests[0];

    // Check expiry
    if (new Date(request.expires_at) < new Date()) {
      await admin
        .from("ownership_claim_requests")
        .update({ status: "expired" })
        .eq("id", request.id);
      return new Response(
        JSON.stringify({ success: false, error: "expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check lock (5 attempts)
    if (request.attempts >= 5) {
      // Check if 30 min lock has passed
      if (request.last_attempt_at) {
        const lockUntil =
          new Date(request.last_attempt_at).getTime() + 30 * 60 * 1000;
        if (Date.now() < lockUntil) {
          return new Response(
            JSON.stringify({ success: false, error: "locked" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        // Lock expired, reset attempts
        await admin
          .from("ownership_claim_requests")
          .update({ attempts: 0, status: "pending" })
          .eq("id", request.id);
      } else {
        await admin
          .from("ownership_claim_requests")
          .update({ status: "locked", last_attempt_at: new Date().toISOString() })
          .eq("id", request.id);
        return new Response(
          JSON.stringify({ success: false, error: "locked" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Compare hash
    const inputHash = await hashCode(code);

    if (inputHash !== request.code_hash) {
      const newAttempts = (request.attempts || 0) + 1;
      const updateData: any = {
        attempts: newAttempts,
        last_attempt_at: new Date().toISOString(),
      };
      if (newAttempts >= 5) {
        updateData.status = "locked";
      }
      await admin
        .from("ownership_claim_requests")
        .update(updateData)
        .eq("id", request.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: newAttempts >= 5 ? "locked" : "generic",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CODE IS CORRECT — grant ownership transactionally
    // 1. Mark request as verified
    await admin
      .from("ownership_claim_requests")
      .update({ status: "verified" })
      .eq("id", request.id);

    // 2. Supersede all other requests for this business
    await admin
      .from("ownership_claim_requests")
      .update({ status: "superseded" })
      .eq("business_id", business_id)
      .neq("id", request.id)
      .eq("status", "pending");

    // 3. Upsert business ownership
    const { data: existing } = await admin
      .from("business_ownership")
      .select("id")
      .eq("business_id", business_id)
      .maybeSingle();

    if (existing) {
      await admin
        .from("business_ownership")
        .update({
          owner_user_id: user.id,
          verified: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("business_ownership").insert({
        business_id,
        owner_user_id: user.id,
        verified: true,
        verified_at: new Date().toISOString(),
      });
    }

    // 4. Audit log
    await admin.from("ownership_audit_log").insert({
      business_id,
      action: "ownership_granted",
      actor_user_id: user.id,
      email,
      ip,
      user_agent: userAgent,
      details: { claim_request_id: request.id },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(
      JSON.stringify({ success: false, error: "generic" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
