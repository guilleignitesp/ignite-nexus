import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse 70% 50% at 15% 10%, rgba(251,176,59,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 60% 40% at 85% 90%, rgba(62,111,168,0.08) 0%, transparent 55%),
        linear-gradient(160deg, #FBF6EC 0%, #F4F8FD 50%, #EDF3FA 100%)
      `,
      padding: '24px',
      fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif',
    }}>
      <LoginForm locale={locale} />
    </div>
  )
}
