import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PollTemplate {
  question: string
  options: string[]
  context_type: string
  context_key: string
}

interface ContextSignals {
  rain: boolean
  strongWind: boolean
  tempBand: 'cold' | 'mild' | 'hot' | 'extreme'
  nightDay: 'day' | 'night'
  liveMatch: boolean
  matchSoon: boolean
  weekendEvening: boolean
}

function getZagrebDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }))
}

function getZagrebHour(): number {
  return getZagrebDate().getHours()
}

function getZagrebDay(): number {
  return getZagrebDate().getDay()
}

// Compute a stable hash string from context signals
function computeContextHash(signals: ContextSignals): string {
  return [
    signals.rain ? '1' : '0',
    signals.strongWind ? '1' : '0',
    signals.tempBand,
    signals.nightDay,
    signals.liveMatch ? '1' : '0',
    signals.matchSoon ? '1' : '0',
    signals.weekendEvening ? '1' : '0',
  ].join('|')
}

async function getWeatherData(): Promise<{ temp: number; windGust: number; precipProb: number; precipMm: number }> {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=44.1194&longitude=15.2314&current=temperature_2m,wind_gusts_10m,precipitation&hourly=precipitation_probability&timezone=Europe/Zagreb&forecast_days=1'
    const res = await fetch(url)
    const data = await res.json()
    const hour = getZagrebHour()
    return {
      temp: data.current?.temperature_2m ?? 20,
      windGust: data.current?.wind_gusts_10m ?? 0,
      precipProb: data.hourly?.precipitation_probability?.[hour] ?? 0,
      precipMm: data.current?.precipitation ?? 0,
    }
  } catch {
    return { temp: 20, windGust: 0, precipProb: 0, precipMm: 0 }
  }
}

async function getLiveLocalMatch(supabase: any): Promise<{ live: boolean; upcoming3h: boolean }> {
  try {
    const now = new Date().toISOString()
    const threeHoursLater = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()

    const { data: liveMatches } = await supabase
      .from('sports_events')
      .select('id')
      .eq('is_local_team', true)
      .in('match_status', ['live', '1H', '2H', 'HT'])
      .limit(1)

    const { data: upcomingMatches } = await supabase
      .from('sports_events')
      .select('id')
      .eq('is_local_team', true)
      .eq('match_status', 'upcoming')
      .gte('start_time', now)
      .lte('start_time', threeHoursLater)
      .limit(1)

    return {
      live: (liveMatches?.length ?? 0) > 0,
      upcoming3h: (upcomingMatches?.length ?? 0) > 0,
    }
  } catch {
    return { live: false, upcoming3h: false }
  }
}

function buildContextSignals(
  weather: { temp: number; windGust: number; precipProb: number; precipMm: number },
  sport: { live: boolean; upcoming3h: boolean },
  hour: number,
  dayOfWeek: number
): ContextSignals {
  // Temperature band
  let tempBand: ContextSignals['tempBand'] = 'mild'
  if (weather.temp >= 34) tempBand = 'extreme'
  else if (weather.temp >= 30) tempBand = 'hot'
  else if (weather.temp <= 0) tempBand = 'cold'
  else if (weather.temp <= 5) tempBand = 'cold'

  return {
    rain: weather.precipProb >= 60 || weather.precipMm >= 0.3,
    strongWind: weather.windGust >= 45,
    tempBand,
    nightDay: (hour >= 6 && hour < 20) ? 'day' : 'night',
    liveMatch: sport.live,
    matchSoon: sport.upcoming3h,
    weekendEvening: (dayOfWeek === 5 || dayOfWeek === 6) && hour >= 20,
  }
}

