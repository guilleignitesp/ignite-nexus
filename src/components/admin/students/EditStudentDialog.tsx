'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { updateStudent, toggleStudentStatus } from '@/lib/actions/students'
import type { StudentProfile } from '@/lib/data/students'

interface EditStudentDialogProps {
  student: Pick<StudentProfile, 'id' | 'first_name' | 'last_name' | 'status'>
}

export function EditStudentDialog({ student }: EditStudentDialogProps) {
  const t = useTranslations('students')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(student.first_name)
  const [lastName, setLastName] = useState(student.last_name)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isTogglingStatus, startToggleTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await updateStudent(student.id, firstName, lastName)
        setOpen(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  function handleToggleStatus() {
    startToggleTransition(async () => {
      try {
        await toggleStudentStatus(student.id)
        router.refresh()
      } catch {
        // silently fail
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleToggleStatus}
        disabled={isTogglingStatus}
      >
        {t('toggleStatus')}
      </Button>
      <Button size="sm" onClick={() => setOpen(true)}>
        {t('editStudent')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('editStudentTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-first">{t('firstNameLabel')}</Label>
              <Input
                id="edit-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-last">{t('lastNameLabel')}</Label>
              <Input
                id="edit-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                {t('cancel')}
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? '...' : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
