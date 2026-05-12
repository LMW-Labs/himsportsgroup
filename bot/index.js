import { Telegraf } from 'telegraf'
import { getSession, setSession, clearSession } from './lib/session.js'
import { searchImages } from './lib/search.js'
import { storePhoto } from './lib/storage.js'
import {
  insertAthlete,
  listAthletes,
  searchAthlete,
  removeAthlete,
  toggleFeatured,
  updateAthlete,
} from './lib/athlete.js'
import { triggerDeploy } from './lib/deploy.js'
import {
  parsePlayerMessage,
  parseNameCommand,
  parseUpdateCommand,
  parseListCommand,
} from './lib/parse.js'

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

const HELP_TEXT = [
  '*Hims Sports Group Bot — Commands*',
  '',
  '`Add player: Name, School, Position, Class Year`',
  '`Add player: Name, School, Position, Class Year, available`',
  '`Add player: Name, School, Position, Class Year, signed`',
  '  → Add a new player (availability defaults to *available*)',
  '',
  '`List players`',
  '  → Show all players',
  '',
  '`List players: School Name`',
  '  → Filter players by school',
  '',
  '`Search player: Name`',
  '  → Look up a player by name',
  '',
  '`Remove player: Name`',
  '  → Unpublish a player from the site',
  '',
  '`Feature player: Name`',
  '  → Toggle featured status on/off',
  '',
  '`Update player: Name | field: new value`',
  '  → Edit school, position, class, status, or *availability*',
  '  Example: `Update player: Marcus Johnson | availability: signed`',
  '',
  '`Help` — Show this message',
].join('\n')

function log(action, playerName) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, player: playerName ?? null }))
}

function availabilityLabel(a) {
  if (a === 'signed') return '🔒 Signed'
  return '🟢 Available'
}

function formatPlayer(p) {
  const star = p.featured ? ' ⭐' : ''
  const pub = p.published === false ? ' *(unpublished)*' : ''
  const avail = p.availability ? ` · ${availabilityLabel(p.availability)}` : ''
  return `*${p.name}*${star}${pub} — ${p.school} · ${p.position} · ${p.class_year ?? p.classYear}${avail}`
}

function ambiguousReply(matches) {
  const lines = ['Multiple players found — be more specific:', ''].concat(matches.map(p => `• ${p.name} (${p.school})`))
  return lines.join('\n')
}

// ── Add player flow ────────────────────────────────────────────────────────

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
    `*Class:* ${playerData.classYear}`,
    `*Availability:* ${availabilityLabel(playerData.availability ?? 'available')}`
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

// ── Remove flow (confirm before deleting) ─────────────────────────────────

async function startRemoveFlow(ctx, name) {
  const result = await removeAthlete(name)

  if (result === null) {
    await ctx.reply(`No player found matching *${name}*.`, { parse_mode: 'Markdown' })
    return
  }
  if (result.ambiguous) {
    await ctx.reply(ambiguousReply(result.ambiguous), { parse_mode: 'Markdown' })
    return
  }

  log('removed', result.removed.name)
  await triggerDeploy()
  await ctx.reply(
    `🗑 *${result.removed.name}* has been unpublished. The site will rebuild shortly.`,
    { parse_mode: 'Markdown' }
  )
}

