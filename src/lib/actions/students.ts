'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
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

export async function deleteAttitudeLog(logId: string): Promise<void> {
  await assertStudentsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('attitude_logs')
    .delete()
    .eq('id', logId)
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

// ─── Student auth management ───────────────────────────────────────────────

function normalizeNamePart(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function generatePassword(): string {
  // Avoids visually ambiguous characters (0, O, I, l, 1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(10)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export async function createStudentAccess(
  studentId: string
): Promise<{ email: string; password: string }> {
  await assertStudentsAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('first_name, last_name, user_id')
    .eq('id', studentId)
    .single()
  if (fetchError || !student) throw new Error('Student not found')

  const s = student as unknown as { first_name: string; last_name: string; user_id: string | null }
  if (s.user_id) throw new Error('Student already has an auth account')

  const normalFirst = normalizeNamePart(s.first_name)
  const normalLast = normalizeNamePart(s.last_name)
  const password = generatePassword()

  let finalEmail = ''
  let authUserId = ''

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = attempt === 0 ? '' : String(attempt + 1)
    const candidate = `${normalFirst}.${normalLast}${suffix}@ignitenexus.com`
    const { data, error: authError } = await adminClient.auth.admin.createUser({
      email: candidate,
      password,
      email_confirm: true,
    })
    if (!authError) {
      finalEmail = candidate
      authUserId = data.user.id
      break
    }
    if (!authError.message.toLowerCase().includes('already')) {
      throw new Error(authError.message)
    }
  }

  if (!finalEmail) throw new Error('Could not generate a unique email after 10 attempts')

  const { error: updateError } = await supabase
    .from('students')
    .update({ user_id: authUserId })
    .eq('id', studentId)
  if (updateError) throw new Error(updateError.message)

  return { email: finalEmail, password }
}

export async function getStudentAuthEmail(studentId: string): Promise<string | null> {
  await assertStudentsAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: student } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single()
  const userId = (student as unknown as { user_id: string | null } | null)?.user_id
  if (!userId) return null

  const { data: authData } = await adminClient.auth.admin.getUserById(userId)
  return authData?.user?.email ?? null
}

export async function changeStudentPassword(
  studentId: string,
  newPassword: string
): Promise<void> {
  await assertStudentsAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: student } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single()
  const userId = (student as unknown as { user_id: string | null } | null)?.user_id
  if (!userId) throw new Error('No auth account linked to this student')

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) throw new Error(error.message)
}
