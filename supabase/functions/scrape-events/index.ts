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
  event_date?: string;
  event_time?: string;
  location?: string;
  source: string;
  source_url?: string;
  image_url?: string;
}

// ── zadar.hr ──
// Cards are <a class="c-postcard ..." href="URL"> blocks
// Inside: h1.c-postcard__title, span.c-postcard__info-item-value (location, date), img
async function scrapeZadarHr(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  try {
    const res = await fetch("https://www.zadar.hr/hr/dogadanja", {
      headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
    });
    if (!res.ok) { console.error(`zadar.hr: ${res.status}`); return events; }
    const html = await res.text();

    // Split HTML into card chunks by finding each c-postcard anchor
    const cards: { href: string; content: string }[] = [];
    const startRegex = /<a\s[^>]*class="c-postcard[^"]*"[^>]*href="([^"]*)"[^>]*>/gi;
    const starts: { idx: number; href: string }[] = [];
    let m;
    while ((m = startRegex.exec(html)) !== null) {
      starts.push({ idx: m.index, href: m[1] });
    }
    for (let i = 0; i < starts.length; i++) {
      const end = i + 1 < starts.length ? starts[i + 1].idx : html.length;
      cards.push({ href: starts[i].href, content: html.slice(starts[i].idx, end) });
    }

    for (const card of cards) {
      // Title from h1
      const titleMatch = card.content.match(/c-postcard__title[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').trim() : null;
      if (!title || title.length < 3) continue;

      // Info values
      const infoValues: string[] = [];
      const infoRegex = /c-postcard__info-item-value">([^<]+)<\/span>/gi;
      let im;
      while ((im = infoRegex.exec(card.content)) !== null) {
        const v = im[1].trim();
        if (v && !infoValues.includes(v)) infoValues.push(v);
      }
      const location = infoValues[0] || undefined;
      const dateStr = infoValues[1] || undefined;

      let eventDate: string | undefined;
      if (dateStr) {
        const dm = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (dm) eventDate = `${dm[3]}-${dm[2]}-${dm[1]}`;
      }

      // Image
      const imgMatch = card.content.match(/src="(https:\/\/www\.zadar\.hr\/datastore[^"]+)"/i);
      const imageUrl = imgMatch ? imgMatch[1] : undefined;

      // Description
      const descMatch = card.content.match(/c-postcard__article-intro">([\s\S]*?)<\/div>/i);
      const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 300) : undefined;

      const sourceUrl = card.href.startsWith('http') ? card.href : `https://www.zadar.hr${card.href}`;

      events.push({
        title,
        description: description || undefined,
        event_date: eventDate,
        location,
        source: 'zadar.hr',
        source_url: sourceUrl,
        image_url: imageUrl,
      });
    }

    console.log(`zadar.hr: found ${events.length} events`);
  } catch (e) {
    console.error("zadar.hr error:", (e as Error).message);
  }
  return events;
}

// ── papaya.com.hr ──
// Structure: .dateEventBlock.blockLinked[data-href] containing:
//   .dNo → day number
//   .nightTicket → event title
//   Current month from .mnthCurrent span
async function scrapePapaya(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  try {
    const now = new Date();
    // Scrape current + next 3 months
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const url = `https://papaya.com.hr/events/${year}/${String(month).padStart(2, '0')}`;

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
        });
        if (!res.ok) continue;
        const html = await res.text();

        // Find blocks with data-href using index-based splitting
        const blocks: { href: string; content: string }[] = [];
        const startRe = /dateEventBlock[^"]*blockLinked"\s*data-href="([^"]+)"/gi;
        const blockStarts: { idx: number; href: string }[] = [];
        let bm;
        while ((bm = startRe.exec(html)) !== null) {
          blockStarts.push({ idx: bm.index, href: bm[1] });
        }
        for (let j = 0; j < blockStarts.length; j++) {
          const end = j + 1 < blockStarts.length ? blockStarts[j + 1].idx : blockStarts[j].idx + 2000;
          blocks.push({ href: blockStarts[j].href, content: html.slice(blockStarts[j].idx, Math.min(end, html.length)) });
        }

        for (const block of blocks) {
          // Day
          const dayMatch = block.content.match(/dNo">(\d{1,2})<\/span>/);
          const day = dayMatch ? dayMatch[1].padStart(2, '0') : null;

          // Title from nightTicket
          const titleMatch = block.content.match(/nightTicket">([^<]+)<\/span>/);
          const title = titleMatch ? titleMatch[1].trim() : null;
          if (!title || title.length < 3) continue;

          // Image
          const imgMatch = block.content.match(/src="([^"]*(?:\.jpg|\.png|\.webp)[^"]*)"/i);
          const imageUrl = imgMatch ? (imgMatch[1].startsWith('http') ? imgMatch[1] : `https://papaya.com.hr${imgMatch[1]}`) : undefined;

          const eventDate = day ? `${year}-${String(month).padStart(2, '0')}-${day}` : undefined;

          events.push({
            title,
            event_date: eventDate,
            location: 'Papaya Club, Zrće, Novalja',
            source: 'papaya.com.hr',
            source_url: `https://papaya.com.hr${block.href}`,
            image_url: imageUrl,
          });
        }
      } catch (e) {
        console.error(`papaya ${year}/${month} error:`, (e as Error).message);
      }
    }
    console.log(`papaya.com.hr: found ${events.length} events`);
  } catch (e) {
    console.error("papaya error:", (e as Error).message);
  }
  return events;
}

