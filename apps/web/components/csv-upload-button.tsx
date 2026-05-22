"use client"

import * as React from "react"
import { toast } from "sonner"
import { debtorsApi } from "@/lib/debtors.api"
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
import { UploadIcon, Loader2Icon, FileIcon, XIcon } from "lucide-react"
import type { CreateDebtorDto } from "@/types"

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Expected columns (case-insensitive, any order):
// firstName, lastName, phone, contractNumber, totalDebt, dueDate, dpd

function parseCSV(text: string): CreateDebtorDto[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2)
    throw new Error("Файл пустой или содержит только заголовок")

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/"/g, ""))

  return lines.slice(1).map((line, i) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ""
    })

    const required = [
      "firstname",
      "lastname",
      "phone",
      "contractnumber",
      "totaldebt",
      "duedate",
    ]
    for (const field of required) {
      if (!row[field])
        throw new Error(`Строка ${i + 2}: отсутствует поле "${field}"`)
    }

    return {
      firstName: row["firstname"],
      lastName: row["lastname"],
      middleName: row["middlename"] || undefined,
      phone: row["phone"],
      email: row["email"] || undefined,
      contractNumber: row["contractnumber"],
      contractType: (row["contracttype"] as any) || "loan",
      totalDebt: Number(row["totaldebt"]),
      principalDebt: row["principaldebt"]
        ? Number(row["principaldebt"])
        : undefined,
      interestDebt: row["interestdebt"]
        ? Number(row["interestdebt"])
        : undefined,
      dueDate: row["duedate"],
      dpd: row["dpd"] ? Number(row["dpd"]) : 0,
      whatsappPhone: row["whatsappphone"] || undefined,
    }
  })
}

interface Props {
  onSuccess?: () => void
}

export function CsvUploadButton({ onSuccess }: Props) {
  const { user } = useAuthStore()
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<CreateDebtorDto[]>([])
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  if (user?.role !== "admin") return null

  const handleFile = async (f: File) => {
    setFile(f)
    setParseError(null)
    setPreview([])
    try {
      const text = await f.text()
      const rows = parseCSV(text)
      setPreview(rows)
    } catch (err: any) {
      setParseError(err.message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith(".csv")) handleFile(f)
    else toast.error("Только CSV файлы")
  }

  const handleUpload = async () => {
    if (!preview.length) return
    setUploading(true)
    try {
      const result = await debtorsApi.bulkCreate(preview)
      toast.success(
        `Загружено: ${result.created} | Пропущено: ${result.skipped}`
      )
      setOpen(false)
      setFile(null)
      setPreview([])
      onSuccess?.()
    } catch {
      toast.error("Ошибка загрузки")
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview([])
    setParseError(null)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UploadIcon className="h-4 w-4" />
        Загрузить CSV
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v: boolean) => {
          setOpen(v)
          if (!v) reset()
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Массовая загрузка должников</DialogTitle>
            <DialogDescription>
              Загрузите CSV файл. Обязательные колонки:{" "}
              <code className="text-xs">
                firstName, lastName, phone, contractNumber, totalDebt, dueDate
              </code>
            </DialogDescription>
          </DialogHeader>

          {/* Drop zone */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:bg-muted/30"
            >
              <UploadIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  Перетащите CSV или нажмите для выбора
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Только .csv файлы
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
            </div>
          )}

          {/* File selected */}
          {file && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  {!parseError && (
                    <span className="text-xs text-muted-foreground">
                      — {preview.length} строк
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={reset}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {parseError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {parseError}
                </div>
              ) : (
                <div className="max-h-48 overflow-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        {[
                          "Фамилия",
                          "Имя",
                          "Телефон",
                          "Договор",
                          "Долг",
                          "DPD",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-medium text-muted-foreground"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{row.lastName}</td>
                          <td className="px-3 py-1.5">{row.firstName}</td>
                          <td className="px-3 py-1.5">{row.phone}</td>
                          <td className="px-3 py-1.5 font-mono">
                            {row.contractNumber}
                          </td>
                          <td className="px-3 py-1.5">
                            {Number(row.totalDebt).toLocaleString("ru")}
                          </td>
                          <td className="px-3 py-1.5">{row.dpd ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 10 && (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      + ещё {preview.length - 10} строк
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Example */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none hover:text-foreground">
              Пример CSV
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {`firstName,lastName,phone,contractNumber,totalDebt,dueDate,dpd
Нурлан,Токтосунов,+996700111222,LOAN-2024-001,45000,2024-01-01,25
Гульнара,Осмонова,+996555333444,LOAN-2024-002,12500,2024-01-10,16`}
            </pre>
          </details>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                reset()
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !preview.length || !!parseError}
            >
              {uploading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" /> Загрузка...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" /> Загрузить {preview.length}{" "}
                  записей
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
