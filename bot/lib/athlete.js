import { db } from './supabase-admin.js'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(name) {
  const base = slugify(name)
  let slug = base
  let i = 1
  for (;;) {
    const { data } = await db.from('athletes').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

export async function insertAthlete({ name, school, position, classYear, imageUrl }) {
  const slug = await uniqueSlug(name)
  const { data, error } = await db
    .from('athletes')
    .insert({
      slug,
      name,
      school,
      position,
      class_year: classYear,
      sport: 'basketball',
      status: 'nil_client',
      photo_url: imageUrl || null,
      published: true,
      featured: false
    })
    .select()
    .single()

  if (error) throw error
  return data
}
