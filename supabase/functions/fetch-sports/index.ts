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
  if (live.has(short)) return "live";
  if (finished.has(short)) return "finished";
  return "upcoming";
}

// ── Helpers ──────────────────────────────────────────────
function dateStr(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toISOString().split("T")[0];
}

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

  const variants = [
    searchName,
    searchName.replace(/^(NK|FK|HNK|GNK)\s+/i, ""),
    searchName.split(" ")[0],
  ];

  for (const variant of variants) {
    const url = `${API_BASE}/teams?search=${encodeURIComponent(variant)}`;
    const resp = await fetchWithRetry(url, { "x-apisports-key": apiKey });
    if (!resp.ok) continue;
    const data = await resp.json();
    const teams = data.response || [];
    if (teams.length === 0) continue;

    const match =
      teams.find((t: any) =>
        t.team.name.toLowerCase().includes(searchName.toLowerCase())
      ) ||
      teams.find((t: any) =>
        t.team.name.toLowerCase().includes(variant.toLowerCase())
      ) ||
      teams[0];
    const teamId = match.team.id as number;

    await supabase.from("sports_teams_cache").upsert(
      {
        name: searchName,
        api_team_id: teamId,
        sport: "football",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "name" }
    );
    console.log(`Resolved "${searchName}" -> API ID ${teamId}`);
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
  source: string;
}

function processFixture(
  fix: ApiFixture,
  team: (typeof TRACKED_TEAMS)[0]
): ProcessedFixture {
  return {
    sport: "football",
    home_team: fix.teams.home.name,
    away_team: fix.teams.away.name,
    home_score: fix.goals.home,
    away_score: fix.goals.away,
    match_status: mapStatus(fix.fixture.status.short),
    match_minute: fix.fixture.status.elapsed
      ? String(fix.fixture.status.elapsed)
      : null,
    start_time: fix.fixture.date,
    league: fix.league.name || null,
    venue: fix.fixture.venue?.name || null,
    api_match_id: `football_${fix.fixture.id}`,
    is_local_team: team.isLocal,
    team_tag: team.tag,
    source: "api",
  };
}

// ── Check if API is suspended (detect from errors object) ──
function isApiSuspended(data: any): boolean {
  const errors = data?.errors;
  if (!errors) return false;
  const msg = JSON.stringify(errors).toLowerCase();
  return msg.includes("suspended") || msg.includes("blocked");
}

// ── Fetch fixtures for a date range, filter by status ──
async function fetchRange(
  teamId: number,
  from: string,
  to: string,
  apiKey: string,
  label: string
): Promise<{ fixtures: ApiFixture[]; suspended: boolean }> {
  const url = `${API_BASE}/fixtures?team=${teamId}&from=${from}&to=${to}`;
  console.log(`[${label}] ${url}`);
  const resp = await fetchWithRetry(url, { "x-apisports-key": apiKey });

  if (!resp.ok) {
    console.error(`[${label}] HTTP ${resp.status}`);
    return { fixtures: [], suspended: resp.status === 401 || resp.status === 403 };
  }

  const data = await resp.json();
  const suspended = isApiSuspended(data);
  if (suspended) {
    console.error(`[${label}] API_SUSPENDED: ${JSON.stringify(data.errors)}`);
    return { fixtures: [], suspended: true };
  }

  const fixtures = (data.response || []) as ApiFixture[];
  console.log(
    `[${label}] ${fixtures.length} fixtures (errors: ${JSON.stringify(data.errors || {})})`
  );
  return { fixtures, suspended: false };
}

