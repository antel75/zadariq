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

function getZagrebHour(): number {
  const now = new Date()
  const zagreb = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }))
  return zagreb.getHours()
}

function getZagrebDay(): number {
  const now = new Date()
  const zagreb = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }))
  return zagreb.getDay() // 0=Sun, 5=Fri, 6=Sat
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if active poll exists
    const { data: activePoll } = await supabase
      .from('daily_poll')
      .select('id')
      .gt('expires_at', new Date().toISOString())
      .limit(1)

    if (activePoll && activePoll.length > 0) {
      return new Response(
        JSON.stringify({ status: 'exists', poll_id: activePoll[0].id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gather data
    const [weather, sport] = await Promise.all([
      getWeatherData(),
      getLiveLocalMatch(supabase),
    ])

    const hour = getZagrebHour()
    const day = getZagrebDay()
    const poll = determinePoll(weather, sport, hour, day)

    // Expires at 03:00 next day Zagreb time
    const now = new Date()
    const zagreb = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }))
    const tomorrow3am = new Date(zagreb)
    tomorrow3am.setDate(tomorrow3am.getDate() + 1)
    tomorrow3am.setHours(3, 0, 0, 0)
    // Convert back to UTC approximately
    const expiresAt = new Date(now.getTime() + (tomorrow3am.getTime() - zagreb.getTime()))

    // Insert poll
    const { data: newPoll, error: pollError } = await supabase
      .from('daily_poll')
      .insert({
        question_text: poll.question,
        context_type: poll.context_type,
        context_key: poll.context_key,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (pollError) throw pollError

    // Insert options
    const optionRows = poll.options.map(text => ({
      poll_id: newPoll.id,
      option_text: text,
    }))

    const { error: optError } = await supabase
      .from('poll_options')
      .insert(optionRows)

    if (optError) throw optError

    return new Response(
      JSON.stringify({ status: 'created', poll_id: newPoll.id, question: poll.question }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
