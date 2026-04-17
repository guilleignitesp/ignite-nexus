'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Worker } from '@/lib/data/schools'
import { addTimesheetEntry } from '@/lib/actions/admin-timesheets'

interface Props {
  workers: Worker[]
  onClose: () => void
}

export function AddTimesheetDialog({ workers, onClose }: Props) {
  const t = useTranslations('adminTimesheet')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [workerId, setWorkerId] = useState('')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [dateTime, setDateTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workerId || !dateTime) return
    setError(null)

    startTransition(async () => {
      try {
        // datetime-local value is "YYYY-MM-DDTHH:MM" — convert to ISO with seconds
        await addTimesheetEntry(workerId, type, new Date(dateTime).toISOString())
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
          <DialogTitle>{t('addTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="worker">{t('workerLabel')}</Label>
            <select
              id="worker"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{t('workerPlaceholder')}</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.first_name} {w.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">{t('typeLabel')}</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'in' | 'out')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="in">{t('typeIn')}</option>
              <option value="out">{t('typeOut')}</option>
            </select>
          </div>

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
