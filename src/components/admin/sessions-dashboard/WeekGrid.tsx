'use client'

import { useTranslations } from 'next-intl'
import type {
  DashboardSchool,
  WeekSession,
  ActiveAssignment,
} from '@/lib/data/sessions-dashboard'
import { addDays } from '@/lib/utils/week-helpers'
import { GroupDayCell } from './GroupDayCell'

interface Props {
  schools: DashboardSchool[]
  sessions: WeekSession[]
  assignments: ActiveAssignment[]
  workerNames: Map<string, string>
  weekStart: string
  today: string
  onSubstituteClick: (session: WeekSession) => void
  onPermanentClick: (group: { id: string; name: string }) => void
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay()
  // 0=Sun→7, 1=Mon→1, ..., 5=Fri→5, 6=Sat→6
  return day === 0 ? 7 : day
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

function formatDay(dateStr: string, idx: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${DAY_LABELS[idx]} ${d.getDate()}`
}

export function WeekGrid({
  schools,
  sessions,
  assignments,
  workerNames,
  weekStart,
  today,
  onSubstituteClick,
  onPermanentClick,
}: Props) {
  const t = useTranslations('sessionsDashboard')

  const days: string[] = [
    weekStart,
    addDays(weekStart, 1),
    addDays(weekStart, 2),
    addDays(weekStart, 3),
    addDays(weekStart, 4),
  ]

  return (
    <div
      style={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 220px)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
      }}
    >
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.875rem' }}>
        <thead>
          <tr
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 20,
              backgroundColor: 'var(--background)',
            }}
          >
            <th
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 30,
                backgroundColor: 'var(--background)',
                width: '11rem',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                fontWeight: 600,
                borderBottom: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
              }}
            >
              {t('group')}
            </th>
            {days.map((day, idx) => {
              const isToday = day === today
              return (
                <th
                  key={day}
                  style={{
                    width: '13rem',
                    minWidth: '13rem',
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border)',
                    borderRight: idx < 4 ? '1px solid var(--border)' : undefined,
                    backgroundColor: isToday
                      ? 'var(--accent)'
                      : 'var(--background)',
                    color: isToday ? 'var(--accent-foreground)' : undefined,
                  }}
                >
                  {formatDay(day, idx)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => (
            <>
              <tr key={`school-${school.id}`}>
                <td
                  colSpan={6}
                  style={{
                    position: 'sticky',
                    left: 0,
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'var(--muted)',
                    borderTop: '2px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {school.name}
                </td>
              </tr>
              {school.groups.map((group) => (
                <tr
                  key={group.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      backgroundColor: 'var(--background)',
                      padding: '0.5rem 0.75rem',
                      fontWeight: 500,
                      borderRight: '1px solid var(--border)',
                      verticalAlign: 'top',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem' }}>{group.name}</div>
                    <button
                      onClick={() => onPermanentClick({ id: group.id, name: group.name })}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted-foreground)',
                        marginTop: '0.125rem',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted',
                      }}
                    >
                      {t('manageTeam')}
                    </button>
                  </td>
                  {days.map((day, idx) => {
                    const daySessions = sessions.filter(
                      (s) => s.groupId === group.id && s.date === day
                    )
                    const dayWeekday = getDayOfWeek(day)
                    const daySchedule = group.schedule.find(
                      (s) => s.weekday === dayWeekday
                    )
                    const groupAssignments = assignments.filter(
                      (a) => a.groupId === group.id
                    )

                    return (
                      <td
                        key={day}
                        style={{
                          padding: '0.375rem 0.5rem',
                          borderRight:
                            idx < 4 ? '1px solid var(--border)' : undefined,
                          verticalAlign: 'top',
                          minWidth: '200px',
                        }}
                      >
                        <GroupDayCell
                          sessions={daySessions}
                          schedule={
                            daySchedule
                              ? {
                                  startTime: daySchedule.startTime,
                                  endTime: daySchedule.endTime,
                                }
                              : undefined
                          }
                          assignments={groupAssignments}
                          workerNames={workerNames}
                          day={day}
                          today={today}
                          onSubstituteClick={onSubstituteClick}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
