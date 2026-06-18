'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface LoginFormProps {
  locale: string
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', borderRadius: 12,
  border: '1px solid rgba(251,176,59,0.20)',
  background: 'rgba(255,255,255,0.8)',
  fontSize: 14, color: '#0F1C2E',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#4A6580',
  marginBottom: 6, display: 'block',
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(t('loginError'))
      setLoading(false)
      return
    }

    router.push(`/${locale}/auth/callback`)
  }

  return (
    <div style={{
      width: '100%', maxWidth: 420,
      background: 'rgba(255,253,248,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 24,
      border: '1px solid rgba(251,176,59,0.12)',
      boxShadow: '0 8px 40px rgba(30,58,95,0.10), 0 1px 0 rgba(255,255,255,0.8)',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, rgba(251,176,59,0.6) 0%, #FBB03B 50%, rgba(251,176,59,0.6) 100%)' }} />

      <div style={{ padding: '36px 36px 40px' }}>
        {/* Logo centered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <svg viewBox="0 0 48 48" height="48" aria-hidden style={{ display: 'block', marginBottom: 10 }}>
            <g transform="translate(24,24)">
              <path d="M-16-16 L-10-16 M-16-16 L-16-10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
              <path d="M16 16 L10 16 M16 16 L16 10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
              <path d="M-16 16 L-10 16 M-16 16 L-16 10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
              <path d="M16-16 L10-16 M16-16 L16-10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
            </g>
            <g transform="translate(24.4,22.3) scale(.85)">
              <path d="M-3.2-15 L3.2-14 L6.4 4.6 L.8 4.6 L-.8 18.4 L-7.2-2.3 L-1.6-2.3Z" fill="#FBB03B" stroke="#FBB03B" strokeWidth="1.5" strokeLinejoin="round"/>
            </g>
          </svg>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px', color: '#3E6FA8' }}>IGNITE</span>
            <span style={{ fontWeight: 500, fontSize: 22, letterSpacing: '-0.5px', color: '#2596BE', fontStyle: 'italic' }}>NEXUS</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#8BA3BC', marginTop: 6, letterSpacing: '0.3px' }}>
            El universo del aprendizaje
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F1C2E', textAlign: 'center', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
          Bienvenido de nuevo
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="email" style={LABEL_STYLE}>{t('email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={INPUT_STYLE}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(251,176,59,0.45)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(251,176,59,0.20)' }}
            />
          </div>

          <div>
            <label htmlFor="password" style={LABEL_STYLE}>{t('password')}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={INPUT_STYLE}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(251,176,59,0.45)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(251,176,59,0.20)' }}
            />
          </div>

          {error && (
            <p style={{ color: '#C0392B', fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: 'rgba(251,176,59,0.12)',
              border: '1.5px solid rgba(251,176,59,0.35)',
              color: '#92650A', fontSize: 14, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
              transition: 'background 0.15s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(251,176,59,0.20)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'rgba(251,176,59,0.12)' }}
          >
            {loading ? '...' : t('loginButton')}
          </button>
        </form>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#B0C4D4', marginTop: 24, marginBottom: 0 }}>
          Ignite Nexus · Plataforma educativa
        </p>
      </div>
    </div>
  )
}
