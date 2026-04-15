'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertStudentsAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('students')) {
    throw new Error('Unauthorized')
  }
}

export async function updateStudent(
  id: string,
  firstName: string,
  lastName: string
): Promise<void> {
  await assertStudentsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update({ first_name: firstName.trim(), last_name: lastName.trim() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleStudentStatus(id: string): Promise<void> {
  await assertStudentsAccess()
  const supabase = await createClient()

  const { data, error: fetchError } = await supabase
    .from('students')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError || !data) throw new Error(fetchError?.message ?? 'Not found')

  const newStatus = data.status === 'active' ? 'inactive' : 'active'
  const { error } = await supabase
    .from('students')
    .update({ status: newStatus })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateEvaluationMultiplier(
  evaluationId: string,
  multiplierPct: number
): Promise<void> {
  await assertStudentsAccess()
  const clamped = Math.min(200, Math.max(20, Math.round(multiplierPct)))
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_evaluations')
    .update({ xp_multiplier_pct: clamped })
    .eq('id', evaluationId)
  if (error) throw new Error(error.message)
}
