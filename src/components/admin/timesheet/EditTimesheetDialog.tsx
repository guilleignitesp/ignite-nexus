'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AdminTimesheetEntry } from '@/lib/data/admin-timesheets'
import { updateTimesheetEntry } from '@/lib/actions/admin-timesheets'

interface Props {
  entry: AdminTimesheetEntry
  onClose: () => void
}

function toDatetimeLocal(iso: string): string {
  // "2025-04-17T10:30:00+00:00" → "2025-04-17T10:30"
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditTimesheetDialog({ entry, onClose }: Props) {
  const t = useTranslations('adminTimesheet')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [dateTime, setDateTime] = useState(toDatetimeLocal(entry.recordedAt))
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateTime) return
    setError(null)

    startTransition(async () => {
      try {
        await updateTimesheetEntry(entry.id, new Date(dateTime).toISOString())
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('saveError'))
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('editTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="dateTime">{t('dateTimeLabel')}</Label>
            <input
              id="dateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
