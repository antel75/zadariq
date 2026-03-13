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
    if (!res.ok) {
      console.error("Grad Zadar fetch failed:", res.status);
      return alerts;
    }
    const html = await res.text();
    console.log("Grad Zadar HTML length:", html.length);

    // 1) Featured article: div.singledout > h2 > a
    const featuredPattern = /<div[^>]*class="[^"]*singledout[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<!--\s*col-sm-6/i;
    const featuredMatch = html.match(featuredPattern);
    if (featuredMatch) {
      const block = featuredMatch[1];
      const linkMatch = block.match(/<h2[^>]*class="bigger"[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (linkMatch) {
        const url = linkMatch[1];
        const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
        // Get summary from the next h2 or p
        const summaryMatch = block.match(/<\/h2>\s*<h2>([\s\S]*?)<\/h2>/i);
        const summary = summaryMatch
          ? summaryMatch[1].replace(/<[^>]+>/g, "").trim()
          : title;

        if (title) {
          const highPriorityKeywords = ["zatvoren", "radovi", "privremena regulacija", "zabran", "ograničen"];
          const isHigh = highPriorityKeywords.some(k => title.toLowerCase().includes(k));

          alerts.push({
            title: title.slice(0, 40),
            summary: (summary || title).slice(0, 80),
            source: "grad-zadar",
            source_url: url,
            priority: isHigh ? 80 : 60,
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: "traffic",
            geo_relevance: "zadar-city",
          });
          console.log("Featured article:", title.slice(0, 50));
        }
      }
    }

    // 2) Carousel items: div.col-sm-4 with h2 > a links to /vijest/obavijesti
    const carouselPattern = /<div[^>]*class="col-sm-4"[^>]*>([\s\S]*?)<\/div>\s*<!--\s*col-sm-4/gi;
    let match;
    while ((match = carouselPattern.exec(html)) !== null && alerts.length < 8) {
      const block = match[1];
      const linkMatch = block.match(/<h2>\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
      if (!linkMatch) continue;

      const url = linkMatch[1];
      // Only traffic/transport notices
      if (!url.includes("obavijesti") && !url.includes("promet") && !url.includes("regulacij")) continue;

      const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
      if (!title) continue;

      // Get date from <time datetime="...">
      const dateMatch = block.match(/<time\s+datetime="([^"]+)"/i);
      if (dateMatch) {
        const d = new Date(dateMatch[1]);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (d < thirtyDaysAgo) continue;
      }

      // Get summary from <p>
      const pMatch = block.match(/<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
      const summary = pMatch ? pMatch[1].replace(/<[^>]+>/g, "").trim() : title;

      // Avoid duplicates within this batch
      if (alerts.some(a => a.source_url === url)) continue;

      const highPriorityKeywords = ["zatvoren", "radovi", "privremena regulacija", "zabran", "ograničen"];
      const isHigh = highPriorityKeywords.some(k => title.toLowerCase().includes(k));

      alerts.push({
        title: title.slice(0, 40),
        summary: (summary || title).slice(0, 80),
        source: "grad-zadar",
        source_url: url,
        priority: isHigh ? 80 : 60,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "traffic",
        geo_relevance: "zadar-city",
      });
      console.log("Carousel item:", title.slice(0, 50));
    }

    console.log(`Grad Zadar parser: found ${alerts.length} alerts`);
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

    const allText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
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

      alerts.push({
        title: sentence.trim().slice(0, 40),
        summary: sentence.trim().slice(0, 80),
        source: "hak",
        source_url: "https://m.hak.hr/stanje.asp?id=1",
        priority,
        valid_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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

    const resultPattern = /(\d{2,3})\s*[-:]\s*(\d{2,3})/;
    const teamPattern = /zadar/i;
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

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
