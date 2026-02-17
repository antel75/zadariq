import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const events = body.events;

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide events array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 7 * 86400000).toISOString();

    const rows = events.map((ev: any, i: number) => ({
      sport: ev.sport || "football",
      home_team: ev.home_team,
      away_team: ev.away_team,
      home_score: ev.home_score ?? null,
      away_score: ev.away_score ?? null,
      match_status: ev.match_status || "upcoming",
      match_minute: ev.match_minute || null,
      start_time: ev.start_time,
      league: ev.league || null,
      venue: ev.venue || null,
      api_match_id: ev.api_match_id || `manual_${now.getTime()}_${i}`,
      is_local_team: ev.is_local_team ?? true,
      team_tag: ev.team_tag || null,
      source: "manual",
      manual_expires_at: ev.manual_expires_at || defaultExpiry,
    }));

    const { error } = await supabase
      .from("sports_events")
      .upsert(rows, { onConflict: "api_match_id" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, inserted: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("seed-sports error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
