'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
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
  lastName: string
): Promise<void> {
  await assertTeachersAccess()
  const supabase = await createClient()
  const { error } = await supabase.from('workers').insert({
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

  const { data, error: fetchError } = await supabase
    .from('workers')
    .select('status')
    .eq('id', workerId)
    .single()

  if (fetchError || !data) throw new Error(fetchError?.message ?? 'Not found')

  const newStatus = data.status === 'active' ? 'inactive' : 'active'

  const { error: updateError } = await supabase
    .from('workers')
    .update({ status: newStatus })
    .eq('id', workerId)

  if (updateError) throw new Error(updateError.message)
  updateTag('workers')
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
