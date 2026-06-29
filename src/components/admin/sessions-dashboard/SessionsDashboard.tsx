'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { StaffingSlot, Worker } from '@/lib/data/schools'
import { addDays } from '@/lib/utils/week-helpers'
import { WeekGrid } from './WeekGrid'
import { SlotDetailPanel } from './SlotDetailPanel'
import { AuditPanel } from './AuditPanel'

interface Props {
  slots: StaffingSlot[]
  workers: Worker[]
  weekStart: string
  today: string
  locale: string
}

export function SessionsDashboard({ slots, workers, weekStart, today, locale }: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()

  const [selectedSlot, setSelectedSlot] = useState<StaffingSlot | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)

  useEffect(() => {
    if (!selectedSlot) return
    const updated = slots.find(
      (s) =>
        s.groupId === selectedSlot.groupId &&
        s.slotDate === selectedSlot.slotDate &&
        s.startTime === selectedSlot.startTime
    )
    if (updated) setSelectedSlot(updated)
  }, [slots])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const teamsMap = new Map<string, { id: string; name: string }>()
  for (const slot of slots) {
    if (slot.teamId && !teamsMap.has(slot.teamId)) {
      teamsMap.set(slot.teamId, { id: slot.teamId, name: slot.teamName ?? slot.teamId })
    }
  }
  const teams = [...teamsMap.values()]

  const filteredSlots = selectedTeamId
    ? slots.filter((s) => s.teamId === selectedTeamId)
    : slots

  const workerNames = new Map<string, string>()
  for (const w of workers) {
    workerNames.set(w.id, `${w.first_name} ${w.last_name}`)
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

      {/* Team filter */}
      {teams.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTeamId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedTeamId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTeamId === team.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      <WeekGrid
        slots={filteredSlots}
        workerNames={workerNames}
        weekStart={weekStart}
        today={today}
        onSlotClick={setSelectedSlot}
      />

      {selectedSlot && (
        <SlotDetailPanel
          slot={selectedSlot}
          workerNames={workerNames}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      <AuditPanel open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  )
}