// ── thegardenproductions.com ──
// Structure: .one-event.w-dyn-item containing:
//   .event-start-date-in-list → "27/6/2026"
//   .event-type → "Club night" / "Festival"
//   .venue-name → "Barbarellas Discotheque"
//   h2.event-headline → title
//   a.event-link[href] → link
async function scrapeGarden(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  try {
    const res = await fetch("https://thegardenproductions.com/events", {
      headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
    });
    if (!res.ok) { console.error(`garden: ${res.status}`); return events; }
    const html = await res.text();

    const eventRegex = /one-event\s+w-dyn-item">([\s\S]*?)(?=<div[^>]*class="[^"]*one-event|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/body>)/gi;
    let match;
    while ((match = eventRegex.exec(html)) !== null) {
      const block = match[1];

      // Date
      const dateMatch = block.match(/event-start-date-in-list">([^<]+)</);
      let eventDate: string | undefined;
      if (dateMatch) {
        const parts = dateMatch[1].trim().split('/');
        if (parts.length === 3) {
          eventDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      // Type
      const typeMatch = block.match(/event-type">([^<]+)</);
      const eventType = typeMatch ? typeMatch[1].trim() : undefined;

      // Venue
      const venueMatch = block.match(/venue-name[^>]*>([^<]+)</);
      const venue = venueMatch ? venueMatch[1].trim() : undefined;

      // Title
      const titleMatch = block.match(/event-headline[^>]*>([^<]+)</);
      const title = titleMatch ? titleMatch[1].trim() : null;
      if (!title || title.length < 2) continue;

      // Link
      const linkMatch = block.match(/event-link[^>]*href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : undefined;
      const fullLink = link ? (link.startsWith('http') ? link : `https://www.thegardenproductions.com${link}`) : undefined;

      events.push({
        title,
        description: eventType ? `${eventType}${venue ? ` @ ${venue}` : ''}` : undefined,
        event_date: eventDate,
        location: venue || 'The Garden, Petrčane',
        source: 'thegardenproductions.com',
        source_url: fullLink,
      });
    }

    console.log(`thegardenproductions.com: found ${events.length} events`);
  } catch (e) {
    console.error("garden error:", (e as Error).message);
  }
  return events;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [zadarEvents, papayaEvents, gardenEvents] = await Promise.all([
      scrapeZadarHr(),
      scrapePapaya(),
      scrapeGarden(),
    ]);

    const allEvents = [...zadarEvents, ...papayaEvents, ...gardenEvents];
    console.log(`Total scraped: ${allEvents.length} events`);

    let upserted = 0;
    let errors = 0;

    for (const ev of allEvents) {
      const hash = simpleHash(`${ev.source}:${ev.title}:${ev.event_date || ''}`);
      const { error } = await supabase
        .from("city_events")
        .upsert({
          title: ev.title,
          description: ev.description || null,
          event_date: ev.event_date || null,
          event_time: ev.event_time || null,
          location: ev.location || null,
          source: ev.source,
          source_url: ev.source_url || null,
          image_url: ev.image_url || null,
          hash,
        }, { onConflict: "hash" });

      if (error) {
        console.error(`Upsert error "${ev.title}":`, error.message);
        errors++;
      } else {
        upserted++;
      }
    }

    const result = {
      success: true,
      total_scraped: allEvents.length,
      upserted,
      errors,
      sources: {
        'zadar.hr': zadarEvents.length,
        'papaya.com.hr': papayaEvents.length,
        'thegardenproductions.com': gardenEvents.length,
      },
    };
    console.log("Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-events error:", (e as Error).message);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
