'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createProject, updateProject } from '@/lib/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ProjectListItem } from '@/lib/data/projects'
import type { BranchWithSkills, SkillItem } from '@/lib/data/skills'

interface ResourceEntry {
  clientId: string
  title: string
  url: string
  type: 'presentation' | 'guide'
}

interface SkillSelection {
  base_xp: number
  difficulty_grade: number
}

interface ProjectDialogProps {
  mode: 'create' | 'edit'
  project?: ProjectListItem
  branches: BranchWithSkills[]
  locale: string
  open: boolean
  onOpenChange: (val: boolean) => void
}

function localeName(
  item: { name_es: string; name_en: string; name_ca: string },
  locale: string
): string {
  if (locale === 'ca') return item.name_ca
  if (locale === 'en') return item.name_en
  return item.name_es
}

export function ProjectDialog({
  mode,
  project,
  branches,
  locale,
  open,
  onOpenChange,
}: ProjectDialogProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [materialType, setMaterialType] = useState('')
  const [recommendedHours, setRecommendedHours] = useState('')
  const [resources, setResources] = useState<ResourceEntry[]>([])
  const [skillMap, setSkillMap] = useState<Map<string, SkillSelection>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && project) {
      setName(project.name)
      setDescription(project.description ?? '')
      setMaterialType(project.material_type ?? '')
      setRecommendedHours(project.recommended_hours != null ? String(project.recommended_hours) : '')
      setResources(
        project.resources.map((r) => ({
          clientId: Math.random().toString(36).slice(2),
          title: r.title,
          url: r.url,
          type: r.type,
        }))
      )
      const map = new Map<string, SkillSelection>()
      project.skills.forEach((s) => {
        map.set(s.skill_id, { base_xp: s.base_xp, difficulty_grade: s.difficulty_grade })
      })
      setSkillMap(map)
    } else {
      setName('')
      setDescription('')
      setMaterialType('')
      setRecommendedHours('')
      setResources([])
      setSkillMap(new Map())
    }
    setError(null)
  }, [open, mode, project])

  function handleOpenChange(val: boolean) {
    if (!isPending) onOpenChange(val)
  }

  // Resources helpers
  function addResource() {
    setResources((prev) => [
      ...prev,
      { clientId: Math.random().toString(36).slice(2), title: '', url: '', type: 'guide' },
    ])
  }

  function removeResource(clientId: string) {
    setResources((prev) => prev.filter((r) => r.clientId !== clientId))
  }

  function updateResourceField(
    clientId: string,
    field: keyof Omit<ResourceEntry, 'clientId'>,
    value: string
  ) {
    setResources((prev) =>
      prev.map((r) => (r.clientId === clientId ? { ...r, [field]: value } : r))
    )
  }

  // Skills helpers
  function toggleSkill(skill: SkillItem) {
    setSkillMap((prev) => {
      const next = new Map(prev)
      if (next.has(skill.id)) {
        next.delete(skill.id)
      } else {
        next.set(skill.id, { base_xp: skill.base_xp, difficulty_grade: 3 })
      }
      return next
    })
  }

  function updateSkillXP(skillId: string, xp: number) {
    setSkillMap((prev) => {
      const next = new Map(prev)
      const existing = next.get(skillId)
      if (existing) next.set(skillId, { ...existing, base_xp: Math.max(1, xp || 1) })
      return next
    })
  }

  function updateSkillDifficulty(skillId: string, grade: number) {
    setSkillMap((prev) => {
      const next = new Map(prev)
      const existing = next.get(skillId)
      if (existing) next.set(skillId, { ...existing, difficulty_grade: grade })
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const skillsInput = Array.from(skillMap.entries()).map(([skill_id, vals]) => ({
      skill_id,
      base_xp: vals.base_xp,
      difficulty_grade: vals.difficulty_grade,
    }))
    const input = {
      name,
      description,
      material_type: materialType,
      recommended_hours: recommendedHours,
      resources,
      skills: skillsInput,
    }
    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createProject(input)
        } else if (project) {
          await updateProject(project.id, input)
        }
        onOpenChange(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('createProjectTitle') : t('editProjectTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-1">
            {/* Basic info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name">{t('nameLabel')}</Label>
                <Input
                  id="proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-description">{t('descriptionLabel')}</Label>
                <textarea
                  id="proj-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-material">{t('materialLabel')}</Label>
                  <Input
                    id="proj-material"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    disabled={isPending}
                    placeholder={t('materialPlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-hours">{t('hoursLabel')}</Label>
                  <Input
                    id="proj-hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={recommendedHours}
                    onChange={(e) => setRecommendedHours(e.target.value)}
                    disabled={isPending}
                    placeholder="4"
                  />
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('resourcesSection')}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={addResource}
                >
                  <Plus />
                  {t('addResource')}
                </Button>
              </div>
              {resources.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('noResources')}</p>
              ) : (
                <div className="space-y-2">
                  {resources.map((r) => (
                    <div key={r.clientId} className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        placeholder={t('resourceTitlePlaceholder')}
                        value={r.title}
                        onChange={(e) => updateResourceField(r.clientId, 'title', e.target.value)}
                        disabled={isPending}
                      />
                      <Input
                        className="flex-1"
                        placeholder={t('resourceUrlPlaceholder')}
                        value={r.url}
                        onChange={(e) => updateResourceField(r.clientId, 'url', e.target.value)}
                        disabled={isPending}
                      />
                      <select
                        value={r.type}
                        onChange={(e) =>
                          updateResourceField(r.clientId, 'type', e.target.value)
                        }
                        disabled={isPending}
                        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        <option value="guide">{t('typeGuide')}</option>
                        <option value="presentation">{t('typePresentation')}</option>
                      </select>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => removeResource(r.clientId)}
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">{t('skillsSection')}</span>
                <p className="text-xs text-muted-foreground">{t('skillsDescription')}</p>
              </div>
              {branches.map((branch) => {
                const activeSkills = branch.skills.filter((s) => s.is_active)
                if (activeSkills.length === 0) return null
                return (
                  <div key={branch.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: branch.color }}
                      />
                      <span className="text-sm font-medium">{localeName(branch, locale)}</span>
                    </div>
                    <div className="space-y-1.5 pl-4">
                      {activeSkills.map((skill) => {
                        const selected = skillMap.get(skill.id)
                        return (
                          <div key={skill.id} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`skill-${skill.id}`}
                              checked={!!selected}
                              onChange={() => toggleSkill(skill)}
                              disabled={isPending}
                              className="size-4 shrink-0 cursor-pointer"
                            />
                            <label
                              htmlFor={`skill-${skill.id}`}
                              className={cn(
                                'flex-1 cursor-pointer text-sm',
                                !selected && 'text-muted-foreground'
                              )}
                            >
                              {localeName(skill, locale)}
                            </label>
                            {selected && (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    {t('baseXpLabel')}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={selected.base_xp}
                                    onChange={(e) =>
                                      updateSkillXP(skill.id, Number(e.target.value))
                                    }
                                    disabled={isPending}
                                    className="h-7 w-20 text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    {t('difficultyLabel')}
                                  </span>
                                  <select
                                    value={selected.difficulty_grade}
                                    onChange={(e) =>
                                      updateSkillDifficulty(skill.id, Number(e.target.value))
                                    }
                                    disabled={isPending}
                                    className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
                                  >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <option key={n} value={n}>{n}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isPending} />}
            >
              {t('cancel')}
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? '...' : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
