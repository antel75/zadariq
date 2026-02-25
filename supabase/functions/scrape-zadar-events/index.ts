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
  location?: string;
  venue?: string;
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

    const res = await fetch("https://www.zadar.hr/hr/dogadanja", {
      headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
    });
    if (!res.ok) throw new Error(`zadar.hr returned ${res.status}`);
    const html = await res.text();

    // Split HTML into c-postcard card chunks
    const startRegex = /<a\s[^>]*class="c-postcard[^"]*"[^>]*href="([^"]*)"[^>]*>/gi;
    const starts: { idx: number; href: string }[] = [];
    let m;
    while ((m = startRegex.exec(html)) !== null) {
      starts.push({ idx: m.index, href: m[1] });
    }

    for (let i = 0; i < starts.length; i++) {
      const end = i + 1 < starts.length ? starts[i + 1].idx : html.length;
      const card = html.slice(starts[i].idx, end);
      const href = starts[i].href;

      // Title
      const titleMatch = card.match(/c-postcard__title[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').trim() : null;
      if (!title || title.length < 3) continue;

      // Info values: location, date
      const infoValues: string[] = [];
      const infoRegex = /c-postcard__info-item-value">([^<]+)<\/span>/gi;
      let im;
      while ((im = infoRegex.exec(card)) !== null) {
        const v = im[1].trim();
        if (v && !infoValues.includes(v)) infoValues.push(v);
      }
      const location = infoValues[0] || undefined;
      const dateStr = infoValues[1] || undefined;

      let eventDateFrom: string | undefined;
      if (dateStr) {
        // Format: DD-MM-YYYY or DD-MM-YYYY - DD-MM-YYYY
        const parts = dateStr.split(/\s*-\s*/);
        if (parts.length >= 3) {
          // Single date DD-MM-YYYY
          const dm = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
          if (dm) eventDateFrom = `${dm[3]}-${dm[2]}-${dm[1]}`;
        }
      }

      // Image
      const imgMatch = card.match(/src="(https:\/\/www\.zadar\.hr\/datastore[^"]+)"/i);
      const imageUrl = imgMatch ? imgMatch[1] : undefined;

      // Description
      const descMatch = card.match(/c-postcard__article-intro">([\s\S]*?)<\/div>/i);
      const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 500) : undefined;

      const sourceUrl = href.startsWith('http') ? href : `https://www.zadar.hr${href}`;

      // Try to determine category from title/description
      const text = `${title} ${description || ''}`.toLowerCase();
      let category = 'kultura';
      if (/festival/i.test(text)) category = 'festival';
      else if (/sport|utrk|maraton|regat/i.test(text)) category = 'sport';
      else if (/party|club|dj|noćn/i.test(text)) category = 'nocni-zivot';

      events.push({
        title,
        description: description || undefined,
        location,
        venue: location,
        event_date_from: eventDateFrom,
        image_url: imageUrl,
        website_url: sourceUrl,
        category,
      });
    }

    console.log(`zadar.hr: found ${events.length} events`);

    let upserted = 0;
    let errors = 0;

    for (const ev of events) {
      const hash = simpleHash(`zadar.hr:${ev.title}:${ev.event_date_from || ''}`);
      const { error } = await supabase
        .from("city_events")
        .upsert({
          title: ev.title,
          description: ev.description || null,
          location: ev.location || null,
          venue: ev.venue || null,
          event_date_from: ev.event_date_from || null,
          event_date_to: ev.event_date_to || null,
          image_url: ev.image_url || null,
          website_url: ev.website_url || null,
          source: 'zadar.hr',
          category: ev.category,
          region: 'zadar',
          hash,
        }, { onConflict: "hash" });

      if (error) { console.error(`Upsert error "${ev.title}":`, error.message); errors++; }
      else upserted++;
    }

    const result = { success: true, source: 'zadar.hr', total_scraped: events.length, upserted, errors };
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
