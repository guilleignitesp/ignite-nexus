'use client'

import { useState, useRef } from 'react'
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
import { EvaluationModal } from './EvaluationModal'

interface FinalizeDialogProps {
  successors: { projectId: string; projectName: string; percentage: number | null; label: string | null }[]
  onConfirm: (args: {
    trafficLight: TrafficLight
    projectCompleted: boolean
    nextProjectId: string | null
  }) => void
  isPending: boolean
  sessionId: string
  planningId: string
  groupId: string
  projectId: string | null
  students: { studentId: string; firstName: string; lastName: string }[]
}

const TRAFFIC_OPTIONS: { value: TrafficLight; colorClass: string }[] = [
  { value: 'green',  colorClass: 'bg-green-500 hover:bg-green-600' },
  { value: 'yellow', colorClass: 'bg-yellow-400 hover:bg-yellow-500' },
  { value: 'orange', colorClass: 'bg-orange-500 hover:bg-orange-600' },
  { value: 'red',    colorClass: 'bg-red-500 hover:bg-red-600' },
]

export function FinalizeDialog({
  successors,
  onConfirm,
  isPending,
  sessionId,
  planningId,
  groupId,
  projectId,
  students,
}: FinalizeDialogProps) {
  const t = useTranslations('teacherGroup')
  const [open, setOpen] = useState(false)
  const [traffic, setTraffic] = useState<TrafficLight | null>(null)
  const [projectDone, setProjectDone] = useState(false)
  const [evalOpen, setEvalOpen] = useState(false)
  const goingToEval = useRef(false)

  const trafficLabels: Record<TrafficLight, string> = {
    green:  t('trafficGreen'),
    yellow: t('trafficYellow'),
    orange: t('trafficOrange'),
    red:    t('trafficRed'),
  }

  function handleConfirm() {
    if (!traffic) return
    if (projectDone && projectId) {
      goingToEval.current = true
      setOpen(false)
      setEvalOpen(true)
    } else {
      onConfirm({ trafficLight: traffic, projectCompleted: projectDone, nextProjectId: null })
      setOpen(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && !goingToEval.current) {
      setTraffic(null)
      setProjectDone(false)
    }
    if (!next) goingToEval.current = false
    setOpen(next)
  }

  function handleEvalCompleted(nextProjectId: string | null) {
    setEvalOpen(false)
    onConfirm({ trafficLight: traffic!, projectCompleted: true, nextProjectId })
    setTraffic(null)
    setProjectDone(false)
  }

  function handleEvalClose() {
    setEvalOpen(false)
    setTraffic(null)
    setProjectDone(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={
          <Button
            variant="outline"
            disabled={isPending}
            style={{ color: '#0F1C2E', borderColor: 'rgba(30,58,95,0.25)', background: 'transparent' }}
          />
        }>
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
              onChange={(e) => setProjectDone(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="project-done" className="text-sm font-medium cursor-pointer">
              {t('projectDoneLabel')}
            </label>
          </div>

          {/* Acciones */}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t('cancelFinalize')}
            </DialogClose>
            <Button onClick={handleConfirm} disabled={!traffic || isPending}>
              {projectDone && projectId ? 'Continuar a evaluación' : t('confirmFinalize')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {projectId && (
        <EvaluationModal
          open={evalOpen}
          onClose={handleEvalClose}
          onCompleted={handleEvalCompleted}
          projectId={projectId}
          planningId={planningId}
          sessionId={sessionId}
          groupId={groupId}
          successors={successors}
          preloadedStudents={students}
        />
      )}
    </>
  )
}
