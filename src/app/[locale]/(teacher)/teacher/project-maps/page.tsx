import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireWorker } from '@/lib/auth'
import { getProjectMapsList } from '@/lib/data/project-maps'

export default async function TeacherProjectMapsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireWorker(locale)

  const [t, allMaps] = await Promise.all([
    getTranslations('teacherProjectMaps'),
    getProjectMapsList(),
  ])

  const maps = allMaps.filter((m) => m.is_active)

  return (
    <div style={{ minHeight: '100dvh', padding: 'clamp(24px,4vw,44px) clamp(20px,4vw,48px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <svg width="9" height="14" viewBox="7 2 16 31" fill="none">
                <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#8BA3BC' }}>
                Ignite Nexus · Área del profesor
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#0F1C2E', letterSpacing: '-0.5px', margin: 0 }}>
              {t('pageTitle')}
            </h1>
            <p style={{ fontSize: 13, color: '#8BA3BC', marginTop: 6, marginBottom: 0 }}>{t('pageDescription')}</p>
          </div>
        </div>

        {maps.length === 0 ? (
          <p style={{ fontSize: 13, color: '#8BA3BC' }}>{t('noMaps')}</p>
        ) : (
          <ul style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', listStyle: 'none', padding: 0, margin: 0 }}>
            {maps.map((map) => (
              <li key={map.id}>
                <Link
                  href={`/${locale}/teacher/project-maps/${map.id}`}
                  style={{
                    display: 'block', padding: '18px 20px',
                    background: '#FEFCF8', borderRadius: 16,
                    border: '1px solid rgba(251,176,59,0.14)',
                    boxShadow: '0 1px 4px rgba(30,58,95,0.04)',
                    textDecoration: 'none', color: '#0F1C2E',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <svg width="8" height="12" viewBox="7 2 16 31" fill="none">
                      <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
                    </svg>
                    <p style={{ fontWeight: 800, fontSize: 15, color: '#0F1C2E', margin: 0 }}>{map.name}</p>
                  </div>
                  {map.description && (
                    <p style={{
                      fontSize: 13, color: '#8BA3BC', margin: '0 0 8px',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {map.description}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#8BA3BC', margin: 0 }}>
                    {t('projects', { count: map.node_count })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
