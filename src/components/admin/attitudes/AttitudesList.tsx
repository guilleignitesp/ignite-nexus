'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AttitudeAction } from '@/lib/data/attitudes'
import { toggleAttitudeStatus } from '@/lib/actions/attitudes'
import { AttitudeDialog } from './AttitudeDialog'

interface Props {
  actions: AttitudeAction[]
}

export function AttitudesList({ actions }: Props) {
  const t = useTranslations('attitudes')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AttitudeAction | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(action: AttitudeAction) {
    setEditing(action)
    setDialogOpen(true)
  }

  function handleToggle(action: AttitudeAction) {
    startTransition(async () => {
      try {
        await toggleAttitudeStatus(action.id, action.isActive)
        router.refresh()
      } catch {
        // silently ignore, UI will stay consistent after refresh
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('totalCount', { count: actions.length })}
        </span>
        <Button size="sm" onClick={openCreate}>
          {t('addAction')}
        </Button>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('noResults')}</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('colName')}</th>
                <th className="px-4 py-3 text-left font-medium w-24">{t('colXP')}</th>
                <th className="px-4 py-3 text-left font-medium w-28">{t('colStatus')}</th>
                <th className="px-4 py-3 text-right font-medium w-40" />
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{action.nameEs}</div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        action.xpValue >= 0
                          ? 'font-semibold text-green-600'
                          : 'font-semibold text-destructive'
                      }
                    >
                      {action.xpValue >= 0 ? '+' : ''}
                      {action.xpValue}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={action.isActive ? 'default' : 'secondary'}>
                      {action.isActive ? t('statusActive') : t('statusInactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(action)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(action)}
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

      {dialogOpen && (
        <AttitudeDialog
          action={editing}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  )
}
