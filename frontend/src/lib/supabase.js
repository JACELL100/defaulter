import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Keep app bootable in development even if env is not configured yet.
const fallbackUrl = 'https://example.supabase.co'
const fallbackAnonKey = 'public-anon-key'

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackAnonKey,
)

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)
