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

    // Scrape today and the next 6 days
    const today = new Date();
    const allOutages: OutageEntry[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = formatDateForHep(date);
      const isoDate = formatDateISO(date);

      console.log(`Fetching HEP data for ${dateStr}...`);

      const url = `https://www.hep.hr/ods/bez-struje/19?dp=zadar&el=ZD&datum=${dateStr}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZadarIQ/1.0)',
          'Accept': 'text/html',
          'Accept-Language': 'hr',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch HEP page for ${dateStr}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      const outages = parseOutages(html, isoDate);
      allOutages.push(...outages);
    }

    console.log(`Found ${allOutages.length} total outage entries`);

    // Clear existing data for the date range we just scraped
    const todayISO = formatDateISO(today);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6);
    const endISO = formatDateISO(endDate);

    await supabase
      .from('power_outages')
      .delete()
      .gte('outage_date', todayISO)
      .lte('outage_date', endISO);

    // Insert new data
    if (allOutages.length > 0) {
      const { error } = await supabase
        .from('power_outages')
        .insert(allOutages.map(o => ({
          outage_date: o.date,
          area: o.area,
          time_from: o.timeFrom,
          time_until: o.timeUntil,
          reason: o.reason,
          raw_text: o.rawText,
        })));

      if (error) {
        console.error('Error inserting outages:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ success: true, outages: allOutages.length }),
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

interface OutageEntry {
  date: string;
  area: string;
  timeFrom: string | null;
  timeUntil: string | null;
  reason: string | null;
  rawText: string;
}

function parseOutages(html: string, date: string): OutageEntry[] {
  const outages: OutageEntry[] = [];

  // Find the radwrap div content
  const radwrapMatch = html.match(/<div class="radwrap">([\s\S]*?)<\/div>\s*(?:<div class="clear">|$)/);
  if (!radwrapMatch) return outages;

  const content = radwrapMatch[1].trim();

  // Check if there are no outages
  if (content.includes('Nema planiranih prekida napajanja')) {
    return outages;
  }

  // Parse individual outage blocks
  // HEP format: each outage is typically in a div with class "rad" or similar structure
  // containing area name, time range, and optional reason
  
  // Try parsing structured blocks (div.rad)
  const radBlocks = content.split(/<div class="rad">/);
  
  if (radBlocks.length > 1) {
    for (let i = 1; i < radBlocks.length; i++) {
      const block = radBlocks[i];
      const entry = parseRadBlock(block, date);
      if (entry) outages.push(entry);
    }
  } else {
    // Fallback: parse as raw text blocks separated by <hr> or <br>
    const textBlocks = content
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (textBlocks.length > 0) {
      // Try to extract structured info from text
      let currentArea = '';
      let currentTime = '';
      
      for (const line of textBlocks) {
        // Check for time pattern like "08:00 - 14:00" or "od 08:00 do 14:00"
        const timeMatch = line.match(/(\d{1,2}[:.]\d{2})\s*[-–do]+\s*(\d{1,2}[:.]\d{2})/);
        if (timeMatch) {
          currentTime = line;
          continue;
        }
        
        // If it's a substantial text line, treat as area/description
        if (line.length > 3 && !line.match(/^\d+$/)) {
          currentArea = line;
          
          const timeInfo = extractTimeFromText(currentTime || line);
          outages.push({
            date,
            area: cleanText(currentArea),
            timeFrom: timeInfo.from,
            timeUntil: timeInfo.until,
            reason: null,
            rawText: cleanText(line + (currentTime ? ' ' + currentTime : '')),
          });
          currentTime = '';
        }
      }

      // If no structured parsing worked, save the whole block as one entry
      if (outages.length === 0 && textBlocks.join(' ').trim().length > 0) {
        const fullText = textBlocks.join(' ').trim();
        const timeInfo = extractTimeFromText(fullText);
        outages.push({
          date,
          area: cleanText(fullText.substring(0, 200)),
          timeFrom: timeInfo.from,
          timeUntil: timeInfo.until,
          reason: null,
          rawText: cleanText(fullText),
        });
      }
    }
  }

  return outages;
}

function parseRadBlock(block: string, date: string): OutageEntry | null {
  // Extract area/location
  const areaMatch = block.match(/<strong>([^<]+)<\/strong>/) ||
                    block.match(/<b>([^<]+)<\/b>/) ||
                    block.match(/<h[45][^>]*>([^<]+)<\/h[45]>/);
  
  // Extract time
  const timeMatch = block.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
  
  // Extract reason
  const reasonMatch = block.match(/Razlog:\s*([^<]+)/i) || block.match(/razlog[^:]*:\s*([^<]+)/i);
  
  // Get clean text
  const cleanBlock = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (cleanBlock.length < 3) return null;

  return {
    date,
    area: areaMatch ? cleanText(areaMatch[1]) : cleanText(cleanBlock.substring(0, 200)),
    timeFrom: timeMatch ? timeMatch[1].replace('.', ':') : null,
    timeUntil: timeMatch ? timeMatch[2].replace('.', ':') : null,
    reason: reasonMatch ? cleanText(reasonMatch[1]) : null,
    rawText: cleanText(cleanBlock),
  };
}

function extractTimeFromText(text: string): { from: string | null; until: string | null } {
  const match = text.match(/(\d{1,2}[:.]\d{2})\s*[-–do]+\s*(\d{1,2}[:.]\d{2})/);
  if (match) {
    return {
      from: match[1].replace('.', ':'),
      until: match[2].replace('.', ':'),
    };
  }
  return { from: null, until: null };
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateForHep(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateISO(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}
