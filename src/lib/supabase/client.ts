import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? 'https://yuzwbglugboymetybbkh.supabase.co'
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_l6gAJ1EhK9P5ViWhCKtHQg_2OvThqj1'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
