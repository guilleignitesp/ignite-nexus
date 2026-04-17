'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

// ─── Guard ─────────────────────────────────────────────────────────────────

async function assertTimesheetAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('timesheet')) {
    throw new Error('Unauthorized')
  }
}

// ─── addTimesheetEntry ─────────────────────────────────────────────────────

export async function addTimesheetEntry(
  workerId: string,
  type: 'in' | 'out',
  recordedAt: string // ISO datetime string
): Promise<void> {
  await assertTimesheetAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('timesheets')
    .insert({ worker_id: workerId, type, recorded_at: recordedAt })

  if (error) throw new Error(error.message)
}

// ─── updateTimesheetEntry ──────────────────────────────────────────────────

export async function updateTimesheetEntry(id: string, recordedAt: string): Promise<void> {
  await assertTimesheetAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('timesheets')
    .update({ recorded_at: recordedAt })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── deleteTimesheetEntry ──────────────────────────────────────────────────

export async function deleteTimesheetEntry(id: string): Promise<void> {
  await assertTimesheetAccess()
  const supabase = await createClient()

  const { error } = await supabase.from('timesheets').delete().eq('id', id)

  if (error) throw new Error(error.message)
}
