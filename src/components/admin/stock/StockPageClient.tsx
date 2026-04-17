'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StockLocation, StockItem } from '@/lib/data/stock'
import type { Worker } from '@/lib/data/schools'
import { toggleItemStatus } from '@/lib/actions/stock'
import { LocationDialog } from './LocationDialog'
import { ItemDialog } from './ItemDialog'
import { MoveItemDialog } from './MoveItemDialog'
import { ItemMovementsSheet } from './ItemMovementsSheet'

interface Props {
  locations: StockLocation[]
  items: StockItem[]
  workers: Worker[]
}

type Tab = 'locations' | 'items'

export function StockPageClient({ locations, items, workers }: Props) {
  const t = useTranslations('adminStock')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [tab, setTab] = useState<Tab>('locations')

  // Location dialog
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StockLocation | undefined>(undefined)

  // Item dialogs
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [movingItem, setMovingItem] = useState<StockItem | null>(null)
  const [viewingMovementsFor, setViewingMovementsFor] = useState<StockItem | null>(null)

  function openCreateLocation() {
    setEditingLocation(undefined)
    setLocationDialogOpen(true)
  }

  function openEditLocation(loc: StockLocation) {
    setEditingLocation(loc)
    setLocationDialogOpen(true)
  }

  function handleToggleItem(item: StockItem) {
    startTransition(async () => {
      try {
        await toggleItemStatus(item.id, item.isActive)
        router.refresh()
      } catch {
        // no-op
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('locations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'locations'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabLocations')}
        </button>
        <button
          onClick={() => setTab('items')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'items'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabItems')}
        </button>
      </div>

      {/* Locations tab */}
      {tab === 'locations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreateLocation}>
              {t('addLocation')}
            </Button>
          </div>

          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noLocations')}</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('colLocationName')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('colLocationDescription')}</th>
                    <th className="px-4 py-3 text-left font-medium w-28">{t('colLocationStatus')}</th>
                    <th className="px-4 py-3 text-right font-medium w-24" />
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{loc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {loc.description ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={loc.isActive ? 'default' : 'secondary'}>
                          {loc.isActive ? t('statusActive') : t('statusInactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditLocation(loc)}
                        >
                          {t('edit')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Items tab */}
      {tab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setItemDialogOpen(true)}>
              {t('addItem')}
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noItems')}</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('colItemName')}</th>
                    <th className="px-4 py-3 text-left font-medium w-20">{t('colItemQuantity')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('colItemHolder')}</th>
                    <th className="px-4 py-3 text-left font-medium w-28">{t('colItemStatus')}</th>
                    <th className="px-4 py-3 text-right font-medium w-56" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {item.holderType === 'location' ? t('holderTypeLocation') : t('holderTypeWorker')}
                          </Badge>
                          <span>{item.holderName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? t('statusActive') : t('statusInactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingMovementsFor(item)}
                          >
                            {t('viewMovements')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMovingItem(item)}
                          >
                            {t('moveItem')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleItem(item)}
                            disabled={isPending}
                          >
                            {t('toggleStatus')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {locationDialogOpen && (
        <LocationDialog
          location={editingLocation}
          onClose={() => setLocationDialogOpen(false)}
        />
      )}
      {itemDialogOpen && (
        <ItemDialog
          locations={locations}
          workers={workers}
          onClose={() => setItemDialogOpen(false)}
        />
      )}
      {movingItem && (
        <MoveItemDialog
          item={movingItem}
          locations={locations}
          workers={workers}
          onClose={() => setMovingItem(null)}
        />
      )}
      {viewingMovementsFor && (
        <ItemMovementsSheet
          itemId={viewingMovementsFor.id}
          itemName={viewingMovementsFor.name}
          onClose={() => setViewingMovementsFor(null)}
        />
      )}
    </div>
  )
}
