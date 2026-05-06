'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AttitudeModal } from './AttitudeModal'

interface AttitudeButtonProps {
  students: { studentId: string; firstName: string; lastName: string }[]
  sessionId?: string
}

export function AttitudeButton({ students, sessionId }: AttitudeButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Actitud
      </Button>
      <AttitudeModal
        open={open}
        onClose={() => setOpen(false)}
        students={students}
        sessionId={sessionId}
      />
    </>
  )
}
