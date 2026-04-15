'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { bulkEnroll } from '@/lib/actions/enrollments'
import type { ActiveGroupItem } from '@/lib/data/enrollments'

type Step = 'upload' | 'review' | 'done'

interface ValidatedRow {
  rowIndex: number
  first_name: string
  last_name: string
  group_name: string
  group_id: string | null
  error: string | null
}

interface CSVUploadToolProps {
  groups: ActiveGroupItem[]
}

// Build a lookup map: lowercase group name → group id
function buildGroupMap(groups: ActiveGroupItem[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const g of groups) {
    map.set(g.name.toLowerCase().trim(), g.id)
  }
  return map
}

// Simple CSV parser — supports comma and semicolon delimiters, strips quotes
function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0]
    .split(sep)
    .map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.replace(/^"|"$/g, '').trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

// Normalize column name aliases
function normalize(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key]
  }
  return ''
}

function validateRows(
  rawRows: Array<Record<string, string>>,
  groupMap: Map<string, string>
): ValidatedRow[] {
  return rawRows.map((row, i) => {
    const first_name = normalize(row, ['nombre', 'first_name', 'firstname', 'name'])
    const last_name = normalize(row, ['apellidos', 'last_name', 'lastname', 'surname'])
    const group_name = normalize(row, ['grupo', 'group', 'group_name'])

    if (!first_name) return { rowIndex: i + 2, first_name, last_name, group_name, group_id: null, error: 'nombre' }
    if (!last_name) return { rowIndex: i + 2, first_name, last_name, group_name, group_id: null, error: 'apellidos' }
    if (!group_name) return { rowIndex: i + 2, first_name, last_name, group_name, group_id: null, error: 'grupo' }

    const group_id = groupMap.get(group_name.toLowerCase().trim()) ?? null
    if (!group_id) return { rowIndex: i + 2, first_name, last_name, group_name, group_id: null, error: `group_not_found:${group_name}` }

    return { rowIndex: i + 2, first_name, last_name, group_name, group_id, error: null }
  })
}

export function CSVUploadTool({ groups }: CSVUploadToolProps) {
  const t = useTranslations('enrollments')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ValidatedRow[]>([])
  const [result, setResult] = useState<{ enrolled: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const groupMap = buildGroupMap(groups)
  const validRows = rows.filter((r) => r.error === null)
  const errorRows = rows.filter((r) => r.error !== null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rawRows = parseCSV(text)
      const validated = validateRows(rawRows, groupMap)
      setRows(validated)
      setStep('review')
    }
    reader.readAsText(file, 'UTF-8')
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function downloadTemplate() {
    const csv = 'nombre,apellidos,grupo\nMaría,García,Grupo A\nJuan,López,Grupo B'
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_altas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    setImportError(null)
    startTransition(async () => {
      try {
        const res = await bulkEnroll(
          validRows.map((r) => ({
            firstName: r.first_name,
            lastName: r.last_name,
            groupId: r.group_id!,
          }))
        )
        setResult(res)
        setStep('done')
        router.refresh()
      } catch {
        setImportError(t('csvImportError'))
      }
    })
  }

  function reset() {
    setStep('upload')
    setRows([])
    setResult(null)
    setImportError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function errorLabel(error: string) {
    if (error.startsWith('group_not_found:')) {
      return t('csvErrorGroupNotFound', { group: error.split(':')[1] })
    }
    return t('csvErrorMissingField', { field: error })
  }

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('csvTitle')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('csvDescription')}</p>
      </div>
      <div className="p-4">

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('csvFormatHint')}</p>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => fileRef.current?.click()}>
                {t('csvUploadButton')}
              </Button>
              <Button size="sm" variant="outline" onClick={downloadTemplate}>
                {t('csvDownloadTemplate')}
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-green-600 font-medium">
                {t('csvValidRows', { count: validRows.length })}
              </span>
              {errorRows.length > 0 && (
                <span className="text-sm text-destructive font-medium">
                  {t('csvErrorRows', { count: errorRows.length })}
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">{t('csvColName')}</th>
                    <th className="px-3 py-2 font-medium">{t('csvColLastName')}</th>
                    <th className="px-3 py-2 font-medium">{t('csvColGroup')}</th>
                    <th className="px-3 py-2 font-medium">{t('csvColStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`border-b last:border-0 ${row.error ? 'bg-destructive/5' : ''}`}
                    >
                      <td className="px-3 py-1.5 text-muted-foreground">{row.rowIndex}</td>
                      <td className="px-3 py-1.5">{row.first_name || '—'}</td>
                      <td className="px-3 py-1.5">{row.last_name || '—'}</td>
                      <td className="px-3 py-1.5">{row.group_name || '—'}</td>
                      <td className="px-3 py-1.5">
                        {row.error ? (
                          <span className="text-xs text-destructive">{errorLabel(row.error)}</span>
                        ) : (
                          <span className="text-xs text-green-600">{t('csvStatusValid')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importError && <p className="text-sm text-destructive">{importError}</p>}

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleImport}
                disabled={validRows.length === 0 || isPending}
              >
                {isPending ? t('csvImporting') : t('csvImportButton', { count: validRows.length })}
              </Button>
              <Button size="sm" variant="outline" onClick={reset} disabled={isPending}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === 'done' && result && (
          <div className="space-y-3">
            <p className="text-sm text-green-600 font-medium">
              {t('csvImportSuccess', { count: result.enrolled })}
            </p>
            <Button size="sm" variant="outline" onClick={reset}>
              {t('csvStartOver')}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
