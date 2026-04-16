import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import type { MyAbsence } from '@/lib/data/absences'
import type { AbsenceStatus } from '@/types'

const STATUS_VARIANT: Record<AbsenceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

interface AbsencesListProps {
  absences: MyAbsence[]
  locale: string
}

export async function AbsencesList({ absences, locale }: AbsencesListProps) {
  const t = await getTranslations('teacherAbsences')

  const STATUS_LABEL: Record<AbsenceStatus, string> = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  }

  if (absences.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noAbsences')}</p>
  }

  return (
    <div className="space-y-3">
      {absences.map((absence) => (
        <div key={absence.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{absence.reasonName}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(`${absence.startDate}T12:00:00`).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {absence.startDate !== absence.endDate && (
                  <>
                    {' – '}
                    {new Date(`${absence.endDate}T12:00:00`).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </>
                )}
              </p>
              {absence.comment && (
                <p className="text-xs text-muted-foreground">{absence.comment}</p>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[absence.status]}>
              {STATUS_LABEL[absence.status]}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
