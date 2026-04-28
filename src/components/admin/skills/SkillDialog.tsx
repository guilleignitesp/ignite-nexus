'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createSkill, updateSkill } from '@/lib/actions/skills'
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
import type { SkillItem } from '@/lib/data/skills'

interface SkillDialogProps {
  mode: 'create' | 'edit'
  branchId: string
  skill?: SkillItem
  open: boolean
  onOpenChange: (val: boolean) => void
}

export function SkillDialog({ mode, branchId, skill, open, onOpenChange }: SkillDialogProps) {
  const t = useTranslations('skills')
  const router = useRouter()
  const [nameEs, setNameEs] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameCa, setNameCa] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && skill) {
        setNameEs(skill.name_es)
        setNameEn(skill.name_en)
        setNameCa(skill.name_ca)
        setDescription(skill.description ?? '')
      } else {
        setNameEs('')
        setNameEn('')
        setNameCa('')
        setDescription('')
      }
      setError(null)
    }
  }, [open, mode, skill])

  function handleOpenChange(val: boolean) {
    if (!isPending) onOpenChange(val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createSkill({ branch_id: branchId, name_es: nameEs, name_en: nameEn, name_ca: nameCa, description })
        } else if (skill) {
          await updateSkill(skill.id, { name_es: nameEs, name_en: nameEn, name_ca: nameCa, description })
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('createSkillTitle') : t('editSkillTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="skill-name-es">{t('nameEsLabel')}</Label>
            <Input
              id="skill-name-es"
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-name-en">{t('nameEnLabel')}</Label>
            <Input
              id="skill-name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-name-ca">{t('nameCaLabel')}</Label>
            <Input
              id="skill-name-ca"
              value={nameCa}
              onChange={(e) => setNameCa(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-description">{t('descriptionLabel')}</Label>
            <Input
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          {error &&<p className="text-sm text-destructive">{error}</p>}
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
