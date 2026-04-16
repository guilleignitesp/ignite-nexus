'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ActiveSessionForm } from './ActiveSessionForm'
import { createTodaySession } from '@/lib/actions/teacher-sessions'
import type { TodaySession, EnrolledStudent, ScheduleSlot } from '@/lib/data/teacher'

interface TodaySessionSectionProps {
  groupId: string
  planningId: string
  currentProjectId: string | null
  todaySlot: ScheduleSlot | null
  students: EnrolledStudent[]
  session: TodaySession | null
  successors: { projectId: string; projectName: string }[]
}

export function TodaySessionSection({
  groupId,
  planningId,
  currentProjectId,
  todaySlot,
  students,
  session,
  successors,
}: TodaySessionSectionProps) {
  const t = useTranslations('teacherGroup')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleStart() {
    if (!todaySlot) return
    setError(null)
    startTransition(async () => {
      try {
        await createTodaySession({
          groupId,
          planningId,
          projectId: currentProjectId,
          startTime: todaySlot.startTime,
          endTime: todaySlot.endTime,
          studentIds: students.map((s) => s.studentId),
        })
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  // Si la sesión ya está consolidada → resumen de sólo lectura
  if (session?.isConsolidated) {
    return <ConsolidatedSummary session={session} students={students} />
  }

  // Si hay sesión activa → formulario interactivo
  if (session) {
    return (
      <ActiveSessionForm
        groupId={groupId}
        planningId={planningId}
        session={session}
        students={students}
        successors={successors}
      />
    )
  }

  // Sin sesión → botón "Iniciar clase"
  return (
    <div className="rounded-lg border p-6 flex flex-col items-start gap-3">
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

// ─── Resumen sesión consolidada ────────────────────────────────────────────

const TRAFFIC_COLOR: Record<string, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
}

function ConsolidatedSummary({
  session,
  students,
}: {
  session: TodaySession
  students: EnrolledStudent[]
}) {
  const t = useTranslations('teacherGroup')

  const attended = session.attendances.filter((a) => a.attended).length
  const total = session.attendances.length || students.length

  return (
    <div className="rounded-lg border bg-muted/30 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
          {t('consolidatedBadge')}
        </span>
        {session.trafficLight && (
          <span
            className={`h-3 w-3 rounded-full ${TRAFFIC_COLOR[session.trafficLight] ?? ''}`}
            title={session.trafficLight}
          />
        )}
        <span className="text-sm text-muted-foreground">
          {t('attendedCount', { attended, total })}
        </span>
      </div>
      {session.teacherComment && (
        <p className="text-sm text-muted-foreground italic">"{session.teacherComment}"</p>
      )}
    </div>
  )
}
