'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ValidationItem } from '@/lib/data/validation'
import type { ProjectListItem } from '@/lib/data/projects'
import { ValidationPanel } from './ValidationPanel'

interface ValidationListProps {
  items: ValidationItem[]
  allProjects: ProjectListItem[]
}

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline'
> = {
  pending: 'secondary',
  validated: 'default',
  modified: 'outline',
}

export function ValidationList({ items, allProjects }: ValidationListProps) {
  const t = useTranslations('validation')
  const [statusFilter, setStatusFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [selectedItem, setSelectedItem] = useState<ValidationItem | null>(null)

  // Derived filter options from loaded items
  const schools = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((i) => map.set(i.schoolId, i.schoolName))
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; schoolId: string }>()
    items.forEach((i) => map.set(i.groupId, { name: i.groupName, schoolId: i.schoolId }))
    return Array.from(map.entries())
      .filter(([, v]) => schoolFilter === 'all' || v.schoolId === schoolFilter)
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
  }, [items, schoolFilter])

  const teachers = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((i) => {
      if (i.assignedById) map.set(i.assignedById, i.assignedByName)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (schoolFilter !== 'all' && i.schoolId !== schoolFilter) return false
      if (groupFilter !== 'all' && i.groupId !== groupFilter) return false
      if (teacherFilter !== 'all' && i.assignedById !== teacherFilter) return false
      return true
    })
  }, [items, statusFilter, schoolFilter, groupFilter, teacherFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [statusFilter, schoolFilter, groupFilter, teacherFilter])

  // When filters change, clear selection if it's no longer in filtered set
  useEffect(() => {
    if (selectedItem && !filtered.some((i) => i.id === selectedItem.id)) {
      setSelectedItem(null)
    }
  }, [filtered, selectedItem])

  // Sync selectedItem with fresh items after mutations (router.refresh)
  useEffect(() => {
    if (!selectedItem) return
    const fresh = items.find((i) => i.id === selectedItem.id)
    if (fresh) setSelectedItem(fresh)
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t('filterAll')}</option>
          <option value="pending">{t('filterPending')}</option>
          <option value="validated">{t('filterValidated')}</option>
          <option value="modified">{t('filterModified')}</option>
        </select>
        <select
          value={schoolFilter}
          onChange={(e) => {
            setSchoolFilter(e.target.value)
            setGroupFilter('all')
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t('filterAllSchools')}</option>
          {schools.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t('filterAllGroups')}</option>
          {groups.map(([id, { name }]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t('filterAllTeachers')}</option>
          {teachers.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <p className="ml-auto text-sm text-muted-foreground">
          {t('totalCount', { count: filtered.length })}
        </p>
      </div>

      {/* List + Panel */}
      <div className="flex items-start gap-4">
        {/* Table */}
        <div className="min-w-0 flex-1">
          {paginated.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noResults')}</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">{t('colGroup')}</th>
                    <th className="px-4 py-3 font-medium">{t('colProject')}</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">
                      {t('colTeacher')}
                    </th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">
                      {t('colDate')}
                    </th>
                    <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        setSelectedItem(selectedItem?.id === item.id ? null : item)
                      }
                      className={cn(
                        'border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50',
                        selectedItem?.id === item.id && 'bg-muted/70'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.groupName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.schoolName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{item.projectName}</div>
                        {item.materialType && (
                          <div className="text-xs text-muted-foreground">
                            {item.materialType}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {item.assignedByName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums hidden lg:table-cell">
                        {new Date(item.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[item.status] ?? 'secondary'}>
                          {t(
                            `status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`
                          )}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {t('pageOf', { page: page + 1, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('prev')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Panel */}
        {selectedItem && (
          <ValidationPanel
            item={selectedItem}
            allProjects={allProjects}
            onClose={() => setSelectedItem(null)}
            onMutated={() => {
              // selectedItem will be synced from items via the useEffect above
            }}
          />
        )}
      </div>
    </div>
  )
}
