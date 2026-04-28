'use client'

import { useState, useEffect, useTransition, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { saveSession, getSessionAttendances } from '@/lib/actions/teacher-sessions'
import type { SessionHistoryItem, EnrolledStudent } from '@/lib/data/teacher'
import type { TrafficLight } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAFFIC_COLOR: Record<string, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
}

const TRAFFIC_OPTIONS: { value: TrafficLight; colorClass: string; hoverClass: string }[] = [
  { value: 'green',  colorClass: 'bg-green-500',  hoverClass: 'hover:bg-green-600' },
  { value: 'yellow', colorClass: 'bg-yellow-400', hoverClass: 'hover:bg-yellow-500' },
  { value: 'orange', colorClass: 'bg-orange-500', hoverClass: 'hover:bg-orange-600' },
  { value: 'red',    colorClass: 'bg-red-500',    hoverClass: 'hover:bg-red-600' },
]

// ─── Inline edit panel ────────────────────────────────────────────────────────

interface InlineEditPanelProps {
  session: SessionHistoryItem
  students: EnrolledStudent[]
  groupId: string
  onClose: () => void
  onSaved: () => void
}

function InlineEditPanel({ session, students, groupId, onClose, onSaved }: InlineEditPanelProps) {
  const t = useTranslations('teacherGroup')
  const [traffic, setTraffic] = useState<TrafficLight | null>(session.trafficLight)
  const [comment, setComment] = useState(session.teacherComment ?? '')
  const [attendances, setAttendances] = useState<{ studentId: string; attended: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()

  useEffect(() => {
    getSessionAttendances(session.sessionId, groupId)
      .then((data) => {
        const map = new Map(data.map((a) => [a.studentId, a.attended]))
        setAttendances(
          students.map((s) => ({
            studentId: s.studentId,
            attended: map.get(s.studentId) ?? true,
          }))
        )
      })
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
    <div className="border-t bg-muted/20 p-4 space-y-4">
      {/* Semáforo */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('trafficLightLabel')}</p>
        <div className="flex gap-2">
          {TRAFFIC_OPTIONS.map(({ value, colorClass, hoverClass }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTraffic(value)}
              className={cn(
                'h-8 w-8 rounded-full transition-all',
                colorClass,
                hoverClass,
                traffic === value
                  ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                  : 'opacity-60'
              )}
            />
          ))}
        </div>
      </div>

      {/* Comentario */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('commentLabel')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          disabled={isSaving}
          rows={2}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Asistencia */}
      <div>
        <p className="mb-2 text-sm font-medium">{t('attendanceTitle')}</p>
        {loading ? (
          <div className="space-y-1">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-3/4" />
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {attendances.map((a) => {
              const stu = students.find((s) => s.studentId === a.studentId)
              if (!stu) return null
              return (
                <label
                  key={a.studentId}
                  className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-1 hover:bg-muted/40 select-none"
                >
                  <input
                    type="checkbox"
                    checked={a.attended}
                    onChange={() => toggleAttendance(a.studentId)}
                    disabled={isSaving}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">
                    {stu.lastName}, {stu.firstName}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving || loading}>
          {isSaving ? t('saving') : t('save')}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} disabled={isSaving}>
          {t('closeEdit')}
        </Button>
      </div>
    </div>
  )
}

// ─── SessionHistoryList ───────────────────────────────────────────────────────

interface SessionHistoryListProps {
  sessions: SessionHistoryItem[]
  students: EnrolledStudent[]
  groupId: string
}

export function SessionHistoryList({ sessions, students, groupId }: SessionHistoryListProps) {
  const t = useTranslations('teacherGroup')
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)

  const CLOSED_STATUSES = new Set(['completed', 'unknown', 'excused'])
  const closed = sessions.filter((s) => CLOSED_STATUSES.has(s.status))

  if (closed.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noSessions')}</p>
  }

  const statusLabel: Record<string, string> = {
    pending:   t('statusPending'),
    completed: t('statusCompleted'),
    suspended: t('statusSuspended'),
    holiday:   t('statusHoliday'),
    unknown:   t('statusUnknown'),
    excused:   t('statusExcused'),
  }

  function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'completed': return 'default'
      case 'unknown':   return 'secondary'
      case 'excused':   return 'outline'
      default:          return 'secondary'
    }
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">{t('colDate')}</th>
            <th className="px-4 py-3 font-medium hidden sm:table-cell">{t('colProject')}</th>
            <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
            <th className="px-4 py-3 font-medium">{t('colTraffic')}</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">{t('colComment')}</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {closed.map((s) => (
            <Fragment key={s.sessionId}>
              <tr className={cn('border-b', editingId === s.sessionId && 'bg-muted/20')}>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {new Date(s.sessionDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {s.projectName ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={statusBadgeVariant(s.status)}
                    className={s.status === 'excused' ? 'border-orange-400 text-orange-600 dark:text-orange-400' : undefined}
                  >
                    {statusLabel[s.status] ?? s.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {s.trafficLight ? (
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${TRAFFIC_COLOR[s.trafficLight]}`}
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-xs truncate">
                  {s.teacherComment ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="xs"
                    variant={editingId === s.sessionId ? 'secondary' : 'ghost'}
                    onClick={() =>
                      setEditingId(editingId === s.sessionId ? null : s.sessionId)
                    }
                  >
                    {t('editSession')}
                  </Button>
                </td>
              </tr>
              {editingId === s.sessionId && (
                <tr className="border-b">
                  <td colSpan={6}>
                    <InlineEditPanel
                      session={s}
                      students={students}
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
  )
}
