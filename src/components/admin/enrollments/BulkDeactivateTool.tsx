'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bulkDeactivate } from '@/lib/actions/enrollments'
import type { ActiveGroupItem } from '@/lib/data/enrollments'

interface BulkDeactivateToolProps {
  groups: ActiveGroupItem[]
}

export function BulkDeactivateTool({ groups }: BulkDeactivateToolProps) {
  const t = useTranslations('enrollments')
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmation, setConfirmation] = useState('')
  const [result, setResult] = useState<{ deactivated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Group the groups by school for display
  const bySchool = new Map<string, { school_name: string; groups: ActiveGroupItem[] }>()
  for (const g of groups) {
    if (!bySchool.has(g.school_id)) {
      bySchool.set(g.school_id, { school_name: g.school_name, groups: [] })
    }
    bySchool.get(g.school_id)!.groups.push(g)
  }
  const schools = Array.from(bySchool.values()).sort((a, b) =>
    a.school_name.localeCompare(b.school_name)
  )

  function toggleGroup(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setResult(null)
    setConfirmation('')
  }

  function toggleSchool(groupIds: string[]) {
    const allSelected = groupIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) groupIds.forEach((id) => next.delete(id))
      else groupIds.forEach((id) => next.add(id))
      return next
    })
    setResult(null)
    setConfirmation('')
  }

  function handleDeactivate() {
    if (confirmation !== 'CONFIRMAR') return
    setError(null)
    startTransition(async () => {
      try {
        const res = await bulkDeactivate(Array.from(selectedIds))
        setResult(res)
        setSelectedIds(new Set())
        setConfirmation('')
        router.refresh()
      } catch {
        setError(t('deactivateError'))
      }
    })
  }

  const canSubmit = selectedIds.size > 0 && confirmation === 'CONFIRMAR'

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('bulkDeactivateTitle')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('bulkDeactivateDescription')}</p>
      </div>
      <div className="p-4 space-y-4">

        {/* Group selector */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noGroups')}</p>
          ) : (
            schools.map(({ school_name, groups: schoolGroups }) => {
              const schoolGroupIds = schoolGroups.map((g) => g.id)
              const allSelected = schoolGroupIds.every((id) => selectedIds.has(id))
              const someSelected = schoolGroupIds.some((id) => selectedIds.has(id))

              return (
                <div key={school_name}>
                  <label className="flex cursor-pointer items-center gap-2 py-1 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={((el: HTMLInputElement | null) => {
                        if (el) el.indeterminate = someSelected && !allSelected
                      }) as React.RefCallback<HTMLInputElement>}
                      onChange={() => toggleSchool(schoolGroupIds)}
                      className="accent-primary"
                    />
                    {school_name}
                  </label>
                  <div className="ml-5 space-y-0.5">
                    {schoolGroups.map((g) => (
                      <label
                        key={g.id}
                        className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-muted-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(g.id)}
                          onChange={() => toggleGroup(g.id)}
                          className="accent-primary"
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Confirmation section — visible only when groups are selected */}
        {selectedIds.size > 0 && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">
              {t('deactivateWarning', { count: selectedIds.size })}
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t('confirmationLabel')}</label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={t('confirmationPlaceholder')}
                className="h-8 max-w-xs text-sm font-mono"
                disabled={isPending}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={!canSubmit || isPending}
            >
              {isPending ? t('deactivating') : t('deactivateButton', { count: selectedIds.size })}
            </Button>
          </div>
        )}

        {/* Result */}
        {result !== null && (
          <p className="text-sm text-green-600 font-medium">
            {t('deactivateSuccess', { count: result.deactivated })}
          </p>
        )}

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('selectedGroups', { count: selectedIds.size })}
          </p>
        )}
      </div>
    </section>
  )
}
