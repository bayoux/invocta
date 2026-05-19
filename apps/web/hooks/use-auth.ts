"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, initFromStorage, clearAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  useEffect(() => {
    if (requireAuth && !isAuthenticated && typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      if (!token) router.replace("/login")
    }
  }, [isAuthenticated, requireAuth, router])

  const logout = () => {
    clearAuth()
    router.replace("/login")
  }

  return { user, isAuthenticated, logout }
}
