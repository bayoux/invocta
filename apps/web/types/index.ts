// ─── Auth ───────────────────────────────────────────────
export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  firstName: string
  lastName: string
  password: string
  role?: UserRole
}

export interface AuthResponse {
  accessToken: string
  user: UserProfile
}

// ─── Users ──────────────────────────────────────────────
export type UserRole = "admin" | "manager" | "supervisor"

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  email: string
  firstName: string
  lastName: string
  password: string
  role?: UserRole
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  isActive?: boolean
}

// ─── Debtors ────────────────────────────────────────────
export type DebtorStatus = "active" | "ptp" | "paid" | "disputed" | "closed"
export type ContractType = "loan" | "credit_card" | "installment"

export interface Debtor {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  email?: string
  contractNumber: string
  contractType: ContractType
  totalDebt: number
  principalDebt: number
  interestDebt: number
  dueDate: string
  dpd: number
  status: DebtorStatus
  ptpDate?: string
  ptpAmount?: number
  whatsappPhone?: string
  whatsappOptOut: boolean
  notes?: string
  notifications?: Notification[]
  createdAt: string
  updatedAt: string
}

export interface CreateDebtorDto {
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  email?: string
  contractNumber: string
  contractType?: ContractType
  totalDebt: number
  principalDebt?: number
  interestDebt?: number
  dueDate: string
  dpd?: number
  status?: DebtorStatus
  whatsappPhone?: string
  whatsappOptOut?: boolean
  notes?: string
}

export interface UpdateDebtorDto extends Partial<CreateDebtorDto> {
  ptpDate?: string
  ptpAmount?: number
}

export interface DebtorsFilter {
  status?: DebtorStatus
  dpdMin?: number
  dpdMax?: number
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedDebtors {
  data: Debtor[]
  total: number
  page: number
  limit: number
}

export interface DebtorStats {
  total: number
  byStatus: { status: DebtorStatus; count: string; totalDebt: string }[]
  dpdBuckets: { "1-10": number; "11-30": number }
}

// ─── Notifications ──────────────────────────────────────
export type NotificationChannel = "sms" | "whatsapp"
export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
export type NotificationType =
  | "reminder"
  | "ptp_reminder"
  | "payment_confirm"
  | "manual"

export interface Notification {
  id: string
  debtorId: string
  debtor?: Debtor
  createdById?: string
  createdBy?: UserProfile
  channel: NotificationChannel
  type: NotificationType
  status: NotificationStatus
  message: string
  templateId?: string
  externalId?: string
  errorMessage?: string
  scheduledAt?: string
  sentAt?: string
  createdAt: string
  updatedAt: string
}

export interface SendNotificationDto {
  debtorId: string
  channel: NotificationChannel
  type?: NotificationType
  message: string
  scheduledAt?: string
}

export interface NotificationStats {
  total: number
  byStatus: { status: NotificationStatus; count: string }[]
  byChannel: { channel: NotificationChannel; count: string }[]
  sentToday: number
}

// ─── Status History ──────────────────────────────────────────────────────────
export interface DebtorStatusHistoryEntry {
  id: string
  debtorId: string
  fromStatus: DebtorStatus | null
  toStatus: DebtorStatus
  comment: string | null
  changedById: string | null
  changedBy?: UserProfile
  changedAt: string
}
