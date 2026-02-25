import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function parseEnglishDate(dateStr: string): string | undefined {
  // "Aug 23, 2025" or "Jun 1, 2026" etc
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const m = dateStr.trim().match(/^(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!m) return undefined;
  const mon = months[m[1].toLowerCase()];
  if (!mon) return undefined;
  return `${m[3]}-${mon}-${m[2].padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Step 1: Fetch sitemap
    const sitemapRes = await fetch("https://www.zadar.hr/sitemap.xml", {
      headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
    });
    if (!sitemapRes.ok) throw new Error(`sitemap returned ${sitemapRes.status}`);
    const sitemapXml = await sitemapRes.text();

    // Step 2: Extract /en/events/ URLs, exclude ?month=, ?city=, and years < 2025
    const locRegex = /<loc>([^<]+)<\/loc>/gi;
    const eventUrls: string[] = [];
    let m;
    while ((m = locRegex.exec(sitemapXml)) !== null) {
      const url = m[1].trim();
      if (
        url.includes('/en/events/') &&
        !url.includes('?month=') &&
        !url.includes('?city=') &&
        url.match(/\/en\/events\/[^/?]+/)
      ) {
        // Filter out URLs containing years before 2025
        const yearMatch = url.match(/\/(\d{4})\//);
        if (yearMatch && parseInt(yearMatch[1]) < 2025) continue;
        eventUrls.push(url);
      }
    }

    console.log(`Sitemap: found ${eventUrls.length} event URLs`);

    let upserted = 0;
    let errors = 0;
    let skipped = 0;

    // Step 3: Fetch each event page and parse
    for (const eventUrl of eventUrls) {
      try {
        const pageRes = await fetch(eventUrl, {
          headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
        });
        if (!pageRes.ok) {
          console.warn(`Skip ${eventUrl}: HTTP ${pageRes.status}`);
          skipped++;
          continue;
        }
        const html = await pageRes.text();

        // Title: h1 with class b-overview__title
        const titleMatch = html.match(/b-overview__title[^>]*>([\s\S]*?)<\/h1>/i);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
          : null;
        if (!title || title.length < 2) { skipped++; continue; }

        // Location
        const locMatch = html.match(/<span[^>]*class="b-overview__type"[^>]*>Location<\/span>\s*([^<]+)/i);
        const location = locMatch ? locMatch[1].trim() : undefined;

        // Date
        const dateMatch = html.match(/<span[^>]*class="b-overview__type"[^>]*>Date\s*<\/span>\s*([^<]+)/i);
        let eventDateFrom: string | undefined;
        let eventDateTo: string | undefined;
        if (dateMatch) {
          const raw = dateMatch[1].trim();
          // Could be "Aug 23, 2025" or "Aug 23, 2025 - Sep 1, 2025" or "Aug 23 - Sep 1, 2025"
          const rangeParts = raw.split(/\s*[-–]\s*/);
          if (rangeParts.length >= 2) {
            // Try parsing each part
            eventDateFrom = parseEnglishDate(rangeParts[0]);
            eventDateTo = parseEnglishDate(rangeParts[rangeParts.length - 1]);
          }
          if (!eventDateFrom) {
            eventDateFrom = parseEnglishDate(raw);
          }
        }

        // Image: find img with src from datastore inside slider
        const imgMatch = html.match(/src="(https:\/\/www\.zadar\.hr\/datastore\/imagestore\/[^"]+)"[^>]*class="[^"]*image-slider__image/i);
        const imgMatch2 = !imgMatch ? html.match(/src="(\/datastore\/imagestore\/[^"]+)"[^>]*class="[^"]*image-slider__image/i) : null;
        // Also try: class before src
        const imgMatch3 = !imgMatch && !imgMatch2 ? html.match(/class="[^"]*image-slider__image[^"]*"[^>]*src="(https?:\/\/[^"]+)"/i) : null;
        const imgMatch4 = !imgMatch && !imgMatch2 && !imgMatch3 ? html.match(/class="[^"]*image-slider__image[^"]*"[^>]*src="(\/datastore[^"]+)"/i) : null;
        let imageUrl = imgMatch ? imgMatch[1]
          : imgMatch2 ? `https://www.zadar.hr${imgMatch2[1]}`
          : imgMatch3 ? imgMatch3[1]
          : imgMatch4 ? `https://www.zadar.hr${imgMatch4[1]}`
          : undefined;

        // Description from master-article__intro
        const descMatch = html.match(/master-article__intro">([\s\S]*?)<\/div>/i);
        let description: string | undefined;
        if (descMatch) {
          description = descMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .trim()
            .slice(0, 500);
        }
        // Fallback: master-article__innner-wrap
        if (!description || description.length < 10) {
          const descMatch2 = html.match(/master-article__innner-wrap">([\s\S]*?)<\/div>/i);
          if (descMatch2) {
            description = descMatch2[1]
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .trim()
              .slice(0, 500);
          }
        }

        // Category from title/description
        const text = `${title} ${description || ''}`.toLowerCase();
        let category = 'kultura';
        if (/festival/i.test(text)) category = 'festival';
        else if (/sport|run|trail|marathon|race|regat|jump/i.test(text)) category = 'sport';
        else if (/party|club|dj|noćn|night/i.test(text)) category = 'nocni-zivot';

        // Skip events whose end date (or start date) is in the past
        const relevantDate = eventDateTo || eventDateFrom;
        if (relevantDate && relevantDate < today) {
          skipped++;
          continue;
        }

        const hash = simpleHash(`zadar.hr:${eventUrl}`);
        const { error } = await supabase
          .from("city_events")
          .upsert({
            title,
            description: description || null,
            location: location || null,
            venue: location || null,
            event_date_from: eventDateFrom || null,
            event_date_to: eventDateTo || null,
            image_url: imageUrl || null,
            website_url: eventUrl,
            source: 'zadar.hr',
            category,
            region: 'zadar',
            hash,
          }, { onConflict: "hash" });

        if (error) {
          console.error(`Upsert error "${title}":`, error.message);
          errors++;
        } else {
          upserted++;
        }
      } catch (pageErr) {
        console.warn(`Error fetching ${eventUrl}:`, (pageErr as Error).message);
        skipped++;
      }
    }

    const result = {
      success: true,
      source: 'zadar.hr',
      sitemap_urls: eventUrls.length,
      upserted,
      errors,
      skipped,
    };
    console.log("Result:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-zadar-events error:", (e as Error).message);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
