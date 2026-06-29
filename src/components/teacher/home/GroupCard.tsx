'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { TeacherGroupCard } from '@/lib/data/teacher'

const WEEKDAY_SHORT: Record<number, string> = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V' }

function formatTime(t: string) {
  return t.slice(0, 5)
}

export function GroupCard({ group, locale }: { group: TeacherGroupCard; locale: string }) {
  const t = useTranslations('teacherHome')
  const days = [...new Set(group.schedule.map((s) => s.weekday))].sort()
  const firstSlot = group.schedule[0] ?? null

  return (
    <div
      style={{
        background: '#FEFCF8',
        borderRadius: 20,
        border: '1px solid rgba(251,176,59,0.12)',
        boxShadow: '0 1px 4px rgba(30,58,95,0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 10px 30px rgba(30,58,95,0.10)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = '0 1px 4px rgba(30,58,95,0.05)'
      }}
    >
      {/* Top zone — soft blue-grey tinted header */}
      <div style={{
        background: '#FFFBF2',
        padding: '22px 24px 20px',
        borderBottom: '1px solid rgba(62,111,168,0.08)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0F1C2E',
            letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}>
            {group.groupName}
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#8BA3BC',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            marginTop: 4,
          }}>
            {group.schoolName}
          </div>
        </div>

        {/* Initial avatar — soft */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'rgba(251,176,59,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 900,
          color: '#B8860B',
          flexShrink: 0,
        }}>
          {group.groupName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* Schedule */}
        {days.length > 0 && firstSlot && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {days.map(d => (
              <span key={d} style={{
                width: 24, height: 24, borderRadius: 7,
                background: 'rgba(251,176,59,0.15)',
                color: '#92650A',
                fontSize: 11, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {WEEKDAY_SHORT[d] ?? d}
              </span>
            ))}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4A6580' }}>
              {formatTime(firstSlot.startTime)}–{formatTime(firstSlot.endTime)}
            </span>
            {group.ageRange && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: 'rgba(62,111,168,0.08)', color: '#4A6580' }}>
                {group.ageRange}
              </span>
            )}
          </div>
        )}

        {/* Student count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8BA3BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4A6580' }}>
            {t('students', { count: group.activeStudentCount })}
          </span>
        </div>

        {/* Current project */}
        {group.currentProjectName && (
          <div style={{
            background: 'rgba(251,176,59,0.06)',
            border: '1px solid rgba(251,176,59,0.18)',
            borderLeft: '3px solid #FBB03B',
            borderRadius: '0 8px 8px 0',
            padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <svg width="8" height="13" viewBox="7 2 16 31" fill="none">
              <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7A5A10', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {group.currentProjectName}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/${locale}/teacher/groups/${group.groupId}`}
          style={{
            marginTop: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px',
            borderRadius: 12,
            background: 'rgba(251,176,59,0.10)',
            border: '1.5px solid rgba(251,176,59,0.30)',
            color: '#92650A',
            fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(251,176,59,0.18)'
            e.currentTarget.style.borderColor = 'rgba(251,176,59,0.50)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(251,176,59,0.10)'
            e.currentTarget.style.borderColor = 'rgba(251,176,59,0.30)'
          }}
        >
          Ver grupo
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
