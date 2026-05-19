"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { format, subDays, parseISO } from "date-fns"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { notificationsApi } from "@/lib/notifications.api"
import type { Notification } from "@/types"

const chartConfig = {
  whatsapp: {
    label: "WhatsApp",
    color: "var(--primary)",
  },
  sms: {
    label: "SMS",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

type ChartPoint = {
  date: string
  whatsapp: number
  sms: number
}

function buildChartData(
  notifications: Notification[],
  days: number
): ChartPoint[] {
  const now = new Date()
  // Create a map keyed by date string
  const map: Record<string, ChartPoint> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i)
    const key = format(d, "yyyy-MM-dd")
    map[key] = { date: key, whatsapp: 0, sms: 0 }
  }

  for (const n of notifications) {
    const key = format(parseISO(n.createdAt), "yyyy-MM-dd")
    if (map[key]) {
      if (n.channel === "whatsapp") map[key].whatsapp++
      else if (n.channel === "sms") map[key].sms++
    }
  }

  return Object.values(map)
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  React.useEffect(() => {
    notificationsApi
      .getAll()
      .then(setNotifications)
      .finally(() => setLoading(false))
  }, [])

  const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7
  const chartData = React.useMemo(
    () => buildChartData(notifications, days),
    [notifications, days]
  )

  const totalWhatsapp = chartData.reduce((s, d) => s + d.whatsapp, 0)
  const totalSms = chartData.reduce((s, d) => s + d.sms, 0)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Уведомления по каналам</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            WhatsApp + SMS за период
          </span>
          <span className="@[540px]/card:hidden">
            WA: {totalWhatsapp} / SMS: {totalSms}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 месяца</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 дней</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 дней</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Выберите период"
            >
              <SelectValue placeholder="30 дней" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 месяца
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 дней
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 дней
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="aspect-auto h-[250px] w-full animate-pulse rounded-lg bg-muted" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillWhatsapp" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-whatsapp)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-whatsapp)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillSms" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sms)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sms)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleDateString("ru-RU", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) =>
                      new Date(value).toLocaleDateString("ru-RU", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="sms"
                type="natural"
                fill="url(#fillSms)"
                stroke="var(--color-sms)"
                stackId="a"
              />
              <Area
                dataKey="whatsapp"
                type="natural"
                fill="url(#fillWhatsapp)"
                stroke="var(--color-whatsapp)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
