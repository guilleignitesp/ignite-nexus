'use client'

import { useTranslations } from 'next-intl'
import type { EnrollmentEvent } from '@/lib/data/enrollments'

interface RecentActivityProps {
  enrollments: EnrollmentEvent[]
  leaves: EnrollmentEvent[]
}

function EventTable({ events, emptyKey, type }: { events: EnrollmentEvent[]; emptyKey: string; type: 'alta' | 'baja' }) {
  const t = useTranslations('enrollments')

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
  }

  return (
    <div className="flex-1 rounded-lg border overflow-hidden">
      <div className="border-b px-4 py-2 flex items-center gap-2">
        <span className={`inline-block size-2 rounded-full ${type === 'alta' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
        <h2 className="text-sm font-semibold">{t(type === 'alta' ? 'recentAltas' : 'recentBajas')}</h2>
      </div>
      {events.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">{t(emptyKey)}</p>
      ) : (
        <div className="divide-y">
          {events.map((e) => (
            <div key={e.id} className="px-4 py-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {e.student_last}, {e.student_first}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {e.group_name} · {e.school_name}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function RecentActivity({ enrollments, leaves }: RecentActivityProps) {
  const t = useTranslations('enrollments')
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">{t('recentActivity')}</h2>
      <div className="flex gap-4">
        <EventTable events={enrollments} emptyKey="noRecentAltas" type="alta" />
        <EventTable events={leaves} emptyKey="noRecentBajas" type="baja" />
      </div>
    </div>
  )
}
