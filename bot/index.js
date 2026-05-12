import { Telegraf } from 'telegraf'
import { getSession, setSession, clearSession } from './lib/session.js'
import { searchImages } from './lib/search.js'
import { storePhoto } from './lib/storage.js'
import { insertAthlete } from './lib/athlete.js'
import { triggerDeploy } from './lib/deploy.js'
import { parsePlayerMessage } from './lib/parse.js'

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

function log(action, playerName) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, player: playerName ?? null }))
}

async function startAddFlow(ctx, playerData) {
  const chatId = ctx.chat.id
  log('add_attempt', playerData.name)

  const images = await searchImages(playerData.name, playerData.school)

  if (images.length === 0) {
    await setSession(chatId, { step: 'await_upload', player_data: playerData, image_candidates: [] })
    await ctx.reply(
      `No photo found for *${playerData.name}*. Please upload one directly in this chat.`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  await setSession(chatId, { step: 'await_image', player_data: playerData, image_candidates: images })
  await ctx.reply(
    `*${playerData.name}* — ${playerData.school}\nPosition: ${playerData.position} · Class: ${playerData.classYear}\n\nFound these photos:`,
    { parse_mode: 'Markdown' }
  )

  for (let i = 0; i < images.length; i++) {
    try {
      await ctx.replyWithPhoto(images[i], { caption: `Option ${i + 1}` })
    } catch {
      await ctx.reply(`Option ${i + 1}: ${images[i]}`)
    }
  }

  await ctx.reply('Reply *1* or *2* to select a photo, or *U* to upload your own.', { parse_mode: 'Markdown' })
}

async function sendFinalPreview(ctx, playerData, imageUrl) {
  const chatId = ctx.chat.id
  await setSession(chatId, {
    step: 'await_confirm',
    player_data: playerData,
    selected_image_url: imageUrl
  })

  const summary = [
    '✅ *Preview — ready to publish:*',
    '',
    `*Name:* ${playerData.name}`,
    `*School:* ${playerData.school}`,
    `*Position:* ${playerData.position}`,
    `*Class:* ${playerData.classYear}`
  ].join('\n')

  if (imageUrl) {
    try {
      await ctx.replyWithPhoto(imageUrl, { caption: summary, parse_mode: 'Markdown' })
    } catch {
      await ctx.reply(`${summary}\n\nPhoto: ${imageUrl}`, { parse_mode: 'Markdown' })
    }
  } else {
    await ctx.reply(summary, { parse_mode: 'Markdown' })
  }

  await ctx.reply('Reply *APPROVE* to publish, or *CANCEL* to discard.', { parse_mode: 'Markdown' })
}

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id
  const text = ctx.message.text.trim()
  const session = await getSession(chatId)
  const step = session?.step ?? 'idle'

  if (/^add\s+player\s*:/i.test(text)) {
    const parsed = parsePlayerMessage(text)
    if (!parsed) {
      await ctx.reply(
        'Please use the format:\n`Add player: Name, School, Position, Class Year`\n\nExample:\n`Add player: Marcus Johnson, Westview High School, SG, 2026`',
        { parse_mode: 'Markdown' }
      )
      return
    }
    await startAddFlow(ctx, parsed)
    return
  }

  if (step === 'await_image') {
    const candidates = session.image_candidates ?? []
    const input = text.toUpperCase()
    if (input === '1' && candidates[0]) {
      await sendFinalPreview(ctx, session.player_data, candidates[0])
    } else if (input === '2' && candidates[1]) {
      await sendFinalPreview(ctx, session.player_data, candidates[1])
    } else if (input === 'U') {
      await setSession(chatId, { step: 'await_upload', player_data: session.player_data, image_candidates: candidates })
      await ctx.reply('Please upload your photo now.')
    } else {
      const opts = candidates.length >= 2 ? '1, 2, or U' : '1 or U'
      await ctx.reply(`Reply ${opts} to continue.`)
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

  if (step === 'await_upload') {
    await ctx.reply('Please upload a photo (send an image file).')
    return
  }

  await ctx.reply(
    'Send `Add player: Name, School, Position, Class Year` to add a player.\n\nExample:\n`Add player: Marcus Johnson, Westview High School, SG, 2026`',
    { parse_mode: 'Markdown' }
  )
})

bot.on('photo', async (ctx) => {
  const chatId = ctx.chat.id
  const session = await getSession(chatId)

  if (session?.step !== 'await_upload') {
    await ctx.reply(
      'Send `Add player: Name, School, Position, Class Year` to get started.',
      { parse_mode: 'Markdown' }
    )
    return
  }

  const photos = ctx.message.photo
  const fileId = photos[photos.length - 1].file_id

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
