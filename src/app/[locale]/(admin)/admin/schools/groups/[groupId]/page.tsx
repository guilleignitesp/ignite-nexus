import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getGroupAdminDetail } from '@/lib/data/schools'
import { GroupDetailClient } from '@/components/admin/schools/GroupDetailClient'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; groupId: string }>
}) {
  const { locale, groupId } = await params
  await requireAdmin(locale)

  const [t, group] = await Promise.all([
    getTranslations('groupDetail'),
    getGroupAdminDetail(groupId),
  ])

  if (!group) notFound()

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/schools`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {t('backToSchools')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{group.schoolName}</p>
      </div>

      <GroupDetailClient group={group} />
    </div>
  )
}
