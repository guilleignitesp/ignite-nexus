import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getTimesheetStatus } from '@/lib/data/timesheets'
import { TimesheetToggle } from '@/components/teacher/timesheet/TimesheetToggle'
import { TimesheetHistoryList } from '@/components/teacher/timesheet/TimesheetHistoryList'

export default async function TeacherTimesheetPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const profile = await requireWorker(locale)

  const [t, status] = await Promise.all([
    getTranslations('teacherTimesheet'),
    getTimesheetStatus(profile.workerId!),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
      </div>

      <TimesheetToggle isIn={status.isIn} todayEntries={status.todayEntries} />

      {status.recentDays.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('historyTitle')}</h2>
          <TimesheetHistoryList days={status.recentDays} locale={locale} />
        </div>
      )}
    </div>
  )
}
