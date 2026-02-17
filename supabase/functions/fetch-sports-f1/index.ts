import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ERGAST_BASE = "https://api.jolpi.ca/ergast/f1";

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: { circuitName: string; Location: { country: string } };
  date: string;
  time?: string;
  url?: string;
  Results?: Array<{
    position: string;
    Driver: { familyName: string; givenName: string };
    Constructor: { name: string };
    Time?: { time: string };
  }>;
}

function raceToRow(race: ErgastRace, status: string, subtitle?: string) {
  const startTime = race.time
    ? `${race.date}T${race.time}`
    : `${race.date}T14:00:00Z`;

  return {
    sport: "f1",
    home_team: "Formula 1",
    away_team: race.raceName,
    home_score: null,
    away_score: null,
    match_status: status,
    start_time: startTime,
    league: "Formula 1",
    venue: `${race.Circuit.circuitName}, ${race.Circuit.Location.country}`,
    round: `Round ${race.round}`,
    api_match_id: `ergast_f1_${race.season}_${race.round}_race`,
    is_local_team: false,
    team_tag: "f1",
    source: "api",
    link_url: race.url || null,
    match_minute: subtitle || null,
  };
}

async function fetchJSON(url: string): Promise<any> {
  console.log(`[F1 FETCH] ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error(`[F1] HTTP ${resp.status}`);
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

  try {
    const allRows: any[] = [];

    // ── Next race ──
    const nextData = await fetchJSON(`${ERGAST_BASE}/current/next.json`);
    const nextRaces = nextData?.MRData?.RaceTable?.Races || [];
    if (nextRaces.length > 0) {
      allRows.push(raceToRow(nextRaces[0], "upcoming"));
      console.log(`[F1 NEXT] ${nextRaces[0].raceName} on ${nextRaces[0].date}`);
    }

    // ── Full season for upcoming (next 3) ──
    const seasonData = await fetchJSON(`${ERGAST_BASE}/current.json`);
    const seasonRaces = (seasonData?.MRData?.RaceTable?.Races || []) as ErgastRace[];
    const now = new Date();
    const futureRaces = seasonRaces
      .filter(r => new Date(r.date) > now)
      .slice(0, 3);

    for (const race of futureRaces) {
      const row = raceToRow(race, "upcoming");
      if (!allRows.some(r => r.api_match_id === row.api_match_id)) {
        allRows.push(row);
      }
    }

    // ── Last race result ──
    const lastData = await fetchJSON(`${ERGAST_BASE}/current/last/results.json`);
    const lastRaces = lastData?.MRData?.RaceTable?.Races || [];
    if (lastRaces.length > 0) {
      const lastRace = lastRaces[0] as ErgastRace;
      const results = lastRace.Results || [];
      let subtitle = "";
      if (results.length >= 3) {
        subtitle = `🥇 ${results[0].Driver.familyName} 🥈 ${results[1].Driver.familyName} 🥉 ${results[2].Driver.familyName}`;
      }
      allRows.push(raceToRow(lastRace, "finished", subtitle));
      console.log(`[F1 LAST] ${lastRace.raceName}: ${subtitle}`);
    }

    // ── Past 3 races ──
    const pastRaces = seasonRaces
      .filter(r => new Date(r.date) < now)
      .reverse()
      .slice(0, 3);

    for (const race of pastRaces) {
      const row = raceToRow(race, "finished");
      if (!allRows.some(r => r.api_match_id === row.api_match_id)) {
        // Try to get results for this race
        const raceResultData = await fetchJSON(`${ERGAST_BASE}/${race.season}/${race.round}/results.json`);
        const raceResults = raceResultData?.MRData?.RaceTable?.Races?.[0]?.Results || [];
        if (raceResults.length >= 3) {
          row.match_minute = `🥇 ${raceResults[0].Driver.familyName} 🥈 ${raceResults[1].Driver.familyName} 🥉 ${raceResults[2].Driver.familyName}`;
        }
        allRows.push(row);
      }
    }

    // ── Upsert ──
    if (allRows.length > 0) {
      const { error } = await supabase
        .from("sports_events")
        .upsert(allRows, { onConflict: "api_match_id" });
      if (error) {
        console.error("F1 upsert error:", error);
        throw error;
      }
    }

    // ── Cleanup: keep last 3 finished F1 ──
    const { data: finishedF1 } = await supabase
      .from("sports_events")
      .select("id, start_time")
      .eq("match_status", "finished")
      .eq("team_tag", "f1")
      .eq("source", "api")
      .order("start_time", { ascending: false });

    if (finishedF1 && finishedF1.length > 3) {
      const toDelete = finishedF1.slice(3).map((e: any) => e.id);
      await supabase.from("sports_events").delete().in("id", toDelete);
      console.log(`[F1 CLEANUP] Deleted ${toDelete.length} old races`);
    }

    // ── Update health ──
    await supabase.from("sports_sources_health").upsert({
      source: "ergast",
      last_success_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    });

    console.log(`[F1 DONE] Upserted ${allRows.length} events`);

    return new Response(
      JSON.stringify({ success: true, fetched: allRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-sports-f1 error:", error);

    await supabase.from("sports_sources_health").upsert({
      source: "ergast",
      last_error: error instanceof Error ? error.message : "Unknown",
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
