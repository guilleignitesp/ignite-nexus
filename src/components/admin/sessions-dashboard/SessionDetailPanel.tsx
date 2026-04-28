'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeekSession, ActiveAssignment } from '@/lib/data/sessions-dashboard'
import {
  updateSessionStatus,
  updateSessionMinTeachers,
  updateSessionProject,
  markAbsent,
  unmarkAbsent,
  removeSubstitute,
  getGroupProjects,
} from '@/lib/actions/sessions-dashboard'
import { SubstitutePanel } from './SubstitutePanel'
import { PermanentAssignmentDialog } from './PermanentAssignmentDialog'

interface Props {
  session: WeekSession
  groupName: string
  schoolName: string
  assignments: ActiveAssignment[]
  workerNames: Map<string, string>
  onClose: () => void
}

type Project = { id: string; name: string }

const SESSION_STATUSES = [
  'pending',
  'completed',
  'holiday',
  'suspended',
  'cancelled',
] as const

export function SessionDetailPanel({
  session,
  groupName,
  schoolName,
  assignments,
  workerNames,
  onClose,
}: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Sub-panel state
  const [substituteOpen, setSubstituteOpen] = useState(false)
  const [permanentOpen, setPermanentOpen] = useState(false)

  // Project selector
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>(
    session.projectId ?? ''
  )

  // Min teachers
  const [minTeachers, setMinTeachers] = useState(String(session.minTeachersRequired))

  // Errors
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setProjectsLoading(true)
    getGroupProjects(session.groupId)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false))
  }, [session.groupId])

  const isLocked = session.isConsolidated

  const absentIds = new Set(
    session.teacherChanges
      .filter((tc) => tc.type === 'absent' && tc.isActive)
      .map((tc) => tc.workerId)
  )
  const substitutes = session.teacherChanges.filter(
    (tc) => tc.type === 'substitute' && tc.isActive
  )

  function refresh() {
    router.refresh()
    onClose()
  }

  function handleStatusChange(status: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateSessionStatus(
          session.id,
          status as WeekSession['status']
        )
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleProjectChange(projectId: string) {
    setSelectedProject(projectId)
    setError(null)
    startTransition(async () => {
      try {
        await updateSessionProject(session.id, projectId || null)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleMinTeachersSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseInt(minTeachers, 10)
    if (isNaN(val) || val < 1) return
    setError(null)
    startTransition(async () => {
      try {
        await updateSessionMinTeachers(session.id, val)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleMarkAbsent(workerId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await markAbsent(session.id, workerId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleUnmarkAbsent(absenceId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await unmarkAbsent(absenceId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleRemoveSubstitute(assignmentId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removeSubstitute(assignmentId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  // While substitute sub-panel is open render only that
  if (substituteOpen) {
    return (
      <SubstitutePanel
        session={session}
        assignments={assignments}
        onClose={() => setSubstituteOpen(false)}
      />
    )
  }

  if (permanentOpen) {
    return (
      <PermanentAssignmentDialog
        group={{ id: session.groupId, name: groupName }}
        onClose={() => setPermanentOpen(false)}
      />
    )
  }

  const timeLabel = `${session.startTime.slice(0, 5)}–${session.endTime.slice(0, 5)}`

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md" style={{ overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle>
            {groupName} · {timeLabel}
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '0.75rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Info */}
          <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>{schoolName}</span>
            <span>{session.date}</span>
            {isLocked && (
              <Badge variant="secondary" style={{ width: 'fit-content' }}>
                🔒 {t('consolidated')}
              </Badge>
            )}
          </div>

          {error && (
            <div style={{ fontSize: '0.8rem', color: 'var(--destructive)', padding: '0.5rem', border: '1px solid var(--destructive)', borderRadius: '0.375rem' }}>
              {error}
            </div>
          )}

          {/* Status */}
          <section>
            <SectionLabel>{t('detailStatus')}</SectionLabel>
            <select
              value={session.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isPending}
              style={{
                width: '100%',
                height: '2rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                padding: '0 0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              {SESSION_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </section>

          {/* Project */}
          <section>
            <SectionLabel>{t('detailProject')}</SectionLabel>
            {projectsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => handleProjectChange(e.target.value)}
                disabled={isPending}
                style={{
                  width: '100%',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  padding: '0 0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="">{t('noProject')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </section>

          {/* Min teachers */}
          <section>
            <SectionLabel>{t('detailMinTeachers')}</SectionLabel>
            <form onSubmit={handleMinTeachersSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                min={1}
                max={10}
                value={minTeachers}
                onChange={(e) => setMinTeachers(e.target.value)}
                disabled={isPending}
                style={{
                  width: '5rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  padding: '0 0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <Button type="submit" size="sm" disabled={isPending}>
                {t('save')}
              </Button>
            </form>
          </section>

          {/* Permanent team */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <SectionLabel style={{ margin: 0 }}>{t('detailPermanentTeam')}</SectionLabel>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setPermanentOpen(true)}
              >
                {t('manageTeam')}
              </Button>
            </div>
            {assignments.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{t('noTeam')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {assignments.map((a) => {
                  const isAbsent = absentIds.has(a.workerId)
                  const absenceSTA = isAbsent
                    ? session.teacherChanges.find(
                        (tc) => tc.workerId === a.workerId && tc.type === 'absent' && tc.isActive
                      )
                    : null

                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.375rem 0',
                        borderBottom: '1px solid var(--border)',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          textDecoration: isAbsent ? 'line-through' : 'none',
                          color: isAbsent ? 'var(--muted-foreground)' : undefined,
                        }}
                      >
                        {a.workerFirstName} {a.workerLastName}
                      </span>
                      {isAbsent && absenceSTA ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleUnmarkAbsent(absenceSTA.id)}
                          disabled={isPending}
                        >
                          {t('unmarkAbsent')}
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => handleMarkAbsent(a.workerId)}
                          disabled={isPending}
                        >
                          {t('markAbsent')}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Substitutes */}
          <section>
            <SectionLabel>{t('detailSubstitutes')}</SectionLabel>
            {substitutes.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{t('noSubstitutes')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.5rem' }}>
                {substitutes.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.375rem 0',
                      borderBottom: '1px solid var(--border)',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                      ↪ {workerNames.get(sub.workerId) ?? `#${sub.workerId.slice(0, 6)}`}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleRemoveSubstitute(sub.id)}
                      disabled={isPending}
                    >
                      {t('removeSubstitute')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setSubstituteOpen(true)}
            >
              + {t('addSubstitute')}
            </Button>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--muted-foreground)',
        marginBottom: '0.375rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
