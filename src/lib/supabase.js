import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasValidUrl = typeof supabaseUrl === 'string' && /^https?:\/\//.test(supabaseUrl)
const hasValidKey = typeof supabaseKey === 'string' && supabaseKey.length > 20

const createFallbackClient = () => ({
  from() {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
    )
  },
})

export const supabase = hasValidUrl && hasValidKey
  ? createClient(supabaseUrl, supabaseKey)
  : createFallbackClient()

export const isSupabaseConfigured = hasValidUrl && hasValidKey