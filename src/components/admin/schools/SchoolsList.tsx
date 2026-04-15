'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { School, Worker } from '@/lib/data/schools'
import type { SchoolYear } from '@/lib/data/settings'
import { AddSchoolDialog } from './AddSchoolDialog'
import { AddGroupDialog } from './AddGroupDialog'

interface SchoolsListProps {
  schools: School[]
  schoolYears: SchoolYear[]
  workers: Worker[]
  locale: string
}

const WEEKDAY_SHORT: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
}

function formatSchedule(
  schedule: { weekday: number; start_time: string; end_time: string }[]
): string {
  return schedule
    .map((s) => `${WEEKDAY_SHORT[s.weekday]} ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`)
    .join(', ')
}

export function SchoolsList({ schools, schoolYears, workers, locale }: SchoolsListProps) {
  const t = useTranslations('schools')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [addGroupSchoolId, setAddGroupSchoolId] = useState('')

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function openAddGroup(schoolId: string) {
    setAddGroupSchoolId(schoolId)
    setAddGroupOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('schoolCount', { count: schools.length })}
        </p>
        <div className="flex items-center gap-2">
          <AddSchoolDialog />
          <Button size="sm" onClick={() => openAddGroup('')}>
            <Plus />
            {t('addGroup')}
          </Button>
        </div>
      </div>

      {schools.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noSchools')}</p>
      ) : (
        <div className="space-y-3">
          {schools.map((school) => {
            const isExpanded = expandedIds.has(school.id)
            return (
              <div key={school.id} className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(school.id)}
                >
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                  <span className="flex-1 font-medium">{school.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t('groupsBadge', { count: school.groups.length })}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t('studentsBadge', { count: school.student_count })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openAddGroup(school.id)
                    }}
                  >
                    <Plus />
                    {t('addGroupToSchool')}
                  </Button>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-3">
                    {school.groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noGroups')}</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">{t('colGroup')}</th>
                            <th className="pb-2 pr-4 font-medium">{t('colStudents')}</th>
                            <th className="pb-2 pr-4 font-medium">{t('colSchedule')}</th>
                            <th className="pb-2 pr-4 font-medium">{t('colTeachers')}</th>
                            <th className="pb-2 pr-4 font-medium">{t('colCourse')}</th>
                            <th className="pb-2 font-medium" />
                          </tr>
                        </thead>
                        <tbody>
                          {school.groups.map((group) => (
                            <tr key={group.id} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{group.name}</td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {group.student_count}
                              </td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {group.schedule.length > 0
                                  ? formatSchedule(group.schedule)
                                  : '—'}
                              </td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {group.teachers.length > 0
                                  ? group.teachers
                                      .map((w) => `${w.first_name} ${w.last_name}`)
                                      .join(', ')
                                  : '—'}
                              </td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {group.school_year_name ?? '—'}
                              </td>
                              <td className="py-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  render={
                                    <Link
                                      href={`/${locale}/admin/schools/groups/${group.id}`}
                                    />
                                  }
                                >
                                  {t('viewGroup')}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AddGroupDialog
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
        defaultSchoolId={addGroupSchoolId}
        schools={schools}
        schoolYears={schoolYears}
        workers={workers}
      />
    </div>
  )
}
