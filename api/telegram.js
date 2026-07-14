import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'

// ── Supabase admin client ──────────────────────────────────────────────────
const db = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Canonical public site origin for building athlete-facing links (no window on
// the server). Override with PUBLIC_SITE_URL in Vercel if the domain changes.
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://himsportsgroup.com').replace(/\/$/, '')

// ── Bot ───────────────────────────────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

function log(action, flow, subject) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, flow: flow ?? null, subject: subject ?? null }))
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
// SHARED PARSERS / VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════

// Height → integer inches (canonical). Accepts 6'2", 6'2, 6 2, 6ft2, 6 foot 2,
// 6-2, or a bare inches number like 74. Returns null if it can't parse safely.
function parseHeight(raw) {
  const s = String(raw).trim().toLowerCase()
  if (/^\d{2,3}$/.test(s)) {
    const n = parseInt(s, 10)
    return (n >= 48 && n <= 96) ? n : null
  }
  const m = s.match(/^(\d)\s*(?:'|’|ft|foot|feet|-|\s)\s*(\d{1,2})?\s*(?:"|”|''|in|inch|inches)?$/)
  if (m) {
    const ft = parseInt(m[1], 10)
    const inch = m[2] ? parseInt(m[2], 10) : 0
    if (inch > 11) return null
    const total = ft * 12 + inch
    return (total >= 48 && total <= 96) ? total : null
  }
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

const PLATFORM_MAP = {
  instagram: 'instagram', ig: 'instagram', insta: 'instagram',
  twitter: 'twitter', x: 'twitter',
  tiktok: 'tiktok', tt: 'tiktok',
}
function parseSocial(raw) {
  const s = String(raw).trim()
  const m = s.match(/^([a-z]+)\s*[:\s]\s*@?([A-Za-z0-9._]+)$/i)
  if (m) {
    const platform = PLATFORM_MAP[m[1].toLowerCase()]
    if (platform) return { platform, handle: m[2].replace(/^@/, '') }
  }
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

// effective date → canonical YYYY-MM-DD. Accepts "today", ISO, MM/DD/YYYY,
// or anything Date can parse (e.g. "Jan 5 2026"). Returns null if invalid.
function parseDate(raw) {
  const s = String(raw).trim().toLowerCase()
  const iso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  if (s === 'today' || s === 'now') return iso()
  // Already ISO
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const d = new Date(`${s}T00:00:00Z`)
    return isNaN(d.getTime()) ? null : s
  }
  // MM/DD/YYYY or M/D/YY
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    let [, mm, dd, yy] = m
    if (yy.length === 2) yy = '20' + yy
    const month = parseInt(mm, 10), day = parseInt(dd, 10), year = parseInt(yy, 10)
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    const d = new Date(Date.UTC(year, month - 1, day))
    if (isNaN(d.getTime())) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  // Fallback: let Date try (e.g. "January 5, 2026")
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseTermYears(raw) {
  const s = String(raw).trim().match(/^(\d{1,2})/)
  if (!s) return null
  const n = parseInt(s[1], 10)
  return (n >= 1 && n <= 10) ? n : null
}

// ── Storage / slug helpers ──────────────────────────────────────────────────
async function storePhoto(telegramUrl, subject, bucket) {
  const slug = (subject || 'file').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${slug}-${Date.now()}.jpg`
  const response = await fetch(telegramUrl)
  if (!response.ok) throw new Error(`Failed to fetch photo: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  const { error } = await db.storage.from(bucket).upload(filename, arrayBuffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = db.storage.from(bucket).getPublicUrl(filename)
  return publicUrl
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(table, name) {
  const base = slugify(name) || 'item'
  let slug = base, i = 1
  for (;;) {
    const { data } = await db.from(table).select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

async function triggerDeploy() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) { console.warn('VERCEL_DEPLOY_HOOK_URL not set'); return }
  const res = await fetch(hookUrl, { method: 'POST' })
  if (!res.ok) console.error('Deploy hook failed:', res.status)
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOW REGISTRY
// Each flow is a self-contained spec the shared state machine drives:
//   fields    — prompting order; type 'photo' collected via image, else text
//   isFilled  — has this field been satisfied on the accumulator (pd)?
//   apply     — validate + store a text value → { ok, error }
//   photoKey  — which field (if any) is the photo; how to store the URL
//   summarize — preview lines
//   finalize  — persist + side effects; returns the success reply string
// ═══════════════════════════════════════════════════════════════════════════

const SKIP_HINT = '\n\n_Reply_ *skip* _to intentionally leave this blank._'

// ── ROSTER (athlete intake) — behavior preserved from the prior bot ─────────
const rosterFlow = {
  name: 'roster',
  intro: "Let's build a complete athlete record. I'll ask for each field.",
  photoKey: 'photo',
  fields: [
    { key: 'photo',       label: 'profile photo', type: 'photo', skippable: true, prompt: "Send the athlete's *profile photo* (as an image)." },
    { key: 'name',        label: 'first + last name', skippable: true, prompt: "What's the athlete's *full name*? (first and last)" },
    { key: 'school',      label: 'school', skippable: true, prompt: 'What *school* do they attend?' },
    { key: 'school_type', label: 'school type', skippable: true, prompt: 'What *type* of school? Reply *prep*, *juco*, or *international*.' },
    { key: 'position',    label: 'position', skippable: true, prompt: 'What *position* do they play?' },
    { key: 'height',      label: 'height', skippable: true, prompt: "What's their *height*? (e.g. `6'2\"`, `6 2`, or `74`)" },
    { key: 'social',      label: 'social handle', skippable: true, prompt: 'Their main *social handle with platform*? (e.g. `instagram @jdoe`)' },
  ],
  isFilled(pd, key) {
    switch (key) {
      case 'photo':       return !!pd.photo_url
      case 'name':        return !!pd.name
      case 'school':      return !!pd.school
      case 'school_type': return !!pd.school_type
      case 'position':    return !!pd.position
      case 'height':      return pd.height_inches != null
      case 'social':      return !!pd.social_handle
      default:            return false
    }
  },
  storePhoto(pd, url) { pd.photo_url = url },
  apply(pd, key, text) {
    switch (key) {
      case 'name': {
        const n = parseName(text)
        if (!n) return { ok: false, error: 'I need *both* a first and last name. Try again (e.g. `Trey Alexander`).' }
        Object.assign(pd, n); return { ok: true }
      }
      case 'school': pd.school = text.trim(); return { ok: true }
      case 'school_type': {
        const t = parseSchoolType(text)
        if (!t) return { ok: false, error: 'Reply *prep*, *juco*, or *international*.' }
        pd.school_type = t; return { ok: true }
      }
      case 'position': pd.position = text.trim().toUpperCase(); return { ok: true }
      case 'height': {
        const inches = parseHeight(text)
        if (inches == null) return { ok: false, error: 'Couldn\'t read that height. Try `6\'2"`, `6 2`, or inches like `74`.' }
        pd.height_inches = inches; return { ok: true }
      }
      case 'social': {
        const soc = parseSocial(text)
        if (!soc) return { ok: false, error: 'I need the *platform and handle* together, e.g. `instagram @jdoe`, `x @jdoe`, or `tiktok @jdoe`.' }
        pd.social_platform = soc.platform; pd.social_handle = soc.handle; return { ok: true }
      }
      default: return { ok: false, error: 'Unknown field.' }
    }
  },
  summarize(pd, omitted) {
    const done = new Set(omitted || [])
    const blank = '_(left blank)_'
    const line = (label, key, val) => `*${label}:* ${done.has(key) ? blank : (val ?? blank)}`
    const social = pd.social_handle ? `${pd.social_platform} @${pd.social_handle}` : null
    return [
      '📋 *Preview — review before publishing:*', '',
      line('Name', 'name', pd.name),
      line('School', 'school', pd.school),
      line('School type', 'school_type', pd.school_type),
      line('Position', 'position', pd.position),
      line('Height', 'height', formatHeight(pd.height_inches)),
      line('Social', 'social', social),
      line('Photo', 'photo', pd.photo_url ? 'attached' : null),
    ].join('\n')
  },
  previewPhoto(pd) { return pd.photo_url || null },
  async finalize(pd) {
    const slug = await uniqueSlug('athletes', pd.name)
    const row = {
      slug, name: pd.name,
      school: pd.school || null,
      school_type: pd.school_type || null,
      position: pd.position || null,
      height_inches: pd.height_inches ?? null,
      sport: 'basketball', status: 'nil_client',
      photo_url: pd.photo_url || null,
      published: true, featured: false,
    }
    if (pd.social_platform && pd.social_handle) row[pd.social_platform] = pd.social_handle
    const { error } = await db.from('athletes').insert(row).select().single()
    if (error) throw error
    await triggerDeploy()
    return `✅ *${pd.name}* has been published. The site will rebuild shortly.`
  },
}

// ── CONTRACT (NIL agreement execution) ──────────────────────────────────────
// Reuses the existing nil_agreements table + /nil-agreement signing portal.
// The bot creates the agreement (service role → no PIN needed here; the
// Telegram bot token is the gate) and hands back the athlete signing link.
const contractFlow = {
  name: 'contract',
  intro: "Let's execute a NIL agreement. I'll create the record and hand you a signing link for the athlete.",
  photoKey: null,
  fields: [
    { key: 'athlete_name',   label: 'athlete name', skippable: false, prompt: "What's the *athlete's full name* for this agreement? (first and last)" },
    { key: 'effective_date', label: 'effective date', skippable: false, prompt: 'What *effective date*? (e.g. `today`, `2026-08-01`, or `8/1/2026`)' },
    { key: 'term_years',     label: 'term (years)', skippable: false, prompt: 'What *term* in years? (1–10)' },
  ],
  isFilled(pd, key) {
    switch (key) {
      case 'athlete_name':   return !!pd.athlete_name
      case 'effective_date': return !!pd.effective_date
      case 'term_years':     return pd.term_years != null
      default:               return false
    }
  },
  apply(pd, key, text) {
    switch (key) {
      case 'athlete_name': {
        const n = parseName(text)
        if (!n) return { ok: false, error: 'I need *both* a first and last name (e.g. `Trey Alexander`).' }
        pd.athlete_name = n.name; return { ok: true }
      }
      case 'effective_date': {
        const d = parseDate(text)
        if (!d) return { ok: false, error: 'Couldn\'t read that date. Try `today`, `2026-08-01`, or `8/1/2026`.' }
        pd.effective_date = d; return { ok: true }
      }
      case 'term_years': {
        const y = parseTermYears(text)
        if (y == null) return { ok: false, error: 'Enter a whole number of years between *1* and *10*.' }
        pd.term_years = y; return { ok: true }
      }
      default: return { ok: false, error: 'Unknown field.' }
    }
  },
  summarize(pd) {
    return [
      '📋 *Preview — review before creating the agreement:*', '',
      `*Athlete:* ${pd.athlete_name}`,
      `*Effective date:* ${pd.effective_date}`,
      `*Term:* ${pd.term_years} year${pd.term_years === 1 ? '' : 's'}`,
      '',
      '_Creating this generates a signing link the athlete uses to review and sign._',
    ].join('\n')
  },
  previewPhoto() { return null },
  async finalize(pd) {
    const { data, error } = await db
      .from('nil_agreements')
      .insert({
        athlete_name:   pd.athlete_name,
        effective_date: pd.effective_date,
        term_years:     pd.term_years,
      })
      .select('agreement_url_token')
      .single()
    if (error) throw error
    const token = data?.agreement_url_token
    if (!token) throw new Error('No agreement token returned')
    const link = `${SITE_URL}/nil-agreement?token=${token}`
    return [
      `✅ Agreement created for *${pd.athlete_name}*.`,
      '',
      '*Send this signing link to the athlete:*',
      link,
      '',
      '_You\'ll get an email the moment they sign._',
    ].join('\n')
  },
}

// ── NEWS (article publishing) ───────────────────────────────────────────────
const DEFAULT_AUTHOR = 'Hyche International Management Sports Group'
const newsFlow = {
  name: 'news',
  intro: "Let's publish a news article. I'll collect the details and post it to the site.",
  photoKey: 'article_image',
  fields: [
    { key: 'title',         label: 'headline', skippable: false, prompt: "What's the *headline / title*?" },
    { key: 'excerpt',       label: 'excerpt', skippable: true, prompt: 'A short *excerpt / summary* for the card? (1–2 sentences)' },
    { key: 'body',          label: 'article body', skippable: false, prompt: 'Send the *article body*. (You can send it as one long message.)' },
    { key: 'article_image', label: 'featured image', type: 'photo', skippable: true, prompt: 'Send a *featured image* (as an image), or reply *skip*.' },
    { key: 'author',        label: 'author', skippable: true, prompt: `Who's the *author*? (reply *skip* to use "${DEFAULT_AUTHOR}")` },
  ],
  isFilled(pd, key) {
    switch (key) {
      case 'title':         return !!pd.title
      case 'excerpt':       return !!pd.excerpt
      case 'body':          return !!pd.body
      case 'article_image': return !!pd.article_image_url
      case 'author':        return !!pd.author
      default:              return false
    }
  },
  storePhoto(pd, url) { pd.article_image_url = url },
  apply(pd, key, text) {
    switch (key) {
      case 'title': {
        const t = text.trim()
        if (t.length < 4) return { ok: false, error: 'That title looks too short — give me the full headline.' }
        pd.title = t; return { ok: true }
      }
      case 'excerpt': pd.excerpt = text.trim(); return { ok: true }
      case 'body': {
        const b = text.trim()
        if (b.length < 20) return { ok: false, error: 'The article body looks too short. Send the full text.' }
        pd.body = b; return { ok: true }
      }
      case 'author': pd.author = text.trim(); return { ok: true }
      default: return { ok: false, error: 'Unknown field.' }
    }
  },
  summarize(pd, omitted) {
    const done = new Set(omitted || [])
    const blank = '_(left blank)_'
    const line = (label, key, val) => `*${label}:* ${done.has(key) ? blank : (val ?? blank)}`
    const bodyPreview = pd.body ? (pd.body.length > 160 ? pd.body.slice(0, 157) + '…' : pd.body) : null
    return [
      '📋 *Preview — review before publishing:*', '',
      line('Headline', 'title', pd.title),
      line('Excerpt', 'excerpt', pd.excerpt),
      `*Body:* ${done.has('body') ? blank : (bodyPreview ?? blank)}`,
      line('Image', 'article_image', pd.article_image_url ? 'attached' : null),
      line('Author', 'author', done.has('author') ? DEFAULT_AUTHOR : (pd.author || DEFAULT_AUTHOR)),
    ].join('\n')
  },
  previewPhoto(pd) { return pd.article_image_url || null },
  async finalize(pd) {
    const slug = await uniqueSlug('articles', pd.title)
    const { error } = await db.from('articles').insert({
      slug,
      title:          pd.title,
      excerpt:        pd.excerpt || null,
      body:           pd.body || null,
      featured_image: pd.article_image_url || null,
      author:         pd.author || DEFAULT_AUTHOR,
      published:      true,
      published_at:   new Date().toISOString(),
    }).select().single()
    if (error) throw error
    await triggerDeploy()
    return `✅ *${pd.title}* has been published to the news feed. The site will rebuild shortly.`
  },
}

const FLOWS = { roster: rosterFlow, contract: contractFlow, news: newsFlow }
const getFlow = name => FLOWS[name] || rosterFlow
const fieldDef = (flow, key) => flow.fields.find(f => f.key === key)
const subjectOf = pd => pd?.name || pd?.athlete_name || pd?.title || null

// ── Command detection → which flow to start ─────────────────────────────────
function detectStart(text) {
  const t = text.trim()
  if (/^\/?(add(\s+player)?|new\s+player|roster)\b/i.test(t)) return 'roster'
  if (/^\/?(contract|new\s+contract|add\s+contract|execute(\s+contract)?|agreement|new\s+agreement)\b/i.test(t)) return 'contract'
  if (/^\/?(news|post\s+news|new\s+article|add\s+article|publish|article)\b/i.test(t)) return 'news'
  return null
}

const HELP = [
  'I can do three things — just tell me which:',
  '',
  '🏀 *Add player* — publish an athlete to the roster.',
  '📝 *Execute contract* — create a NIL agreement + get a signing link.',
  '📰 *Post news* — publish an article to the news feed.',
  '',
  'For any of them I\'ll walk you through each field, let you review, and won\'t save until you *APPROVE*. Reply *CANCEL* anytime to abandon.',
].join('\n')

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STATE-MACHINE CORE
// ═══════════════════════════════════════════════════════════════════════════

function nextMissing(flow, pd, omitted) {
  const done = new Set(omitted || [])
  for (const f of flow.fields) {
    if (done.has(f.key)) continue
    if (flow.isFilled(pd, f.key)) continue
    return f.key
  }
  return null
}

async function advance(ctx, chatId, flow, pd, omitted) {
  const next = nextMissing(flow, pd, omitted)
  if (!next) return sendPreview(ctx, chatId, flow, pd, omitted)
  await setSession(chatId, { flow: flow.name, step: 'collecting', awaiting: next, player_data: pd, omitted })
  const f = fieldDef(flow, next)
  const hint = (f.type === 'photo' || !f.skippable) ? '' : SKIP_HINT
  await ctx.reply(`${f.prompt}${hint}`, { parse_mode: 'Markdown' })
}

async function sendPreview(ctx, chatId, flow, pd, omitted) {
  await setSession(chatId, { flow: flow.name, step: 'await_confirm', awaiting: null, player_data: pd, omitted })
  const summary = flow.summarize(pd, omitted)
  const omittedCount = (omitted || []).length
  const tail = omittedCount > 0
    ? `\n\n⚠️ ${omittedCount} field${omittedCount > 1 ? 's' : ''} left blank on purpose.`
    : ''
  const footer = flow.name === 'contract'
    ? '\n\nReply *APPROVE* to create the agreement, or *CANCEL* to discard.'
    : '\n\nReply *APPROVE* to publish, or *CANCEL* to discard.'
  const photo = flow.previewPhoto ? flow.previewPhoto(pd) : null
  if (photo) {
    try { await ctx.replyWithPhoto(photo, { caption: summary + tail + footer, parse_mode: 'Markdown' }) }
    catch { await ctx.reply(summary + tail + footer + `\n\nImage: ${photo}`, { parse_mode: 'Markdown' }) }
  } else {
    await ctx.reply(summary + tail + footer, { parse_mode: 'Markdown' })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT HANDLER
// ═══════════════════════════════════════════════════════════════════════════
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id
  const text = ctx.message.text.trim()
  const session = await getSession(chatId)
  const step = session?.step ?? 'idle'
  const flow = getFlow(session?.flow)
  const upper = text.toUpperCase()

  // Global: cancel anytime
  if (upper === 'CANCEL') {
    if (step !== 'idle') log('cancelled', session?.flow, subjectOf(session?.player_data))
    await clearSession(chatId)
    await ctx.reply('Cancelled. Nothing was saved.')
    return
  }

  // Start / restart a flow
  const startFlow = detectStart(text)
  if (startFlow) {
    const f = getFlow(startFlow)
    const pd = {}
    await setSession(chatId, { flow: f.name, step: 'collecting', awaiting: null, player_data: pd, omitted: [] })
    log('flow_started', f.name)
    await ctx.reply(f.intro, { parse_mode: 'Markdown' })
    await advance(ctx, chatId, f, pd, [])
    return
  }

  // Awaiting confirmation of an intentional omission
  if (step === 'await_omit_confirm') {
    const pd = session.player_data || {}
    const omitField = session.pending_omit
    if (upper === 'CONFIRM') {
      const omitted = Array.from(new Set([...(session.omitted || []), omitField]))
      log('field_omitted', flow.name, subjectOf(pd))
      await ctx.reply(`Okay — *${fieldDef(flow, omitField)?.label}* left blank.`, { parse_mode: 'Markdown' })
      await advance(ctx, chatId, flow, pd, omitted)
    } else {
      const res = flow.apply(pd, omitField, text)
      if (!res.ok) {
        await ctx.reply(`${res.error}\n\n_Or reply_ *CONFIRM* _to leave_ *${fieldDef(flow, omitField)?.label}* _blank._`, { parse_mode: 'Markdown' })
        return
      }
      await advance(ctx, chatId, flow, pd, session.omitted || [])
    }
    return
  }

  // Collecting a specific field
  if (step === 'collecting') {
    const pd = session.player_data || {}
    const awaiting = session.awaiting
    const omitted = session.omitted || []
    if (!awaiting) { await advance(ctx, chatId, flow, pd, omitted); return }

    const f = fieldDef(flow, awaiting)

    // Intentional skip → require explicit confirmation before it counts
    if (upper === 'SKIP') {
      if (!f?.skippable) {
        await ctx.reply(`*${f?.label}* is required — I can't leave it blank. Please provide it.`, { parse_mode: 'Markdown' })
        return
      }
      if (f.type === 'photo') {
        await setSession(chatId, { flow: flow.name, step: 'await_omit_confirm', pending_omit: awaiting, player_data: pd, omitted })
        await ctx.reply(`Publish with *no ${f.label}*? Reply *CONFIRM* to omit, or send the image.`, { parse_mode: 'Markdown' })
        return
      }
      await setSession(chatId, { flow: flow.name, step: 'await_omit_confirm', pending_omit: awaiting, player_data: pd, omitted })
      await ctx.reply(`Leave *${f.label}* blank? Reply *CONFIRM* to omit, or just send the value.`, { parse_mode: 'Markdown' })
      return
    }

    // Photo fields are collected via the photo handler, not text
    if (f?.type === 'photo') {
      const skipHint = f.skippable ? ', or reply *skip* to omit it' : ''
      await ctx.reply(`Please *send an image*${skipHint}.`, { parse_mode: 'Markdown' })
      return
    }

    const res = flow.apply(pd, awaiting, text)
    if (!res.ok) { await ctx.reply(res.error, { parse_mode: 'Markdown' }); return }
    await advance(ctx, chatId, flow, pd, omitted)
    return
  }

  // Final publish gate
  if (step === 'await_confirm') {
    if (upper === 'APPROVE') {
      const pd = session.player_data || {}
      try {
        const reply = await flow.finalize(pd)
        await clearSession(chatId)
        log('approved', flow.name, subjectOf(pd))
        await ctx.reply(reply, { parse_mode: 'Markdown', disable_web_page_preview: true })
      } catch (err) {
        console.error('Finalize error:', err)
        await ctx.reply('Something went wrong saving that. Please try again.')
      }
    } else {
      await ctx.reply('Reply *APPROVE* to confirm or *CANCEL* to discard.', { parse_mode: 'Markdown' })
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
  const flow = getFlow(session?.flow)

  if (step !== 'collecting' && step !== 'await_omit_confirm' && step !== 'await_confirm') {
    await ctx.reply(HELP, { parse_mode: 'Markdown' })
    return
  }

  // Flow has no photo field (e.g. contract), or we're not at the photo step
  if (!flow.photoKey) {
    await ctx.reply('This step doesn\'t take a photo. Please send the requested text.')
    return
  }

  const pd = session.player_data || {}
  const bucket = flow.name === 'news' ? 'article-images' : 'athlete-photos'
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
  try {
    await ctx.reply('Uploading photo...')
    const fileLink = await ctx.telegram.getFileLink(fileId)
    const url = await storePhoto(fileLink.href, subjectOf(pd), bucket)
    flow.storePhoto(pd, url)
    // A photo removes the photo field from any prior omission
    const omitted = (session.omitted || []).filter(k => k !== flow.photoKey)
    await ctx.reply('✅ Photo saved.')
    await advance(ctx, chatId, flow, pd, omitted)
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