// ── Text handler ───────────────────────────────────────────────────────────

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id
  const text = ctx.message.text.trim()
  const session = await getSession(chatId)
  const step = session?.step ?? 'idle'

  // ── Help ──────────────────────────────────────────────────────────────
  if (/^help$/i.test(text)) {
    await ctx.reply(HELP_TEXT, { parse_mode: 'Markdown' })
    return
  }

  // ── Add player ────────────────────────────────────────────────────────
  if (/^add\s+player\s*:/i.test(text)) {
    const parsed = parsePlayerMessage(text)
    if (!parsed) {
      await ctx.reply(
        'Use the format:\n`Add player: Name, School, Position, Class Year`\n\nExample:\n`Add player: Marcus Johnson, Westview High, SG, 2026`',
        { parse_mode: 'Markdown' }
      )
      return
    }
    await startAddFlow(ctx, parsed)
    return
  }

  // ── List players ──────────────────────────────────────────────────────
  if (/^list\s+players?/i.test(text)) {
    const parsed = parseListCommand(text)
    if (!parsed) {
      await ctx.reply('Use: `List players` or `List players: School Name`', { parse_mode: 'Markdown' })
      return
    }
    try {
      const players = await listAthletes(parsed.school)
      if (players.length === 0) {
        const msg = parsed.school ? `No players found for *${parsed.school}*.` : 'No players on the roster yet.'
        await ctx.reply(msg, { parse_mode: 'Markdown' })
        return
      }
      const header = parsed.school ? `*Players — ${parsed.school}* (${players.length})` : `*All Players* (${players.length})`
      const lines = players.map(p => formatPlayer(p))
      const chunks = []
      let chunk = header
      for (const line of lines) {
        if ((chunk + '\n' + line).length > 3800) {
          chunks.push(chunk)
          chunk = line
        } else {
          chunk += '\n' + line
        }
      }
      chunks.push(chunk)
      for (const c of chunks) {
        await ctx.reply(c, { parse_mode: 'Markdown' })
      }
    } catch (err) {
      console.error('List error:', err)
      await ctx.reply('Could not load players. Please try again.')
    }
    return
  }

  // ── Search player ─────────────────────────────────────────────────────
  if (/^search\s+player\s*:/i.test(text)) {
    const name = parseNameCommand('search\\s+player', text)
    if (!name) {
      await ctx.reply('Use: `Search player: Name`', { parse_mode: 'Markdown' })
      return
    }
    try {
      const results = await searchAthlete(name)
      if (results.length === 0) {
        await ctx.reply(`No player found matching *${name}*.`, { parse_mode: 'Markdown' })
        return
      }
      const lines = results.map(p => {
        const star = p.featured ? ' ⭐' : ''
        const pub = p.published === false ? ' *(unpublished)*' : ''
        return [
          `*${p.name}*${star}${pub}`,
          `School: ${p.school}`,
          `Position: ${p.position} · Class: ${p.class_year}`,
          `Availability: ${availabilityLabel(p.availability ?? 'available')}`,
          `Status: ${p.status}`,
          p.photo_url ? `Photo: ${p.photo_url}` : 'No photo'
        ].join('\n')
      })
      await ctx.reply(lines.join('\n\n'), { parse_mode: 'Markdown' })
    } catch (err) {
      console.error('Search error:', err)
      await ctx.reply('Search failed. Please try again.')
    }
    return
  }

  // ── Remove player ─────────────────────────────────────────────────────
  if (/^remove\s+player\s*:/i.test(text)) {
    const name = parseNameCommand('remove\\s+player', text)
    if (!name) {
      await ctx.reply('Use: `Remove player: Name`', { parse_mode: 'Markdown' })
      return
    }
    await startRemoveFlow(ctx, name)
    return
  }

  // ── Feature player ────────────────────────────────────────────────────
  if (/^feature\s+player\s*:/i.test(text)) {
    const name = parseNameCommand('feature\\s+player', text)
    if (!name) {
      await ctx.reply('Use: `Feature player: Name`', { parse_mode: 'Markdown' })
      return
    }
    try {
      const result = await toggleFeatured(name)
      if (result === null) {
        await ctx.reply(`No player found matching *${name}*.`, { parse_mode: 'Markdown' })
        return
      }
      if (result.ambiguous) {
        await ctx.reply(ambiguousReply(result.ambiguous), { parse_mode: 'Markdown' })
        return
      }
      const label = result.newFeatured ? '⭐ Featured' : 'Unfeatured'
      log('featured_toggle', result.player.name)
      await triggerDeploy()
      await ctx.reply(
        `${label}: *${result.player.name}*. Site will rebuild shortly.`,
        { parse_mode: 'Markdown' }
      )
    } catch (err) {
      console.error('Feature error:', err)
      await ctx.reply('Could not update featured status. Please try again.')
    }
    return
  }

  // ── Update player ─────────────────────────────────────────────────────
  if (/^update\s+player\s*:/i.test(text)) {
    const parsed = parseUpdateCommand(text)
    if (!parsed) {
      await ctx.reply(
        'Use: `Update player: Name | field: new value`\n\nExample:\n`Update player: Marcus Johnson | availability: signed`\n\nEditable fields: school, position, class, status, availability',
        { parse_mode: 'Markdown' }
      )
      return
    }
    try {
      const result = await updateAthlete(parsed.name, parsed.field, parsed.value)
      if (result === null) {
        await ctx.reply(`No player found matching *${parsed.name}*.`, { parse_mode: 'Markdown' })
        return
      }
      if (result.ambiguous) {
        await ctx.reply(ambiguousReply(result.ambiguous), { parse_mode: 'Markdown' })
        return
      }
      if (result.unknownField) {
        await ctx.reply(
          `Unknown field *${result.unknownField}*. Editable fields: school, position, class, status, availability`,
          { parse_mode: 'Markdown' }
        )
        return
      }
      if (result.invalidValue) {
        await ctx.reply(
          `Invalid value for *availability*: \`${result.invalidValue}\`\nMust be \`available\` or \`signed\`.`,
          { parse_mode: 'Markdown' }
        )
        return
      }
      log('updated', result.player.name)
      await triggerDeploy()
      await ctx.reply(
        `✏️ Updated *${result.player.name}*: ${parsed.field} → \`${result.value}\`. Site will rebuild shortly.`,
        { parse_mode: 'Markdown' }
      )
    } catch (err) {
      console.error('Update error:', err)
      await ctx.reply('Could not update player. Please try again.')
    }
    return
  }

  // ── Session steps ─────────────────────────────────────────────────────

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
    'Send `Help` to see all available commands.',
    { parse_mode: 'Markdown' }
  )
})

// ── Photo handler ──────────────────────────────────────────────────────────

bot.on('photo', async (ctx) => {
  const chatId = ctx.chat.id
  const session = await getSession(chatId)

  if (session?.step !== 'await_upload') {
    await ctx.reply(
      'Send `Help` to see all available commands.',
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
