import { cache } from 'react'
import { createClient } from './supabase-server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'

export interface UserProfile {
  id: string
  role: Role
  workerId?: string
  studentId?: string
  hasAdminAccess: boolean
  isSuperAdmin: boolean
  adminModules: string[]
}

// cache() deduplica llamadas dentro del mismo render tree (por request)
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Un solo query: worker + sus permisos de admin
  const { data: worker } = await supabase
    .from('workers')
    .select('id, status, admin_permissions(module, can_view, is_superadmin)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (worker) {
    const perms = (worker.admin_permissions as Array<{
      module: string
      can_view: boolean
      is_superadmin: boolean
    }>) ?? []

    return {
      id: user.id,
      role: 'worker',
      workerId: worker.id,
      hasAdminAccess: perms.length > 0,
      isSuperAdmin: perms.some((p) => p.is_superadmin),
      adminModules: perms.filter((p) => p.can_view).map((p) => p.module),
    }
  }

  // TODO: student auth (actualmente los alumnos no tienen cuenta en auth.users)
  return null
})

// Devuelve la ruta de inicio según rol — usada en redirecciones post-login
export function getRoleHomePath(profile: UserProfile, locale: string): string {
  if (profile.role === 'student') return `/${locale}/student/home`
  return `/${locale}/teacher/home` // workers siempre arrancan en vista profesor
}

export async function redirectByRole(locale: string): Promise<never> {
  const profile = await getUserProfile()
  if (!profile) redirect(`/${locale}/login`)
  redirect(getRoleHomePath(profile, locale))
}

export async function requireAuth(locale: string): Promise<UserProfile> {
  const profile = await getUserProfile()
  if (!profile) redirect(`/${locale}/login`)
  return profile
}

export async function requireWorker(locale: string): Promise<UserProfile> {
  const profile = await requireAuth(locale)
  if (profile.role !== 'worker') redirect(`/${locale}/login`)
  return profile
}

export async function requireAdmin(locale: string): Promise<UserProfile> {
  const profile = await requireAuth(locale)
  if (!profile.hasAdminAccess) redirect(`/${locale}/teacher/home`)
  return profile
}

export async function requireSuperAdmin(locale: string): Promise<UserProfile> {
  const profile = await requireAdmin(locale)
  if (!profile.isSuperAdmin) redirect(`/${locale}/admin/dashboard`)
  return profile
}
