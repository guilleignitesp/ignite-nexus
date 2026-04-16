import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getValidationList } from '@/lib/data/validation'
import { getProjectsList } from '@/lib/data/projects'
import { ValidationList } from '@/components/admin/validation/ValidationList'

export default async function ValidationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, items, allProjects] = await Promise.all([
    getTranslations('validation'),
    getValidationList(),
    getProjectsList(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <ValidationList items={items} allProjects={allProjects} />
    </div>
  )
}
