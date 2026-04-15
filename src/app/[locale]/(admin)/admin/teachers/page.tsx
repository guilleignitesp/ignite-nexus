import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getWorkersPage, PAGE_LIMIT } from '@/lib/data/teachers'
import { TeachersList } from '@/components/admin/teachers/TeachersList'

export default async function TeachersPage({
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

  const [t, { workers, total }] = await Promise.all([
    getTranslations('teachers'),
    getWorkersPage(search, page),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>
      <TeachersList
        workers={workers}
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        search={search}
        locale={locale}
      />
    </div>
  )
}
