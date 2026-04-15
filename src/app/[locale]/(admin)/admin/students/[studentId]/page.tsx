import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getStudentProfile } from '@/lib/data/students'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditStudentDialog } from '@/components/admin/students/EditStudentDialog'
import { GroupsCard } from '@/components/admin/students/GroupsCard'
import { XPTrajectory } from '@/components/admin/students/XPTrajectory'
import { EvaluationHistory } from '@/components/admin/students/EvaluationHistory'
import { AttitudeLog } from '@/components/admin/students/AttitudeLog'

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>
}) {
  const { locale, studentId } = await params

  await requireAdmin(locale)

  const [t, student] = await Promise.all([
    getTranslations('students'),
    getStudentProfile(studentId),
  ])

  if (!student) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button
            size="sm"
            variant="ghost"
            className="-ml-2 text-muted-foreground"
            render={<Link href={`/${locale}/admin/students`} />}
          >
            {t('backToList')}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {student.last_name}, {student.first_name}
          </h1>
          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
            {student.status === 'active' ? t('statusActive') : t('statusInactive')}
          </Badge>
        </div>
        <EditStudentDialog student={student} />
      </div>

      {/* Groups */}
      <GroupsCard enrollments={student.group_enrollments} locale={locale} />

      {/* XP Trajectory */}
      <XPTrajectory xpEntries={student.student_xp} locale={locale} />

      {/* Evaluations */}
      <EvaluationHistory evaluations={student.project_evaluations} locale={locale} />

      {/* Attitude log */}
      <AttitudeLog logs={student.attitude_logs} locale={locale} />
    </div>
  )
}
