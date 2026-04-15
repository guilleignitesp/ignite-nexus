'use client'

import { useTranslations } from 'next-intl'
import type { AttitudeLogEntry } from '@/lib/data/students'

interface AttitudeLogProps {
  logs: AttitudeLogEntry[]
  locale: string
}

export function AttitudeLog({ logs, locale }: AttitudeLogProps) {
  const t = useTranslations('students')

  function localName(obj: { name_es: string; name_en: string; name_ca: string } | null | undefined) {
    if (!obj) return '—'
    if (locale === 'en') return obj.name_en
    if (locale === 'ca') return obj.name_ca
    return obj.name_es
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
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
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{localName(log.attitude_actions)}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {log.sessions?.session_date ? formatDate(log.sessions.session_date) : '—'}
                  </td>
                  <td className={`py-2 pr-4 text-right tabular-nums font-medium ${(log.attitude_actions?.xp_value ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {log.xp_awarded > 0 ? '+' : ''}{log.xp_awarded}
                  </td>
                  <td className="py-2 text-muted-foreground">{formatDate(log.recorded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
