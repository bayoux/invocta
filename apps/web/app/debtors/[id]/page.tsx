"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { debtorsApi } from "@/lib/debtors.api"
import { notificationsApi } from "@/lib/notifications.api"
import type {
  Debtor,
  Notification,
  NotificationChannel,
  DebtorStatus,
} from "@/types"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  ArrowLeftIcon,
  MessageSquareIcon,
  PhoneIcon,
  CalendarIcon,
  SendIcon,
} from "lucide-react"

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DebtorStatus, string> = {
  active: "Активен",
  ptp: "PTP",
  paid: "Оплачено",
  disputed: "Спор",
  closed: "Закрыт",
}

const STATUS_VARIANT: Record<
  DebtorStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  ptp: "outline",
  paid: "secondary",
  disputed: "destructive",
  closed: "outline",
}

const NOTIF_STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает",
  sent: "Отправлено",
  delivered: "Доставлено",
  read: "Прочитано",
  failed: "Ошибка",
}

const NOTIF_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  sent: "default",
  delivered: "secondary",
  read: "secondary",
  failed: "destructive",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebtorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user } = useAuthStore()
  const router = useRouter()

  const [debtor, setDebtor] = useState<Debtor | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Send dialog
  const [showSend, setShowSend] = useState(false)
  const [sendForm, setSendForm] = useState<{
    channel: NotificationChannel
    message: string
  }>({ channel: "whatsapp", message: "" })
  const [sending, setSending] = useState(false)

  // PTP dialog
  const [showPtp, setShowPtp] = useState(false)
  const [ptpForm, setPtpForm] = useState({ ptpDate: "", ptpAmount: "" })
  const [savingPtp, setSavingPtp] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([debtorsApi.getOne(id), notificationsApi.getAll(id)])
      .then(([d, n]) => {
        setDebtor(d)
        setNotifications(n)
      })
      .catch(() => toast.error("Ошибка загрузки"))
      .finally(() => setLoading(false))
  }, [id])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const n = await notificationsApi.send({ debtorId: id, ...sendForm })
      setNotifications((prev) => [n, ...prev])
      toast.success(`${sendForm.channel.toUpperCase()} отправлен!`)
      setShowSend(false)
      setSendForm({ channel: "whatsapp", message: "" })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Ошибка отправки")
    } finally {
      setSending(false)
    }
  }

  const handlePtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPtp(true)
    try {
      const updated = await debtorsApi.setPtp(
        id,
        ptpForm.ptpDate,
        Number(ptpForm.ptpAmount)
      )
      setDebtor(updated)
      toast.success("PTP установлен")
      setShowPtp(false)
    } catch {
      toast.error("Ошибка")
    } finally {
      setSavingPtp(false)
    }
  }

  const openTemplate = (message: string) => {
    setSendForm({ channel: "whatsapp", message })
    setShowSend(true)
  }

  const canSend = user?.role === "admin" || user?.role === "manager"

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
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
          <SiteHeader title="Должник" />
          <div className="animate-pulse space-y-4 p-6">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!debtor) {
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
          <SiteHeader title="Должник" />
          <div className="p-6 text-muted-foreground">Должник не найден</div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const templates = [
    {
      label: "Напоминание",
      text: `Уважаемый(ая) ${debtor.firstName}! У вас задолженность ${Number(debtor.totalDebt).toLocaleString("ru")} сом. Просим погасить долг. Договор: ${debtor.contractNumber}`,
    },
    {
      label: "PTP напоминание",
      text: `${debtor.firstName}, напоминаем о вашем обещании оплаты по договору ${debtor.contractNumber}. Пожалуйста, оплатите вовремя.`,
    },
  ]

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
        <SiteHeader title={`${debtor.lastName} ${debtor.firstName}`} />

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Back */}
          <Button
            variant="ghost"
            className="-ml-2 w-fit text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Назад
          </Button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ── Left column ─────────────────────────────────────────── */}
            <div className="space-y-4 lg:col-span-2">
              {/* Identity card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">
                        {debtor.lastName} {debtor.firstName} {debtor.middleName}
                      </CardTitle>
                      <p className="mt-1 font-mono text-sm text-muted-foreground">
                        {debtor.contractNumber}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[debtor.status]}>
                      {STATUS_LABEL[debtor.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      {
                        label: "Телефон",
                        value: debtor.phone,
                        icon: PhoneIcon,
                      },
                      {
                        label: "WhatsApp",
                        value: debtor.whatsappPhone || debtor.phone,
                        icon: MessageSquareIcon,
                      },
                      {
                        label: "Email",
                        value: debtor.email || "—",
                      },
                      {
                        label: "DPD",
                        value: `${debtor.dpd} дней`,
                        danger: debtor.dpd > 20,
                      },
                    ].map(({ label, value, icon: Icon, danger }: any) => (
                      <div key={label}>
                        <p className="mb-0.5 text-xs text-muted-foreground">
                          {label}
                        </p>
                        <p
                          className={`flex items-center gap-1.5 font-medium ${
                            danger ? "text-destructive" : ""
                          }`}
                        >
                          {Icon && (
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Debt card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm tracking-wider text-muted-foreground uppercase">
                    Задолженность
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Общий долг",
                        value: debtor.totalDebt,
                        primary: true,
                      },
                      { label: "Основной", value: debtor.principalDebt },
                      { label: "Проценты", value: debtor.interestDebt },
                    ].map(({ label, value, primary }) => (
                      <div
                        key={label}
                        className="rounded-lg border bg-muted/30 p-3 text-center"
                      >
                        <p className="mb-1 text-xs text-muted-foreground">
                          {label}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            primary ? "text-destructive" : ""
                          }`}
                        >
                          {Number(value).toLocaleString("ru")}
                        </p>
                        <p className="text-xs text-muted-foreground">сом</p>
                      </div>
                    ))}
                  </div>

                  {/* PTP badge */}
                  {debtor.ptpDate && (
                    <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                      <CalendarIcon className="h-4 w-4 shrink-0 text-yellow-500" />
                      <div>
                        <p className="text-xs font-medium text-yellow-500">
                          Promise to Pay
                        </p>
                        <p className="text-sm">
                          {new Date(debtor.ptpDate).toLocaleDateString("ru-RU")}{" "}
                          — {Number(debtor.ptpAmount).toLocaleString("ru")} сом
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {debtor.notes && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Заметки оператора
                      </p>
                      <p className="text-sm">{debtor.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notification history */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm tracking-wider text-muted-foreground uppercase">
                    История уведомлений ({notifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Уведомлений не было
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <div key={n.id}>
                          {i > 0 && <Separator className="my-2" />}
                          <div className="flex gap-3">
                            <Badge
                              variant="outline"
                              className="shrink-0 self-start text-xs uppercase"
                            >
                              {n.channel}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">{n.message}</p>
                              <div className="mt-1 flex items-center gap-3">
                                <Badge
                                  variant={NOTIF_STATUS_VARIANT[n.status]}
                                  className="text-xs"
                                >
                                  {NOTIF_STATUS_LABEL[n.status]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(n.createdAt).toLocaleString(
                                    "ru-RU"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Right column — Actions ───────────────────────────────── */}
            <div className="space-y-4">
              {canSend && (
                <>
                  <Button className="w-full" onClick={() => setShowSend(true)}>
                    <SendIcon />
                    Отправить уведомление
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-500"
                    onClick={() => setShowPtp(true)}
                  >
                    <CalendarIcon />
                    Установить PTP
                  </Button>
                </>
              )}

              {/* Quick templates */}
              {canSend && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs tracking-wider text-muted-foreground uppercase">
                      Быстрые шаблоны
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {templates.map(({ label, text }) => (
                      <button
                        key={label}
                        onClick={() => openTemplate(text)}
                        className="w-full rounded-md border p-2.5 text-left transition-colors hover:bg-accent"
                      >
                        <span className="block text-xs font-medium">
                          {label}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {text}
                        </span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* ── Send dialog ───────────────────────────────────────────────────── */}
      <Dialog open={showSend} onOpenChange={setShowSend}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Отправить уведомление</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Канал</Label>
              <div className="flex gap-2">
                {(["whatsapp", "sms"] as const).map((ch) => (
                  <Button
                    key={ch}
                    type="button"
                    variant={sendForm.channel === ch ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSendForm((f) => ({ ...f, channel: ch }))}
                  >
                    {ch.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="send-message">Сообщение</Label>
              <Textarea
                id="send-message"
                rows={4}
                required
                placeholder="Текст сообщения..."
                value={sendForm.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSendForm((f) => ({ ...f, message: e.target.value }))
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
              <Button type="submit" disabled={sending}>
                {sending ? "Отправка..." : "Отправить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── PTP dialog ────────────────────────────────────────────────────── */}
      <Dialog open={showPtp} onOpenChange={setShowPtp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Promise to Pay</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ptp-date">Дата обещанной оплаты</Label>
              <Input
                id="ptp-date"
                type="date"
                required
                value={ptpForm.ptpDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPtpForm((f) => ({ ...f, ptpDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ptp-amount">Сумма (сом)</Label>
              <Input
                id="ptp-amount"
                type="number"
                required
                placeholder={String(debtor.totalDebt)}
                value={ptpForm.ptpAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPtpForm((f) => ({ ...f, ptpAmount: e.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPtp(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={savingPtp}>
                {savingPtp ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
