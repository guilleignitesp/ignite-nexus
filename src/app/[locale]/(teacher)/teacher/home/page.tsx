import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getTeacherDashboard } from '@/lib/data/teacher'
import { GroupCard } from '@/components/teacher/home/GroupCard'
import { QuickAccessBar } from '@/components/teacher/home/QuickAccessBar'

export default async function TeacherHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const profile = await requireWorker(locale)

  const [t, dashboard] = await Promise.all([
    getTranslations('teacherHome'),
    getTeacherDashboard(profile.workerId!),
  ])

  // Saludo contextual según hora del día
  const hour = new Date().getHours()
  const greeting =
    hour < 13
      ? t('greetingMorning', { name: dashboard?.firstName ?? '' })
      : hour < 20
        ? t('greetingAfternoon', { name: dashboard?.firstName ?? '' })
        : t('greetingEvening', { name: dashboard?.firstName ?? '' })

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
      </div>

      {/* Acceso rápido */}
      <QuickAccessBar locale={locale} />

      {/* Mis grupos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('myGroups')}</h2>
        {!dashboard || dashboard.groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noGroups')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.groups.map((group) => (
              <GroupCard
                key={group.groupId}
                group={group}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
