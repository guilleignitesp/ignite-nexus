import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { requireWorker } from '@/lib/auth'
import { getGroupDetail } from '@/lib/data/teacher'
import { Button } from '@/components/ui/button'
import { TodaySessionSection } from '@/components/teacher/group/TodaySessionSection'
import { SessionHistoryList } from '@/components/teacher/group/SessionHistoryList'
import { ProjectMapReadOnly } from '@/components/teacher/group/ProjectMapReadOnly'
import { AttendanceHistorySection } from '@/components/teacher/group/AttendanceHistorySection'

const WEEKDAY: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie',
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function TeacherGroupPage({
  params,
}: {
  params: Promise<{ locale: string; groupId: string }>
}) {
  const { locale, groupId } = await params
  const profile = await requireWorker(locale)

  const [t, detail] = await Promise.all([
    getTranslations('teacherGroup'),
    getGroupDetail(groupId, profile.workerId!),
  ])

  if (!detail) notFound()

  const sessionTitle = detail.closestSession
    ? t('sessionOfDate', {
        date: new Date(detail.closestSession.sessionDate + 'T12:00:00').toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
      })
    : t('todaySessionTitle')

  const scheduleText = detail.schedule.length > 0
    ? detail.schedule
        .map((s) => `${WEEKDAY[s.weekday] ?? s.weekday} ${formatTime(s.startTime)}–${formatTime(s.endTime)}`)
        .join(', ')
    : t('noSchedule')

  return (
    <div className="space-y-8">
      {/* Cabecera grupo */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Button
            render={<Link href={`/${locale}/teacher/home`} />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
          >
            {t('backToHome')}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{detail.groupName}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {detail.schoolName}
            {detail.schedule.length > 0 && (
              <span className="ml-2">· {scheduleText}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('students', { count: detail.students.length })}
          </p>
        </div>
      </div>

      {/* Sección 1: Sesión de hoy */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{sessionTitle}</h2>
        {!detail.planning ? (
          <p className="text-sm text-muted-foreground">{t('noPlanning')}</p>
        ) : (
          <TodaySessionSection
            groupId={detail.groupId}
            planningId={detail.planning.planningId}
            currentProjectId={detail.planning.currentProjectId}
            currentProjectName={detail.planning.currentProjectName}
            todaySlot={detail.todaySlot}
            isClassToday={detail.isClassToday}
            students={detail.students}
            session={detail.closestSession}
            sessionDate={detail.closestSession?.sessionDate ?? null}
            nextSessionDate={detail.closestSession?.sessionDate ?? null}
            successors={detail.planning.successors}
            groupSchedule={detail.schedule}
          />
        )}
      </section>

      {/* Sección 2: Historial de sesiones */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('sessionHistoryTitle')}</h2>
        <SessionHistoryList
          sessions={detail.recentSessions}
          students={detail.students}
          groupId={detail.groupId}
        />
      </section>

      {/* Sección 3: Mapa de proyectos */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('projectMapTitle')}</h2>
        {!detail.planning?.mapId ? (
          <p className="text-sm text-muted-foreground">{t('noMap')}</p>
        ) : (
          <ProjectMapReadOnly
            nodes={detail.planning.mapNodes}
            edges={detail.planning.mapEdges}
            currentProjectId={detail.planning.currentProjectId}
            initialProjectId={detail.planning.mapInitialProjectId}
          />
        )}
      </section>

      {/* Sección 4: Historial de asistencias */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('attendanceHistoryTitle')}</h2>
        <AttendanceHistorySection
          sessions={detail.recentSessions}
          students={detail.students}
          groupId={detail.groupId}
        />
      </section>
    </div>
  )
}
