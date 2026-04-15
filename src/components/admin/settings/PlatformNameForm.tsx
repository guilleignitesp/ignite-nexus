'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { updatePlatformName } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PlatformNameFormProps {
  platformName: string
}

export function PlatformNameForm({ platformName }: PlatformNameFormProps) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [value, setValue] = useState(platformName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    startTransition(async () => {
      try {
        await updatePlatformName(value)
        setSaved(true)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="platform-name">{t('platformNameLabel')}</Label>
        <Input
          id="platform-name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
          }}
          disabled={isPending}
          required
          className="max-w-sm"
        />
      </div>
      {saved && <p className="text-sm text-green-600">{t('nameSaved')}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending || !value.trim()}>
        {isPending ? '...' : t('saveName')}
      </Button>
    </form>
  )
}
