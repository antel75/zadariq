import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://v3.football.api-sports.io";

const TRACKED_TEAMS = [
  { searchName: "NK Zadar", tag: "nk_zadar", isLocal: true },
  { searchName: "Hajduk Split", tag: "hajduk", isLocal: false },
  { searchName: "Croatia", tag: "croatia_football", isLocal: false },
];

// ── Status mapping ──────────────────────────────────────
function mapStatus(short: string): string {
  const live = new Set(["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]);
  const finished = new Set(["FT", "AET", "PEN"]);
  const upcoming = new Set(["NS", "TBD"]);
  if (live.has(short)) return "live";
  if (finished.has(short)) return "finished";
  if (upcoming.has(short)) return "upcoming";
  return "upcoming";
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
  const { data: cached } = await supabase
    .from("sports_teams_cache")
    .select("api_team_id")
    .eq("name", searchName)
    .maybeSingle();

  if (cached?.api_team_id) return cached.api_team_id;

  const searchVariants = [
    searchName,
    searchName.replace(/^(NK|FK|HNK|GNK)\s+/i, ''),
    searchName.split(' ')[0],
  ];

  for (const variant of searchVariants) {
    const url = `${API_BASE}/teams?search=${encodeURIComponent(variant)}`;
    const resp = await fetchWithRetry(url, { "x-apisports-key": apiKey });
    if (!resp.ok) continue;

    const data = await resp.json();
    const teams = data.response || [];
    if (teams.length === 0) continue;

    const exactMatch = teams.find(
      (t: any) => t.team.name.toLowerCase().includes(searchName.toLowerCase())
    ) || teams.find(
      (t: any) => t.team.name.toLowerCase().includes(variant.toLowerCase())
    );
    const chosen = exactMatch || teams[0];
    const teamId = chosen.team.id as number;

    await supabase.from("sports_teams_cache").upsert(
      { name: searchName, api_team_id: teamId, sport: "football", fetched_at: new Date().toISOString() },
      { onConflict: "name" }
    );

    console.log(`Resolved "${searchName}" (via "${variant}") -> API ID ${teamId}`);
    return teamId;
  }

  console.warn(`No team found for "${searchName}"`);
  return null;
}

// ── Types ────────────────────────────────────────────────
interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue?: { name: string };
  };
  league: { name: string; season: number };
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

function processFixture(fix: ApiFixture, team: typeof TRACKED_TEAMS[0]): ProcessedFixture {
  const status = mapStatus(fix.fixture.status.short);
  return {
    sport: "football",
    home_team: fix.teams.home.name,
    away_team: fix.teams.away.name,
    home_score: fix.goals.home,
    away_score: fix.goals.away,
    match_status: status,
    match_minute: fix.fixture.status.elapsed ? String(fix.fixture.status.elapsed) : null,
    start_time: fix.fixture.date,
    league: fix.league.name || null,
    venue: fix.fixture.venue?.name || null,
    api_match_id: `football_${fix.fixture.id}`,
    is_local_team: team.isLocal,
    team_tag: team.tag,
  };
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

    const fixtureMap = new Map<string, ProcessedFixture>();
    let hasLive = false;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
    // For free plan: use date ranges instead of ?next= and ?last=
    const futureEnd = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0]; // +30 days
    const pastStart = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0]; // -14 days
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
    const currentSeason = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1; // football season year

    for (const team of TRACKED_TEAMS) {
      const teamId = await resolveTeamId(team.searchName, API_KEY, supabase);
      if (!teamId) {
        console.warn(`Skipping ${team.searchName} — no API ID`);
        continue;
      }

      // 1) Today + tomorrow fixtures
      for (const date of [today, tomorrow]) {
        try {
          const url = `${API_BASE}/fixtures?team=${teamId}&date=${date}`;
          const resp = await fetchWithRetry(url, { "x-apisports-key": API_KEY });
          if (!resp.ok) continue;

          const data = await resp.json();
          for (const fix of (data.response || []) as ApiFixture[]) {
            const proc = processFixture(fix, team);
            const existing = fixtureMap.get(proc.api_match_id);
            if (existing) {
              if (proc.match_status === "live" || existing.match_status !== "live") {
                Object.assign(existing, proc);
              }
            } else {
              fixtureMap.set(proc.api_match_id, proc);
            }
            if (proc.match_status === "live") hasLive = true;
          }
        } catch (e) {
          console.error(`Error fetching ${team.searchName} ${date}:`, e);
        }
      }

      // 2) Live fixtures
      try {
        const liveUrl = `${API_BASE}/fixtures?team=${teamId}&live=all`;
        const liveResp = await fetchWithRetry(liveUrl, { "x-apisports-key": API_KEY });
        if (liveResp.ok) {
          const liveData = await liveResp.json();
          for (const fix of (liveData.response || []) as ApiFixture[]) {
            const proc = processFixture(fix, team);
            proc.match_status = "live";
            hasLive = true;
            const existing = fixtureMap.get(proc.api_match_id);
            if (existing) {
              Object.assign(existing, proc);
            } else {
              fixtureMap.set(proc.api_match_id, proc);
            }
          }
        }
      } catch (e) {
        console.error(`Live fetch error for ${team.searchName}:`, e);
      }

      // 3) NEXT UPCOMING — use season endpoint + date range (free plan compatible)
      try {
        // Fetch upcoming fixtures from tomorrow to +30 days
        const nextUrl = `${API_BASE}/fixtures?team=${teamId}&from=${tomorrow}&to=${futureEnd}`;
        console.log(`[NEXT] Fetching: ${nextUrl}`);
        const nextResp = await fetchWithRetry(nextUrl, { "x-apisports-key": API_KEY });
        if (nextResp.ok) {
          const nextData = await nextResp.json();
          const nextFixtures = (nextData.response || []) as ApiFixture[];
          console.log(`[NEXT] ${team.searchName}: ${nextFixtures.length} fixtures, errors: ${JSON.stringify(nextData.errors)}`);
          // Take only the closest 3
          const sorted = nextFixtures.sort((a, b) => 
            new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
          ).slice(0, 3);
          for (const fix of sorted) {
            const proc = processFixture(fix, team);
            if (!fixtureMap.has(proc.api_match_id)) {
              fixtureMap.set(proc.api_match_id, proc);
              console.log(`[NEXT] Added: ${proc.home_team} vs ${proc.away_team} on ${proc.start_time}`);
            }
          }
        } else {
          console.error(`[NEXT] ${team.searchName} failed: ${nextResp.status}`);
        }
      } catch (e) {
        console.error(`Next fixtures error for ${team.searchName}:`, e);
      }

      // 4) LAST RESULT — fetch recent finished fixtures from past 14 days
      try {
        const lastUrl = `${API_BASE}/fixtures?team=${teamId}&from=${pastStart}&to=${yesterday}`;
        console.log(`[LAST] Fetching: ${lastUrl}`);
        const lastResp = await fetchWithRetry(lastUrl, { "x-apisports-key": API_KEY });
        if (lastResp.ok) {
          const lastData = await lastResp.json();
          const lastFixtures = (lastData.response || []) as ApiFixture[];
          console.log(`[LAST] ${team.searchName}: ${lastFixtures.length} fixtures, errors: ${JSON.stringify(lastData.errors)}`);
          // Take only the most recent one
          const sorted = lastFixtures.sort((a, b) => 
            new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
          ).slice(0, 1);
          for (const fix of sorted) {
            const proc = processFixture(fix, team);
            if (!fixtureMap.has(proc.api_match_id)) {
              fixtureMap.set(proc.api_match_id, proc);
              console.log(`[LAST] Added: ${proc.home_team} ${proc.home_score}:${proc.away_score} ${proc.away_team}`);
            }
          }
        } else {
          console.error(`[LAST] ${team.searchName} failed: ${lastResp.status}`);
        }
      } catch (e) {
        console.error(`Last result error for ${team.searchName}:`, e);
      }
    }

    // ── Upsert all fixtures ──
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

    // ── Cleanup: keep last 3 finished, remove older ones ──
    // Don't delete ALL finished — keep the most recent ones for the "last result" fallback
    const { data: finishedEvents } = await supabase
      .from("sports_events")
      .select("id, start_time")
      .eq("match_status", "finished")
      .order("start_time", { ascending: false });

    if (finishedEvents && finishedEvents.length > 3) {
      // Keep top 3 finished, delete the rest
      const toDelete = finishedEvents.slice(3).map((e: any) => e.id);
      await supabase
        .from("sports_events")
        .delete()
        .in("id", toDelete);
      console.log(`Cleaned up ${toDelete.length} old finished events`);
    }

    // Clean postponed matches older than 48h
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
