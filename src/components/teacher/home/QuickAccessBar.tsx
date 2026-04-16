import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Clock, UserX, Globe, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickAccessBarProps {
  locale: string
}

export function QuickAccessBar({ locale }: QuickAccessBarProps) {
  const t = useTranslations('teacherHome')
  const base = `/${locale}/teacher`

  const links = [
    { href: `${base}/timesheet`,    label: t('goToTimesheet'),    icon: Clock },
    { href: `${base}/absences`,     label: t('goToAbsences'),     icon: UserX },
    { href: `${base}/resources`,    label: t('goToResources'),    icon: Globe },
    { href: `${base}/project-maps`, label: t('goToProjectMaps'), icon: Map },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          render={<Link href={href} />}
          variant="outline"
          size="sm"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
