import { getTranslations } from 'next-intl/server'
import { ExternalLink } from 'lucide-react'
import type { TeacherResource } from '@/lib/data/global-resources'

const TYPE_STYLE: Record<string, string> = {
  guide: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  presentation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

interface ResourcesListProps {
  resources: TeacherResource[]
}

export async function ResourcesList({ resources }: ResourcesListProps) {
  const t = await getTranslations('teacherResources')

  if (resources.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noResources')}</p>
  }

  return (
    <div className="space-y-2">
      {resources.map((r) => (
        <a
          key={r.id}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/40 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            {r.resourceType && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  TYPE_STYLE[r.resourceType] ?? 'bg-muted text-muted-foreground'
                }`}
              >
                {r.resourceType === 'guide'
                  ? t('typeGuide')
                  : r.resourceType === 'presentation'
                    ? t('typePresentation')
                    : r.resourceType}
              </span>
            )}
            <span className="text-sm font-medium truncate">{r.title}</span>
          </div>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>
      ))}
    </div>
  )
}
