import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getProjectMapsList } from '@/lib/data/project-maps'

export default async function TeacherProjectMapsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireWorker(locale)

  const [t, allMaps] = await Promise.all([
    getTranslations('teacherProjectMaps'),
    getProjectMapsList(),
  ])

  const maps = allMaps.filter((m) => m.is_active)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>

      {maps.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noMaps')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => (
            <li key={map.id}>
              <Link
                href={`/${locale}/teacher/project-maps/${map.id}`}
                className="block rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <p className="font-semibold leading-tight">{map.name}</p>
                {map.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {map.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('projects', { count: map.node_count })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
