'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { WeekSession, ActiveAssignment } from '@/lib/data/sessions-dashboard'
import { markAbsent, unmarkAbsent, removeSubstitute } from '@/lib/actions/sessions-dashboard'

interface Props {
  sessions: WeekSession[]
  schedule: { startTime: string; endTime: string } | undefined
  assignments: ActiveAssignment[]
  workerNames: Map<string, string>
  day: string
  today: string
  onSubstituteClick: (session: WeekSession) => void
}

function statusVariant(
  status: WeekSession['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default'
    case 'suspended':
      return 'destructive'
    case 'holiday':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function GroupDayCell({
  sessions,
  schedule,
  assignments,
  workerNames,
  day,
  today,
  onSubstituteClick,
}: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isPast = day < today

  function handleMarkAbsent(sessionId: string, workerId: string) {
    startTransition(async () => {
      try {
        await markAbsent(sessionId, workerId)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleUnmarkAbsent(absenceId: string) {
    startTransition(async () => {
      try {
        await unmarkAbsent(absenceId)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleRemoveSubstitute(assignmentId: string) {
    startTransition(async () => {
      try {
        await removeSubstitute(assignmentId)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  if (sessions.length === 0) {
    if (!schedule) return null
    return (
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--muted-foreground)',
          padding: '0.25rem',
        }}
      >
        {schedule.startTime.slice(0, 5)}–{schedule.endTime.slice(0, 5)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {sessions.map((session) => {
        const isLocked = session.isConsolidated || isPast

        const absentWorkerIds = new Set(
          session.teacherChanges
            .filter((tc) => tc.type === 'absent' && tc.isActive)
            .map((tc) => tc.workerId)
        )

        const presentTeachers = assignments.filter(
          (a) => !absentWorkerIds.has(a.workerId)
        )
        const absentTeachers = assignments.filter((a) =>
          absentWorkerIds.has(a.workerId)
        )

        const substitutes = session.teacherChanges.filter(
          (tc) => tc.type === 'substitute' && tc.isActive
        )

        return (
          <div
            key={session.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              backgroundColor: 'var(--background)',
              opacity: isLocked ? 0.8 : 1,
            }}
          >
            {/* Time + status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.375rem',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
              </span>
              <Badge variant={statusVariant(session.status)} style={{ fontSize: '0.65rem' }}>
                {session.status}
              </Badge>
              {isLocked && (
                <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
                  🔒
                </span>
              )}
            </div>

            {/* Present permanent teachers */}
            {presentTeachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.25rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontSize: '0.75rem' }}>
                  {teacher.workerFirstName} {teacher.workerLastName}
                </span>
                {!isLocked && (
                  <button
                    onClick={() => handleMarkAbsent(session.id, teacher.workerId)}
                    disabled={isPending}
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--destructive)',
                      cursor: 'pointer',
                      background: 'none',
                      border: '1px solid var(--destructive)',
                      borderRadius: '0.25rem',
                      padding: '0 0.25rem',
                      lineHeight: '1.4',
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    {t('markAbsent')}
                  </button>
                )}
              </div>
            ))}

            {/* Absent permanent teachers */}
            {absentTeachers.map((teacher) => {
              const absenceSTA = session.teacherChanges.find(
                (tc) =>
                  tc.workerId === teacher.workerId &&
                  tc.type === 'absent' &&
                  tc.isActive
              )
              return (
                <div
                  key={teacher.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.25rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      textDecoration: 'line-through',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {teacher.workerFirstName} {teacher.workerLastName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Badge variant="destructive" style={{ fontSize: '0.6rem' }}>
                      Absent
                    </Badge>
                    {!isLocked && absenceSTA && (
                      <button
                        onClick={() => handleUnmarkAbsent(absenceSTA.id)}
                        disabled={isPending}
                        style={{
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: '0.25rem',
                          padding: '0 0.25rem',
                          lineHeight: '1.4',
                          opacity: isPending ? 0.5 : 1,
                        }}
                      >
                        {t('unmarkAbsent')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Substitutes */}
            {substitutes.map((sub) => {
              const name =
                workerNames.get(sub.workerId) ?? `Worker #${sub.workerId.slice(0, 6)}`
              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.25rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--primary)',
                      fontStyle: 'italic',
                    }}
                  >
                    ↪ {name}
                  </span>
                  {!isLocked && (
                    <button
                      onClick={() => handleRemoveSubstitute(sub.id)}
                      disabled={isPending}
                      style={{
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '0.25rem',
                        padding: '0 0.25rem',
                        lineHeight: '1.4',
                        opacity: isPending ? 0.5 : 1,
                      }}
                    >
                      {t('removeSubstitute')}
                    </button>
                  )}
                </div>
              )
            })}

            {/* Add substitute button */}
            {!isLocked && (
              <button
                onClick={() => onSubstituteClick(session)}
                style={{
                  marginTop: '0.25rem',
                  fontSize: '0.7rem',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  background: 'none',
                  border: '1px dashed var(--primary)',
                  borderRadius: '0.25rem',
                  padding: '0.125rem 0.375rem',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                + {t('addSubstitute')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
