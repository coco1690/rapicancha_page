import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../../config/env'
import type { Database } from '../../../supabase/types/database'

export type RapicanchaDatabase = Database
export type RapicanchaSupabaseClient = SupabaseClient<Database>

export const supabase: RapicanchaSupabaseClient | null = env.isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

