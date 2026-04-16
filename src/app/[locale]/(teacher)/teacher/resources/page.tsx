import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getTeacherResources } from '@/lib/data/global-resources'
import { ResourcesList } from '@/components/teacher/resources/ResourcesList'

export default async function TeacherResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireWorker(locale)

  const [t, resources] = await Promise.all([
    getTranslations('teacherResources'),
    getTeacherResources(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <ResourcesList resources={resources} />
    </div>
  )
}
