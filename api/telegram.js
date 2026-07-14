import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'

// ── Supabase admin client ──────────────────────────────────────────────────
const db = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Bot ───────────────────────────────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

function log(action, playerName) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, player: playerName ?? null }))
}

// ── Session helpers ───────────────────────────────────────────────────────
async function getSession(chatId) {
  const { data } = await db.from('bot_sessions').select('*').eq('chat_id', chatId).maybeSingle()
  return data
}

async function setSession(chatId, updates) {
  const { error } = await db
    .from('bot_sessions')
    .upsert({ chat_id: chatId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'chat_id' })
  if (error) throw error
}

async function clearSession(chatId) {
  await db.from('bot_sessions').delete().eq('chat_id', chatId)
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD DEFINITIONS — the complete record the bot must collect + validate
// before an athlete can be published. Order here is the prompting order.
// ═══════════════════════════════════════════════════════════════════════════
const FIELDS = [
  { key: 'photo',       label: 'profile photo',      prompt: 'Send the athlete\'s *profile photo* (as an image).' },
  { key: 'name',        label: 'first + last name',  prompt: 'What\'s the athlete\'s *full name*? (first and last)' },
  { key: 'school',      label: 'school',             prompt: 'What *school* do they attend?' },
  { key: 'school_type', label: 'school type',        prompt: 'What *type* of school? Reply *prep*, *juco*, or *international*.' },
  { key: 'position',    label: 'position',           prompt: 'What *position* do they play?' },
  { key: 'height',      label: 'height',             prompt: 'What\'s their *height*? (e.g. `6\'2"`, `6 2`, or `74`)' },
  { key: 'social',      label: 'social handle',      prompt: 'Their main *social handle with platform*? (e.g. `instagram @jdoe`)' },
]
const REQUIRED_KEYS = FIELDS.map(f => f.key)
const fieldDef = key => FIELDS.find(f => f.key === key)

// ── Validators / parsers ────────────────────────────────────────────────────

// Height → integer inches (canonical). Accepts 6'2", 6'2, 6 2, 6ft2, 6 foot 2,
// 6-2, or a bare inches number like 74. Returns null if it can't parse safely.
function parseHeight(raw) {
  const s = String(raw).trim().toLowerCase()

  // bare inches: "74"
  if (/^\d{2,3}$/.test(s)) {
    const n = parseInt(s, 10)
    return (n >= 48 && n <= 96) ? n : null
  }
  // feet + inches in many separators: 6'2", 6'2, 6 2, 6ft2, 6 foot 2, 6-2
  const m = s.match(/^(\d)\s*(?:'|’|ft|foot|feet|-|\s)\s*(\d{1,2})?\s*(?:"|”|''|in|inch|inches)?$/)
  if (m) {
    const ft = parseInt(m[1], 10)
    const inch = m[2] ? parseInt(m[2], 10) : 0
    if (inch > 11) return null
    const total = ft * 12 + inch
    return (total >= 48 && total <= 96) ? total : null
  }
  // feet only: "6'" or "6 ft"
  const mf = s.match(/^(\d)\s*(?:'|’|ft|foot|feet)$/)
  if (mf) {
    const total = parseInt(mf[1], 10) * 12
    return (total >= 48 && total <= 96) ? total : null
  }
  return null
}

// inches → display "6'2\""
function formatHeight(inches) {
  if (inches == null) return null
  const ft = Math.floor(inches / 12)
  const inch = inches % 12
  return `${ft}'${inch}"`
}

// school type: normalize synonyms to the DB's controlled vocabulary
function parseSchoolType(raw) {
  const s = String(raw).trim().toLowerCase()
  if (/(^|\b)(prep|prep school|preparatory|high school|hs)($|\b)/.test(s)) return 'prep'
  if (/(^|\b)(juco|juco school|jc|junior college|cc|community college)($|\b)/.test(s)) return 'juco'
  if (/(^|\b)(international|intl|overseas|abroad|foreign)($|\b)/.test(s)) return 'international'
  return null
}

// social handle + platform → { platform, handle } mapped to a real DB column
const PLATFORM_MAP = {
  instagram: 'instagram', ig: 'instagram', insta: 'instagram',
  twitter: 'twitter', x: 'twitter',
  tiktok: 'tiktok', tt: 'tiktok',
}
function parseSocial(raw) {
  const s = String(raw).trim()
  // "instagram @jdoe" | "ig: jdoe" | "x @jdoe" | "tiktok jdoe"
  const m = s.match(/^([a-z]+)\s*[:\s]\s*@?([A-Za-z0-9._]+)$/i)
  if (m) {
    const platform = PLATFORM_MAP[m[1].toLowerCase()]
    if (platform) return { platform, handle: m[2].replace(/^@/, '') }
  }
  // bare "@jdoe" with no platform is not enough — platform is required
  return null
}

// name → require at least first + last
function parseName(raw) {
  const parts = String(raw).trim().replace(/\s+/g, ' ').split(' ')
  if (parts.length < 2) return null
  return {
    name: parts.join(' '),
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  }
}

// ── State-machine core ──────────────────────────────────────────────────────

// Which required field (in order) is still neither filled nor intentionally omitted?
function nextMissing(pd, omitted) {
  const done = new Set(omitted || [])
  for (const key of REQUIRED_KEYS) {
    if (done.has(key)) continue
    if (key === 'photo'  && pd.photo_url)     continue
    if (key === 'name'   && pd.name)          continue
    if (key === 'school' && pd.school)        continue
    if (key === 'school_type' && pd.school_type) continue
    if (key === 'position' && pd.position)    continue
    if (key === 'height' && pd.height_inches != null) continue
    if (key === 'social' && pd.social_handle) continue
    return key
  }
  return null
}

// Store a validated value for a field on the accumulating player_data.
// Returns { ok, error } — error is a re-prompt hint if validation failed.
function applyField(pd, key, text) {
  switch (key) {
    case 'name': {
      const n = parseName(text)
      if (!n) return { ok: false, error: 'I need *both* a first and last name. Try again (e.g. `Trey Alexander`).' }
      Object.assign(pd, n)
      return { ok: true }
    }
    case 'school':
      pd.school = text.trim()
      return { ok: true }
    case 'school_type': {
      const t = parseSchoolType(text)
      if (!t) return { ok: false, error: 'Reply *prep*, *juco*, or *international*.' }
      pd.school_type = t
      return { ok: true }
    }
    case 'position':
      pd.position = text.trim().toUpperCase()
      return { ok: true }
    case 'height': {
      const inches = parseHeight(text)
      if (inches == null) return { ok: false, error: 'Couldn\'t read that height. Try `6\'2"`, `6 2`, or inches like `74`.' }
      pd.height_inches = inches
      return { ok: true }
    }
    case 'social': {
      const soc = parseSocial(text)
      if (!soc) return { ok: false, error: 'I need the *platform and handle* together, e.g. `instagram @jdoe`, `x @jdoe`, or `tiktok @jdoe`.' }
      pd.social_platform = soc.platform
      pd.social_handle = soc.handle
      return { ok: true }
    }
    default:
      return { ok: false, error: 'Unknown field.' }
  }
}

// Ask for the next missing field, or move to the publish preview if complete.
async function advance(ctx, chatId, pd, omitted) {
  const next = nextMissing(pd, omitted)
  if (!next) {
    return sendPreview(ctx, chatId, pd, omitted)
  }
  await setSession(chatId, { step: 'collecting', awaiting: next, player_data: pd, omitted })
  const f = fieldDef(next)
  const hint = next === 'photo' ? '' : '\n\n_Reply_ *skip* _to intentionally leave this blank._'
  await ctx.reply(`${f.prompt}${hint}`, { parse_mode: 'Markdown' })
}

// ── Photo storage ─────────────────────────────────────────────────────────
async function storePhoto(telegramUrl, playerName) {
  const slug = (playerName || 'athlete').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${slug}-${Date.now()}.jpg`
  const response = await fetch(telegramUrl)
  if (!response.ok) throw new Error(`Failed to fetch photo: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  const { error } = await db.storage.from('athlete-photos').upload(filename, arrayBuffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = db.storage.from('athlete-photos').getPublicUrl(filename)
  return publicUrl
}

// ── Athlete insert ────────────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(name) {
  const base = slugify(name)
  let slug = base, i = 1
  for (;;) {
    const { data } = await db.from('athletes').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

async function insertAthlete(pd) {
  const slug = await uniqueSlug(pd.name)
  const row = {
    slug,
    name: pd.name,
    school: pd.school || null,
    school_type: pd.school_type || null,
    position: pd.position || null,
    height_inches: pd.height_inches ?? null,
    sport: 'basketball',
    status: 'nil_client',
    photo_url: pd.photo_url || null,
    published: true,
    featured: false,
  }
  // social handle lands in the platform-specific column the frontend renders
  if (pd.social_platform && pd.social_handle) row[pd.social_platform] = pd.social_handle

  const { data, error } = await db.from('athletes').insert(row).select().single()
  if (error) throw error
  return data
}

// ── Deploy trigger ────────────────────────────────────────────────────────
async function triggerDeploy() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) { console.warn('VERCEL_DEPLOY_HOOK_URL not set'); return }
  const res = await fetch(hookUrl, { method: 'POST' })
  if (!res.ok) console.error('Deploy hook failed:', res.status)
}

// ── Publish preview ─────────────────────────────────────────────────────────
function summarize(pd, omitted) {
  const done = new Set(omitted || [])
  const blank = '_(left blank)_'
  const line = (label, key, val) => `*${label}:* ${done.has(key) ? blank : (val ?? blank)}`
  const social = pd.social_handle ? `${pd.social_platform} @${pd.social_handle}` : null
  return [
    '📋 *Preview — review before publishing:*',
    '',
    line('Name', 'name', pd.name),
    line('School', 'school', pd.school),
    line('School type', 'school_type', pd.school_type),
    line('Position', 'position', pd.position),
    line('Height', 'height', formatHeight(pd.height_inches)),
    line('Social', 'social', social),
    line('Photo', 'photo', pd.photo_url ? 'attached' : null),
  ].join('\n')
}

async function sendPreview(ctx, chatId, pd, omitted) {
  await setSession(chatId, { step: 'await_confirm', awaiting: null, player_data: pd, omitted })
  const summary = summarize(pd, omitted)
  const omittedCount = (omitted || []).length
  const tail = omittedCount > 0
    ? `\n\n⚠️ ${omittedCount} field${omittedCount > 1 ? 's' : ''} left blank on purpose.`
    : ''
  const footer = '\n\nReply *APPROVE* to publish, or *CANCEL* to discard.'
  if (pd.photo_url) {
    try { await ctx.replyWithPhoto(pd.photo_url, { caption: summary + tail + footer, parse_mode: 'Markdown' }) }
    catch { await ctx.reply(summary + tail + footer + `\n\nPhoto: ${pd.photo_url}`, { parse_mode: 'Markdown' }) }
  } else {
    await ctx.reply(summary + tail + footer, { parse_mode: 'Markdown' })
  }
}

// ── Command detection ────────────────────────────────────────────────────────
function isStartCommand(text) {
  return /^\/?(add(\s+player)?|start|new)\b/i.test(text)
}

const HELP = 'To add an athlete, send `Add player` and I\'ll walk you through it — photo, name, school + type, position, height, and a social handle. I won\'t publish until the record is complete (or you confirm what you\'re leaving blank).'

// ═══════════════════════════════════════════════════════════════════════════
// TEXT HANDLER
// ═══════════════════════════════════════════════════════════════════════════
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id
  const text = ctx.message.text.trim()
  const session = await getSession(chatId)
  const step = session?.step ?? 'idle'
  const upper = text.toUpperCase()

  // Global: cancel anytime
  if (upper === 'CANCEL') {
    if (step !== 'idle') log('cancelled', session?.player_data?.name)
    await clearSession(chatId)
    await ctx.reply('Cancelled. Nothing was saved.')
    return
  }

  // Start / restart a collection
  if (isStartCommand(text)) {
    const pd = {}
    await setSession(chatId, { step: 'collecting', awaiting: null, player_data: pd, omitted: [] })
    await ctx.reply('Let\'s build a complete athlete record. I\'ll ask for each field.', { parse_mode: 'Markdown' })
    await advance(ctx, chatId, pd, [])
    return
  }

  // Awaiting confirmation of an intentional omission
  if (step === 'await_omit_confirm') {
    const pd = session.player_data || {}
    const omitField = session.pending_omit
    if (upper === 'CONFIRM') {
      const omitted = Array.from(new Set([...(session.omitted || []), omitField]))
      log('field_omitted', pd.name)
      await ctx.reply(`Okay — *${fieldDef(omitField)?.label}* left blank.`, { parse_mode: 'Markdown' })
      await advance(ctx, chatId, pd, omitted)
    } else {
      // They typed a value instead of confirming → treat as providing it
      const res = applyField(pd, omitField, text)
      if (!res.ok) {
        await ctx.reply(`${res.error}\n\n_Or reply_ *CONFIRM* _to leave_ *${fieldDef(omitField)?.label}* _blank._`, { parse_mode: 'Markdown' })
        return
      }
      await advance(ctx, chatId, pd, session.omitted || [])
    }
    return
  }

  // Collecting a specific field
  if (step === 'collecting') {
    const pd = session.player_data || {}
    const awaiting = session.awaiting
    const omitted = session.omitted || []

    if (!awaiting) { await advance(ctx, chatId, pd, omitted); return }

    // Intentional skip → require explicit confirmation before it counts
    if (upper === 'SKIP') {
      if (awaiting === 'photo') {
        await setSession(chatId, { step: 'await_omit_confirm', pending_omit: 'photo', player_data: pd, omitted })
        await ctx.reply('Publish this athlete with *no photo*? Reply *CONFIRM* to omit, or send the image.', { parse_mode: 'Markdown' })
        return
      }
      await setSession(chatId, { step: 'await_omit_confirm', pending_omit: awaiting, player_data: pd, omitted })
      await ctx.reply(`Leave *${fieldDef(awaiting)?.label}* blank? Reply *CONFIRM* to omit, or just send the value.`, { parse_mode: 'Markdown' })
      return
    }

    // Photo is collected via the photo handler, not text
    if (awaiting === 'photo') {
      await ctx.reply('Please *send an image* for the photo, or reply *skip* to omit it.', { parse_mode: 'Markdown' })
      return
    }

    const res = applyField(pd, awaiting, text)
    if (!res.ok) { await ctx.reply(res.error, { parse_mode: 'Markdown' }); return }
    await advance(ctx, chatId, pd, omitted)
    return
  }

  // Final publish gate
  if (step === 'await_confirm') {
    if (upper === 'APPROVE') {
      const pd = session.player_data || {}
      try {
        await insertAthlete(pd)
        await triggerDeploy()
        await clearSession(chatId)
        log('approved', pd.name)
        await ctx.reply(`✅ *${pd.name}* has been published. The site will rebuild shortly.`, { parse_mode: 'Markdown' })
      } catch (err) {
        console.error('Approve error:', err)
        await ctx.reply('Something went wrong saving the athlete. Please try again.')
      }
    } else {
      await ctx.reply('Reply *APPROVE* to publish or *CANCEL* to discard.', { parse_mode: 'Markdown' })
    }
    return
  }

  // Idle
  await ctx.reply(HELP, { parse_mode: 'Markdown' })
})

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO HANDLER
// ═══════════════════════════════════════════════════════════════════════════
bot.on('photo', async (ctx) => {
  const chatId = ctx.chat.id
  const session = await getSession(chatId)
  const step = session?.step ?? 'idle'

  if (step !== 'collecting' && step !== 'await_omit_confirm' && step !== 'await_confirm') {
    await ctx.reply('Send `Add player` to get started.', { parse_mode: 'Markdown' })
    return
  }

  const pd = session.player_data || {}
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
  try {
    await ctx.reply('Uploading photo...')
    const fileLink = await ctx.telegram.getFileLink(fileId)
    pd.photo_url = await storePhoto(fileLink.href, pd.name)
    // A photo removes 'photo' from any prior omission
    const omitted = (session.omitted || []).filter(k => k !== 'photo')
    await ctx.reply('✅ Photo saved.')
    await advance(ctx, chatId, pd, omitted)
  } catch (err) {
    console.error('Photo error:', err)
    await ctx.reply('Could not process the photo. Please try again.')
  }
})

// ── Vercel handler ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    console.log('[bot] update received:', body?.message?.text ?? body?.update_id)
    await bot.handleUpdate(body)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[bot] error:', err.message)
    res.status(200).json({ ok: true })
  }
}
