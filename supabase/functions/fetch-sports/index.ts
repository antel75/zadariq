import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Teams we track with their API-Football IDs
const FOOTBALL_TEAMS: Record<string, { id: number; tag: string; isLocal: boolean }> = {
  "NK Zadar": { id: 2774, tag: "nk_zadar", isLocal: true },
  "Hajduk Split": { id: 537, tag: "hajduk", isLocal: false },
  "Croatia": { id: 3, tag: "croatia_football", isLocal: false },
};

const API_BASE = "https://v3.football.api-sports.io";

interface FixtureResponse {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      status: { short: string; elapsed: number | null };
      venue?: { name: string };
    };
    league: { name: string };
    teams: {
      home: { name: string };
      away: { name: string };
    };
    goals: { home: number | null; away: number | null };
  }>;
}

function mapStatus(short: string): string {
  const liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"];
  const finishedStatuses = ["FT", "AET", "PEN"];
  const upcomingStatuses = ["NS", "TBD"];
  
  if (liveStatuses.includes(short)) return "live";
  if (finishedStatuses.includes(short)) return "finished";
  if (upcomingStatuses.includes(short)) return "upcoming";
  if (short === "PST" || short === "CANC") return "postponed";
  return "upcoming";
}

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

    const allFixtures: any[] = [];

    // Fetch fixtures for each team
    for (const [teamName, config] of Object.entries(FOOTBALL_TEAMS)) {
      try {
        // Get today's and tomorrow's fixtures
        for (const date of [today, tomorrow]) {
          const url = `${API_BASE}/fixtures?team=${config.id}&date=${date}`;
          const resp = await fetch(url, {
            headers: { "x-apisports-key": API_KEY },
          });

          if (!resp.ok) {
            console.error(`API error for ${teamName}: ${resp.status}`);
            continue;
          }

          const data: FixtureResponse = await resp.json();

          for (const fix of data.response) {
            const status = mapStatus(fix.fixture.status.short);
            
            allFixtures.push({
              sport: "football",
              home_team: fix.teams.home.name,
              away_team: fix.teams.away.name,
              home_score: fix.goals.home,
              away_score: fix.goals.away,
              match_status: status,
              match_minute: fix.fixture.status.elapsed
                ? String(fix.fixture.status.elapsed)
                : null,
              start_time: fix.fixture.date,
              league: fix.league.name,
              venue: fix.fixture.venue?.name || null,
              api_match_id: `football_${fix.fixture.id}`,
              is_local_team: config.isLocal,
              team_tag: config.tag,
            });
          }
        }

        // Also check for live fixtures
        const liveUrl = `${API_BASE}/fixtures?team=${config.id}&live=all`;
        const liveResp = await fetch(liveUrl, {
          headers: { "x-apisports-key": API_KEY },
        });

        if (liveResp.ok) {
          const liveData: FixtureResponse = await liveResp.json();
          for (const fix of liveData.response) {
            const existing = allFixtures.find(
              (f) => f.api_match_id === `football_${fix.fixture.id}`
            );
            if (existing) {
              // Update with live data
              existing.match_status = "live";
              existing.home_score = fix.goals.home;
              existing.away_score = fix.goals.away;
              existing.match_minute = fix.fixture.status.elapsed
                ? String(fix.fixture.status.elapsed)
                : null;
            } else {
              allFixtures.push({
                sport: "football",
                home_team: fix.teams.home.name,
                away_team: fix.teams.away.name,
                home_score: fix.goals.home,
                away_score: fix.goals.away,
                match_status: "live",
                match_minute: fix.fixture.status.elapsed
                  ? String(fix.fixture.status.elapsed)
                  : null,
                start_time: fix.fixture.date,
                league: fix.league.name,
                venue: fix.fixture.venue?.name || null,
                api_match_id: `football_${fix.fixture.id}`,
                is_local_team: config.isLocal,
                team_tag: config.tag,
              });
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching ${teamName}:`, e);
      }
    }

    // Upsert all fixtures
    if (allFixtures.length > 0) {
      const { error } = await supabase
        .from("sports_events")
        .upsert(allFixtures, { onConflict: "api_match_id" });

      if (error) {
        console.error("Upsert error:", error);
        throw error;
      }
    }

    // Clean up old finished matches (older than 24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("sports_events")
      .delete()
      .eq("match_status", "finished")
      .lt("start_time", cutoff);

    return new Response(
      JSON.stringify({
        success: true,
        fetched: allFixtures.length,
        message: `Fetched ${allFixtures.length} fixtures`,
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
