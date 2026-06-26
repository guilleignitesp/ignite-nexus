'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import type { StaffingSlot } from '@/lib/data/schools'

interface Props {
  slots: StaffingSlot[]
  workerNames: Map<string, string>
  onSlotClick: (slot: StaffingSlot) => void
}

function statusVariant(
  status: StaffingSlot['sessionStatus']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed': return 'default'
    case 'excused':   return 'secondary'
    default:          return 'outline'
  }
}

export function GroupDayCell({ slots, workerNames, onSlotClick }: Props) {
  const t = useTranslations('sessionsDashboard')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {slots.map((slot) => {
        const absentIds = new Set(
          slot.teacherChanges
            .filter((tc) => tc.type === 'absent' && tc.isActive)
            .map((tc) => tc.workerId)
        )
        const substitutes = slot.teacherChanges.filter(
          (tc) => tc.type === 'substitute' && tc.isActive
        )

        return (
          <button
            key={`${slot.groupId}|${slot.slotDate}|${slot.startTime}`}
            onClick={() => onSlotClick(slot)}
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
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{slot.groupName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
              </span>
              {slot.sessionStatus && (
                <Badge
                  variant={statusVariant(slot.sessionStatus)}
                  style={{ fontSize: '0.6rem', padding: '0 0.25rem' }}
                >
                  {t(`status.${slot.sessionStatus}`)}
                </Badge>
              )}
              {slot.sessionStatus === 'excused' && slot.excusedReason && (
                <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>
                  {t(`excusedReasons.${slot.excusedReason}` as Parameters<typeof t>[0])}
                </span>
              )}
            </div>

            {/* Project */}
            {slot.projectName && (
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
                {slot.projectName}
              </div>
            )}

            {/* Permanent teachers */}
            {slot.permanentWorkers.length > 0 && (
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {slot.permanentWorkers.map((w) => {
                  const isAbsent = absentIds.has(w.workerId)
                  return (
                    <span
                      key={w.assignmentId}
                      style={{
                        fontSize: '0.7rem',
                        color: isAbsent ? 'var(--destructive)' : 'var(--foreground)',
                        textDecoration: isAbsent ? 'line-through' : 'none',
                      }}
                    >
                      {w.firstName} {w.lastName}
                      {isAbsent && ' ✗'}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Substitutes */}
            {substitutes.length > 0 && (
              <div style={{ marginTop: '0.125rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                {substitutes.map((sub) => (
                  <span
                    key={sub.id}
                    style={{ fontSize: '0.7rem', color: 'var(--primary)', fontStyle: 'italic' }}
                  >
                    ↪ {workerNames.get(sub.workerId) ?? `#${sub.workerId.slice(0, 6)}`}
                  </span>
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
