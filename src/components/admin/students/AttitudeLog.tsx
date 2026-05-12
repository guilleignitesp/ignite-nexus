'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { deleteAttitudeLog } from '@/lib/actions/students'
import type { AttitudeLogEntry } from '@/lib/data/students'

interface AttitudeLogProps {
  logs: AttitudeLogEntry[]
  locale: string
}

export function AttitudeLog({ logs, locale }: AttitudeLogProps) {
  const t = useTranslations('students')
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function localName(obj: { name_es: string; name_en: string; name_ca: string } | null | undefined) {
    if (!obj) return '—'
    if (locale === 'en') return obj.name_en
    if (locale === 'ca') return obj.name_ca
    return obj.name_es
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function handleDelete(logId: string) {
    startTransition(async () => {
      await deleteAttitudeLog(logId)
      setConfirmId(null)
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('attitudeTitle')}</h2>
      </div>
      <div className="p-4">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noAttitudeLogs')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t('colAction')}</th>
                <th className="pb-2 pr-4 font-medium">{t('colSession')}</th>
                <th className="pb-2 pr-4 font-medium text-right">{t('colXPAwarded')}</th>
                <th className="pb-2 font-medium">{t('colRecordedAt')}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) =>
                confirmId === log.id ? (
                  <tr key={log.id} className="border-b last:border-0 bg-destructive/5">
                    <td colSpan={4} className="py-2 pr-4 text-sm text-muted-foreground">
                      ¿Eliminar este registro?
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          disabled={isPending}
                          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                        >
                          {isPending ? 'Eliminando…' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          disabled={isPending}
                          className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{localName(log.attitude_actions)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {log.sessions?.session_date ? formatDate(log.sessions.session_date) : '—'}
                    </td>
                    <td className={`py-2 pr-4 text-right tabular-nums font-medium ${(log.attitude_actions?.xp_value ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {log.xp_awarded > 0 ? '+' : ''}{log.xp_awarded}
                    </td>
                    <td className="py-2 text-muted-foreground">{formatDate(log.recorded_at)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmId(log.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
