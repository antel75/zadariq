import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FEED_URL = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-croatia";

// Zadar county geocode / region identifiers used by DHMZ in Meteoalarm
const ZADAR_KEYWORDS = ["zadar", "zadarska", "HR005", "dalmacija", "dalmatia", "obala", "coast", "adriatic"];

interface MeteoAlert {
  title: string;
  level: string; // "yellow" | "orange" | "red"
  levelNum: number; // 2=yellow, 3=orange, 4=red
  type: string; // wind, rain, thunderstorm, etc.
  description: string;
  from: string;
  until: string;
}

function parseAwarenessLevel(text: string): { level: string; levelNum: number } {
  if (text.includes("4") || text.toLowerCase().includes("red")) return { level: "red", levelNum: 4 };
  if (text.includes("3") || text.toLowerCase().includes("orange")) return { level: "orange", levelNum: 3 };
  if (text.includes("2") || text.toLowerCase().includes("yellow")) return { level: "yellow", levelNum: 2 };
  return { level: "green", levelNum: 1 };
}

function parseAwarenessType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("wind")) return "wind";
  if (lower.includes("rain") || lower.includes("kiša")) return "rain";
  if (lower.includes("thunder") || lower.includes("grmljavin")) return "thunderstorm";
  if (lower.includes("snow") || lower.includes("snijeg")) return "snow";
  if (lower.includes("fog") || lower.includes("magl")) return "fog";
  if (lower.includes("heat") || lower.includes("toplinski")) return "extreme_heat";
  if (lower.includes("cold") || lower.includes("hladno")) return "extreme_cold";
  if (lower.includes("ice") || lower.includes("led")) return "ice";
  if (lower.includes("flood") || lower.includes("poplav")) return "flood";
  if (lower.includes("fire") || lower.includes("požar")) return "forest_fire";
  if (lower.includes("coast") || lower.includes("wave") || lower.includes("val")) return "coastal";
  if (lower.includes("avalanche") || lower.includes("lavin")) return "avalanche";
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const feedRes = await fetch(FEED_URL, {
      headers: { "User-Agent": "ZadarIQ/1.0" },
    });

    if (!feedRes.ok) {
      throw new Error(`Meteoalarm feed returned ${feedRes.status}`);
    }

    const xml = await feedRes.text();

    // Parse entries from Atom XML
    const alerts: MeteoAlert[] = [];
    const entries = xml.split("<entry>").slice(1); // skip header

    for (const entry of entries) {
      // Check if this entry is relevant to Zadar region
      const entryLower = entry.toLowerCase();
      const isZadarRelevant = ZADAR_KEYWORDS.some((kw) => entryLower.includes(kw));

      if (!isZadarRelevant) continue;

      // Extract awareness level
      const levelMatch = entry.match(/awareness_level[^>]*>([^<]*)</i) ||
        entry.match(/<cap:parameter>\s*<cap:valueName>awareness_level<\/cap:valueName>\s*<cap:value>([^<]*)<\/cap:value>/i);
      const levelText = levelMatch?.[1] || "";
      const { level, levelNum } = parseAwarenessLevel(levelText);

      // Skip green/no-warning
      if (levelNum < 2) continue;

      // Extract awareness type
      const typeMatch = entry.match(/awareness_type[^>]*>([^<]*)</i) ||
        entry.match(/<cap:parameter>\s*<cap:valueName>awareness_type<\/cap:valueName>\s*<cap:value>([^<]*)<\/cap:value>/i);
      const typeText = typeMatch?.[1] || "";
      const type = parseAwarenessType(typeText || entryLower);

      // Extract title
      const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch?.[1]?.trim() || "Meteo upozorenje";

      // Extract description/summary
      const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
        entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
      let description = summaryMatch?.[1]?.trim() || "";
      // Clean HTML tags
      description = description.replace(/<[^>]+>/g, "").trim();

      // Extract time
      const fromMatch = entry.match(/<cap:onset>([^<]*)<\/cap:onset>/i) ||
        entry.match(/from[:\s]*(\d{4}-\d{2}-\d{2}T[\d:]+)/i);
      const untilMatch = entry.match(/<cap:expires>([^<]*)<\/cap:expires>/i) ||
        entry.match(/until[:\s]*(\d{4}-\d{2}-\d{2}T[\d:]+)/i);

      alerts.push({
        title,
        level,
        levelNum,
        type,
        description: description.slice(0, 200),
        from: fromMatch?.[1] || "",
        until: untilMatch?.[1] || "",
      });
    }

    // Sort by severity (highest first)
    alerts.sort((a, b) => b.levelNum - a.levelNum);

    return new Response(JSON.stringify({ alerts, fetched_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Meteoalarm fetch error:", error);
    return new Response(
      JSON.stringify({ alerts: [], error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
