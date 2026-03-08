import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Extract raw 32-byte private key from PKCS#8 DER encoding
function extractRawPrivateKey(pkcs8Base64Url: string): string {
  const base64 = pkcs8Base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
  // Raw 32-byte key starts at offset 36 in PKCS#8 EC key
  const raw = bytes.slice(36, 68);
  // Convert back to URL-safe base64
  let b64 = btoa(String.fromCharCode(...raw));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const vapidPrivateKey = extractRawPrivateKey(Deno.env.get("VAPID_PRIVATE_KEY")!);

webpush.setVapidDetails(
  "mailto:admin@zadariq.city",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  vapidPrivateKey
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) throw error;

    let sent = 0;
    let failed = 0;
    let removed = 0;

    const payload = JSON.stringify({
      title: "🛒 Sunday Radar",
      body: "Provjeri koji dućani rade sutra →",
      url: "/sunday-radar",
    });

    for (const sub of subs || []) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          removed++;
        } else {
          console.error(`Failed to send to ${sub.endpoint}:`, err.message);
          failed++;
        }
      }
    }

    return new Response(JSON.stringify({ sent, failed, removed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-sunday-push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
