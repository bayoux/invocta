import { apiClient } from "./api"
import type {
  Debtor,
  CreateDebtorDto,
  UpdateDebtorDto,
  DebtorsFilter,
  PaginatedDebtors,
  DebtorStats,
} from "@/types"

export const debtorsApi = {
  getAll: async (filter: DebtorsFilter = {}): Promise<PaginatedDebtors> => {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v))
    })
    const { data } = await apiClient.get<PaginatedDebtors>(`/debtors?${params}`)
    return data
  },

  getOne: async (id: string): Promise<Debtor> => {
    const { data } = await apiClient.get<Debtor>(`/debtors/${id}`)
    return data
  },

  getStats: async (): Promise<DebtorStats> => {
    const { data } = await apiClient.get<DebtorStats>("/debtors/stats")
    return data
  },

  create: async (dto: CreateDebtorDto): Promise<Debtor> => {
    const { data } = await apiClient.post<Debtor>("/debtors", dto)
    return data
  },

  update: async (id: string, dto: UpdateDebtorDto): Promise<Debtor> => {
    const { data } = await apiClient.patch<Debtor>(`/debtors/${id}`, dto)
    return data
  },

  setPtp: async (
    id: string,
    ptpDate: string,
    ptpAmount: number
  ): Promise<Debtor> => {
    const { data } = await apiClient.patch<Debtor>(`/debtors/${id}/ptp`, {
      ptpDate,
      ptpAmount,
    })
    return data
  },

  bulkCreate: async (
    debtors: CreateDebtorDto[]
  ): Promise<{ created: number; skipped: number }> => {
    const { data } = await apiClient.post("/debtors/bulk", debtors)
    return data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/debtors/${id}`)
  },
}

export const exportDebtorsExcel = async (
  filter: DebtorsFilter = {}
): Promise<void> => {
  const params = new URLSearchParams()
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.append(k, String(v))
  })
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/debtors/export/excel?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error("Export failed")
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `debtors_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export const getDebtorStatusHistory = async (id: string) => {
  const { data } = await apiClient.get(`/debtors/${id}/history`)
  return data
}
