'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { StaffingSlot, SlotRef } from '@/lib/data/schools'
import { markAbsent, unmarkAbsent, removeSubstitute, updateSlotMinTeachers } from '@/lib/actions/sessions-dashboard'
import { SubstitutePanel } from './SubstitutePanel'
import { PermanentAssignmentDialog } from './PermanentAssignmentDialog'

interface Props {
  slot: StaffingSlot
  workerNames: Map<string, string>
  onClose: () => void
}

export function SlotDetailPanel({ slot, workerNames, onClose }: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [substituteOpen, setSubstituteOpen] = useState(false)
  const [permanentOpen, setPermanentOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const absentIds = new Set(
    slot.teacherChanges
      .filter((tc) => tc.type === 'absent' && tc.isActive)
      .map((tc) => tc.workerId)
  )
  const substitutes = slot.teacherChanges.filter(
    (tc) => tc.type === 'substitute' && tc.isActive
  )

  const slotRef = {
    groupId: slot.groupId,
    slotDate: slot.slotDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }

  function refresh() {
    router.refresh()
    onClose()
  }

  function handleMarkAbsent(workerId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await markAbsent(slotRef, workerId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleUnmarkAbsent(absenceId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await unmarkAbsent(absenceId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleRemoveSubstitute(assignmentId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removeSubstitute(assignmentId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  if (substituteOpen) {
    return (
      <SubstitutePanel
        slot={slot}
        onClose={() => { router.refresh(); setSubstituteOpen(false) }}
      />
    )
  }

  if (permanentOpen) {
    return (
      <PermanentAssignmentDialog
        group={{ id: slot.groupId, name: slot.groupName }}
        sessionDate={slot.slotDate}
        onClose={() => {
        router.refresh()
        setPermanentOpen(false)
      }}
      />
    )
  }

  const timeLabel = `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md" style={{ overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle>
            {slot.groupName} · {timeLabel}
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '0.75rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Info */}
          <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>{slot.schoolName}</span>
            <span>{slot.slotDate}</span>
            {slot.sessionStatus === 'excused' && slot.excusedReason && (
              <span>{t(`excusedReasons.${slot.excusedReason}` as Parameters<typeof t>[0])}</span>
            )}
          </div>

          {error && (
            <div style={{ fontSize: '0.8rem', color: 'var(--destructive)', padding: '0.5rem', border: '1px solid var(--destructive)', borderRadius: '0.375rem' }}>
              {error}
            </div>
          )}

          {/* Min teachers */}
          <section>
            <SectionLabel>Mínimo de profesores</SectionLabel>
            <MinTeachersEditor
              slotRef={slotRef}
              current={slot.minTeachersRequired}
              sessionId={slot.sessionId}
              presentCount={
                slot.permanentWorkers.filter((w) => !absentIds.has(w.workerId)).length +
                slot.teacherChanges.filter((tc) => tc.type === 'substitute' && tc.isActive).length
              }
            />
          </section>

          {/* Permanent team */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <SectionLabel style={{ margin: 0 }}>{t('detailPermanentTeam')}</SectionLabel>
              <Button size="xs" variant="outline" onClick={() => setPermanentOpen(true)}>
                {t('manageTeam')}
              </Button>
            </div>
            {slot.permanentWorkers.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{t('noTeam')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {slot.permanentWorkers.map((w) => {
                  const isAbsent = absentIds.has(w.workerId)
                  const absenceSTA = isAbsent
                    ? slot.teacherChanges.find(
                        (tc) => tc.workerId === w.workerId && tc.type === 'absent' && tc.isActive
                      )
                    : null

                  return (
                    <div
                      key={w.assignmentId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.375rem 0',
                        borderBottom: '1px solid var(--border)',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          textDecoration: isAbsent ? 'line-through' : 'none',
                          color: isAbsent ? 'var(--muted-foreground)' : undefined,
                        }}
                      >
                        {w.firstName} {w.lastName}
                      </span>
                      {isAbsent && absenceSTA ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleUnmarkAbsent(absenceSTA.id)}
                          disabled={isPending}
                        >
                          {t('unmarkAbsent')}
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => handleMarkAbsent(w.workerId)}
                          disabled={isPending}
                        >
                          {t('markAbsent')}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Substitutes */}
          <section>
            <SectionLabel>{t('detailSubstitutes')}</SectionLabel>
            {substitutes.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{t('noSubstitutes')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.5rem' }}>
                {substitutes.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.375rem 0',
                      borderBottom: '1px solid var(--border)',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                      ↪ {workerNames.get(sub.workerId) ?? `#${sub.workerId.slice(0, 6)}`}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleRemoveSubstitute(sub.id)}
                      disabled={isPending}
                    >
                      {t('removeSubstitute')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setSubstituteOpen(true)}
            >
              + {t('addSubstitute')}
            </Button>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}

function MinTeachersEditor({
  slotRef,
  current,
  sessionId,
  presentCount,
}: {
  slotRef: SlotRef
  current: number
  sessionId: string | null
  presentCount: number
}) {
  const router = useRouter()
  const [value, setValue] = useState(current)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(current)
  }, [current])

  const isUnderMin = presentCount < value

  function handleSave() {
    if (value < 1 || value === current) { setEditing(false); return }
    setError(null)
    startTransition(async () => {
      try {
        await updateSlotMinTeachers(slotRef, value)
        router.refresh()
        setEditing(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {editing ? (
          <>
            <input
              type="number"
              min={1}
              max={10}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              style={{
                width: 56, padding: '4px 8px', borderRadius: 8,
                border: '1px solid rgba(62,111,168,0.30)',
                fontSize: 14, fontWeight: 700, textAlign: 'center',
              }}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{
                padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'rgba(62,111,168,0.10)',
                border: '1.5px solid rgba(62,111,168,0.22)',
                color: '#2D4A6B', cursor: 'pointer',
              }}
            >
              {isPending ? '...' : 'Guardar'}
            </button>
            <button
              onClick={() => { setValue(current); setEditing(false) }}
              style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 12,
                background: 'transparent', border: '1px solid rgba(62,111,168,0.15)',
                color: '#8BA3BC', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0F1C2E' }}>{value}</span>
            <span style={{ fontSize: 12, color: '#8BA3BC' }}>requerido{value !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setEditing(true)}
              style={{
                marginLeft: 'auto', padding: '3px 10px', borderRadius: 8, fontSize: 11,
                background: 'transparent', border: '1px solid rgba(62,111,168,0.15)',
                color: '#6B8BA4', cursor: 'pointer',
              }}
            >
              Editar
            </button>
          </>
        )}
      </div>

      {/* Coverage indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isUnderMin ? '#E57373' : '#4CAF7D',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, color: isUnderMin ? '#C0392B' : '#2D7A4A', fontWeight: 600 }}>
          {presentCount} presente{presentCount !== 1 ? 's' : ''} de {value} requerido{value !== 1 ? 's' : ''}
          {isUnderMin ? ' — bajo mínimo' : ' — cubierto'}
        </span>
      </div>

      {error && <span style={{ fontSize: 11, color: '#C0392B' }}>{error}</span>}
    </div>
  )
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--muted-foreground)',
        marginBottom: '0.375rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
