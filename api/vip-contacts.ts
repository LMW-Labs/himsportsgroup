export const config = { runtime: 'edge' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_NOTES = 10_000

// Columns the client is allowed to see. Anything not listed never leaves the server.
const SELECT_COLS = [
  'id',
  'name',
  'name_verified',
  'organization',
  'current_org',
  'phone',
  'contact_role',
  'category',
  'years_known',
  'update_status',
  'notes',
].join(',')

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: { pin?: string; action?: string; id?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const adminPin = (process as any).env.ADMIN_PIN
  if (!adminPin || body.pin !== adminPin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // hims_vip_contacts RLS requires auth.uid(), which the anon key does not have.
  // This endpoint is the only gate in front of the service role key — keep it that way.
  const supabaseUrl = (process as any).env.PUBLIC_SUPABASE_URL
  const serviceKey  = (process as any).env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Missing Supabase config' }, 500)
  }

  const headers = {
    apikey:         serviceKey,
    Authorization:  `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  // ── Read: full contact list ────────────────────────────────────────────────
  if (body.action === 'list') {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/hims_vip_contacts?select=${SELECT_COLS}&order=name.asc`,
      { headers },
    )
    if (!res.ok) {
      return json({ error: 'Failed to load contacts' }, 500)
    }
    return json({ contacts: await res.json() })
  }

  // ── Write: notes only ──────────────────────────────────────────────────────
  // The PATCH payload is constructed here, not taken from the request, so no
  // other column is reachable no matter what the client sends.
  if (body.action === 'updateNotes') {
    if (!body.id || !UUID_RE.test(body.id)) {
      return json({ error: 'Invalid contact id' }, 400)
    }

    const notes = typeof body.notes === 'string' ? body.notes : ''
    if (notes.length > MAX_NOTES) {
      return json({ error: `Notes must be under ${MAX_NOTES} characters` }, 400)
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/hims_vip_contacts?id=eq.${body.id}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({ notes: notes.trim() === '' ? null : notes }),
      },
    )

    if (!res.ok) {
      return json({ error: 'Failed to save notes' }, 500)
    }

    const rows: { notes: string | null }[] = await res.json()
    if (!rows.length) {
      return json({ error: 'Contact not found' }, 404)
    }

    return json({ ok: true, notes: rows[0].notes })
  }

  return json({ error: 'Unknown action' }, 400)
}
