import { db } from './supabase-admin.js'

export async function getSession(chatId) {
  const { data } = await db
    .from('bot_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle()
  return data
}

export async function setSession(chatId, updates) {
  const { error } = await db
    .from('bot_sessions')
    .upsert(
      { chat_id: chatId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'chat_id' }
    )
  if (error) throw error
}

export async function clearSession(chatId) {
  await db.from('bot_sessions').delete().eq('chat_id', chatId)
}
