import type { DayRecord } from '@/lib/data/timesheets'

interface TimesheetHistoryListProps {
  days: DayRecord[]
  locale: string
}

export function TimesheetHistoryList({ days, locale }: TimesheetHistoryListProps) {
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.date} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium capitalize">
              {new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {day.totalMinutes > 0 && (
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.floor(day.totalMinutes / 60)}h {day.totalMinutes % 60}min
              </span>
            )}
          </div>
          <div className="space-y-1">
            {day.entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={entry.type === 'in' ? 'text-green-600' : ''}>
                  {entry.type === 'in' ? '→' : '←'}
                </span>
                <span className="tabular-nums">
                  {new Date(entry.recordedAt).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
