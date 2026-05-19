"use client"

import { create } from "zustand"
import type { UserProfile } from "@/types"

interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: UserProfile) => void
  logout: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    localStorage.setItem("accessToken", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    set({ token: null, user: null, isAuthenticated: false })
  },

  initFromStorage: () => {
    const token = localStorage.getItem("accessToken")
    const userRaw = localStorage.getItem("user")
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as UserProfile
        set({ token, user, isAuthenticated: true })
      } catch {
        // ignore
      }
    }
  },
}))
