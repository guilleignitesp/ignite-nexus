'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import type { TeacherResource } from '@/lib/data/global-resources'

const TYPE_STYLE: Record<string, { background: string; color: string }> = {
  guide:        { background: 'rgba(62,111,168,0.08)', color: '#2D4A6B' },
  presentation: { background: 'rgba(124,58,237,0.08)', color: '#6D3AC7' },
}

interface ResourcesListProps {
  resources: TeacherResource[]
}

export function ResourcesList({ resources }: ResourcesListProps) {
  const t = useTranslations('teacherResources')

  if (resources.length === 0) {
    return <p style={{ fontSize: 13, color: '#8BA3BC' }}>{t('noResources')}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {resources.map((r) => (
        <a
          key={r.id}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#FEFCF8',
            border: '1px solid rgba(62,111,168,0.10)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none', color: '#0F1C2E',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(62,111,168,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FEFCF8' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            {r.resourceType && (
              <span style={{
                flexShrink: 0, borderRadius: 20, padding: '2px 10px',
                fontSize: 11, fontWeight: 700,
                ...(TYPE_STYLE[r.resourceType] ?? { background: 'rgba(62,111,168,0.06)', color: '#8BA3BC' }),
              }}>
                {r.resourceType === 'guide'
                  ? t('typeGuide')
                  : r.resourceType === 'presentation'
                    ? t('typePresentation')
                    : r.resourceType}
              </span>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {r.title}
            </span>
          </div>
          <ExternalLink style={{ width: 16, height: 16, flexShrink: 0, color: '#8BA3BC' }} />
        </a>
      ))}
    </div>
  )
}
