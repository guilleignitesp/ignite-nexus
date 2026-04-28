'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import type { WeekSession, ActiveAssignment } from '@/lib/data/sessions-dashboard'

interface Props {
  sessions: WeekSession[]
  schedule: { startTime: string; endTime: string } | undefined
  assignments: ActiveAssignment[]
  groupName: string
  onSessionClick: (session: WeekSession) => void
}

function statusVariant(
  status: WeekSession['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed': return 'default'
    case 'suspended': return 'destructive'
    case 'cancelled': return 'destructive'
    case 'holiday':   return 'secondary'
    default:          return 'outline'
  }
}

export function GroupDayCell({
  sessions,
  schedule,
  assignments,
  groupName,
  onSessionClick,
}: Props) {
  const t = useTranslations('sessionsDashboard')

  if (sessions.length === 0) {
    if (!schedule) return null
    return (
      <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', padding: '0.25rem' }}>
        <span style={{ fontWeight: 500, marginRight: '0.25rem' }}>{groupName}</span>
        {schedule.startTime.slice(0, 5)}–{schedule.endTime.slice(0, 5)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {sessions.map((session) => {
        const absentIds = new Set(
          session.teacherChanges
            .filter((tc) => tc.type === 'absent' && tc.isActive)
            .map((tc) => tc.workerId)
        )
        const substitutes = session.teacherChanges.filter(
          (tc) => tc.type === 'substitute' && tc.isActive
        )

        return (
          <button
            key={session.id}
            onClick={() => onSessionClick(session)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              padding: '0.375rem 0.5rem',
              backgroundColor: 'var(--background)',
              cursor: 'pointer',
            }}
          >
            {/* Group + time row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{groupName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
              </span>
              <Badge variant={statusVariant(session.status)} style={{ fontSize: '0.6rem', padding: '0 0.25rem' }}>
                {t(`status.${session.status}`)}
              </Badge>
              {session.isConsolidated && (
                <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>🔒</span>
              )}
            </div>

            {/* Project */}
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
              {session.projectName ?? t('noProject')}
            </div>

            {/* Permanent teachers */}
            {assignments.length > 0 && (
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {assignments.map((a) => {
                  const isAbsent = absentIds.has(a.workerId)
                  return (
                    <span
                      key={a.id}
                      style={{
                        fontSize: '0.7rem',
                        color: isAbsent ? 'var(--destructive)' : 'var(--foreground)',
                        textDecoration: isAbsent ? 'line-through' : 'none',
                      }}
                    >
                      {a.workerFirstName} {a.workerLastName}
                      {isAbsent && ' ✗'}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Substitutes badge */}
            {substitutes.length > 0 && (
              <div style={{ marginTop: '0.125rem', fontSize: '0.65rem', color: 'var(--primary)' }}>
                +{substitutes.length} {t('substitutesBadge', { count: substitutes.length })}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
