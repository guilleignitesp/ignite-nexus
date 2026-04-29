'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PermanentAssignmentDialog } from '@/components/admin/sessions-dashboard/PermanentAssignmentDialog'
import { GenerateSessionsForm } from './GenerateSessionsForm'
import {
  searchStudentsForEnrollment,
  enrollStudentInGroup,
  unenrollStudentFromGroup,
  createGroupPlanning,
  createAndEnrollStudent,
  adminUpdateSession,
  deleteSession,
} from '@/lib/actions/schools'
import { getGroupProjects } from '@/lib/actions/sessions-dashboard'
import type { GroupAdminDetail, GroupSession } from '@/lib/data/schools'

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

type SearchResultItem = {
  id: string
  firstName: string
  lastName: string
  status: 'active' | 'inactive'
  alreadyEnrolled: boolean
}

interface Props {
  group: GroupAdminDetail
}

export function GroupDetailClient({ group }: Props) {
  const t = useTranslations('groupDetail')
  const tDash = useTranslations('sessionsDashboard')
  const router = useRouter()

  const [permanentDialogOpen, setPermanentDialogOpen] = useState(false)

  // Add student dialog
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showCreateOption, setShowCreateOption] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  // Unenroll confirmation
  const [unenrollConfirmId, setUnenrollConfirmId] = useState<string | null>(null)
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null)

  // Planning
  const [assignMapOpen, setAssignMapOpen] = useState(false)
  const [selectedMapId, setSelectedMapId] = useState(group.planningProjectMapId ?? '')
  const [assigning, startAssignTransition] = useTransition()

  // Session edit
  const [editSession, setEditSession] = useState<GroupSession | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [editTrafficLight, setEditTrafficLight] = useState<string | null>(null)
  const [editComment, setEditComment] = useState('')
  const [editAttendances, setEditAttendances] = useState<Record<string, boolean>>({})
  const [editProjects, setEditProjects] = useState<{ id: string; name: string }[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [error, setError] = useState<string | null>(null)

  function resetDialog() {
    setFirstName('')
    setLastName('')
    setSearchResults([])
    setSearched(false)
    setShowCreateOption(false)
    setDialogError(null)
  }

  async function handleStudentSearch(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!firstName.trim() && !lastName.trim()) return
    setSearching(true)
    setDialogError(null)
    setShowCreateOption(false)
    try {
      const results = await searchStudentsForEnrollment(firstName, lastName, group.id)
      setSearchResults(results)
      setSearched(true)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSearching(false)
    }
  }

  async function handleEnroll(student: SearchResultItem) {
    setEnrollingId(student.id)
    setDialogError(null)
    try {
      await enrollStudentInGroup(group.id, student.id)
      setAddStudentOpen(false)
      resetDialog()
      router.refresh()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Error')
    } finally {
      setEnrollingId(null)
    }
  }

  async function handleCreateAndEnroll() {
    setCreatingStudent(true)
    setDialogError(null)
    try {
      await createAndEnrollStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        groupId: group.id,
      })
      setAddStudentOpen(false)
      resetDialog()
      router.refresh()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Error')
    } finally {
      setCreatingStudent(false)
    }
  }

  async function handleUnenroll(enrollmentId: string) {
    setUnenrollingId(enrollmentId)
    setError(null)
    try {
      await unenrollStudentFromGroup(enrollmentId)
      setUnenrollConfirmId(null)
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

  function openEdit(session: GroupSession) {
    setEditSession(session)
    setEditStatus(session.status)
    setEditProjectId(session.projectId)
    setEditTrafficLight(session.trafficLight)
    setEditComment(session.teacherComment ?? '')
    const attMap: Record<string, boolean> = {}
    for (const s of group.students) {
      const found = session.attendances.find((a) => a.studentId === s.studentId)
      attMap[s.studentId] = found ? found.attended : false
    }
    setEditAttendances(attMap)
    setDeleteConfirm(false)
    setEditProjects([])
    getGroupProjects(group.id).then((ps) => setEditProjects(ps)).catch(() => {})
  }

  async function handleSaveSession() {
    if (!editSession) return
    setEditSaving(true)
    setError(null)
    try {
      await adminUpdateSession({
        sessionId: editSession.id,
        status: editStatus,
        projectId: editProjectId,
        trafficLight: editTrafficLight,
        teacherComment: editComment.trim() || null,
        attendances: group.students.map((s) => ({
          studentId: s.studentId,
          attended: editAttendances[s.studentId] ?? false,
        })),
      })
      setEditSession(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setEditSaving(false)
    }
  }

  const alreadyEnrolledResults = searchResults.filter((r) => r.alreadyEnrolled)
  const nonEnrolledResults = searchResults.filter((r) => !r.alreadyEnrolled)
  const showCreateButton = searched && (nonEnrolledResults.length === 0 || showCreateOption)

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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t('studentCount', { count: group.students.length })}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { resetDialog(); setAddStudentOpen(true) }}
            >
              <Plus />
              {t('addStudent')}
            </Button>
          </div>
        </div>

        {group.students.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noStudents')}</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {group.students.map((student) => (
              <div key={student.enrollmentId} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {student.firstName} {student.lastName}
                  </span>
                  {unenrollConfirmId !== student.enrollmentId && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setUnenrollConfirmId(student.enrollmentId)}
                      disabled={unenrollingId === student.enrollmentId}
                    >
                      {t('unenroll')}
                    </Button>
                  )}
                </div>
                {unenrollConfirmId === student.enrollmentId && (
                  <div className="mt-2 rounded-md border bg-muted/30 p-2.5 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t('unenrollConfirm', { name: `${student.firstName} ${student.lastName}` })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => handleUnenroll(student.enrollmentId)}
                        disabled={unenrollingId === student.enrollmentId}
                      >
                        {unenrollingId === student.enrollmentId ? '...' : t('confirmUnenroll')}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setUnenrollConfirmId(null)}
                        disabled={unenrollingId === student.enrollmentId}
                      >
                        {t('cancelUnenroll')}
                      </Button>
                    </div>
                  </div>
                )}
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
                  <th className="pb-2 pr-4 font-medium">{t('colProject')}</th>
                  <th className="pb-2 font-medium" />
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
                    <td className="py-2 pr-4 text-muted-foreground">
                      {session.projectName ?? '—'}
                    </td>
                    <td className="py-2">
                      <Button size="xs" variant="outline" onClick={() => openEdit(session)}>
                        Editar
                      </Button>
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

      {/* Add student dialog */}
      <Dialog
        open={addStudentOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog()
          setAddStudentOpen(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addStudent')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleStudentSearch} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>{t('firstNameLabel')}</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('lastNameLabel')}</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={searching || (!firstName.trim() && !lastName.trim())}
            >
              {searching ? t('searching') : t('search')}
            </Button>
          </form>

          {searched && (
            <div className="space-y-3">
              {/* Already enrolled */}
              {alreadyEnrolledResults.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('alreadyEnrolledSection')}
                  </p>
                  {alreadyEnrolledResults.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center rounded-md border px-3 py-2 text-sm text-muted-foreground"
                    >
                      {s.lastName}, {s.firstName}
                    </div>
                  ))}
                </div>
              )}

              {/* Existing students not yet enrolled */}
              {nonEnrolledResults.length > 0 && !showCreateOption && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('existingStudentsSection')}
                  </p>
                  {nonEnrolledResults.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{s.lastName}, {s.firstName}</span>
                        {s.status === 'inactive' && (
                          <Badge variant="secondary" className="text-xs">
                            {t('inactiveBadge')}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="xs"
                        onClick={() => handleEnroll(s)}
                        disabled={enrollingId === s.id}
                      >
                        {enrollingId === s.id ? t('addingToGroup') : t('addToGroup')}
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowCreateOption(true)}
                  >
                    {t('noneOfThese')}
                  </Button>
                </div>
              )}

              {/* Create new student */}
              {showCreateButton && (
                <div className="space-y-2">
                  {nonEnrolledResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('noSearchResults')}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleCreateAndEnroll}
                    disabled={creatingStudent || (!firstName.trim() && !lastName.trim())}
                  >
                    {creatingStudent ? t('creatingStudent') : t('createNewStudent')}
                  </Button>
                </div>
              )}

              {dialogError && <p className="text-sm text-destructive">{dialogError}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit session sheet */}
      <Sheet open={!!editSession} onOpenChange={(open) => { if (!open) setEditSession(null) }}>
        <SheetContent className="sm:max-w-sm overflow-y-auto" style={{ maxHeight: '100dvh', overflowY: 'auto' }}>
          {editSession && (
            <>
              <SheetHeader>
                <SheetTitle>{editSession.date}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {editSession.startTime.slice(0, 5)}–{editSession.endTime.slice(0, 5)}
                </p>
              </SheetHeader>

              <div className="mt-4 space-y-5">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {['pending','completed','suspended','holiday','cancelled','unknown','excused'].map((s) => (
                      <option key={s} value={s}>
                        {tDash(`status.${s}` as Parameters<typeof tDash>[0])}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div className="space-y-1.5">
                  <Label>Proyecto</Label>
                  <select
                    value={editProjectId ?? ''}
                    onChange={(e) => setEditProjectId(e.target.value || null)}
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">— Sin proyecto —</option>
                    {editProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Traffic light */}
                <div className="space-y-1.5">
                  <Label>Semáforo</Label>
                  <div className="flex gap-2">
                    {(['green','yellow','orange','red'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditTrafficLight(editTrafficLight === c ? null : c)}
                        className={`size-7 rounded-full border-2 transition-transform ${
                          c === 'green' ? 'bg-green-500' :
                          c === 'yellow' ? 'bg-yellow-400' :
                          c === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                        } ${editTrafficLight === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <Label>Comentario del profesor</Label>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Observaciones..."
                  />
                </div>

                {/* Attendance */}
                {group.students.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Asistencia</Label>
                    <div className="space-y-1 rounded-md border p-2">
                      {group.students.map((s) => (
                        <label key={s.studentId} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={editAttendances[s.studentId] ?? false}
                            onChange={(e) =>
                              setEditAttendances((prev) => ({ ...prev, [s.studentId]: e.target.checked }))
                            }
                            className="size-4 rounded border-input"
                          />
                          <span className="text-sm">{s.firstName} {s.lastName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full" disabled={editSaving} onClick={handleSaveSession}>
                  {editSaving ? 'Guardando...' : 'Guardar'}
                </Button>

                {!deleteConfirm ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    disabled={editSaving}
                    onClick={() => setDeleteConfirm(true)}
                  >
                    Eliminar sesión
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                    <p className="text-xs text-destructive">¿Seguro que quieres eliminar esta sesión?</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={editSaving}
                        onClick={async () => {
                          if (!editSession) return
                          setEditSaving(true)
                          try {
                            await deleteSession(editSession.id)
                            setEditSession(null)
                            router.refresh()
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Error')
                          } finally {
                            setEditSaving(false)
                          }
                        }}
                      >
                        {editSaving ? '...' : 'Confirmar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm(false)}
                        disabled={editSaving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign map dialog */}
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
