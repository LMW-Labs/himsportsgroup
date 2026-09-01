export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const adminPin   = (process as any).env.ADMIN_PIN
  const supabaseUrl = (process as any).env.PUBLIC_SUPABASE_URL
  const serviceKey  = (process as any).env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 })
  }

  const sb = (path: string, opts: RequestInit = {}) =>
    fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(opts.headers as Record<string, string> ?? {}),
      },
    })

  // ── GET: fetch all CRM data ────────────────────────────────────────────────
  if (request.method === 'GET') {
    const pin = request.headers.get('x-admin-pin')
    if (!adminPin || pin !== adminPin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const [leadsRes, rosterRes, agreementsRes] = await Promise.all([
      sb('inquiries?select=*&order=created_at.desc'),
      sb('athletes?select=id,name,sport,school,position,status,email,phone,published,featured,created_at&order=name'),
      sb('nil_agreements?select=*&order=created_at.desc'),
    ])

    if (!leadsRes.ok || !rosterRes.ok || !agreementsRes.ok) {
      return new Response(JSON.stringify({ error: 'Supabase fetch failed' }), { status: 500 })
    }

    const [leads, roster, agreements] = await Promise.all([
      leadsRes.json(),
      rosterRes.json(),
      agreementsRes.json(),
    ])

    return new Response(JSON.stringify({ leads, roster, agreements }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── PATCH: update a record ─────────────────────────────────────────────────
  if (request.method === 'PATCH') {
    let body: { pin: string; table: string; id: string; updates: Record<string, unknown> }
    try { body = await request.json() }
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }

    if (!adminPin || body.pin !== adminPin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const allowed = ['inquiries', 'athletes']
    if (!allowed.includes(body.table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), { status: 400 })
    }

    const res = await sb(`${body.table}?id=eq.${body.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body.updates),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}
