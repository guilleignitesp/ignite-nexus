import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import {
  getEnrollmentStats,
  getRecentEnrollments,
  getRecentLeaves,
  getActiveGroups,
  ACTIVITY_LIMIT,
} from '@/lib/data/enrollments'
import { EnrollmentStats } from '@/components/admin/enrollments/EnrollmentStats'
import { RecentActivity } from '@/components/admin/enrollments/RecentActivity'
import { CSVUploadTool } from '@/components/admin/enrollments/CSVUploadTool'
import { BulkDeactivateTool } from '@/components/admin/enrollments/BulkDeactivateTool'

export default async function EnrollmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, stats, recentEnrollments, recentLeaves, activeGroups] = await Promise.all([
    getTranslations('enrollments'),
    getEnrollmentStats(),
    getRecentEnrollments(ACTIVITY_LIMIT),
    getRecentLeaves(ACTIVITY_LIMIT),
    getActiveGroups(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>

      <EnrollmentStats stats={stats} />

      <RecentActivity
        enrollments={recentEnrollments}
        leaves={recentLeaves}
      />

      <CSVUploadTool groups={activeGroups} />

      <BulkDeactivateTool groups={activeGroups} />
    </div>
  )
}