// ── Main handler ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const API_KEY = Deno.env.get("API_FOOTBALL_KEY");
    if (!API_KEY) throw new Error("API_FOOTBALL_KEY not configured");

    // ── Check backoff: skip if too many consecutive failures ──
    const { data: statusRow } = await supabase
      .from("sports_fetch_status")
      .select("*")
      .eq("id", "fetch-sports")
      .maybeSingle();

    if (statusRow && statusRow.consecutive_failures >= 3) {
      const lastRun = new Date(statusRow.last_run_at).getTime();
      const cooldown = 60 * 60 * 1000; // 60 min
      if (Date.now() - lastRun < cooldown) {
        console.log(
          `BACKOFF: ${statusRow.consecutive_failures} failures, last run ${statusRow.last_run_at}. Skipping.`
        );
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            message: "Backoff active, skipping fetch",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const today = dateStr(0);
    const yesterday = dateStr(-1);
    const past14 = dateStr(-14);
    const future30 = dateStr(30);

    const fixtureMap = new Map<string, ProcessedFixture>();
    let hasLive = false;
    let apiSuspended = false;

    for (const team of TRACKED_TEAMS) {
      const teamId = await resolveTeamId(team.searchName, API_KEY, supabase);
      if (!teamId) {
        console.warn(`Skipping ${team.searchName} — no API ID`);
        continue;
      }

      // ── LIVE ──
      try {
        const liveUrl = `${API_BASE}/fixtures?team=${teamId}&live=all`;
        console.log(`[LIVE] ${liveUrl}`);
        const liveResp = await fetchWithRetry(liveUrl, {
          "x-apisports-key": API_KEY,
        });
        if (liveResp.ok) {
          const liveData = await liveResp.json();
          if (isApiSuspended(liveData)) {
            apiSuspended = true;
            console.error(`[LIVE] API_SUSPENDED`);
          } else {
            for (const fix of (liveData.response || []) as ApiFixture[]) {
              const proc = processFixture(fix, team);
              proc.match_status = "live";
              hasLive = true;
              fixtureMap.set(proc.api_match_id, proc);
            }
            console.log(
              `[LIVE] ${team.searchName}: ${(liveData.response || []).length} fixtures`
            );
          }
        }
      } catch (e) {
        console.error(`[LIVE] ${team.searchName} error:`, e);
      }

      if (apiSuspended) continue;

      // ── TODAY (today's fixtures) ──
      try {
        const { fixtures, suspended } = await fetchRange(
          teamId,
          today,
          today,
          API_KEY,
          `TODAY:${team.searchName}`
        );
        if (suspended) { apiSuspended = true; continue; }
        for (const fix of fixtures) {
          const proc = processFixture(fix, team);
          const existing = fixtureMap.get(proc.api_match_id);
          if (existing) {
            if (
              proc.match_status === "live" ||
              existing.match_status !== "live"
            ) {
              Object.assign(existing, proc);
            }
          } else {
            fixtureMap.set(proc.api_match_id, proc);
          }
          if (proc.match_status === "live") hasLive = true;
        }
      } catch (e) {
        console.error(`[TODAY] ${team.searchName} error:`, e);
      }

      // ── LAST (past 14 days → pick 1 newest finished) ──
      try {
        const { fixtures, suspended } = await fetchRange(
          teamId,
          past14,
          yesterday,
          API_KEY,
          `LAST:${team.searchName}`
        );
        if (suspended) { apiSuspended = true; continue; }
        const finished = fixtures
          .filter((f) => {
            const s = f.fixture.status.short;
            return ["FT", "AET", "PEN"].includes(s);
          })
          .sort(
            (a, b) =>
              new Date(b.fixture.date).getTime() -
              new Date(a.fixture.date).getTime()
          )
          .slice(0, 1);
        for (const fix of finished) {
          const proc = processFixture(fix, team);
          if (!fixtureMap.has(proc.api_match_id)) {
            fixtureMap.set(proc.api_match_id, proc);
            console.log(
              `[LAST] Added: ${proc.home_team} ${proc.home_score}:${proc.away_score} ${proc.away_team}`
            );
          }
        }
      } catch (e) {
        console.error(`[LAST] ${team.searchName} error:`, e);
      }

      // ── NEXT (today to +30 days → pick 1 closest upcoming) ──
      try {
        const { fixtures, suspended } = await fetchRange(
          teamId,
          today,
          future30,
          API_KEY,
          `NEXT:${team.searchName}`
        );
        if (suspended) { apiSuspended = true; continue; }
        const upcoming = fixtures
          .filter((f) => {
            const s = f.fixture.status.short;
            return ["NS", "TBD"].includes(s);
          })
          .sort(
            (a, b) =>
              new Date(a.fixture.date).getTime() -
              new Date(b.fixture.date).getTime()
          )
          .slice(0, 1);
        for (const fix of upcoming) {
          const proc = processFixture(fix, team);
          if (!fixtureMap.has(proc.api_match_id)) {
            fixtureMap.set(proc.api_match_id, proc);
            console.log(
              `[NEXT] Added: ${proc.home_team} vs ${proc.away_team} on ${proc.start_time}`
            );
          }
        }
      } catch (e) {
        console.error(`[NEXT] ${team.searchName} error:`, e);
      }
    }

    // ── Upsert fixtures ──
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

    // ── Auto-finish stale "live" matches (started >4h ago) ──
    const liveStaleThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: staleLive } = await supabase
      .from("sports_events")
      .select("id, home_team, away_team")
      .eq("match_status", "live")
      .lt("start_time", liveStaleThreshold);
    if (staleLive && staleLive.length > 0) {
      const staleIds = staleLive.map((e: any) => e.id);
      await supabase
        .from("sports_events")
        .update({ match_status: "finished", is_stale: false })
        .in("id", staleIds);
      console.log(`[AUTO-FINISH] Marked ${staleLive.length} stale live matches as finished`);
    }

    // ── Cleanup: keep top 5 finished, remove the rest ──
    const { data: finishedEvents } = await supabase
      .from("sports_events")
      .select("id, start_time")
      .eq("match_status", "finished")
      .eq("source", "api")
      .order("start_time", { ascending: false });

    if (finishedEvents && finishedEvents.length > 5) {
      const toDelete = finishedEvents.slice(5).map((e: any) => e.id);
      await supabase.from("sports_events").delete().in("id", toDelete);
      console.log(`Cleaned up ${toDelete.length} old finished events`);
    }

    // Clean postponed > 48h
    const cutoff48 = new Date(Date.now() - 48 * 3600000).toISOString();
    await supabase
      .from("sports_events")
      .delete()
      .eq("match_status", "postponed")
      .eq("source", "api")
      .lt("start_time", cutoff48);

    // Clean expired manual events
    await supabase
      .from("sports_events")
      .delete()
      .eq("source", "manual")
      .lt("manual_expires_at", new Date().toISOString());

    // ── Update status ──
    const statusUpdate = apiSuspended
      ? {
          last_run_at: new Date().toISOString(),
          ok: false,
          message: "API_SUSPENDED",
          fetched_count: allFixtures.length,
          consecutive_failures: (statusRow?.consecutive_failures || 0) + 1,
          updated_at: new Date().toISOString(),
        }
      : {
          last_run_at: new Date().toISOString(),
          ok: true,
          message: `Fetched ${allFixtures.length} fixtures`,
          fetched_count: allFixtures.length,
          consecutive_failures: 0,
          updated_at: new Date().toISOString(),
        };

    await supabase
      .from("sports_fetch_status")
      .upsert({ id: "fetch-sports", ...statusUpdate });

    console.log(
      `Done: ${allFixtures.length} fixtures, live=${hasLive}, suspended=${apiSuspended}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        fetched: allFixtures.length,
        hasLive,
        apiSuspended,
        message: statusUpdate.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-sports error:", error);

    // Update status on hard failure
    await supabase.from("sports_fetch_status").upsert({
      id: "fetch-sports",
      last_run_at: new Date().toISOString(),
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
      fetched_count: 0,
      consecutive_failures: 99,
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
