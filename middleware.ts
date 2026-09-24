// Vercel Routing Middleware — maintenance-mode kill switch ("plan B").
//
// When maintenance is on, every page request gets public/maintenance.html
// with a 503 (tells Google "temporary, don't de-index"). API routes keep
// working so the Telegram bot, NIL portal emails, etc. are unaffected.
//
// Turn it on either way:
//   1. Instant, no redeploy: Vercel → Storage → Edge Config, connect a store to
//      this project (sets EDGE_CONFIG), then set the item  "maintenance": true
//   2. Fallback: env var MAINTENANCE_MODE=on, then redeploy the CURRENT
//      production deployment.
//
// Preview the real site while maintenance is on: visit any page with
// ?bypass=<MAINTENANCE_BYPASS> once; a cookie keeps you through for 12 hours.

export const config = {
  matcher: ['/((?!api/|_astro/|_vercel/|maintenance\\.html|logo\\.png|favicon).*)'],
}

const BYPASS_COOKIE = 'hims_bypass'

async function edgeConfigSaysMaintenance(): Promise<boolean> {
  const conn = process.env.EDGE_CONFIG
  if (!conn) return false
  try {
    // Connection string: https://edge-config.vercel.com/<id>?token=<token>
    const url = new URL(conn)
    url.pathname = `${url.pathname.replace(/\/$/, '')}/item/maintenance`
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return false
    return (await res.json()) === true
  } catch {
    // Never take the site down because the switch itself is unreachable
    return false
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const envOn = process.env.MAINTENANCE_MODE === 'on'
  if (!envOn && !(await edgeConfigSaysMaintenance())) return undefined

  const url = new URL(request.url)
  const secret = process.env.MAINTENANCE_BYPASS

  if (secret) {
    if (url.searchParams.get('bypass') === secret) {
      url.searchParams.delete('bypass')
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.toString(),
          'Set-Cookie': `${BYPASS_COOKIE}=${secret}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Lax`,
        },
      })
    }
    const cookies = request.headers.get('cookie') ?? ''
    if (cookies.split(/;\s*/).includes(`${BYPASS_COOKIE}=${secret}`)) return undefined
  }

  const page = await fetch(new URL('/maintenance.html', url.origin))
  return new Response(page.body, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '3600',
    },
  })
}
