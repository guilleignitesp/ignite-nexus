'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { generateGroupSessions } from '@/lib/actions/sessions-dashboard'

interface Props {
  groupId: string
}

export function GenerateSessionsForm({ groupId }: Props) {
  const t = useTranslations('groupDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) return
    if (endDate < startDate) {
      setError(t('dateRangeError'))
      return
    }

    setError(null)
    setResult(null)

    startTransition(async () => {
      try {
        const { created } = await generateGroupSessions(groupId, startDate, endDate)
        setResult(created)
        router.refresh()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error'
        setError(msg === 'NO_PLANNING' ? t('noPlanning') : msg === 'NO_SCHEDULE' ? t('noSchedule') : msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('startDate')}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('endDate')}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <Button type="submit" size="sm" disabled={isPending || !startDate || !endDate}>
          {isPending ? t('generating') : t('generate')}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {result !== null && (
        <p className="text-sm text-muted-foreground">
          {result === 0 ? t('noNewSessions') : t('sessionsCreated', { count: result })}
        </p>
      )}
    </form>
  )
}
