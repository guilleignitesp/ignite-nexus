import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getProjectMapsList } from '@/lib/data/project-maps'
import { MapsList } from '@/components/admin/project-maps/MapsList'

export default async function ProjectMapsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, maps] = await Promise.all([
    getTranslations('projectMaps'),
    getProjectMapsList(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <MapsList maps={maps} locale={locale} />
    </div>
  )
}
