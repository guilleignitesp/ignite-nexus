'use client'

import { useTranslations } from 'next-intl'
import type { StudentXPEntry } from '@/lib/data/students'

interface XPTrajectoryProps {
  xpEntries: StudentXPEntry[]
  locale: string
}

export function XPTrajectory({ xpEntries, locale }: XPTrajectoryProps) {
  const t = useTranslations('students')

  function localName(obj: { name_es: string; name_en: string; name_ca: string } | null | undefined) {
    if (!obj) return '—'
    if (locale === 'en') return obj.name_en
    if (locale === 'ca') return obj.name_ca
    return obj.name_es
  }

  // Group by branch
  const byBranch = new Map<string, { branchName: string; color: string; entries: StudentXPEntry[] }>()
  for (const entry of xpEntries) {
    const branch = entry.skills?.branches
    const branchId = branch?.id ?? '__none__'
    if (!byBranch.has(branchId)) {
      byBranch.set(branchId, {
        branchName: branch ? localName(branch) : '—',
        color: branch?.color ?? '#6B7280',
        entries: [],
      })
    }
    byBranch.get(branchId)!.entries.push(entry)
  }

  const branches = Array.from(byBranch.values()).sort((a, b) => a.branchName.localeCompare(b.branchName))

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('xpTitle')}</h2>
      </div>
      <div className="p-4">
        {xpEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noXP')}</p>
        ) : (
          <div className="space-y-6">
            {branches.map((branch) => (
              <div key={branch.branchName}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: branch.color }}
                  />
                  <span className="text-sm font-semibold">{branch.branchName}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">{t('colSkill')}</th>
                      <th className="pb-2 pr-4 font-medium text-right">{t('colAcademicXP')}</th>
                      <th className="pb-2 pr-4 font-medium text-right">{t('colAttitudeXP')}</th>
                      <th className="pb-2 pr-4 font-medium text-right">{t('colTotalXP')}</th>
                      <th className="pb-2 font-medium text-right">{t('colLevel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branch.entries.map((entry, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4">{localName(entry.skills)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{entry.academic_xp}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{entry.attitude_xp}</td>
                        <td className="py-2 pr-4 text-right tabular-nums font-medium">{entry.total_xp}</td>
                        <td className="py-2 text-right tabular-nums">{entry.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
