import { getTranslations } from 'next-intl/server'
import type { MyAbsence } from '@/lib/data/absences'
import type { AbsenceStatus } from '@/types'

const STATUS_STYLE: Record<AbsenceStatus, { background: string; color: string }> = {
  pending:  { background: 'rgba(251,176,59,0.12)', color: '#92650A' },
  approved: { background: 'rgba(62,111,168,0.10)',  color: '#2D4A6B' },
  rejected: { background: 'rgba(220,38,38,0.08)',   color: '#C0392B' },
}

interface AbsencesListProps {
  absences: MyAbsence[]
  locale: string
}

export async function AbsencesList({ absences, locale }: AbsencesListProps) {
  const t = await getTranslations('teacherAbsences')

  const STATUS_LABEL: Record<AbsenceStatus, string> = {
    pending:  t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  }

  if (absences.length === 0) {
    return <p style={{ fontSize: 13, color: '#8BA3BC' }}>{t('noAbsences')}</p>
  }

  return (
    <section style={{
      background: '#FAFCFF',
      borderRadius: 20,
      border: '1px solid rgba(62,111,168,0.10)',
      boxShadow: '0 1px 6px rgba(30,58,95,0.04)',
      overflow: 'hidden',
    }}>
      {absences.map((absence, idx) => (
        <div
          key={absence.id}
          style={{
            background: '#FEFCF8',
            padding: '16px 20px',
            borderBottom: idx < absences.length - 1 ? '1px solid rgba(62,111,168,0.07)' : 'none',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1C2E', margin: 0 }}>
              {absence.reasonName}
            </p>
            <p style={{ fontSize: 13, color: '#8BA3BC', margin: 0 }}>
              {new Date(`${absence.startDate}T12:00:00`).toLocaleDateString(locale, {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
              {absence.startDate !== absence.endDate && (
                <>
                  {' – '}
                  {new Date(`${absence.endDate}T12:00:00`).toLocaleDateString(locale, {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </>
              )}
            </p>
            {absence.comment && (
              <p style={{ fontSize: 12, color: '#8BA3BC', margin: 0 }}>{absence.comment}</p>
            )}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            whiteSpace: 'nowrap' as const, flexShrink: 0,
            ...STATUS_STYLE[absence.status],
          }}>
            {STATUS_LABEL[absence.status]}
          </span>
        </div>
      ))}
    </section>
  )
}
