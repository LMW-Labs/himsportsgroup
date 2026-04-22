import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
)

const { data: athletes, error: aErr } = await supabase
  .from('athletes')
  .select('name, slug, status')
  .eq('published', true)

if (aErr) {
  console.error('❌ athletes:', aErr.message)
  process.exit(1)
}

console.log(`✅ athletes (${athletes.length}):`)
athletes.forEach(a => console.log(`   ${a.name} — ${a.slug} [${a.status}]`))

const { data: articles, error: rErr } = await supabase
  .from('articles')
  .select('title, slug')
  .eq('published', true)

if (rErr) {
  console.error('❌ articles:', rErr.message)
  process.exit(1)
}

console.log(`✅ articles (${articles.length})`)

const { error: iErr } = await supabase
  .from('inquiries')
  .insert({ name: 'Test', email: 'test@test.com', type: 'general', message: 'connection test' })

if (iErr) {
  console.error('❌ inquiries insert:', iErr.message)
  process.exit(1)
}

console.log('✅ inquiries insert ok')
console.log('\n🟢 Supabase connection verified.')
