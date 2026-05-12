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

export async function listAthletes(school = null) {
  let query = db
    .from('athletes')
    .select('name, school, position, class_year, featured, published')
    .order('name')

  if (school) {
    query = query.ilike('school', `%${school}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function searchAthlete(name) {
  const { data, error } = await db
    .from('athletes')
    .select('id, name, school, position, class_year, featured, published, photo_url, status')
    .ilike('name', `%${name}%`)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function removeAthlete(name) {
  const matches = await searchAthlete(name)
  if (matches.length === 0) return null
  if (matches.length > 1) return { ambiguous: matches }

  const { error } = await db
    .from('athletes')
    .update({ published: false })
    .eq('id', matches[0].id)

  if (error) throw error
  return { removed: matches[0] }
}

export async function toggleFeatured(name) {
  const matches = await searchAthlete(name)
  if (matches.length === 0) return null
  if (matches.length > 1) return { ambiguous: matches }

  const player = matches[0]
  const { error } = await db
    .from('athletes')
    .update({ featured: !player.featured })
    .eq('id', player.id)

  if (error) throw error
  return { player, newFeatured: !player.featured }
}

const UPDATABLE_FIELDS = {
  school: 'school',
  position: 'position',
  class: 'class_year',
  'class year': 'class_year',
  classyear: 'class_year',
  status: 'status',
  name: 'name',
}

export async function updateAthlete(name, field, value) {
  const col = UPDATABLE_FIELDS[field.toLowerCase().trim()]
  if (!col) return { unknownField: field }

  const matches = await searchAthlete(name)
  if (matches.length === 0) return null
  if (matches.length > 1) return { ambiguous: matches }

  const update = { [col]: col === 'position' ? value.toUpperCase() : value }
  const { error } = await db
    .from('athletes')
    .update(update)
    .eq('id', matches[0].id)

  if (error) throw error
  return { player: matches[0], col, value }
}
