import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase-server'
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Guard: redirige si no tiene permisos de admin
  const profile = await requireAdmin(locale)

  // Obtener módulos a los que tiene acceso este admin
  let adminModules: string[] = []
  if (profile.workerId && !profile.isSuperAdmin) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('admin_permissions')
      .select('module')
      .eq('worker_id', profile.workerId)
      .eq('can_view', true)
    adminModules = data?.map((p) => p.module) ?? []
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar
          locale={locale}
          adminModules={adminModules}
          isSuperAdmin={profile.isSuperAdmin}
        />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center gap-2 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium">IGNITE NEXUS</span>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
