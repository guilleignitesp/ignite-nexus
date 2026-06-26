'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import type { StaffingSlot } from '@/lib/data/schools'
import { addDays } from '@/lib/utils/week-helpers'
import { GroupDayCell } from './GroupDayCell'

interface Props {
  slots: StaffingSlot[]
  workerNames: Map<string, string>
  weekStart: string
  today: string
  onSlotClick: (slot: StaffingSlot) => void
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

function formatDay(dateStr: string, idx: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${DAY_LABELS[idx]} ${d.getDate()}`
}

export function WeekGrid({ slots, workerNames, weekStart, today, onSlotClick }: Props) {
  const t = useTranslations('sessionsDashboard')

  const days: string[] = [
    weekStart,
    addDays(weekStart, 1),
    addDays(weekStart, 2),
    addDays(weekStart, 3),
    addDays(weekStart, 4),
  ]

  // Derive school → group structure from slots (preserving school sort from server)
  const schoolMap = new Map<string, { id: string; name: string; groups: Map<string, string> }>()
  for (const slot of slots) {
    let school = schoolMap.get(slot.schoolId)
    if (!school) {
      school = { id: slot.schoolId, name: slot.schoolName, groups: new Map() }
      schoolMap.set(slot.schoolId, school)
    }
    if (!school.groups.has(slot.groupId)) {
      school.groups.set(slot.groupId, slot.groupName)
    }
  }
  const schools = [...schoolMap.values()].map((s) => ({
    id: s.id,
    name: s.name,
    groups: [...s.groups.entries()].map(([id, name]) => ({ id, name })),
  }))

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
                </td>
                {days.map((day, idx) => (
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
                        const groupSlots = slots.filter(
                          (s) => s.groupId === group.id && s.slotDate === day
                        )
                        if (groupSlots.length === 0) return null
                        return (
                          <GroupDayCell
                            key={group.id}
                            slots={groupSlots}
                            workerNames={workerNames}
                            onSlotClick={onSlotClick}
                          />
                        )
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
