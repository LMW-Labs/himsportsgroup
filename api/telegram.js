import { bot } from '../bot/index.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true })
  }
  try {
    await bot.handleUpdate(req.body)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    // Always 200 — prevents Telegram from retrying on our errors
    res.status(200).json({ ok: true })
  }
}
