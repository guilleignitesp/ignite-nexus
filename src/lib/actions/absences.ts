'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function getWorkerIdOrThrow(): Promise<string> {
  const profile = await getUserProfile()
  if (!profile?.workerId) throw new Error('Unauthorized')
  return profile.workerId
}

// ─── requestAbsence ────────────────────────────────────────────────────────

export async function requestAbsence(input: {
  reasonId: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  comment: string | null
}): Promise<void> {
  const workerId = await getWorkerIdOrThrow()
  const supabase = await createClient()

  const { error } = await supabase
    .from('absences')
    .insert({
      worker_id: workerId,
      reason_id: input.reasonId,
      start_date: input.startDate,
      end_date: input.endDate,
      comment: input.comment || null,
      status: 'pending',
    })

  if (error) throw new Error(error.message)
}

// ─── approveAbsence ────────────────────────────────────────────────────────

export async function approveAbsence(id: string): Promise<void> {
  const profile = await getUserProfile()
  if (!profile?.hasAdminAccess) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('absences')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── rejectAbsence ─────────────────────────────────────────────────────────

export async function rejectAbsence(id: string): Promise<void> {
  const profile = await getUserProfile()
  if (!profile?.hasAdminAccess) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('absences')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
