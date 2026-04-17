'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { StockItem, StockLocation } from '@/lib/data/stock'
import type { Worker } from '@/lib/data/schools'
import { recordMovement } from '@/lib/actions/stock'

interface Props {
  item: StockItem
  locations: StockLocation[]
  workers: Worker[]
  onClose: () => void
}

export function MoveItemDialog({ item, locations, workers, onClose }: Props) {
  const t = useTranslations('adminStock')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [toType, setToType] = useState<'location' | 'worker'>('location')
  const [toId, setToId] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleToTypeChange(value: 'location' | 'worker') {
    setToType(value)
    setToId('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!toId) return
    setError(null)

    startTransition(async () => {
      try {
        await recordMovement(item.id, item.holderType, item.holderId, toType, toId)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('saveError'))
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('moveTitle', { itemName: item.name })}</DialogTitle>
        </DialogHeader>

        <div className="pt-2 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{t('currentHolder')}</p>
            <p className="text-sm font-medium">{item.holderName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('newHolderTypeLabel')}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="toType"
                    value="location"
                    checked={toType === 'location'}
                    onChange={() => handleToTypeChange('location')}
                  />
                  {t('holderTypeLocation')}
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="toType"
                    value="worker"
                    checked={toType === 'worker'}
                    onChange={() => handleToTypeChange('worker')}
                  />
                  {t('holderTypeWorker')}
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="toId">{t('newHolderLabel')}</Label>
              <select
                id="toId"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">
                  {toType === 'location'
                    ? t('newHolderLocationPlaceholder')
                    : t('newHolderWorkerPlaceholder')}
                </option>
                {toType === 'location'
                  ? locations
                      .filter((l) => l.isActive && l.id !== item.holderId)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))
                  : workers
                      .filter((w) => !(item.holderType === 'worker' && w.id === item.holderId))
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.first_name} {w.last_name}
                        </option>
                      ))}
              </select>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
