import { requireWorker } from '@/lib/auth'
import { TeacherNav } from '@/components/teacher/TeacherNav'
export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Guard: redirige al login si no hay sesión o no es worker
  const profile = await requireWorker(locale)

  return (
    <div className="min-h-screen flex flex-col">
      <TeacherNav
        locale={locale}
        hasAdminAccess={profile.hasAdminAccess}
      />
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
