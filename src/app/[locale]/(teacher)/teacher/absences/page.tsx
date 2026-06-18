import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getMyAbsences, getAbsenceReasons } from '@/lib/data/absences'
import { AbsencesList } from '@/components/teacher/absences/AbsencesList'
import { RequestAbsenceDialog } from '@/components/teacher/absences/RequestAbsenceDialog'

export default async function TeacherAbsencesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const profile = await requireWorker(locale)

  const [t, absences, reasons] = await Promise.all([
    getTranslations('teacherAbsences'),
    getMyAbsences(profile.workerId!, locale),
    getAbsenceReasons(),
  ])

  return (
    <div style={{ minHeight: '100dvh', padding: 'clamp(24px,4vw,44px) clamp(20px,4vw,48px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <svg width="9" height="14" viewBox="7 2 16 31" fill="none">
                <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#8BA3BC' }}>
                Ignite Nexus · Área del profesor
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#0F1C2E', letterSpacing: '-0.5px', margin: 0 }}>
              {t('pageTitle')}
            </h1>
          </div>
          <RequestAbsenceDialog reasons={reasons} locale={locale} />
        </div>

        <AbsencesList absences={absences} locale={locale} />
      </div>
    </div>
  )
}
