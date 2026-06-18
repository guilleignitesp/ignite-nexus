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

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', borderRadius: 10,
  border: '1px solid rgba(62,111,168,0.18)',
  padding: '8px 12px', fontSize: 13,
  background: '#fff', outline: 'none',
  color: '#0F1C2E', boxSizing: 'border-box',
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
      <DialogTrigger render={
        <button style={{
          background: 'rgba(251,176,59,0.10)',
          border: '1.5px solid rgba(251,176,59,0.28)',
          color: '#92650A', borderRadius: 12,
          padding: '8px 18px', fontWeight: 700,
          fontSize: 13, cursor: 'pointer',
        }} />
      }>
        {t('requestAbsence')}
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="space-y-5">
        <DialogTitle>{t('requestTitle')}</DialogTitle>

        {/* Motivo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>{t('reasonLabel')}</label>
          <select
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            style={INPUT_STYLE}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>{t('startDateLabel')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>{t('endDateLabel')}</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Comentario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>{t('commentLabel')}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            rows={3}
            style={{ ...INPUT_STYLE, resize: 'none' }}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>}

        <DialogFooter>
          <DialogClose render={
            <button style={{
              padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: 'transparent', border: '1px solid rgba(62,111,168,0.20)',
              color: '#8BA3BC', cursor: 'pointer',
            }} />
          }>
            {t('cancel')}
          </DialogClose>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: 'rgba(62,111,168,0.10)', border: '1.5px solid rgba(62,111,168,0.22)',
              color: '#2D4A6B', cursor: !canSubmit ? 'not-allowed' : 'pointer',
              opacity: !canSubmit ? 0.5 : 1,
            }}
          >
            {isPending ? t('submitting') : t('submitRequest')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
