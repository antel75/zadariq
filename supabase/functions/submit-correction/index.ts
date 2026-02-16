import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
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

    const body = await req.json()
    const { entity_type, entity_id, field_name, old_value, proposed_value, fingerprint, action } = body

    if (!entity_type || !entity_id || !field_name || !fingerprint) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const fingerprint_hash = await hashString(fingerprint)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ip_hash = await hashString(ip)

    // Rate limit: max 5 per 10 min per fingerprint
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('pending_changes')
      .select('*', { count: 'exact', head: true })
      .eq('fingerprint_hash', fingerprint_hash)
      .gte('created_at', tenMinAgo)

    if ((recentCount ?? 0) >= 5) {
      // Silent accept - user sees "thanks" but we don't store
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if this fingerprint has more rejected than approved → shadow reject
    const { data: history } = await supabase
      .from('pending_changes')
      .select('status')
      .eq('fingerprint_hash', fingerprint_hash)

    const approved = history?.filter(h => h.status === 'approved').length ?? 0
    const rejected = history?.filter(h => h.status === 'rejected' || h.status === 'shadow_rejected').length ?? 0
    const isTrusted = approved >= 3
    const shouldShadowReject = rejected > approved && rejected >= 2

    let status = 'pending'
    let confidence_score = 50

    if (shouldShadowReject) {
      status = 'shadow_rejected'
      confidence_score = 10
    }

    // action=delete always requires manual approval
    if (action === 'delete') {
      confidence_score = Math.min(confidence_score, 30)
    }

    // Check if 3+ different fingerprints proposed same value → auto approve
    if (proposed_value && status === 'pending') {
      const { data: similar } = await supabase
        .from('pending_changes')
        .select('fingerprint_hash')
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .eq('field_name', field_name)
        .eq('proposed_value', proposed_value)
        .eq('status', 'pending')

      const uniqueFingerprints = new Set(similar?.map(s => s.fingerprint_hash) ?? [])
      uniqueFingerprints.add(fingerprint_hash)

      if (uniqueFingerprints.size >= 3) {
        // Auto approve all matching pending
        await supabase
          .from('pending_changes')
          .update({ status: 'approved' })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)
          .eq('field_name', field_name)
          .eq('proposed_value', proposed_value)
          .eq('status', 'pending')

        status = 'approved'
        confidence_score = 90
      } else {
        confidence_score = 50 + uniqueFingerprints.size * 15
      }
    }

    // Trusted user auto-approve for hours/phone (not delete)
    if (isTrusted && action !== 'delete' && ['workingHours', 'phone'].includes(field_name) && status === 'pending') {
      status = 'approved'
      confidence_score = 85
    }

    // Insert
    await supabase.from('pending_changes').insert({
      entity_type,
      entity_id,
      field_name,
      old_value: old_value || null,
      proposed_value: proposed_value || null,
      fingerprint_hash,
      ip_hash,
      status,
      confidence_score,
    })

    // Always return success
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
