import { Figtree, Fraunces } from 'next/font/google'
import { requireStudent } from '@/lib/auth'

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
})

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireStudent(locale)
  return (
    <div
      className={`${figtree.variable} ${fraunces.variable} theme-student min-h-screen`}
      style={{ fontFamily: 'var(--font-figtree), system-ui, sans-serif' }}
    >
      {children}
    </div>
  )
}
