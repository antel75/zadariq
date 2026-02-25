import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// DHMZ CAP XML feeds (primary source — official Croatian Met Service)
const DHMZ_TODAY_URL = "https://meteo.hr/upozorenja/cap_hr_today.xml";
const DHMZ_TOMORROW_URL = "https://meteo.hr/upozorenja/cap_hr_tomorrow.xml";

// Meteoalarm Atom feed (fallback)
const METEOALARM_FEED_URL = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-croatia";

// Zadar-relevant EMMA_ID regions
// HR001 = Kninska regija (covers Zadar inland)
// HR804 = Sjeverna Dalmacija (covers Zadar coast)
const ZADAR_EMMA_IDS = ["HR001", "HR804"];

// Fallback keywords for Meteoalarm Atom feed
const ZADAR_KEYWORDS = ["zadar", "zadarska", "HR001", "HR804", "HR005", "dalmacija", "dalmatia", "obala", "coast", "adriatic", "sjeverna dalmacija", "kninska"];

interface MeteoAlert {
  title: string;
  level: string; // "yellow" | "orange" | "red"
  levelNum: number; // 2=yellow, 3=orange, 4=red
  type: string; // wind, rain, thunderstorm, etc.
  description: string;
  from: string;
  until: string;
  source: string; // "dhmz" | "meteoalarm"
}

// ── DHMZ CAP XML Parser ──

function parseAwarenessLevelFromCAP(text: string): { level: string; levelNum: number } {
  // Format: "2; yellow; Moderate" or "3; orange; Severe" or "4; red; Extreme"
  const lower = text.toLowerCase();
  if (lower.includes("4") || lower.includes("red") || lower.includes("extreme")) return { level: "red", levelNum: 4 };
  if (lower.includes("3") || lower.includes("orange") || lower.includes("severe")) return { level: "orange", levelNum: 3 };
  if (lower.includes("2") || lower.includes("yellow") || lower.includes("moderate")) return { level: "yellow", levelNum: 2 };
  return { level: "green", levelNum: 1 };
}

function parseAwarenessTypeFromCAP(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("wind")) return "wind";
  if (lower.includes("rain")) return "rain";
  if (lower.includes("thunder")) return "thunderstorm";
  if (lower.includes("snow") || lower.includes("ice")) return "snow_ice";
  if (lower.includes("fog")) return "fog";
  if (lower.includes("high-temperature") || lower.includes("heat")) return "extreme_heat";
  if (lower.includes("low-temperature") || lower.includes("cold")) return "extreme_cold";
  if (lower.includes("flood")) return "flood";
  if (lower.includes("fire")) return "forest_fire";
  if (lower.includes("coast") || lower.includes("wave")) return "coastal";
  if (lower.includes("avalanche")) return "avalanche";
  return "unknown";
}

function parseDHMZAlerts(xml: string): MeteoAlert[] {
  const alerts: MeteoAlert[] = [];

  // Split into <info> blocks — each <alert> contains multiple <info> blocks (hr + en)
  // We want the Croatian ones for descriptions but English for type parsing
  // Actually, each <alert> has multiple <info> blocks; we parse <info lang="hr"> for descriptions
  const infoBlocks = xml.split(/<info>/i).slice(1);

  for (const info of infoBlocks) {
    // Only process Croatian language blocks for display
    const langMatch = info.match(/<language>(\w+)<\/language>/i);
    const lang = langMatch?.[1] ?? "hr";
    if (lang !== "hr") continue;

    // Check if any area in this info block matches Zadar EMMA_IDs
    const areaBlocks = info.split(/<area>/i).slice(1);
    let isZadarRelevant = false;
    for (const area of areaBlocks) {
      for (const emmaId of ZADAR_EMMA_IDS) {
        if (area.includes(emmaId)) {
          isZadarRelevant = true;
          break;
        }
      }
      if (isZadarRelevant) break;
    }
    if (!isZadarRelevant) continue;

    // Extract awareness_level
    const levelMatch = info.match(/awareness_level<\/valueName>\s*<value>([^<]*)<\/value>/i);
    const levelText = levelMatch?.[1] || "";
    const { level, levelNum } = parseAwarenessLevelFromCAP(levelText);

    // Skip green/no-warning
    if (levelNum < 2) continue;

    // Extract awareness_type
    const typeMatch = info.match(/awareness_type<\/valueName>\s*<value>([^<]*)<\/value>/i);
    const typeText = typeMatch?.[1] || "";
    const type = parseAwarenessTypeFromCAP(typeText);

    // Extract event (title)
    const eventMatch = info.match(/<event>([^<]*)<\/event>/i);
    const title = eventMatch?.[1]?.trim() || "Meteo upozorenje";

    // Extract description
    const descMatch = info.match(/<description>([^<]*)<\/description>/i);
    let description = descMatch?.[1]?.trim() || "";
    description = description.replace(/<[^>]+>/g, "").trim();

    // Extract time
    const onsetMatch = info.match(/<onset>([^<]*)<\/onset>/i);
    const expiresMatch = info.match(/<expires>([^<]*)<\/expires>/i);

    // Skip expired alerts
    if (expiresMatch?.[1]) {
      const expiresDate = new Date(expiresMatch[1]);
      if (!isNaN(expiresDate.getTime()) && expiresDate.getTime() < Date.now()) {
        continue;
      }
    }

    // Deduplicate — avoid adding same type+level combo
    const existing = alerts.find(a => a.type === type && a.levelNum === levelNum);
    if (existing) continue;

    alerts.push({
      title,
      level,
      levelNum,
      type,
      description: description.slice(0, 300),
      from: onsetMatch?.[1] || "",
      until: expiresMatch?.[1] || "",
      source: "dhmz",
    });
  }

  return alerts;
}

