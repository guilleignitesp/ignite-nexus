'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createSchool } from '@/lib/actions/schools'
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

export function AddSchoolDialog() {
  const t = useTranslations('schools')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setName('')
    setError(null)
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await createSchool(name)
        setOpen(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        {t('addSchool')}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addSchoolTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="school-name">{t('schoolNameLabel')}</Label>
              <Input
                id="school-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('schoolNamePlaceholder')}
                disabled={isPending}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose
                render={<Button type="button" variant="outline" disabled={isPending} />}
              >
                {t('cancel')}
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? '...' : t('addSchoolSubmit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
