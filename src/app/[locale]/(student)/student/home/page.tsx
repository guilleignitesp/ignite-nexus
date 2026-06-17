import { notFound } from 'next/navigation'
import { requireStudent } from '@/lib/auth'
import { getStudentPortalData } from '@/lib/data/student-portal'
import { StudentPortal } from '@/components/student/StudentPortal'

export default async function StudentHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const profile = await requireStudent(locale)
  const data = await getStudentPortalData(profile.studentId!, locale)

  if (!data) notFound()

  return <StudentPortal data={data} />
}
