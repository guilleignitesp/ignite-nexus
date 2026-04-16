'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toggleProjectStatus } from '@/lib/actions/projects'
import type { ProjectListItem } from '@/lib/data/projects'
import type { BranchWithSkills } from '@/lib/data/skills'
import { ProjectDialog } from './ProjectDialog'

interface ProjectsListProps {
  projects: ProjectListItem[]
  branches: BranchWithSkills[]
  locale: string
}

const PAGE_SIZE = 20

export function ProjectsList({ projects, branches, locale }: ProjectsListProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectListItem | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [, startToggle] = useTransition()

  const materialOptions = useMemo(() => {
    const types = new Set<string>()
    projects.forEach((p) => { if (p.material_type) types.add(p.material_type) })
    return Array.from(types).sort()
  }, [projects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (materialFilter !== 'all' && p.material_type !== materialFilter) return false
      if (statusFilter === 'active' && !p.is_active) return false
      if (statusFilter === 'inactive' && p.is_active) return false
      return true
    })
  }, [projects, search, materialFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, materialFilter, statusFilter])

  function handleToggle(project: ProjectListItem) {
    setPendingToggleId(project.id)
    startToggle(async () => {
      try {
        await toggleProjectStatus(project.id, project.is_active)
        router.refresh()
      } finally {
        setPendingToggleId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-64"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t('allMaterials')}</option>
          {materialOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t('filterAll')}</option>
          <option value="active">{t('filterActive')}</option>
          <option value="inactive">{t('filterInactive')}</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {t('totalCount', { count: filtered.length })}
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            {t('addProject')}
          </Button>
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t('colName')}</th>
                <th className="px-4 py-3 font-medium">{t('colMaterial')}</th>
                <th className="px-4 py-3 font-medium">{t('colHours')}</th>
                <th className="px-4 py-3 font-medium">{t('colSkills')}</th>
                <th className="px-4 py-3 font-medium">{t('colMaps')}</th>
                <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((project) => (
                <tr
                  key={project.id}
                  className={cn(
                    'border-b last:border-0',
                    !project.is_active && 'opacity-50'
                  )}
                >
                  <td className="px-4 py-3 font-medium">{project.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {project.material_type ?? '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {project.recommended_hours != null ? project.recommended_hours : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {project.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          project.skills.reduce((acc, s) => {
                            if (!acc.has(s.branch_color)) acc.set(s.branch_color, 0)
                            acc.set(s.branch_color, acc.get(s.branch_color)! + 1)
                            return acc
                          }, new Map<string, number>())
                        ).map(([color, count]) => (
                          <span
                            key={color}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-muted"
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {count}
                          </span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {project.map_names.length > 0
                      ? project.map_names.join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={project.is_active ? 'default' : 'secondary'}>
                      {project.is_active ? t('statusActive') : t('statusInactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditProject(project)}
                      >
                        {t('editProject')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingToggleId === project.id}
                        onClick={() => handleToggle(project)}
                      >
                        {t('toggleStatus')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
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

      <ProjectDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        branches={branches}
        locale={locale}
      />

      <ProjectDialog
        mode="edit"
        project={editProject ?? undefined}
        open={editProject !== null}
        onOpenChange={(val) => { if (!val) setEditProject(null) }}
        branches={branches}
        locale={locale}
      />
    </div>
  )
}
