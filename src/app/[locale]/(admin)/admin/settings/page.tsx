import { getTranslations } from 'next-intl/server'
import { requireSuperAdmin } from '@/lib/auth'
import { getSettings, getSchoolYears } from '@/lib/data/settings'
import { PlatformNameForm } from '@/components/admin/settings/PlatformNameForm'
import { SchoolYearsSection } from '@/components/admin/settings/SchoolYearsSection'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireSuperAdmin(locale)

  const [t, settings, schoolYears] = await Promise.all([
    getTranslations('settings'),
    getSettings(),
    getSchoolYears(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t('platformSection')}</h2>
          <p className="text-sm text-muted-foreground">{t('platformSectionDescription')}</p>
        </div>
        <PlatformNameForm platformName={settings.platform_name} />
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t('schoolYearsSection')}</h2>
          <p className="text-sm text-muted-foreground">{t('schoolYearsSectionDescription')}</p>
        </div>
        <SchoolYearsSection schoolYears={schoolYears} />
      </section>
    </div>
  )
}
