'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { getSessionAttendances } from '@/lib/actions/teacher-sessions'
import type { SessionHistoryItem, EnrolledStudent } from '@/lib/data/teacher'

interface AttendanceEntry {
  sessionId: string
  sessionDate: string
  present: string[]
  absent: string[]
}

interface AttendanceHistorySectionProps {
  sessions: SessionHistoryItem[]
  students: EnrolledStudent[]
  groupId: string
}

export function AttendanceHistorySection({
  sessions,
  students,
  groupId,
}: AttendanceHistorySectionProps) {
  const t = useTranslations('teacherGroup')
  const [data, setData] = useState<AttendanceEntry[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const completedSessions = sessions.filter((s) => s.status === 'completed')

  function handleLoad() {
    setError(null)
    startTransition(async () => {
      try {
        const targets = completedSessions.slice(0, 10)
        const results = await Promise.all(
          targets.map((s) => getSessionAttendances(s.sessionId, groupId))
        )

        const studentMap = new Map(
          students.map((s) => [s.studentId, `${s.lastName}, ${s.firstName}`])
        )

        const entries: AttendanceEntry[] = targets.map((session, i) => {
          const atts = results[i]
          const present = atts.filter((a) => a.attended).map(
            (a) => studentMap.get(a.studentId) ?? `${a.lastName}, ${a.firstName}`
          )
          const absent = atts.filter((a) => !a.attended).map(
            (a) => studentMap.get(a.studentId) ?? `${a.lastName}, ${a.firstName}`
          )
          return {
            sessionId: session.sessionId,
            sessionDate: session.sessionDate,
            present,
            absent,
          }
        })

        setData(entries)
      } catch {
        setError(t('saveError'))
      }
    })
  }

  if (completedSessions.length === 0) {
    return <p style={{ fontSize: 13, color: '#8BA3BC', padding: '4px 0' }}>{t('noAttendanceHistory')}</p>
  }

  if (data === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        {error && <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>}
        <button
          onClick={handleLoad}
          disabled={isPending}
          style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'rgba(62,111,168,0.08)', border: '1.5px solid rgba(62,111,168,0.18)',
            color: '#2D4A6B', cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = 'rgba(62,111,168,0.14)' }}
          onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = 'rgba(62,111,168,0.08)' }}
        >
          {isPending ? t('loading') : t('loadAttendances')}
        </button>
      </div>
    )
  }

  if (data.length === 0) {
    return <p style={{ fontSize: 13, color: '#8BA3BC', padding: '4px 0' }}>{t('noAttendanceHistory')}</p>
  }

  return (
    <section style={{
      background: '#FEFCF8',
      borderRadius: 20,
      border: '1px solid rgba(62,111,168,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {data.map((entry, idx) => (
          <div
            key={entry.sessionId}
            style={{
              padding: '16px 20px',
              borderBottom: idx < data.length - 1 ? '1px solid rgba(62,111,168,0.07)' : 'none',
            }}
          >
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1C2E' }}>
                {new Date(entry.sessionDate).toLocaleDateString()}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(62,111,168,0.08)', color: '#3E6FA8',
              }}>
                {t('attendedCount', {
                  attended: entry.present.length,
                  total: entry.present.length + entry.absent.length,
                })}
              </span>
            </div>

            {/* Absent */}
            {entry.absent.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8BA3BC', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                  {t('absentLabel')}
                </p>
                <p style={{ fontSize: 13, color: '#C0735A', fontWeight: 500 }}>
                  {entry.absent.join(', ')}
                </p>
              </div>
            )}

            {/* Present */}
            {entry.present.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8BA3BC', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                  {t('presentLabel')}
                </p>
                <p style={{ fontSize: 13, color: '#4A6580', fontWeight: 500 }}>
                  {entry.present.join(', ')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
