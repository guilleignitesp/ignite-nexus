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
import {
  getGroupPermanentAssignments,
  addPermanentAssignment,
  removePermanentAssignment,
  searchWorkersForAssignment,
} from '@/lib/actions/sessions-dashboard'

interface Props {
  group: { id: string; name: string }
  onClose: () => void
}

type CurrentMember = {
  id: string
  workerId: string
  firstName: string
  lastName: string
}

type WorkerItem = {
  id: string
  firstName: string
  lastName: string
  conflict: boolean
}

export function PermanentAssignmentDialog({ group, onClose }: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [current, setCurrent] = useState<CurrentMember[]>([])
  const [available, setAvailable] = useState<WorkerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [manualConflicts, setManualConflicts] = useState(0)
  const [pendingAdd, setPendingAdd] = useState<WorkerItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [currentData, availableData] = await Promise.all([
        getGroupPermanentAssignments(group.id),
        searchWorkersForAssignment('', group.id),
      ])
      setCurrent(currentData)
      setAvailable(availableData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [group.id])

  function handleAddWorker(worker: WorkerItem) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await addPermanentAssignment(group.id, worker.id, false)
        if (result.manualConflicts > 0) {
          setManualConflicts(result.manualConflicts)
          setPendingAdd(worker)
          return
        }
        await loadData()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error adding teacher')
      }
    })
  }

  function handleForceAdd() {
    if (!pendingAdd) return
    setError(null)
    startTransition(async () => {
      try {
        await addPermanentAssignment(group.id, pendingAdd.id, true)
        setManualConflicts(0)
        setPendingAdd(null)
        await loadData()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error adding teacher')
      }
    })
  }

  function handleRemove(assignmentId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removePermanentAssignment(assignmentId)
        await loadData()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error removing teacher')
      }
    })
  }

  // Sort: non-conflicting first (both groups sorted by last name)
  const sortedAvailable = [...available].sort((a, b) => {
    if (a.conflict !== b.conflict) return a.conflict ? 1 : -1
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('permanentTitle', { groupName: group.name })}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div
            style={{
              color: 'var(--destructive)',
              fontSize: '0.875rem',
              padding: '0.5rem',
              border: '1px solid var(--destructive)',
              borderRadius: '0.375rem',
              marginBottom: '0.5rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Force override warning */}
        {manualConflicts > 0 && pendingAdd && (
          <div
            style={{
              backgroundColor: 'var(--warning, #fef3c7)',
              border: '1px solid #f59e0b',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {t('permanentWarning', { count: manualConflicts })}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="sm" variant="destructive" onClick={handleForceAdd} disabled={isPending}>
                {t('forceOverride')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setManualConflicts(0); setPendingAdd(null) }}
                disabled={isPending}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Current team */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted-foreground)',
              marginBottom: '0.5rem',
            }}
          >
            {t('currentTeam')}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : current.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {t('noTeam')}
            </p>
          ) : (
            current.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>
                  {member.firstName} {member.lastName}
                </span>
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() => handleRemove(member.id)}
                  disabled={isPending}
                >
                  {t('remove')}
                </Button>
              </div>
            ))
          )}
        </div>

        {/* All available workers */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted-foreground)',
              marginBottom: '0.5rem',
            }}
          >
            {t('allWorkers')}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : sortedAvailable.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {t('noTeam')}
            </p>
          ) : (
            <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
              {sortedAvailable.map((worker) => (
                <div
                  key={worker.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid var(--border)',
                    opacity: worker.conflict ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: '0.875rem' }}>
                    {worker.firstName} {worker.lastName}
                  </span>
                  {worker.conflict ? (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        background: 'var(--muted)',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {t('workerConflict')}
                    </span>
                  ) : (
                    <Button
                      size="xs"
                      onClick={() => handleAddWorker(worker)}
                      disabled={isPending}
                    >
                      {t('addWorker')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
