'use client'

import React from 'react'
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
  weekStart: string
  today: string
  onSessionClick: (session: WeekSession, groupName: string, schoolName: string) => void
  onPermanentClick: (group: { id: string; name: string }) => void
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay()
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
  weekStart,
  today,
  onSessionClick,
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
                width: '10rem',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                fontWeight: 600,
                borderBottom: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
              }}
            >
              {t('school')}
            </th>
            {days.map((day, idx) => {
              const isToday = day === today
              return (
                <th
                  key={day}
                  style={{
                    width: '14rem',
                    minWidth: '14rem',
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border)',
                    borderRight: idx < 4 ? '1px solid var(--border)' : undefined,
                    backgroundColor: isToday ? 'var(--accent)' : 'var(--background)',
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
            <React.Fragment key={school.id}>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                {/* Sticky school + group team links */}
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    backgroundColor: 'var(--muted)',
                    padding: '0.5rem 0.75rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--muted-foreground)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    verticalAlign: 'top',
                  }}
                >
                  <div>{school.name}</div>
                  {school.groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => onPermanentClick({ id: group.id, name: group.name })}
                      style={{
                        display: 'block',
                        fontSize: '0.65rem',
                        color: 'var(--muted-foreground)',
                        marginTop: '0.25rem',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted',
                        textAlign: 'left',
                      }}
                    >
                      {group.name} — {t('manageTeam')}
                    </button>
                  ))}
                </td>

                {/* One day cell per column, aggregating all groups for this school */}
                {days.map((day, idx) => {
                  const dayWeekday = getDayOfWeek(day)

                  return (
                    <td
                      key={day}
                      style={{
                        padding: '0.375rem 0.5rem',
                        borderRight: idx < 4 ? '1px solid var(--border)' : undefined,
                        borderBottom: '1px solid var(--border)',
                        verticalAlign: 'top',
                        minWidth: '200px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {school.groups.map((group) => {
                          const groupSessions = sessions.filter(
                            (s) => s.groupId === group.id && s.date === day
                          )
                          const daySchedule = group.schedule.find(
                            (s) => s.weekday === dayWeekday
                          )
                          const groupAssignments = assignments.filter(
                            (a) => a.groupId === group.id
                          )

                          if (groupSessions.length === 0 && !daySchedule) return null

                          return (
                            <GroupDayCell
                              key={group.id}
                              sessions={groupSessions}
                              schedule={
                                daySchedule
                                  ? {
                                      startTime: daySchedule.startTime,
                                      endTime: daySchedule.endTime,
                                    }
                                  : undefined
                              }
                              assignments={groupAssignments}
                              groupName={group.name}
                              onSessionClick={(session) =>
                                onSessionClick(session, group.name, school.name)
                              }
                            />
                          )
                        })}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
