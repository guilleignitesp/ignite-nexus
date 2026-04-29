import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const profile = await requireAdmin(locale)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar
          locale={locale}
          adminModules={profile.adminModules}
          isSuperAdmin={profile.isSuperAdmin}
        />
        <main className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium">IGNITE NEXUS</span>
          </div>
          <div className="h-full overflow-auto p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
