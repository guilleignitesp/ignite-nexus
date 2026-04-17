'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeekSession, ActiveAssignment } from '@/lib/data/sessions-dashboard'
import {
  getWorkerAvailability,
  addSubstitute,
  type AvailabilityResult,
  type WorkerLayerItem,
} from '@/lib/actions/sessions-dashboard'

interface Props {
  session: WeekSession
  assignments: ActiveAssignment[]
  onClose: () => void
}

interface WorkerRowProps {
  worker: WorkerLayerItem
  sessionId: string
  showAdd: boolean
  onAdded: () => void
}

function WorkerRow({ worker, sessionId, showAdd, onAdded }: WorkerRowProps) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    setError(null)
    startTransition(async () => {
      try {
        await addSubstitute(sessionId, worker.id)
        router.refresh()
        onAdded()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.375rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <span style={{ fontSize: '0.875rem' }}>
          {worker.firstName} {worker.lastName}
        </span>
        {worker.differentSchool && (
          <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
            ⚠ {t('travelWarning')}
          </div>
        )}
        {error && (
          <div style={{ fontSize: '0.7rem', color: 'var(--destructive)', marginTop: '0.125rem' }}>
            {error.startsWith('CONFLICT:') ? t('conflictError') : error}
          </div>
        )}
      </div>
      {showAdd && (
        <Button size="xs" onClick={handleAdd} disabled={isPending}>
          {isPending ? t('adding') : t('addWorker')}
        </Button>
      )}
    </div>
  )
}

function WorkerSection({
  title,
  workers,
  sessionId,
  showAdd,
  titleColor,
  onAdded,
}: {
  title: string
  workers: WorkerLayerItem[]
  sessionId: string
  showAdd: boolean
  titleColor?: string
  onAdded: () => void
}) {
  if (workers.length === 0) return null

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: titleColor ?? 'var(--foreground)',
          marginBottom: '0.25rem',
        }}
      >
        {title} ({workers.length})
      </div>
      {workers.map((w) => (
        <WorkerRow
          key={w.id}
          worker={w}
          sessionId={sessionId}
          showAdd={showAdd}
          onAdded={onAdded}
        />
      ))}
    </div>
  )
}

export function SubstitutePanel({ session, assignments, onClose }: Props) {
  const t = useTranslations('sessionsDashboard')
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getWorkerAvailability(session.id)
      .then((result) => {
        setAvailability(result)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Error loading availability')
      })
      .finally(() => setLoading(false))
  }, [session.id])

  const timeLabel = `${session.startTime.slice(0, 5)}–${session.endTime.slice(0, 5)}`

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('substituteTitle')} — {timeLabel}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 0' }}>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        )}

        {error && (
          <div
            style={{
              color: 'var(--destructive)',
              fontSize: '0.875rem',
              padding: '0.75rem',
              border: '1px solid var(--destructive)',
              borderRadius: '0.375rem',
            }}
          >
            {error}
          </div>
        )}

        {availability && !loading && (
          <div style={{ paddingTop: '0.5rem' }}>
            <WorkerSection
              title={t('p1Title')}
              workers={availability.p1Surplus}
              sessionId={session.id}
              showAdd
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p2Title')}
              workers={availability.p2Free}
              sessionId={session.id}
              showAdd
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p3Title')}
              workers={availability.p3Critical}
              sessionId={session.id}
              showAdd={false}
              titleColor="var(--destructive)"
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p4Title')}
              workers={availability.p4Unavailable}
              sessionId={session.id}
              showAdd={false}
              titleColor="var(--muted-foreground)"
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p5Title')}
              workers={availability.p5Inactive}
              sessionId={session.id}
              showAdd={false}
              titleColor="var(--muted-foreground)"
              onAdded={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
