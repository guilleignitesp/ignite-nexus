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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { StaffingSlot, SlotRef, WorkerLayerItem, WorkerAvailabilityResult } from '@/lib/data/schools'
import { getWorkerAvailability, addSubstitute } from '@/lib/actions/sessions-dashboard'

interface Props {
  slot: StaffingSlot
  onClose: () => void
}

interface WorkerRowProps {
  worker: WorkerLayerItem
  slot: SlotRef
  showAdd: boolean
  onAdded: () => void
}

function WorkerRow({ worker, slot, showAdd, onAdded }: WorkerRowProps) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    setError(null)
    startTransition(async () => {
      try {
        await addSubstitute(slot, worker.id)
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
  slot,
  showAdd,
  titleColor,
  onAdded,
  warning,
}: {
  title: string
  workers: WorkerLayerItem[]
  slot: SlotRef
  showAdd: boolean
  titleColor?: string
  onAdded: () => void
  warning?: string
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
      {warning && (
        <div style={{ fontSize: '0.7rem', color: titleColor ?? 'var(--muted-foreground)', marginBottom: '0.375rem', fontStyle: 'italic' }}>
          ⚠ {warning}
        </div>
      )}
      {workers.map((w) => (
        <WorkerRow key={w.id} worker={w} slot={slot} showAdd={showAdd} onAdded={onAdded} />
      ))}
    </div>
  )
}

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function filterWorkers(workers: WorkerLayerItem[], q: string): WorkerLayerItem[] {
  if (!q.trim()) return workers
  const nq = norm(q.trim())
  return workers.filter((w) => norm(w.firstName).includes(nq) || norm(w.lastName).includes(nq))
}

export function SubstitutePanel({ slot, onClose }: Props) {
  const t = useTranslations('sessionsDashboard')
  const [availability, setAvailability] = useState<WorkerAvailabilityResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workerSearch, setWorkerSearch] = useState('')

  const slotRef: SlotRef = {
    groupId: slot.groupId,
    slotDate: slot.slotDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    getWorkerAvailability(slotRef)
      .then((result) => setAvailability(result))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error loading availability'))
      .finally(() => setLoading(false))
  }, [slot.groupId, slot.slotDate, slot.startTime])

  const timeLabel = `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`

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
            <Input
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              placeholder="Buscar profesor..."
              className="mb-3 h-8 text-sm"
            />
            <WorkerSection
              title={t('p1Title')}
              workers={filterWorkers(availability.p1Surplus, workerSearch)}
              slot={slotRef}
              showAdd
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p2Title')}
              workers={filterWorkers(availability.p2Free, workerSearch)}
              slot={slotRef}
              showAdd
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p3Title')}
              workers={filterWorkers(availability.p3Critical, workerSearch)}
              slot={slotRef}
              showAdd={true}
              titleColor="var(--destructive)"
              warning="Clase con mínimo justo — quedará sin cobertura"
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p4Title')}
              workers={filterWorkers(availability.p4Unavailable, workerSearch)}
              slot={slotRef}
              showAdd={false}
              titleColor="var(--muted-foreground)"
              onAdded={onClose}
            />
            <WorkerSection
              title={t('p5Title')}
              workers={filterWorkers(availability.p5Inactive, workerSearch)}
              slot={slotRef}
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
