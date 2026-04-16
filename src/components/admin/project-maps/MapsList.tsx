'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleProjectMapStatus } from '@/lib/actions/project-maps'
import type { MapListItem } from '@/lib/data/project-maps'
import { CreateMapDialog } from './CreateMapDialog'

interface MapsListProps {
  maps: MapListItem[]
  locale: string
}

export function MapsList({ maps, locale }: MapsListProps) {
  const t = useTranslations('projectMaps')
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [, startToggle] = useTransition()

  function handleToggle(map: MapListItem) {
    setPendingToggleId(map.id)
    startToggle(async () => {
      try {
        await toggleProjectMapStatus(map.id, map.is_active)
        router.refresh()
      } finally {
        setPendingToggleId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('totalCount', { count: maps.length })}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          {t('addMap')}
        </Button>
      </div>

      {maps.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noMaps')}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t('colName')}</th>
                <th className="px-4 py-3 font-medium">{t('colNodes')}</th>
                <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {maps.map((map) => (
                <tr key={map.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{map.name}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {map.node_count}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={map.is_active ? 'default' : 'secondary'}>
                      {map.is_active ? t('statusActive') : t('statusInactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/${locale}/admin/project-maps/${map.id}`)
                        }
                      >
                        {t('editMap')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingToggleId === map.id}
                        onClick={() => handleToggle(map)}
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

      <CreateMapDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        locale={locale}
      />
    </div>
  )
}
