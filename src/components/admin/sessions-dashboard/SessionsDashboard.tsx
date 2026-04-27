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
import { addDays } from '@/lib/utils/week-helpers'
import { WeekGrid } from './WeekGrid'
import { SessionDetailPanel } from './SessionDetailPanel'
import { PermanentAssignmentDialog } from './PermanentAssignmentDialog'
import { AuditPanel } from './AuditPanel'

interface Props {
  schools: DashboardSchool[]
  sessions: WeekSession[]
  assignments: ActiveAssignment[]
  weekStart: string
  today: string
  locale: string
}

interface SelectedSession {
  session: WeekSession
  groupName: string
  schoolName: string
}

export function SessionsDashboard({
  schools,
  sessions,
  assignments,
  weekStart,
  today,
  locale,
}: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()

  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null)
  const [selectedGroupForPermanent, setSelectedGroupForPermanent] = useState<{
    id: string
    name: string
  } | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)

  const workerNames = new Map<string, string>()
  for (const a of assignments) {
    workerNames.set(a.workerId, `${a.workerFirstName} ${a.workerLastName}`)
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

      {/* The grid */}
      <WeekGrid
        schools={schools}
        sessions={sessions}
        assignments={assignments}
        weekStart={weekStart}
        today={today}
        onSessionClick={(session, groupName, schoolName) =>
          setSelectedSession({ session, groupName, schoolName })
        }
        onPermanentClick={(group) => setSelectedGroupForPermanent(group)}
      />

      {/* Session detail panel */}
      {selectedSession && (
        <SessionDetailPanel
          session={selectedSession.session}
          groupName={selectedSession.groupName}
          schoolName={selectedSession.schoolName}
          assignments={assignments.filter(
            (a) => a.groupId === selectedSession.session.groupId
          )}
          workerNames={workerNames}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Permanent assignment dialog (opened from grid or from detail panel) */}
      {selectedGroupForPermanent && (
        <PermanentAssignmentDialog
          group={selectedGroupForPermanent}
          onClose={() => setSelectedGroupForPermanent(null)}
        />
      )}

      <AuditPanel open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  )
}
