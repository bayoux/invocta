"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"

export function AuthInitializer() {
  const { initFromStorage } = useAuthStore()

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  return null
}
