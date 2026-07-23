import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

export const authRepository = {
  getProfile: async (userId: string) => {
    const { data, error } = await client().from('usuarios').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    return data
  },
  getSession: () => client().auth.getSession(),
  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => client().auth.onAuthStateChange(callback),
  signIn: async (email: string, password: string) => {
    const { data, error } = await client().auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  signInWithGoogle: async (redirectTo: string) => {
    const { data, error } = await client().auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) throw error
    return data
  },
  signUp: async (nombre: string, email: string, password: string) => {
    const { data, error } = await client().auth.signUp({ email, password, options: { data: { nombre } } })
    if (error) throw error
    return data
  },
  requestPasswordReset: async (email: string, redirectTo: string) => {
    const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },
  updatePassword: async (password: string) => {
    const { error } = await client().auth.updateUser({ password })
    if (error) throw error
  },
  signOut: async () => {
    const { error } = await client().auth.signOut()
    if (error) throw error
  },
}
