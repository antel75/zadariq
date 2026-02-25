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
  venue?: string;
  event_date_from?: string;
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

    const res = await fetch("https://thegardenproductions.com/events", {
      headers: { "User-Agent": "ZadarIQ/1.0 (event-aggregator)" },
    });
    if (!res.ok) throw new Error(`thegardenproductions.com returned ${res.status}`);
    const html = await res.text();

    // Structure: .one-event.w-dyn-item containing:
    //   .event-start-date-in-list → "27/6/2026"
    //   .event-type → "Club night" / "Festival"
    //   .venue-name → "Barbarellas Discotheque"
    //   h2.event-headline → title
    //   a.event-link[href] → link
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

      // Category based on event type
      let category = 'nocni-zivot';
      if (eventType) {
        const t = eventType.toLowerCase();
        if (/festival/i.test(t)) category = 'festival';
        else if (/club|night|party/i.test(t)) category = 'nocni-zivot';
      }

      // Determine region: Tisno venues → tisno, otherwise zadar area
      const venueL = (venue || '').toLowerCase();
      let region = 'tisno'; // Garden events are mostly in Tisno
      if (/zadar|petrčane/i.test(venueL)) region = 'zadar';

      events.push({
        title,
        description: eventType ? `${eventType}${venue ? ` @ ${venue}` : ''}` : undefined,
        venue,
        event_date_from: eventDate,
        website_url: fullLink,
        category,
      });
    }

    console.log(`thegardenproductions.com: found ${events.length} events`);

    let upserted = 0;
    let errors = 0;

    for (const ev of events) {
      const hash = simpleHash(`garden:${ev.title}:${ev.event_date_from || ''}`);
      
      // Determine region per event
      const venueL = (ev.venue || '').toLowerCase();
      let region = 'tisno';
      if (/zadar|petrčane/i.test(venueL)) region = 'zadar';

      const { error } = await supabase
        .from("city_events")
        .upsert({
          title: ev.title,
          description: ev.description || null,
          location: ev.venue || 'The Garden, Tisno',
          venue: ev.venue || null,
          event_date_from: ev.event_date_from || null,
          event_date_to: null,
          image_url: null,
          website_url: ev.website_url || null,
          source: 'thegardenproductions.com',
          category: ev.category,
          region,
          hash,
        }, { onConflict: "hash" });

      if (error) { console.error(`Upsert error "${ev.title}":`, error.message); errors++; }
      else upserted++;
    }

    const result = { success: true, source: 'thegardenproductions.com', total_scraped: events.length, upserted, errors };
    console.log("Result:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-garden-events error:", (e as Error).message);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
