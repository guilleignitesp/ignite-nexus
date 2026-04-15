import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; groupId: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  return (
    <div className="space-y-4">
      <Link
        href={`/${locale}/admin/schools`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Escuelas y grupos
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">
        Detalle del grupo — próximamente
      </h1>
    </div>
  )
}
