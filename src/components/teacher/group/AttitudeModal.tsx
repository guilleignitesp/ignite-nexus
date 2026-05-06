'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getAttitudeActions, recordAttitudeAction } from '@/lib/actions/teacher-sessions'
import { cn } from '@/lib/utils'

interface AttitudeAction {
  id: string
  name_es: string
  xp_value: number
  description: string | null
}

interface ImpactData {
  studentName: string
  actionName: string
  xpAwarded: number
  previousTotalXp: number
  newTotalXp: number
}

interface AttitudeModalProps {
  open: boolean
  onClose: () => void
  students: { studentId: string; firstName: string; lastName: string }[]
  sessionId?: string
}

export function AttitudeModal({ open, onClose, students, sessionId }: AttitudeModalProps) {
  const [actions, setActions] = useState<AttitudeAction[]>([])
  const [loadingActions, setLoadingActions] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'impact'>('select')
  const [impactData, setImpactData] = useState<ImpactData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedStudentId(null)
    setSelectedActionId(null)
    setStep('select')
    setImpactData(null)
    setError(null)
    setLoadingActions(true)
    getAttitudeActions()
      .then(setActions)
      .catch(() => setError('Error cargando acciones de actitud'))
      .finally(() => setLoadingActions(false))
  }, [open])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleConfirm() {
    if (!selectedStudentId || !selectedActionId) return
    const student = students.find((s) => s.studentId === selectedStudentId)!
    const action = actions.find((a) => a.id === selectedActionId)!
    setError(null)
    startSubmit(async () => {
      try {
        const { previousTotalXp, newTotalXp } = await recordAttitudeAction({
          studentId: selectedStudentId,
          actionId: selectedActionId,
          xpAwarded: action.xp_value,
          sessionId,
        })
        setImpactData({
          studentName: `${student.firstName} ${student.lastName}`,
          actionName: action.name_es,
          xpAwarded: action.xp_value,
          previousTotalXp,
          newTotalXp,
        })
        setStep('impact')
        timerRef.current = setTimeout(() => {
          setStep('select')
          setSelectedStudentId(null)
          setSelectedActionId(null)
        }, 3000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al registrar la acción')
      }
    })
  }

  function dismissImpact() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStep('select')
    setSelectedStudentId(null)
    setSelectedActionId(null)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-full max-h-[85vh] flex flex-col gap-4">
        <DialogTitle>Actitud</DialogTitle>

        {step === 'select' && (
          <>
            {loadingActions ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 overflow-auto flex-1 min-h-0">
                {/* Students */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alumno</p>
                  <div className="grid grid-cols-2 gap-2">
                    {students.map((s) => (
                      <button
                        key={s.studentId}
                        type="button"
                        onClick={() => setSelectedStudentId(s.studentId === selectedStudentId ? null : s.studentId)}
                        disabled={isSubmitting}
                        className={cn(
                          'rounded-md border p-3 text-sm text-left transition-colors cursor-pointer',
                          selectedStudentId === s.studentId
                            ? 'border-primary bg-primary/5 font-medium'
                            : 'border-input hover:bg-muted/40'
                        )}
                      >
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Acción</p>
                  <div className="flex flex-col gap-2">
                    {actions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedActionId(a.id === selectedActionId ? null : a.id)}
                        disabled={isSubmitting}
                        className={cn(
                          'rounded-md border p-3 text-sm text-left transition-colors cursor-pointer flex items-center justify-between gap-2',
                          selectedActionId === a.id
                            ? a.xp_value >= 0
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                            : 'border-input hover:bg-muted/40'
                        )}
                      >
                        <div className="space-y-0.5">
                          <span className="font-medium">{a.name_es}</span>
                          {a.description && (
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                          )}
                        </div>
                        <span className={cn(
                          'text-sm font-bold shrink-0',
                          a.xp_value >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {a.xp_value >= 0 ? '+' : ''}{a.xp_value} XP
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cerrar</Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedStudentId || !selectedActionId || isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'impact' && impactData && (
          <>
            <div className="flex flex-col items-center justify-center flex-1 gap-5 py-6">
              <p className="text-2xl font-bold text-center">{impactData.studentName}</p>
              <p className="text-base text-muted-foreground text-center">{impactData.actionName}</p>
              <p className={cn(
                'text-6xl font-extrabold',
                impactData.xpAwarded >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {impactData.xpAwarded >= 0 ? '+' : ''}{impactData.xpAwarded} XP
              </p>
              <p className="text-sm text-muted-foreground">
                {impactData.previousTotalXp} → <span className="font-semibold text-foreground">{impactData.newTotalXp}</span> XP total
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={dismissImpact}>Siguiente</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
