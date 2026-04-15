import { createClient } from './supabase-server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'

export interface UserProfile {
  id: string         // auth.users id
  role: Role
  workerId?: string  // si es worker o admin
  studentId?: string // si es student
  hasAdminAccess: boolean
  isSuperAdmin: boolean
}

// Obtiene el perfil completo del usuario autenticado
// Consulta las tablas workers/students para determinar rol y permisos
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar en workers primero
  const { data: worker } = await supabase
    .from('workers')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (worker) {
    // Comprobar si tiene permisos de admin
    const { data: adminPermissions } = await supabase
      .from('admin_permissions')
      .select('module, is_superadmin')
      .eq('worker_id', worker.id)

    const hasAdminAccess = (adminPermissions?.length ?? 0) > 0
    const isSuperAdmin = adminPermissions?.some((p) => p.is_superadmin) ?? false

    return {
      id: user.id,
      role: 'worker',
      workerId: worker.id,
      hasAdminAccess,
      isSuperAdmin,
    }
  }

  // TODO: lógica de student cuando se implemente autenticación de alumnos
  // Por ahora los alumnos no tienen user_id en auth

  return null
}

// Redirige según el rol del usuario autenticado
export async function redirectByRole(locale: string): Promise<never> {
  const profile = await getUserProfile()

  if (!profile) {
    redirect(`/${locale}/login`)
  }

  switch (profile.role) {
    case 'worker':
      redirect(`/${locale}/teacher/home`)
    case 'admin':
      redirect(`/${locale}/admin/dashboard`)
    case 'student':
      redirect(`/${locale}/student/home`)
    default:
      redirect(`/${locale}/login`)
  }
}

// Guard para Server Components: redirige al login si no hay sesión
export async function requireAuth(locale: string): Promise<UserProfile> {
  const profile = await getUserProfile()

  if (!profile) {
    redirect(`/${locale}/login`)
  }

  return profile
}

// Guard para Server Components: redirige si no tiene rol de worker/admin
export async function requireWorker(locale: string): Promise<UserProfile> {
  const profile = await requireAuth(locale)

  if (profile.role !== 'worker') {
    redirect(`/${locale}/login`)
  }

  return profile
}

// Guard para Server Components: redirige si no tiene permisos de admin
export async function requireAdmin(locale: string): Promise<UserProfile> {
  const profile = await requireAuth(locale)

  if (!profile.hasAdminAccess) {
    redirect(`/${locale}/teacher/home`)
  }

  return profile
}
