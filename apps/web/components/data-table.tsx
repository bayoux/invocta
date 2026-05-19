"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  EllipsisVerticalIcon,
  Columns3Icon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  PlusIcon,
} from "lucide-react"

import { debtorsApi } from "@/lib/debtors.api"
import { notificationsApi } from "@/lib/notifications.api"
import { useAuthStore } from "@/store/auth.store"
import type { Debtor, DebtorStatus } from "@/types"

// ─── Status helpers ─────────────────────────────────────────────────────────

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

// ─── Columns ─────────────────────────────────────────────────────────────────

function DebtorDrawer({ debtor }: { debtor: Debtor }) {
  const isMobile = useIsMobile()
  const { user } = useAuthStore()
  const [message, setMessage] = React.useState("")
  const [channel, setChannel] = React.useState<"whatsapp" | "sms">("whatsapp")
  const [sending, setSending] = React.useState(false)

  const canSend = user?.role === "admin" || user?.role === "manager"

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await notificationsApi.send({ debtorId: debtor.id, channel, message })
      toast.success("Уведомление отправлено!")
      setMessage("")
    } catch {
      toast.error("Ошибка отправки")
    } finally {
      setSending(false)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {debtor.lastName} {debtor.firstName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            {debtor.lastName} {debtor.firstName} {debtor.middleName}
          </DrawerTitle>
          <DrawerDescription>
            Договор: {debtor.contractNumber} · DPD: {debtor.dpd} дней
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {/* Debt summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Общий долг",
                value: `${Number(debtor.totalDebt).toLocaleString("ru")} сом`,
              },
              {
                label: "Основной",
                value: `${Number(debtor.principalDebt).toLocaleString("ru")} сом`,
              },
              {
                label: "Проценты",
                value: `${Number(debtor.interestDebt).toLocaleString("ru")} сом`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Телефон</Label>
              <p className="font-medium">{debtor.phone}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Статус</Label>
              <p>
                <Badge variant={STATUS_VARIANT[debtor.status]}>
                  {STATUS_LABEL[debtor.status]}
                </Badge>
              </p>
            </div>
            {debtor.ptpDate && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    PTP дата
                  </Label>
                  <p className="font-medium">
                    {new Date(debtor.ptpDate).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    PTP сумма
                  </Label>
                  <p className="font-medium">
                    {Number(debtor.ptpAmount).toLocaleString("ru")} сом
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Send notification */}
          {canSend && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Канал уведомления</Label>
                <div className="flex gap-2">
                  {(["whatsapp", "sms"] as const).map((ch) => (
                    <Button
                      key={ch}
                      type="button"
                      size="sm"
                      variant={channel === ch ? "default" : "outline"}
                      onClick={() => setChannel(ch)}
                    >
                      {ch.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="message">Сообщение</Label>
                <textarea
                  id="message"
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                  placeholder="Текст уведомления..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          {canSend && (
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? "Отправка..." : "Отправить уведомление"}
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Закрыть</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function getColumns(onDelete: (id: string) => void): ColumnDef<Debtor>[] {
  return [
    {
      accessorKey: "lastName",
      header: "Должник",
      cell: ({ row }: { row: Row<Debtor> }) => (
        <DebtorDrawer debtor={row.original} />
      ),
      enableHiding: false,
    },
    {
      accessorKey: "contractNumber",
      header: "Договор",
      cell: ({ row }: { row: Row<Debtor> }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.contractNumber}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Телефон",
      cell: ({ row }: { row: Row<Debtor> }) => (
        <span className="text-muted-foreground">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: "totalDebt",
      header: () => <div className="text-right">Долг</div>,
      cell: ({ row }: { row: Row<Debtor> }) => (
        <div className="text-right font-medium">
          {Number(row.original.totalDebt).toLocaleString("ru")}
          <span className="ml-1 text-xs text-muted-foreground">сом</span>
        </div>
      ),
    },
    {
      accessorKey: "dpd",
      header: "DPD",
      cell: ({ row }: { row: Row<Debtor> }) => {
        const dpd = row.original.dpd
        return (
          <span
            className={
              dpd > 20
                ? "font-bold text-destructive"
                : dpd > 10
                  ? "font-semibold text-yellow-500"
                  : "text-muted-foreground"
            }
          >
            {dpd}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }: { row: Row<Debtor> }) => (
        <Badge variant={STATUS_VARIANT[row.original.status as DebtorStatus]}>
          {STATUS_LABEL[row.original.status as DebtorStatus]}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<Debtor> }) => {
        const router = useRouter()
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                size="icon"
              >
                <EllipsisVerticalIcon />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => router.push(`/debtors/${row.original.id}`)}
              >
                Открыть
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original.id)}
              >
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

// ─── DataTable component ──────────────────────────────────────────────────────

export function DataTable() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [data, setData] = React.useState<Debtor[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await debtorsApi.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter || undefined,
      })
      setData(res.data)
      setTotal(res.total)
    } catch {
      toast.error("Ошибка загрузки должников")
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter])

  React.useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить должника?")) return
    try {
      await debtorsApi.remove(id)
      toast.success("Удалено")
      load()
    } catch {
      toast.error("Ошибка")
    }
  }

  const columns = React.useMemo(
    () => getColumns(handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { sorting, columnVisibility, columnFilters, pagination },
    manualPagination: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const canAdd = user?.role === "admin" || user?.role === "manager"

  return (
    <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Mobile selector */}
        <Label htmlFor="view-selector" className="sr-only">
          Вид
        </Label>
        <Select defaultValue="all">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Выберите вид" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Все должники</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="ptp">PTP</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Desktop tabs */}
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">Все должники</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="ptp">PTP</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {/* Search */}
          <Input
            placeholder="Поиск..."
            value={globalFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setGlobalFilter(e.target.value)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            className="h-8 w-40 lg:w-56"
          />

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon data-icon="inline-start" />
                Колонки
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {table
                .getAllColumns()
                .filter(
                  (col) =>
                    typeof col.accessorFn !== "undefined" && col.getCanHide()
                )
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v: boolean) => col.toggleVisibility(v)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {canAdd && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/debtors")}
            >
              <PlusIcon />
              <span className="hidden lg:inline">Добавить</span>
            </Button>
          )}
        </div>
      </div>

      <TabsContent
        value="all"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} colSpan={h.colSpan}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Должники не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">Всего: {total}</div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Строк
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(v: string) => table.setPageSize(Number(v))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 50].map((ps) => (
                      <SelectItem key={ps} value={`${ps}`}>
                        {ps}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Стр. {table.getState().pagination.pageIndex + 1} из{" "}
              {table.getPageCount() || 1}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="active" className="px-4 lg:px-6">
        <div className="flex aspect-video w-full flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Фильтр «Активные» — в разработке
        </div>
      </TabsContent>
      <TabsContent value="ptp" className="px-4 lg:px-6">
        <div className="flex aspect-video w-full flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Фильтр «PTP» — в разработке
        </div>
      </TabsContent>
    </Tabs>
  )
}
