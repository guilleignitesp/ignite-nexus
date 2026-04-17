import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getAdminTimesheetPage } from '@/lib/data/admin-timesheets'
import { getActiveWorkers } from '@/lib/data/schools'
import { AdminTimesheetList } from '@/components/admin/timesheet/AdminTimesheetList'

export default async function AdminTimesheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    workerId?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
}) {
  const { locale } = await params
  const {
    workerId = '',
    dateFrom = '',
    dateTo = '',
    page: pageParam = '0',
  } = await searchParams

  await requireAdmin(locale)

  const page = parseInt(pageParam, 10)

  const [t, workers, { items, total }] = await Promise.all([
    getTranslations('adminTimesheet'),
    getActiveWorkers(),
    getAdminTimesheetPage(workerId, dateFrom, dateTo, page),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <AdminTimesheetList
        items={items}
        total={total}
        page={page}
        workers={workers}
        workerId={workerId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        locale={locale}
      />
    </div>
  )
}
