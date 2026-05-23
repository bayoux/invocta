"use client"

import * as React from "react"
import { getDebtorStatusHistory } from "@/lib/debtors.api"
import type { DebtorStatusHistoryEntry, DebtorStatus } from "@/types"
import { Badge } from "@workspace/ui/components/badge"
import { ArrowRightIcon } from "lucide-react"

const STATUS_LABEL: Record<DebtorStatus, string> = {
  active: "Активен",
  ptp: "PTP",
  paid: "Оплачено",
  disputed: "Спор",
  closed: "Закрыт",
}

const STATUS_VARIANT: Record<DebtorStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  ptp: "outline",
  paid: "secondary",
  disputed: "destructive",
  closed: "outline",
}

export function StatusHistoryTimeline({ debtorId }: { debtorId: string }) {
  const [history, setHistory] = React.useState<DebtorStatusHistoryEntry[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getDebtorStatusHistory(debtorId)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debtorId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">История изменений пуста</p>
    )
  }

  return (
    <div className="relative space-y-3">
      {/* Vertical line */}
      <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

      {history.map((entry) => (
        <div key={entry.id} className="relative flex gap-4 pl-8">
          {/* Dot */}
          <div className="absolute left-0 top-2 h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>

          <div className="flex-1 min-w-0 rounded-lg border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              {entry.fromStatus ? (
                <>
                  <Badge variant={STATUS_VARIANT[entry.fromStatus]} className="text-xs">
                    {STATUS_LABEL[entry.fromStatus]}
                  </Badge>
                  <ArrowRightIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Создан →</span>
              )}
              <Badge variant={STATUS_VARIANT[entry.toStatus]} className="text-xs">
                {STATUS_LABEL[entry.toStatus]}
              </Badge>
            </div>

            {entry.comment && (
              <p className="mt-1 text-xs text-muted-foreground">{entry.comment}</p>
            )}

            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {new Date(entry.changedAt).toLocaleString("ru-RU")}
              </span>
              {entry.changedBy && (
                <>
                  <span>·</span>
                  <span>
                    {entry.changedBy.firstName} {entry.changedBy.lastName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
