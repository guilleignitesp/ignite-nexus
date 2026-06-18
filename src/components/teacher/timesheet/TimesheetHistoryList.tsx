import type { DayRecord } from '@/lib/data/timesheets'

interface TimesheetHistoryListProps {
  days: DayRecord[]
  locale: string
}

export function TimesheetHistoryList({ days, locale }: TimesheetHistoryListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {days.map((day) => (
        <div key={day.date} style={{
          background: '#FEFCF8',
          borderRadius: 16,
          border: '1px solid rgba(251,176,59,0.12)',
          boxShadow: '0 1px 4px rgba(30,58,95,0.04)',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#0F1C2E', margin: 0, textTransform: 'capitalize' as const }}>
              {new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, {
                weekday: 'long', month: 'short', day: 'numeric',
              })}
            </p>
            {day.totalMinutes > 0 && (
              <span style={{
                background: 'rgba(62,111,168,0.08)', color: '#2D4A6B',
                borderRadius: 20, padding: '2px 10px',
                fontSize: 11, fontWeight: 700,
              }}>
                {Math.floor(day.totalMinutes / 60)}h {day.totalMinutes % 60}min
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {day.entries.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: entry.type === 'in' ? '#4CAF7D' : '#8BA3BC',
                }} />
                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#4A6580' }}>
                  {new Date(entry.recordedAt).toLocaleTimeString(locale, {
                    hour: '2-digit', minute: '2-digit',
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
