"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { authApi } from "@/lib/auth.api"
import { usersApi } from "@/lib/users.api"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@workspace/ui/components/card"
import { UserIcon, KeyIcon, ShieldIcon, Loader2Icon } from "lucide-react"
import type { UserProfile, UserRole } from "@/types"

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  supervisor: "Супервайзер",
}

const ROLE_VARIANT: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  manager: "default",
  supervisor: "secondary",
}

export default function ProfilePage() {
  const { user: storeUser, setAuth, token } = useAuthStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit info form
  const [infoForm, setInfoForm] = useState({ firstName: "", lastName: "" })
  const [savingInfo, setSavingInfo] = useState(false)

  // Change password form
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    authApi
      .getProfile()
      .then((p: UserProfile) => {
        setProfile(p)
        setInfoForm({ firstName: p.firstName, lastName: p.lastName })
      })
      .catch(() => toast.error("Ошибка загрузки профиля"))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingInfo(true)
    try {
      const updated = await usersApi.update(profile.id, infoForm)
      setProfile(updated)
      // Sync store so sidebar name updates immediately
      if (token) setAuth(updated, token)
      toast.success("Данные обновлены")
    } catch {
      toast.error("Ошибка сохранения")
    } finally {
      setSavingInfo(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Пароли не совпадают")
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов")
      return
    }
    if (!profile) return
    setSavingPw(true)
    try {
      await usersApi.update(profile.id, { password: pwForm.newPassword })
      toast.success("Пароль изменён")
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch {
      toast.error("Ошибка смены пароля")
    } finally {
      setSavingPw(false)
    }
  }

  const setInfo = (key: string, value: string) =>
    setInfoForm((f) => ({ ...f, [key]: value }))

  const setPw = (key: string, value: string) =>
    setPwForm((f) => ({ ...f, [key]: value }))

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Профиль" />

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-2xl">

          {/* ── Identity card ─────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-muted">
                  <UserIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-36 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  ) : (
                    <>
                      <CardTitle>
                        {profile?.firstName} {profile?.lastName}
                      </CardTitle>
                      <CardDescription>{profile?.email}</CardDescription>
                    </>
                  )}
                </div>
                {profile && (
                  <Badge
                    variant={ROLE_VARIANT[profile.role]}
                    className="ml-auto"
                  >
                    <ShieldIcon className="mr-1 h-3 w-3" />
                    {ROLE_LABEL[profile.role]}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Аккаунт создан:{" "}
              {profile
                ? new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </CardContent>
          </Card>

          {/* ── Edit info ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Личные данные</CardTitle>
              <CardDescription>Обновите имя и фамилию</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={infoForm.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInfo("firstName", e.target.value)
                      }
                      disabled={loading || savingInfo}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={infoForm.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInfo("lastName", e.target.value)
                      }
                      disabled={loading || savingInfo}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={profile?.email ?? ""}
                    disabled
                    className="text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email изменить нельзя — обратитесь к администратору
                  </p>
                </div>

                <Button type="submit" disabled={loading || savingInfo}>
                  {savingInfo ? (
                    <><Loader2Icon className="h-4 w-4 animate-spin" /> Сохранение...</>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Change password ─────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyIcon className="h-4 w-4" />
                Смена пароля
              </CardTitle>
              <CardDescription>Минимум 6 символов</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPw ? "text" : "password"}
                      value={pwForm.newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPw("newPassword", e.target.value)
                      }
                      placeholder="Минимум 6 символов"
                      disabled={savingPw}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? "Скрыть" : "Показать"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type={showPw ? "text" : "password"}
                    value={pwForm.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPw("confirmPassword", e.target.value)
                    }
                    placeholder="Повторите пароль"
                    disabled={savingPw}
                    required
                  />
                  {pwForm.confirmPassword &&
                    pwForm.newPassword !== pwForm.confirmPassword && (
                      <p className="text-xs text-destructive">
                        Пароли не совпадают
                      </p>
                    )}
                </div>

                <Separator />

                <Button
                  type="submit"
                  variant="outline"
                  disabled={
                    savingPw ||
                    !pwForm.newPassword ||
                    pwForm.newPassword !== pwForm.confirmPassword
                  }
                >
                  {savingPw ? (
                    <><Loader2Icon className="h-4 w-4 animate-spin" /> Сохранение...</>
                  ) : (
                    "Изменить пароль"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
