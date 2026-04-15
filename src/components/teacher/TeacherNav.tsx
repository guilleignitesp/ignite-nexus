'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Clock,
  UserX,
  Globe,
  Map,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface TeacherNavProps {
  locale: string
  hasAdminAccess: boolean
}

export function TeacherNav({ locale, hasAdminAccess }: TeacherNavProps) {
  const t = useTranslations('teacher')
  const tRoles = useTranslations('roles')
  const pathname = usePathname()
  const base = `/${locale}/teacher`

  const navItems = [
    { label: t('home'),        icon: Home,  href: '/home' },
    { label: t('timesheet'),   icon: Clock, href: '/timesheet' },
    { label: t('absences'),    icon: UserX, href: '/absences' },
    { label: t('resources'),   icon: Globe, href: '/resources' },
    { label: t('projectMaps'), icon: Map,   href: '/project-maps' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href={`${base}/home`} className="mr-2 font-bold text-primary text-lg shrink-0">
          IGNITE NEXUS
        </Link>

        <Separator orientation="vertical" className="h-5 hidden sm:block" />

        {/* Nav items — escritorio */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              render={<Link href={`${base}${item.href}`} />}
              variant={pathname.startsWith(`${base}${item.href}`) ? 'secondary' : 'ghost'}
              size="sm"
            >
              <item.icon />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Cambiar a vista admin */}
          {hasAdminAccess && (
            <Button
              render={<Link href={`/${locale}/admin/dashboard`} />}
              variant="outline"
              size="sm"
            >
              <LayoutDashboard />
              <span className="hidden sm:inline">{tRoles('switchToAdmin')}</span>
            </Button>
          )}

          {/* Logout */}
          <Button
            render={<Link href={`/${locale}/login`} />}
            variant="ghost"
            size="sm"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}
