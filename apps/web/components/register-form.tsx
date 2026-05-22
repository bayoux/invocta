"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { authApi } from "@/lib/auth.api"
import type { UserRole } from "@/types"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "manager" as UserRole,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuth(res.user, res.accessToken)
      toast.success("Аккаунт создан!")
      router.replace("/dashboard")
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ошибка регистрации"
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Создать аккаунт</CardTitle>
          <CardDescription>
            Заполните данные для регистрации в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="firstName">Имя</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="Иван"
                    value={form.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      set("firstName", e.target.value)
                    }
                    disabled={loading}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Фамилия</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="Иванов"
                    value={form.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      set("lastName", e.target.value)
                    }
                    disabled={loading}
                    required
                  />
                </Field>
              </div>

              {/* Email */}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ivan@company.com"
                  value={form.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    set("email", e.target.value)
                  }
                  disabled={loading}
                  required
                />
              </Field>

              {/* Password */}
              <Field>
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      set("password", e.target.value)
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

              {/* Role */}
              <Field>
                <FieldLabel>Роль</FieldLabel>
                <Select
                  value={form.role}
                  onValueChange={(v: string) => set("role", v)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="manager">Менеджер</SelectItem>
                      <SelectItem value="supervisor">Супервайзер</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {/* Submit */}
              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Создание..." : "Создать аккаунт"}
                </Button>

                <FieldDescription className="mt-2 text-center">
                  Уже есть аккаунт?{" "}
                  <a href="/login" className="underline underline-offset-4">
                    Войти
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
