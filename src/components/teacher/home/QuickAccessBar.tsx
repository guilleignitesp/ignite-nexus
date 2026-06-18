'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function QuickAccessBar({ locale }: { locale: string }) {
  const t = useTranslations('teacherHome')
  const base = `/${locale}/teacher`

  const links = [
    {
      href: `${base}/timesheet`,
      label: t('goToTimesheet'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 3"/>
        </svg>
      ),
      color: '#3E6FA8', bg: 'rgba(62,111,168,0.08)',
    },
    {
      href: `${base}/absences`,
      label: t('goToAbsences'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>
        </svg>
      ),
      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',
    },
    {
      href: `${base}/resources`,
      label: t('goToResources'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      ),
      color: '#059669', bg: 'rgba(5,150,105,0.08)',
    },
    {
      href: `${base}/project-maps`,
      label: t('goToProjectMaps'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/>
          <line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
      ),
      color: '#D97706', bg: 'rgba(217,119,6,0.08)',
    },
    {
      href: `${base}/groups`,
      label: t('goToAllGroups'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: '#DC2626', bg: 'rgba(220,38,38,0.08)',
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
      {links.map(({ href, label, icon, color, bg }) => (
        <Link
          key={href}
          href={href}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: '0 2px 8px rgba(30,58,95,0.06)',
            textDecoration: 'none',
            transition: 'all 0.18s ease',
            color,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.transform = 'translateY(-2px)'
            el.style.background = bg
            el.style.boxShadow = '0 8px 24px rgba(30,58,95,0.11)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.transform = ''
            el.style.background = 'rgba(255,255,255,0.85)'
            el.style.boxShadow = '0 2px 8px rgba(30,58,95,0.06)'
          }}
        >
          <div style={{ color, flexShrink: 0 }}>{icon}</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5F', whiteSpace: 'nowrap' as const }}>
            {label}
          </span>
        </Link>
      ))}
    </div>
  )
}
