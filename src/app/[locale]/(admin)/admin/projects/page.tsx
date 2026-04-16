import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getProjectsList } from '@/lib/data/projects'
import { getBranchesWithSkills } from '@/lib/data/skills'
import { ProjectsList } from '@/components/admin/projects/ProjectsList'

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, projects, branches] = await Promise.all([
    getTranslations('projects'),
    getProjectsList(),
    getBranchesWithSkills(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <ProjectsList projects={projects} branches={branches} locale={locale} />
    </div>
  )
}
