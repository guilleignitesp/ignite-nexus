import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getStockLocations, getStockItems } from '@/lib/data/stock'
import { getActiveWorkers } from '@/lib/data/schools'
import { StockPageClient } from '@/components/admin/stock/StockPageClient'

export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAdmin(locale)

  const [t, locations, items, workers] = await Promise.all([
    getTranslations('adminStock'),
    getStockLocations(),
    getStockItems(),
    getActiveWorkers(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <StockPageClient locations={locations} items={items} workers={workers} />
    </div>
  )
}
