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

// Cookie helpers (edge-compatible, no external lib needed)
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    // Persist in both localStorage (client reads) and cookie (middleware reads)
    localStorage.setItem("access_token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setCookie("access_token", token)
    set({ user, token, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    deleteCookie("access_token")
    set({ user: null, token: null, isAuthenticated: false })
  },

  initFromStorage: () => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("access_token")
    const userRaw = localStorage.getItem("user")
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as UserProfile
        // Sync cookie in case it was lost (e.g. browser restart)
        setCookie("access_token", token)
        set({ user, token, isAuthenticated: true })
      } catch {
        // corrupted storage — clean up
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
      }
    }
  },
}))
