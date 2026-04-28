'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ActiveSessionForm } from './ActiveSessionForm'
import { createTodaySession } from '@/lib/actions/teacher-sessions'
import type { TodaySession, EnrolledStudent, ScheduleSlot } from '@/lib/data/teacher'

interface TodaySessionSectionProps {
  groupId: string
  planningId: string
  currentProjectId: string | null
  currentProjectName: string | null
  todaySlot: ScheduleSlot | null
  isClassToday: boolean
  students: EnrolledStudent[]
  session: TodaySession | null
  sessionDate: string | null
  nextSessionDate: string | null
  successors: { projectId: string; projectName: string }[]
  groupSchedule: ScheduleSlot[]
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function TodaySessionSection({
  groupId,
  planningId,
  currentProjectId,
  currentProjectName,
  todaySlot,
  isClassToday,
  students,
  session,
  sessionDate,
  nextSessionDate,
  successors,
  groupSchedule,
}: TodaySessionSectionProps) {
  const t = useTranslations('teacherGroup')
  const locale = useLocale()
  const router = useRouter()

  const todayStr = new Date().toISOString().slice(0, 10)
  const currentWeekMonday = getMondayOfWeek(todayStr)
  const sessionWeekMonday = sessionDate ? getMondayOfWeek(sessionDate) : null
  const isOverdue = !!sessionDate && !!sessionWeekMonday && sessionWeekMonday < currentWeekMonday

  // A pending session with a future date and no attendance records hasn't been started yet
  const isFuturePending =
    !!session &&
    session.status === 'pending' &&
    session.sessionDate > todayStr &&
    session.attendances.length === 0

  // For future sessions, find the schedule slot matching that weekday
  // JS getDay() Mon=1…Fri=5 matches DB weekday 1…5 for weekdays
  const futureSlot = isFuturePending && session
    ? groupSchedule.find((s) => s.weekday === new Date(session.sessionDate + 'T12:00:00').getDay()) ?? null
    : null

  // The slot to use when starting the session
  const startSlot = isFuturePending ? futureSlot : todaySlot

  const formattedOverdueDate = sessionDate
    ? new Date(sessionDate + 'T12:00:00').toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
      })
    : null

  const startDateStr = nextSessionDate ?? todayStr
  const formattedStartDate = new Date(startDateStr + 'T12:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  })

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleStart() {
    if (!startSlot) return
    setError(null)
    startTransition(async () => {
      try {
        await createTodaySession({
          groupId,
          planningId,
          projectId: currentProjectId,
          startTime: startSlot.startTime,
          endTime: startSlot.endTime,
          sessionDate: isFuturePending && session ? session.sessionDate : undefined,
          studentIds: students.map((s) => s.studentId),
        })
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  // Future pending session (pre-generated, not yet started): show start button
  if (isFuturePending) {
    return (
      <div className="rounded-lg border p-6 flex flex-col items-start gap-3">
        <p className="text-sm font-medium">{t('sessionDateLabel', { date: formattedStartDate })}</p>
        {futureSlot ? (
          <>
            <p className="text-sm text-muted-foreground">
              {futureSlot.startTime.slice(0, 5)}–{futureSlot.endTime.slice(0, 5)}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleStart} disabled={isPending}>
              {isPending ? t('starting') : t('startSession')}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('nextSessionInfo', { date: formattedStartDate })}
          </p>
        )}
      </div>
    )
  }

  // Active session (current day or overdue, already started or in progress)
  if (session) {
    return (
      <div className="space-y-3">
        {isOverdue && (
          <div className="rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
            {t('overdueWarning', { date: formattedOverdueDate! })}
          </div>
        )}
        <ActiveSessionForm
          groupId={groupId}
          planningId={planningId}
          session={session}
          students={students}
          successors={successors}
          currentProjectId={currentProjectId}
          currentProjectName={currentProjectName}
        />
      </div>
    )
  }

  // No session and not a class day
  if (!isClassToday) {
    return (
      <p className="text-sm text-muted-foreground">{t('noClassToday')}</p>
    )
  }

  // No session but it's a class day: show start button
  return (
    <div className="rounded-lg border p-6 flex flex-col items-start gap-3">
      <p className="text-sm font-medium">{t('sessionDateLabel', { date: formattedStartDate })}</p>
      <p className="text-sm text-muted-foreground">
        {todaySlot
          ? `${todaySlot.startTime.slice(0, 5)}–${todaySlot.endTime.slice(0, 5)}`
          : ''}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleStart} disabled={isPending}>
        {isPending ? t('starting') : t('startSession')}
      </Button>
    </div>
  )
}
