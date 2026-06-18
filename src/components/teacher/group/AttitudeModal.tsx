'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAttitudeActions, recordAttitudeAction } from '@/lib/actions/teacher-sessions'

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

  const isPositive = (impactData?.xpAwarded ?? 0) >= 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <style>{`
        @keyframes shrink3s { from { width: 100% } to { width: 0% } }
      `}</style>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl w-full max-h-[85vh] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">Registrar actitud</DialogTitle>

        {/* ── Step 1: Select ─────────────────────────────────────────────── */}
        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3E6FA8 0%, #2596BE 100%)',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}>
              <svg width="14" height="22" viewBox="7 2 16 31" fill="none">
                <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
              </svg>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                  Ignite Nexus
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  Registrar actitud
                </div>
              </div>
            </div>

            {/* Body */}
            {loadingActions ? (
              <div style={{ padding: '48px 28px', textAlign: 'center', color: '#7A92A8', fontSize: 14 }}>
                Cargando...
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
                flex: 1,
                overflow: 'hidden',
              }}>
                {/* Left — Students */}
                <div style={{
                  padding: '20px 24px',
                  borderRight: '1px solid rgba(62,111,168,0.12)',
                  overflowY: 'auto',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#7A92A8', marginBottom: 14 }}>
                    Alumno
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {students.map((s) => {
                      const isSelected = selectedStudentId === s.studentId
                      return (
                        <button
                          key={s.studentId}
                          type="button"
                          onClick={() => setSelectedStudentId(isSelected ? null : s.studentId)}
                          disabled={isSubmitting}
                          style={{
                            borderRadius: 10,
                            padding: '10px 14px',
                            border: '1px solid rgba(62,111,168,0.15)',
                            fontSize: 14,
                            fontWeight: isSelected ? 700 : 400,
                            textAlign: 'left' as const,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: isSelected
                              ? 'linear-gradient(135deg, #3E6FA8, #2596BE)'
                              : 'rgba(62,111,168,0.07)',
                            color: isSelected ? '#fff' : '#1E2D3D',
                          }}
                        >
                          {s.firstName} {s.lastName}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Right — Actions */}
                <div style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  background: 'rgba(240,245,251,0.5)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#7A92A8', marginBottom: 14 }}>
                    Acción
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {actions.map((a) => {
                      const isSelected = selectedActionId === a.id
                      const positive = a.xp_value >= 0
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedActionId(isSelected ? null : a.id)}
                          disabled={isSubmitting}
                          style={{
                            borderRadius: 10,
                            padding: '12px 16px',
                            marginBottom: 8,
                            border: isSelected ? '1.5px solid #3E6FA8' : '1px solid rgba(62,111,168,0.15)',
                            background: isSelected ? 'rgba(62,111,168,0.12)' : 'rgba(255,255,255,0.8)',
                            textAlign: 'left' as const,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1E2D3D' }}>{a.name_es}</div>
                            {a.description && (
                              <div style={{ fontSize: 12, color: '#7A92A8', marginTop: 2 }}>{a.description}</div>
                            )}
                          </div>
                          <span style={{
                            background: positive ? '#dcfce7' : '#fee2e2',
                            color: positive ? '#16a34a' : '#dc2626',
                            borderRadius: 20,
                            padding: '2px 10px',
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}>
                            {positive ? '+' : ''}{a.xp_value} XP
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '0 24px', color: '#dc2626', fontSize: 13 }}>{error}</div>
            )}

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(62,111,168,0.10)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              background: '#fff',
              flexShrink: 0,
            }}>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(62,111,168,0.25)',
                  background: 'transparent',
                  color: '#3E5068',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedStudentId || !selectedActionId || isSubmitting}
                style={{
                  padding: '8px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FBB03B 0%, #F59E0B 100%)',
                  color: '#1E2D3D',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: (!selectedStudentId || !selectedActionId || isSubmitting) ? 0.4 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Impact splash ───────────────────────────────────────── */}
        {step === 'impact' && impactData && (
          <div style={{
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px',
            background: isPositive
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Large decorative bolt */}
            <svg style={{ position: 'absolute', opacity: 0.06, width: 300, height: 300 }} viewBox="7 2 16 31">
              <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z"
                fill={isPositive ? '#16a34a' : '#dc2626'}/>
            </svg>

            {/* XP value */}
            <div style={{
              fontSize: 'clamp(80px, 18vw, 140px)',
              fontWeight: 900,
              lineHeight: 1,
              color: isPositive ? '#16a34a' : '#dc2626',
              fontVariantNumeric: 'tabular-nums',
              position: 'relative',
              zIndex: 1,
            }}>
              {isPositive ? '+' : ''}{impactData.xpAwarded}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: isPositive ? '#15803d' : '#b91c1c', marginTop: 8, position: 'relative', zIndex: 1 }}>
              XP
            </div>

            {/* Student name */}
            <div style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: '#1E2D3D', marginTop: 24, position: 'relative', zIndex: 1 }}>
              {impactData.studentName}
            </div>

            {/* Action name */}
            <div style={{ fontSize: 16, color: '#3E5068', marginTop: 8, maxWidth: 400, position: 'relative', zIndex: 1 }}>
              {impactData.actionName}
            </div>

            {/* XP total */}
            <div style={{ marginTop: 24, fontSize: 14, color: '#7A92A8', position: 'relative', zIndex: 1 }}>
              {impactData.previousTotalXp} → <strong style={{ color: '#1E2D3D' }}>{impactData.newTotalXp} XP</strong>
            </div>

            {/* Auto-dismiss progress bar */}
            <div style={{ marginTop: 32, width: '100%', maxWidth: 200, height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, position: 'relative', zIndex: 1 }}>
              <div style={{
                height: '100%',
                background: isPositive ? '#16a34a' : '#dc2626',
                borderRadius: 2,
                animation: 'shrink3s 3s linear forwards',
              }} />
            </div>

            {/* Next button */}
            <button
              onClick={dismissImpact}
              style={{
                marginTop: 20,
                padding: '8px 22px',
                borderRadius: 10,
                border: `1px solid ${isPositive ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
                background: 'transparent',
                color: isPositive ? '#15803d' : '#b91c1c',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
