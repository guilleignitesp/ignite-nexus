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

function LogoFull() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg viewBox="0 0 48 48" height="30" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
        <g transform="translate(24,24)">
          <path d="M-16-16 L-10-16 M-16-16 L-16-10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
          <path d="M16 16 L10 16 M16 16 L16 10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
          <path d="M-16 16 L-10 16 M-16 16 L-16 10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
          <path d="M16-16 L10-16 M16-16 L16-10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
        </g>
        <g transform="translate(24.4,22.3) scale(.85)">
          <path d="M-3.2-15 L3.2-14 L6.4 4.6 L.8 4.6 L-.8 18.4 L-7.2-2.3 L-1.6-2.3Z" fill="#FBB03B" stroke="#FBB03B" strokeWidth="1.5" strokeLinejoin="round"/>
        </g>
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
        <span style={{ fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif', fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px', color: '#3E6FA8' }}>IGNITE</span>
        <span style={{ fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif', fontWeight: 500, fontSize: 18, letterSpacing: '-0.5px', color: '#2596BE', fontStyle: 'italic', marginLeft: 1 }}>NEXUS</span>
      </div>
    </div>
  )
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
        <Link href={`/${locale}/admin/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <LogoFull />
        </Link>
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
        <div style={{ padding: '4px 6px 8px' }}>
          <Link
            href={`/${locale}/teacher/home`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              color: '#92650A',
              background: 'rgba(251,176,59,0.10)',
              border: '1px solid rgba(251,176,59,0.25)',
              textDecoration: 'none',
            }}
          >
            <svg width="9" height="14" viewBox="7 2 16 31" fill="none">
              <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
            </svg>
            Panel profesor
          </Link>
        </div>
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
