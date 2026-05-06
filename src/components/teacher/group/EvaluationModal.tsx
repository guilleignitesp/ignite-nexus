'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  getProjectSkillsForEvaluation,
  submitProjectEvaluation,
  updateProjectEvaluation,
} from '@/lib/actions/teacher-sessions'

interface SkillInfo {
  skillId: string
  name_es: string
  branch_color: string
  rank: number
  baseXp: number
}

interface StudentInfo {
  studentId: string
  firstName: string
  lastName: string
}

interface EvaluationModalProps {
  projectId: string
  planningId: string
  sessionId: string
  groupId: string
  open: boolean
  onClose: () => void
  onCompleted: (nextProjectId: string | null) => void
  successors: { projectId: string; projectName: string }[]
  isEditMode?: boolean
  existingEvals?: { studentId: string; skills: { skillId: string; xpAwarded: number }[] }[]
}

const MIN_PCT = 30
const MAX_PCT = 150
const STEP_PCT = 10

export function EvaluationModal({
  projectId,
  planningId,
  sessionId,
  groupId,
  open,
  onClose,
  onCompleted,
  successors,
  isEditMode = false,
  existingEvals,
}: EvaluationModalProps) {
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [multipliers, setMultipliers] = useState<Record<string, number>>({})
  const [nextProjectId, setNextProjectId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setNextProjectId('')
    getProjectSkillsForEvaluation(projectId, planningId)
      .then(({ skills: s, students: st }) => {
        setSkills(s)
        setStudents(st)
        const init: Record<string, number> = {}
        for (const student of st) {
          for (const skill of s) {
            const key = `${student.studentId}:${skill.skillId}`
            if (isEditMode && existingEvals && skill.baseXp > 0) {
              const ev = existingEvals.find((e) => e.studentId === student.studentId)
              const sk = ev?.skills.find((sk) => sk.skillId === skill.skillId)
              const rawPct = sk ? Math.round((sk.xpAwarded / skill.baseXp) * 100) : 100
              init[key] = Math.max(MIN_PCT, Math.min(MAX_PCT, rawPct))
            } else {
              init[key] = 100
            }
          }
        }
        setMultipliers(init)
      })
      .catch(() => setError('Error cargando datos de evaluación'))
      .finally(() => setLoading(false))
  }, [open, projectId, planningId])

  function getMultiplier(studentId: string, skillId: string): number {
    return multipliers[`${studentId}:${skillId}`] ?? 100
  }

  function adjustMultiplier(studentId: string, skillId: string, delta: number) {
    const key = `${studentId}:${skillId}`
    setMultipliers((prev) => {
      const current = prev[key] ?? 100
      return { ...prev, [key]: Math.max(MIN_PCT, Math.min(MAX_PCT, current + delta)) }
    })
  }

  function handleSubmit() {
    setError(null)
    startSubmit(async () => {
      try {
        const evaluations = students.map((s) => ({
          studentId: s.studentId,
          skills: skills.map((sk) => ({
            skillId: sk.skillId,
            xpAwarded: Math.round((sk.baseXp * getMultiplier(s.studentId, sk.skillId)) / 100),
          })),
        }))
        if (isEditMode) {
          await updateProjectEvaluation({ planningId, projectId, groupId, sessionId, evaluations })
          onCompleted(null)
        } else {
          await submitProjectEvaluation({
            planningId,
            projectId,
            groupId,
            sessionId,
            nextProjectId: nextProjectId || null,
            evaluations,
          })
          onCompleted(nextProjectId || null)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar la evaluación')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-4"
      >
        <DialogTitle>Evaluación del proyecto</DialogTitle>

        {loading && (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
        )}

        {!loading && !error && students.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No hay alumnos con asistencia registrada en este proyecto.
          </p>
        )}

        {!loading && students.length > 0 && skills.length > 0 && (
          <div className="overflow-auto flex-1 min-h-0 rounded-md border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground bg-muted/50 border-b sticky left-0 z-10">
                    Alumno
                  </th>
                  {skills.map((sk) => (
                    <th
                      key={sk.skillId}
                      className="px-3 py-2 font-medium text-center border-b bg-muted/50 min-w-[130px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: sk.branch_color }}
                        />
                        <span className="text-xs leading-tight">{sk.name_es}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          base {sk.baseXp} XP
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.studentId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium sticky left-0 bg-background whitespace-nowrap">
                      {student.lastName}, {student.firstName}
                    </td>
                    {skills.map((sk) => {
                      const pct = getMultiplier(student.studentId, sk.skillId)
                      const xp = Math.round((sk.baseXp * pct) / 100)
                      return (
                        <td key={sk.skillId} className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustMultiplier(student.studentId, sk.skillId, -STEP_PCT)}
                              disabled={pct <= MIN_PCT || isSubmitting}
                              className="h-6 w-6 rounded text-sm font-bold hover:bg-muted disabled:opacity-30 leading-none"
                            >
                              −
                            </button>
                            <div className="flex flex-col items-center min-w-[52px]">
                              <span className="font-semibold tabular-nums">{xp} XP</span>
                              {pct !== 100 && (
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => adjustMultiplier(student.studentId, sk.skillId, STEP_PCT)}
                              disabled={pct >= MAX_PCT || isSubmitting}
                              className="h-6 w-6 rounded text-sm font-bold hover:bg-muted disabled:opacity-30 leading-none"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && skills.length === 0 && students.length > 0 && (
          <p className="text-sm text-muted-foreground py-4">
            Este proyecto no tiene habilidades definidas.
          </p>
        )}

        {/* Next project — hidden in edit mode */}
        {!isEditMode && (
          <div className="space-y-1.5 border-t pt-3">
            <label className="text-sm font-medium">Siguiente proyecto</label>
            {successors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay proyectos sucesores disponibles.</p>
            ) : (
              <select
                value={nextProjectId}
                onChange={(e) => setNextProjectId(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Sin proyecto siguiente</option>
                {successors.map((s) => (
                  <option key={s.projectId} value={s.projectId}>
                    {s.projectName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || loading}>
            {isSubmitting ? 'Guardando...' : 'Confirmar evaluación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
