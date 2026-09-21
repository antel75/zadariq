import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOURCE = "radne-nedjelje.com";
const SOURCE_URL = "https://radne-nedjelje.com/?location=zadar";
const STATUS_ID = "sunday-shops-zadar";

type Parsed = {
  brand: string;
  address: string;
  open_time: string | null;
  close_time: string | null;
  category: string | null;
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parsePage(html: string): Parsed[] {
  const blocks = html.split("<details").slice(1);
  const out: Parsed[] = [];
  for (const b of blocks) {
    const name = b.match(/font-extrabold text-foreground truncate block">([^<]*)</);
    const addr = b.match(/location_on<\/span>[\s\S]*?truncate">([^<]*)</);
    const hours = b.match(/schedule<\/span><span class="font-semibold text-foreground\/90">([^<]*)</);
    const cat = b.match(/uppercase tracking-widest">([^<]*)</);
    if (!name || !addr) continue;

    let open: string | null = null;
    let close: string | null = null;
    if (hours) {
      const m = decode(hours[1]).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
      if (m) {
        open = `${m[1].padStart(2, "0")}:${m[2]}`;
        close = `${m[3].padStart(2, "0")}:${m[4]}`;
      }
    }

    out.push({
      brand: decode(name[1]),
      address: decode(addr[1]),
      open_time: open,
      close_time: close,
      category: cat ? decode(cat[1]) : null,
    });
  }
  return out;
}

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

const STREET_NOISE = [
  "ulica", "ul.", "ul", "put", "cesta", "obala", "trg", "odvojak",
  "zadar", "hrvatska", "bb",
];

function normAddress(raw: string): string {
  let s = stripDiacritics(raw.toLowerCase());
  s = s.replace(/\b\d{5}\b/g, " ");
  s = s.replace(/[.,/\\-]/g, " ");
  const tokens = s.split(/\s+/).filter((t) => t && !STREET_NOISE.includes(t));
  return tokens.join(" ").trim();
}

/** Core identity of an address: last surname-ish word + first house number */
function addressKey(raw: string): string {
  const n = normAddress(raw);
  const num = n.match(/\d+[a-z]?/);
  const words = n.split(" ").filter((w) => !/\d/.test(w) && w.length > 2);
  const last = words.length ? words[words.length - 1] : "";
  return `${last}|${num ? num[0] : ""}`;
}

function zagrebNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Zagreb" }));
}

function upcomingSunday(): string {
  const d = zagrebNow();
  const day = d.getDay(); // 0 = Sunday
  const add = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + add);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${address}, Hrvatska`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=hr&q=${q}`,
      { headers: { "User-Agent": "ZadarIQ/1.0 (sunday-radar)", "Accept-Language": "hr" } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
  } catch (_e) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sundayDate = upcomingSunday();
  const fetchedAt = new Date().toISOString();
  let parsedCount = 0;
  let matched = 0;
  let created = 0;
  let skipped = 0;

  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZadarIQ/1.0)",
        "Accept": "text/html",
        "Accept-Language": "hr",
      },
    });
    if (!res.ok) throw new Error(`Source returned ${res.status}`);

    const html = await res.text();
    const parsed = parsePage(html);
    parsedCount = parsed.length;
    if (parsedCount === 0) throw new Error("No shops parsed — page layout may have changed");

    // Existing approved shops in the community place index
    const { data: places } = await supabase
      .from("pending_places")
      .select("id, proposed_name, proposed_address")
      .eq("status", "approved")
      .limit(2000);

    const index = new Map<string, string>(); // addressKey -> place id
    for (const p of places || []) {
      if (!p.proposed_address) continue;
      const key = addressKey(p.proposed_address);
      if (key !== "|" && !index.has(key)) index.set(key, p.id as string);
    }

    const rows: Record<string, unknown>[] = [];

    for (const shop of parsed) {
      // Unknown opening hours on the source → do not publish a guess
      if (!shop.open_time || !shop.close_time) {
        skipped++;
        continue;
      }

      const key = addressKey(shop.address);
      let placeId = index.get(key);

      if (!placeId) {
        const coords = await geocode(shop.address);
        const { data: inserted, error: insErr } = await supabase
          .from("pending_places")
          .insert({
            proposed_name: shop.brand,
            proposed_address: shop.address,
            category: "shops",
            status: "approved",
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
            fingerprint_hash: "auto-sunday-scraper",
            notes: `Automatski dodano iz ${SOURCE}`,
          })
          .select("id")
          .single();
        if (insErr || !inserted) {
          console.error("Failed to create place", shop.address, insErr);
          skipped++;
          continue;
        }
        placeId = inserted.id as string;
        index.set(key, placeId);
        created++;
        // Be polite to the geocoder
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        matched++;
      }

      rows.push({
        business_id: `ap_${placeId}`,
        sunday_date: sundayDate,
        open_time: `${shop.open_time}:00`,
        close_time: `${shop.close_time}:00`,
        notes: `${shop.brand} — ${shop.address}`,
        source: SOURCE,
        source_url: SOURCE_URL,
        fetched_at: fetchedAt,
        updated_at: fetchedAt,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from("shop_sunday_schedule")
        .upsert(rows, { onConflict: "business_id,sunday_date" });
      if (error) throw error;
    }

    // Remove stale auto-scraped rows for this Sunday that are no longer listed.
    // Manually entered rows (source = 'manual') are never touched.
    const keep = rows.map((r) => r.business_id as string);
    const del = supabase
      .from("shop_sunday_schedule")
      .delete()
      .eq("sunday_date", sundayDate)
      .eq("source", SOURCE);
    if (keep.length > 0) {
      await del.not("business_id", "in", `(${keep.map((k) => `"${k}"`).join(",")})`);
    } else {
      await del;
    }

    await supabase.from("sunday_scrape_status").upsert({
      id: STATUS_ID,
      last_run_at: fetchedAt,
      ok: true,
      message: null,
      sunday_date: sundayDate,
      source_url: SOURCE_URL,
      parsed_count: parsedCount,
      matched_count: matched,
      created_count: created,
      skipped_count: skipped,
      consecutive_failures: 0,
      updated_at: fetchedAt,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sunday_date: sundayDate,
        parsed: parsedCount,
        matched,
        created,
        skipped,
        saved: rows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    console.error("scrape-sunday-shops failed:", message);

    const { data: prev } = await supabase
      .from("sunday_scrape_status")
      .select("consecutive_failures")
      .eq("id", STATUS_ID)
      .maybeSingle();

    await supabase.from("sunday_scrape_status").upsert({
      id: STATUS_ID,
      last_run_at: fetchedAt,
      ok: false,
      message,
      sunday_date: sundayDate,
      source_url: SOURCE_URL,
      parsed_count: parsedCount,
      matched_count: matched,
      created_count: created,
      skipped_count: skipped,
      consecutive_failures: ((prev?.consecutive_failures as number) ?? 0) + 1,
      updated_at: fetchedAt,
    });

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
