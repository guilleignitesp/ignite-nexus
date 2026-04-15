'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TeacherListItem } from '@/lib/data/teachers'
import { AddTeacherDialog } from './AddTeacherDialog'

interface TeachersListProps {
  workers: TeacherListItem[]
  total: number
  page: number
  limit: number
  search: string
  locale: string
}

export function TeachersList({
  workers,
  total,
  page,
  limit,
  search,
  locale,
}: TeachersListProps) {
  const t = useTranslations('teachers')
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(search)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`${pathname}?search=${encodeURIComponent(searchValue)}&page=0`)
  }

  function goToPage(newPage: number) {
    router.push(
      `${pathname}?search=${encodeURIComponent(searchValue)}&page=${newPage}`
    )
  }

  function getAdminLabel(worker: TeacherListItem): string {
    if (worker.is_superadmin) return t('adminSuperadmin')
    if (worker.is_admin) return t('adminAdmin')
    return t('adminNone')
  }

  function getAdminClass(worker: TeacherListItem): string {
    if (worker.is_superadmin)
      return 'rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    if (worker.is_admin)
      return 'rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    return 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
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
            {t('searchPlaceholder').replace('...', '')}
          </Button>
        </form>
        <AddTeacherDialog />
      </div>

      {/* Table */}
      {workers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{t('colName')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colAdmin')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colGroups')}</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">
                    {worker.last_name}, {worker.first_name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        worker.status === 'active'
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                      }
                    >
                      {worker.status === 'active'
                        ? t('statusActive')
                        : t('statusInactive')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={getAdminClass(worker)}>
                      {getAdminLabel(worker)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {worker.active_group_count}
                  </td>
                  <td className="px-4 py-2.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      render={
                        <Link href={`/${locale}/admin/teachers/${worker.id}`} />
                      }
                    >
                      {t('viewProfile')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t('pageOf', { page: page + 1, total: totalPages })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
          >
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
    </div>
  )
}
