import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import {
  getSchoolsForDashboard,
  getWeekSessions,
  getActiveGroupAssignments,
  getMondayOf,
  addDays,
} from '@/lib/data/sessions-dashboard'
import { SessionsDashboard } from '@/components/admin/sessions-dashboard/SessionsDashboard'

export default async function SessionsDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ week?: string }>
}) {
  const { locale } = await params
  const { week } = await searchParams

  await requireAdmin(locale)

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = getMondayOf(week ?? today)
  const weekEnd = addDays(weekStart, 4)

  const [t, schools, sessions, assignments] = await Promise.all([
    getTranslations('sessionsDashboard'),
    getSchoolsForDashboard(),
    getWeekSessions(weekStart, weekEnd),
    getActiveGroupAssignments(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <SessionsDashboard
        schools={schools}
        sessions={sessions}
        assignments={assignments}
        weekStart={weekStart}
        today={today}
        locale={locale}
      />
    </div>
  )
}
