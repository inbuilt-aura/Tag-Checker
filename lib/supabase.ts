import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

export type Database = {
  public: {
    Tables: {
      promo_batches: {
        Row: {
          id: string
          user_id: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          created_at?: string
        }
      }
      promo_codes: {
        Row: {
          id: string
          batch_id: string
          code: string
          status: 'valid' | 'invalid' | 'pending'
          message: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          batch_id: string
          code: string
          status?: 'valid' | 'invalid' | 'pending'
          message?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          batch_id?: string
          code?: string
          status?: 'valid' | 'invalid' | 'pending'
          message?: string | null
          timestamp?: string
        }
      }
    }
  }
}