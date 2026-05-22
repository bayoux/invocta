"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { debtorsApi } from "@/lib/debtors.api"
import type { Debtor, DebtorStatus, DebtorsFilter } from "@/types"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { CsvUploadButton } from "@/components/csv-upload-button"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
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
import { Label } from "@workspace/ui/components/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  PlusIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  Trash2Icon,
} from "lucide-react"

// ─── Status config ────────────────────────────────────────────────────────────

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

const STATUS_OPTIONS: { value: DebtorStatus | "all"; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Активен" },
  { value: "ptp", label: "PTP" },
  { value: "paid", label: "Оплачено" },
  { value: "disputed", label: "Спор" },
  { value: "closed", label: "Закрыт" },
]

const CREATE_FIELDS: {
  name: string
  label: string
  placeholder: string
  type?: string
}[] = [
  { name: "firstName", label: "Имя", placeholder: "Нурлан" },
  { name: "lastName", label: "Фамилия", placeholder: "Токтосунов" },
  { name: "phone", label: "Телефон", placeholder: "+996700000000" },
  {
    name: "contractNumber",
    label: "Номер договора",
    placeholder: "LOAN-2024-001",
  },
  {
    name: "totalDebt",
    label: "Сумма долга",
    placeholder: "15000",
    type: "number",
  },
  { name: "dueDate", label: "Дата платежа", placeholder: "", type: "date" },
  {
    name: "dpd",
    label: "DPD (дней просрочки)",
    placeholder: "0",
    type: "number",
  },
]

const EMPTY_FORM: Record<string, string> = {
  firstName: "",
  lastName: "",
  phone: "",
  contractNumber: "",
  totalDebt: "",
  dueDate: "",
  dpd: "0",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebtorsPage() {
  const { user } = useAuthStore()
  const canEdit = user?.role === "admin" || user?.role === "manager"

  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DebtorsFilter>({ page: 1, limit: 15 })
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] =
    useState<Record<string, string>>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await debtorsApi.getAll({
        ...filter,
        search: search || undefined,
      })
      setDebtors(res.data)
      setTotal(res.total)
    } catch {
      toast.error("Ошибка загрузки данных")
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить должника ${name}?`)) return
    try {
      await debtorsApi.remove(id)
      toast.success("Должник удалён")
      load()
    } catch {
      toast.error("Ошибка удаления")
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await debtorsApi.create({
        ...createForm,
        totalDebt: Number(createForm.totalDebt),
        dpd: Number(createForm.dpd),
      } as any)
      toast.success("Должник добавлен")
      setShowCreate(false)
      setCreateForm(EMPTY_FORM)
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Ошибка")
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.ceil(total / (filter.limit || 15))
  const currentPage = filter.page ?? 1

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
        <SiteHeader title="Должники" />

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Должники</h1>
              <p className="text-sm text-muted-foreground">Всего: {total}</p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <CsvUploadButton onSuccess={load} />
                <Button onClick={() => setShowCreate(true)}>
                  <PlusIcon />
                  Добавить
                </Button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Поиск по имени, договору, телефону..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value)
                  setFilter((f) => ({ ...f, page: 1 }))
                }}
              />
            </div>

            <Select
              value={filter.status ?? "all"}
              onValueChange={(v: string) =>
                setFilter((f) => ({
                  ...f,
                  status: v === "all" ? undefined : (v as DebtorStatus),
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="DPD от"
              className="w-24"
              value={filter.dpdMin ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilter((f) => ({
                  ...f,
                  dpdMin: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                }))
              }
            />
            <Input
              type="number"
              placeholder="DPD до"
              className="w-24"
              value={filter.dpdMax ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilter((f) => ({
                  ...f,
                  dpdMax: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                }))
              }
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead>Должник</TableHead>
                  <TableHead>Договор</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead className="text-right">Долг</TableHead>
                  <TableHead>DPD</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : debtors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Должники не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  debtors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <p className="font-medium">
                          {d.lastName} {d.firstName}
                        </p>
                        {d.middleName && (
                          <p className="text-xs text-muted-foreground">
                            {d.middleName}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.contractNumber}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {d.phone}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {Number(d.totalDebt).toLocaleString("ru")}
                        <span className="ml-1 text-xs text-muted-foreground">
                          сом
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={
                            d.dpd > 20
                              ? "font-bold text-destructive"
                              : d.dpd > 10
                                ? "font-semibold text-yellow-500"
                                : "text-muted-foreground"
                          }
                        >
                          {d.dpd}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant={STATUS_VARIANT[d.status]}>
                          {STATUS_LABEL[d.status]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" />
                              <span className="sr-only">Действия</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem asChild>
                              <Link href={`/debtors/${d.id}`}>
                                <EyeIcon />
                                Открыть
                              </Link>
                            </DropdownMenuItem>
                            {user?.role === "admin" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    handleDelete(
                                      d.id,
                                      `${d.firstName} ${d.lastName}`
                                    )
                                  }
                                >
                                  <Trash2Icon />
                                  Удалить
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Стр. {currentPage} из {totalPages} · Всего {total}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setFilter((f) => ({ ...f, page: currentPage - 1 }))
                    }
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setFilter((f) => ({ ...f, page: currentPage + 1 }))
                    }
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новый должник</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            {CREATE_FIELDS.map(
              ({ name, label, placeholder, type = "text" }) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type={type}
                    placeholder={placeholder}
                    required={name !== "dpd"}
                    value={createForm[name]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((f) => ({ ...f, [name]: e.target.value }))
                    }
                  />
                </div>
              )
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Добавление..." : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
