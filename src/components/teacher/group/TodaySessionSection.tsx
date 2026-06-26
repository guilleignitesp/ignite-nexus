'use client'

import { ActiveSessionForm } from './ActiveSessionForm'
import type { TodaySession, EnrolledStudent, ScheduleSlot } from '@/lib/data/teacher'

interface TodaySessionSectionProps {
  groupId: string
  planningId: string
  currentProjectId: string | null
  currentProjectName: string | null
  students: EnrolledStudent[]
  session: TodaySession | null
  sessionDate: string | null
  successors: { projectId: string; projectName: string; percentage: number | null; label: string | null }[]
  groupSchedule: ScheduleSlot[]
}

const SHELL: React.CSSProperties = {
  background: '#FEFCF8',
  borderRadius: 20,
  border: '1px solid rgba(251,176,59,0.12)',
  boxShadow: '0 1px 6px rgba(30,58,95,0.04)',
  overflow: 'hidden',
}

export function TodaySessionSection({
  groupId,
  planningId,
  currentProjectId,
  currentProjectName,
  students,
  session,
  successors,
}: TodaySessionSectionProps) {
  if (!session) {
    return (
      <section style={SHELL}>
        <SectionHeader />
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#8BA3BC' }}>
            No hay ninguna sesión pendiente.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section style={SHELL}>
      <SectionHeader />
      <div style={{ padding: '16px 20px' }}>
        <div style={{ borderRadius: 14, background: 'rgba(62,111,168,0.04)', padding: 16 }}>
          <ActiveSessionForm
            groupId={groupId}
            planningId={planningId}
            session={session}
            students={students}
            successors={successors}
            currentProjectId={currentProjectId}
            currentProjectName={currentProjectName}
          />
        </div>
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '1px solid rgba(251,176,59,0.10)',
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(251,176,59,0.04)',
    }}>
      <svg width="10" height="16" viewBox="7 2 16 31" fill="none">
        <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F1C2E', letterSpacing: '-0.1px' }}>
        Sesión de hoy
      </span>
    </div>
  )
}
