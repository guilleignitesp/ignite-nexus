'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type {
  DashboardSchool,
  WeekSession,
  ActiveAssignment,
} from '@/lib/data/sessions-dashboard'
import type { Worker } from '@/lib/data/schools'
import { addDays } from '@/lib/utils/week-helpers'
import { WeekGrid } from './WeekGrid'
import { SessionDetailPanel } from './SessionDetailPanel'
import { AuditPanel } from './AuditPanel'

interface Props {
  schools: DashboardSchool[]
  sessions: WeekSession[]
  assignments: ActiveAssignment[]
  workers: Worker[]
  weekStart: string
  today: string
  locale: string
}

interface SelectedSession {
  sessionId: string
  groupName: string
  schoolName: string
}

export function SessionsDashboard({
  schools,
  sessions,
  assignments,
  workers,
  weekStart,
  today,
  locale,
}: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()

  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const teams = Array.from(
    new Map(
      schools
        .filter((s) => s.teamId)
        .map((s) => [s.teamId!, { id: s.teamId!, name: s.teamName ?? s.teamId! }])
    ).values()
  )

  const filteredSchools = selectedTeamId
    ? schools.filter((s) => s.teamId === selectedTeamId)
    : schools

  const workerNames = new Map<string, string>()
  for (const w of workers) {
    workerNames.set(w.id, `${w.first_name} ${w.last_name}`)
  }

  function prevWeek() {
    router.push(`/${locale}/admin/sessions?week=${addDays(weekStart, -7)}`)
  }

  function nextWeek() {
    router.push(`/${locale}/admin/sessions?week=${addDays(weekStart, 7)}`)
  }

  const weekLabel = new Date(`${weekStart}T12:00:00`).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Week nav bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            ← {t('prev')}
          </Button>
          <span className="font-semibold text-sm">{weekLabel}</span>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            {t('next')} →
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
          {t('auditLog')}
        </Button>
      </div>

      {/* Team filter */}
      {teams.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTeamId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedTeamId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTeamId === team.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      {/* The grid */}
      <WeekGrid
        schools={filteredSchools}
        sessions={sessions}
        assignments={assignments}
        workerNames={workerNames}
        weekStart={weekStart}
        today={today}
        onSessionClick={(session, groupName, schoolName) =>
          setSelectedSession({ sessionId: session.id, groupName, schoolName })
        }
      />

      {/* Session detail panel */}
      {selectedSession && (() => {
        const currentSession = sessions.find(s => s.id === selectedSession.sessionId)
        if (!currentSession) return null
        return (
          <SessionDetailPanel
            session={currentSession}
            groupName={selectedSession.groupName}
            schoolName={selectedSession.schoolName}
            assignments={assignments.filter(a => a.groupId === currentSession.groupId)}
            workerNames={workerNames}
            onClose={() => setSelectedSession(null)}
          />
        )
      })()}

      <AuditPanel open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  )
}
