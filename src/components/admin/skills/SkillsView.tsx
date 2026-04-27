'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleSkillStatus } from '@/lib/actions/skills'
import type { BranchWithSkills, SkillItem } from '@/lib/data/skills'
import { EditBranchDialog } from './EditBranchDialog'
import { SkillDialog } from './SkillDialog'

interface SkillsViewProps {
  branches: BranchWithSkills[]
  locale: string
}

function localeName(
  item: { name_es: string; name_en: string; name_ca: string },
  locale: string
): string {
  if (locale === 'ca') return item.name_ca
  if (locale === 'en') return item.name_en
  return item.name_es
}

export function SkillsView({ branches, locale }: SkillsViewProps) {
  const t = useTranslations('skills')
  const router = useRouter()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editBranch, setEditBranch] = useState<BranchWithSkills | null>(null)
  const [createSkillBranchId, setCreateSkillBranchId] = useState<string | null>(null)
  const [editSkill, setEditSkill] = useState<SkillItem | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [, startToggle] = useTransition()

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleSkill(skill: SkillItem) {
    setPendingToggleId(skill.id)
    startToggle(async () => {
      try {
        await toggleSkillStatus(skill.id, skill.is_active)
        router.refresh()
      } finally {
        setPendingToggleId(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      {branches.map((branch) => {
        const isExpanded = expandedIds.has(branch.id)
        const activeCount = branch.skills.filter((s) => s.is_active).length
        const name = localeName(branch, locale)

        return (
          <div key={branch.id} className="rounded-lg border">
            <div
              role="button"
              tabIndex={0}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(branch.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpanded(branch.id) }}
            >
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: branch.color }}
              />
              <span className="flex-1 font-medium">{name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t('skillsCount', { count: branch.skills.length })}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t('activeCount', { count: activeCount })}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditBranch(branch)
                }}
              >
                <Pencil />
                {t('editBranch')}
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setCreateSkillBranchId(branch.id)
                }}
              >
                <Plus />
                {t('addSkill')}
              </Button>
            </div>

            {isExpanded && (
              <div className="border-t px-4 py-3">
                {branch.skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noSkills')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">{t('colName')}</th>
                        <th className="pb-2 pr-4 font-medium">{t('colDescription')}</th>
                        <th className="pb-2 pr-4 font-medium">{t('colBaseXP')}</th>
                        <th className="pb-2 pr-4 font-medium">{t('colStatus')}</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {branch.skills.map((skill) => (
                        <tr
                          key={skill.id}
                          className={cn(
                            'border-b last:border-0',
                            !skill.is_active && 'opacity-50'
                          )}
                        >
                          <td className="py-2 pr-4 font-medium">
                            {localeName(skill, locale)}
                          </td>
                          <td className="max-w-xs truncate py-2 pr-4 text-muted-foreground">
                            {skill.description ?? '—'}
                          </td>
                          <td className="py-2 pr-4 tabular-nums">{skill.base_xp}</td>
                          <td className="py-2 pr-4">
                            <Badge variant={skill.is_active ? 'default' : 'secondary'}>
                              {skill.is_active ? t('statusActive') : t('statusInactive')}
                            </Badge>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditSkill(skill)}
                              >
                                {t('editSkill')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pendingToggleId === skill.id}
                                onClick={() => handleToggleSkill(skill)}
                              >
                                {t('toggleStatus')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )
      })}

      <EditBranchDialog
        branch={editBranch}
        open={editBranch !== null}
        onOpenChange={(val) => { if (!val) setEditBranch(null) }}
      />

      <SkillDialog
        mode="create"
        branchId={createSkillBranchId ?? ''}
        open={createSkillBranchId !== null}
        onOpenChange={(val) => { if (!val) setCreateSkillBranchId(null) }}
      />

      <SkillDialog
        mode="edit"
        branchId={editSkill?.branch_id ?? ''}
        skill={editSkill ?? undefined}
        open={editSkill !== null}
        onOpenChange={(val) => { if (!val) setEditSkill(null) }}
      />
    </div>
  )
}
