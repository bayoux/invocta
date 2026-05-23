"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { authApi } from "@/lib/auth.api"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("admin@company.com")
  const [password, setPassword] = useState("admin123")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { setAuth, isAuthenticated, initFromStorage } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show toast if redirected due to expired session
  useEffect(() => {
    const reason = searchParams.get("reason")
    if (reason === "expired") {
      toast.error("Сессия истекла. Войдите снова.")
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  useEffect(() => {
    if (isAuthenticated) {
      const from = searchParams.get("from") || "/dashboard"
      router.replace(from)
    }
  }, [isAuthenticated, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      setAuth(res.user, res.accessToken)
      toast.success(`Добро пожаловать, ${res.user.firstName}!`)
      const from = searchParams.get("from") || "/dashboard"
      router.replace(from)
    } catch {
      toast.error("Неверный email или пароль")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>
            Введите ваши учётные данные для входа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="admin@company.com"
                  disabled={loading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? "Скрыть" : "Показать"}
                  </button>
                </div>
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Вход..." : "Войти"}
                </Button>

                <FieldDescription className="mt-2 text-center">
                  Нет аккаунта?{" "}
                  <a href="/register" className="underline underline-offset-4">
                    Регистрация
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Quick fill for demo */}
      <Card>
        <CardContent className="pt-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Тестовые аккаунты:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Admin",
                email: "admin@company.com",
                password: "admin123",
              },
              {
                label: "Manager",
                email: "manager@company.com",
                password: "manager123",
              },
              {
                label: "Supervisor",
                email: "supervisor@company.com",
                password: "supervisor123",
              },
            ].map((acc) => (
              <Button
                key={acc.email}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setEmail(acc.email)
                  setPassword(acc.password)
                }}
              >
                {acc.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
