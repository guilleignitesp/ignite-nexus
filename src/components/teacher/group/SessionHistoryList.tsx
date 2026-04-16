import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import type { SessionHistoryItem } from '@/lib/data/teacher'

const TRAFFIC_COLOR: Record<string, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
}

interface SessionHistoryListProps {
  sessions: SessionHistoryItem[]
}

export function SessionHistoryList({ sessions }: SessionHistoryListProps) {
  const t = useTranslations('teacherGroup')

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noSessions')}</p>
  }

  const statusLabel: Record<string, string> = {
    pending:   t('statusPending'),
    completed: t('statusCompleted'),
    suspended: t('statusSuspended'),
    holiday:   t('statusHoliday'),
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
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.sessionId} className="border-b last:border-0">
              <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                {new Date(s.sessionDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                {s.projectName ?? '—'}
              </td>
              <td className="px-4 py-3">
                <Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
