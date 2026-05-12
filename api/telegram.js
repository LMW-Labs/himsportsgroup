import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import { GoogleAuth } from 'google-auth-library'

// ── Supabase admin client ──────────────────────────────────────────────────
const db = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Google auth ───────────────────────────────────────────────────────────
let _auth
function getAuth() {
  if (!_auth) {
    _auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })
  }
  return _auth
}

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

// ── Parse player message ──────────────────────────────────────────────────
function parsePlayerMessage(text) {
  const match = text.match(/add\s+player\s*:\s*(.+)/i)
  if (!match) return null
  const parts = match[1].split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 4) return null
  return { name: parts[0], school: parts[1], position: parts[2].toUpperCase(), classYear: parts[3] }
}

// ── Image search ──────────────────────────────────────────────────────────
async function searchImages(playerName, school) {
  try {
    const client = await getAuth().getClient()
    const { token } = await client.getAccessToken()
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('cx', process.env.GOOGLE_CSE_ID)
    url.searchParams.set('q', `${playerName} ${school} basketball player`)
    url.searchParams.set('searchType', 'image')
    url.searchParams.set('num', '2')
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { console.error('Image search failed:', res.status); return [] }
    const data = await res.json()
    return (data.items || []).map(item => item.link)
  } catch (err) {
    console.error('Image search error:', err.message)
    return []
  }
}

// ── Photo storage ─────────────────────────────────────────────────────────
async function storePhoto(telegramUrl, playerName) {
  const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
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

async function insertAthlete({ name, school, position, classYear, imageUrl }) {
  const slug = await uniqueSlug(name)
  const { data, error } = await db
    .from('athletes')
    .insert({ slug, name, school, position, class_year: classYear, sport: 'basketball', status: 'nil_client', photo_url: imageUrl || null, published: true, featured: false })
    .select().single()
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

// ── Flow helpers ──────────────────────────────────────────────────────────
async function startAddFlow(ctx, playerData) {
  const chatId = ctx.chat.id
  log('add_attempt', playerData.name)
  const images = await searchImages(playerData.name, playerData.school)

  if (images.length === 0) {
    await setSession(chatId, { step: 'await_upload', player_data: playerData, image_candidates: [] })
    await ctx.reply(`No photo found for *${playerData.name}*. Please upload one directly in this chat.`, { parse_mode: 'Markdown' })
    return
  }

  await setSession(chatId, { step: 'await_image', player_data: playerData, image_candidates: images })
  await ctx.reply(`*${playerData.name}* — ${playerData.school}\nPosition: ${playerData.position} · Class: ${playerData.classYear}\n\nFound these photos:`, { parse_mode: 'Markdown' })

  for (let i = 0; i < images.length; i++) {
    try { await ctx.replyWithPhoto(images[i], { caption: `Option ${i + 1}` }) }
    catch { await ctx.reply(`Option ${i + 1}: ${images[i]}`) }
  }
  await ctx.reply('Reply *1* or *2* to select a photo, or *U* to upload your own.', { parse_mode: 'Markdown' })
}

async function sendFinalPreview(ctx, playerData, imageUrl) {
  const chatId = ctx.chat.id
  await setSession(chatId, { step: 'await_confirm', player_data: playerData, selected_image_url: imageUrl })
  const summary = ['✅ *Preview — ready to publish:*', '', `*Name:* ${playerData.name}`, `*School:* ${playerData.school}`, `*Position:* ${playerData.position}`, `*Class:* ${playerData.classYear}`].join('\n')
  if (imageUrl) {
    try { await ctx.replyWithPhoto(imageUrl, { caption: summary, parse_mode: 'Markdown' }) }
    catch { await ctx.reply(`${summary}\n\nPhoto: ${imageUrl}`, { parse_mode: 'Markdown' }) }
  } else {
    await ctx.reply(summary, { parse_mode: 'Markdown' })
  }
  await ctx.reply('Reply *APPROVE* to publish, or *CANCEL* to discard.', { parse_mode: 'Markdown' })
}

// ── Handlers ──────────────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id
  const text = ctx.message.text.trim()
  const session = await getSession(chatId)
  const step = session?.step ?? 'idle'

  if (/^add\s+player\s*:/i.test(text)) {
    const parsed = parsePlayerMessage(text)
    if (!parsed) {
      await ctx.reply('Please use the format:\n`Add player: Name, School, Position, Class Year`\n\nExample:\n`Add player: Marcus Johnson, Westview High School, SG, 2026`', { parse_mode: 'Markdown' })
      return
    }
    await startAddFlow(ctx, parsed)
    return
  }

  if (step === 'await_image') {
    const candidates = session.image_candidates ?? []
    const input = text.toUpperCase()
    if (input === '1' && candidates[0]) await sendFinalPreview(ctx, session.player_data, candidates[0])
    else if (input === '2' && candidates[1]) await sendFinalPreview(ctx, session.player_data, candidates[1])
    else if (input === 'U') {
      await setSession(chatId, { step: 'await_upload', player_data: session.player_data, image_candidates: candidates })
      await ctx.reply('Please upload your photo now.')
    } else {
      await ctx.reply(`Reply ${candidates.length >= 2 ? '1, 2, or U' : '1 or U'} to continue.`)
    }
    return
  }

  if (step === 'await_confirm') {
    const input = text.toUpperCase()
    if (input === 'APPROVE') {
      const { player_data: p, selected_image_url: imageUrl } = session
      try {
        await insertAthlete({ ...p, imageUrl })
        await triggerDeploy()
        await clearSession(chatId)
        log('approved', p.name)
        await ctx.reply(`✅ *${p.name}* has been published. The site will rebuild shortly.`, { parse_mode: 'Markdown' })
      } catch (err) {
        console.error('Approve error:', err)
        await ctx.reply('Something went wrong saving the player. Please try again.')
      }
    } else if (input === 'CANCEL') {
      log('cancelled', session.player_data?.name)
      await clearSession(chatId)
      await ctx.reply('Cancelled. Player discarded.')
    } else {
      await ctx.reply('Reply *APPROVE* to publish or *CANCEL* to discard.', { parse_mode: 'Markdown' })
    }
    return
  }

  if (step === 'await_upload') { await ctx.reply('Please upload a photo (send an image file).'); return }

  await ctx.reply('Send `Add player: Name, School, Position, Class Year` to add a player.\n\nExample:\n`Add player: Marcus Johnson, Westview High School, SG, 2026`', { parse_mode: 'Markdown' })
})

bot.on('photo', async (ctx) => {
  const chatId = ctx.chat.id
  const session = await getSession(chatId)
  if (session?.step !== 'await_upload') {
    await ctx.reply('Send `Add player: Name, School, Position, Class Year` to get started.', { parse_mode: 'Markdown' })
    return
  }
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
  try {
    await ctx.reply('Uploading photo...')
    const fileLink = await ctx.telegram.getFileLink(fileId)
    const photoUrl = await storePhoto(fileLink.href, session.player_data.name)
    await sendFinalPreview(ctx, session.player_data, photoUrl)
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
