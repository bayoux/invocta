"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { notificationsApi } from "@/lib/notifications.api"
import { debtorsApi } from "@/lib/debtors.api"
import type { Notification, Debtor, NotificationChannel } from "@/types"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
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
import { RefreshCwIcon, SendIcon } from "lucide-react"

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает",
  sent: "Отправлено",
  delivered: "Доставлено",
  read: "Прочитано",
  failed: "Ошибка",
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  sent: "default",
  delivered: "secondary",
  read: "secondary",
  failed: "destructive",
}

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: "💬",
  sms: "📱",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const canSend = user?.role === "admin" || user?.role === "manager"

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [showSend, setShowSend] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState<{
    debtorId: string
    channel: NotificationChannel
    message: string
  }>({ debtorId: "", channel: "whatsapp", message: "" })

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true)
    try {
      const [n, d] = await Promise.all([
        notificationsApi.getAll(),
        debtorsApi.getAll({ limit: 100 }),
      ])
      setNotifications(n)
      setDebtors(d.data)
    } catch {
      toast.error("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const n = await notificationsApi.send(form)
      setNotifications((prev) => [n, ...prev])
      toast.success("Уведомление отправлено!")
      setShowSend(false)
      setForm({ debtorId: "", channel: "whatsapp", message: "" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Ошибка")
    } finally {
      setSending(false)
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
        <SiteHeader title="Уведомления" />

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Уведомления</h1>
              <p className="text-sm text-muted-foreground">
                История всех отправленных сообщений
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={load}>
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
              {canSend && (
                <Button onClick={() => setShowSend(true)}>
                  <SendIcon />
                  Отправить
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead className="w-14">Канал</TableHead>
                  <TableHead>Должник</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="whitespace-nowrap">Дата</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Уведомлений пока нет
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((n) => (
                    <TableRow key={n.id}>
                      {/* Channel */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="gap-1 text-xs uppercase"
                        >
                          {CHANNEL_ICON[n.channel]} {n.channel}
                        </Badge>
                      </TableCell>

                      {/* Debtor */}
                      <TableCell>
                        {n.debtor ? (
                          <div>
                            <p className="font-medium">
                              {n.debtor.lastName} {n.debtor.firstName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {n.debtor.phone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {n.debtorId.slice(0, 8)}…
                          </span>
                        )}
                      </TableCell>

                      {/* Message */}
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">{n.message}</p>
                        {n.errorMessage && (
                          <p className="mt-0.5 text-xs text-destructive">
                            {n.errorMessage}
                          </p>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[n.status]}>
                          {STATUS_LABEL[n.status]}
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>

      {/* ── Send dialog ───────────────────────────────────────────────────── */}
      <Dialog open={showSend} onOpenChange={setShowSend}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новое уведомление</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Debtor select */}
            <div className="space-y-1.5">
              <Label>Должник</Label>
              <Select
                required
                value={form.debtorId}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, debtorId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="— Выберите должника —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {debtors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.lastName} {d.firstName} — {d.contractNumber}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Channel toggle */}
            <div className="space-y-1.5">
              <Label>Канал</Label>
              <div className="flex gap-2">
                {(["whatsapp", "sms"] as const).map((ch) => (
                  <Button
                    key={ch}
                    type="button"
                    variant={form.channel === ch ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                  >
                    {CHANNEL_ICON[ch]} {ch.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="notif-message">Сообщение</Label>
              <Textarea
                id="notif-message"
                rows={4}
                required
                placeholder="Текст сообщения..."
                value={form.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSend(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={sending || !form.debtorId}>
                {sending ? "Отправка..." : "Отправить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
