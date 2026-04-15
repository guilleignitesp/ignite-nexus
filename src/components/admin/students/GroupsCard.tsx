'use client'

import { useTranslations } from 'next-intl'
import type { GroupEnrollment } from '@/lib/data/students'

interface GroupsCardProps {
  enrollments: GroupEnrollment[]
  locale: string
}

export function GroupsCard({ enrollments }: GroupsCardProps) {
  const t = useTranslations('students')

  const current = enrollments.filter((e) => e.is_active)
  const past = enrollments.filter((e) => !e.is_active)

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('groupsTitle')}</h2>
      </div>
      <div className="p-4 space-y-6">
        {/* Current */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('currentGroups')}</h3>
          {current.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noCurrentGroups')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t('colGroupName')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colSchoolName')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colCourse')}</th>
                  <th className="pb-2 font-medium">{t('colEnrolledAt')}</th>
                </tr>
              </thead>
              <tbody>
                {current.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{e.groups?.name ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{e.groups?.schools?.name ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{e.groups?.school_years?.name ?? '—'}</td>
                    <td className="py-2 text-muted-foreground">{formatDate(e.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('pastGroups')}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t('colGroupName')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colSchoolName')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colCourse')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('colEnrolledAt')}</th>
                  <th className="pb-2 font-medium">{t('colLeftAt')}</th>
                </tr>
              </thead>
              <tbody>
                {past.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 opacity-60">
                    <td className="py-2 pr-4">{e.groups?.name ?? '—'}</td>
                    <td className="py-2 pr-4">{e.groups?.schools?.name ?? '—'}</td>
                    <td className="py-2 pr-4">{e.groups?.school_years?.name ?? '—'}</td>
                    <td className="py-2 pr-4">{formatDate(e.enrolled_at)}</td>
                    <td className="py-2">{e.left_at ? formatDate(e.left_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
