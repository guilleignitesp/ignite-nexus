'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toggleGlobalResourceStatus } from '@/lib/actions/global-resources'
import { ResourceDialog } from './ResourceDialog'
import type { AdminResource, ScopeOption } from '@/lib/data/global-resources'

interface ResourcesAdminListProps {
  items: AdminResource[]
  total: number
  page: number
  limit: number
  search: string
  schools: ScopeOption[]
  groups: ScopeOption[]
}

export function ResourcesAdminList({
  items,
  total,
  page,
  limit,
  search,
  schools,
  groups,
}: ResourcesAdminListProps) {
  const t = useTranslations('adminResources')
  const router = useRouter()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(search)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminResource | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / limit))

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`${pathname}?search=${encodeURIComponent(searchValue)}&page=0`)
  }

  function goToPage(newPage: number) {
    router.push(`${pathname}?search=${encodeURIComponent(searchValue)}&page=${newPage}`)
  }

  function openCreate() {
    setEditTarget(undefined)
    setDialogOpen(true)
  }

  function openEdit(item: AdminResource) {
    setEditTarget(item)
    setDialogOpen(true)
  }

  function handleToggle(item: AdminResource) {
    startTransition(async () => {
      await toggleGlobalResourceStatus(item.id, !item.isActive)
      router.refresh()
    })
  }

  function visibilityLabel(item: AdminResource): string {
    if (!item.visibleToType) return t('scopeAll')
    const name = item.visibleToName ?? item.visibleToId ?? '—'
    return item.visibleToType === 'school' ? `${t('scopeSchool')}: ${name}` : `${t('scopeGroup')}: ${name}`
  }

  function roleLabel(item: AdminResource): string {
    if (item.targetRole === 'worker') return t('targetRoleWorker')
    if (item.targetRole === 'student') return t('targetRoleStudent')
    return t('targetRoleAll')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-64"
          />
          <Button type="submit" size="sm" variant="outline">
            {t('search')}
          </Button>
        </form>
        <Button size="sm" onClick={openCreate}>
          <Plus />
          {t('addResource')}
        </Button>
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('colTitle')}</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t('colType')}</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t('colVisibility')}</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t('colAudience')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('colStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline truncate max-w-[200px] block"
                    >
                      {item.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {item.resourceType
                      ? item.resourceType === 'guide'
                        ? t('typeGuide')
                        : t('typePresentation')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {visibilityLabel(item)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {roleLabel(item)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? t('statusActive') : t('statusInactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                        {t('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleToggle(item)}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('pageOf', { page: page + 1, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => goToPage(page - 1)}>
              {t('prev')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => goToPage(page + 1)}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      <ResourceDialog
        mode={editTarget ? 'edit' : 'create'}
        resource={editTarget}
        schools={schools}
        groups={groups}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
