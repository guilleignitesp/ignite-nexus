'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateEvaluationMultiplier } from '@/lib/actions/students'
import type { ProjectEvaluation } from '@/lib/data/students'

interface EvaluationHistoryProps {
  evaluations: ProjectEvaluation[]
  locale: string
}

function MultiplierCell({ evaluation }: { evaluation: ProjectEvaluation }) {
  const t = useTranslations('students')
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(evaluation.xp_multiplier_pct))
  const [isPending, startTransition] = useTransition()

  function save() {
    const pct = parseInt(value, 10)
    if (isNaN(pct)) { setEditing(false); return }
    startTransition(async () => {
      await updateEvaluationMultiplier(evaluation.id, pct)
      setEditing(false)
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={20}
          max={200}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 w-20 text-sm"
          disabled={isPending}
          autoFocus
        />
        <Button size="sm" className="h-7 px-2 text-xs" onClick={save} disabled={isPending}>
          {t('save')}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setValue(String(evaluation.xp_multiplier_pct)); setEditing(false) }}>
          {t('cancel')}
        </Button>
      </div>
    )
  }

  return (
    <button
      className="flex items-center gap-1 text-left hover:underline"
      onClick={() => setEditing(true)}
    >
      <span className="tabular-nums">{evaluation.xp_multiplier_pct}%</span>
      <span className="text-xs text-muted-foreground">✎</span>
    </button>
  )
}

export function EvaluationHistory({ evaluations, locale }: EvaluationHistoryProps) {
  const t = useTranslations('students')

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('evaluationsTitle')}</h2>
      </div>
      <div className="p-4">
        {evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noEvaluations')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t('colProject')}</th>
                <th className="pb-2 pr-4 font-medium">{t('colEvaluatedAt')}</th>
                <th className="pb-2 pr-4 font-medium">{t('colMultiplier')}</th>
                <th className="pb-2 font-medium">{t('colXPAwarded')}</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => {
                const totalXP = ev.skill_evaluations.reduce((s, se) => s + se.xp_awarded, 0)
                return (
                  <tr key={ev.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{ev.projects?.name ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(ev.evaluated_at)}</td>
                    <td className="py-2 pr-4">
                      <MultiplierCell evaluation={ev} />
                    </td>
                    <td className="py-2 tabular-nums font-medium">{totalXP}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
