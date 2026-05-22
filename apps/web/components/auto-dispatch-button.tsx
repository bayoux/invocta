"use client"

import * as React from "react"
import { toast } from "sonner"
import { notificationsApi } from "@/lib/notifications.api"
import { useAuthStore } from "@/store/auth.store"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { ZapIcon, Loader2Icon } from "lucide-react"

export function AutoDispatchButton() {
  const { user } = useAuthStore()
  const [open, setOpen] = React.useState(false)
  const [running, setRunning] = React.useState(false)

  // Only admin can trigger
  if (user?.role !== "admin") return null

  const handleDispatch = async () => {
    setRunning(true)
    try {
      await notificationsApi.processPending()
      toast.success(
        "Авторассылка запущена — все отложенные уведомления обработаны"
      )
      setOpen(false)
    } catch {
      toast.error("Ошибка запуска рассылки")
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <ZapIcon className="h-4 w-4 text-yellow-500" />
        Авторассылка
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Запустить авторассылку</DialogTitle>
            <DialogDescription>
              Система отправит все отложенные уведомления должникам с просрочкой
              1–30 дней. Действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p>
              Будут обработаны уведомления со статусом <strong>pending</strong>,
              у которых наступило время отправки.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleDispatch} disabled={running}>
              {running ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Запуск...
                </>
              ) : (
                <>
                  <ZapIcon className="h-4 w-4" />
                  Запустить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
