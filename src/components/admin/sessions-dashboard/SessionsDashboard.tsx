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
import { addDays, getMondayOf } from '@/lib/utils/week-helpers'
import { WeekGrid } from './WeekGrid'
import { SubstitutePanel } from './SubstitutePanel'
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

  const [selectedSession, setSelectedSession] = useState<WeekSession | null>(null)
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
    const newWeekStart = addDays(weekStart, -7)
    router.push(`/${locale}/admin/sessions?week=${newWeekStart}`)
  }

  function nextWeek() {
    const newWeekStart = addDays(weekStart, 7)
    router.push(`/${locale}/admin/sessions?week=${newWeekStart}`)
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
        workerNames={workerNames}
        weekStart={weekStart}
        today={today}
        onSubstituteClick={(session) => setSelectedSession(session)}
        onPermanentClick={(group) => setSelectedGroupForPermanent(group)}
      />

      {/* Dialogs */}
      {selectedSession && (
        <SubstitutePanel
          session={selectedSession}
          assignments={assignments.filter((a) => a.groupId === selectedSession.groupId)}
          onClose={() => setSelectedSession(null)}
        />
      )}
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
