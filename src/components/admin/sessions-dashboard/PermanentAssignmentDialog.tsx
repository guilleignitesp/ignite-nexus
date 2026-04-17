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

type SearchResult = {
  id: string
  firstName: string
  lastName: string
}

export function PermanentAssignmentDialog({ group, onClose }: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [current, setCurrent] = useState<CurrentMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [manualConflicts, setManualConflicts] = useState(0)
  const [pendingAdd, setPendingAdd] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadCurrent() {
    try {
      const data = await getGroupPermanentAssignments(group.id)
      setCurrent(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrent()
  }, [group.id])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    searchWorkersForAssignment(searchQuery, group.id)
      .then(setSearchResults)
      .catch((e) => setError(e instanceof Error ? e.message : 'Search error'))
      .finally(() => setSearching(false))
  }

  function handleAddWorker(worker: SearchResult) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await addPermanentAssignment(group.id, worker.id, false)
        if (result.manualConflicts > 0) {
          setManualConflicts(result.manualConflicts)
          setPendingAdd(worker)
          return
        }
        await loadCurrent()
        setSearchResults([])
        setSearchQuery('')
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
        await loadCurrent()
        setSearchResults([])
        setSearchQuery('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error adding teacher')
      }
    })
  }

  function handleCancelForce() {
    setManualConflicts(0)
    setPendingAdd(null)
  }

  function handleRemove(assignmentId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removePermanentAssignment(assignmentId)
        await loadCurrent()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error removing teacher')
      }
    })
  }

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
              <Button size="sm" variant="outline" onClick={handleCancelForce} disabled={isPending}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Current team */}
        <div style={{ marginBottom: '1rem' }}>
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

        {/* Add teacher */}
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
            {t('addToTeam')}
          </div>
          <form
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchTeacher')}
              style={{ flex: 1 }}
            />
            <Button type="submit" size="sm" disabled={searching || isPending}>
              {t('search')}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                overflow: 'hidden',
              }}
            >
              {searchResults.map((worker) => (
                <div
                  key={worker.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '0.875rem' }}>
                    {worker.firstName} {worker.lastName}
                  </span>
                  <Button
                    size="xs"
                    onClick={() => handleAddWorker(worker)}
                    disabled={isPending}
                  >
                    {t('addWorker')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
