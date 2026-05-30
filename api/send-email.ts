export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const resendKey = (process as any).env.RESEND_API_KEY
  const adminEmail = (process as any).env.ADMIN_EMAIL

  if (!resendKey || !adminEmail) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 })
  }

  let body: { athleteName: string; signedAt: string; athleteEmail?: string | null }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { athleteName, signedAt, athleteEmail } = body

  const timestamp = new Date(signedAt).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const send = (to: string[], subject: string, html: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'HIMS Agreements <agreements@himsportsgroup.com>', to, subject, html }),
    })

  await send(
    [adminEmail],
    `NIL Agreement Signed — ${athleteName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1A72E8">NIL Agreement Signed</h2>
      <p><strong>${athleteName}</strong> has signed their NIL Representation Agreement.</p>
      <p><strong>Signed:</strong> ${timestamp} CST</p>
      ${athleteEmail ? `<p><strong>Athlete email:</strong> ${athleteEmail}</p>` : ''}
      <p style="margin-top:32px;color:#888;font-size:13px">— Hyche International Management Sports Group</p>
    </div>`,
  )

  if (athleteEmail) {
    await send(
      [athleteEmail],
      'Your NIL Representation Agreement — Hyche International Management Sports Group',
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1A72E8">Agreement Signed</h2>
        <p>Hello ${athleteName},</p>
        <p>Your Exclusive NIL Representation Agreement with Hyche International Management Sports Group has been signed and recorded.</p>
        <p><strong>Signed:</strong> ${timestamp} CST</p>
        <p>Christopher Hyche will be in touch shortly to begin working on your NIL opportunities.</p>
        <p style="margin-top:32px">Welcome to the team.</p>
        <p style="color:#888;font-size:13px;margin-top:16px">— Christopher Hyche<br>Hyche International Management Sports Group</p>
      </div>`,
    )
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
