import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getProjectMapDetail } from '@/lib/data/project-maps'
import { getProjectsList } from '@/lib/data/projects'
import { MapEditor } from '@/components/admin/project-maps/MapEditor'

export default async function ProjectMapEditorPage({
  params,
}: {
  params: Promise<{ locale: string; mapId: string }>
}) {
  const { locale, mapId } = await params
  await requireAdmin(locale)

  const [map, allProjects] = await Promise.all([
    getProjectMapDetail(mapId),
    getProjectsList(),
  ])

  if (!map) notFound()

  return <MapEditor map={map} allProjects={allProjects} locale={locale} />
}
