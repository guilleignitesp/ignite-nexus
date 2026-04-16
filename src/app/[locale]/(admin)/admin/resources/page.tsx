import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import {
  getAdminResourcesPage,
  getSchoolsForSelect,
  getGroupsForSelect,
  PAGE_LIMIT,
} from '@/lib/data/global-resources'
import { ResourcesAdminList } from '@/components/admin/resources/ResourcesAdminList'

export default async function AdminResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { locale } = await params
  const { page: pageParam = '0', search = '' } = await searchParams

  await requireAdmin(locale)

  const page = parseInt(pageParam, 10)

  const [t, { items, total }, schools, groups] = await Promise.all([
    getTranslations('adminResources'),
    getAdminResourcesPage(search, page),
    getSchoolsForSelect(),
    getGroupsForSelect(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <ResourcesAdminList
        items={items}
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        search={search}
        schools={schools}
        groups={groups}
      />
    </div>
  )
}
