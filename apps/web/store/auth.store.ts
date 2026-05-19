import { create } from "zustand"
import type { UserProfile } from "@/types"

interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: UserProfile, token: string) => void
  clearAuth: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem("access_token", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    set({ user: null, token: null, isAuthenticated: false })
  },

  initFromStorage: () => {
    const token = localStorage.getItem("access_token")
    const userRaw = localStorage.getItem("user")
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as UserProfile
        set({ user, token, isAuthenticated: true })
      } catch {
        // ignore
      }
    }
  },
}))
