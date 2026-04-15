'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { StudentListItem } from '@/lib/data/students'

interface StudentsListProps {
  students: StudentListItem[]
  total: number
  page: number
  limit: number
  search: string
  status: string
  locale: string
}

export function StudentsList({
  students,
  total,
  page,
  limit,
  search,
  status,
  locale,
}: StudentsListProps) {
  const t = useTranslations('students')
  const router = useRouter()
  const pathname = usePathname()

  const totalPages = Math.ceil(total / limit)

  function pushParams(params: Record<string, string>) {
    const sp = new URLSearchParams()
    const merged = { search, status, page: String(page), ...params }
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v) })
    router.push(`${pathname}?${sp.toString()}`)
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    pushParams({ search: (formData.get('search') as string) ?? '', page: '0' })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            name="search"
            defaultValue={search}
            placeholder={t('searchPlaceholder')}
            className="h-8 w-64"
          />
          <Button size="sm" type="submit">{t('searchButton')}</Button>
        </form>

        <select
          value={status}
          onChange={(e) => pushParams({ status: e.target.value, page: '0' })}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
        >
          <option value="">{t('filterAll')}</option>
          <option value="active">{t('filterActive')}</option>
          <option value="inactive">{t('filterInactive')}</option>
        </select>

        <span className="ml-auto text-sm text-muted-foreground">
          {total} {total === 1 ? t('student') : t('studentsCount')}
        </span>
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">{t('colName')}</th>
                <th className="px-4 py-2 font-medium">{t('colStatus')}</th>
                <th className="px-4 py-2 font-medium">{t('colGroup')}</th>
                <th className="px-4 py-2 font-medium">{t('colSchool')}</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b last:border-0 ${s.status === 'inactive' ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-2 font-medium">
                    {s.last_name}, {s.first_name}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {s.status === 'active' ? t('statusActive') : t('statusInactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{s.current_group ?? '—'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.current_school ?? '—'}</td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      render={<Link href={`/${locale}/admin/students/${s.id}`} />}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('pageOf', { page: page + 1, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => pushParams({ page: String(page - 1) })}
            >
              {t('prev')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => pushParams({ page: String(page + 1) })}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
