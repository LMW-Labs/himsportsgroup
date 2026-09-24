export const config = { runtime: 'edge' }

// Daily Vercel Cron (see vercel.json). Supabase free tier pauses a project after
// ~7 days without activity; a paused DB made a rebuild ship an empty roster.
// One tiny read a day keeps it awake.
export default async function handler(request: Request): Promise<Response> {
  const cronSecret = (process as any).env.CRON_SECRET
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = (process as any).env.PUBLIC_SUPABASE_URL
  const anonKey     = (process as any).env.PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase config' }), { status: 500 })
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/athletes?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(10000),
    })
    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { status: res.ok ? 200 : 502 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 502 })
  }
}
