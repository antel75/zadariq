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

interface ScrapedEvent {
  title: string;
  description?: string;
  event_date_from?: string;
  event_date_to?: string;
  image_url?: string;
  website_url?: string;
  category: string;
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

    const events: ScrapedEvent[] = [];

    const res = await fetch("https://zrce.eu/en/eventcalendar", {
      headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
    });
    if (!res.ok) throw new Error(`zrce.eu returned ${res.status}`);
    const html = await res.text();

    // Structure: div.custom-card containing:
    //   a.custom-card__link[href] → link
    //   h2.zrcefett300 → title
    //   p[id="DD.MM.YYYY"] → "DD.MM.YYYY – DD.MM.YYYY" date range
    //   img[src] or img[data-src] → image
    //   div.zrcefett1503 → description/lineup

    const cardRegex = /<div class="custom-card">([\s\S]*?)(?=<div class="custom-card">|<\/div>\s*<\/div>\s*<div id="event-calendar-view"|$)/gi;
    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const block = match[1];

      // Link
      const linkMatch = block.match(/custom-card__link"\s*[^>]*href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : undefined;

      // Title
      const titleMatch = block.match(/zrcefett300[^>]*>([^<]+)<\/h2>/);
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : null;
      if (!title || title.length < 3) continue;

      // Date range: "DD.MM.YYYY – DD.MM.YYYY" or "DD.MM.YYYY"
      const dateMatch = block.match(/<p\s+id="[\d.]+[^"]*"[^>]*>([^<]+)<\/p>/);
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      if (dateMatch) {
        const dateText = dateMatch[1].trim();
        // Split by – or -
        const dateParts = dateText.split(/\s*[–-]\s*/);
        const parseDate = (d: string): string | undefined => {
          const m = d.trim().match(/(\d{2})\.(\d{2})\.(\d{4})/);
          return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
        };
        dateFrom = parseDate(dateParts[0]);
        if (dateParts.length > 1) dateTo = parseDate(dateParts[dateParts.length - 1]);
      }

      // Image
      const imgMatch = block.match(/(?:data-src|src)="(https:\/\/zrce\.eu\/wp-content\/[^"]+)"/);
      const imageUrl = imgMatch ? imgMatch[1] : undefined;

      // Description from zrcefett1503
      const descMatch = block.match(/zrcefett1503">([\s\S]*?)<\/div>/);
      const description = descMatch
        ? descMatch[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/⭐/g, '').trim().slice(0, 500)
        : undefined;

      // Determine category: most Zrce events are festivals or nightlife
      const text = `${title} ${description || ''}`.toLowerCase();
      let category = 'nocni-zivot';
      if (/festival|fest\b/i.test(text)) category = 'festival';

      events.push({
        title,
        description: description && description.length > 2 ? description : undefined,
        event_date_from: dateFrom,
        event_date_to: dateTo,
        image_url: imageUrl,
        website_url: link,
        category,
      });
    }

    console.log(`zrce.eu: found ${events.length} events`);

    let upserted = 0;
    let errors = 0;

    for (const ev of events) {
      const hash = simpleHash(`zrce.eu:${ev.title}:${ev.event_date_from || ''}`);
      const { error } = await supabase
        .from("city_events")
        .upsert({
          title: ev.title,
          description: ev.description || null,
          location: 'Zrće Beach, Novalja',
          venue: null,
          event_date_from: ev.event_date_from || null,
          event_date_to: ev.event_date_to || null,
          image_url: ev.image_url || null,
          website_url: ev.website_url || null,
          source: 'zrce.eu',
          category: ev.category,
          region: 'zrce',
          hash,
        }, { onConflict: "hash" });

      if (error) { console.error(`Upsert error "${ev.title}":`, error.message); errors++; }
      else upserted++;
    }

    const result = { success: true, source: 'zrce.eu', total_scraped: events.length, upserted, errors };
    console.log("Result:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-zrce-events error:", (e as Error).message);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
