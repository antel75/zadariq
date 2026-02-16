import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertInput {
  title: string;
  summary: string;
  source: string;
  source_url?: string;
  priority: number;
  valid_until: string;
  type: string;
  geo_relevance?: string;
}

// Simple hash for dedup
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ========== PARSER: Grad Zadar Promet ==========
async function parseGradZadarPromet(): Promise<AlertInput[]> {
  const alerts: AlertInput[] = [];
  try {
    const res = await fetch("https://www.grad-zadar.hr/pocetna/obavijesti-o-prometu-29/", {
      headers: { "User-Agent": "ZadarIQ/1.0 CityInfoBot" },
    });
    if (!res.ok) return alerts;
    const html = await res.text();

    // Extract article blocks - simplified regex parsing
    const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    const titlePattern = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i;
    const linkPattern = /href="([^"]+)"/i;
    const datePattern = /(\d{1,2}\.\d{1,2}\.\d{4})/;

    let match;
    let count = 0;
    while ((match = articlePattern.exec(html)) !== null && count < 5) {
      const block = match[1];
      const titleMatch = block.match(titlePattern);
      if (!titleMatch) continue;

      const rawTitle = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      if (!rawTitle) continue;

      // Check if older than 3 days
      const dateMatch = block.match(datePattern);
      if (dateMatch) {
        const parts = dateMatch[1].split(".");
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        if (d < threeDaysAgo) continue;
      }

      const linkMatch = block.match(linkPattern);
      const url = linkMatch ? (linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.grad-zadar.hr${linkMatch[1]}`) : "https://www.grad-zadar.hr/pocetna/obavijesti-o-prometu-29/";

      const highPriorityKeywords = ["zatvoren", "radovi", "privremena regulacija", "zabran", "ograničen"];
      const isHigh = highPriorityKeywords.some(k => rawTitle.toLowerCase().includes(k));

      alerts.push({
        title: rawTitle.slice(0, 40),
        summary: rawTitle.slice(0, 80),
        source: "grad-zadar",
        source_url: url,
        priority: isHigh ? 80 : 60,
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: "traffic",
        geo_relevance: "zadar-city",
      });
      count++;
    }

    // Fallback: try simpler pattern if no articles found
    if (alerts.length === 0) {
      const listPattern = /<li[^>]*class="[^"]*news[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
      while ((match = listPattern.exec(html)) !== null && count < 5) {
        const block = match[1];
        const titleMatch = block.match(titlePattern);
        if (!titleMatch) continue;
        const rawTitle = titleMatch[1].replace(/<[^>]+>/g, "").trim();
        if (!rawTitle) continue;

        const linkMatch = block.match(linkPattern);
        const url = linkMatch ? (linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.grad-zadar.hr${linkMatch[1]}`) : "https://www.grad-zadar.hr";

        alerts.push({
          title: rawTitle.slice(0, 40),
          summary: rawTitle.slice(0, 80),
          source: "grad-zadar",
          source_url: url,
          priority: 60,
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          type: "traffic",
          geo_relevance: "zadar-city",
        });
        count++;
      }
    }
  } catch (e) {
    console.error("Grad Zadar parser error:", e);
  }
  return alerts;
}

