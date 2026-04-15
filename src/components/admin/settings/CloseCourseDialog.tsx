'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { closeCourse } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface CloseCourseDialogProps {
  courseId: string
  courseName: string
}

export function CloseCourseDialog({ courseId, courseName }: CloseCourseDialogProps) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isConfirmed = confirmation === courseName

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setConfirmation('')
      setError(null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfirmed) return
    setError(null)
    startTransition(async () => {
      try {
        await closeCourse(courseId, confirmation)
        setOpen(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        {t('closeCourse')}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>{t('closeCourseTitle')}</DialogTitle>
            <DialogDescription>{t('closeCourseWarning')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm font-medium">{courseName}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close-confirm">{t('closeCourseInputLabel')}</Label>
              <Input
                id="close-confirm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={courseName}
                disabled={isPending}
                autoComplete="off"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                {t('cancel')}
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={!isConfirmed || isPending}
              >
                {isPending ? '...' : t('closeCourseConfirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
