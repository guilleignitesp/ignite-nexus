'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
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
  successors: { projectId: string; projectName: string; percentage: number | null; label: string | null }[]
  groupSchedule: ScheduleSlot[]
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

const SHELL: React.CSSProperties = {
  background: '#FEFCF8',
  borderRadius: 20,
  border: '1px solid rgba(251,176,59,0.12)',
  boxShadow: '0 1px 6px rgba(30,58,95,0.04)',
  overflow: 'hidden',
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

  const isFuturePending =
    !!session &&
    session.status === 'pending' &&
    session.sessionDate > todayStr &&
    session.attendances.length === 0

  const futureSlot: ScheduleSlot | null = isFuturePending && session
    ? (groupSchedule.find((s) => s.weekday === new Date(session.sessionDate + 'T12:00:00').getDay()) ?? todaySlot)
    : null

  const startSlot: ScheduleSlot | null = isFuturePending
    ? (futureSlot ?? (session ? { weekday: 0, startTime: session.startTime, endTime: session.endTime } : null))
    : todaySlot

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

  // Future pending session — show start button
  if (isFuturePending) {
    return (
      <section style={SHELL}>
        <SectionHeader />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>
            {t('sessionDateLabel', { date: formattedStartDate })}
          </p>
          {startSlot && (
            <p style={{ fontSize: 13, color: '#8BA3BC' }}>
              {startSlot.startTime.slice(0, 5)}–{startSlot.endTime.slice(0, 5)}
            </p>
          )}
          {error && <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>}
          <StartButton label={isPending ? t('starting') : t('startSession')} disabled={isPending} onClick={handleStart} />
        </div>
      </section>
    )
  }

  // Active session (current or overdue)
  if (session) {
    return (
      <section style={SHELL}>
        <SectionHeader />
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isOverdue && (
            <div style={{
              background: 'rgba(251,176,59,0.08)',
              border: '1px solid rgba(251,176,59,0.25)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#92650A',
              fontSize: 13,
              fontWeight: 500,
            }}>
              {t('overdueWarning', { date: formattedOverdueDate! })}
            </div>
          )}
          <div style={{ borderRadius: 14, background: 'rgba(62,111,168,0.04)', padding: 16 }}>
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
        </div>
      </section>
    )
  }

  // Not a class day
  if (!isClassToday) {
    return (
      <section style={SHELL}>
        <SectionHeader />
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#8BA3BC' }}>{t('noClassToday')}</p>
        </div>
      </section>
    )
  }

  // Class day but no session yet — show start button
  return (
    <section style={SHELL}>
      <SectionHeader />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>
          {t('sessionDateLabel', { date: formattedStartDate })}
        </p>
        {todaySlot && (
          <p style={{ fontSize: 13, color: '#8BA3BC' }}>
            {todaySlot.startTime.slice(0, 5)}–{todaySlot.endTime.slice(0, 5)}
          </p>
        )}
        {error && <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>}
        <StartButton label={isPending ? t('starting') : t('startSession')} disabled={isPending} onClick={handleStart} />
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '1px solid rgba(251,176,59,0.10)',
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(251,176,59,0.04)',
    }}>
      <svg width="10" height="16" viewBox="7 2 16 31" fill="none">
        <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F1C2E', letterSpacing: '-0.1px' }}>
        Sesión de hoy
      </span>
    </div>
  )
}

function StartButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '10px 20px', borderRadius: 12,
        background: disabled ? 'rgba(62,111,168,0.04)' : 'rgba(62,111,168,0.08)',
        border: '1.5px solid rgba(62,111,168,0.20)',
        color: '#2D4A6B', fontSize: 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(62,111,168,0.14)' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(62,111,168,0.08)' }}
    >
      {label}
    </button>
  )
}
