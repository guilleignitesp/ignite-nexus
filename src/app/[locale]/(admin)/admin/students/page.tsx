import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getStudentsPage, PAGE_LIMIT } from '@/lib/data/students'
import { StudentsList } from '@/components/admin/students/StudentsList'

export default async function StudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { locale } = await params
  const { page: pageParam = '0', search = '', status = '' } = await searchParams

  await requireAdmin(locale)

  const page = parseInt(pageParam, 10)

  const [t, { students, total }] = await Promise.all([
    getTranslations('students'),
    getStudentsPage(search, page, status),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <StudentsList
        students={students}
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        search={search}
        status={status}
        locale={locale}
      />
    </div>
  )
}
