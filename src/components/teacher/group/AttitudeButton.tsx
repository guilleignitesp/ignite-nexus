'use client'

import { useState } from 'react'
import { AttitudeModal } from './AttitudeModal'

interface AttitudeButtonProps {
  students: { studentId: string; firstName: string; lastName: string }[]
  sessionId?: string
}

export function AttitudeButton({ students, sessionId }: AttitudeButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 18px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #FBB03B 0%, #F59E0B 100%)',
          color: '#1E2D3D',
          border: 'none',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(251,176,59,0.35)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = '')}
      >
        <svg width="12" height="18" viewBox="7 2 16 31" fill="none">
          <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#1E2D3D"/>
        </svg>
        Actitud
      </button>
      <AttitudeModal
        open={open}
        onClose={() => setOpen(false)}
        students={students}
        sessionId={sessionId}
      />
    </>
  )
}
