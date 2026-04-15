'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertEnrollmentsAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('enrollments')) {
    throw new Error('Unauthorized')
  }
}

export interface BulkEnrollRow {
  firstName: string
  lastName: string
  groupId: string
}

export async function bulkEnroll(
  rows: BulkEnrollRow[]
): Promise<{ enrolled: number }> {
  if (rows.length === 0) return { enrolled: 0 }
  await assertEnrollmentsAccess()
  const supabase = await createClient()

  // Batch-insert students
  const { data: newStudents, error: studentsError } = await supabase
    .from('students')
    .insert(
      rows.map((r) => ({
        first_name: r.firstName.trim(),
        last_name: r.lastName.trim(),
        status: 'active',
      }))
    )
    .select('id')

  if (studentsError || !newStudents) throw new Error(studentsError?.message ?? 'Failed to create students')

  // Batch-insert enrollments (preserving order — newStudents[i] matches rows[i])
  const { error: enrollError } = await supabase
    .from('group_enrollments')
    .insert(
      newStudents.map((student, i) => ({
        student_id: student.id,
        group_id: rows[i].groupId,
        is_active: true,
      }))
    )

  if (enrollError) throw new Error(enrollError.message)
  return { enrolled: newStudents.length }
}

export async function bulkDeactivate(
  groupIds: string[]
): Promise<{ deactivated: number }> {
  if (groupIds.length === 0) return { deactivated: 0 }
  await assertEnrollmentsAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_enrollments')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .in('group_id', groupIds)
    .eq('is_active', true)
    .select('id')

  if (error) throw new Error(error.message)
  return { deactivated: data?.length ?? 0 }
}
