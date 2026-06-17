'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createStudentAccess,
  getStudentAuthEmail,
  changeStudentPassword,
} from '@/lib/actions/students'

interface Props {
  studentId: string
  hasAccess: boolean
}

type Phase = 'idle' | 'credentials' | 'existing' | 'change_pw' | 'pw_success'

function generatePasswordClient(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export function StudentPortalAccess({ studentId, hasAccess }: Props) {
  const t = useTranslations('studentPortalAccess')
  const [isPending, startTransition] = useTransition()

  const [phase, setPhase] = useState<Phase>(hasAccess ? 'existing' : 'idle')
  const [email, setEmail] = useState<string | null>(null)
  const [shownPassword, setShownPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)

  useEffect(() => {
    if (phase === 'existing' && email === null) {
      setLoadingEmail(true)
      getStudentAuthEmail(studentId)
        .then((e) => setEmail(e))
        .finally(() => setLoadingEmail(false))
    }
  }, [phase, studentId]) // eslint-disable-line react-hooks/exhaustive-deps

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await createStudentAccess(studentId)
        setEmail(result.email)
        setShownPassword(result.password)
        setPhase('credentials')
      } catch {
        setError(t('errorCreate'))
      }
    })
  }

  function handleSavePassword() {
    if (!newPassword.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await changeStudentPassword(studentId, newPassword)
        setShownPassword(newPassword)
        setNewPassword('')
        setPhase('pw_success')
      } catch {
        setError(t('errorChange'))
      }
    })
  }

  return (
    <section className="rounded-lg border p-6 space-y-4">
      <h2 className="font-semibold">{t('title')}</h2>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {phase === 'idle' && (
        <Button onClick={handleCreate} disabled={isPending}>
          {isPending ? t('creating') : t('createAccess')}
        </Button>
      )}

      {phase === 'credentials' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('credentialsNote')}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-24 shrink-0">{t('emailLabel')}</span>
              <code className="flex-1 text-sm bg-muted px-2 py-1 rounded break-all">{email}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(email!, 'email')}
              >
                {copied === 'email' ? t('copied') : t('copy')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-24 shrink-0">{t('passwordLabel')}</span>
              <code className="flex-1 text-sm bg-muted px-2 py-1 rounded">{shownPassword}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(shownPassword, 'password')}
              >
                {copied === 'password' ? t('copied') : t('copy')}
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => setPhase('existing')}>
            {t('close')}
          </Button>
        </div>
      )}

      {phase === 'existing' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-24 shrink-0">{t('emailLabel')}</span>
            {loadingEmail ? (
              <span className="text-sm text-muted-foreground">{t('loadingEmail')}</span>
            ) : (
              <code className="text-sm bg-muted px-2 py-1 rounded break-all">{email ?? '—'}</code>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setNewPassword('')
              setError(null)
              setPhase('change_pw')
            }}
          >
            {t('changePassword')}
          </Button>
        </div>
      )}

      {phase === 'change_pw' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={t('newPasswordLabel')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewPassword(generatePasswordClient())}
            >
              {t('generateRandom')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSavePassword} disabled={isPending || !newPassword.trim()}>
              {isPending ? t('saving') : t('savePassword')}
            </Button>
            <Button variant="outline" onClick={() => setPhase('existing')} disabled={isPending}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'pw_success' && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{t('passwordChanged')}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-muted px-2 py-1 rounded">{shownPassword}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(shownPassword, 'pw_success')}
            >
              {copied === 'pw_success' ? t('copied') : t('copy')}
            </Button>
          </div>
          <Button variant="outline" onClick={() => setPhase('existing')}>
            {t('close')}
          </Button>
        </div>
      )}
    </section>
  )
}
