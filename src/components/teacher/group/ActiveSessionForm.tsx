'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FinalizeDialog } from './FinalizeDialog'
import { saveSession, finalizeSession } from '@/lib/actions/teacher-sessions'
import type { TodaySession, EnrolledStudent } from '@/lib/data/teacher'
import type { TrafficLight } from '@/types'

interface ActiveSessionFormProps {
  groupId: string
  planningId: string
  session: TodaySession
  students: EnrolledStudent[]
  successors: { projectId: string; projectName: string }[]
}

export function ActiveSessionForm({
  groupId,
  planningId,
  session,
  students,
  successors,
}: ActiveSessionFormProps) {
  const t = useTranslations('teacherGroup')
  const router = useRouter()

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

  const isPending = isSaving || isFinalizing
  const attendanceMap = new Map(attendances.map((a) => [a.studentId, a.attended]))

  return (
    <div className="rounded-lg border p-5 space-y-5">
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isPending}
        >
          {isSaving ? t('saving') : t('save')}
        </Button>

        <FinalizeDialog
          successors={successors}
          onConfirm={handleFinalize}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
