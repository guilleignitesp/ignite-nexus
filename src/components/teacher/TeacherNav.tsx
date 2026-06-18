'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

function LogoFull() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <svg viewBox="0 0 48 48" height="32" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
        <g transform="translate(24,24)">
          <path d="M-16-16 L-10-16 M-16-16 L-16-10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
          <path d="M16 16 L10 16 M16 16 L16 10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
          <path d="M-16 16 L-10 16 M-16 16 L-16 10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
          <path d="M16-16 L10-16 M16-16 L16-10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
        </g>
        <g transform="translate(24.4,22.3) scale(.85)">
          <path d="M-3.2-15 L3.2-14 L6.4 4.6 L.8 4.6 L-.8 18.4 L-7.2-2.3 L-1.6-2.3Z" fill="#FBB03B" stroke="#FBB03B" strokeWidth="1.5" strokeLinejoin="round"/>
        </g>
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
        <span style={{
          fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 20,
          letterSpacing: '-0.5px',
          color: '#3E6FA8',
        }}>IGNITE</span>
        <span style={{
          fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif',
          fontWeight: 500,
          fontSize: 20,
          letterSpacing: '-0.5px',
          color: '#2596BE',
          fontStyle: 'italic',
          marginLeft: 1,
        }}>NEXUS</span>
      </div>
    </div>
  )
}

const NAV_ITEMS = (base: string, t: ReturnType<typeof useTranslations>) => [
  {
    href: `${base}/home`,
    label: t('home'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: `${base}/timesheet`,
    label: t('timesheet'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 3"/>
      </svg>
    ),
  },
  {
    href: `${base}/absences`,
    label: t('absences'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>
      </svg>
    ),
  },
  {
    href: `${base}/resources`,
    label: t('resources'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
  },
  {
    href: `${base}/project-maps`,
    label: t('projectMaps'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
  },
]

export function TeacherNav({ locale, hasAdminAccess }: { locale: string; hasAdminAccess: boolean }) {
  const pathname = usePathname()
  const t = useTranslations('teacher')
  const tRoles = useTranslations('roles')
  const base = `/${locale}/teacher`

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(62,111,168,0.10)',
      boxShadow: '0 1px 0 rgba(62,111,168,0.08), 0 2px 16px rgba(30,45,61,0.05)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        height: 62,
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(16px, 3vw, 32px)',
        gap: 0,
      }}>

        {/* LEFT — Logo */}
        <Link href={`${base}/home`} style={{ textDecoration: 'none', flexShrink: 0, marginRight: 32 }}>
          <LogoFull />
        </Link>

        {/* CENTER — Nav links as pills */}
        <nav style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          {NAV_ITEMS(base, t).map(({ href, label, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 13px',
                  borderRadius: 22,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2D4A6B' : '#6B8BA4',
                  background: isActive ? 'rgba(62,111,168,0.10)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.18s ease',
                  boxShadow: 'none',
                  position: 'relative' as const,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(62,111,168,0.07)'
                  e.currentTarget.style.color = '#2D4A6B'
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#6B8BA4'
                  } else {
                    e.currentTarget.style.background = 'rgba(62,111,168,0.10)'
                    e.currentTarget.style.color = '#2D4A6B'
                  }
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 16,
                    height: 2,
                    borderRadius: 2,
                    background: '#FBB03B',
                  }} />
                )}
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* RIGHT — Teacher badge + admin switch + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>

          {/* Teacher role pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'rgba(251,176,59,0.08)',
            border: '1px solid rgba(251,176,59,0.20)',
          }}>
            <svg width="10" height="16" viewBox="7 2 16 31" fill="none">
              <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B" fillOpacity="0.8"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#A07820', letterSpacing: '0.5px' }}>
              Profesor
            </span>
          </div>

          {/* Admin switch */}
          {hasAdminAccess && (
            <Link href={`/${locale}/admin/dashboard`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: '#3E6FA8',
              background: 'rgba(62,111,168,0.08)',
              border: '1px solid rgba(62,111,168,0.18)',
              textDecoration: 'none',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span className="hidden md:inline">{tRoles('switchToAdmin')}</span>
            </Link>
          )}

          {/* Logout */}
          <Link href={`/${locale}/login`} style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'rgba(62,111,168,0.06)',
            border: '1px solid rgba(62,111,168,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B8BA4',
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}
