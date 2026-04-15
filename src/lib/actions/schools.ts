'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertSchoolsAccess() {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('schools')) {
    throw new Error('Unauthorized')
  }
}

export async function createSchool(name: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('schools')
    .insert({ name: name.trim(), is_active: true })
  if (error) throw new Error(error.message)
  updateTag('schools')
}

export async function createGroup(input: {
  name: string
  schoolId: string
  schoolYearId: string | null
  schedule: { weekday: number; start_time: string; end_time: string }[]
  teacherIds: string[]
}): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: input.name.trim(),
      school_id: input.schoolId,
      school_year_id: input.schoolYearId,
      is_active: true,
    })
    .select('id')
    .single()
  if (groupError) throw new Error(groupError.message)

  if (input.schedule.length > 0) {
    const { error: scheduleError } = await supabase.from('group_schedule').insert(
      input.schedule.map((s) => ({
        group_id: group.id,
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
      }))
    )
    if (scheduleError) throw new Error(scheduleError.message)
  }

  if (input.teacherIds.length > 0) {
    const today = new Date().toISOString().slice(0, 10)
    const { error: assignError } = await supabase.from('group_assignments').insert(
      input.teacherIds.map((workerId) => ({
        group_id: group.id,
        worker_id: workerId,
        start_date: today,
        end_date: null,
      }))
    )
    if (assignError) throw new Error(assignError.message)
  }

  updateTag('schools')
}
