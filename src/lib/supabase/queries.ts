import { supabase } from './client'
import type { Athlete, Article } from './types'

// ─── ATHLETES ────────────────────────────────────────────────────────────────

export async function getAthletes(): Promise<Athlete[]> {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('published', true)
    .order('name')

  if (error) throw new Error(`getAthletes: ${error.message}`)
  return data
}

export async function getFeaturedAthletes(): Promise<Athlete[]> {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('name')

  if (error) throw new Error(`getFeaturedAthletes: ${error.message}`)
  return data
}

export async function getAthleteBySlug(slug: string): Promise<Athlete | null> {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // no rows found
    throw new Error(`getAthleteBySlug(${slug}): ${error.message}`)
  }
  return data
}

// ─── ARTICLES ────────────────────────────────────────────────────────────────

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error) throw new Error(`getArticles: ${error.message}`)
  return data
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getArticleBySlug(${slug}): ${error.message}`)
  }
  return data
}
