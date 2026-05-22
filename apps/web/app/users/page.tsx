"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { usersApi } from "@/lib/users.api"
import type { UserProfile, UserRole } from "@/types"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  PlusIcon,
  EllipsisVerticalIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
} from "lucide-react"

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  supervisor: "Супервайзер",
}

const ROLE_VARIANT: Record<
  UserRole,
  "default" | "secondary" | "destructive" | "outline"
> = {
  admin: "destructive",
  manager: "default",
  supervisor: "secondary",
}

const FORM_FIELDS: {
  name: keyof typeof EMPTY_FORM
  label: string
  placeholder: string
  type?: string
}[] = [
  { name: "firstName", label: "Имя", placeholder: "Иван" },
  { name: "lastName", label: "Фамилия", placeholder: "Иванов" },
  {
    name: "email",
    label: "Email",
    placeholder: "ivan@company.com",
    type: "email",
  },
  {
    name: "password",
    label: "Пароль",
    placeholder: "••••••",
    type: "password",
  },
]

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "manager" as UserRole,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: me } = useAuthStore()
  const isAdmin = me?.role === "admin"

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await usersApi.getAll())
    } catch {
      toast.error("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await usersApi.create(form)
      toast.success("Пользователь создан")
      setShowCreate(false)
      setForm({ ...EMPTY_FORM })
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Ошибка")
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (u: UserProfile) => {
    try {
      await usersApi.update(u.id, { isActive: !u.isActive })
      toast.success(
        u.isActive ? "Пользователь деактивирован" : "Пользователь активирован"
      )
      load()
    } catch {
      toast.error("Ошибка")
    }
  }

  const handleDelete = async (u: UserProfile) => {
    if (!confirm(`Удалить пользователя ${u.email}?`)) return
    try {
      await usersApi.remove(u.id)
      toast.success("Пользователь удалён")
      load()
    } catch {
      toast.error("Ошибка удаления")
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Пользователи" />

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Пользователи</h1>
              <p className="text-sm text-muted-foreground">
                Управление доступом в систему
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreate(true)}>
                <PlusIcon />
                Добавить
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Пользователи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      {/* Name */}
                      <TableCell className="font-medium">
                        {u.firstName} {u.lastName}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[u.role]}>
                          {ROLE_LABEL[u.role]}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span
                          className={`text-sm ${u.isActive ? "text-emerald-500" : "text-muted-foreground"}`}
                        >
                          {u.isActive ? "Активен" : "Деактивирован"}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {isAdmin && u.id !== me?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                              >
                                <EllipsisVerticalIcon className="h-4 w-4" />
                                <span className="sr-only">Действия</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => handleToggle(u)}>
                                {u.isActive ? (
                                  <>
                                    <ToggleLeftIcon />
                                    Деактивировать
                                  </>
                                ) : (
                                  <>
                                    <ToggleRightIcon />
                                    Активировать
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(u)}
                              >
                                <Trash2Icon />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>

      {/* ── Create dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            {FORM_FIELDS.map(({ name, label, placeholder, type = "text" }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type={type}
                  placeholder={placeholder}
                  required
                  value={form[name] as string}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, [name]: e.target.value }))
                  }
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select
                value={form.role}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, role: v as UserRole }))
                }
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
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
