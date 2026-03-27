import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY ?? ''

// Only create client on client-side
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// For client-side usage
export const supabase = {
  auth: {
    getSession: async () => {
      const client = getSupabase()
      if (!client) return { data: { session: null }, error: new Error('Supabase not initialized') }
      return client.auth.getSession()
    },
    signUp: async (options: { email: string; password: string }) => {
      const client = getSupabase()
      if (!client) return { data: null, error: new Error('Supabase not initialized') }
      return client.auth.signUp(options)
    },
    signInWithPassword: async (options: { email: string; password: string }) => {
      const client = getSupabase()
      if (!client) return { data: null, error: new Error('Supabase not initialized') }
      return client.auth.signInWithPassword(options)
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const client = getSupabase()
      if (!client) return { data: { subscription: { unsubscribe: () => {} } }, error: new Error('Supabase not initialized') }
      return client.auth.onAuthStateChange(callback)
    },
  },
}
