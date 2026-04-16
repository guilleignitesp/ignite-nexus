'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
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
import { createProjectMap } from '@/lib/actions/project-maps'

interface CreateMapDialogProps {
  open: boolean
  onOpenChange: (val: boolean) => void
  locale: string
}

export function CreateMapDialog({ open, onOpenChange, locale }: CreateMapDialogProps) {
  const t = useTranslations('projectMaps')
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setError(null)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const mapId = await createProjectMap(name, description)
        onOpenChange(false)
        router.push(`/${locale}/admin/project-maps/${mapId}`)
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isPending) onOpenChange(val) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('createMapTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="map-name">{t('nameLabel')}</Label>
              <Input
                id="map-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="map-desc">{t('descriptionLabel')}</Label>
              <Input
                id="map-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <DialogFooter className="mt-6">
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isPending} />}
            >
              {t('cancel')}
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? '...' : t('createMapSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
