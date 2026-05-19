import { apiClient } from "./api"
import type {
  Notification,
  SendNotificationDto,
  NotificationStats,
} from "@/types"

export const notificationsApi = {
  getAll: async (debtorId?: string): Promise<Notification[]> => {
    const params = debtorId ? `?debtorId=${debtorId}` : ""
    const { data } = await apiClient.get<Notification[]>(
      `/notifications${params}`
    )
    return data
  },

  getOne: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.get<Notification>(`/notifications/${id}`)
    return data
  },

  getStats: async (): Promise<NotificationStats> => {
    const { data } = await apiClient.get<NotificationStats>(
      "/notifications/stats"
    )
    return data
  },

  send: async (dto: SendNotificationDto): Promise<Notification> => {
    const { data } = await apiClient.post<Notification>(
      "/notifications/send",
      dto
    )
    return data
  },

  processPending: async (): Promise<void> => {
    await apiClient.post("/notifications/process-pending")
  },
}
