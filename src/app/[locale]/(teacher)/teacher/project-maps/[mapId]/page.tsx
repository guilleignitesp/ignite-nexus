import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getProjectMapDetail } from '@/lib/data/project-maps'
import { Button } from '@/components/ui/button'
import { ProjectMapReadOnly } from '@/components/teacher/group/ProjectMapReadOnly'

export default async function TeacherProjectMapDetailPage({
  params,
}: {
  params: Promise<{ locale: string; mapId: string }>
}) {
  const { locale, mapId } = await params
  await requireWorker(locale)

  const [t, map] = await Promise.all([
    getTranslations('teacherProjectMaps'),
    getProjectMapDetail(mapId),
  ])

  if (!map) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Button
          render={<Link href={`/${locale}/teacher/project-maps`} />}
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
        >
          {t('backToMaps')}
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{map.name}</h1>
        {map.description && (
          <p className="mt-1 text-sm text-muted-foreground">{map.description}</p>
        )}
      </div>

      <ProjectMapReadOnly
        nodes={map.nodes}
        edges={map.edges}
        currentProjectId={null}
        initialProjectId={map.initial_project_id}
      />
    </div>
  )
}
