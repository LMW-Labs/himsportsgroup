// ─── DATABASE TYPE DEFINITIONS ───────────────────────────────────────────────
// Hand-authored until `supabase gen types` is run against the live project.
// Run: npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts

export type AthleteStatus = 'nil_client' | 'pro_prospect' | 'rising_star' | 'alumni'

export interface Athlete {
  id: string
  slug: string
  name: string
  position: string | null
  sport: string
  school: string | null
  class_year: string | null
  division: string | null
  status: AthleteStatus
  photo_url: string | null
  nil_value_display: string | null
  featured: boolean
  published: boolean
  bio: string | null
  instagram: string | null
  twitter: string | null
  tiktok: string | null
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string | null
  featured_image: string | null
  author: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  name: string
  email: string
  type: 'athlete' | 'brand' | 'media' | 'general'
  message: string
  created_at: string
}

// Minimal Database shape for createClient<Database> typing
export interface Database {
  public: {
    Tables: {
      athletes: {
        Row: Athlete
        Insert: Omit<Athlete, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Athlete, 'id' | 'created_at' | 'updated_at'>>
      }
      articles: {
        Row: Article
        Insert: Omit<Article, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>>
      }
      inquiries: {
        Row: Inquiry
        Insert: Omit<Inquiry, 'id' | 'created_at'>
        Update: Partial<Omit<Inquiry, 'id' | 'created_at'>>
      }
    }
  }
}