// ── Meteoalarm Atom fallback parser (existing logic) ──

function parseMeteoalarmAtomAlerts(xml: string): MeteoAlert[] {
  const alerts: MeteoAlert[] = [];
  const entries = xml.split("<entry>").slice(1);

  for (const entry of entries) {
    const entryLower = entry.toLowerCase();
    const isZadarRelevant = ZADAR_KEYWORDS.some((kw) => entryLower.includes(kw));
    if (!isZadarRelevant) continue;

    const levelMatch = entry.match(/awareness_level[^>]*>([^<]*)</i) ||
      entry.match(/<cap:parameter>\s*<cap:valueName>awareness_level<\/cap:valueName>\s*<cap:value>([^<]*)<\/cap:value>/i);
    const levelText = levelMatch?.[1] || "";
    const { level, levelNum } = parseAwarenessLevelFromCAP(levelText);
    if (levelNum < 2) continue;

    const typeMatch = entry.match(/awareness_type[^>]*>([^<]*)</i) ||
      entry.match(/<cap:parameter>\s*<cap:valueName>awareness_type<\/cap:valueName>\s*<cap:value>([^<]*)<\/cap:value>/i);
    const typeText = typeMatch?.[1] || "";
    const type = parseAwarenessTypeFromCAP(typeText || entryLower);

    const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "Meteo upozorenje";

    const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
      entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
    let description = summaryMatch?.[1]?.trim() || "";
    description = description.replace(/<[^>]+>/g, "").trim();

    const fromMatch = entry.match(/<cap:onset>([^<]*)<\/cap:onset>/i) ||
      entry.match(/from[:\s]*(\d{4}-\d{2}-\d{2}T[\d:]+)/i);
    const untilMatch = entry.match(/<cap:expires>([^<]*)<\/cap:expires>/i) ||
      entry.match(/until[:\s]*(\d{4}-\d{2}-\d{2}T[\d:]+)/i);

    // Skip expired alerts
    if (untilMatch?.[1]) {
      const expiresDate = new Date(untilMatch[1]);
      if (!isNaN(expiresDate.getTime()) && expiresDate.getTime() < Date.now()) {
        continue;
      }
    }

    alerts.push({
      title,
      level,
      levelNum,
      type,
      description: description.slice(0, 200),
      from: fromMatch?.[1] || "",
      until: untilMatch?.[1] || "",
      source: "meteoalarm",
    });
  }

  return alerts;
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let alerts: MeteoAlert[] = [];
    let source = "dhmz";

    // ── Primary: DHMZ CAP XML (today + tomorrow) ──
    try {
      const [todayRes, tomorrowRes] = await Promise.all([
        fetch(DHMZ_TODAY_URL, { headers: { "User-Agent": "ZadarIQ/1.0" } }),
        fetch(DHMZ_TOMORROW_URL, { headers: { "User-Agent": "ZadarIQ/1.0" } }),
      ]);

      if (todayRes.ok) {
        const todayXml = await todayRes.text();
        alerts.push(...parseDHMZAlerts(todayXml));
      }

      if (tomorrowRes.ok) {
        const tomorrowXml = await tomorrowRes.text();
        const tomorrowAlerts = parseDHMZAlerts(tomorrowXml);
        // Tag tomorrow alerts
        for (const a of tomorrowAlerts) {
          // Only add if not already present (same type+level)
          if (!alerts.find(existing => existing.type === a.type && existing.levelNum === a.levelNum)) {
            alerts.push(a);
          }
        }
      }

      console.log(`DHMZ CAP: found ${alerts.length} alerts for Zadar region`);
    } catch (dhmzError) {
      console.error("DHMZ CAP fetch failed, falling back to Meteoalarm:", dhmzError);
    }

    // ── Fallback: Meteoalarm Atom feed ──
    if (alerts.length === 0) {
      try {
        source = "meteoalarm";
        const feedRes = await fetch(METEOALARM_FEED_URL, {
          headers: { "User-Agent": "ZadarIQ/1.0" },
        });
        if (feedRes.ok) {
          const xml = await feedRes.text();
          alerts = parseMeteoalarmAtomAlerts(xml);
          console.log(`Meteoalarm fallback: found ${alerts.length} alerts`);
        }
      } catch (fallbackError) {
        console.error("Meteoalarm fallback also failed:", fallbackError);
      }
    }

    // Sort by severity (highest first)
    alerts.sort((a, b) => b.levelNum - a.levelNum);

    return new Response(
      JSON.stringify({
        alerts,
        source,
        fetched_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Meteoalarm fetch error:", error);
    return new Response(
      JSON.stringify({
        alerts: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
