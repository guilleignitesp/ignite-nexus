'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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
        // Carga asistencias de las últimas 10 sesiones completadas en paralelo
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
    return <p className="text-sm text-muted-foreground">{t('noAttendanceHistory')}</p>
  }

  if (data === null) {
    return (
      <div className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" size="sm" onClick={handleLoad} disabled={isPending}>
          {isPending ? t('loading') : t('loadAttendances')}
        </Button>
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noAttendanceHistory')}</p>
  }

  return (
    <div className="space-y-4">
      {data.map((entry) => (
        <div key={entry.sessionId} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {new Date(entry.sessionDate).toLocaleDateString()}
            </p>
            <span className="text-sm text-muted-foreground">
              {t('attendedCount', {
                attended: entry.present.length,
                total: entry.present.length + entry.absent.length,
              })}
            </span>
          </div>
          {entry.absent.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('absentLabel')}</p>
              <p className="text-sm text-destructive/80">
                {entry.absent.join(', ')}
              </p>
            </div>
          )}
          {entry.present.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('presentLabel')}</p>
              <p className="text-sm text-muted-foreground">
                {entry.present.join(', ')}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
