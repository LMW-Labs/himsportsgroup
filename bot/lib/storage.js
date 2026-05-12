import { db } from './supabase-admin.js'

export async function storePhoto(telegramUrl, playerName) {
  const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${slug}-${Date.now()}.jpg`

  const response = await fetch(telegramUrl)
  if (!response.ok) throw new Error(`Failed to fetch photo from Telegram: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()

  const { error } = await db.storage
    .from('athlete-photos')
    .upload(filename, arrayBuffer, { contentType: 'image/jpeg', upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = db.storage
    .from('athlete-photos')
    .getPublicUrl(filename)

  return publicUrl
}
