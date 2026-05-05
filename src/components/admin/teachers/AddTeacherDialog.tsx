'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createWorker, addWorkerTeam, getTeamsList } from '@/lib/actions/teachers'
import type { Team } from '@/lib/data/teachers'
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
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      getTeamsList().then(setTeams).catch(() => {})
    }
  }, [open])

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    )
  }

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setError(null)
    setSelectedTeamIds([])
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
        const workerId = await createWorker(firstName, lastName, email, password)
        await Promise.all(selectedTeamIds.map((tid) => addWorkerTeam(workerId, tid)))
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
            {teams.length > 0 && (
              <div className="space-y-1.5">
                <Label>Equipos</Label>
                <div className="flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <label key={team.id} className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        disabled={isPending}
                        className="size-3.5"
                      />
                      <span className="font-medium">{team.code}</span>
                      <span className="text-muted-foreground">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
