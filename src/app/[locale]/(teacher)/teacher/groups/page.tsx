import Link from 'next/link'
import { requireWorker } from '@/lib/auth'
import { getAllGroupsForTeacher } from '@/lib/data/teacher'
import { Button } from '@/components/ui/button'

const WEEKDAY_LABEL: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie',
}

export default async function AllGroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireWorker(locale)

  const schools = await getAllGroupsForTeacher()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Todos los grupos</h1>
      </div>

      {schools.map((school) => (
        <section key={school.schoolId} className="space-y-3">
          <h2 className="text-base font-semibold">{school.schoolName}</h2>
          {school.groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin grupos activos</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {school.groups.map((group) => (
                <div
                  key={group.groupId}
                  className="rounded-lg border bg-card p-4 space-y-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{group.groupName}</p>
                      {group.ageRange && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: '#4A6580',
                          background: 'rgba(62,111,168,0.08)', borderRadius: 20,
                          padding: '3px 10px',
                        }}>
                          {group.ageRange}
                        </span>
                      )}
                    </div>
                    {group.schedule.length > 0 ? (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {group.schedule
                          .sort((a, b) => a.weekday - b.weekday)
                          .map((s) =>
                            `${WEEKDAY_LABEL[s.weekday] ?? s.weekday} ${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}`
                          )
                          .join(' · ')}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">Sin horario</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/${locale}/teacher/groups/${group.groupId}`} />}
                    nativeButton={false}
                  >
                    Ver grupo
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
