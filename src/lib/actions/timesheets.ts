'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'
import type { TimesheetType } from '@/types'

async function getWorkerIdOrThrow(): Promise<string> {
  const profile = await getUserProfile()
  if (!profile?.workerId) throw new Error('Unauthorized')
  return profile.workerId
}

export async function recordTimesheet(type: TimesheetType): Promise<void> {
  const workerId = await getWorkerIdOrThrow()
  const supabase = await createClient()

  const { error } = await supabase
    .from('timesheets')
    .insert({ worker_id: workerId, type })

  if (error) throw new Error(error.message)
}
