'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { activateSchoolYear } from '@/lib/actions/settings'
import type { SchoolYear } from '@/lib/data/settings'
import { Button } from '@/components/ui/button'
import { CreateSchoolYearDialog } from './CreateSchoolYearDialog'
import { CloseCourseDialog } from './CloseCourseDialog'

interface SchoolYearsSectionProps {
  schoolYears: SchoolYear[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function ActivateButton({ id }: { id: string }) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleActivate() {
    startTransition(async () => {
      await activateSchoolYear(id)
      router.refresh()
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleActivate} disabled={isPending}>
      {isPending ? '...' : t('activate')}
    </Button>
  )
}

export function SchoolYearsSection({ schoolYears }: SchoolYearsSectionProps) {
  const t = useTranslations('settings')

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateSchoolYearDialog />
      </div>

      {schoolYears.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noSchoolYears')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {t('courseName')}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {t('startDateLabel')}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {t('endDateLabel')}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {t('status')}
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {schoolYears.map((year) => (
                <tr key={year.id} className="bg-background">
                  <td className="px-4 py-3 font-medium">{year.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(year.start_date)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(year.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    {year.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {t('statusActive')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {t('statusInactive')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {year.is_active ? (
                        <CloseCourseDialog courseId={year.id} courseName={year.name} />
                      ) : (
                        <ActivateButton id={year.id} />
                      )}
                    </div>
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
