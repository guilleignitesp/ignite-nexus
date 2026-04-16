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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <RequestAbsenceDialog reasons={reasons} locale={locale} />
      </div>

      <AbsencesList absences={absences} locale={locale} />
    </div>
  )
}
