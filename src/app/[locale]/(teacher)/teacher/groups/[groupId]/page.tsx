import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { requireWorker } from '@/lib/auth'
import { getGroupDetailForAnyWorker } from '@/lib/data/teacher'
import { TodaySessionSection } from '@/components/teacher/group/TodaySessionSection'
import { SessionHistoryList } from '@/components/teacher/group/SessionHistoryList'
import { ProjectMapReadOnly } from '@/components/teacher/group/ProjectMapReadOnly'
import { AttendanceHistorySection } from '@/components/teacher/group/AttendanceHistorySection'
import { AttitudeButton } from '@/components/teacher/group/AttitudeButton'

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
    getGroupDetailForAnyWorker(groupId, profile.workerId!),
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

  const scheduleChips = detail.schedule.map(
    (s: { weekday: number; startTime: string; endTime: string }) =>
      `${WEEKDAY[s.weekday] ?? s.weekday} ${formatTime(s.startTime)}–${formatTime(s.endTime)}`
  )

  return (
    <div style={{ minHeight: '100dvh', padding: 'clamp(24px,4vw,44px) clamp(20px,4vw,48px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Header card ── */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBF2 0%, #F0F6FF 100%)',
          borderRadius: 22,
          border: '1px solid rgba(251,176,59,0.14)',
          boxShadow: '0 2px 12px rgba(30,58,95,0.05)',
          padding: 'clamp(20px,3vw,32px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Back link */}
            <Link href={`/${locale}/teacher/home`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, color: '#8BA3BC',
              textDecoration: 'none', marginBottom: 12,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(62,111,168,0.07)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 6l-6 6 6 6"/>
              </svg>
              {t('backToHome')}
            </Link>

            {/* Group name */}
            <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#0F1C2E', letterSpacing: '-0.5px', lineHeight: 1.1, margin: '0 0 8px' }}>
              {detail.groupName}
            </h1>

            {/* School + schedule chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8BA3BC', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
                {detail.schoolName}
              </span>
              {scheduleChips.map((chip, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 600, color: '#4A6580',
                  background: 'rgba(62,111,168,0.08)', borderRadius: 20,
                  padding: '3px 10px',
                }}>
                  {chip}
                </span>
              ))}
            </div>

            <p style={{ fontSize: 12, color: '#8BA3BC', marginTop: 6, fontWeight: 500 }}>
              {t('students', { count: detail.students.length })}
            </p>
          </div>

          {/* AttitudeButton — already styled */}
          <div style={{ flexShrink: 0 }}>
            <AttitudeButton
              students={detail.students}
              sessionId={detail.closestSession?.sessionId}
            />
          </div>
        </div>

        {/* ── Sesión ── */}
        <div>
          <SectionLabel label={sessionTitle} />
          {!detail.planning ? (
            <p style={{ fontSize: 13, color: '#8BA3BC', padding: '4px 0' }}>{t('noPlanning')}</p>
          ) : (
            <TodaySessionSection
              groupId={detail.groupId}
              planningId={detail.planning.planningId}
              currentProjectId={detail.closestSession?.projectId ?? detail.planning.currentProjectId}
              currentProjectName={detail.closestSession?.projectName ?? detail.planning.currentProjectName}
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
        </div>

        {/* ── Historial de sesiones ── */}
        <div>
          <SectionLabel label={t('sessionHistoryTitle')} />
          <SessionHistoryList
            sessions={detail.recentSessions}
            groupId={detail.groupId}
            planningId={detail.planning?.planningId ?? ''}
          />
        </div>

        {/* ── Mapa de proyectos ── */}
        <div>
          <SectionLabel label={t('projectMapTitle')} />
          {!detail.planning?.mapId ? (
            <p style={{ fontSize: 13, color: '#8BA3BC', padding: '4px 0' }}>{t('noMap')}</p>
          ) : (
            <ProjectMapReadOnly
              nodes={detail.planning.mapNodes}
              edges={detail.planning.mapEdges}
              currentProjectId={detail.planning.currentProjectId}
              initialProjectId={detail.planning.mapInitialProjectId}
            />
          )}
        </div>

        {/* ── Historial de asistencias ── */}
        <div>
          <SectionLabel label={t('attendanceHistoryTitle')} />
          <AttendanceHistorySection
            sessions={detail.recentSessions}
            students={detail.students}
            groupId={detail.groupId}
          />
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F1C2E', whiteSpace: 'nowrap' as const }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(62,111,168,0.08)' }} />
    </div>
  )
}
