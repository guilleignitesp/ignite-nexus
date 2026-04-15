'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createWorker } from '@/lib/actions/teachers'
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

export function AddTeacherDialog() {
  const t = useTranslations('teachers')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setFirstName('')
    setLastName('')
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
        await createWorker(firstName, lastName)
        setOpen(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {t('addTeacher')}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addTeacherTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-first-name">{t('firstNameLabel')}</Label>
              <Input
                id="teacher-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-last-name">{t('lastNameLabel')}</Label>
              <Input
                id="teacher-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={isPending} />
                }
              >
                {t('cancel')}
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? '...' : t('addTeacherSubmit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
