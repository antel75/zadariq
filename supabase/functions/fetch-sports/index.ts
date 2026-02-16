import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://v3.football.api-sports.io";

// Teams we track — names used for API search
const TRACKED_TEAMS = [
  { searchName: "NK Zadar", tag: "nk_zadar", isLocal: true },
  { searchName: "Hajduk Split", tag: "hajduk", isLocal: false },
  { searchName: "Croatia", tag: "croatia_football", isLocal: false },
];

// ── Status mapping (exhaustive) ──────────────────────────
function mapStatus(short: string): string {
  const live = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]);
  const finished = new Set(["FT", "AET", "PEN"]);
  const upcoming = new Set(["NS", "TBD"]);
  const postponed = new Set(["PST", "CANC", "ABD", "AWD", "WO", "INT", "SUSP"]);

  if (live.has(short)) return "live";
  if (finished.has(short)) return "finished";
  if (upcoming.has(short)) return "upcoming";
  if (postponed.has(short)) return "postponed";
  return "upcoming"; // safe fallback, never undefined
}

// ── Retry wrapper ────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = 1,
  delayMs = 2000
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, { headers });
      if (resp.ok) return resp;
      if (i < retries) {
        console.warn(`Retry ${i + 1} for ${url} (status: ${resp.status})`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return resp;
      }
    } catch (e) {
      if (i < retries) {
        console.warn(`Retry ${i + 1} for ${url}:`, e);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw e;
      }
    }
  }
  throw new Error("Unreachable");
}

// ── Team ID resolution ───────────────────────────────────
async function resolveTeamId(
  searchName: string,
  apiKey: string,
  supabase: any
): Promise<number | null> {
  // 1. Check cache
  const { data: cached } = await supabase
    .from("sports_teams_cache")
    .select("api_team_id")
    .eq("name", searchName)
    .maybeSingle();

  if (cached?.api_team_id) {
    return cached.api_team_id;
  }

  // 2. Search API — try simpler variants
  const searchVariants = [
    searchName,
    searchName.replace(/^(NK|FK|HNK|GNK)\s+/i, ''), // strip prefix
    searchName.split(' ')[0], // first word only
  ];

  for (const variant of searchVariants) {
    const url = `${API_BASE}/teams?search=${encodeURIComponent(variant)}`;
    const resp = await fetchWithRetry(url, { "x-apisports-key": apiKey });

    if (!resp.ok) {
      console.error(`Team search failed for ${variant}: ${resp.status}`);
      continue;
    }

    const data = await resp.json();
    const teams = data.response || [];

    if (teams.length === 0) continue;

    // Pick best match: prefer name containing original search
    const exactMatch = teams.find(
      (t: any) => t.team.name.toLowerCase().includes(searchName.toLowerCase())
    ) || teams.find(
      (t: any) => t.team.name.toLowerCase().includes(variant.toLowerCase())
    );
    const chosen = exactMatch || teams[0];
    const teamId = chosen.team.id as number;

    // 3. Cache it
    await supabase.from("sports_teams_cache").upsert(
      { name: searchName, api_team_id: teamId, sport: "football", fetched_at: new Date().toISOString() },
      { onConflict: "name" }
    );

    console.log(`Resolved "${searchName}" (via "${variant}") -> API ID ${teamId}`);
    return teamId;
  }

  console.warn(`No team found for "${searchName}" after all variants`);
  return null;
}

