export async function triggerDeploy() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) {
    console.warn('VERCEL_DEPLOY_HOOK_URL not set — skipping rebuild')
    return
  }
  const res = await fetch(hookUrl, { method: 'POST' })
  if (!res.ok) console.error('Deploy hook failed:', res.status)
}
