'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TrafficLight } from '@/lib/data/teacher'

interface FinalizeDialogProps {
  successors: { projectId: string; projectName: string }[]
  onConfirm: (args: {
    trafficLight: TrafficLight
    projectCompleted: boolean
    nextProjectId: string | null
  }) => void
  isPending: boolean
}

const TRAFFIC_OPTIONS: { value: TrafficLight; colorClass: string }[] = [
  { value: 'green',  colorClass: 'bg-green-500 hover:bg-green-600' },
  { value: 'yellow', colorClass: 'bg-yellow-400 hover:bg-yellow-500' },
  { value: 'orange', colorClass: 'bg-orange-500 hover:bg-orange-600' },
  { value: 'red',    colorClass: 'bg-red-500 hover:bg-red-600' },
]

export function FinalizeDialog({ successors, onConfirm, isPending }: FinalizeDialogProps) {
  const t = useTranslations('teacherGroup')
  const [open, setOpen] = useState(false)
  const [traffic, setTraffic] = useState<TrafficLight | null>(null)
  const [projectDone, setProjectDone] = useState(false)
  const [nextProjectId, setNextProjectId] = useState('')

  const trafficLabels: Record<TrafficLight, string> = {
    green:  t('trafficGreen'),
    yellow: t('trafficYellow'),
    orange: t('trafficOrange'),
    red:    t('trafficRed'),
  }

  function handleConfirm() {
    if (!traffic) return
    onConfirm({
      trafficLight: traffic,
      projectCompleted: projectDone,
      nextProjectId: projectDone && nextProjectId ? nextProjectId : null,
    })
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset state on close
      setTraffic(null)
      setProjectDone(false)
      setNextProjectId('')
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="default" disabled={isPending} />}>
        {t('finalize')}
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="space-y-5">
        <DialogTitle>{t('finalizeTitle')}</DialogTitle>

        {/* Semáforo */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('trafficLightLabel')}</p>
          <div className="flex gap-2">
            {TRAFFIC_OPTIONS.map(({ value, colorClass }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTraffic(value)}
                title={trafficLabels[value]}
                className={cn(
                  'h-10 w-10 rounded-full transition-all',
                  colorClass,
                  traffic === value
                    ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                    : 'opacity-60'
                )}
              />
            ))}
          </div>
        </div>

        {/* ¿Proyecto acabado? */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="project-done"
            checked={projectDone}
            onChange={(e) => {
              setProjectDone(e.target.checked)
              if (!e.target.checked) setNextProjectId('')
            }}
            className="h-4 w-4"
          />
          <label htmlFor="project-done" className="text-sm font-medium cursor-pointer">
            {t('projectDoneLabel')}
          </label>
        </div>

        {/* Selector siguiente proyecto */}
        {projectDone && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('nextProjectLabel')}</label>
            {successors.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noSuccessors')}</p>
            ) : (
              <select
                value={nextProjectId}
                onChange={(e) => setNextProjectId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">{t('nextProjectPlaceholder')}</option>
                {successors.map((s) => (
                  <option key={s.projectId} value={s.projectId}>
                    {s.projectName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Acciones */}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t('cancelFinalize')}
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={!traffic || isPending}
          >
            {t('confirmFinalize')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
