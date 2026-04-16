'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'
import type { SessionEntry } from '@/lib/data/validation'

async function assertValidationAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('validation')) {
    throw new Error('Unauthorized')
  }
}

export async function getSessionTrajectory(
  planningId: string
): Promise<SessionEntry[]> {
  await assertValidationAccess()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select(
      `id, session_date, status, traffic_light, teacher_comment,
      projects(id, name)`
    )
    .eq('planning_id', planningId)
    .order('session_date', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    sessionDate: s.session_date as string,
    status: s.status as string,
    trafficLight: s.traffic_light as string | null,
    teacherComment: s.teacher_comment as string | null,
    projectName:
      (s.projects as { name: string } | null)?.name ?? null,
  }))
}

export async function validateAssignment(id: string): Promise<void> {
  await assertValidationAccess()
  const profile = await getUserProfile()
  const supabase = await createClient()
  const { error } = await supabase
    .from('planning_project_log')
    .update({
      status: 'validated',
      validated_by: profile?.workerId ?? null,
      validated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function changeProjectAssignment(
  id: string,
  newProjectId: string
): Promise<void> {
  await assertValidationAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('planning_project_log')
    .update({ project_id: newProjectId, status: 'modified' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
