import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getBranchesWithSkills } from '@/lib/data/skills'
import { SkillsView } from '@/components/admin/skills/SkillsView'

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, branches] = await Promise.all([
    getTranslations('skills'),
    getBranchesWithSkills(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <SkillsView branches={branches} locale={locale} />
    </div>
  )
}
