import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getAdminAbsencesPage, PAGE_LIMIT } from '@/lib/data/absences'
import { AbsencesAdminList } from '@/components/admin/absences/AbsencesAdminList'

export default async function AdminAbsencesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { locale } = await params
  const { page: pageParam = '0', status = 'pending' } = await searchParams

  await requireAdmin(locale)

  const page = parseInt(pageParam, 10)

  const [t, { items, total }] = await Promise.all([
    getTranslations('adminAbsences'),
    getAdminAbsencesPage(status, page, locale),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <AbsencesAdminList
        items={items}
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        status={status}
        locale={locale}
      />
    </div>
  )
}