// ── Fixture types ────────────────────────────────────────
interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue?: { name: string };
  };
  league: { name: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

interface ProcessedFixture {
  sport: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_status: string;
  match_minute: string | null;
  start_time: string;
  league: string | null;
  venue: string | null;
  api_match_id: string;
  is_local_team: boolean;
  team_tag: string;
}

// ── Main handler ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get("API_FOOTBALL_KEY");
    if (!API_KEY) throw new Error("API_FOOTBALL_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    // Deduplicated fixture map: fixture API ID -> processed data
    const fixtureMap = new Map<string, ProcessedFixture>();
    let hasLive = false;

    // Process teams sequentially (max 3 parallel API calls per team set)
    for (const team of TRACKED_TEAMS) {
      const teamId = await resolveTeamId(team.searchName, API_KEY, supabase);
      if (!teamId) {
        console.warn(`Skipping ${team.searchName} — no API ID`);
        continue;
      }

      // Fetch today + tomorrow fixtures
      for (const date of [today, tomorrow]) {
        try {
          const url = `${API_BASE}/fixtures?team=${teamId}&date=${date}`;
          const resp = await fetchWithRetry(url, { "x-apisports-key": API_KEY });

          if (!resp.ok) {
            console.error(`API error for ${team.searchName} on ${date}: ${resp.status}`);
            continue;
          }

          const data = await resp.json();
          for (const fix of (data.response || []) as ApiFixture[]) {
            const key = `football_${fix.fixture.id}`;
            const status = mapStatus(fix.fixture.status.short);

            // Dedup: if already in map, update with newer data (especially for live)
            const existing = fixtureMap.get(key);
            if (existing) {
              // Prefer live data over scheduled
              if (status === "live" || (existing.match_status !== "live")) {
                existing.match_status = status;
                existing.home_score = fix.goals.home;
                existing.away_score = fix.goals.away;
                existing.match_minute = fix.fixture.status.elapsed
                  ? String(fix.fixture.status.elapsed) : null;
              }
            } else {
              fixtureMap.set(key, {
                sport: "football",
                home_team: fix.teams.home.name,
                away_team: fix.teams.away.name,
                home_score: fix.goals.home,
                away_score: fix.goals.away,
                match_status: status,
                match_minute: fix.fixture.status.elapsed
                  ? String(fix.fixture.status.elapsed) : null,
                start_time: fix.fixture.date,
                league: fix.league.name || null,
                venue: fix.fixture.venue?.name || null,
                api_match_id: key,
                is_local_team: team.isLocal,
                team_tag: team.tag,
              });
            }

            if (status === "live") hasLive = true;
          }
        } catch (e) {
          console.error(`Error fetching ${team.searchName} ${date}:`, e);
        }
      }

      // Also check live fixtures for this team
      try {
        const liveUrl = `${API_BASE}/fixtures?team=${teamId}&live=all`;
        const liveResp = await fetchWithRetry(liveUrl, { "x-apisports-key": API_KEY });

        if (liveResp.ok) {
          const liveData = await liveResp.json();
          for (const fix of (liveData.response || []) as ApiFixture[]) {
            const key = `football_${fix.fixture.id}`;
            hasLive = true;

            const existing = fixtureMap.get(key);
            if (existing) {
              existing.match_status = "live";
              existing.home_score = fix.goals.home;
              existing.away_score = fix.goals.away;
              existing.match_minute = fix.fixture.status.elapsed
                ? String(fix.fixture.status.elapsed) : null;
            } else {
              fixtureMap.set(key, {
                sport: "football",
                home_team: fix.teams.home.name,
                away_team: fix.teams.away.name,
                home_score: fix.goals.home,
                away_score: fix.goals.away,
                match_status: "live",
                match_minute: fix.fixture.status.elapsed
                  ? String(fix.fixture.status.elapsed) : null,
                start_time: fix.fixture.date,
                league: fix.league.name || null,
                venue: fix.fixture.venue?.name || null,
                api_match_id: key,
                is_local_team: team.isLocal,
                team_tag: team.tag,
              });
            }
          }
        }
      } catch (e) {
        console.error(`Live fetch error for ${team.searchName}:`, e);
      }
    }

    // ── Upsert deduplicated fixtures ──
    const allFixtures = Array.from(fixtureMap.values());

    if (allFixtures.length > 0) {
      const { error } = await supabase
        .from("sports_events")
        .upsert(allFixtures, { onConflict: "api_match_id" });

      if (error) {
        console.error("Upsert error:", error);
        throw error;
      }
    }

    // ── Clean up finished matches older than 24h ──
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("sports_events")
      .delete()
      .eq("match_status", "finished")
      .lt("start_time", cutoff);

    // Also clean postponed matches older than 48h
    const cutoff48 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("sports_events")
      .delete()
      .eq("match_status", "postponed")
      .lt("start_time", cutoff48);

    return new Response(
      JSON.stringify({
        success: true,
        fetched: allFixtures.length,
        hasLive,
        message: `Fetched ${allFixtures.length} unique fixtures`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-sports error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