// ========== PARSER: HAK ==========
async function parseHAK(): Promise<AlertInput[]> {
  const alerts: AlertInput[] = [];
  const zadarKeywords = [
    "maslenica", "a1", "sveti rok", "tunel sveti rok", "tunel mala kapela",
    "lika", "jadranska magistrala", "senj", "karlobag", "posedarje",
    "pag", "most pag", "bura", "zadar",
  ];

  try {
    const res = await fetch("https://www.hak.hr/info/stanje-na-cestama/", {
      headers: { "User-Agent": "ZadarIQ/1.0 CityInfoBot" },
    });
    if (!res.ok) return alerts;
    const html = await res.text();

    // Extract text content blocks
    const blockPattern = /<div[^>]*class="[^"]*road[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const allText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // Split into sentences/sections
    const sentences = allText.split(/[.!]\s+/).filter(s => s.length > 20);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const isRelevant = zadarKeywords.some(k => lower.includes(k));
      if (!isRelevant) continue;

      let priority = 70;
      if (lower.includes("zatvoren") || lower.includes("blokiran")) priority = 100;
      else if (lower.includes("zabran") && (lower.includes("kamion") || lower.includes("autobus"))) priority = 95;
      else if (lower.includes("zimski uvjeti") || lower.includes("snijeg") || lower.includes("led")) priority = 85;
      else if (lower.includes("pojačan promet") || lower.includes("gužva")) priority = 70;

      const title = sentence.trim().slice(0, 40);
      const summary = sentence.trim().slice(0, 80);

      alerts.push({
        title,
        summary,
        source: "hak",
        source_url: "https://m.hak.hr/stanje.asp?id=1",
        priority,
        valid_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2h
        type: "roads",
        geo_relevance: "zadar-region",
      });

      if (alerts.length >= 3) break;
    }
  } catch (e) {
    console.error("HAK parser error:", e);
  }
  return alerts;
}

// ========== PARSER: KK Zadar ==========
async function parseKKZadar(): Promise<AlertInput[]> {
  const alerts: AlertInput[] = [];
  try {
    const res = await fetch("https://www.kkzadar.hr/", {
      headers: { "User-Agent": "ZadarIQ/1.0 CityInfoBot" },
    });
    if (!res.ok) return alerts;
    const html = await res.text();

    // Try to find latest result
    const resultPattern = /(\d{2,3})\s*[-:]\s*(\d{2,3})/;
    const teamPattern = /zadar/i;
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // Look for score patterns near "Zadar"
    const segments = text.split(/[.!]\s+/);
    for (const seg of segments) {
      if (!teamPattern.test(seg)) continue;
      const scoreMatch = seg.match(resultPattern);
      if (scoreMatch) {
        alerts.push({
          title: "KK Zadar",
          summary: seg.trim().slice(0, 80),
          source: "kk-zadar",
          source_url: "https://www.kkzadar.hr/",
          priority: 40,
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          type: "sport",
          geo_relevance: "zadar-city",
        });
        break;
      }
    }
  } catch (e) {
    console.error("KK Zadar parser error:", e);
  }
  return alerts;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse which sources to run (or all)
    let sources = ["grad-zadar", "hak", "kk-zadar"];
    try {
      const body = await req.json();
      if (body?.sources) sources = body.sources;
    } catch {
      // no body = run all
    }

    const allAlerts: AlertInput[] = [];

    if (sources.includes("grad-zadar")) {
      const a = await parseGradZadarPromet();
      allAlerts.push(...a);
    }
    if (sources.includes("hak")) {
      const a = await parseHAK();
      allAlerts.push(...a);
    }
    if (sources.includes("kk-zadar")) {
      const a = await parseKKZadar();
      allAlerts.push(...a);
    }

    console.log(`Parsed ${allAlerts.length} alerts from sources: ${sources.join(", ")}`);

    // Upsert alerts with dedup hash
    let inserted = 0;
    for (const alert of allAlerts) {
      const hash = simpleHash(`${alert.source}:${alert.title}:${alert.summary}`);
      const { error } = await supabase.from("city_alerts").upsert(
        { ...alert, hash },
        { onConflict: "hash" }
      );
      if (!error) inserted++;
      else console.error("Upsert error:", error.message);
    }

    // Cleanup expired alerts
    const { data: deleted } = await supabase
      .from("city_alerts")
      .delete()
      .lt("valid_until", new Date().toISOString())
      .select("id");

    console.log(`Inserted/updated: ${inserted}, Cleaned up: ${deleted?.length || 0} expired`);

    return new Response(
      JSON.stringify({
        success: true,
        parsed: allAlerts.length,
        inserted,
        cleaned: deleted?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Scrape city alerts error:", e);
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
