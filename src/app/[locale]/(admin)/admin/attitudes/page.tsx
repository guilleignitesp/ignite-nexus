import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getAttitudeActions } from '@/lib/data/attitudes'
import { AttitudesList } from '@/components/admin/attitudes/AttitudesList'

export default async function AttitudesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, actions] = await Promise.all([
    getTranslations('attitudes'),
    getAttitudeActions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <AttitudesList actions={actions} />
    </div>
  )
}
