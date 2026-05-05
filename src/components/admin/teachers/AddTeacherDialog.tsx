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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
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
        await createWorker(firstName, lastName, email, password)
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('saveError'))
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
            <div className="grid grid-cols-2 gap-2">
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-email">{t('emailLabel')}</Label>
              <Input
                id="teacher-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-password">{t('passwordLabel')}</Label>
              <Input
                id="teacher-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
                minLength={6}
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
