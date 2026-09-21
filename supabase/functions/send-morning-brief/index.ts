import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function zagrebToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function upcomingSunday(today: string): string {
  const d = new Date(`${today}T12:00:00Z`);
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? 0 : 7 - dow));
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = zagrebToday();
    const sunday = upcomingSunday(today);
    const isSunday = today === sunday;

    // ── Compose the brief ──
    const parts: string[] = [];

    // Weather
    try {
      const wRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=44.12&longitude=15.23&current=temperature_2m,weather_code&daily=temperature_2m_max,precipitation_probability_max&timezone=Europe%2FZagreb&forecast_days=1",
      );
      if (wRes.ok) {
        const w = await wRes.json();
        const max = Math.round(w.daily?.temperature_2m_max?.[0] ?? w.current?.temperature_2m ?? 0);
        const rain = w.daily?.precipitation_probability_max?.[0] ?? 0;
        parts.push(rain >= 50 ? `${max}°, kiša ${rain}%` : `${max}°`);
      }
    } catch (_) { /* weather is optional */ }

    // Duty pharmacy
    const { data: pharm } = await supabase
      .from("duty_services")
      .select("name")
      .eq("type", "pharmacy")
      .eq("enabled", true)
      .lte("valid_from", today)
      .gte("valid_until", today)
      .limit(1);
    if (pharm?.[0]?.name) parts.push(`ljekarna: ${pharm[0].name}`);

    // Today's events in Zadar
    const { data: events } = await supabase
      .from("city_events")
      .select("id")
      .eq("region", "zadar")
      .lte("event_date_from", today)
      .gte("event_date_to", today);
    if (events && events.length > 0) parts.push(`${events.length} događanja danas`);

    // Sunday shops
    const { data: shops } = await supabase
      .from("shop_sunday_schedule")
      .select("id")
      .eq("sunday_date", sunday);
    if (shops && shops.length > 0) {
      parts.push(isSunday ? `${shops.length} dućana radi danas` : `nedjelja: ${shops.length} dućana`);
    }

    const body = parts.length > 0 ? parts.join(" · ") : "Otvori i vidi što te danas čeka u Zadru.";
    const payload = JSON.stringify({
      title: "☀️ Zadar danas",
      body,
      url: "/danas",
    });

    // ── Send ──
    webpush.setVapidDetails(
      "mailto:admin@zadariq.city",
      Deno.env.get("VAPID_PUBLIC_KEY_V2") ?? Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY_V2") ?? Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
    if (error) throw error;

    let sent = 0, failed = 0, removed = 0;
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          removed++;
        } else {
          console.error(`push failed ${sub.endpoint}: ${err.message}`);
          failed++;
        }
      }
    }

    return new Response(JSON.stringify({ body, sent, failed, removed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-morning-brief error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
