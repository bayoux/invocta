"use client"

import * as React from "react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react"
import { debtorsApi } from "@/lib/debtors.api"
import { notificationsApi } from "@/lib/notifications.api"
import type { DebtorStats, NotificationStats } from "@/types"

import { useAuthStore } from "@/store/auth.store"

export function SectionCards() {
  const { user } = useAuthStore()
  const [debtorStats, setDebtorStats] = React.useState<DebtorStats | null>(null)
  const [notifStats, setNotifStats] = React.useState<NotificationStats | null>(
    null
  )
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // All roles can now access stats (backend updated)
    // but guard anyway in case of older backend
    if (!user) return
    Promise.all([debtorsApi.getStats(), notificationsApi.getStats()])
      .then(([ds, ns]) => {
        setDebtorStats(ds)
        setNotifStats(ns)
      })
      .catch(() => {
        // silently fail — user may not have permission
      })
      .finally(() => setLoading(false))
  }, [user])

  const activeCount =
    debtorStats?.byStatus.find((s) => s.status === "active")?.count ?? "0"
  const ptpCount =
    debtorStats?.byStatus.find((s) => s.status === "ptp")?.count ?? "0"
  const paidCount =
    debtorStats?.byStatus.find((s) => s.status === "paid")?.count ?? "0"
  const sentCount =
    notifStats?.byStatus.find((s) => s.status === "sent")?.count ?? "0"

  const totalDebt =
    debtorStats?.byStatus.reduce((sum, s) => sum + Number(s.totalDebt), 0) ?? 0

  const cards = [
    {
      description: "Всего должников",
      title: loading ? "—" : String(debtorStats?.total ?? 0),
      badge: {
        icon: TrendingUpIcon,
        label: `Активных: ${activeCount}`,
        up: true,
      },
      footer: {
        main: `DPD 1–10: ${debtorStats?.dpdBuckets["1-10"] ?? 0} чел.`,
        sub: `DPD 11–30: ${debtorStats?.dpdBuckets["11-30"] ?? 0} чел.`,
      },
    },
    {
      description: "Общий долг",
      title: loading
        ? "—"
        : totalDebt.toLocaleString("ru", { maximumFractionDigits: 0 }) + " сом",
      badge: { icon: TrendingDownIcon, label: `PTP: ${ptpCount}`, up: false },
      footer: {
        main: `Оплачено: ${paidCount} договоров`,
        sub: "Soft-collection период",
      },
    },
    {
      description: "Уведомлений отправлено",
      title: loading ? "—" : String(notifStats?.total ?? 0),
      badge: {
        icon: TrendingUpIcon,
        label: `Сегодня: ${notifStats?.sentToday ?? 0}`,
        up: true,
      },
      footer: {
        main: `Доставлено: ${sentCount}`,
        sub: "SMS + WhatsApp каналы",
      },
    },
    {
      description: "Уровень сбора",
      title: loading
        ? "—"
        : debtorStats?.total
          ? `${Math.round((Number(paidCount) / debtorStats.total) * 100)}%`
          : "0%",
      badge: { icon: TrendingUpIcon, label: "+4.5%", up: true },
      footer: {
        main: "Цель: снизить нагрузку на 40%",
        sub: "Автоматизация рассылок",
      },
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.description} className="@container/card">
          <CardHeader>
            <CardDescription>{card.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {loading ? (
                <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
              ) : (
                card.title
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <card.badge.icon />
                {card.badge.label}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footer.main}
              {card.badge.up ? (
                <TrendingUpIcon className="size-4" />
              ) : (
                <TrendingDownIcon className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{card.footer.sub}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
