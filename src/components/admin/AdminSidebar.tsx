'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  BookOpen,
  Sparkles,
  Map,
  CheckSquare,
  CalendarDays,
  UserPlus,
  Globe,
  Heart,
  Clock,
  UserX,
  Package,
  Settings,
  LogOut,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

interface AdminSidebarProps {
  locale: string
  adminModules: string[]
  isSuperAdmin: boolean
}

export function AdminSidebar({ locale, adminModules, isSuperAdmin }: AdminSidebarProps) {
  const t = useTranslations('admin')
  const pathname = usePathname()

  const base = `/${locale}/admin`

  function isActive(path: string) {
    return pathname.startsWith(`${base}${path}`)
  }

  const operativaItems = [
    { key: 'sessions_dashboard', label: t('sessionsDashboard'), icon: CalendarDays, href: '/sessions' },
    { key: 'schools',            label: t('schools'),           icon: School,       href: '/schools' },
    { key: 'teachers',           label: t('teachers'),          icon: Users,        href: '/teachers' },
    { key: 'students',           label: t('students'),          icon: GraduationCap,href: '/students' },
    { key: 'projects',           label: t('projects'),          icon: BookOpen,     href: '/projects' },
    { key: 'skills',             label: t('skills'),            icon: Sparkles,     href: '/skills' },
    { key: 'project_maps',       label: t('projectMaps'),       icon: Map,          href: '/project-maps' },
    { key: 'validation',         label: t('validation'),        icon: CheckSquare,  href: '/validation' },
    { key: 'enrollments',        label: t('enrollments'),       icon: UserPlus,     href: '/enrollments' },
    { key: 'resources',          label: t('resources'),         icon: Globe,        href: '/resources' },
    { key: 'attitudes',          label: t('attitudes'),         icon: Heart,        href: '/attitudes' },
  ]

  const rrhhItems = [
    { key: 'timesheet', label: t('timesheet'), icon: Clock, href: '/timesheet' },
    { key: 'absences',  label: t('absences'),  icon: UserX, href: '/absences' },
  ]

  const stockItems = [
    { key: 'stock', label: t('stock'), icon: Package, href: '/stock' },
  ]

  const visibleOperativa = operativaItems.filter(
    (item) => isSuperAdmin || adminModules.includes(item.key)
  )
  const visibleRrhh = rrhhItems.filter(
    (item) => isSuperAdmin || adminModules.includes(item.key)
  )
  const visibleStock = stockItems.filter(
    (item) => isSuperAdmin || adminModules.includes(item.key)
  )

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="text-lg font-bold tracking-tight text-primary">
          IGNITE NEXUS
        </span>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href={`${base}/dashboard`} />}
                isActive={isActive('/dashboard')}
              >
                <LayoutDashboard />
                <span>{t('dashboard')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Operativa / Pedagógica */}
        {visibleOperativa.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operativa</SidebarGroupLabel>
            <SidebarMenu>
              {visibleOperativa.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<Link href={`${base}${item.href}`} />}
                    isActive={isActive(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* RRHH */}
        {visibleRrhh.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>RRHH</SidebarGroupLabel>
            <SidebarMenu>
              {visibleRrhh.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<Link href={`${base}${item.href}`} />}
                    isActive={isActive(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Stock */}
        {visibleStock.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Stock</SidebarGroupLabel>
            <SidebarMenu>
              {visibleStock.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<Link href={`${base}${item.href}`} />}
                    isActive={isActive(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Configuración (solo superadmin) */}
        {isSuperAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href={`${base}/settings`} />}
                    isActive={isActive('/settings')}
                  >
                    <Settings />
                    <span>{t('settings')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={`/${locale}/login`} />}>
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
