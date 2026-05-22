"use client"

import * as React from "react"
import { notificationsApi } from "@/lib/notifications.api"
import type { NotificationStats } from "@/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MessageSquareIcon,
} from "lucide-react"

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "text-emerald-500",
  sms: "text-blue-500",
}

export function NotificationStats() {
  const [stats, setStats] = React.useState<NotificationStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    notificationsApi
      .getStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const sentCount =
    stats?.byStatus.find((s) => s.status === "sent")?.count ?? "0"
  const deliveredCount =
    stats?.byStatus.find((s) => s.status === "delivered")?.count ?? "0"
  const failedCount =
    stats?.byStatus.find((s) => s.status === "failed")?.count ?? "0"
  const pendingCount =
    stats?.byStatus.find((s) => s.status === "pending")?.count ?? "0"

  const items = [
    {
      label: "Отправлено сегодня",
      value: stats?.sentToday ?? 0,
      icon: CheckCircleIcon,
      color: "text-emerald-500",
    },
    {
      label: "Доставлено",
      value: deliveredCount,
      icon: CheckCircleIcon,
      color: "text-blue-500",
    },
    {
      label: "Ожидает",
      value: pendingCount,
      icon: ClockIcon,
      color: "text-yellow-500",
    },
    {
      label: "Ошибок",
      value: failedCount,
      icon: XCircleIcon,
      color: "text-destructive",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm tracking-wider text-muted-foreground uppercase">
          Статистика уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status breakdown */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-lg border bg-muted/30 p-3 text-center"
            >
              <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
              <p className="text-lg font-bold">
                {loading ? (
                  <span className="inline-block h-6 w-10 animate-pulse rounded bg-muted" />
                ) : (
                  value
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Channel breakdown */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">По каналам</p>
          <div className="flex gap-3">
            {loading ? (
              <div className="h-8 w-full animate-pulse rounded bg-muted" />
            ) : (
              stats?.byChannel.map(({ channel, count }) => (
                <div
                  key={channel}
                  className="flex flex-1 items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareIcon
                      className={`h-3.5 w-3.5 ${CHANNEL_COLORS[channel] ?? ""}`}
                    />
                    <span className="text-xs tracking-wider text-muted-foreground uppercase">
                      {channel}
                    </span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