function determinePoll(
  weather: { temp: number; windGust: number; precipProb: number; precipMm: number },
  sport: { live: boolean; upcoming3h: boolean },
  hour: number,
  dayOfWeek: number
): PollTemplate {
  // 1. DANGER WEATHER - Bura
  if (weather.windGust >= 45) {
    return {
      question: 'Je li bura danas ubila grad?',
      options: ['Ne izlazim', 'Samo kratko', 'Normalan dan', 'Volim buru'],
      context_type: 'weather',
      context_key: 'bura',
    }
  }

  // 2. RAIN
  if (weather.precipProb >= 60 || weather.precipMm >= 0.3) {
    return {
      question: 'Je li kiša pokvarila planove?',
      options: ['Da potpuno', 'Malo', 'Nimalo', 'Ionako sam doma'],
      context_type: 'weather',
      context_key: 'rain',
    }
  }

  // 3. HEAT
  if (weather.temp >= 34) {
    return {
      question: 'Pakao danas 🥵 gdje se hladite?',
      options: ['More', 'Klima', 'Posao pa patnja', 'Ne izlazim'],
      context_type: 'weather',
      context_key: 'heat',
    }
  }
  if (weather.temp >= 30) {
    return {
      question: 'Je li vas danas vrućina ubila?',
      options: ['Totalno', 'Podnošljivo', 'Volim ljeto', 'Jedva čekam večer'],
      context_type: 'weather',
      context_key: 'heat',
    }
  }

  // 4. COLD
  if (weather.temp <= 0) {
    return {
      question: 'Ledara danas ❄️ izlazite li?',
      options: ['Nema šanse', 'Samo kava', 'Normalno', 'Volim zimu'],
      context_type: 'weather',
      context_key: 'cold',
    }
  }
  if (weather.temp <= 5) {
    return {
      question: 'Koliko vam je danas hladno?',
      options: ['Prehladno', 'Ok uz jaknu', 'Nije strašno', 'Idealno'],
      context_type: 'weather',
      context_key: 'cold',
    }
  }

  // 5. LIVE SPORT
  if (sport.live) {
    return {
      question: 'Pratiš utakmicu?',
      options: ['Naravno', 'Bacim oko', 'Samo rezultat', 'Ne zanima me'],
      context_type: 'sport',
      context_key: 'match_live',
    }
  }

  // 6. MATCH EVENING
  if (sport.upcoming3h) {
    return {
      question: 'Gleda li se večeras utakmica?',
      options: ['Da', 'Ako stignem', 'Samo rezultat', 'Ne'],
      context_type: 'sport',
      context_key: 'match_live',
    }
  }

  // 7. WEEKEND NIGHT
  if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 20) {
    return {
      question: 'Gdje ste večeras?',
      options: ['Vani', 'Kava', 'Doma', 'Radim'],
      context_type: 'city',
      context_key: 'weekend',
    }
  }

  // 8. NICE WEATHER
  if (weather.temp >= 18 && weather.temp <= 27 && weather.windGust < 20 && weather.precipProb < 30) {
    return {
      question: 'Jeste li danas vani?',
      options: ['Cijeli dan', 'Malo', 'Ne', 'Kasnije'],
      context_type: 'weather',
      context_key: 'calm',
    }
  }

  // 9. FALLBACK
  return {
    question: 'Što radite danas?',
    options: ['Posao', 'Fakultet', 'Odmor', 'Ništa'],
    context_type: 'generic',
    context_key: 'calm',
  }
}

function computeExpiresAt(): string {
  const now = new Date()
  const zagreb = getZagrebDate()
  const tomorrow3am = new Date(zagreb)
  tomorrow3am.setDate(tomorrow3am.getDate() + 1)
  tomorrow3am.setHours(3, 0, 0, 0)
  const expiresAt = new Date(now.getTime() + (tomorrow3am.getTime() - zagreb.getTime()))
  return expiresAt.toISOString()
}

async function archivePoll(supabase: any, poll: any): Promise<void> {
  // Sum up votes from options
  const { data: options } = await supabase
    .from('poll_options')
    .select('votes_count')
    .eq('poll_id', poll.id)

  const totalVotes = (options || []).reduce((sum: number, o: any) => sum + o.votes_count, 0)

  await supabase.from('poll_history').insert({
    original_poll_id: poll.id,
    question_text: poll.question_text,
    context_type: poll.context_type,
    context_key: poll.context_key,
    context_hash: poll.context_hash,
    created_at: poll.created_at,
    expired_at: new Date().toISOString(),
    expire_reason: 'context_change',
    total_votes: totalVotes,
  })
}

async function expireCurrentPoll(supabase: any, poll: any): Promise<void> {
  // Archive first (votes stay in poll_votes table untouched)
  await archivePoll(supabase, poll)

  // Set expires_at to now so it's no longer active
  await supabase
    .from('daily_poll')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', poll.id)
}

async function createNewPoll(supabase: any, poll: PollTemplate, contextHash: string): Promise<any> {
  const { data: newPoll, error: pollError } = await supabase
    .from('daily_poll')
    .insert({
      question_text: poll.question,
      context_type: poll.context_type,
      context_key: poll.context_key,
      context_hash: contextHash,
      expires_at: computeExpiresAt(),
    })
    .select('id')
    .single()

  if (pollError) throw pollError

  const optionRows = poll.options.map(text => ({
    poll_id: newPoll.id,
    option_text: text,
  }))

  const { error: optError } = await supabase
    .from('poll_options')
    .insert(optionRows)

  if (optError) throw optError

  return newPoll
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Gather live data
    const [weather, sport] = await Promise.all([
      getWeatherData(),
      getLiveLocalMatch(supabase),
    ])

    const hour = getZagrebHour()
    const day = getZagrebDay()

    // Compute current context hash
    const signals = buildContextSignals(weather, sport, hour, day)
    const currentHash = computeContextHash(signals)

    // Check for active poll
    const { data: activePoll } = await supabase
      .from('daily_poll')
      .select('id, question_text, context_type, context_key, context_hash, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (activePoll) {
      // Compare context hash
      if (activePoll.context_hash === currentHash) {
        return new Response(
          JSON.stringify({ status: 'exists', poll_id: activePoll.id, context_hash: currentHash }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Context changed — archive old poll and create new one
      console.log(`Context changed: ${activePoll.context_hash} → ${currentHash}`)
      await expireCurrentPoll(supabase, activePoll)
    }

    // Create new poll
    const poll = determinePoll(weather, sport, hour, day)
    const newPoll = await createNewPoll(supabase, poll, currentHash)

    return new Response(
      JSON.stringify({
        status: activePoll ? 'regenerated' : 'created',
        poll_id: newPoll.id,
        question: poll.question,
        context_hash: currentHash,
        previous_poll_id: activePoll?.id || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
