import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getWorkerProfile } from '@/lib/data/teachers'
import { getWorkerEmail } from '@/lib/actions/teachers'
import { PermissionsGrid } from '@/components/admin/teachers/PermissionsGrid'
import { TeacherProfileActions } from '@/components/admin/teachers/TeacherProfileActions'

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; workerId: string }>
}) {
  const { locale, workerId } = await params

  const currentUser = await requireAdmin(locale)
  const canManageTeachers =
    currentUser.isSuperAdmin || currentUser.adminModules.includes('teachers')

  const [t, worker, workerEmail] = await Promise.all([
    getTranslations('teachers'),
    getWorkerProfile(workerId),
    canManageTeachers ? getWorkerEmail(workerId).catch(() => null) : Promise.resolve(null),
  ])

  if (!worker) notFound()

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href={`/${locale}/admin/teachers`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('backToList')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {worker.first_name} {worker.last_name}
          </h1>
          {workerEmail && (
            <p className="mt-0.5 text-sm text-muted-foreground">{workerEmail}</p>
          )}
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              worker.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {worker.status === 'active' ? t('statusActive') : t('statusInactive')}
          </span>
        </div>

        {canManageTeachers && (
          <div className="flex flex-col items-end gap-3">
            <form
              action={async () => {
                'use server'
                const { toggleWorkerStatus } = await import('@/lib/actions/teachers')
                await toggleWorkerStatus(workerId)
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('toggleStatus')}
              </button>
            </form>
            <TeacherProfileActions
              workerId={workerId}
              firstName={worker.first_name}
              lastName={worker.last_name}
              email={workerEmail}
            />
          </div>
        )}
      </div>

      {/* Current groups */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('currentGroups')}</h2>
        {worker.current_groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noCurrentGroups')}</p>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">{t('colGroupName')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colSchool')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colStartDate')}</th>
                </tr>
              </thead>
              <tbody>
                {worker.current_groups.map((group) => (
                  <tr key={group.assignment_id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium">{group.group_name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {group.school_name}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {group.start_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin permissions — only for superadmin */}
      {currentUser.isSuperAdmin && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{t('permissionsTitle')}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('permissionsDescription')}
            </p>
          </div>
          <PermissionsGrid
            workerId={workerId}
            initialPermissions={worker.permissions}
            currentUserIsSuperAdmin={currentUser.isSuperAdmin}
          />
        </section>
      )}
    </div>
  )
}
