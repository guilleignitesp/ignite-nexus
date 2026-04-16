'use client'

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { approveAbsence, rejectAbsence } from '@/lib/actions/absences'
import type { AdminAbsenceItem } from '@/lib/data/absences'
import type { AbsenceStatus } from '@/types'

const STATUS_VARIANT: Record<AbsenceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'all'] as const

interface AbsencesAdminListProps {
  items: AdminAbsenceItem[]
  total: number
  page: number
  limit: number
  status: string
  locale: string
}

export function AbsencesAdminList({
  items,
  total,
  page,
  limit,
  status,
  locale,
}: AbsencesAdminListProps) {
  const t = useTranslations('adminAbsences')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const STATUS_LABEL: Record<AbsenceStatus, string> = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  }

  const FILTER_LABEL: Record<string, string> = {
    pending: t('filterPending'),
    approved: t('filterApproved'),
    rejected: t('filterRejected'),
    all: t('filterAll'),
  }

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ status, page: '0', ...params })
    router.push(`${pathname}?${sp.toString()}`)
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveAbsence(id)
      router.refresh()
    })
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectAbsence(id)
      router.refresh()
    })
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={status === f ? 'secondary' : 'outline'}
            onClick={() => navigate({ status: f })}
          >
            {FILTER_LABEL[f]}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">
                    {item.workerLastName}, {item.workerFirstName}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.reasonName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(`${item.startDate}T12:00:00`).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {item.startDate !== item.endDate && (
                      <>
                        {' – '}
                        {new Date(`${item.endDate}T12:00:00`).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </p>
                  {item.comment && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{item.comment}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[item.status]}>
                    {STATUS_LABEL[item.status]}
                  </Badge>
                  {item.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isPending}
                        onClick={() => handleApprove(item.id)}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleReject(item.id)}
                      >
                        {t('reject')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('pageOf', { page: page + 1, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              {t('prev')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
