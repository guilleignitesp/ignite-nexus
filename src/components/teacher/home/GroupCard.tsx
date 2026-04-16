import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Users, BookOpen, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TeacherGroupCard } from '@/lib/data/teacher'

const WEEKDAY_SHORT: Record<number, string> = {
  1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V',
}

function formatTime(t: string) {
  return t.slice(0, 5) // 'HH:MM:SS' → 'HH:MM'
}

interface GroupCardProps {
  group: TeacherGroupCard
  locale: string
}

export function GroupCard({ group, locale }: GroupCardProps) {
  const t = useTranslations('teacherHome')

  // Deduplica días y ordénalos
  const days = [...new Set(group.schedule.map((s) => s.weekday))].sort()
  // Primer slot del día — para mostrar el horario
  const firstSlot = group.schedule.length > 0 ? group.schedule[0] : null

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors">
      {/* Nombre + escuela */}
      <div>
        <p className="font-semibold text-base leading-tight">{group.groupName}</p>
        <p className="text-sm text-muted-foreground">{group.schoolName}</p>
      </div>

      {/* Horario */}
      {days.length > 0 && firstSlot ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex gap-0.5">
            {days.map((d) => (
              <span
                key={d}
                className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-xs font-medium"
              >
                {WEEKDAY_SHORT[d] ?? d}
              </span>
            ))}
          </span>
          <span>
            {formatTime(firstSlot.startTime)}–{formatTime(firstSlot.endTime)}
          </span>
        </div>
      ) : null}

      {/* Alumnos + proyecto */}
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{t('students', { count: group.activeStudentCount })}</span>
        </div>
        {group.currentProjectName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="truncate">{group.currentProjectName}</span>
          </div>
        )}
      </div>

      {/* Botón ver grupo */}
      <Button
        render={<Link href={`/${locale}/teacher/groups/${group.groupId}`} />}
        variant="outline"
        size="sm"
        className="mt-auto w-full"
      >
        Ver grupo
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
