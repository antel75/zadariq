import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TSDB_BASE = "https://www.thesportsdb.com/api/v1/json";

// Known IDs (cached; will be resolved dynamically if missing)
const KNOWN_TEAMS: Record<string, { searchName: string; tag: string; isLocal: boolean }> = {
  hajduk: { searchName: "Hajduk Split", tag: "hajduk", isLocal: false },
  croatia: { searchName: "Croatia", tag: "croatia_nt", isLocal: false },
};

const UCL_LEAGUE_NAME = "UEFA Champions League";

interface TSDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  dateEvent: string;
  strTime: string | null;
  strTimestamp: string | null;
  strLeague: string;
  strVenue: string | null;
  intRound: string | null;
  strThumb: string | null;
}

function parseScore(s: string | null): number | null {
  if (s === null || s === "" || s === undefined) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function mapStatus(ev: TSDBEvent): string {
  const status = (ev.strStatus || "").toLowerCase();
  if (status.includes("live") || status === "1h" || status === "2h" || status === "ht" || status === "et") return "live";
  if (parseScore(ev.intHomeScore) !== null && parseScore(ev.intAwayScore) !== null) {
    // Has scores — check if it's really finished
    if (status === "" || status === "match finished" || status === "ft" || status === "aet" || status === "pen" || status === "finished") return "finished";
    return "finished";
  }
  return "upcoming";
}

function eventToRow(ev: TSDBEvent, tag: string, isLocal: boolean, competition: string) {
  const startTime = ev.strTimestamp
    ? new Date(ev.strTimestamp).toISOString()
    : `${ev.dateEvent}T${ev.strTime || "00:00:00"}Z`;

  return {
    sport: "football",
    home_team: ev.strHomeTeam,
    away_team: ev.strAwayTeam,
    home_score: parseScore(ev.intHomeScore),
    away_score: parseScore(ev.intAwayScore),
    match_status: mapStatus(ev),
    start_time: startTime,
    league: competition || ev.strLeague,
    venue: ev.strVenue || null,
    round: ev.intRound || null,
    api_match_id: `tsdb_football_${ev.idEvent}`,
    is_local_team: isLocal,
    team_tag: tag,
    source: "api",
    link_url: null,
    match_minute: null,
  };
}

async function fetchJSON(url: string): Promise<any> {
  console.log(`[FETCH] ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error(`[FETCH] HTTP ${resp.status}: ${text.slice(0, 200)}`);
    return null;
  }
  return await resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const apiKey = Deno.env.get("THESPORTSDB_KEY") || "3";

  try {
    const base = `${TSDB_BASE}/${apiKey}`;
    const allRows: any[] = [];

    // ── Fetch team events (Hajduk, Croatia NT) ──
    for (const [key, team] of Object.entries(KNOWN_TEAMS)) {
      // Resolve team ID via search
      const searchData = await fetchJSON(`${base}/searchteams.php?t=${encodeURIComponent(team.searchName)}`);
      const teams = searchData?.teams || [];
      if (teams.length === 0) {
        console.warn(`[TEAM] Not found: ${team.searchName}`);
        continue;
      }
      const teamId = teams[0].idTeam;
      console.log(`[TEAM] ${team.searchName} -> ID ${teamId}`);

      // Next events
      const nextData = await fetchJSON(`${base}/eventsnext.php?id=${teamId}`);
      const nextEvents = (nextData?.events || []) as TSDBEvent[];
      console.log(`[NEXT] ${team.searchName}: ${nextEvents.length} events`);
      for (const ev of nextEvents.slice(0, 5)) {
        allRows.push(eventToRow(ev, team.tag, team.isLocal, ev.strLeague));
      }

      // Last events
      const lastData = await fetchJSON(`${base}/eventslast.php?id=${teamId}`);
      const lastEvents = (lastData?.events || []) as TSDBEvent[];
      console.log(`[LAST] ${team.searchName}: ${lastEvents.length} events`);
      for (const ev of lastEvents.slice(0, 2)) {
        allRows.push(eventToRow(ev, team.tag, team.isLocal, ev.strLeague));
      }
    }

    // ── UCL (Champions League) ──
    try {
      // Search for UCL league
      const leagueSearch = await fetchJSON(`${base}/search_all_leagues.php?s=Soccer`);
      const leagues = (leagueSearch?.countrys || leagueSearch?.leagues || []) as any[];
      const ucl = leagues.find((l: any) =>
        (l.strLeague || "").toLowerCase().includes("champions league") &&
        (l.strLeague || "").toLowerCase().includes("uefa")
      );

      if (ucl) {
        const leagueId = ucl.idLeague;
        console.log(`[UCL] League ID: ${leagueId}`);

        // Next UCL events
        const uclNext = await fetchJSON(`${base}/eventsnextleague.php?id=${leagueId}`);
        const uclNextEvents = (uclNext?.events || []) as TSDBEvent[];
        console.log(`[UCL NEXT] ${uclNextEvents.length} events`);
        for (const ev of uclNextEvents.slice(0, 10)) {
          allRows.push(eventToRow(ev, "ucl", false, UCL_LEAGUE_NAME));
        }

        // Past UCL events
        const uclPast = await fetchJSON(`${base}/eventspastleague.php?id=${leagueId}`);
        const uclPastEvents = (uclPast?.events || []) as TSDBEvent[];
        console.log(`[UCL PAST] ${uclPastEvents.length} events`);
        for (const ev of uclPastEvents.slice(0, 5)) {
          allRows.push(eventToRow(ev, "ucl", false, UCL_LEAGUE_NAME));
        }
      } else {
        console.warn("[UCL] League not found in search");
      }
    } catch (e) {
      console.error("[UCL] Error:", e);
    }

    // ── KK Zadar (basketball) ──
    try {
      const kkSearch = await fetchJSON(`${base}/searchteams.php?t=${encodeURIComponent("KK Zadar")}`);
      const kkTeams = kkSearch?.teams || [];
      if (kkTeams.length > 0) {
        const kkId = kkTeams[0].idTeam;
        console.log(`[KK ZADAR] Team ID: ${kkId}`);

        const kkNext = await fetchJSON(`${base}/eventsnext.php?id=${kkId}`);
        for (const ev of ((kkNext?.events || []) as TSDBEvent[]).slice(0, 5)) {
          allRows.push(eventToRow(ev, "kk_zadar", true, ev.strLeague));
          allRows[allRows.length - 1].sport = "basketball";
        }

        const kkLast = await fetchJSON(`${base}/eventslast.php?id=${kkId}`);
        for (const ev of ((kkLast?.events || []) as TSDBEvent[]).slice(0, 2)) {
          allRows.push(eventToRow(ev, "kk_zadar", true, ev.strLeague));
          allRows[allRows.length - 1].sport = "basketball";
        }
      } else {
        console.warn("[KK ZADAR] Team not found — relying on manual submissions");
      }
    } catch (e) {
      console.error("[KK ZADAR] Error:", e);
    }

    // ── Upsert ──
    if (allRows.length > 0) {
      const { error } = await supabase
        .from("sports_events")
        .upsert(allRows, { onConflict: "api_match_id" });
      if (error) {
        console.error("Upsert error:", error);
        throw error;
      }
    }

    // ── Cleanup: keep last 5 finished per tag, delete >30 days old ──
    const tags = [...new Set(allRows.map(r => r.team_tag))];
    for (const tag of tags) {
      const { data: finished } = await supabase
        .from("sports_events")
        .select("id, start_time")
        .eq("match_status", "finished")
        .eq("team_tag", tag)
        .eq("source", "api")
        .order("start_time", { ascending: false });

      if (finished && finished.length > 5) {
        const toDelete = finished.slice(5).map((e: any) => e.id);
        await supabase.from("sports_events").delete().in("id", toDelete);
        console.log(`[CLEANUP] Deleted ${toDelete.length} old finished for ${tag}`);
      }
    }

    // Delete very old finished (>30 days)
    const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString();
    await supabase
      .from("sports_events")
      .delete()
      .eq("match_status", "finished")
      .eq("source", "api")
      .lt("start_time", cutoff30);

    // ── Update health status ──
    await supabase.from("sports_sources_health").upsert({
      source: "thesportsdb",
      last_success_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    });

    // Also update sports_fetch_status for backward compat
    await supabase.from("sports_fetch_status").upsert({
      id: "fetch-sports",
      last_run_at: new Date().toISOString(),
      ok: true,
      message: `TheSportsDB: ${allRows.length} events`,
      fetched_count: allRows.length,
      consecutive_failures: 0,
      updated_at: new Date().toISOString(),
    });

    console.log(`[DONE] Upserted ${allRows.length} events`);

    return new Response(
      JSON.stringify({ success: true, fetched: allRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-sports-football error:", error);

    await supabase.from("sports_sources_health").upsert({
      source: "thesportsdb",
      last_error: error instanceof Error ? error.message : "Unknown",
      updated_at: new Date().toISOString(),
    });

    await supabase.from("sports_fetch_status").upsert({
      id: "fetch-sports",
      last_run_at: new Date().toISOString(),
      ok: false,
      message: error instanceof Error ? error.message : "Unknown",
      fetched_count: 0,
      consecutive_failures: 99,
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
