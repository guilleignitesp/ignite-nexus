'use client'

import { useTranslations } from 'next-intl'
import type { EnrollmentStats as Stats } from '@/lib/data/enrollments'

interface EnrollmentStatsProps {
  stats: Stats
}

export function EnrollmentStats({ stats }: EnrollmentStatsProps) {
  const t = useTranslations('enrollments')

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">{t('totalActive')}</p>
          <p className="text-3xl font-bold tabular-nums">{stats.totalActive}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">{t('recentEnrollments30d')}</p>
          <p className="text-3xl font-bold tabular-nums text-green-600">+{stats.recentEnrollments30d}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">{t('recentLeaves30d')}</p>
          <p className="text-3xl font-bold tabular-nums text-muted-foreground">−{stats.recentLeaves30d}</p>
        </div>
      </div>

      {/* By school */}
      {stats.bySchool.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-2">
            <h2 className="text-sm font-semibold">{t('bySchool')}</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {stats.bySchool.map((s) => (
                <tr key={s.schoolId} className="border-b last:border-0">
                  <td className="px-4 py-2">{s.schoolName}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">
                    {s.activeStudents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
