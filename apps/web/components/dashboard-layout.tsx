"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initFromStorage } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  useEffect(() => {
    if (!isAuthenticated) {
      const token = localStorage.getItem("access_token")
      if (!token) router.replace("/login")
    }
  }, [isAuthenticated, router])

  return children
}
