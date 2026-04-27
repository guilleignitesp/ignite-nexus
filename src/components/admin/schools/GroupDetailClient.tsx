'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
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
import { PermanentAssignmentDialog } from '@/components/admin/sessions-dashboard/PermanentAssignmentDialog'
import { GenerateSessionsForm } from './GenerateSessionsForm'
import {
  searchStudentsForEnrollment,
  enrollStudentInGroup,
  unenrollStudentFromGroup,
  createGroupPlanning,
} from '@/lib/actions/schools'
import type { GroupAdminDetail } from '@/lib/data/schools'

const WEEKDAY_LABEL: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  holiday: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

type SearchResult = { id: string; firstName: string; lastName: string }

interface Props {
  group: GroupAdminDetail
}

export function GroupDetailClient({ group }: Props) {
  const t = useTranslations('groupDetail')
  const tDash = useTranslations('sessionsDashboard')
  const router = useRouter()

  const [permanentDialogOpen, setPermanentDialogOpen] = useState(false)

  // Students
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null)

  // Planning
  const [assignMapOpen, setAssignMapOpen] = useState(false)
  const [selectedMapId, setSelectedMapId] = useState(group.planningProjectMapId ?? '')
  const [assigning, startAssignTransition] = useTransition()

  const [error, setError] = useState<string | null>(null)

  async function handleStudentSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError(null)
    try {
      const results = await searchStudentsForEnrollment(searchQuery, group.id)
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSearching(false)
    }
  }

  async function handleEnroll(student: SearchResult) {
    setEnrollingId(student.id)
    setError(null)
    try {
      await enrollStudentInGroup(group.id, student.id)
      setSearchResults((prev) => prev.filter((s) => s.id !== student.id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setEnrollingId(null)
    }
  }

  async function handleUnenroll(enrollmentId: string) {
    setUnenrollingId(enrollmentId)
    setError(null)
    try {
      await unenrollStudentFromGroup(enrollmentId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setUnenrollingId(null)
    }
  }

  function handleAssignMap(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMapId) return
    setError(null)
    startAssignTransition(async () => {
      try {
        await createGroupPlanning(group.id, selectedMapId)
        setAssignMapOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Schedule */}
      {group.schedule.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t('scheduleTitle')}</h2>
          <div className="flex flex-wrap gap-2">
            {group.schedule.map((s, i) => (
              <span key={i} className="rounded-md border bg-muted px-3 py-1 text-sm">
                {WEEKDAY_LABEL[s.weekday] ?? s.weekday}{' '}
                {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Teachers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('teachersTitle')}</h2>
          <Button size="sm" variant="outline" onClick={() => setPermanentDialogOpen(true)}>
            <Users />
            {t('manageTeam')}
          </Button>
        </div>
        {group.teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noTeachers')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {group.teachers.map((teacher) => (
              <span
                key={teacher.assignmentId}
                className="rounded-md border bg-muted px-3 py-1.5 text-sm"
              >
                {teacher.firstName} {teacher.lastName}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Students */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('studentsTitle')}</h2>
          <span className="text-sm text-muted-foreground">
            {t('studentCount', { count: group.students.length })}
          </span>
        </div>

        <form onSubmit={handleStudentSearch} className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchStudentPlaceholder')}
            className="max-w-xs"
          />
          <Button type="submit" size="sm" disabled={searching}>
            {searching ? t('searching') : t('search')}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="divide-y rounded-lg border">
            {searchResults.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm">
                  {student.firstName} {student.lastName}
                </span>
                <Button
                  size="xs"
                  onClick={() => handleEnroll(student)}
                  disabled={enrollingId === student.id}
                >
                  {enrollingId === student.id ? t('enrolling') : t('enroll')}
                </Button>
              </div>
            ))}
          </div>
        )}

        {group.students.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noStudents')}</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {group.students.map((student) => (
              <div
                key={student.enrollmentId}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="text-sm">
                  {student.firstName} {student.lastName}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleUnenroll(student.enrollmentId)}
                  disabled={unenrollingId === student.enrollmentId}
                >
                  {unenrollingId === student.enrollmentId ? '...' : t('unenroll')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Planning */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">{t('planningTitle')}</h2>
            {group.planningProjectMapName ? (
              <p className="text-sm text-muted-foreground">
                {t('currentMap')}:{' '}
                <span className="font-medium text-foreground">
                  {group.planningProjectMapName}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noActivePlanning')}</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setAssignMapOpen(true)}>
            <Plus />
            {group.planningProjectMapName ? t('changeProjectMap') : t('assignMapTitle')}
          </Button>
        </div>

        {group.hasActivePlanning && (
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">{t('sessionsTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('sessionsDescription')}</p>
            <GenerateSessionsForm groupId={group.id} />
          </div>
        )}
      </section>

      {/* Sessions list */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t('sessionsListTitle')}</h2>
        {group.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noSessions')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t('colDate')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colTime')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colStatus')}</th>
                  <th className="pb-2 font-medium">{t('colProject')}</th>
                </tr>
              </thead>
              <tbody>
                {group.sessions.map((session) => (
                  <tr key={session.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 tabular-nums">{session.date}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                      {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[session.status] ?? ''}`}
                      >
                        {tDash(`status.${session.status}` as Parameters<typeof tDash>[0])}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {session.projectName ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {permanentDialogOpen && (
        <PermanentAssignmentDialog
          group={{ id: group.id, name: group.name }}
          onClose={() => {
            setPermanentDialogOpen(false)
            router.refresh()
          }}
        />
      )}

      <Dialog open={assignMapOpen} onOpenChange={setAssignMapOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('assignMapTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignMap} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="map-select">{t('currentMap')}</Label>
              <select
                id="map-select"
                value={selectedMapId}
                onChange={(e) => setSelectedMapId(e.target.value)}
                required
                disabled={assigning}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
              >
                <option value="">{t('selectMapPlaceholder')}</option>
                {group.projectMaps.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <DialogClose
                render={<Button type="button" variant="outline" disabled={assigning} />}
              >
                {t('cancelLabel')}
              </DialogClose>
              <Button type="submit" disabled={assigning || !selectedMapId}>
                {assigning ? t('assigning') : t('assign')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
