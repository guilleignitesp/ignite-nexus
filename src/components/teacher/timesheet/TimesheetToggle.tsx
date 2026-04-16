'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { recordTimesheet } from '@/lib/actions/timesheets'
import type { TimesheetEntry } from '@/lib/data/timesheets'

interface TimesheetToggleProps {
  isIn: boolean
  todayEntries: TimesheetEntry[]
}

export function TimesheetToggle({ isIn, todayEntries }: TimesheetToggleProps) {
  const t = useTranslations('teacherTimesheet')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      try {
        await recordTimesheet(isIn ? 'out' : 'in')
        router.refresh()
      } catch {
        setError(t('error'))
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Estado actual + botón */}
      <div className="flex items-center gap-4 rounded-lg border p-5">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{t('currentStatus')}</p>
          <p className={`mt-0.5 text-lg font-semibold ${isIn ? 'text-green-600' : 'text-muted-foreground'}`}>
            {isIn ? t('statusIn') : t('statusOut')}
          </p>
        </div>
        <Button
          onClick={handleToggle}
          disabled={isPending}
          variant={isIn ? 'outline' : 'default'}
          size="lg"
        >
          {isPending ? t('clocking') : isIn ? t('clockOut') : t('clockIn')}
        </Button>
      </div>

      {/* Fichajes del día */}
      {todayEntries.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">{t('todayTitle')}</p>
          <div className="space-y-1">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-sm">
                <span className={entry.type === 'in' ? 'text-green-600' : 'text-muted-foreground'}>
                  {entry.type === 'in' ? '→' : '←'}
                </span>
                <span className="tabular-nums">
                  {new Date(entry.recordedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-muted-foreground">
                  {entry.type === 'in' ? t('entryIn') : t('entryOut')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
