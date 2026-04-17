'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdminTimesheetEntry, PAGE_LIMIT } from '@/lib/data/admin-timesheets'
import type { Worker } from '@/lib/data/schools'
import { deleteTimesheetEntry } from '@/lib/actions/admin-timesheets'
import { AddTimesheetDialog } from './AddTimesheetDialog'
import { EditTimesheetDialog } from './EditTimesheetDialog'

// Re-export type for use without importing data module in client
const PAGE_SIZE = 25

interface Props {
  items: AdminTimesheetEntry[]
  total: number
  page: number
  workers: Worker[]
  workerId: string
  dateFrom: string
  dateTo: string
  locale: string
}

export function AdminTimesheetList({
  items,
  total,
  page,
  workers,
  workerId,
  dateFrom,
  dateTo,
  locale,
}: Props) {
  const t = useTranslations('adminTimesheet')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<AdminTimesheetEntry | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const vals = { workerId, dateFrom, dateTo, page: String(page), ...overrides }
    if (vals.workerId) params.set('workerId', vals.workerId)
    if (vals.dateFrom) params.set('dateFrom', vals.dateFrom)
    if (vals.dateTo) params.set('dateTo', vals.dateTo)
    if (vals.page !== '0') params.set('page', vals.page)
    const qs = params.toString()
    return `/${locale}/admin/timesheet${qs ? `?${qs}` : ''}`
  }

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    router.push(
      buildUrl({
        workerId: (fd.get('workerId') as string) ?? '',
        dateFrom: (fd.get('dateFrom') as string) ?? '',
        dateTo: (fd.get('dateTo') as string) ?? '',
        page: '0',
      })
    )
  }

  function handleDelete(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    startTransition(async () => {
      try {
        await deleteTimesheetEntry(id)
        router.refresh()
      } catch {
        // no-op
      }
    })
  }

  function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">{t('filterWorker')}</label>
          <select
            name="workerId"
            defaultValue={workerId}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t('filterWorker')}</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.first_name} {w.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">{t('filterDateFrom')}</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={dateFrom}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">{t('filterDateTo')}</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={dateTo}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Button type="submit" size="sm" variant="outline">
          {t('applyFilter')}
        </Button>

        <div className="ml-auto">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            {t('addEntry')}
          </Button>
        </div>
      </form>

      {/* Table */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('noResults')}</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('colWorker')}</th>
                <th className="px-4 py-3 text-left font-medium w-28">{t('colType')}</th>
                <th className="px-4 py-3 text-left font-medium w-48">{t('colDateTime')}</th>
                <th className="px-4 py-3 text-right font-medium w-36" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {item.workerFirstName} {item.workerLastName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.type === 'in' ? 'default' : 'secondary'}>
                      {item.type === 'in' ? t('typeIn') : t('typeOut')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatDateTime(item.recordedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(item)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('pageOf', { page: page + 1, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              render={
                <a href={buildUrl({ page: String(page - 1) })} />
              }
            >
              {t('prev')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              render={
                <a href={buildUrl({ page: String(page + 1) })} />
              }
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {addOpen && (
        <AddTimesheetDialog workers={workers} onClose={() => setAddOpen(false)} />
      )}
      {editing && (
        <EditTimesheetDialog entry={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
