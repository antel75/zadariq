import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching Vodovod Zadar obavijesti...');
    const response = await fetch('https://www.vodovod-zadar.hr/obavijesti', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZadarIQ/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'hr',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const notices = parseNotices(html);
    console.log(`Found ${notices.length} notices`);

    // Keep only notices relevant to today or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relevantNotices = notices.filter(n => {
      if (n.outageDate) {
        return new Date(n.outageDate) >= today;
      }
      // If no specific outage date extracted, keep if published recently (last 3 days)
      const pubDate = new Date(n.publishedDate);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return pubDate >= threeDaysAgo;
    });

    console.log(`${relevantNotices.length} relevant notices`);

    // Clear existing and insert fresh
    await supabase.from('water_outages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (relevantNotices.length > 0) {
      const rows = relevantNotices.map(n => ({
        published_date: n.publishedDate,
        outage_date: n.outageDate,
        area: n.area,
        time_from: n.timeFrom,
        time_until: n.timeUntil,
        raw_text: n.rawText,
      }));

      const { error } = await supabase.from('water_outages').insert(rows);
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: notices.length, relevant: relevantNotices.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface Notice {
  publishedDate: string;
  outageDate: string | null;
  area: string;
  timeFrom: string | null;
  timeUntil: string | null;
  rawText: string;
}

function parseNotices(html: string): Notice[] {
  const notices: Notice[] = [];

  // Split by news-news-list blocks
  const blocks = html.split('news-news-list');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // Extract published date from <time datetime=\"YYYY-MM-DD\">
    const timeMatch = block.match(/<time datetime=\"(\d{4}-\d{2}-\d{2})\">/);
    if (!timeMatch) continue;
    const publishedDate = timeMatch[1];

    // Extract text content from <p> tags
    const paragraphs: string[] = [];
    const pRegex = /<p>([\s\S]*?)<\/p>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(block)) !== null) {
      const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (text.length > 0) paragraphs.push(text);
    }

    if (paragraphs.length === 0) continue;

    const fullText = paragraphs.join(' ').replace(/\s+/g, ' ').trim();

    // Extract the actual outage date from text (e.g., "dana 17.02.2026.")
    const outageDateMatch = fullText.match(/dana\s+(\d{1,2})\.(\d{2})\.(\d{4})/);
    let outageDate: string | null = null;
    if (outageDateMatch) {
      const day = outageDateMatch[1].padStart(2, '0');
      const month = outageDateMatch[2];
      const year = outageDateMatch[3];
      outageDate = `${year}-${month}-${day}`;
    }

    // Extract time range (e.g., "od 11:00 h do 14:00 h" or "od 08:00 do 15:00")
    const timeRangeMatch = fullText.match(/(?:od\s+)?(\d{1,2}[:.]\d{2})\s*h?\s*do\s+(\d{1,2}[:.]\d{2})\s*h?/i);
    const timeFrom = timeRangeMatch ? timeRangeMatch[1].replace('.', ':') : null;
    const timeUntil = timeRangeMatch ? timeRangeMatch[2].replace('.', ':') : null;

    // Extract area - look for street names or area descriptions
    let area = extractArea(fullText);

    notices.push({
      publishedDate,
      outageDate,
      area,
      timeFrom,
      timeUntil,
      rawText: fullText.substring(0, 500),
    });
  }

  return notices;
}

function extractArea(text: string): string {
  // Try to find area after common patterns
  // "u mjestu X" or "u gradu Zadru, predio X" or "u slijedećim ulicama:"
  const areaPatterns = [
    /u mjestu\s+([^,\.]+)/i,
    /predio\s+([^,\.]+)/i,
    /području\s+([^,\.]+)/i,
    /u gradu\s+([^,\.]+)/i,
  ];

  for (const pattern of areaPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  // Fallback: first 80 chars of text
  return text.substring(0, 80);
}
