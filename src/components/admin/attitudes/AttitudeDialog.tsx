'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AttitudeAction } from '@/lib/data/attitudes'
import { createAttitudeAction, updateAttitudeAction } from '@/lib/actions/attitudes'

interface Props {
  action?: AttitudeAction
  onClose: () => void
}

export function AttitudeDialog({ action, onClose }: Props) {
  const t = useTranslations('attitudes')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [nameEs, setNameEs] = useState(action?.nameEs ?? '')
  const [nameEn, setNameEn] = useState(action?.nameEn ?? '')
  const [nameCa, setNameCa] = useState(action?.nameCa ?? '')
  const [xpValue, setXpValue] = useState(String(action?.xpValue ?? 10))
  const [description, setDescription] = useState(action?.description ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const xp = parseInt(xpValue, 10)
    if (isNaN(xp)) return

    startTransition(async () => {
      try {
        if (action) {
          await updateAttitudeAction(action.id, nameEs, nameEn, nameCa, xp, description)
        } else {
          await createAttitudeAction(nameEs, nameEn, nameCa, xp, description)
        }
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('saveError'))
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="nameEs">{t('nameEsLabel')}</Label>
            <Input
              id="nameEs"
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="nameEn">{t('nameEnLabel')}</Label>
            <Input
              id="nameEn"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="nameCa">{t('nameCaLabel')}</Label>
            <Input
              id="nameCa"
              value={nameCa}
              onChange={(e) => setNameCa(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="xpValue">{t('xpValueLabel')}</Label>
            <Input
              id="xpValue"
              type="number"
              value={xpValue}
              onChange={(e) => setXpValue(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">{t('xpValueHint')}</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">{t('descriptionLabel')}</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
