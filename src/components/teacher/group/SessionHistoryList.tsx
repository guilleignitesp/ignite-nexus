'use client'

import { useState, useEffect, useTransition, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { saveSession, getSessionAttendances, getSessionEvaluation } from '@/lib/actions/teacher-sessions'
import type { SessionHistoryItem } from '@/lib/data/teacher'
import type { TrafficLight } from '@/types'
import { EvaluationModal } from './EvaluationModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAFFIC_COLOR: Record<string, string> = {
  green:  '#4CAF7D',
  yellow: '#FBB03B',
  orange: '#F59E0B',
  red:    '#E57373',
}

const TRAFFIC_OPTIONS: { value: TrafficLight; color: string }[] = [
  { value: 'green',  color: '#4CAF7D' },
  { value: 'yellow', color: '#FBB03B' },
  { value: 'orange', color: '#F59E0B' },
  { value: 'red',    color: '#E57373' },
]

// ─── Inline edit panel ────────────────────────────────────────────────────────

interface InlineEditPanelProps {
  session: SessionHistoryItem
  groupId: string
  onClose: () => void
  onSaved: () => void
}

function InlineEditPanel({ session, groupId, onClose, onSaved }: InlineEditPanelProps) {
  const t = useTranslations('teacherGroup')
  const [traffic, setTraffic] = useState<TrafficLight | null>(session.trafficLight)
  const [comment, setComment] = useState(session.teacherComment ?? '')
  const [attendances, setAttendances] = useState<{ studentId: string; firstName: string; lastName: string; attended: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()

  useEffect(() => {
    getSessionAttendances(session.sessionId, groupId)
      .then((data) => setAttendances(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
          trafficLight: traffic ?? undefined,
          teacherComment: comment.trim() || null,
          attendances,
        })
        onSaved()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <div style={{
      borderTop: '1px solid rgba(62,111,168,0.08)',
      background: 'rgba(240,246,255,0.5)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Semáforo */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#4A6580', marginBottom: 8 }}>{t('trafficLightLabel')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {TRAFFIC_OPTIONS.map(({ value, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTraffic(value)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: color,
                border: traffic === value ? `3px solid rgba(0,0,0,0.25)` : '2px solid transparent',
                outline: traffic === value ? `2px solid ${color}` : 'none',
                outlineOffset: 2,
                transform: traffic === value ? 'scale(1.15)' : 'scale(0.9)',
                opacity: traffic === null || traffic === value ? 1 : 0.55,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Comentario */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#4A6580', display: 'block', marginBottom: 6 }}>
          {t('commentLabel')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          disabled={isSaving}
          rows={2}
          style={{
            width: '100%', borderRadius: 10,
            border: '1px solid rgba(62,111,168,0.18)',
            background: '#fff',
            padding: '8px 12px', fontSize: 13,
            resize: 'none', outline: 'none',
            color: '#0F1C2E',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Asistencia */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#4A6580', marginBottom: 8 }}>{t('attendanceTitle')}</p>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 28, borderRadius: 8, background: 'rgba(62,111,168,0.06)', width: i === 2 ? '60%' : '100%' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 192, overflowY: 'auto' }}>
            {attendances.map((a) => (
              <label
                key={a.studentId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', borderRadius: 8,
                  padding: '5px 8px',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={a.attended}
                  onChange={() => toggleAttendance(a.studentId)}
                  disabled={isSaving}
                  style={{ width: 15, height: 15, accentColor: '#3E6FA8', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#2D4A6B' }}>
                  {a.lastName}, {a.firstName}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          style={{
            padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'rgba(62,111,168,0.10)', border: '1.5px solid rgba(62,111,168,0.22)',
            color: '#2D4A6B', cursor: isSaving || loading ? 'not-allowed' : 'pointer',
            opacity: isSaving || loading ? 0.5 : 1,
          }}
        >
          {isSaving ? t('saving') : t('save')}
        </button>
        <button
          onClick={onClose}
          disabled={isSaving}
          style={{
            padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'transparent', border: '1px solid rgba(62,111,168,0.15)',
            color: '#8BA3BC', cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {t('closeEdit')}
        </button>
      </div>
    </div>
  )
}

// ─── SessionHistoryList ───────────────────────────────────────────────────────

interface SessionHistoryListProps {
  sessions: SessionHistoryItem[]
  groupId: string
  planningId: string
}

type EvalState = {
  sessionId: string
  projectId: string
  existingEvals: { studentId: string; skills: { skillId: string; xpAwarded: number }[] }[]
}

export function SessionHistoryList({ sessions, groupId, planningId }: SessionHistoryListProps) {
  const t = useTranslations('teacherGroup')
  const tDash = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [evalState, setEvalState] = useState<EvalState | null>(null)
  const [evalLoadingId, setEvalLoadingId] = useState<string | null>(null)

  async function handleEditEval(session: SessionHistoryItem) {
    if (!session.projectId) return
    setEvalLoadingId(session.sessionId)
    try {
      const result = await getSessionEvaluation(session.sessionId, groupId)
      if (result.hasEvaluation) {
        setEvalState({
          sessionId: session.sessionId,
          projectId: result.projectId,
          existingEvals: result.existingEvals,
        })
      }
    } finally {
      setEvalLoadingId(null)
    }
  }

  const CLOSED_STATUSES = new Set(['completed', 'excused'])
  const closed = sessions.filter((s) => CLOSED_STATUSES.has(s.status))

  if (closed.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#8BA3BC', padding: '4px 0' }}>{t('noSessions')}</p>
    )
  }

  const statusLabel: Record<string, string> = {
    pending:   t('statusPending'),
    completed: t('statusCompleted'),
    excused:   t('statusExcused'),
  }

  function statusBadgeStyle(status: string): React.CSSProperties {
    switch (status) {
      case 'completed': return { background: 'rgba(62,111,168,0.10)', color: '#2D4A6B' }
      case 'excused':   return { background: 'rgba(251,176,59,0.10)', color: '#92650A' }
      default:          return { background: 'rgba(62,111,168,0.06)', color: '#8BA3BC' }
    }
  }

  return (
    <>
      <section style={{
        background: '#FAFCFF',
        borderRadius: 20,
        border: '1px solid rgba(62,111,168,0.10)',
        boxShadow: '0 1px 6px rgba(30,58,95,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(62,111,168,0.08)', textAlign: 'left' }}>
                {[t('colDate'), t('colProject'), t('colStatus'), t('colTraffic'), t('colComment'), ''].map((col, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', fontSize: 11, fontWeight: 700,
                    color: '#8BA3BC', textTransform: 'uppercase', letterSpacing: '0.5px',
                    display: i === 1 ? undefined : i === 4 ? undefined : undefined,
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closed.map((s) => (
                <Fragment key={s.sessionId}>
                  <tr style={{
                    borderBottom: '1px solid rgba(62,111,168,0.06)',
                    background: editingId === s.sessionId ? 'rgba(62,111,168,0.04)' : 'transparent',
                    borderLeft: s.hasEvaluation ? '3px solid #FBB03B' : '3px solid transparent',
                  }}>
                    <td style={{ padding: '12px 16px', color: '#2D4A6B', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {new Date(s.sessionDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8BA3BC' }}>
                      {s.projectName ?? '—'}
                      {s.hasEvaluation && (
                        <span style={{
                          fontSize: 10, marginLeft: 6, padding: '2px 6px', borderRadius: 20,
                          background: 'rgba(251,176,59,0.12)', color: '#92650A', fontWeight: 700,
                        }}>
                          ✓ Completado
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        ...statusBadgeStyle(s.status),
                      }}>
                        {statusLabel[s.status] ?? s.status}
                      </span>
                      {s.status === 'excused' && s.excusedReason && (
                        <div style={{ fontSize: 11, color: '#92650A', marginTop: 3 }}>
                          {tDash(`excusedReasons.${s.excusedReason}` as Parameters<typeof tDash>[0])}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.trafficLight ? (
                        <span style={{
                          display: 'inline-block',
                          width: 12, height: 12,
                          borderRadius: '50%',
                          background: TRAFFIC_COLOR[s.trafficLight] ?? '#ccc',
                        }} />
                      ) : (
                        <span style={{ color: '#C8D8E8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8BA3BC', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.teacherComment ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => setEditingId(editingId === s.sessionId ? null : s.sessionId)}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                            background: editingId === s.sessionId ? 'rgba(62,111,168,0.12)' : 'transparent',
                            border: '1px solid rgba(62,111,168,0.15)',
                            color: '#3E6FA8', whiteSpace: 'nowrap',
                          }}
                        >
                          {t('editSession')}
                        </button>
                        {s.status === 'completed' && s.hasEvaluation && (
                          <button
                            disabled={evalLoadingId === s.sessionId}
                            onClick={() => handleEditEval(s)}
                            style={{
                              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                              background: 'rgba(251,176,59,0.08)',
                              border: '1px solid rgba(251,176,59,0.22)',
                              color: '#92650A', whiteSpace: 'nowrap',
                              opacity: evalLoadingId === s.sessionId ? 0.5 : 1,
                            }}
                          >
                            {evalLoadingId === s.sessionId ? '...' : '⭐ Eval'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingId === s.sessionId && (
                    <tr style={{ borderBottom: '1px solid rgba(62,111,168,0.08)' }}>
                      <td colSpan={6}>
                        <InlineEditPanel
                          session={s}
                          groupId={groupId}
                          onClose={() => setEditingId(null)}
                          onSaved={() => {
                            setEditingId(null)
                            router.refresh()
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {evalState && (
        <EvaluationModal
          open={true}
          isEditMode={true}
          projectId={evalState.projectId}
          planningId={planningId}
          sessionId={evalState.sessionId}
          groupId={groupId}
          existingEvals={evalState.existingEvals}
          successors={[]}
          onClose={() => setEvalState(null)}
          onCompleted={() => {
            setEvalState(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
