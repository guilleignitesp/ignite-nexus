'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { upsertModulePermission, setSuperAdmin } from '@/lib/actions/teachers'
import type { WorkerPermission } from '@/lib/data/teachers'

const MODULES = [
  { key: 'sessions_dashboard', labelKey: 'sessionsDashboard' },
  { key: 'schools', labelKey: 'schools' },
  { key: 'teachers', labelKey: 'teachers' },
  { key: 'students', labelKey: 'students' },
  { key: 'projects', labelKey: 'projects' },
  { key: 'skills', labelKey: 'skills' },
  { key: 'project_maps', labelKey: 'projectMaps' },
  { key: 'validation', labelKey: 'validation' },
  { key: 'enrollments', labelKey: 'enrollments' },
  { key: 'resources', labelKey: 'resources' },
  { key: 'attitudes', labelKey: 'attitudes' },
  { key: 'timesheet', labelKey: 'timesheet' },
  { key: 'absences', labelKey: 'absences' },
  { key: 'stock', labelKey: 'stock' },
] as const

type PermMap = Record<string, { can_view: boolean; can_edit: boolean }>

function buildPermMap(permissions: WorkerPermission[]): PermMap {
  const map: PermMap = {}
  for (const mod of MODULES) {
    map[mod.key] = { can_view: false, can_edit: false }
  }
  for (const p of permissions) {
    if (p.module === 'superadmin') continue
    if (map[p.module] !== undefined) {
      map[p.module] = { can_view: p.can_view, can_edit: p.can_edit }
    }
  }
  return map
}

interface PermissionsGridProps {
  workerId: string
  initialPermissions: WorkerPermission[]
  currentUserIsSuperAdmin: boolean
}

export function PermissionsGrid({
  workerId,
  initialPermissions,
}: PermissionsGridProps) {
  const t = useTranslations('teachers')
  const tAdmin = useTranslations('admin')
  const router = useRouter()

  const [permMap, setPermMap] = useState<PermMap>(() =>
    buildPermMap(initialPermissions)
  )
  const [isSuperAdminActive, setIsSuperAdminActive] = useState(
    () => initialPermissions.some((p) => p.is_superadmin)
  )
  const [pendingModule, setPendingModule] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [superAdminPending, startSuperAdminTransition] = useTransition()

  function handleModuleChange(
    module: string,
    field: 'can_view' | 'can_edit',
    checked: boolean
  ) {
    const prev = permMap[module]
    let canView = field === 'can_view' ? checked : prev.can_view
    let canEdit = field === 'can_edit' ? checked : prev.can_edit

    // Business rules
    if (field === 'can_edit' && checked) canView = true
    if (field === 'can_view' && !checked) canEdit = false

    // Optimistic update
    setPermMap((m) => ({ ...m, [module]: { can_view: canView, can_edit: canEdit } }))
    setPendingModule(module)

    startTransition(async () => {
      try {
        await upsertModulePermission(workerId, module, canView, canEdit)
        router.refresh()
      } catch {
        // Revert
        setPermMap((m) => ({ ...m, [module]: prev }))
      } finally {
        setPendingModule(null)
      }
    })
  }

  function handleSuperAdminToggle(enabled: boolean) {
    setIsSuperAdminActive(enabled)

    startSuperAdminTransition(async () => {
      try {
        await setSuperAdmin(workerId, enabled)
        router.refresh()
      } catch {
        setIsSuperAdminActive(!enabled)
      }
    })
  }

  const tableDisabled = isSuperAdminActive

  return (
    <div className="space-y-4">
      {/* Superadmin card */}
      <div className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">{t('superadminLabel')}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('superadminDescription')}
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="accent-primary size-4 cursor-pointer"
              checked={isSuperAdminActive}
              disabled={superAdminPending}
              onChange={(e) => handleSuperAdminToggle(e.target.checked)}
            />
          </label>
        </div>
        {isSuperAdminActive && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            {t('superadminActiveWarning')}
          </p>
        )}
      </div>

      {/* Module permissions table */}
      <div
        className={`rounded-lg border transition-opacity ${tableDisabled ? 'pointer-events-none opacity-40' : ''}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Módulo</th>
              <th className="px-4 py-2.5 text-center font-medium">
                {t('colCanView')}
              </th>
              <th className="px-4 py-2.5 text-center font-medium">
                {t('colCanEdit')}
              </th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => {
              const perm = permMap[mod.key]
              const isModPending =
                isPending && pendingModule === mod.key

              return (
                <tr
                  key={mod.key}
                  className={`border-b last:border-0 transition-opacity ${isModPending ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    {tAdmin(mod.labelKey as Parameters<typeof tAdmin>[0])}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="checkbox"
                      className="accent-primary size-4 cursor-pointer"
                      checked={perm.can_view}
                      disabled={tableDisabled || isModPending}
                      onChange={(e) =>
                        handleModuleChange(mod.key, 'can_view', e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="checkbox"
                      className="accent-primary size-4 cursor-pointer"
                      checked={perm.can_edit}
                      disabled={tableDisabled || isModPending}
                      onChange={(e) =>
                        handleModuleChange(mod.key, 'can_edit', e.target.checked)
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
