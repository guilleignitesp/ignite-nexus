'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { StockMovement } from '@/lib/actions/stock'
import { getItemMovements } from '@/lib/actions/stock'

interface Props {
  itemId: string
  itemName: string
  onClose: () => void
}

export function ItemMovementsSheet({ itemId, itemName, onClose }: Props) {
  const t = useTranslations('adminStock')
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getItemMovements(itemId)
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setLoading(false))
  }, [itemId])

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md" style={{ overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle>{t('movements')} — {itemName}</SheetTitle>
        </SheetHeader>

        <div style={{ padding: '0 1rem 1rem' }}>
          {loading ? (
            <div className="flex flex-col gap-3 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground pt-4 text-center">{t('noMovements')}</p>
          ) : (
            <div className="space-y-2 pt-4">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="rounded-md border p-3 text-sm space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(m.movedAt)}</span>
                    {m.movedByName && <span>· {m.movedByName}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.fromName}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{m.toName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
