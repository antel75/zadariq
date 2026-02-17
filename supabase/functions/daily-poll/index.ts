import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'active'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Determine action from query param or body
    let action = url.searchParams.get('action') || 'active';
    let body: any = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
        if (body?.action) action = body.action;
      } catch { /* no body */ }
    }

    // GET active poll
    if (action === 'active') {
        const { data: poll } = await supabase
          .from('daily_poll')
          .select('id, question_text, context_type, context_key, created_at, expires_at')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!poll) {
          return new Response(
            JSON.stringify({ poll: null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: options } = await supabase
          .from('poll_options')
          .select('id, option_text, votes_count')
          .eq('poll_id', poll.id)

        const totalVotes = (options || []).reduce((sum, o) => sum + o.votes_count, 0)

        return new Response(
          JSON.stringify({
            poll: {
              ...poll,
              options: (options || []).map(o => ({
                id: o.id,
                text: o.option_text,
                votes: o.votes_count,
                percent: totalVotes > 0 ? Math.round((o.votes_count / totalVotes) * 100) : 0,
              })),
              total_votes: totalVotes,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // POST vote
    if (action === 'vote') {
      const { option_id, poll_id, fingerprint_hash } = body

      if (!option_id || !poll_id || !fingerprint_hash) {
        return new Response(
          JSON.stringify({ error: 'Missing fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if already voted
      const { data: existing } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', poll_id)
        .eq('fingerprint_hash', fingerprint_hash)
        .limit(1)

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ error: 'already_voted' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert vote
      const { error: voteErr } = await supabase
        .from('poll_votes')
        .insert({ poll_id, option_id, fingerprint_hash })

      if (voteErr) {
        if (voteErr.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'already_voted' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw voteErr
      }

      // Increment cached count
      await supabase.rpc('increment_poll_vote', { p_option_id: option_id })

      // Return updated results
      const { data: options } = await supabase
        .from('poll_options')
        .select('id, option_text, votes_count')
        .eq('poll_id', poll_id)

      const totalVotes = (options || []).reduce((sum, o) => sum + o.votes_count, 0)

      return new Response(
        JSON.stringify({
          success: true,
          options: (options || []).map(o => ({
            id: o.id,
            text: o.option_text,
            votes: o.votes_count,
            percent: totalVotes > 0 ? Math.round((o.votes_count / totalVotes) * 100) : 0,
          })),
          total_votes: totalVotes,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
