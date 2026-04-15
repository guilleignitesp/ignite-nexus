import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getSchoolsWithGroups, getActiveWorkers } from '@/lib/data/schools'
import { getSchoolYears } from '@/lib/data/settings'
import { SchoolsList } from '@/components/admin/schools/SchoolsList'

export default async function SchoolsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, schools, workers, schoolYears] = await Promise.all([
    getTranslations('schools'),
    getSchoolsWithGroups(),
    getActiveWorkers(),
    getSchoolYears(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <SchoolsList
        schools={schools}
        schoolYears={schoolYears}
        workers={workers}
        locale={locale}
      />
    </div>
  )
}
