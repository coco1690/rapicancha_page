import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { authRepository } from '../services/repositories/authRepository'
import type { Usuario } from '../services/supabase/tables'

type AuthState = {
  initialized: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Usuario | null
  error: string | null
  message: string
  submitting: boolean
  showLoginPassword: boolean
  showRegisterPassword: boolean
  showRegisterConfirmation: boolean
  loginForm: { email: string; password: string }
  registerForm: { nombre: string; email: string; password: string; confirmation: string }
  resetForm: { email: string }
  passwordForm: { password: string; confirmation: string }
  setLoginField: (field: 'email' | 'password', value: string) => void
  setRegisterField: (field: 'nombre' | 'email' | 'password' | 'confirmation', value: string) => void
  setResetEmail: (value: string) => void
  setPasswordField: (field: 'password' | 'confirmation', value: string) => void
  toggleLoginPassword: () => void
  toggleRegisterPassword: () => void
  toggleRegisterConfirmation: () => void
  initialize: () => () => void
  refreshProfile: () => Promise<void>
  login: () => Promise<boolean>
  loginWithGoogle: (redirectTo: string) => Promise<void>
  register: () => Promise<void>
  requestPasswordReset: (redirectTo: string) => Promise<void>
  changePassword: () => Promise<void>
  clearFeedback: () => void
  signOut: () => Promise<void>
}

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') return error.message
  return fallback
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  loading: true,
  session: null,
  user: null,
  profile: null,
  error: null,
  message: '',
  submitting: false,
  showLoginPassword: false,
  showRegisterPassword: false,
  showRegisterConfirmation: false,
  loginForm: { email: '', password: '' },
  registerForm: { nombre: '', email: '', password: '', confirmation: '' },
  resetForm: { email: '' },
  passwordForm: { password: '', confirmation: '' },

  setLoginField: (field, value) => set((state) => ({ loginForm: { ...state.loginForm, [field]: value } })),
  setRegisterField: (field, value) => set((state) => ({ registerForm: { ...state.registerForm, [field]: value } })),
  setResetEmail: (email) => set({ resetForm: { email } }),
  setPasswordField: (field, value) => set((state) => ({ passwordForm: { ...state.passwordForm, [field]: value } })),
  toggleLoginPassword: () => set((state) => ({ showLoginPassword: !state.showLoginPassword })),
  toggleRegisterPassword: () => set((state) => ({ showRegisterPassword: !state.showRegisterPassword })),
  toggleRegisterConfirmation: () => set((state) => ({ showRegisterConfirmation: !state.showRegisterConfirmation })),
  clearFeedback: () => set({ error: null, message: '' }),

  initialize: () => {
    let active = true
    const pending = new Set<ReturnType<typeof setTimeout>>()
    const syncSession = async (_event: AuthChangeEvent, session: Session | null) => {
      try {
        const profile = session?.user ? await authRepository.getProfile(session.user.id) : null
        if (active) set({ initialized: true, loading: false, session, user: session?.user ?? null, profile, error: null })
      } catch (error) {
        if (active) set({ initialized: true, loading: false, session, user: session?.user ?? null, profile: null, error: errorMessage(error, 'No se pudo cargar el perfil.') })
      }
    }
    void authRepository.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) set({ initialized: true, loading: false, error: error.message })
      else void syncSession('INITIAL_SESSION', data.session)
    }).catch((error) => { if (active) set({ initialized: true, loading: false, error: errorMessage(error, 'No se pudo iniciar la sesion.') }) })
    const { data } = authRepository.onAuthStateChange((event, session) => {
      const timer = setTimeout(() => { pending.delete(timer); void syncSession(event, session) }, 0)
      pending.add(timer)
    })
    return () => { active = false; pending.forEach(clearTimeout); pending.clear(); data.subscription.unsubscribe() }
  },

  refreshProfile: async () => {
    const user = get().user
    if (user) set({ profile: await authRepository.getProfile(user.id) })
  },
  login: async () => {
    const { email, password } = get().loginForm
    set({ submitting: true, error: null, message: '' })
    try {
      const data = await authRepository.signIn(email.trim().toLocaleLowerCase('es'), password)
      if (!data.session || !data.user) throw new Error('Supabase no devolvio una sesion valida.')
      const profile = await authRepository.getProfile(data.user.id)
      if (!profile) throw new Error('La cuenta no tiene un perfil de Rapicancha asociado.')
      set({ initialized: true, loading: false, submitting: false, session: data.session, user: data.user, profile, loginForm: { email: '', password: '' } })
      return true
    } catch (error) {
      const message = errorMessage(error, 'No se pudo ingresar.')
      set({ submitting: false, error: message === 'Invalid login credentials' ? 'Correo o contrasena incorrectos.' : message })
      return false
    }
  },
  loginWithGoogle: async (redirectTo) => {
    set({ submitting: true, error: null, message: '' })
    try {
      await authRepository.signInWithGoogle(redirectTo)
    } catch (error) {
      set({ submitting: false, error: errorMessage(error, 'No se pudo iniciar sesion con Google.') })
    }
  },
  register: async () => {
    const form = get().registerForm
    set({ error: null, message: '' })
    if (form.password !== form.confirmation) return set({ error: 'Las contrasenas no coinciden.' })
    set({ submitting: true })
    try {
      const data = await authRepository.signUp(form.nombre, form.email, form.password)
      set({ submitting: false, message: data.session ? 'Cuenta creada. Ya puedes configurar tu negocio.' : 'Cuenta creada. Revisa tu correo para confirmar el acceso.' })
    } catch (error) { set({ submitting: false, error: errorMessage(error, 'No se pudo crear la cuenta.') }) }
  },
  requestPasswordReset: async (redirectTo) => {
    set({ submitting: true, error: null, message: '' })
    try {
      await authRepository.requestPasswordReset(get().resetForm.email, redirectTo)
      set({ submitting: false, message: 'Te enviamos un enlace de recuperacion si el correo esta registrado.' })
    } catch (error) { set({ submitting: false, error: errorMessage(error, 'No se pudo enviar el enlace.') }) }
  },
  changePassword: async () => {
    const form = get().passwordForm
    set({ error: null, message: '' })
    if (form.password !== form.confirmation) return set({ error: 'Las contrasenas no coinciden.' })
    set({ submitting: true })
    try {
      await authRepository.updatePassword(form.password)
      set({ submitting: false, message: 'Contrasena actualizada. Ya puedes ingresar al panel.' })
    } catch (error) { set({ submitting: false, error: errorMessage(error, 'No se pudo actualizar la contrasena.') }) }
  },
  signOut: async () => {
    set({ loading: true })
    try {
      await authRepository.signOut()
      set({ loading: false, session: null, user: null, profile: null })
    } catch (error) {
      set({ loading: false, error: errorMessage(error, 'No se pudo cerrar la sesion.') })
      throw error
    }
  },
}))
