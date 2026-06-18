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

  const hour = new Date().getHours()
  const greeting =
    hour < 13
      ? t('greetingMorning', { name: dashboard?.firstName ?? '' })
      : hour < 20
        ? t('greetingAfternoon', { name: dashboard?.firstName ?? '' })
        : t('greetingEvening', { name: dashboard?.firstName ?? '' })

  return (
    <div style={{ minHeight: '100dvh', padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px)', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── HERO ── */}
      <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="10" height="16" viewBox="7 2 16 31" fill="none">
              <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase' as const, color: '#6B8BA4' }}>
              Área del profesor
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 900, color: '#0F1C2E', lineHeight: 1.08, letterSpacing: '-0.8px', margin: 0 }}>
            {greeting}
          </h1>
        </div>

        {/* Stats — soft pill style */}
        {dashboard && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { label: 'grupos', value: dashboard.groups.length },
              { label: 'alumnos', value: dashboard.groups.reduce((a, g) => a + g.activeStudentCount, 0) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'baseline', gap: 5,
                padding: '8px 16px',
                borderRadius: 30,
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(62,111,168,0.10)',
                boxShadow: '0 1px 4px rgba(30,58,95,0.05)',
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#1E3A5F' }}>{value}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8BA3BC', textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK ACCESS ── */}
      <QuickAccessBar locale={locale} />

      {/* ── GROUPS ── */}
      <div style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E', margin: 0 }}>
            {t('myGroups')}
          </h2>
          <div style={{ flex: 1, height: 1, background: 'rgba(62,111,168,0.10)' }} />
          {dashboard && dashboard.groups.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B8BA4' }}>
              {dashboard.groups.length} {dashboard.groups.length === 1 ? 'grupo' : 'grupos'}
            </span>
          )}
        </div>

        {!dashboard || dashboard.groups.length === 0 ? (
          <div style={{
            padding: '56px 32px', textAlign: 'center' as const,
            background: 'rgba(255,255,255,0.6)', borderRadius: 20,
            border: '2px dashed rgba(62,111,168,0.15)',
            color: '#6B8BA4', fontSize: 15, fontWeight: 500,
          }}>
            {t('noGroups')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {dashboard.groups.map((group) => (
              <GroupCard key={group.groupId} group={group} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
