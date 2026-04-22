/**
 * Supabase client for device / mobile app contexts
 * (React Native, Expo, or any non-Astro environment)
 *
 * Usage:
 *   import { supabase } from './device-client'
 *
 * Connection details — himsportsgroup project
 *   URL:  https://yuzwbglugboymetybbkh.supabase.co
 *   Key:  use the publishable key below (safe to embed in device apps)
 *
 * For Expo / React Native, install:
 *   npx expo install @supabase/supabase-js
 *   npx expo install @react-native-async-storage/async-storage
 *   npx expo install react-native-url-polyfill
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL  = 'https://yuzwbglugboymetybbkh.supabase.co'
const SUPABASE_KEY  = 'sb_publishable_l6gAJ1EhK9P5ViWhCKtHQg_2OvThqj1'

// ─── Plain JS / browser / Next.js / non-Expo environment ─────────────────────
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

// ─── React Native / Expo (uncomment and replace above export) ─────────────────
//
// import 'react-native-url-polyfill/auto'
// import AsyncStorage from '@react-native-async-storage/async-storage'
//
// export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
//   auth: {
//     storage: AsyncStorage,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,
//   },
// })
