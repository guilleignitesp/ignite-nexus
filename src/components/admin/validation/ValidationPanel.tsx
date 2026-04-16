'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getSessionTrajectory,
  validateAssignment,
  changeProjectAssignment,
} from '@/lib/actions/validation'
import type { ValidationItem, SessionEntry } from '@/lib/data/validation'
import type { ProjectListItem } from '@/lib/data/projects'

const TRAFFIC_DOT: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  completed: 'default',
  suspended: 'destructive',
  holiday: 'outline',
}

interface ValidationPanelProps {
  item: ValidationItem
  allProjects: ProjectListItem[]
  onClose: () => void
  onMutated: () => void
}

export function ValidationPanel({
  item,
  allProjects,
  onClose,
  onMutated,
}: ValidationPanelProps) {
  const t = useTranslations('validation')
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionEntry[] | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [changingProject, setChangingProject] = useState(false)
  const [newProjectId, setNewProjectId] = useState(item.projectId)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load trajectory whenever the item changes
  useEffect(() => {
    setSessions(null)
    setIsLoadingSessions(true)
    setChangingProject(false)
    setNewProjectId(item.projectId)
    setError(null)
    getSessionTrajectory(item.planningId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setIsLoadingSessions(false))
  }, [item.id, item.planningId])

  function handleValidate() {
    setError(null)
    startTransition(async () => {
      try {
        await validateAssignment(item.id)
        router.refresh()
        onMutated()
      } catch {
        setError(t('saveError'))
      }
    })
  }

  function handleChangeProject() {
    if (!changingProject) {
      setChangingProject(true)
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await changeProjectAssignment(item.id, newProjectId)
        router.refresh()
        onMutated()
        setChangingProject(false)
      } catch {
        setError(t('saveError'))
      }
    })
  }

  const activeProjects = allProjects.filter((p) => p.is_active)
  const canValidate = item.status !== 'validated'
  const assignmentBadge =
    item.status === 'pending'
      ? 'secondary'
      : item.status === 'validated'
      ? 'default'
      : 'outline'

  return (
    <div className="flex w-[400px] shrink-0 flex-col rounded-lg border bg-background">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{item.groupName}</span>
            <span className="text-muted-foreground text-sm truncate">
              {item.schoolName}
            </span>
          </div>
          <Badge variant={assignmentBadge} className="mt-1">
            {t(`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`)}
          </Badge>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>

      {/* Assignment info */}
      <div className="border-b px-4 py-3 space-y-1.5 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">{t('assignedProject')}</span>
          <p className="font-medium">
            {item.projectName}
            {item.materialType && (
              <span className="ml-1.5 text-muted-foreground font-normal text-xs">
                · {item.materialType}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <span>
            {t('assignedBy')}{' '}
            <span className="text-foreground font-medium">{item.assignedByName}</span>
          </span>
          <span>
            {new Date(item.assignedAt).toLocaleDateString()}
          </span>
        </div>
        {item.validatedByName && (
          <div className="text-xs text-muted-foreground">
            {t('validatedBy')}{' '}
            <span className="text-foreground font-medium">{item.validatedByName}</span>
            {item.validatedAt && (
              <span> · {new Date(item.validatedAt).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-b px-4 py-3 space-y-3">
        {error && <p className="text-xs text-destructive">{error}</p>}

        {changingProject ? (
          <div className="space-y-2">
            <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              disabled={isPending}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.material_type ? ` — ${p.material_type}` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending || newProjectId === item.projectId}
                onClick={handleChangeProject}
                className="flex-1"
              >
                {isPending ? '...' : t('confirmChange')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setChangingProject(false)
                  setNewProjectId(item.projectId)
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {canValidate && (
              <Button size="sm" disabled={isPending} onClick={handleValidate}>
                {isPending ? '...' : t('validate')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setChangingProject(true)}
            >
              {t('changeProject')}
            </Button>
          </div>
        )}
      </div>

      {/* Session trajectory */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {t('sessionTrajectory')}
        </p>
        {isLoadingSessions ? (
          <p className="text-xs text-muted-foreground">{t('loading')}</p>
        ) : sessions === null || sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noSessions')}</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-md border bg-muted/30 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {new Date(s.sessionDate).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {s.trafficLight && (
                      <span
                        className={cn(
                          'size-2.5 rounded-full shrink-0',
                          TRAFFIC_DOT[s.trafficLight]
                        )}
                      />
                    )}
                    <Badge
                      variant={STATUS_VARIANT[s.status] ?? 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {t(`sessionStatus${s.status.charAt(0).toUpperCase() + s.status.slice(1)}`)}
                    </Badge>
                  </div>
                </div>
                {s.projectName && (
                  <p className="text-muted-foreground">{s.projectName}</p>
                )}
                {s.teacherComment && (
                  <p className="text-muted-foreground line-clamp-2 italic">
                    "{s.teacherComment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
