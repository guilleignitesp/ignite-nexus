'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { School } from '@/lib/data/schools'
import type { SchoolYear } from '@/lib/data/settings'
import type { Team } from '@/lib/data/teachers'
import { updateSchoolTeam } from '@/lib/actions/schools'
import { AddSchoolDialog } from './AddSchoolDialog'
import { AddGroupDialog } from './AddGroupDialog'

interface SchoolsListProps {
  schools: School[]
  schoolYears: SchoolYear[]
  locale: string
  teams: Team[]
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

export function SchoolsList({ schools, schoolYears, locale, teams }: SchoolsListProps) {
  const t = useTranslations('schools')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [addGroupSchoolId, setAddGroupSchoolId] = useState('')

  function handleTeamChange(schoolId: string, teamId: string) {
    startTransition(async () => {
      await updateSchoolTeam(schoolId, teamId === '' ? null : teamId)
      router.refresh()
    })
  }

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
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(school.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpanded(school.id) }}
                >
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                  <span className="flex-1 font-medium">{school.name}</span>
                  <select
                    value={school.teamId ?? ''}
                    disabled={isPending}
                    onChange={(e) => handleTeamChange(school.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring disabled:opacity-50"
                  >
                    <option value="">Sin equipo</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.code} · {t.name}</option>
                    ))}
                  </select>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {school.groups.length} grupos
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {school.student_count} alumnos
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
                </div>

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
                              <td className="py-2 pr-4 font-medium">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {group.name}
                                  {group.age_range && (
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: 'rgba(62,111,168,0.08)', color: '#4A6580' }}>
                                      {group.age_range}
                                    </span>
                                  )}
                                </div>
                              </td>
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
                                  nativeButton={false}
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
      />
    </div>
  )
}
