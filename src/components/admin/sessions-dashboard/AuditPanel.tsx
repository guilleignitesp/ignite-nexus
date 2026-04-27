'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAuditLog,
  revertChange,
  type ChangeLogEntry,
} from '@/lib/actions/sessions-dashboard'

interface Props {
  open: boolean
  onClose: () => void
}

function formatChangeType(
  changeType: string,
  t: ReturnType<typeof useTranslations>
): string {
  const map: Record<string, string> = {
    substitute_add: t('changeType.substitute_add'),
    substitute_remove: t('changeType.substitute_remove'),
    absent_mark: t('changeType.absent_mark'),
    absent_unmark: t('changeType.absent_unmark'),
    permanent_add: t('changeType.permanent_add'),
    permanent_remove: t('changeType.permanent_remove'),
  }
  return map[changeType] ?? changeType
}

function changeTypeBadgeVariant(
  changeType: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (changeType) {
    case 'substitute_add':
      return 'default'
    case 'substitute_remove':
      return 'destructive'
    case 'absent_mark':
      return 'destructive'
    case 'absent_unmark':
      return 'secondary'
    case 'permanent_add':
      return 'default'
    case 'permanent_remove':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function AuditPanel({ open, onClose }: Props) {
  const t = useTranslations('sessionsDashboard')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [entries, setEntries] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [revertErrors, setRevertErrors] = useState<Record<string, string>>({})

  async function loadEntries() {
    setLoading(true)
    try {
      const data = await getAuditLog()
      setEntries(data)
    } catch (e) {
      console.error('Error loading audit log:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadEntries()
    }
  }, [open])

  function handleRevert(entry: ChangeLogEntry) {
    if (!window.confirm(t('revertConfirm'))) return

    setRevertErrors((prev) => {
      const copy = { ...prev }
      delete copy[entry.id]
      return copy
    })

    startTransition(async () => {
      try {
        await revertChange(entry.id)
        router.refresh()
        await loadEntries()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error'
        if (msg === 'ALREADY_REVERTED') {
          await loadEntries()
          return
        }
        if (msg.startsWith('BLOCKED:')) {
          const count = msg.replace('BLOCKED:', '')
          setRevertErrors((prev) => ({
            ...prev,
            [entry.id]: t('revertBlocked', { count }),
          }))
          return
        }
        setRevertErrors((prev) => ({ ...prev, [entry.id]: msg }))
      }
    })
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="sm:max-w-lg" style={{ overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle>{t('auditTitle')}</SheetTitle>
        </SheetHeader>

        <div style={{ padding: '0 1rem 1rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!loading && entries.length === 0 && (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                paddingTop: '1rem',
                textAlign: 'center',
              }}
            >
              {t('auditEmpty')}
            </p>
          )}

          {!loading && entries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem' }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    opacity: entry.isReverted ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <Badge
                          variant={changeTypeBadgeVariant(entry.changeType)}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {formatChangeType(entry.changeType, t)}
                        </Badge>
                        {entry.isReverted && (
                          <Badge variant="outline" style={{ fontSize: '0.65rem' }}>
                            {t('reverted')}
                          </Badge>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {entry.workerName || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {entry.groupName} · {entry.schoolName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {entry.sessionDate || '—'} · por {entry.changedByName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
                        {formatDate(entry.changedAt)}
                      </div>
                    </div>

                    {!entry.isReverted && entry.isSessionChange && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleRevert(entry)}
                        disabled={isPending}
                        style={{ flexShrink: 0 }}
                      >
                        {t('revert')}
                      </Button>
                    )}
                  </div>

                  {revertErrors[entry.id] && (
                    <div
                      style={{
                        marginTop: '0.375rem',
                        fontSize: '0.75rem',
                        color: 'var(--destructive)',
                      }}
                    >
                      {revertErrors[entry.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
