import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zadar wider area bounding box (Nin to Biograd, inland to islands)
const ZADAR_BBOX = '43.90,15.05,44.30,15.55';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const OVERPASS_QUERY = `
[out:json][timeout:30];
(
  node["amenity"="charging_station"](${ZADAR_BBOX});
  way["amenity"="charging_station"](${ZADAR_BBOX});
);
out center;
`;

function parsePlugTypes(tags: Record<string, string>): string[] {
  const plugs: string[] = [];
  const socketKeys = [
    'socket:type2', 'socket:type2_combo', 'socket:chademo',
    'socket:type1', 'socket:type3', 'socket:schuko',
    'socket:ccs', 'socket:tesla_supercharger',
  ];
  for (const key of socketKeys) {
    if (tags[key] && tags[key] !== 'no') {
      plugs.push(key.replace('socket:', '').toUpperCase());
    }
  }
  if (plugs.length === 0 && tags['socket:type2_cable']) {
    plugs.push('TYPE2');
  }
  return plugs.length > 0 ? plugs : ['UNKNOWN'];
}

function parsePowerKw(tags: Record<string, string>): number | null {
  // Try various power tags
  for (const key of ['charging_station:output', 'maxpower', 'power_output']) {
    if (tags[key]) {
      const match = tags[key].match(/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
  }
  return null;
}

function parseCapacity(tags: Record<string, string>): number {
  if (tags['capacity']) {
    const n = parseInt(tags['capacity'], 10);
    if (!isNaN(n)) return n;
  }
  return 1;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch from Overpass
    console.log('Fetching chargers from Overpass API...');
    const overpassRes = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!overpassRes.ok) {
      throw new Error(`Overpass API error: ${overpassRes.status}`);
    }

    const data = await overpassRes.json();
    const elements = data.elements || [];
    console.log(`Found ${elements.length} charging stations from OSM`);

    // Load existing chargers
    const { data: existing } = await supabase
      .from('ev_chargers')
      .select('id, lat, lng, osm_id');
    const existingList = existing || [];

    let inserted = 0;
    let updated = 0;

    for (const el of elements) {
      const lat = el.lat || el.center?.lat;
      const lng = el.lon || el.center?.lon;
      if (!lat || !lng) continue;

      const tags = el.tags || {};
      const osmId = `${el.type}/${el.id}`;
      const name = tags.name || tags.operator || tags.brand || 'EV punjač';
      const operator = tags.operator || tags.brand || null;
      const plugTypes = parsePlugTypes(tags);
      const powerKw = parsePowerKw(tags);
      const plugCount = parseCapacity(tags);
      const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(' ') || null;

      // Check if exists by osm_id or proximity (20m)
      const existingByOsm = existingList.find(e => e.osm_id === osmId);
      const existingByProximity = !existingByOsm
        ? existingList.find(e => haversineDistance(lat, lng, e.lat, e.lng) < 20)
        : null;

      const record = {
        name,
        operator,
        lat,
        lng,
        address,
        plug_types: plugTypes,
        power_kw: powerKw,
        plug_count: plugCount,
        source: 'osm',
        osm_id: osmId,
      };

      if (existingByOsm) {
        await supabase.from('ev_chargers').update(record).eq('id', existingByOsm.id);
        updated++;
      } else if (existingByProximity) {
        await supabase.from('ev_chargers').update({ ...record, osm_id: osmId }).eq('id', existingByProximity.id);
        updated++;
      } else {
        await supabase.from('ev_chargers').insert(record);
        inserted++;
      }
    }

    console.log(`Import complete: ${inserted} inserted, ${updated} updated`);

    return new Response(JSON.stringify({ ok: true, inserted, updated, total: elements.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
