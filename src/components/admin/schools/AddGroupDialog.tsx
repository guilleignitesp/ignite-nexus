'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/actions/schools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { School, Worker } from '@/lib/data/schools'
import type { SchoolYear } from '@/lib/data/settings'

interface AddGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSchoolId: string
  schools: School[]
  schoolYears: SchoolYear[]
  workers: Worker[]
}

const WEEKDAY_SHORT: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
}

const WEEKDAYS = [1, 2, 3, 4, 5] as const

type DaySlot = { start_time: string; end_time: string } | null

function buildInitialDays(): Record<number, DaySlot> {
  return { 1: null, 2: null, 3: null, 4: null, 5: null }
}

export function AddGroupDialog({
  open,
  onOpenChange,
  defaultSchoolId,
  schools,
  schoolYears,
  workers,
}: AddGroupDialogProps) {
  const t = useTranslations('schools')
  const router = useRouter()

  const activeYear = schoolYears.find((y) => y.is_active)

  const [name, setName] = useState('')
  const [schoolId, setSchoolId] = useState(defaultSchoolId)
  const [schoolYearId, setSchoolYearId] = useState(activeYear?.id ?? '')
  const [selectedDays, setSelectedDays] = useState<Record<number, DaySlot>>(buildInitialDays())
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setSchoolId(defaultSchoolId)
    }
  }, [open, defaultSchoolId])

  function resetForm() {
    setName('')
    setSchoolId(defaultSchoolId)
    setSchoolYearId(activeYear?.id ?? '')
    setSelectedDays(buildInitialDays())
    setSelectedTeacherIds(new Set())
    setError(null)
  }

  function handleOpenChange(val: boolean) {
    onOpenChange(val)
    if (!val) resetForm()
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) => ({
      ...prev,
      [day]: prev[day] === null ? { start_time: '16:00', end_time: '18:00' } : null,
    }))
  }

  function updateDayTime(day: number, field: 'start_time' | 'end_time', value: string) {
    setSelectedDays((prev) => {
      const slot = prev[day]
      if (!slot) return prev
      return { ...prev, [day]: { ...slot, [field]: value } }
    })
  }

  function toggleTeacher(id: string) {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const schedule = WEEKDAYS.filter((d) => selectedDays[d] !== null).map((d) => ({
      weekday: d,
      start_time: (selectedDays[d] as { start_time: string; end_time: string }).start_time,
      end_time: (selectedDays[d] as { start_time: string; end_time: string }).end_time,
    }))

    if (schedule.length === 0) {
      setError(t('errorNoDaysSelected'))
      return
    }

    startTransition(async () => {
      try {
        await createGroup({
          name: name.trim(),
          schoolId,
          schoolYearId: schoolYearId || null,
          schedule,
          teacherIds: Array.from(selectedTeacherIds),
        })
        handleOpenChange(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('addGroupTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">{t('groupNameLabel')}</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('groupNamePlaceholder')}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-school">{t('schoolLabel')}</Label>
            <select
              id="group-school"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={isPending}
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
            >
              <option value="">{t('schoolPlaceholder')}</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-year">{t('schoolYearLabel')}</Label>
            <select
              id="group-year"
              value={schoolYearId}
              onChange={(e) => setSchoolYearId(e.target.value)}
              disabled={isPending}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
            >
              <option value="">{t('schoolYearPlaceholder')}</option>
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t('scheduleLabel')}</Label>
            <div className="space-y-2">
              {WEEKDAYS.map((day) => {
                const slot = selectedDays[day]
                const isActive = slot !== null
                return (
                  <div key={day}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        disabled={isPending}
                        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input hover:bg-muted'
                        }`}
                      >
                        {WEEKDAY_SHORT[day]}
                      </button>
                      {isActive && slot && (
                        <>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateDayTime(day, 'start_time', e.target.value)}
                            disabled={isPending}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateDayTime(day, 'end_time', e.target.value)}
                            disabled={isPending}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('teachersLabel')}</Label>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1">
              {workers.map((worker) => (
                <label
                  key={worker.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeacherIds.has(worker.id)}
                    onChange={() => toggleTeacher(worker.id)}
                    disabled={isPending}
                    className="accent-primary"
                  />
                  {worker.last_name}, {worker.first_name}
                </label>
              ))}
              {workers.length === 0 && (
                <p className="px-2 py-1 text-sm text-muted-foreground">{t('noWorkers')}</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isPending} />}
            >
              {t('cancel')}
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? '...' : t('addGroupSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
