export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: { pin: string; athleteName: string; effectiveDate: string; termYears: number }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const adminPin = (process as any).env.ADMIN_PIN
  if (!adminPin || body.pin !== adminPin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl  = (process as any).env.PUBLIC_SUPABASE_URL
  const supabaseKey  = (process as any).env.PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/nil_agreements`, {
    method: 'POST',
    headers: {
      apikey:          supabaseKey,
      Authorization:   `Bearer ${supabaseKey}`,
      'Content-Type':  'application/json',
      Prefer:          'return=representation',
    },
    body: JSON.stringify({
      athlete_name:   body.athleteName,
      effective_date: body.effectiveDate,
      term_years:     body.termYears,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  const rows: { agreement_url_token: string }[] = await res.json()
  const token = rows[0]?.agreement_url_token

  if (!token) {
    return new Response(JSON.stringify({ error: 'No token returned' }), { status: 500 })
  }

  return new Response(JSON.stringify({ token }), { status: 200 })
}
