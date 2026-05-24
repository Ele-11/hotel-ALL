import { create } from 'zustand'
import {
  getApiErrorMessage,
  getCurrentUser,
  loginAccount,
  registerAccount,
  TOKEN_STORAGE_KEY,
} from '../apis'
import type { CurrentUser, Role } from '../types/auth'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

type AuthState = {
  currentUser: CurrentUser | null
  error: string | null
  status: AuthStatus
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  register: (
    username: string,
    password: string,
    role: Exclude<Role, 'ADMIN'>,
  ) => Promise<void>
  restore: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  error: null,
  status: 'idle',
  token: window.localStorage.getItem(TOKEN_STORAGE_KEY),

  async login(username, password) {
    set({ error: null, status: 'loading' })

    try {
      const data = await loginAccount({ username, password })
      window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      set({
        currentUser: data.user,
        error: null,
        status: 'authenticated',
        token: data.token,
      })
    } catch (error) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      set({
        currentUser: null,
        error: getApiErrorMessage(error),
        status: 'error',
        token: null,
      })
    }
  },

  logout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    set({
      currentUser: null,
      error: null,
      status: 'idle',
      token: null,
    })
  },

  async register(username, password, role) {
    set({ error: null, status: 'loading' })

    try {
      await registerAccount({ username, password, role })
      await get().login(username, password)
    } catch (error) {
      set({
        currentUser: null,
        error: getApiErrorMessage(error),
        status: 'error',
      })
    }
  },

  async restore() {
    const token = get().token ?? window.localStorage.getItem(TOKEN_STORAGE_KEY)

    if (!token) {
      set({ status: 'idle' })
      return
    }

    set({ error: null, status: 'loading', token })

    try {
      const currentUser = await getCurrentUser()
      set({
        currentUser,
        error: null,
        status: 'authenticated',
        token,
      })
    } catch {
      get().logout()
    }
  },
}))
