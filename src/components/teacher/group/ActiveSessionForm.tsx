'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FinalizeDialog } from './FinalizeDialog'
import { saveSession, finalizeSession, getProjectDetails, markSessionUnknown, markSessionExcused } from '@/lib/actions/teacher-sessions'
import { cn } from '@/lib/utils'
import type { TodaySession, EnrolledStudent } from '@/lib/data/teacher'
import type { TrafficLight } from '@/types'

interface ProjectDetails {
  description: string | null
  resources: { title: string; url: string; type: string }[]
  recommendedHours: number | null
  sessionNumber: number
  hoursLogged: number
}

function fmtH(h: number): string {
  const r = Math.round(h * 10) / 10
  return r % 1 === 0 ? String(Math.round(r)) : String(r)
}

interface ActiveSessionFormProps {
  groupId: string
  planningId: string
  session: TodaySession
  students: EnrolledStudent[]
  successors: { projectId: string; projectName: string }[]
  currentProjectId: string | null
  currentProjectName: string | null
}

export function ActiveSessionForm({
  groupId,
  planningId,
  session,
  students,
  successors,
  currentProjectId,
  currentProjectName,
}: ActiveSessionFormProps) {
  const t = useTranslations('teacherGroup')
  const router = useRouter()

  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)

  useEffect(() => {
    if (!currentProjectId) return
    getProjectDetails(currentProjectId, planningId)
      .then((d) => { if (d) setProjectDetails(d) })
      .catch(() => {})
  }, [currentProjectId, planningId])

  // Inicializar asistencia: priorizar data de BD; si no existe, presente por defecto
  const initAttendances = () => {
    const map = new Map(session.attendances.map((a) => [a.studentId, a.attended]))
    return students.map((s) => ({
      studentId: s.studentId,
      attended: map.get(s.studentId) ?? true,
    }))
  }

  const [attendances, setAttendances] = useState(initAttendances)
  const [comment, setComment] = useState(session.teacherComment ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()
  const [isFinalizing, startFinalize] = useTransition()
  const [isMarkingUnknown, startMarkUnknown] = useTransition()
  const [isMarkingExcused, startMarkExcused] = useTransition()
  const [unknownDialogOpen, setUnknownDialogOpen] = useState(false)
  const [excusedDialogOpen, setExcusedDialogOpen] = useState(false)

  function toggleAttendance(studentId: string) {
    setAttendances((prev) =>
      prev.map((a) => (a.studentId === studentId ? { ...a, attended: !a.attended } : a))
    )
  }

  function handleSave() {
    setError(null)
    startSave(async () => {
      try {
        await saveSession({
          sessionId: session.sessionId,
          groupId,
          teacherComment: comment.trim() || null,
          attendances,
        })
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  function handleFinalize({
    trafficLight,
    projectCompleted,
    nextProjectId,
  }: {
    trafficLight: TrafficLight
    projectCompleted: boolean
    nextProjectId: string | null
  }) {
    setError(null)
    startFinalize(async () => {
      try {
        await finalizeSession({
          sessionId: session.sessionId,
          groupId,
          planningId,
          trafficLight,
          teacherComment: comment.trim() || null,
          attendances,
          projectCompleted,
          nextProjectId,
        })
        router.refresh()
      } catch {
        setError(t('finalizeError'))
      }
    })
  }

  function handleMarkUnknown() {
    setError(null)
    startMarkUnknown(async () => {
      try {
        await markSessionUnknown(session.sessionId, groupId)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  function handleMarkExcused() {
    setError(null)
    startMarkExcused(async () => {
      try {
        await markSessionExcused(session.sessionId, groupId)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  const isPending = isSaving || isFinalizing || isMarkingUnknown || isMarkingExcused
  const attendanceMap = new Map(attendances.map((a) => [a.studentId, a.attended]))

  return (
    <div className="rounded-lg border p-5 space-y-5">
      {/* Info del proyecto activo */}
      {currentProjectName && (
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-sm font-semibold">{currentProjectName}</p>
            {projectDetails && (
              <span className="text-xs text-muted-foreground">
                {t('sessionNumber', { n: projectDetails.sessionNumber })}
              </span>
            )}
          </div>
          {projectDetails?.description && (
            <p className="text-sm text-muted-foreground">{projectDetails.description}</p>
          )}
          {projectDetails && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {'⏱ '}
                {projectDetails.recommendedHours != null
                  ? t('hoursProgressFull', {
                      recommended: fmtH(projectDetails.recommendedHours),
                      logged: fmtH(projectDetails.hoursLogged),
                    })
                  : t('hoursProgressLogged', { logged: fmtH(projectDetails.hoursLogged) })}
              </p>
              {projectDetails.recommendedHours != null && (
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      projectDetails.hoursLogged > projectDetails.recommendedHours
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    )}
                    style={{
                      width: `${Math.min(100, (projectDetails.hoursLogged / projectDetails.recommendedHours) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {projectDetails && projectDetails.resources.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
              {projectDetails.resources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {r.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de asistencia */}
      <div>
        <p className="mb-2 text-sm font-medium">{t('attendanceTitle')}</p>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {students.map((student) => {
            const attended = attendanceMap.get(student.studentId) ?? true
            return (
              <label
                key={student.studentId}
                className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/40 select-none"
              >
                <input
                  type="checkbox"
                  checked={attended}
                  onChange={() => toggleAttendance(student.studentId)}
                  disabled={isPending}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">
                  {student.lastName}, {student.firstName}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Comentario */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('commentLabel')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          disabled={isPending}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Acciones */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isPending}>
            {isSaving ? t('saving') : t('save')}
          </Button>
          <FinalizeDialog
            successors={successors}
            onConfirm={handleFinalize}
            isPending={isPending}
          />
        </div>

        <div className="border-t pt-3">
          {unknownDialogOpen ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
              <p className="text-muted-foreground">{t('markUnknownConfirm')}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleMarkUnknown} disabled={isPending}>
                  {t('confirmFinalize')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setUnknownDialogOpen(false)} disabled={isPending}>
                  {t('cancelFinalize')}
                </Button>
              </div>
            </div>
          ) : excusedDialogOpen ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
              <p className="text-muted-foreground">{t('markExcusedConfirm')}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleMarkExcused} disabled={isPending}>
                  {t('confirmFinalize')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setExcusedDialogOpen(false)} disabled={isPending}>
                  {t('cancelFinalize')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnknownDialogOpen(true)}
                disabled={isPending}
              >
                {t('markUnknownLabel')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExcusedDialogOpen(true)}
                disabled={isPending}
                className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950/30"
              >
                {t('markExcusedLabel')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
