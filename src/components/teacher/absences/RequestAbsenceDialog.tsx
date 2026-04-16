'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { requestAbsence } from '@/lib/actions/absences'
import type { AbsenceReason } from '@/lib/data/absences'

interface RequestAbsenceDialogProps {
  reasons: AbsenceReason[]
  locale: string
}

function getLocalizedName(reason: AbsenceReason, locale: string): string {
  if (locale === 'en') return reason.nameEn
  if (locale === 'ca') return reason.nameCa
  return reason.nameEs
}

export function RequestAbsenceDialog({ reasons, locale }: RequestAbsenceDialogProps) {
  const t = useTranslations('teacherAbsences')
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [reasonId, setReasonId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setReasonId('')
    setStartDate('')
    setEndDate('')
    setComment('')
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    setOpen(next)
  }

  function handleSubmit() {
    if (!reasonId || !startDate || !endDate) return
    if (endDate < startDate) {
      setError(t('dateRangeError'))
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await requestAbsence({
          reasonId,
          startDate,
          endDate,
          comment: comment.trim() || null,
        })
        setOpen(false)
        resetForm()
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  const canSubmit = !!reasonId && !!startDate && !!endDate && !isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="default" />}>
        {t('requestAbsence')}
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="space-y-5">
        <DialogTitle>{t('requestTitle')}</DialogTitle>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('reasonLabel')}</label>
          <select
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">{t('reasonPlaceholder')}</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {getLocalizedName(r, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('startDateLabel')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('endDateLabel')}</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
        </div>

        {/* Comentario */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('commentLabel')}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            rows={3}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t('cancel')}
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? t('submitting') : t('submitRequest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
