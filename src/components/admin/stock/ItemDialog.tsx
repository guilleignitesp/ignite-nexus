'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StockLocation } from '@/lib/data/stock'
import type { Worker } from '@/lib/data/schools'
import { createItem } from '@/lib/actions/stock'

interface Props {
  locations: StockLocation[]
  workers: Worker[]
  onClose: () => void
}

export function ItemDialog({ locations, workers, onClose }: Props) {
  const t = useTranslations('adminStock')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [holderType, setHolderType] = useState<'location' | 'worker'>('location')
  const [holderId, setHolderId] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset holderId when holderType changes
  function handleHolderTypeChange(value: 'location' | 'worker') {
    setHolderType(value)
    setHolderId('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!holderId) return
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 1) return
    setError(null)

    startTransition(async () => {
      try {
        await createItem(name, description, qty, holderType, holderId)
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
          <DialogTitle>{t('addItemTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="itemName">{t('itemNameLabel')}</Label>
            <Input
              id="itemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="itemDescription">{t('itemDescriptionLabel')}</Label>
            <textarea
              id="itemDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="quantity">{t('quantityLabel')}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>{t('holderTypeLabel')}</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="holderType"
                  value="location"
                  checked={holderType === 'location'}
                  onChange={() => handleHolderTypeChange('location')}
                />
                {t('holderTypeLocation')}
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="holderType"
                  value="worker"
                  checked={holderType === 'worker'}
                  onChange={() => handleHolderTypeChange('worker')}
                />
                {t('holderTypeWorker')}
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="holderId">{t('holderLabel')}</Label>
            <select
              id="holderId"
              value={holderId}
              onChange={(e) => setHolderId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">
                {holderType === 'location'
                  ? t('holderLocationPlaceholder')
                  : t('holderWorkerPlaceholder')}
              </option>
              {holderType === 'location'
                ? locations
                    .filter((l) => l.isActive)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))
                : workers.map((w) => (
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
      </DialogContent>
    </Dialog>
  )
}
