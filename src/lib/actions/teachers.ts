'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getUserProfile } from '@/lib/auth'

async function assertTeachersAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('teachers')) {
    throw new Error('Unauthorized')
  }
}

async function assertSuperAdmin_(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile?.isSuperAdmin) throw new Error('Unauthorized')
}

export async function createWorker(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<void> {
  await assertTeachersAccess()
  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  const { error } = await adminClient.from('workers').insert({
    user_id: authData.user.id,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    status: 'active',
  })
  if (error) throw new Error(error.message)
  updateTag('workers')
}

export async function toggleWorkerStatus(workerId: string): Promise<void> {
  await assertTeachersAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data, error: fetchError } = await supabase
    .from('workers')
    .select('status, user_id')
    .eq('id', workerId)
    .single()

  if (fetchError || !data) throw new Error(fetchError?.message ?? 'Not found')

  const { status, user_id } = data as { status: string; user_id: string | null }
  const newStatus = status === 'active' ? 'inactive' : 'active'

  const { error: updateError } = await supabase
    .from('workers')
    .update({ status: newStatus })
    .eq('id', workerId)
  if (updateError) throw new Error(updateError.message)

  if (user_id) {
    await adminClient.auth.admin.updateUserById(user_id, {
      ban_duration: newStatus === 'inactive' ? '876000h' : 'none',
    })
  }

  if (newStatus === 'inactive') {
    const today = new Date().toISOString().slice(0, 10)

    const { data: futureSessions } = await supabase
      .from('sessions')
      .select('id')
      .gte('session_date', today)

    const futureSessionIds = (futureSessions ?? []).map((s: { id: string }) => s.id)

    const [assignErr, sessionErr] = await Promise.all([
      supabase
        .from('group_assignments')
        .update({ end_date: today, is_active: false })
        .eq('worker_id', workerId)
        .is('end_date', null)
        .then((r) => r.error),
      futureSessionIds.length > 0
        ? supabase
            .from('session_teacher_assignments')
            .update({ is_active: false })
            .eq('worker_id', workerId)
            .eq('is_active', true)
            .in('session_id', futureSessionIds)
            .then((r) => r.error)
        : Promise.resolve(null),
    ])

    if (assignErr) throw new Error(assignErr.message)
    if (sessionErr) throw new Error(sessionErr.message)

    updateTag('schools')
  }

  updateTag('workers')
}

export async function updateWorkerInfo(
  workerId: string,
  firstName: string,
  lastName: string,
  email?: string
): Promise<void> {
  await assertTeachersAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { error } = await supabase
    .from('workers')
    .update({ first_name: firstName.trim(), last_name: lastName.trim() })
    .eq('id', workerId)
  if (error) throw new Error(error.message)

  if (email?.trim()) {
    const { data: worker } = await supabase
      .from('workers')
      .select('user_id')
      .eq('id', workerId)
      .single()
    const userId = (worker as unknown as { user_id: string | null } | null)?.user_id
    if (userId) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
        email: email.trim(),
      })
      if (authError) throw new Error(authError.message)
    }
  }

  updateTag('workers')
}

export async function changeWorkerPassword(
  workerId: string,
  newPassword: string
): Promise<void> {
  await assertTeachersAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: worker } = await supabase
    .from('workers')
    .select('user_id')
    .eq('id', workerId)
    .single()
  const userId = (worker as unknown as { user_id: string | null } | null)?.user_id
  if (!userId) throw new Error('No auth user linked to this worker')

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) throw new Error(error.message)
}

export async function getWorkerEmail(workerId: string): Promise<string | null> {
  await assertTeachersAccess()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: worker } = await supabase
    .from('workers')
    .select('user_id')
    .eq('id', workerId)
    .single()
  const userId = (worker as unknown as { user_id: string | null } | null)?.user_id
  if (!userId) return null

  const { data: authData } = await adminClient.auth.admin.getUserById(userId)
  return authData?.user?.email ?? null
}

export async function upsertModulePermission(
  workerId: string,
  module: string,
  canView: boolean,
  canEdit: boolean
): Promise<void> {
  await assertSuperAdmin_()
  const supabase = await createClient()

  if (!canView && !canEdit) {
    const { error } = await supabase
      .from('admin_permissions')
      .delete()
      .eq('worker_id', workerId)
      .eq('module', module)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('admin_permissions')
      .upsert(
        {
          worker_id: workerId,
          module,
          can_view: canView,
          can_edit: canEdit && canView,
          is_superadmin: false,
        },
        { onConflict: 'worker_id,module' }
      )
    if (error) throw new Error(error.message)
  }

  updateTag('workers')
}

export async function setSuperAdmin(
  workerId: string,
  enabled: boolean
): Promise<void> {
  await assertSuperAdmin_()
  const supabase = await createClient()

  if (enabled) {
    const { error } = await supabase
      .from('admin_permissions')
      .upsert(
        {
          worker_id: workerId,
          module: 'superadmin',
          can_view: true,
          can_edit: true,
          is_superadmin: true,
        },
        { onConflict: 'worker_id,module' }
      )
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('admin_permissions')
      .delete()
      .eq('worker_id', workerId)
      .eq('module', 'superadmin')
    if (error) throw new Error(error.message)
  }

  updateTag('workers')
}
