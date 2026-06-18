'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { recordTimesheet } from '@/lib/actions/timesheets'
import type { TimesheetEntry } from '@/lib/data/timesheets'

interface TimesheetToggleProps {
  isIn: boolean
  todayEntries: TimesheetEntry[]
}

export function TimesheetToggle({ isIn, todayEntries }: TimesheetToggleProps) {
  const t = useTranslations('teacherTimesheet')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      try {
        await recordTimesheet(isIn ? 'out' : 'in')
        router.refresh()
      } catch {
        setError(t('error'))
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status card + clock button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        background: '#FEFCF8',
        borderRadius: 20,
        border: '1px solid rgba(251,176,59,0.12)',
        boxShadow: '0 1px 4px rgba(30,58,95,0.04)',
        padding: '20px 24px',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8BA3BC', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 4px' }}>
            {t('currentStatus')}
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, color: isIn ? '#2D7A4A' : '#8BA3BC', margin: 0 }}>
            {isIn ? t('statusIn') : t('statusOut')}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          style={{
            background: isIn ? 'rgba(220,38,38,0.08)' : 'rgba(62,111,168,0.10)',
            border: isIn ? '1.5px solid rgba(220,38,38,0.20)' : '1.5px solid rgba(62,111,168,0.22)',
            color: isIn ? '#C0392B' : '#2D4A6B',
            borderRadius: 14, padding: '12px 28px',
            fontSize: 15, fontWeight: 800,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {isPending ? t('clocking') : isIn ? t('clockOut') : t('clockIn')}
        </button>
      </div>

      {/* Today entries */}
      {todayEntries.length > 0 && (
        <div style={{
          background: '#FEFCF8',
          borderRadius: 16,
          border: '1px solid rgba(62,111,168,0.10)',
          padding: '16px 20px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1C2E', margin: '0 0 10px' }}>{t('todayTitle')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todayEntries.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: entry.type === 'in' ? '#FBB03B' : '#8BA3BC',
                }} />
                <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#2D4A6B' }}>
                  {new Date(entry.recordedAt).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span style={{ color: '#8BA3BC' }}>
                  {entry.type === 'in' ? t('entryIn') : t('entryOut')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>}
    </div>
  )
}
