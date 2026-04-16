'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { updateBranch } from '@/lib/actions/skills'
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
import type { BranchWithSkills } from '@/lib/data/skills'

interface EditBranchDialogProps {
  branch: BranchWithSkills | null
  open: boolean
  onOpenChange: (val: boolean) => void
}

export function EditBranchDialog({ branch, open, onOpenChange }: EditBranchDialogProps) {
  const t = useTranslations('skills')
  const router = useRouter()
  const [nameEs, setNameEs] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameCa, setNameCa] = useState('')
  const [color, setColor] = useState('#000000')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (branch) {
      setNameEs(branch.name_es)
      setNameEn(branch.name_en)
      setNameCa(branch.name_ca)
      setColor(branch.color)
      setError(null)
    }
  }, [branch])

  function handleOpenChange(val: boolean) {
    if (!isPending) onOpenChange(val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!branch) return
    setError(null)
    startTransition(async () => {
      try {
        await updateBranch(branch.id, {
          name_es: nameEs,
          name_en: nameEn,
          name_ca: nameCa,
          color,
        })
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
          <DialogTitle>{t('editBranchTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="branch-name-es">{t('nameEsLabel')}</Label>
            <Input
              id="branch-name-es"
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch-name-en">{t('nameEnLabel')}</Label>
            <Input
              id="branch-name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch-name-ca">{t('nameCaLabel')}</Label>
            <Input
              id="branch-name-ca"
              value={nameCa}
              onChange={(e) => setNameCa(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch-color">{t('colorLabel')}</Label>
            <div className="flex items-center gap-3">
              <input
                id="branch-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isPending}
                className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isPending}
                className="w-32 font-mono uppercase"
                maxLength={7}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
