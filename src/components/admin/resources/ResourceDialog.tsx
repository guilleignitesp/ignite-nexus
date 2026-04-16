'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createGlobalResource, updateGlobalResource } from '@/lib/actions/global-resources'
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
import type { AdminResource, ScopeOption } from '@/lib/data/global-resources'

interface ResourceDialogProps {
  mode: 'create' | 'edit'
  resource?: AdminResource
  schools: ScopeOption[]
  groups: ScopeOption[]
  open: boolean
  onOpenChange: (val: boolean) => void
}

export function ResourceDialog({
  mode,
  resource,
  schools,
  groups,
  open,
  onOpenChange,
}: ResourceDialogProps) {
  const t = useTranslations('adminResources')
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [scopeType, setScopeType] = useState('')
  const [scopeId, setScopeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && resource) {
      setTitle(resource.title)
      setUrl(resource.url)
      setResourceType(resource.resourceType ?? '')
      setTargetRole(resource.targetRole ?? '')
      setScopeType(resource.visibleToType ?? '')
      setScopeId(resource.visibleToId ?? '')
    } else {
      setTitle('')
      setUrl('')
      setResourceType('')
      setTargetRole('')
      setScopeType('')
      setScopeId('')
    }
    setError(null)
  }, [open, mode, resource])

  function handleScopeTypeChange(val: string) {
    setScopeType(val)
    setScopeId('') // reset selector when type changes
  }

  function handleOpenChange(val: boolean) {
    if (!isPending) onOpenChange(val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    setError(null)

    const input = {
      title: title.trim(),
      url: url.trim(),
      resourceType: resourceType || null,
      targetRole: targetRole || null,
      visibleToType: scopeType || null,
      visibleToId: scopeType && scopeId ? scopeId : null,
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createGlobalResource(input)
        } else if (resource) {
          await updateGlobalResource(resource.id, input)
        }
        onOpenChange(false)
        router.refresh()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  const scopeOptions = scopeType === 'school' ? schools : scopeType === 'group' ? groups : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('createTitle') : t('editTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="res-title">{t('titleLabel')}</Label>
              <Input
                id="res-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="res-url">{t('urlLabel')}</Label>
              <Input
                id="res-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('urlPlaceholder')}
                disabled={isPending}
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label htmlFor="res-type">{t('typeLabel')}</Label>
              <select
                id="res-type"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                disabled={isPending}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">{t('typePlaceholder')}</option>
                <option value="guide">{t('typeGuide')}</option>
                <option value="presentation">{t('typePresentation')}</option>
              </select>
            </div>

            {/* Destinatario */}
            <div className="space-y-1.5">
              <Label htmlFor="res-role">{t('targetRoleLabel')}</Label>
              <select
                id="res-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={isPending}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">{t('targetRoleAll')}</option>
                <option value="worker">{t('targetRoleWorker')}</option>
                <option value="student">{t('targetRoleStudent')}</option>
              </select>
            </div>

            {/* Ámbito */}
            <div className="space-y-1.5">
              <Label htmlFor="res-scope">{t('scopeLabel')}</Label>
              <select
                id="res-scope"
                value={scopeType}
                onChange={(e) => handleScopeTypeChange(e.target.value)}
                disabled={isPending}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">{t('scopeAll')}</option>
                <option value="school">{t('scopeSchool')}</option>
                <option value="group">{t('scopeGroup')}</option>
              </select>
            </div>

            {/* Selector de escuela o grupo */}
            {scopeType && (
              <div className="space-y-1.5">
                <Label htmlFor="res-scope-id">
                  {scopeType === 'school' ? t('schoolLabel') : t('groupLabel')}
                </Label>
                <select
                  id="res-scope-id"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">
                    {scopeType === 'school' ? t('schoolPlaceholder') : t('groupPlaceholder')}
                  </option>
                  {scopeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.schoolName ? `${opt.name} — ${opt.schoolName}` : opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
              {t('cancel')}
            </DialogClose>
            <Button type="submit" disabled={isPending || !title.trim() || !url.trim()}>
              {isPending ? '...' : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
