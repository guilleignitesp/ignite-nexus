'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { StudentPortalData } from '@/lib/data/student-portal'

type Theme    = 'amarillo' | 'caramelo' | 'bosque' | 'oceano' | 'nieve' | 'crepusculo' | 'neon' | 'cosmos'
type Lang     = 'es' | 'en' | 'ca'
type MascotId = 'spark' | 'ember' | 'pixel' | 'bolt' | 'nova' | 'sage'
type AccId    = 'none' | 'gafas' | 'gafas-sol' | 'sombrero' | 'gorra' | 'corona' | 'antenas' | 'halo' | 'bowtie' | 'mochila' | 'capa'
type BoltId   = 'sparkle' | 'ferri' | 'apfel' | 'teslo' | 'galaxi' | 'nextra' | 'goog' | 'spotif' | 'amazo' | 'netti'

// ─── Logos ────────────────────────────────────────────────────────────────────

function LogoFull() {
  return (
    <svg viewBox="0 0 230 45" height="32" aria-label="Ignite Nexus">
      <style>{`.t-i{font-family:'Figtree',sans-serif;font-weight:900;font-size:23px;letter-spacing:-.8px;fill:#3E6FA8}.t-n{font-family:'Figtree',sans-serif;font-weight:550;font-size:23px;letter-spacing:-.8px;fill:#2596BE;transform:skewX(-12deg);transform-origin:left}`}</style>
      <g transform="translate(24,22)">
        <path d="M-16-16 L-10-16 M-16-16 L-16-10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
        <path d="M16 16 L10 16 M16 16 L16 10" stroke="#2596BE" strokeWidth="1.5" fill="none"/>
        <path d="M-16 16 L-10 16 M-16 16 L-16 10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
        <path d="M16-16 L10-16 M16-16 L16-10" stroke="#7CB8F5" strokeWidth="1.5" fill="none"/>
        <g transform="scale(.85)">
          <path d="M-3.2-15 L3.2-14 L6.4 4.6 L.8 4.6 L-.8 18.4 L-7.2-2.3 L-1.6-2.3Z" fill="#FBB03B" stroke="#FBB03B" strokeWidth="1.5" strokeLinejoin="round"/>
        </g>
      </g>
      <text x="56" y="30" className="t-i">IGNITE</text>
      <text x="130" y="30" className="t-n">NEXUS</text>
    </svg>
  )
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 48 48" height="32" aria-hidden>
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
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ lang, onLangChange, profileMode, onCollapsedChange }: { lang: Lang; onLangChange: (l: Lang) => void; profileMode: 'alumno' | 'familia'; onCollapsedChange: (v: boolean) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  // Reset state and scroll to top on view switch
  useEffect(() => {
    setCollapsed(false)
    onCollapsedChange(false)
    setScrolled(false)
    window.scrollTo({ top: 0 })
  }, [profileMode])

  // Re-attach sentinel observer whenever profileMode changes (new sentinel in DOM)
  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let attempts = 0

    function attach() {
      const sentinel = document.getElementById('topbar-sentinel')
      if (!sentinel) {
        if (attempts++ < 20) setTimeout(attach, 100)
        return
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          // Only collapse if sentinel exited at the TOP (user scrolled down past hero)
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            setCollapsed(true)
            onCollapsedChange(true)
          } else if (entry.isIntersecting) {
            setCollapsed(false)
            onCollapsedChange(false)
          }
        },
        { threshold: 0 }
      )
      observer.observe(sentinel)
    }

    const timer = setTimeout(attach, 50)
    return () => {
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [profileMode])

  // Scroll listener for frosted-glass fade-in
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!langOpen) return
    const close = () => setLangOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [langOpen])

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: collapsed ? 'transparent' : scrolled ? 'rgba(254,243,198,0.85)' : 'transparent',
      backdropFilter: collapsed ? 'none' : scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: collapsed ? 'none' : scrolled ? 'blur(12px)' : 'none',
      borderBottom: collapsed ? 'none' : scrolled ? '1px solid var(--sp-border)' : 'none',
      height: collapsed ? 44 : 60,
      transition: 'height .25s ease, background 0.3s ease',
      pointerEvents: collapsed ? 'none' : undefined,
    }}>
      {/* Inner container — centered, max-width: 1400px extracted from HTML .topbar */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: collapsed ? '0 18px' : '0 24px',
        transition: 'padding .3s ease',
        position: 'relative',
      }}>
        {/* Full logo — left side, hides on collapse */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            cursor: 'pointer', flexShrink: 0,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity .25s ease',
            pointerEvents: collapsed ? 'none' : 'auto',
          }}
        >
          <LogoFull />
        </div>

        {/* Icon logo — centered, shows on collapse */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: collapsed ? 1 : 0,
            transition: 'opacity .25s ease',
            pointerEvents: collapsed ? 'auto' : 'none',
            zIndex: 200,
          }}
        >
          <LogoIcon />
        </div>

        {/* Language — pill (expanded) or dropdown (collapsed) */}
        <div style={{ marginLeft: collapsed ? 'auto' : 0, pointerEvents: 'all' }}>
          {!collapsed ? (
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '3px 4px', border: '1px solid rgba(255,255,255,0.7)' }}>
              {(['es', 'en', 'ca'] as Lang[]).map((l) => (
                <button key={l} onClick={() => onLangChange(l)} style={{
                  padding: '4px 8px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: lang === l ? 'var(--blue-dark)' : 'transparent',
                  color: lang === l ? '#fff' : 'var(--sp-muted)',
                }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setLangOpen(o => !o) }}
                style={{
                  padding: '5px 10px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.6)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 800,
                  background: 'rgba(255,255,255,0.5)', color: 'var(--blue-dark)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {lang.toUpperCase()} ▾
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: 'var(--warm)', borderRadius: 12,
                  border: '1px solid var(--sp-border)',
                  boxShadow: '0 4px 16px rgba(62,111,168,0.15)',
                  overflow: 'hidden', zIndex: 200,
                }}>
                  {(['es', 'en', 'ca'] as Lang[]).filter(l => l !== lang).map((l) => (
                    <button key={l} onClick={() => { onLangChange(l); setLangOpen(false) }} style={{
                      display: 'block', width: '100%', padding: '8px 16px',
                      border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: 'transparent', color: 'var(--blue-dark)',
                      textAlign: 'center' as const,
                    }}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── ProfileSwitcher ──────────────────────────────────────────────────────────

function ProfileSwitcher({ mode, onChange, collapsed }: { mode: 'alumno' | 'familia'; onChange: (m: 'alumno' | 'familia') => void; collapsed: boolean }) {
  const buttons: { id: 'alumno' | 'familia'; label: string; icon: React.ReactNode }[] = [
    {
      id: 'alumno', label: 'Alumno',
      icon: (
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="11" r="5" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M6 28c0-5.5 4.5-9 10-9s10 3.5 10 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'familia', label: 'Familia',
      icon: (
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
          <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="21" cy="11" r="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M4 28c0-4 3-7 7-7h10c4 0 7 3 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: collapsed ? 16 : 20,
      left: '50%', transform: 'translateX(-50%)',
      zIndex: 50,
      background: 'rgba(255,255,255,.55)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 40,
      border: '1px solid rgba(255,255,255,.70)',
      boxShadow: collapsed ? '0 2px 14px rgba(62,111,168,.18)' : '0 4px 24px rgba(62,111,168,.14)',
      padding: collapsed ? 4 : 5,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      transition: 'padding .3s ease, box-shadow .3s ease, bottom .3s ease',
    }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {buttons.map(({ id, label, icon }) => {
          const isActive = mode === id
          return (
            <button key={id} onClick={() => onChange(id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: collapsed ? 0 : 6,
              padding: collapsed ? '7px 10px' : '7px 16px',
              borderRadius: 32, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-figtree), system-ui, sans-serif',
              fontWeight: 700, fontSize: 12,
              color: isActive ? '#fff' : '#8aa4be',
              background: isActive ? 'var(--blue-dark)' : 'transparent',
              boxShadow: isActive ? '0 2px 10px rgba(62,111,168,.3)' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden',
              transition: 'background .2s, color .2s, box-shadow .2s, padding .3s, gap .3s',
            }}>
              <span style={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </span>
              <span style={{
                maxWidth: collapsed ? 0 : 80, opacity: collapsed ? 0 : 1,
                overflow: 'hidden',
                transition: 'max-width .3s ease, opacity .3s ease',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Scene SVGs ───────────────────────────────────────────────────────────────

function SceneAmarillo() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-am" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFCEF"/><stop offset="1" stopColor="#FBEABF"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-am)"/>
      <circle cx="400" cy="80" r="70" fill="#FBB03B" opacity=".10"/><circle cx="400" cy="80" r="46" fill="#FBB03B" opacity=".15"/><circle cx="400" cy="78" r="26" fill="#FBB03B" opacity=".85"/>
      <g fill="#FFFFFF" opacity=".8"><ellipse cx="150" cy="54" rx="32" ry="11"/><ellipse cx="170" cy="48" rx="19" ry="10"/><ellipse cx="640" cy="42" rx="28" ry="10"/></g>
      <path d="M0,126 L120,100 L240,124 L360,98 L480,122 L600,100 L720,122 L800,110 L800,280 L0,280Z" fill="#C6DBF3"/>
      <path d="M0,148 L160,124 L320,148 L480,124 L640,148 L800,134 L800,280 L0,280Z" fill="#7CB8F5"/>
      <path d="M0,162 Q200,144 400,158 Q600,174 800,152 L800,280 L0,280Z" fill="#5685BC"/>
      <g stroke="#2596BE" strokeWidth="1.1" fill="none" opacity=".28" strokeLinecap="round"><path d="M120,206 L120,194 L148,194 L148,204"/><path d="M560,208 L560,196 L588,196"/></g>
      <g fill="#FBB03B" opacity=".5"><path d="M150,28 L152,34 L158,36 L152,38 L150,44 L148,38 L142,36 L148,34Z"/><path d="M662,148 L664,154 L670,156 L664,158 L662,164 L660,158 L654,156 L660,154Z"/></g>
    </svg>
  )
}
function SceneCaramelo() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-ca" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF5E6"/><stop offset="1" stopColor="#FDDBB4"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-ca)"/>
      <circle cx="400" cy="72" r="64" fill="#F97316" opacity=".12"/><circle cx="400" cy="72" r="36" fill="#F97316" opacity=".82"/>
      <g fill="#FFFFFF" opacity=".7"><ellipse cx="160" cy="56" rx="28" ry="9"/><ellipse cx="640" cy="46" rx="24" ry="8"/></g>
      <path d="M0,160 Q100,130 200,158 Q300,185 400,155 Q500,125 600,158 Q700,185 800,155 L800,280 L0,280Z" fill="#FDBA74"/>
      <path d="M0,180 Q120,158 240,178 Q360,198 480,172 Q600,148 720,172 L800,165 L800,280 L0,280Z" fill="#FB923C"/>
      <path d="M0,200 Q200,182 400,198 Q600,214 800,192 L800,280 L0,280Z" fill="#EA580C"/>
      <g fill="#C2410C" opacity=".7"><path d="M160,180 Q160,158 172,158 Q184,158 184,180Z"/><path d="M550,170 Q550,148 565,148 Q580,148 580,170Z"/><path d="M700,185 Q700,165 712,165 Q724,165 724,185Z"/></g>
      <g fill="#FBB03B" opacity=".6"><path d="M60,46 L62,52 L68,54 L62,56 L60,62 L58,56 L52,54 L58,52Z"/><path d="M700,38 L702,44 L708,46 L702,48 L700,54 L698,48 L692,46 L698,44Z"/></g>
    </svg>
  )
}
function SceneBosque() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-bo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4FEF8"/><stop offset="1" stopColor="#DBF6E4"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-bo)"/>
      <circle cx="400" cy="80" r="58" fill="#FDE68A" opacity=".25"/><circle cx="400" cy="80" r="34" fill="#FCD34D" opacity=".7"/>
      <g fill="#FFFFFF" opacity=".8"><ellipse cx="160" cy="52" rx="32" ry="11"/><ellipse cx="640" cy="44" rx="28" ry="10"/></g>
      <path d="M0,128 L130,98 L260,126 L390,96 L520,124 L650,98 L780,124 L800,114 L800,280 L0,280Z" fill="#B7ECCB"/>
      <path d="M0,150 L160,124 L320,150 L480,124 L640,150 L800,134 L800,280 L0,280Z" fill="#5FE08C"/>
      <path d="M0,164 Q200,146 400,160 Q600,176 800,154 L800,280 L0,280Z" fill="#2F8C57"/>
      <g fill="#1E5E38"><path d="M120,158 L131,184 L109,184Z"/><path d="M120,146 L129,166 L111,166Z"/><path d="M250,162 L262,188 L238,188Z"/><path d="M250,150 L260,170 L240,170Z"/><path d="M560,156 L571,182 L549,182Z"/><path d="M560,144 L569,164 L551,164Z"/><path d="M680,160 L692,186 L668,186Z"/><path d="M680,148 L690,168 L670,168Z"/></g>
    </svg>
  )
}
function SceneOceano() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-oc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EDF8FF"/><stop offset="1" stopColor="#D6EEFF"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-oc)"/>
      <circle cx="400" cy="76" r="60" fill="#FBB03B" opacity=".12"/><circle cx="400" cy="76" r="30" fill="#FCC562" opacity=".85"/>
      <g fill="#FFFFFF" opacity=".8"><ellipse cx="170" cy="50" rx="30" ry="10"/><ellipse cx="630" cy="44" rx="26" ry="9"/></g>
      <rect x="0" y="118" width="800" height="162" fill="#8FD9F8"/>
      <path d="M0,146 Q120,132 240,146 T480,146 T720,146 T960,146 L800,280 L0,280Z" fill="#46C2F9"/>
      <path d="M0,182 Q140,166 280,182 T560,182 T840,182 L800,280 L0,280Z" fill="#1E93D4"/>
    </svg>
  )
}
function SceneNieve() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-nv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EEF2FF"/><stop offset="1" stopColor="#E0E7FF"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-nv)"/>
      <circle cx="400" cy="68" r="50" fill="#FFFFFF" opacity=".6"/><circle cx="400" cy="68" r="26" fill="#C7D2FE" opacity=".9"/>
      <g fill="#FFFFFF" opacity=".85"><ellipse cx="140" cy="50" rx="30" ry="11"/><ellipse cx="162" cy="44" rx="18" ry="9"/><ellipse cx="630" cy="40" rx="26" ry="9"/></g>
      <path d="M0,150 L100,90 L180,130 L260,70 L360,120 L450,60 L540,100 L640,50 L720,100 L800,70 L800,280 L0,280Z" fill="#C7D2FE"/>
      <path d="M0,168 L80,108 L160,148 L260,88 L360,138 L460,78 L560,118 L660,68 L740,108 L800,88 L800,280 L0,280Z" fill="#A5B4FC"/>
      <path d="M0,185 L100,130 L200,165 L300,110 L400,155 L500,100 L600,140 L700,90 L800,130 L800,280 L0,280Z" fill="#6366F1"/>
      <g fill="#FFFFFF" opacity=".95"><path d="M100,90 L104,82 L108,90Z"/><path d="M260,70 L265,60 L270,70Z"/><path d="M450,60 L456,48 L462,60Z"/><path d="M640,50 L646,38 L652,50Z"/></g>
    </svg>
  )
}
function SceneCrepusculo() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sky-cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2D1B33"/><stop offset="1" stopColor="#4A1560"/></linearGradient>
        <linearGradient id="sun-cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F59E0B"/><stop offset="1" stopColor="#EF4444"/></linearGradient>
      </defs>
      <rect width="800" height="280" fill="url(#sky-cr)"/>
      <circle cx="400" cy="130" r="100" fill="url(#sun-cr)" opacity=".35"/><circle cx="400" cy="130" r="48" fill="#F59E0B" opacity=".9"/>
      <g fill="#FFFFFF" opacity=".7"><circle cx="100" cy="40" r="1.5"/><circle cx="180" cy="70" r="1.2"/><circle cx="280" cy="30" r="1.8"/><circle cx="520" cy="50" r="1.4"/><circle cx="650" cy="25" r="2"/><circle cx="730" cy="65" r="1.3"/></g>
      <path d="M580 40 L630 90" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" opacity=".8"/><circle cx="580" cy="40" r="3" fill="#E879F9"/>
      <path d="M0,190 L120,150 L240,185 L360,148 L480,182 L600,150 L720,180 L800,155 L800,280 L0,280Z" fill="#4A2A57"/>
      <path d="M0,215 Q200,195 400,212 Q600,230 800,205 L800,280 L0,280Z" fill="#3D2347"/>
    </svg>
  )
}
function SceneNeon() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-ne" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#050510"/><stop offset="1" stopColor="#0A0A1F"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-ne)"/>
      <g fill="#FFFFFF" opacity=".6"><circle cx="80" cy="40" r="1.5"/><circle cx="200" cy="20" r="1"/><circle cx="350" cy="55" r="1.8"/><circle cx="490" cy="15" r="1.2"/><circle cx="620" cy="45" r="1.6"/><circle cx="750" cy="30" r="1.3"/></g>
      <g fill="none" stroke="#00FFC8" strokeWidth="1.5" opacity=".85"><rect x="60" y="120" width="40" height="80"/><rect x="110" y="100" width="30" height="100"/><rect x="150" y="80" width="50" height="120"/><rect x="560" y="90" width="50" height="110"/><rect x="620" y="110" width="35" height="90"/><rect x="665" y="70" width="45" height="130"/><rect x="720" y="100" width="30" height="100"/></g>
      <path d="M0,200 Q100,188 200,200 Q300,212 400,198 Q500,184 600,200 Q700,215 800,198 L800,280 L0,280Z" fill="#00FFC833"/>
      <path d="M0,220 Q200,210 400,220 Q600,230 800,215 L800,280 L0,280Z" fill="#00FFC822"/>
    </svg>
  )
}
function SceneCosmos() {
  return (
    <svg viewBox="0 0 800 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><linearGradient id="sky-co" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#222244"/><stop offset="1" stopColor="#15152e"/></linearGradient></defs>
      <rect width="800" height="280" fill="url(#sky-co)"/>
      <circle cx="400" cy="100" r="120" fill="#7c5cff" opacity=".09"/><circle cx="280" cy="80" r="90" fill="#e94560" opacity=".07"/>
      <g fill="#FFFFFF"><circle cx="70" cy="50" r="1.5"/><circle cx="150" cy="96" r="1.1"/><circle cx="230" cy="44" r="1.8"/><circle cx="320" cy="120" r="1.2"/><circle cx="400" cy="58" r="1.4"/><circle cx="480" cy="110" r="1.6"/><circle cx="540" cy="48" r="1.1"/><circle cx="600" cy="120" r="1.4"/><circle cx="690" cy="56" r="1.8"/><circle cx="750" cy="104" r="1.2"/></g>
      <g transform="translate(640,86)"><ellipse cx="0" cy="0" rx="58" ry="16" fill="none" stroke="#E94560" strokeWidth="3.5" opacity=".5"/><circle cx="0" cy="0" r="28" fill="#E94560"/><circle cx="-9" cy="-7" r="7" fill="#ff7088" opacity=".7"/></g>
      <circle cx="120" cy="200" r="16" fill="#A8B4F0"/><circle cx="113" cy="195" r="5" fill="#8b97d6" opacity=".6"/>
    </svg>
  )
}

const SCENES: Record<Theme, React.ReactNode> = {
  amarillo:   <SceneAmarillo />,
  caramelo:   <SceneCaramelo />,
  bosque:     <SceneBosque />,
  oceano:     <SceneOceano />,
  nieve:      <SceneNieve />,
  crepusculo: <SceneCrepusculo />,
  neon:       <SceneNeon />,
  cosmos:     <SceneCosmos />,
}

// ─── Palette data ─────────────────────────────────────────────────────────────

const PALETTES: { id: Theme; label: string; c1: string; c2: string; c3: string; locked?: number }[] = [
  { id: 'amarillo',   label: 'Clásico',    c1: '#FEF3C6', c2: '#7CB8F5', c3: '#FBB03B' },
  { id: 'caramelo',   label: 'Desierto',   c1: '#FFF5E6', c2: '#FDBA74', c3: '#EA580C' },
  { id: 'bosque',     label: 'Bosque',     c1: '#ECFDF3', c2: '#4ADE80', c3: '#166534' },
  { id: 'oceano',     label: 'Océano',     c1: '#E8F6FF', c2: '#38BDF8', c3: '#0284C7' },
  { id: 'nieve',      label: 'Nieve',      c1: '#F0F4FF', c2: '#A5B4FC', c3: '#4338CA' },
  { id: 'crepusculo', label: 'Crepúsculo', c1: '#2D1B33', c2: '#C084FC', c3: '#F59E0B', locked: 8 },
  { id: 'neon',       label: 'Neón',       c1: '#0A0A0F', c2: '#00FFC8', c3: '#FF3DFF', locked: 9 },
  { id: 'cosmos',     label: 'Cosmos',     c1: '#1a1a2e', c2: '#7c5cff', c3: '#e94560', locked: 10 },
]

// ─── Mascot & personalization data ───────────────────────────────────────────

const BOLT_PATH = 'M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z'

const BOLTS: { id: BoltId; name: string; tagline: string; minLevel: number; color: string; fill: string; stroke?: string; defs: string }[] = [
  { id: 'sparkle', name: 'Sparkle', tagline: 'El original · energía pura',        minLevel: 1, color: '#FBB03B', fill: '#FBB03B', defs: '' },
  { id: 'ferri',   name: 'Ferri',   tagline: 'Velocidad · potencia · pasión',     minLevel: 1, color: '#FF2800', fill: 'url(#ferri-g)', defs: '<linearGradient id="ferri-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6040"/><stop offset="1" stop-color="#CC1500"/></linearGradient>' },
  { id: 'apfel',   name: 'Apfel',   tagline: 'Diseño · simplicidad · magia',      minLevel: 2, color: '#A8A8B3', fill: 'url(#apfel-g)', defs: '<linearGradient id="apfel-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8E8ED"/><stop offset="1" stop-color="#8E8EA0"/></linearGradient>' },
  { id: 'teslo',   name: 'Teslo',   tagline: 'Eléctrico · futuro · silencioso',   minLevel: 3, color: '#FF2800', fill: 'url(#teslo-g)', defs: '<linearGradient id="teslo-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4040"/><stop offset="1" stop-color="#CC0000"/></linearGradient>' },
  { id: 'galaxi',  name: 'Galaxi',  tagline: 'Infinito · cosmos · innovación',    minLevel: 4, color: '#4FC3F7', fill: 'url(#galaxi-g)', stroke: '#4FC3F7', defs: '<linearGradient id="galaxi-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1428A0"/><stop offset="0.5" stop-color="#4FC3F7"/><stop offset="1" stop-color="#1428A0"/></linearGradient>' },
  { id: 'nextra',  name: 'Nextra',  tagline: 'Just do it · sin límites',          minLevel: 5, color: '#888',    fill: 'url(#nextra-g)', defs: '<linearGradient id="nextra-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#111"/><stop offset="1" stop-color="#555"/></linearGradient>' },
  { id: 'goog',    name: 'Goog',    tagline: 'Curiosidad · colores · saber',      minLevel: 5, color: '#4285F4', fill: 'url(#goog-g)', defs: '<linearGradient id="goog-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285F4"/><stop offset="0.33" stop-color="#34A853"/><stop offset="0.66" stop-color="#FBBC05"/><stop offset="1" stop-color="#EA4335"/></linearGradient>' },
  { id: 'spotif',  name: 'Spotif',  tagline: 'Ritmo · verde · música',            minLevel: 6, color: '#1DB954', fill: 'url(#spotif-g)', defs: '<linearGradient id="spotif-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1DB954"/><stop offset="1" stop-color="#148A3D"/></linearGradient>' },
  { id: 'amazo',   name: 'Amazo',   tagline: 'Todo · rápido · para ti',           minLevel: 7, color: '#FF9900', fill: 'url(#amazo-g)', defs: '<linearGradient id="amazo-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#E88000"/></linearGradient>' },
  { id: 'netti',   name: 'Netti',   tagline: 'Drama · épica · acción',            minLevel: 8, color: '#E50914', fill: 'url(#netti-g)', defs: '<linearGradient id="netti-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF2020"/><stop offset="1" stop-color="#8B0000"/></linearGradient>' },
]

const FRASES: { id: string; text: string; minLevel: number; icon: string }[] = [
  { id: 'ignite',   text: "¡Let's Ignite!",              minLevel: 1,  icon: '⚡' },
  { id: 'aprendo',  text: 'Aprendo un poco más cada día', minLevel: 1,  icon: '📚' },
  { id: 'error',    text: 'Los errores me hacen crecer',  minLevel: 1,  icon: '🌱' },
  { id: 'crear',    text: 'Crear es mi superpoder',       minLevel: 2,  icon: '✨' },
  { id: 'curioso',  text: 'La curiosidad no tiene límites', minLevel: 2, icon: '🔭' },
  { id: 'equipo',   text: 'Juntos llegamos más lejos',    minLevel: 3,  icon: '🤝' },
  { id: 'pregunta', text: 'Cada pregunta abre una puerta', minLevel: 3, icon: '🚪' },
  { id: 'reto',     text: 'Los retos son oportunidades',  minLevel: 4,  icon: '🏆' },
  { id: 'codigo',   text: 'El código es mi idioma',       minLevel: 4,  icon: '💻' },
  { id: 'persiste', text: 'Persistir es la clave',        minLevel: 5,  icon: '🔑' },
  { id: 'imagine',  text: 'Imagina, diseña, construye',   minLevel: 5,  icon: '🛠️' },
  { id: 'impacto',  text: 'Quiero cambiar el mundo',      minLevel: 6,  icon: '🌍' },
  { id: 'robot',    text: 'Dominaré la robótica',         minLevel: 6,  icon: '🤖' },
  { id: 'datos',    text: 'Los datos cuentan historias',  minLevel: 7,  icon: '📊' },
  { id: 'conecto',  text: 'Conecto ideas para innovar',   minLevel: 7,  icon: '💡' },
  { id: 'heroe',    text: 'Soy héroe de mi aprendizaje',  minLevel: 8,  icon: '⚔️' },
  { id: 'future',   text: 'El futuro lo construyo hoy',   minLevel: 9,  icon: '🚀' },
  { id: 'legend',   text: 'Seré una leyenda del código',  minLevel: 10, icon: '🌟' },
]

const MASCOTS: { id: MascotId; name: string; minLevel: number; desc: string; defaultColor: string; tipo: string }[] = [
  { id: 'spark', name: 'Spark', minLevel: 1,  desc: 'Bolita amistosa · el inicial', defaultColor: '#7ba6e2', tipo: 'Tipo Normal'  },
  { id: 'ember', name: 'Ember', minLevel: 1,  desc: 'Llama · espíritu de fuego',    defaultColor: '#f97316', tipo: 'Tipo Fuego'   },
  { id: 'pixel', name: 'Pixel', minLevel: 3,  desc: 'Robot · el hacker amigable',   defaultColor: '#8b5cf6', tipo: 'Tipo Técnico' },
  { id: 'bolt',  name: 'Bolt',  minLevel: 5,  desc: 'Rayo · velocidad pura',        defaultColor: '#FBB03B', tipo: 'Tipo Rayo'    },
  { id: 'nova',  name: 'Nova',  minLevel: 7,  desc: 'Planeta · energía cósmica',    defaultColor: '#e94560', tipo: 'Tipo Cosmos'  },
  { id: 'sage',  name: 'Sage',  minLevel: 10, desc: 'Brote · sabiduría del bosque', defaultColor: '#16a34a', tipo: 'Tipo Tierra'  },
]

const MASCOT_COLORS: { id: string; name: string; hex: string; minLevel: number }[] = [
  { id: 'normal',  name: 'Normal',  hex: '#7ba6e2', minLevel: 1  },
  { id: 'fuego',   name: 'Fuego',   hex: '#f97316', minLevel: 1  },
  { id: 'tecnico', name: 'Técnico', hex: '#8b5cf6', minLevel: 3  },
  { id: 'rayo',    name: 'Rayo',    hex: '#FBB03B', minLevel: 5  },
  { id: 'cosmos',  name: 'Cosmos',  hex: '#e94560', minLevel: 7  },
  { id: 'hada',    name: 'Hada',    hex: '#ec4899', minLevel: 6  },
  { id: 'agua',    name: 'Agua',    hex: '#0d9488', minLevel: 8  },
  { id: 'tierra',  name: 'Tierra',  hex: '#16a34a', minLevel: 10 },
]

const ACCESSORIES: { id: AccId; name: string; minLevel: number }[] = [
  { id: 'none',      name: 'Ninguno',      minLevel: 1  },
  { id: 'gafas',     name: 'Gafas',        minLevel: 1  },
  { id: 'gafas-sol', name: 'Gafas de sol', minLevel: 2  },
  { id: 'sombrero',  name: 'Sombrero',     minLevel: 3  },
  { id: 'gorra',     name: 'Gorra',        minLevel: 4  },
  { id: 'antenas',   name: 'Antenas',      minLevel: 5  },
  { id: 'corona',    name: 'Corona',       minLevel: 6  },
  { id: 'halo',      name: 'Halo',         minLevel: 7  },
  { id: 'bowtie',    name: 'Pajarita',     minLevel: 8  },
  { id: 'mochila',   name: 'Mochila',      minLevel: 9  },
  { id: 'capa',      name: 'Capa',         minLevel: 10 },
]

// Per-mascot geometry for accessory placement
const MASCOT_GEO: Record<MascotId, { lx: number; rx: number; ey: number; headTop: number; headCx: number; headW: number }> = {
  spark: { lx: 60, rx: 80, ey: 70, headTop: 28, headCx: 70, headW: 40 },
  ember: { lx: 61, rx: 79, ey: 80, headTop: 14, headCx: 70, headW: 28 },
  pixel: { lx: 60, rx: 80, ey: 81, headTop: 30, headCx: 70, headW: 38 },
  bolt:  { lx: 62, rx: 82, ey: 70, headTop: 28, headCx: 72, headW: 38 },
  nova:  { lx: 60, rx: 80, ey: 72, headTop: 34, headCx: 70, headW: 38 },
  sage:  { lx: 60, rx: 80, ey: 70, headTop: 28, headCx: 70, headW: 38 },
}

// ─── SVG inner-HTML generators ────────────────────────────────────────────────

function mascotInnerSVG(id: MascotId, color: string): string {
  const c = color
  switch (id) {
    case 'spark': return `
      <ellipse cx="70" cy="96" rx="42" ry="34" fill="${c}55"/>
      <ellipse cx="54" cy="126" rx="11" ry="8" fill="${c}"/><ellipse cx="86" cy="126" rx="11" ry="8" fill="${c}"/>
      <ellipse cx="36" cy="58" rx="10" ry="13" fill="${c}"/><ellipse cx="104" cy="58" rx="10" ry="13" fill="${c}"/>
      <ellipse cx="70" cy="74" rx="40" ry="42" fill="${c}"/><ellipse cx="70" cy="76" rx="25" ry="27" fill="#eef2ff"/>
      <line x1="70" y1="34" x2="70" y2="18" stroke="${c}" stroke-width="3"/><circle cx="70" cy="13" r="5" fill="#FBB03B"/>
      <ellipse cx="60" cy="70" rx="5.5" ry="6.5" fill="#2F3A4A"/><ellipse cx="80" cy="70" rx="5.5" ry="6.5" fill="#2F3A4A"/>
      <circle cx="61.5" cy="68" r="1.8" fill="#fff"/><circle cx="81.5" cy="68" r="1.8" fill="#fff"/>
      <path d="M63 82 Q70 87 77 82" stroke="#2F3A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`
    case 'ember': return `
      <path d="M70 14 C80 40 100 50 100 86 C100 110 87 128 70 128 C53 128 40 110 40 86 C40 62 56 56 58 42 C63 58 62 44 70 14 Z" fill="${c}"/>
      <path d="M70 52 C77 66 88 72 88 92 C88 108 80 120 70 120 C60 120 52 108 52 92 C52 78 63 74 70 52 Z" fill="${c}cc"/>
      <ellipse cx="70" cy="84" rx="20" ry="22" fill="#fff5e6"/>
      <ellipse cx="61" cy="80" rx="5" ry="6" fill="#2F3A4A"/><ellipse cx="79" cy="80" rx="5" ry="6" fill="#2F3A4A"/>
      <circle cx="62.3" cy="78.3" r="1.6" fill="#fff"/><circle cx="80.3" cy="78.3" r="1.6" fill="#fff"/>
      <path d="M63 91 Q70 96 77 91" stroke="#2F3A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`
    case 'pixel': return `
      <line x1="70" y1="46" x2="70" y2="30" stroke="${c}" stroke-width="3"/><circle cx="70" cy="26" r="6" fill="#FBB03B"/>
      <rect x="22" y="66" width="11" height="26" rx="4" fill="${c}"/><rect x="107" y="66" width="11" height="26" rx="4" fill="${c}"/>
      <rect x="30" y="48" width="80" height="70" rx="16" fill="${c}"/><rect x="44" y="62" width="52" height="42" rx="11" fill="#eef2ff"/>
      <rect x="48" y="120" width="16" height="12" rx="3" fill="${c}"/><rect x="76" y="120" width="16" height="12" rx="3" fill="${c}"/>
      <rect x="56" y="75" width="9" height="12" rx="3" fill="#2F3A4A"/><rect x="75" y="75" width="9" height="12" rx="3" fill="#2F3A4A"/>
      <path d="M63 93 Q70 98 77 93" stroke="#2F3A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`
    case 'bolt': return `
      <g stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity=".5"><line x1="6" y1="64" x2="22" y2="64"/><line x1="4" y1="80" x2="18" y2="80"/><line x1="8" y1="96" x2="24" y2="96"/></g>
      <ellipse cx="72" cy="96" rx="40" ry="32" fill="${c}55"/>
      <ellipse cx="56" cy="126" rx="11" ry="8" fill="${c}"/><ellipse cx="88" cy="126" rx="11" ry="8" fill="${c}"/>
      <ellipse cx="72" cy="74" rx="38" ry="40" fill="${c}"/><ellipse cx="72" cy="76" rx="24" ry="26" fill="#fff8e6"/>
      <path d="M74 12 L60 36 L72 36 L66 54 L88 28 L75 28 L82 12 Z" fill="${c}cc"/>
      <ellipse cx="62" cy="70" rx="5.5" ry="6.5" fill="#2F3A4A"/><ellipse cx="82" cy="70" rx="5.5" ry="6.5" fill="#2F3A4A"/>
      <circle cx="63.5" cy="68" r="1.8" fill="#fff"/><circle cx="83.5" cy="68" r="1.8" fill="#fff"/>
      <path d="M65 82 Q72 87 79 82" stroke="#2F3A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`
    case 'nova': return `
      <g transform="rotate(-20 70 78)"><ellipse cx="70" cy="78" rx="52" ry="16" fill="none" stroke="${c}" stroke-width="5" opacity=".4"/></g>
      <ellipse cx="70" cy="76" rx="38" ry="40" fill="${c}"/><ellipse cx="70" cy="78" rx="24" ry="26" fill="#ffe4ea"/>
      <g transform="rotate(-20 70 78)"><path d="M22 84 A52 16 0 0 0 118 72" fill="none" stroke="${c}" stroke-width="5" opacity=".85"/></g>
      <path d="M104 30 l2.2 5.2 5.2 2.2 -5.2 2.2 -2.2 5.2 -2.2 -5.2 -5.2 -2.2 5.2 -2.2 z" fill="#FBB03B"/>
      <path d="M30 100 l1.6 3.8 3.8 1.6 -3.8 1.6 -1.6 3.8 -1.6 -3.8 -3.8 -1.6 3.8 -1.6 z" fill="#FBB03B"/>
      <ellipse cx="60" cy="72" rx="5.5" ry="6.5" fill="#2F3A4A"/><ellipse cx="80" cy="72" rx="5.5" ry="6.5" fill="#2F3A4A"/>
      <circle cx="61.5" cy="70" r="1.8" fill="#fff"/><circle cx="81.5" cy="70" r="1.8" fill="#fff"/>
      <path d="M63 84 Q70 89 77 84" stroke="#2F3A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`
    case 'sage': return `
      <ellipse cx="70" cy="96" rx="40" ry="32" fill="${c}55"/>
      <ellipse cx="54" cy="126" rx="11" ry="8" fill="${c}"/><ellipse cx="86" cy="126" rx="11" ry="8" fill="${c}"/>
      <path d="M40 56 Q24 50 26 66 Q42 66 46 58 Z" fill="${c}"/><path d="M100 56 Q116 50 114 66 Q98 66 94 58 Z" fill="${c}"/>
      <ellipse cx="70" cy="74" rx="38" ry="40" fill="${c}"/><ellipse cx="70" cy="76" rx="24" ry="26" fill="#f0fdf4"/>
      <path d="M70 36 Q70 24 70 18" stroke="${c}cc" stroke-width="3" fill="none"/>
      <path d="M70 24 Q56 16 54 28 Q66 30 70 24 Z" fill="${c}aa"/><path d="M70 26 Q84 18 86 30 Q72 32 70 26 Z" fill="${c}aa"/>
      <ellipse cx="60" cy="70" rx="5.5" ry="6.5" fill="#2F3A4A"/><ellipse cx="80" cy="70" rx="5.5" ry="6.5" fill="#2F3A4A"/>
      <circle cx="61.5" cy="68" r="1.8" fill="#fff"/><circle cx="81.5" cy="68" r="1.8" fill="#fff"/>
      <path d="M63 82 Q70 87 77 82" stroke="#2F3A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`
  }
}

function accInnerSVG(id: AccId, mascotId: MascotId): string {
  const g = MASCOT_GEO[mascotId]
  const { lx, rx, ey, headTop: ht, headCx: hcx, headW: hw } = g
  switch (id) {
    case 'none': return ''
    case 'gafas': return `<g>
      <ellipse cx="${lx}" cy="${ey}" rx="11" ry="8.5" fill="none" stroke="#2F3A4A" stroke-width="3"/>
      <ellipse cx="${rx}" cy="${ey}" rx="11" ry="8.5" fill="none" stroke="#2F3A4A" stroke-width="3"/>
      <line x1="${lx + 11}" y1="${ey}" x2="${rx - 11}" y2="${ey}" stroke="#2F3A4A" stroke-width="2.5"/>
      <line x1="${lx - 11}" y1="${ey - 1}" x2="${lx - 19}" y2="${ey - 3}" stroke="#2F3A4A" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${rx + 11}" y1="${ey - 1}" x2="${rx + 19}" y2="${ey - 3}" stroke="#2F3A4A" stroke-width="2.5" stroke-linecap="round"/>
    </g>`
    case 'gafas-sol': return `<g>
      <ellipse cx="${lx}" cy="${ey}" rx="11" ry="8.5" fill="#1a1a2e" stroke="#FBB03B" stroke-width="2.5"/>
      <ellipse cx="${rx}" cy="${ey}" rx="11" ry="8.5" fill="#1a1a2e" stroke="#FBB03B" stroke-width="2.5"/>
      <ellipse cx="${lx}" cy="${ey}" rx="11" ry="8.5" fill="#FBB03B" fill-opacity=".22"/>
      <ellipse cx="${rx}" cy="${ey}" rx="11" ry="8.5" fill="#FBB03B" fill-opacity=".22"/>
      <line x1="${lx + 11}" y1="${ey}" x2="${rx - 11}" y2="${ey}" stroke="#FBB03B" stroke-width="2.5"/>
      <line x1="${lx - 11}" y1="${ey - 1}" x2="${lx - 19}" y2="${ey - 3}" stroke="#FBB03B" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${rx + 11}" y1="${ey - 1}" x2="${rx + 19}" y2="${ey - 3}" stroke="#FBB03B" stroke-width="2.5" stroke-linecap="round"/>
    </g>`
    case 'sombrero': return `<g>
      <ellipse cx="${hcx}" cy="${ht + 14}" rx="${hw}" ry="7" fill="#2F3A4A"/>
      <rect x="${hcx - hw * 0.55}" y="${ht - 10}" width="${hw * 1.1}" height="24" rx="8" fill="#2F3A4A"/>
      <rect x="${hcx - hw * 0.5}" y="${ht + 2}" width="${hw}" height="5" rx="2" fill="#FBB03B"/>
    </g>`
    case 'gorra': return `<g>
      <path d="M${hcx - hw} ${ht + 18} Q${hcx} ${ht} ${hcx + hw} ${ht + 18} Q${hcx + hw * 0.7} ${ht + 20} ${hcx} ${ht + 20} Q${hcx - hw * 0.7} ${ht + 20} ${hcx - hw} ${ht + 18}Z" fill="#3E6FA8"/>
      <path d="M${hcx - hw} ${ht + 18} Q${hcx - hw * 0.7} ${ht + 20} ${hcx} ${ht + 20} Q${hcx + hw * 0.7} ${ht + 20} ${hcx + hw} ${ht + 18} L${hcx + hw} ${ht + 24} Q${hcx + hw * 0.7} ${ht + 26} ${hcx} ${ht + 26} Q${hcx - hw * 0.7} ${ht + 26} ${hcx - hw} ${ht + 24}Z" fill="#2596BE"/>
      <path d="M${hcx - hw} ${ht + 18} Q${hcx - hw - 8} ${ht + 22} ${hcx - hw - 10} ${ht + 26} Q${hcx - hw} ${ht + 24} ${hcx - hw} ${ht + 18}Z" fill="#3E6FA8"/>
      <rect x="${hcx - 16}" y="${ht + 8}" width="32" height="4" rx="2" fill="#FBB03B"/>
    </g>`
    case 'corona': return `<g>
      <path d="M${hcx - hw * 0.6} ${ht + 22} L${hcx - hw * 0.6} ${ht + 6} L${hcx - hw * 0.3} ${ht + 14} L${hcx} ${ht} L${hcx + hw * 0.3} ${ht + 14} L${hcx + hw * 0.6} ${ht + 6} L${hcx + hw * 0.6} ${ht + 22}Z" fill="#FBB03B" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="${hcx}" cy="${ht + 2}" r="4" fill="#e94560"/>
      <circle cx="${hcx - hw * 0.6}" cy="${ht + 8}" r="3" fill="#e94560"/>
      <circle cx="${hcx + hw * 0.6}" cy="${ht + 8}" r="3" fill="#e94560"/>
      <rect x="${hcx - hw * 0.6}" y="${ht + 20}" width="${hw * 1.2}" height="8" rx="3" fill="#FBB03B"/>
    </g>`
    case 'antenas': return `<g>
      <line x1="${lx + 2}" y1="${ht + 10}" x2="${lx - 6}" y2="${ht - 10}" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${lx - 6}" cy="${ht - 12}" r="5" fill="#e94560"/>
      <line x1="${rx - 2}" y1="${ht + 10}" x2="${rx + 6}" y2="${ht - 10}" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${rx + 6}" cy="${ht - 12}" r="5" fill="#e94560"/>
    </g>`
    case 'halo': return `<ellipse cx="${hcx}" cy="${ht - 4}" rx="${hw * 0.7}" ry="7" fill="none" stroke="#FBB03B" stroke-width="4" opacity=".9"/>`
    case 'bowtie': {
      const chinY: Record<MascotId, number> = { spark: 86, ember: 96, pixel: 96, bolt: 86, nova: 88, sage: 86 }
      const cy = chinY[mascotId]
      const mx = (lx + rx) / 2
      return `<g>
        <path d="M${mx - 18} ${cy} L${mx - 8} ${cy + 6} L${mx - 18} ${cy + 12}Z" fill="#e94560"/>
        <path d="M${mx + 18} ${cy} L${mx + 8} ${cy + 6} L${mx + 18} ${cy + 12}Z" fill="#e94560"/>
        <ellipse cx="${mx}" cy="${cy + 6}" rx="8" ry="5" fill="#c0103a"/>
      </g>`
    }
    case 'mochila': return `<g>
      <rect x="22" y="62" width="18" height="28" rx="5" fill="#3E6FA8" stroke="#2596BE" stroke-width="1.5"/>
      <rect x="25" y="68" width="12" height="8" rx="2" fill="#7CB8F5"/>
    </g>`
    case 'capa': {
      const shY: Record<MascotId, number> = { spark: 72, ember: 80, pixel: 76, bolt: 72, nova: 74, sage: 72 }
      const sy = shY[mascotId]
      return `<g>
        <path d="M${hcx - hw} ${sy} Q${hcx - hw - 8} ${sy + 22} ${hcx - hw + 6} ${sy + 42} Q${hcx} ${sy + 50} ${hcx + hw - 6} ${sy + 42} Q${hcx + hw + 8} ${sy + 22} ${hcx + hw} ${sy}Z" fill="#e94560" opacity=".9"/>
        <path d="M${hcx - hw} ${sy} Q${hcx} ${sy + 18} ${hcx + hw} ${sy} L${hcx + hw - 4} ${sy - 6} Q${hcx} ${sy + 12} ${hcx - hw + 4} ${sy - 6}Z" fill="#c0103a"/>
      </g>`
    }
    default: return ''
  }
}

function boltInnerSVG(id: BoltId): string {
  const b = BOLTS.find((x) => x.id === id)!
  const defs = b.defs ? `<defs>${b.defs}</defs>` : ''
  const stroke = b.stroke ? ` stroke="${b.stroke}" stroke-width="0.8"` : ''
  return `${defs}<path d="${BOLT_PATH}" fill="${b.fill}"${stroke}/>`
}

// ─── Mascot canvas animations ─────────────────────────────────────────────────

function drawSparkAnim(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  ctx.clearRect(0, 0, 200, 200)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const phase = (frame + i * 5) % 40
    const progress = phase / 40
    const r = 30 + progress * 55
    const alpha = progress < 0.7 ? progress / 0.7 : (1 - progress) / 0.3
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * (r - 12), cy + Math.sin(angle) * (r - 12))
    ctx.lineTo(x, y)
    ctx.strokeStyle = `rgba(251,176,59,${alpha * 0.85})`
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,220,100,${alpha})`
    ctx.fill()
  }
  const t = frame * 0.06
  const ringR = 72 + Math.sin(t) * 3
  ctx.beginPath()
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(251,176,59,${0.2 + Math.sin(t * 1.3) * 0.075})`
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawEmberAnim(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  ctx.clearRect(0, 0, 200, 200)
  for (let i = 0; i < 12; i++) {
    const phase = (frame * 0.8 + i * 6.7) % 60
    const progress = phase / 60
    const x = cx + (i - 6) * 7 + Math.sin(progress * Math.PI * 2 + i) * 8
    const y = cy + 55 - progress * 90
    const alpha = (progress < 0.7 ? progress / 0.7 : (1 - progress) / 0.3) * 0.9
    const g = Math.round(100 + progress * 155)
    ctx.beginPath()
    ctx.arc(x, y, 2.5 - progress * 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,${g},0,${alpha})`
    ctx.fill()
  }
  const grad = ctx.createRadialGradient(cx, cy + 55, 0, cx, cy + 55, 45)
  grad.addColorStop(0, `rgba(249,115,22,${0.15 + Math.sin(frame * 0.08) * 0.05})`)
  grad.addColorStop(1, 'rgba(249,115,22,0)')
  ctx.beginPath()
  ctx.arc(cx, cy + 55, 45, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
}

function drawPixelAnim(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  ctx.clearRect(0, 0, 200, 200)
  ctx.font = '9px monospace'
  for (let c = 0; c < 6; c++) {
    const colX = cx - 42 + c * 14
    for (let row = 0; row < 5; row++) {
      const phase = (frame * 0.5 + c * 7 + row * 3) % 40
      const alpha = (phase < 20 ? phase / 20 : (40 - phase) / 20) * 0.75
      const digit = Math.floor((frame * 0.3 + c * 3 + row * 7) % 2)
      ctx.fillStyle = `rgba(139,92,246,${alpha})`
      ctx.fillText(String(digit), colX, cy - 40 + row * 18)
    }
  }
  if (frame % 20 < 3) {
    ctx.fillStyle = 'rgba(139,92,246,0.18)'
    ctx.fillRect(cx - 70, cy - 50 + Math.random() * 100, 140, 4 + Math.random() * 6)
  }
  const bAlpha = 0.2 + Math.sin(frame * 0.1) * 0.3
  ctx.strokeStyle = `rgba(139,92,246,${bAlpha})`
  ctx.lineWidth = 1.5
  const corners = [[-65,-65],[65,-65],[-65,65],[65,65]] as const
  const signs   = [[ 1, 1],[-1, 1],[ 1,-1],[-1,-1]] as const
  corners.forEach(([ox, oy], i) => {
    const [sx, sy] = signs[i]
    const bx = cx + ox, by = cy + oy
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sx * 14, by); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + sy * 14); ctx.stroke()
  })
}

function drawBoltAnim(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  ctx.clearRect(0, 0, 200, 200)
  const lines = [
    { y: -28, speed: 13.5, len: 68, w: 3.5 },
    { y: -10, speed:  9.5, len: 48, w: 2.5 },
    { y:   8, speed: 11.0, len: 55, w: 3.0 },
    { y:  22, speed:  7.5, len: 38, w: 2.0 },
    { y:  36, speed:  6.0, len: 28, w: 1.5 },
  ]
  lines.forEach(({ y, speed, len, w }, i) => {
    const x = cx - 80 + ((frame * speed + i * 40) % 160)
    const grad = ctx.createLinearGradient(x, 0, x + len, 0)
    grad.addColorStop(0,   'rgba(251,176,59,0)')
    grad.addColorStop(0.5, 'rgba(251,176,59,0.9)')
    grad.addColorStop(1,   'rgba(255,220,100,0.6)')
    ctx.beginPath()
    ctx.moveTo(x, cy + y)
    ctx.lineTo(x + len, cy + y)
    ctx.strokeStyle = grad
    ctx.lineWidth = w
    ctx.stroke()
  })
  const ringR = 68 + Math.sin(frame * 0.15) * 2
  for (let i = 0; i < 12; i++) {
    const startAngle = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, ringR, startAngle, startAngle + Math.PI / 14)
    ctx.strokeStyle = `rgba(251,176,59,${0.4 + Math.random() * 0.5})`
    ctx.lineWidth = 1.5 + Math.random()
    ctx.stroke()
  }
}

function drawNovaAnim(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  ctx.clearRect(0, 0, 200, 200)
  const t = frame * 0.02
  const rings = [
    { rx: 62, ry: 18, angle: -20 * Math.PI / 180, dir:  1, color: 'rgba(233,69,96,0.45)' },
    { rx: 55, ry: 14, angle:  23 * Math.PI / 180, dir: -1, color: 'rgba(233,69,96,0.35)' },
  ]
  rings.forEach(({ rx, ry, angle, dir, color }, ri) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle + dir * t * 0.5)
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()
    const moonAngle = t * dir * 1.2 + ri * Math.PI
    ctx.beginPath()
    ctx.arc(Math.cos(moonAngle) * rx, Math.sin(moonAngle) * ry, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = '#FBB03B'
    ctx.fill()
    ctx.restore()
  })
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * 0.3
    const r = 60 + Math.sin(t * 2 + i) * 8
    const alpha = 0.15 + Math.sin(t * 1.5 + i * 1.2) * 0.1
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fill()
  }
}

function drawSageAnim(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) {
  ctx.clearRect(0, 0, 200, 200)
  for (let i = 0; i < 7; i++) {
    const phase = (frame * 0.6 + i * 8.5) % 70
    const progress = phase / 70
    const x = cx + (i - 3) * 10 + Math.sin(progress * Math.PI * 2 + i * 0.8) * 7
    const y = cy + 50 - progress * 110
    const alpha = (progress < 0.6 ? progress / 0.6 : (1 - progress) / 0.4) * 0.85
    const leafW = 3 + Math.sin(progress * Math.PI) * 3
    const leafH = 6 + Math.sin(progress * Math.PI) * 5
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(progress * Math.PI * 2) * 0.4)
    ctx.beginPath()
    ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(22,163,74,${alpha})`
    ctx.fill()
    ctx.restore()
  }
  const mistR = 70 + Math.sin(frame * 0.05) * 4
  const grad = ctx.createRadialGradient(cx, cy, mistR - 8, cx, cy, mistR + 8)
  grad.addColorStop(0,   'rgba(22,163,74,0)')
  grad.addColorStop(0.5, `rgba(22,163,74,${0.08 + Math.sin(frame * 0.06) * 0.03})`)
  grad.addColorStop(1,   'rgba(22,163,74,0)')
  ctx.beginPath()
  ctx.arc(cx, cy, mistR, 0, Math.PI * 2)
  ctx.strokeStyle = grad as unknown as string
  ctx.lineWidth = 12
  ctx.stroke()
}

const MASCOT_DRAW_FN: Record<MascotId, (ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number) => void> = {
  spark: drawSparkAnim,
  ember: drawEmberAnim,
  pixel: drawPixelAnim,
  bolt:  drawBoltAnim,
  nova:  drawNovaAnim,
  sage:  drawSageAnim,
}

const MASCOT_SVG_TRANSFORM: Record<MascotId, (frame: number) => string> = {
  spark: (f) => {
    const t = f * 0.06
    return `translateY(${Math.sin(t) * 5}px) rotate(${Math.sin(t * 0.7) * 3}deg)`
  },
  ember: (f) => {
    const t = f * 0.07
    return `translateY(${Math.sin(t * 1.2) * 4 - 3}px) scaleX(${1 + Math.sin(t * 1.5) * 0.03}) scaleY(${1 + Math.abs(Math.sin(t * 1.2)) * 0.04})`
  },
  pixel: (f) => {
    if (f % 22 < 2) return `translate(${(Math.random() - 0.5) * 8}px, ${(Math.random() - 0.5) * 5}px)`
    return 'translate(0,0)'
  },
  bolt: (f) => {
    const t = f * 0.1
    return `rotate(${-8 + Math.sin(t * 3) * 2}deg) translateX(${Math.sin(f * 2) * 1.5}px)`
  },
  nova: (f) => {
    const t = f * 0.02
    return `translateX(${Math.cos(t * 0.5) * 6}px) translateY(${Math.sin(t * 0.7) * 5}px) rotate(${Math.sin(t * 0.3) * 4}deg)`
  },
  sage: (f) => {
    const t = f * 0.05
    return `translateX(${Math.sin(t * 0.6) * 4}px) translateY(${-Math.abs(Math.sin(t * 0.9)) * 4}px) rotate(${Math.sin(t * 0.5) * 2}deg)`
  },
}

const MASCOT_SVG_FILTER: Record<MascotId, string> = {
  spark: 'drop-shadow(0 12px 28px rgba(62,111,168,.25))',
  ember: 'drop-shadow(0 0 12px rgba(249,115,22,0.7)) drop-shadow(0 0 24px rgba(249,115,22,0.4))',
  pixel: 'drop-shadow(3px 0 rgba(139,92,246,0.8)) drop-shadow(-3px 0 rgba(59,130,246,0.8))',
  bolt:  'drop-shadow(0 0 14px rgba(251,176,59,0.8))',
  nova:  'drop-shadow(0 0 16px rgba(233,69,96,0.65)) drop-shadow(0 0 32px rgba(233,69,96,0.3))',
  sage:  'drop-shadow(0 0 14px rgba(22,163,74,0.6)) drop-shadow(0 8px 20px rgba(22,163,74,0.3))',
}

const BOLT_HOVER: Record<BoltId, { filter: string; numColor: string; numShadow: string }> = {
  sparkle: { filter: 'drop-shadow(0 0 8px #FBB03B)',                  numColor: '#FBB03B', numShadow: '0 0 12px rgba(251,176,59,0.6)' },
  ferri:   { filter: 'drop-shadow(0 0 8px #FF2800)',                  numColor: '#FF2800', numShadow: '0 0 12px rgba(255,40,0,0.6)' },
  apfel:   { filter: 'drop-shadow(0 0 6px #A8A8B3)',                  numColor: '#A8A8B3', numShadow: '0 0 8px rgba(168,168,179,0.5)' },
  teslo:   { filter: 'drop-shadow(0 0 10px #FF2800) brightness(1.2)', numColor: '#FF4040', numShadow: '0 0 16px rgba(255,40,0,0.7)' },
  galaxi:  { filter: 'drop-shadow(0 0 10px #4FC3F7)',                 numColor: '#4FC3F7', numShadow: '0 0 14px rgba(79,195,247,0.7)' },
  nextra:  { filter: 'drop-shadow(0 0 6px #888)',                     numColor: '#555',    numShadow: '0 0 8px rgba(0,0,0,0.4)' },
  goog:    { filter: 'drop-shadow(0 0 8px #4285F4)',                  numColor: '#4285F4', numShadow: '0 0 12px rgba(66,133,244,0.6)' },
  spotif:  { filter: 'drop-shadow(0 0 8px #1DB954)',                  numColor: '#1DB954', numShadow: '0 0 12px rgba(29,185,84,0.6)' },
  amazo:   { filter: 'drop-shadow(0 0 8px #FF9900)',                  numColor: '#FF9900', numShadow: '0 0 12px rgba(255,153,0,0.6)' },
  netti:   { filter: 'drop-shadow(0 0 10px #E50914) brightness(1.1)', numColor: '#E50914', numShadow: '0 0 16px rgba(229,9,20,0.7)' },
}

// ─── Bolt canvas animations ────────────────────────────────────────────────

function drawBoltFusionSparkle(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 4; i++) {
    const phase = (frame + i * 15) % 60
    const r = (phase / 60) * 55
    const alpha = (1 - phase / 60) * 0.45
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(251,176,59,${alpha})`
    ctx.lineWidth = 2
    ctx.stroke()
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + frame * 0.05
    const r = 28 + Math.sin(frame * 0.1 + i) * 6
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,220,100,${0.4 + Math.sin(frame * 0.15 + i) * 0.3})`
    ctx.fill()
  }
}

function drawBoltFusionFerri(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 5; i++) {
    const offset = (frame * 8 + i * 18) % 80
    const y = cy - 20 + i * 10
    const x = cx - 40 + offset
    const grad = ctx.createLinearGradient(x, 0, x + 30, 0)
    grad.addColorStop(0, 'rgba(255,40,0,0)')
    grad.addColorStop(0.6, 'rgba(255,40,0,0.8)')
    grad.addColorStop(1, 'rgba(200,169,81,0.6)')
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 30, y)
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.stroke()
  }
  const r = 30 + Math.sin(frame * 0.1) * 4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,40,0,${0.2 + Math.sin(frame * 0.12) * 0.1})`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawBoltFusionApfel(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 3; i++) {
    const prog = ((frame * 0.6 + i * 30) % 90) / 90
    const x = cx - 40 + prog * 80
    const grad = ctx.createLinearGradient(x - 15, 0, x + 15, 0)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.5, `rgba(255,255,255,${0.4 * (1 - prog)})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - 15, cy - 25, 30, 50)
  }
}

function drawBoltFusionTeslo(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + frame * 0.08
    const len = 30 + Math.random() * 10
    let x = cx, y = cy
    ctx.beginPath()
    ctx.moveTo(x, y)
    const segments = 5
    for (let s = 0; s < segments; s++) {
      x += Math.cos(angle) * (len / segments) + (Math.random() - 0.5) * 9
      y += Math.sin(angle) * (len / segments) + (Math.random() - 0.5) * 9
      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(255,64,64,${0.5 + Math.random() * 0.4})`
    ctx.lineWidth = 1 + Math.random()
    ctx.stroke()
    ctx.strokeStyle = `rgba(255,255,255,0.3)`
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
  if (frame % 4 < 2) {
    ctx.fillStyle = `rgba(255,40,0,${0.04 + Math.random() * 0.04})`
    ctx.fillRect(0, 0, w, h)
  }
}

function drawBoltFusionGalaxi(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + frame * 0.06
    const r = 30 + i * 5
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3 - i * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(79,195,247,${0.6 - i * 0.15})`
    ctx.fill()
    for (let t = 1; t < 5; t++) {
      const ta = angle - t * 0.15
      const tx = cx + Math.cos(ta) * r
      const ty = cy + Math.sin(ta) * r
      ctx.beginPath()
      ctx.arc(tx, ty, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(79,195,247,${0.3 - t * 0.06})`
      ctx.fill()
    }
  }
  ctx.beginPath()
  ctx.arc(cx, cy, 35, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(79,195,247,${0.15 + Math.sin(frame * 0.08) * 0.08})`
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawBoltFusionNextra(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const prog = (frame % 50) / 50
  const x = cx - 45 + prog * 90
  const grad = ctx.createLinearGradient(x, 0, x + 35, 0)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.7, 'rgba(255,255,255,0.85)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(x, cy - 22, 35, 44)
  ctx.strokeStyle = `rgba(200,200,200,${0.3 + Math.sin(frame * 0.1) * 0.15})`
  ctx.lineWidth = 1.5
  ;([[-1,-1],[1,-1],[-1,1],[1,1]] as const).forEach(([sx,sy]) => {
    const bx = cx + sx * 30, by = cy + sy * 22
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sx * 8, by); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + sy * 8); ctx.stroke()
  })
}

function drawBoltFusionGoog(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const colors = ['rgba(66,133,244,0.75)', 'rgba(52,168,83,0.75)', 'rgba(251,188,5,0.75)', 'rgba(234,67,53,0.75)']
  for (let i = 0; i < 4; i++) {
    const prog = ((frame * 0.7 + i * 22) % 88) / 88
    const angle = (i / 4) * Math.PI * 2 + frame * 0.04
    const r = 20 + prog * 20
    const x = cx + Math.cos(angle + prog * Math.PI) * r
    const y = cy + Math.sin(angle + prog * Math.PI) * r
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = colors[i].replace('0.75', String(0.75 * (1 - prog * 0.5)))
    ctx.fill()
  }
}

function drawBoltFusionSpotif(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const amp = 0.5 + Math.sin(frame * 0.15 + i * 1.1) * 0.5
    const len = 10 + amp * 22
    const x1 = cx + Math.cos(angle) * 22
    const y1 = cy + Math.sin(angle) * 22
    const x2 = cx + Math.cos(angle) * (22 + len)
    const y2 = cy + Math.sin(angle) * (22 + len)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = `rgba(29,185,84,${0.4 + amp * 0.55})`
    ctx.lineWidth = 3 + amp * 4
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}

function drawBoltFusionAmazo(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  for (let i = 0; i < 4; i++) {
    const prog = ((frame * 0.7 + i * 22) % 88) / 88
    const angle = (i / 4) * Math.PI * 2 + 0.3
    const r = 15 + prog * 30
    const arc = Math.sin(prog * Math.PI) * 18
    const x = cx + Math.cos(angle) * r + Math.sin(prog * Math.PI * 2) * arc
    const y = cy + Math.sin(angle) * r
    const bubbleR = 4.5 * (1 - prog * 0.5)
    ctx.beginPath()
    ctx.arc(x, y, bubbleR, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,153,0,${(1 - prog) * 0.8})`
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, 28 + Math.sin(frame * 0.1) * 3, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,153,0,${0.15 + Math.sin(frame * 0.12) * 0.08})`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawBoltFusionNetti(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 55)
  grad.addColorStop(0, 'rgba(229,9,20,0)')
  grad.addColorStop(1, `rgba(229,9,20,${0.18 + Math.sin(frame * 0.07) * 0.06})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  const scanY = (frame * 2.8) % h
  const scanGrad = ctx.createLinearGradient(0, 0, w, 0)
  scanGrad.addColorStop(0, 'rgba(229,9,20,0)')
  scanGrad.addColorStop(0.5, 'rgba(255,80,80,0.55)')
  scanGrad.addColorStop(1, 'rgba(229,9,20,0)')
  ctx.fillStyle = scanGrad
  ctx.fillRect(0, scanY, w, 6)
  for (let i = 0; i < 3; i++) {
    const phase = (frame + i * 20) % 60
    const r = (phase / 60) * 48
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(229,9,20,${(1 - phase / 60) * 0.35})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

const BOLT_DRAW_FN: Record<BoltId, (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => void> = {
  sparkle: drawBoltFusionSparkle,
  ferri:   drawBoltFusionFerri,
  apfel:   drawBoltFusionApfel,
  teslo:   drawBoltFusionTeslo,
  galaxi:  drawBoltFusionGalaxi,
  nextra:  drawBoltFusionNextra,
  goog:    drawBoltFusionGoog,
  spotif:  drawBoltFusionSpotif,
  amazo:   drawBoltFusionAmazo,
  netti:   drawBoltFusionNetti,
}

// ─── MascotSVG ────────────────────────────────────────────────────────────────

function MascotSVG({ mascotId, color, accId, onClick }: { mascotId: MascotId; color: string; accId: AccId; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef    = useRef<SVGSVGElement>(null)
  const rafRef    = useRef<number>(0)
  const frameRef  = useRef(0)

  useEffect(() => {
    if (!hovered) {
      cancelAnimationFrame(rafRef.current)
      const canvas = canvasRef.current
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, 200, 200)
      if (svgRef.current) {
        svgRef.current.style.transform = ''
        svgRef.current.style.filter = 'drop-shadow(0 12px 28px rgba(62,111,168,.25)) drop-shadow(0 2px 6px rgba(62,111,168,.12))'
      }
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const drawFn    = MASCOT_DRAW_FN[mascotId]
    const transformFn = MASCOT_SVG_TRANSFORM[mascotId]
    const filterStr = MASCOT_SVG_FILTER[mascotId]
    function loop() {
      const f = frameRef.current++
      drawFn(ctx!, 100, 100, f)
      if (svgRef.current) {
        svgRef.current.style.transform = transformFn(f)
        svgRef.current.style.filter = filterStr
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(rafRef.current); frameRef.current = 0 }
  }, [hovered, mascotId])

  const inner = mascotInnerSVG(mascotId, color) + accInnerSVG(accId, mascotId)

  return (
    <div
      style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={{
          position: 'absolute', left: -30, top: -30,
          pointerEvents: 'none', zIndex: 3,
          opacity: hovered ? 1 : 0, transition: 'opacity 0.25s',
        }}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 140 140"
        width={140}
        height={140}
        fill="none"
        onClick={onClick}
        style={{
          display: 'block', cursor: 'pointer',
          filter: 'drop-shadow(0 12px 28px rgba(62,111,168,.25)) drop-shadow(0 2px 6px rgba(62,111,168,.12))',
          transition: 'filter 0.3s',
          position: 'relative', zIndex: 1,
        }}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    </div>
  )
}

// ─── BoltSVG ──────────────────────────────────────────────────────────────────

function BoltSVG({ boltId }: { boltId: BoltId }) {
  return (
    <svg
      width="18"
      height="26"
      viewBox="7 2 16 31"
      fill="none"
      dangerouslySetInnerHTML={{ __html: boltInnerSVG(boltId) }}
    />
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--warm)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430, maxHeight: '80dvh', overflowY: 'auto', padding: '20px 16px 32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--sp-text)' }}>{title}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--sp-muted)', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Mascot modal ─────────────────────────────────────────────────────────────

function MascotModal({
  open, onClose, mascotId, mascotColor, accId, level,
  onMascotChange, onColorChange, onAccChange,
}: {
  open: boolean; onClose: () => void
  mascotId: MascotId; mascotColor: string; accId: AccId; level: number
  onMascotChange: (id: MascotId, defaultColor: string) => void
  onColorChange: (hex: string) => void
  onAccChange: (id: AccId) => void
}) {
  const [tab, setTab] = useState<'personaje' | 'color' | 'accesorios'>('personaje')
  const tabStyle = (t: typeof tab) => ({
    padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
    background: tab === t ? 'var(--blue-dark)' : 'transparent',
    color: tab === t ? '#fff' : 'var(--sp-muted)',
  })
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }
  const card = (selected: boolean, locked: boolean): React.CSSProperties => ({
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '10px 6px', borderRadius: 16, border: `2px solid ${selected ? 'var(--blue-dark)' : 'var(--sp-border)'}`,
    background: selected ? 'var(--card-b)' : 'var(--card-a)', cursor: locked ? 'default' : 'pointer',
    opacity: locked ? 0.5 : 1,
  })

  return (
    <ModalShell open={open} onClose={onClose} title="Personalizar mascota">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['personaje', 'color', 'accesorios'] as const).map((t) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'personaje' && (
        <div style={grid}>
          {MASCOTS.map((m) => {
            const locked = level < m.minLevel
            const sel = mascotId === m.id
            return (
              <div key={m.id} style={card(sel, locked)} onClick={() => !locked && onMascotChange(m.id, m.defaultColor)}>
                {locked && <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 800, color: 'var(--sp-muted)' }}>Niv.{m.minLevel}</span>}
                <svg width="72" height="72" viewBox="0 0 140 140" fill="none" dangerouslySetInnerHTML={{ __html: mascotInnerSVG(m.id, m.defaultColor) }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--sp-text)' }}>{m.name}</span>
                <span style={{ fontSize: 9, color: m.defaultColor, fontWeight: 700 }}>{m.tipo}</span>
                {locked && <span style={{ fontSize: 9, color: 'var(--sp-muted)' }}>🔒 Niv.{m.minLevel}</span>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'color' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {MASCOT_COLORS.map((mc) => {
            const locked = level < mc.minLevel
            const sel = mascotColor === mc.hex
            return (
              <div key={mc.id} style={card(sel, locked)} onClick={() => !locked && onColorChange(mc.hex)}>
                {locked && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 9, fontWeight: 800, color: 'var(--sp-muted)' }}>Niv.{mc.minLevel}</span>}
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: mc.hex, display: 'block', border: '2px solid rgba(0,0,0,.08)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text)' }}>{mc.name}</span>
                {locked && <span style={{ fontSize: 9, color: 'var(--sp-muted)' }}>🔒</span>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'accesorios' && (
        <div style={grid}>
          {ACCESSORIES.map((a) => {
            const locked = level < a.minLevel && a.id !== 'none'
            const sel = accId === a.id
            const previewInner = `<ellipse cx="70" cy="74" rx="32" ry="34" fill="${mascotColor}88"/><ellipse cx="70" cy="76" rx="20" ry="22" fill="#eef2ff"/><ellipse cx="62" cy="70" rx="4" ry="5" fill="#2F3A4A"/><ellipse cx="78" cy="70" rx="4" ry="5" fill="#2F3A4A"/><circle cx="63.2" cy="68.5" r="1.4" fill="white"/><circle cx="79.2" cy="68.5" r="1.4" fill="white"/><path d="M64 80 Q70 84 76 80" stroke="#2F3A4A" stroke-width="1.8" stroke-linecap="round" fill="none"/>${accInnerSVG(a.id, 'spark')}`
            return (
              <div key={a.id} style={card(sel, locked)} onClick={() => !locked && onAccChange(a.id)}>
                {locked && <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 800, color: 'var(--sp-muted)' }}>Niv.{a.minLevel}</span>}
                <svg width="60" height="60" viewBox="0 0 140 140" fill="none" dangerouslySetInnerHTML={{ __html: previewInner }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text)' }}>{a.name}</span>
                {locked && <span style={{ fontSize: 9, color: 'var(--sp-muted)' }}>🔒</span>}
              </div>
            )
          })}
        </div>
      )}
    </ModalShell>
  )
}

// ─── Bolt modal ───────────────────────────────────────────────────────────────

function BoltModal({ open, onClose, boltId, level, onBoltChange }: { open: boolean; onClose: () => void; boltId: BoltId; level: number; onBoltChange: (id: BoltId) => void }) {
  return (
    <ModalShell open={open} onClose={onClose} title="Elige tu Bolt">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {BOLTS.map((b) => {
          const locked = level < b.minLevel
          const sel = boltId === b.id
          return (
            <div
              key={b.id}
              onClick={() => !locked && (onBoltChange(b.id), onClose())}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 16, border: `2px solid ${sel ? 'var(--blue-dark)' : 'var(--sp-border)'}`,
                background: sel ? 'var(--card-b)' : 'var(--card-a)', cursor: locked ? 'default' : 'pointer',
                opacity: locked ? 0.5 : 1,
              }}
            >
              {locked && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, fontWeight: 800, color: 'var(--sp-muted)' }}>🔒 Niv.{b.minLevel}</span>}
              <svg width="28" height="40" viewBox="7 2 16 31" fill="none" dangerouslySetInnerHTML={{ __html: boltInnerSVG(b.id) }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: b.color }}>{b.name}</div>
                <div style={{ fontSize: 10, color: 'var(--sp-muted)', fontWeight: 600 }}>{b.tagline}</div>
              </div>
            </div>
          )
        })}
      </div>
    </ModalShell>
  )
}

// ─── Frase modal ──────────────────────────────────────────────────────────────

function FraseModal({ open, onClose, fraseId, level, onFraseChange }: { open: boolean; onClose: () => void; fraseId: string; level: number; onFraseChange: (id: string) => void }) {
  return (
    <ModalShell open={open} onClose={onClose} title="Elige tu frase">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FRASES.map((f) => {
          const locked = level < f.minLevel
          const sel = fraseId === f.id
          return (
            <button
              key={f.id}
              onClick={() => !locked && (onFraseChange(f.id), onClose())}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 14, border: `2px solid ${sel ? 'var(--blue-dark)' : 'var(--sp-border)'}`,
                background: sel ? 'var(--card-b)' : 'var(--card-a)', cursor: locked ? 'default' : 'pointer',
                opacity: locked ? 0.5 : 1, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--sp-text)' }}>{f.text}</span>
              {locked
                ? <span style={{ fontSize: 10, color: 'var(--sp-muted)', fontWeight: 700 }}>🔒 Niv.{f.minLevel}</span>
                : f.minLevel > 1 && <span style={{ fontSize: 10, color: 'var(--sp-accent)', fontWeight: 700 }}>Niv.{f.minLevel}</span>}
            </button>
          )
        })}
      </div>
    </ModalShell>
  )
}

// ─── PaletteModal ─────────────────────────────────────────────────────────────

function PaletteModal({ open, onClose, theme, onThemeChange, level }: { open: boolean; onClose: () => void; theme: Theme; onThemeChange: (t: Theme) => void; level: number }) {
  return (
    <ModalShell open={open} onClose={onClose} title="Elige tu paleta">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PALETTES.map((p) => {
          const locked = p.locked !== undefined && level < p.locked
          const isActive = theme === p.id
          return (
            <button
              key={p.id}
              onClick={() => { if (!locked) { onThemeChange(p.id); onClose() } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 14, border: `2px solid ${isActive ? 'var(--cta)' : 'transparent'}`,
                background: isActive ? 'var(--card-b)' : 'var(--card-a)',
                cursor: locked ? 'default' : 'pointer',
                opacity: locked ? 0.55 : 1,
                textAlign: 'left' as const,
              }}
            >
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {[p.c1, p.c2, p.c3].map((c, i) => (
                  <span key={i} style={{ width: 30, height: 30, borderRadius: 9, background: c, display: 'block', border: '1.5px solid rgba(255,255,255,.5)' }} />
                ))}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: 'var(--sp-text)' }}>{p.label}</span>
              {locked && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sp-muted)' }}>🔒 Niv.{p.locked}</span>}
            </button>
          )
        })}
      </div>
    </ModalShell>
  )
}

// ─── HeroZone ─────────────────────────────────────────────────────────────────

interface HeroZoneProps {
  data: StudentPortalData
  theme: Theme
  mascotId: MascotId
  mascotColor: string
  accId: AccId
  boltId: BoltId
  fraseId: string
  onMascotClick: () => void
  onBoltClick: () => void
  onFraseClick: () => void
  onPaletteClick: () => void
}

function HeroZone({ data, theme, mascotId, mascotColor, accId, boltId, fraseId, onMascotClick, onBoltClick, onFraseClick, onPaletteClick }: HeroZoneProps) {
  const [xpAnimated, setXpAnimated] = useState(0)
  const [boltHovered, setBoltHovered] = useState(false)

  const boltCanvasRef = useRef<HTMLCanvasElement>(null)
  const boltRafRef    = useRef<number>(0)
  const boltFrameRef  = useRef(0)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setXpAnimated(data.porcentajeNivel))
    return () => cancelAnimationFrame(raf)
  }, [data.porcentajeNivel])

  useEffect(() => {
    if (!boltHovered) {
      cancelAnimationFrame(boltRafRef.current)
      const canvas = boltCanvasRef.current
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
      boltFrameRef.current = 0
      return
    }
    const canvas = boltCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const drawFn = BOLT_DRAW_FN[boltId]
    function loop() {
      const f = boltFrameRef.current++
      drawFn(ctx!, canvas!.width, canvas!.height, f)
      boltRafRef.current = requestAnimationFrame(loop)
    }
    boltRafRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(boltRafRef.current); boltFrameRef.current = 0 }
  }, [boltHovered, boltId])

  const fraseText = FRASES.find((f) => f.id === fraseId)?.text ?? "¡Let's Ignite!"
  const currentPalette = PALETTES.find((p) => p.id === theme)!
  const boltEffect = BOLT_HOVER[boltId]

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--warm)' }}>
      {/* Scene */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(195px, 34vh, 285px)', zIndex: 0 }}>
        {SCENES[theme]}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--warm) 90%)' }} />
      </div>

      {/* Mascot row — sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 150,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingTop: 12,
        paddingBottom: 4,
        pointerEvents: 'none',
      }}>
        {/* Mascot unit */}
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'flex-end',
          flexShrink: 0,
          pointerEvents: 'all',
        }}>
          <MascotSVG
            mascotId={mascotId}
            color={mascotColor}
            accId={accId}
            onClick={onMascotClick}
          />
          {/* Speech bubble */}
          <button onClick={onFraseClick} style={{
            position: 'absolute',
            left: 'calc(100% + 10px)',
            bottom: 64,
            maxWidth: 'clamp(160px, 35vw, 240px)',
            width: 'max-content',
            background: 'var(--sp-text, #2F3A4A)',
            color: 'var(--card-a, #fff)',
            borderRadius: 16,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'inherit',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(47,58,74,0.20)',
            textAlign: 'left' as const,
            lineHeight: 1.3,
          }}>
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              left: -9,
              top: 14,
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '6px solid var(--sp-text, #2F3A4A)',
            }} />
            {fraseText}
          </button>
        </div>
      </div>

      {/* Profile area */}
      <div style={{ position: 'relative', zIndex: 3, background: 'var(--warm)' }}>

        {/* Profile hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 24px 0', gap: 4 }}>
          {/* Name */}
          <div className="font-fraunces" style={{ fontSize: 28, fontWeight: 900, color: 'var(--sp-text)', lineHeight: 1.1, letterSpacing: '-.3px', textAlign: 'center' as const }}>
            {data.nombre} {data.apellido}
          </div>
          {/* School */}
          {(data.grupo || data.colegio) && (
            <div style={{ fontSize: 14, color: 'var(--blue-dark)', fontWeight: 600, textAlign: 'center' as const }}>
              {data.colegio}{data.colegio && data.grupo && ' · '}{data.grupo}
            </div>
          )}
          {/* Level block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 14, gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8aa4be', textTransform: 'uppercase', letterSpacing: '.7px' }}>Nivel</span>
            {/* Level num row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Left bracket */}
              <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                <path d="M16 2 L6 14 L16 26" stroke="var(--blue-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* Fusion zone */}
              <div
                onClick={onBoltClick}
                onMouseEnter={() => setBoltHovered(true)}
                onMouseLeave={() => setBoltHovered(false)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  padding: '4px 10px',
                  transform: boltHovered ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <canvas
                  ref={boltCanvasRef}
                  width={120}
                  height={80}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: boltHovered ? 1 : 0,
                    transition: 'opacity 0.25s',
                  }}
                />
                <div style={{ filter: boltHovered ? boltEffect.filter : 'none', transition: 'filter 0.3s', position: 'relative', zIndex: 1 }}>
                  <BoltSVG boltId={boltId} />
                </div>
                <span style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: boltHovered ? boltEffect.numColor : 'var(--blue-dark)',
                  textShadow: boltHovered ? boltEffect.numShadow : 'none',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s, text-shadow 0.3s',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {data.nivelGlobal}
                </span>
              </div>
              {/* Right bracket */}
              <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                <path d="M4 2 L14 14 L4 26" stroke="var(--blue-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Level name */}
            <span className="font-fraunces" style={{ fontSize: 17, fontWeight: 700, color: 'var(--cta)' }}>
              {data.nombreNivel}
            </span>
          </div>
        </div>

        {/* XP block */}
        <div style={{ position: 'relative', zIndex: 3, padding: '14px 24px 0', maxWidth: 480, margin: '0 auto' }}>
          {/* XP nums row */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--sp-text)', fontVariantNumeric: 'tabular-nums' }}>{data.xpTotal.toLocaleString('es')}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue-dark)' }}>XP</span>
            {data.xpParaSiguienteNivel > 0 && (
              <>
                <span style={{ fontSize: 16, color: '#bbd0e6', fontWeight: 600 }}>/</span>
                <span style={{ fontSize: 16, color: '#aac0d6', fontWeight: 600 }}>{data.xpParaSiguienteNivel.toLocaleString('es')} XP</span>
              </>
            )}
          </div>
          {/* XP bar */}
          <div style={{ position: 'relative', height: 14, borderRadius: 99, background: 'rgba(62,111,168,.12)', overflow: 'visible' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--sp-accent)', width: `${xpAnimated}%`, transition: 'width 1.4s cubic-bezier(.22,.68,0,1.2)', position: 'relative' }}>
              {/* Dot tip */}
              <div style={{
                position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--sp-accent)',
                boxShadow: '0 0 0 3px rgba(251,176,59,.25)',
              }} />
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#aac0d6', fontWeight: 600 }}>
            <span>{data.xpTotal.toLocaleString('es')} XP</span>
            {data.xpParaSiguienteNivel > 0 && (
              <span>Nivel {data.nivelGlobal + 1} en {data.xpParaSiguienteNivel.toLocaleString('es')} XP</span>
            )}
          </div>
          {/* Palette picker button */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 24 }}>
            <button
              onClick={onPaletteClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--card-a)', border: '1.5px solid var(--blue-main)',
                borderRadius: 22, padding: '8px 16px', fontSize: 12, fontWeight: 800,
                color: 'var(--blue-dark)', cursor: 'pointer',
              }}
            >
              {[currentPalette.c1, currentPalette.c2, currentPalette.c3].map((c, i) => (
                <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'block', border: '1.5px solid rgba(255,255,255,.7)', flexShrink: 0 }} />
              ))}
              <span>Paleta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab style constants ──────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px',
  color: 'var(--blue-dark)', margin: '28px 0 14px',
}
const CARD: React.CSSProperties = {
  background: 'var(--card-a)', borderRadius: 'var(--sp-radius)',
  boxShadow: 'var(--card-shadow)', border: '1px solid var(--sp-border)',
  width: '100%', boxSizing: 'border-box',
}

// ─── MisionActivaCard ─────────────────────────────────────────────────────────

function MisionIllus() {
  return (
    <svg viewBox="0 0 200 165" width="100%" style={{ maxHeight: 140, display: 'block' }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill="#FBB03B" opacity=".7">
        <path d="M28 28 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z"/>
        <path d="M172 40 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3z"/>
      </g>
      <g fill="#7CB8F5">
        <circle cx="48" cy="20" r="2"/>
        <circle cx="150" cy="22" r="2.4"/>
        <circle cx="20" cy="70" r="1.8"/>
      </g>
      <path d="M18 140 Q70 118 110 134 T188 120" stroke="#7CB8F5" strokeWidth="2.4" strokeDasharray="2 9" strokeLinecap="round" opacity=".7" fill="none"/>
      <line x1="180" y1="118" x2="180" y2="96" stroke="#3E6FA8" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M180 97 L194 101 L180 106 Z" fill="#FBB03B"/>
      <ellipse cx="92" cy="143" rx="62" ry="11" fill="#7CB8F5" opacity=".35"/>
      <rect x="52" y="118" width="78" height="22" rx="11" fill="#3E6FA8"/>
      <circle cx="64" cy="129" r="7.5" fill="#2F3A4A"/><circle cx="64" cy="129" r="3" fill="#7CB8F5"/>
      <circle cx="91" cy="129" r="7.5" fill="#2F3A4A"/><circle cx="91" cy="129" r="3" fill="#7CB8F5"/>
      <circle cx="118" cy="129" r="7.5" fill="#2F3A4A"/><circle cx="118" cy="129" r="3" fill="#7CB8F5"/>
      <path d="M48 96 Q36 100 36 112" stroke="#7CB8F5" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <circle cx="36" cy="114" r="6" fill="#3E6FA8"/>
      <path d="M134 96 Q148 98 150 84" stroke="#7CB8F5" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <circle cx="150" cy="82" r="6" fill="#3E6FA8"/>
      <rect x="54" y="78" width="74" height="44" rx="14" fill="#7CB8F5"/>
      <rect x="54" y="78" width="74" height="44" rx="14" fill="#fff" opacity=".12"/>
      <rect x="78" y="90" width="26" height="22" rx="6" fill="#EBF4FB"/>
      <path d="M92 92 L86 102 L91 102 L89 110 L98 99 L93 99 L96 92 Z" fill="#FBB03B"/>
      <circle cx="64" cy="100" r="3.4" fill="#2596BE"/><circle cx="118" cy="100" r="3.4" fill="#2596BE"/>
      <rect x="64" y="46" width="54" height="38" rx="13" fill="#3E6FA8"/>
      <rect x="71" y="53" width="40" height="24" rx="9" fill="#EBF4FB"/>
      <circle cx="84" cy="65" r="5.5" fill="#2F3A4A"/><circle cx="86" cy="63" r="1.8" fill="#fff"/>
      <circle cx="98" cy="65" r="5.5" fill="#2F3A4A"/><circle cx="100" cy="63" r="1.8" fill="#fff"/>
      <path d="M84 72 Q91 77 98 72" stroke="#2F3A4A" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="58" y="58" width="7" height="14" rx="3" fill="#2596BE"/>
      <rect x="117" y="58" width="7" height="14" rx="3" fill="#2596BE"/>
      <line x1="91" y1="46" x2="91" y2="34" stroke="#3E6FA8" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="91" cy="31" r="5" fill="#FBB03B"/>
      <circle cx="91" cy="31" r="9" fill="#FBB03B" opacity=".25"/>
    </svg>
  )
}

function MisionActivaCard({ mision, ramas }: {
  mision: NonNullable<StudentPortalData['misionActiva']>
  ramas: StudentPortalData['ramas']
}) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--card-a)',
      borderRadius: 24,
      boxShadow: 'var(--card-shadow)',
      border: '1px solid rgba(124,184,245,.20)',
      overflow: 'hidden',
      transition: 'transform .25s, box-shadow .25s',
    }}>
      {/* .mcard-top-deco */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 130,
        background: 'radial-gradient(120% 120% at 80% -10%, var(--blue-main) 0%, transparent 55%), linear-gradient(180deg, var(--card-b) 0%, transparent 100%)',
        pointerEvents: 'none', opacity: .7,
        zIndex: 0,
      }} />

      {/* .mcard-head */}
      <div style={{
        position: 'relative', padding: '18px 20px 0',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 10, zIndex: 2,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--sp-accent)', color: '#fff', borderRadius: 30,
          padding: '6px 13px', fontSize: 11, fontWeight: 900,
          letterSpacing: '.4px', textTransform: 'uppercase',
          boxShadow: '0 3px 10px rgba(251,176,59,.4)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#fff', flexShrink: 0,
            animation: 'blink 1.4s infinite',
          }} />
          En curso
        </span>
        {mision.materialType && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'var(--card-a)', border: '1.5px solid var(--blue-main)',
            color: 'var(--blue-dark)', borderRadius: 30, padding: '6px 13px',
            fontSize: 11, fontWeight: 900, letterSpacing: '.5px', textTransform: 'uppercase',
          }}>
            {mision.materialType}
          </span>
        )}
      </div>

      {/* .mcard-title */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '12px 20px 0',
        fontSize: 34, fontWeight: 900, lineHeight: 1.05,
        letterSpacing: '-.6px', color: 'var(--sp-text)',
      }}>
        {mision.nombre}
      </div>

      {/* .mcard-body */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '16px 20px 4px',
        display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18, alignItems: 'center',
      }}>
        {/* .illus-stage */}
        <div style={{
          position: 'relative', borderRadius: 16,
          background: 'radial-gradient(100% 80% at 50% 20%, var(--card-a) 0%, var(--card-b) 100%)',
          border: '1px solid rgba(124,184,245,.25)',
          aspectRatio: '1 / .82', display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden', padding: '6%',
        }}>
          <MisionIllus />
        </div>

        {/* .mcard-side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* .xp-target */}
          <div style={{
            background: 'var(--card-b)', borderRadius: 16, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid rgba(124,184,245,.25)',
          }}>
            <svg width="34" height="34" viewBox="7 2 16 31" fill="none">
              <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#FBB03B"/>
            </svg>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--blue-dark)', lineHeight: 1 }}>
                {mision.xpMaximo}
                <span style={{ fontSize: 15, color: 'var(--cta)', fontWeight: 800, marginLeft: 3 }}>XP</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                Recompensa máxima
              </div>
            </div>
          </div>

          {/* Skill tokens */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sp-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 9 }}>
              Poderes que entrena
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mision.habilidades.map((h, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'var(--card-a)', border: '1.5px solid rgba(124,184,245,.45)',
                  borderRadius: 30, padding: '5px 13px 5px 5px',
                  transition: 'transform .18s, border-color .18s',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: ramas[h.branchCode]?.color ?? h.branchColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      dangerouslySetInnerHTML={{ __html: branchIconHTML(h.branchCode) }} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sp-text)' }}>{h.nombre}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* .mcard-foot */}
      {mision.fechaInicio && (
        <div style={{ position: 'relative', zIndex: 2, padding: '0 20px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--sp-muted)', fontWeight: 600 }}>
            Desde {new Date(mision.fechaInicio + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}
            {mision.sesionesContadas > 0 && ` · ${mision.sesionesContadas} sesión${mision.sesionesContadas !== 1 ? 'es' : ''}`}
          </span>
        </div>
      )}
      {!mision.fechaInicio && <div style={{ height: 14 }} />}
    </div>
  )
}

// ─── MisionesTab ──────────────────────────────────────────────────────────────

function MisionCard({ p, ramas }: { p: StudentPortalData['proyectos'][0]; ramas: StudentPortalData['ramas'] }) {
  const [expanded, setExpanded] = useState(false)

  const byBranch: Record<string, { col: string; nombre: string; skills: typeof p.habilidades }> = {}
  for (const h of p.habilidades) {
    const col = ramas[h.branchCode]?.color ?? '#7CB8F5'
    const nombre = ramas[h.branchCode]?.nombre ?? h.branchCode
    if (!byBranch[h.branchCode]) byBranch[h.branchCode] = { col, nombre, skills: [] }
    byBranch[h.branchCode].skills.push(h)
  }

  const BRANCH_CODES_ORDER = ['science', 'technology', 'engineering', 'art', 'mathematics', 'transversal']
  const seenCodes = new Set<string>()
  const parts: { code: string; col: string; nombre: string; xp: number; skills: typeof p.habilidades }[] = []
  for (const code of BRANCH_CODES_ORDER) {
    if (byBranch[code]) {
      parts.push({ code, col: byBranch[code].col, nombre: byBranch[code].nombre, skills: byBranch[code].skills, xp: byBranch[code].skills.reduce((a, s) => a + s.xpAward, 0) })
      seenCodes.add(code)
    }
  }
  for (const code of Object.keys(byBranch)) {
    if (!seenCodes.has(code)) parts.push({ code, col: byBranch[code].col, nombre: byBranch[code].nombre, skills: byBranch[code].skills, xp: byBranch[code].skills.reduce((a, s) => a + s.xpAward, 0) })
  }

  const total = parts.reduce((acc, pt) => acc + pt.xp, 0) || 1
  const mainPart = parts.length ? parts.reduce((a, b) => (a.xp >= b.xp ? a : b)) : null

  let angle = 0
  const stops = parts.map(pt => {
    const deg = (pt.xp / total) * 360
    const s = `${pt.col} ${angle.toFixed(1)}deg ${(angle + deg).toFixed(1)}deg`
    angle += deg
    return s
  })
  const donutBg = parts.length ? `conic-gradient(${stops.join(', ')})` : 'var(--card-b)'

  return (
    <div style={{ position: 'relative', background: 'var(--card-a)', borderRadius: 22, boxShadow: 'var(--card-shadow)', border: '1px solid var(--sp-border)', overflow: 'hidden', transition: 'transform .2s, box-shadow .2s' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(135deg, var(--card-b) 0%, ${mainPart ? mainPart.col + '22' : 'var(--card-b)'} 100%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, padding: '12px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', borderRadius: 30, padding: '4px 10px', fontSize: 9.5, fontWeight: 900, letterSpacing: '.3px', textTransform: 'uppercase' as const }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Completada
        </span>
        {p.materialType && (
          <span style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--card-a)', border: '1.5px solid var(--blue-main)', color: 'var(--blue-dark)', borderRadius: 30, padding: '4px 10px', fontSize: 9.5, fontWeight: 900, letterSpacing: '.4px', textTransform: 'uppercase' as const }}>{p.materialType}</span>
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 2, padding: '10px 14px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 78, height: 78, flexShrink: 0, borderRadius: 14, background: 'radial-gradient(100% 80% at 50% 20%, var(--warm), var(--card-b))', border: '1px solid var(--sp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -7, left: -7, width: 26, height: 26, borderRadius: '50%', background: 'var(--sp-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.22)', border: '2px solid var(--card-a)', zIndex: 2 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff"/></svg>
          </div>
          {mainPart && (
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: branchIconHTML(mainPart.code, mainPart.col) }} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.3px', color: 'var(--sp-text)' }}>{p.nombre}</div>
          <div style={{ fontSize: 13.5, color: 'var(--sp-muted)', fontWeight: 600, marginTop: 3 }}>
            {p.fechaInicio && p.fechaFin
              ? (p.fechaInicio === p.fechaFin ? fmtDate(p.fechaInicio) : `${fmtDate(p.fechaInicio)} â€“ ${fmtDate(p.fechaFin)}`)
              : fmtDate(p.evaluadoEn)}
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minWidth: 0 }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: donutBg }}>
            <div style={{ position: 'absolute', top: '10px', right: '10px', bottom: '10px', left: '10px', background: 'var(--card-a)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', lineHeight: 1 }}>
              <b style={{ fontSize: 19, fontWeight: 900, color: 'var(--blue-dark)', display: 'block' }}>{p.xpTotal}</b>
              <small style={{ fontSize: 7, fontWeight: 900, color: 'var(--sp-muted)', textTransform: 'uppercase' as const, letterSpacing: '.3px' }}>XP total</small>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
            {parts.map(pt => (
              <div key={pt.code} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: pt.col }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--sp-text)' }}>{pt.nombre}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-muted)', flexShrink: 0 }}>{pt.skills.length} pod.</span>
                <span style={{ fontSize: 13.5, fontWeight: 900, flexShrink: 0, marginLeft: 2, color: pt.col }}>+{pt.xp}</span>
              </div>
            ))}
          </div>
        </div>
        {parts.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, paddingTop: 12, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, width: '100%', borderTop: '1.5px dashed var(--sp-border)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--blue-dark)', cursor: 'pointer', transition: 'opacity .15s', textAlign: 'left' as const }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ver poderes por rama
            </button>
            {expanded && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {parts.map(pt => {
                  const maxXp = Math.max(...pt.skills.map(s => s.xpAward), 1)
                  return (
                    <div key={pt.code}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: pt.col }} />
                        <span style={{ fontSize: 12.5, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '.4px', color: pt.col }}>{pt.nombre}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--sp-muted)', marginLeft: 'auto' }}>+{pt.xp} XP</span>
                      </div>
                      {[...pt.skills].sort((a, b) => b.xpAward - a.xpAward).map((sk, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sp-text)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sk.nombre}</span>
                          <div style={{ width: 72, flexShrink: 0, height: 6, background: 'var(--card-b)', borderRadius: 30, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round((sk.xpAward / maxXp) * 100)}%`, background: pt.col, borderRadius: 30, transition: 'width .8s cubic-bezier(.22,.68,0,1.2)' }} />
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 900, width: 40, textAlign: 'right' as const, flexShrink: 0, color: pt.col }}>+{sk.xpAward}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MisionesTab({ data }: { data: StudentPortalData }) {
  const [showAll, setShowAll] = useState(false)
  const INITIAL_COUNT = 6
  const shown = showAll ? data.proyectos : data.proyectos.slice(0, INITIAL_COUNT)
  return (
    <div style={{ padding: '0 20px', paddingBottom: 32 }}>
      <div style={SECTION_TITLE}>Archivo de misiones</div>
      {data.proyectos.length === 0 ? (
        <div style={{ ...CARD, padding: 32, textAlign: 'center', color: 'var(--sp-muted)', fontSize: 13 }}>Sin misiones aún</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
            {shown.map(proj => <MisionCard key={proj.id} p={proj} ramas={data.ramas} />)}
          </div>
          {!showAll && data.proyectos.length > INITIAL_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '16px auto 0', padding: '10px 24px', borderRadius: 30, background: 'var(--card-a)', border: '1.5px solid var(--blue-main)', color: 'var(--blue-dark)', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'opacity .15s', fontFamily: 'inherit' }}
            >
              Ver todas las misiones →
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Galaxia de Poderes ───────────────────────────────────────────────────────

type GalaxiaView = 'niveles' | 'radar' | 'despegues'
type RamaData = StudentPortalData['ramas'][string]

const BRANCH_MINI: Record<string, string> = {
  Science:      '<path d="M9 3H15M10 3V9L5 19a1.5 1.5 0 001.4 2H17.6a1.5 1.5 0 001.4-2L14 9V3" stroke="#fff" stroke-width="1.9" fill="none" stroke-linejoin="round"/><path d="M7.5 15H16.5" stroke="#fff" stroke-width="1.9"/>',
  Technology:   '<rect x="7" y="7" width="10" height="10" rx="2" stroke="#fff" stroke-width="1.9" fill="none"/><path d="M10 4V7M14 4V7M10 17V20M14 17V20M4 10H7M4 14H7M17 10H20M17 14H20" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>',
  Engineering:  '<circle cx="12" cy="12" r="3.2" stroke="#fff" stroke-width="1.9" fill="none"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.4 6.4l2.1 2.1M15.5 15.5l2.1 2.1M17.6 6.4l-2.1 2.1M8.5 15.5l-2.1 2.1" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>',
  Art:          '<path d="M12 4C7 4 4 8 4 12c0 4 3 6 6 6 1.5 0 1.5-2 3-2 2 0 2 2 4 1 3-1.5 3-8.5-1-11C14.5 4 13 4 12 4Z" stroke="#fff" stroke-width="1.9" fill="none"/><circle cx="8.5" cy="10.5" r="1.4" fill="#fff"/><circle cx="13" cy="8" r="1.4" fill="#fff"/><circle cx="16" cy="11" r="1.4" fill="#fff"/>',
  Maths:        '<path d="M5 18L17 18L5 8Z" stroke="#fff" stroke-width="1.9" fill="none" stroke-linejoin="round"/><path d="M9 6A9 9 0 0119 13" stroke="#fff" stroke-width="1.7" fill="none" stroke-dasharray="1 3" stroke-linecap="round"/>',
  Transversals: '<circle cx="7" cy="8" r="2.4" stroke="#fff" stroke-width="1.9" fill="none"/><circle cx="17" cy="8" r="2.4" stroke="#fff" stroke-width="1.9" fill="none"/><circle cx="12" cy="17" r="2.4" stroke="#fff" stroke-width="1.9" fill="none"/><path d="M9.2 8.6L14.8 8.6M8.2 10L10.6 14.8M15.8 10L13.4 14.8" stroke="#fff" stroke-width="1.6"/>',
}

const BRANCH_KEY_MAP: Record<string, string> = {
  science:      'Science',
  technology:   'Technology',
  engineering:  'Engineering',
  art:          'Art',
  mathematics:  'Maths',
  maths:        'Maths',
  transversal:  'Transversals',
  transversals: 'Transversals',
}

function branchIconHTML(code: string, color = '#fff'): string {
  const normalizedKey = BRANCH_KEY_MAP[code.toLowerCase()]
    ?? Object.keys(BRANCH_MINI).find(k => k.toLowerCase() === code.toLowerCase())
    ?? code
  const raw = BRANCH_MINI[normalizedKey] ?? ''
  if (!raw) return ''
  return raw
    .replace(/stroke="#fff"/g, `stroke="${color}"`)
    .replace(/fill="#fff"/g, `fill="${color}"`)
}

const BRANCH_ORDER = ['Science', 'Technology', 'Engineering', 'Art', 'Maths', 'Transversals']

function polarPt(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg - 90) * Math.PI / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function parseColor(s: string): [number, number, number] {
  s = s.trim()
  if (s.startsWith('#')) {
    let h = s.replace('#', '')
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
  }
  const m = s.match(/\d+/g) ?? []
  return [+(m[0] ?? '0'), +(m[1] ?? '0'), +(m[2] ?? '0')]
}
function tintC(col: string, t: number): string {
  const [r,g,b] = parseColor(col)
  return `rgb(${Math.round(r+(255-r)*t)},${Math.round(g+(255-g)*t)},${Math.round(b+(255-b)*t)})`
}
function shadeC(col: string, t: number): string {
  const [r,g,b] = parseColor(col)
  return `rgb(${Math.round(r+(22-r)*t)},${Math.round(g+(30-g)*t)},${Math.round(b+(46-b)*t)})`
}
function rgbaC(col: string, a: number): string {
  const [r,g,b] = parseColor(col)
  return `rgba(${r},${g},${b},${a})`
}

function PlanetCard({ code, rama, index, isMax, onClick, mounted }: {
  code: string; rama: RamaData; index: number; isMax: boolean; onClick: () => void; mounted: boolean
}) {
  const CX = 60, CY = 60
  const lv = Math.max(2, rama.lv)
  const R = 20 + (lv - 2) * 4.6
  const halo = R + 5 + lv * 1.8
  const col = rama.color
  const [m1x, m1y] = polarPt(CX, CY, R + 13, 0 * 180 + index * 30)
  const [m2x, m2y] = polarPt(CX, CY, R + 13, 1 * 180 + index * 30)
  const bx = (CX + R * 0.72).toFixed(1)
  const by = (CY + R * 0.72).toFixed(1)
  const es = R
  const iconPaths = branchIconHTML(code)
  const bgLight = tintC(col, .88)
  const bgMid   = tintC(col, .78)
  const border  = tintC(col, .6)
  const moonsStr = `<circle cx="${m1x.toFixed(1)}" cy="${m1y.toFixed(1)}" r="3.4" fill="#fff"/><circle cx="${m1x.toFixed(1)}" cy="${m1y.toFixed(1)}" r="2.4" fill="${tintC(col,.2)}"/><circle cx="${m2x.toFixed(1)}" cy="${m2y.toFixed(1)}" r="3.4" fill="#fff"/><circle cx="${m2x.toFixed(1)}" cy="${m2y.toFixed(1)}" r="2.4" fill="${tintC(col,.2)}"/>`
  const inner = `
    <circle cx="${CX}" cy="${CY}" r="${halo.toFixed(1)}" fill="${col}" opacity=".14"/>
    <circle cx="${CX}" cy="${CY}" r="${(R+13).toFixed(1)}" fill="none" stroke="${tintC(col,.55)}" stroke-width="1.1" stroke-dasharray="2 7"/>
    <g style="animation:spin 22s linear infinite;transform-box:view-box;transform-origin:${CX}px ${CY}px;animation-delay:${(-index*1.3).toFixed(1)}s">${moonsStr}</g>
    <g style="animation:bob 4.4s ease-in-out infinite;transform-box:view-box;transform-origin:center;animation-delay:${(-index*0.5).toFixed(1)}s">
      <circle cx="${CX}" cy="${CY}" r="${R.toFixed(1)}" fill="${shadeC(col,.16)}"/>
      <circle cx="${CX}" cy="${CY}" r="${R.toFixed(1)}" fill="${col}"/>
      <ellipse cx="${(CX-R*0.32).toFixed(1)}" cy="${(CY-R*0.34).toFixed(1)}" rx="${(R*0.42).toFixed(1)}" ry="${(R*0.26).toFixed(1)}" fill="#fff" opacity=".2"/>
      <circle cx="${CX}" cy="${CY}" r="${R.toFixed(1)}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>
      <g transform="translate(${(CX-es/2).toFixed(1)},${(CY-es/2).toFixed(1)})"><svg width="${es.toFixed(0)}" height="${es.toFixed(0)}" viewBox="0 0 24 24" fill="none">${iconPaths}</svg></g>
      <circle cx="${bx}" cy="${by}" r="13" fill="#fff" stroke="${col}" stroke-width="2.5"/>
      <text x="${bx}" y="${(+by+4.5).toFixed(1)}" text-anchor="middle" font-family="Figtree,system-ui" font-size="13" font-weight="900" fill="${col}">${lv}</text>
    </g>
  `
  return (
    <div onClick={onClick} style={{
      position: 'relative', borderRadius: 22, border: '1px solid var(--sp-border)',
      boxShadow: 'var(--card-shadow)', padding: '14px 12px 12px', cursor: 'pointer',
      background: 'var(--card-a)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden',
      transition: 'transform .18s,box-shadow .18s',
    }}>
      {isMax && (
        <div style={{ position: 'absolute', top: 9, right: 9, display: 'flex', alignItems: 'center', gap: 3, background: 'var(--sp-accent)', color: '#5a3a00', fontSize: 9.5, fontWeight: 900, padding: '3px 8px 3px 6px', borderRadius: 30, textTransform: 'uppercase' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#5a3a00"><path d="M3 7l4 4 5-6 5 6 4-4-2 12H5z"/></svg>
          Top
        </div>
      )}
      <svg viewBox="0 0 120 120" style={{ width: 108, height: 108, display: 'block', overflow: 'visible' }}
        dangerouslySetInnerHTML={{ __html: inner }} />
      <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.3px', marginTop: 5, color: shadeC(col,.1) }}>{rama.nombre}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 900, marginTop: 7, color: shadeC(col,.1) }}>
        <svg width="11" height="16" viewBox="7 2 16 31" fill="none"><path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill={col}/></svg>
        {rama.xp.toLocaleString('es')} XP
      </div>
      <div style={{ width: '100%', marginTop: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 10.5, fontWeight: 900, flexShrink: 0, color: shadeC(col,.15) }}>Nv {lv}</span>
          <div style={{ flex: 1, height: 8, background: tintC(col,.65), borderRadius: 30, overflow: 'hidden' }}>
            <div style={{ display: 'block', height: '100%', borderRadius: 30, background: `linear-gradient(90deg,${col},${shadeC(col,.2)})`, width: mounted ? `${Math.min(100,Math.round(rama.lv*100/7))}%` : '0%', transition: 'width 1s cubic-bezier(.22,.68,0,1.2)' }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 900, borderRadius: 10, padding: '6px 10px', width: '100%', border: '1px dashed var(--sp-border)', color: 'var(--blue-dark)', background: 'transparent' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" fill={col}/><path d="M8 11V8a4 4 0 018 0" stroke={col} strokeWidth="2" fill="none"/></svg>
        Ver {rama.habilidades.length} poderes
      </div>
    </div>
  )
}

function NivelesView({ ramas, onBranchClick }: { ramas: [string, RamaData][]; onBranchClick: (code: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  if (ramas.length === 0) {
    return <div style={{ ...CARD, padding: 32, textAlign: 'center' as const, color: 'var(--sp-muted)', fontSize: 13 }}>Sin planetas aún</div>
  }
  const maxLv = Math.max(...ramas.map(([, r]) => r.lv))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
      {ramas.map(([code, rama], i) => (
        <PlanetCard key={code} code={code} rama={rama} index={i} isMax={rama.lv === maxLv} onClick={() => onBranchClick(code)} mounted={mounted} />
      ))}
    </div>
  )
}

const RADAR_BRANCHES = ['science', 'technology', 'engineering', 'art', 'mathematics', 'transversal'] as const
const RADAR_LABELS: Record<string, string> = {
  science: 'Ciencia', technology: 'Tecnología', engineering: 'Ingeniería',
  art: 'Arte', mathematics: 'Matemáticas', transversal: 'Transversal',
}

function RadarView({ data }: { data: StudentPortalData }) {
  const cx = 150, cy = 150, maxR = 100
  const N = 6

  function hexPath(r: number): string {
    return RADAR_BRANCHES.map((_, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + 'Z'
  }

  const dataPoints = RADAR_BRANCHES.map((code, i) => {
    const value = data.ramas[code]?.progPct ?? 0
    const r = (value / 100) * maxR
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, code, value }
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      <svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: 340 }}>
        {[25, 50, 75, 100].map(pct => (
          <path key={pct} d={hexPath(maxR * pct / 100)}
            fill="none" stroke="rgba(62,111,168,0.12)" strokeWidth="1" />
        ))}
        {RADAR_BRANCHES.map((code, i) => {
          const angle = (i / N) * Math.PI * 2 - Math.PI / 2
          const color = data.ramas[code]?.color ?? '#7CB8F5'
          return (
            <line key={code}
              x1={cx} y1={cy}
              x2={cx + Math.cos(angle) * maxR}
              y2={cy + Math.sin(angle) * maxR}
              stroke={color} strokeWidth="1.5" strokeOpacity="0.35" />
          )
        })}
        <path d={dataPath}
          fill="rgba(37,150,190,0.15)"
          stroke="var(--cta)"
          strokeWidth="2"
          strokeLinejoin="round" />
        {dataPoints.map((p) => {
          const color = data.ramas[p.code]?.color ?? '#7CB8F5'
          return p.value > 0 ? (
            <circle key={p.code} cx={p.x} cy={p.y} r="5"
              fill={color} stroke="white" strokeWidth="1.5" />
          ) : null
        })}
        <g transform={`translate(${cx - 9}, ${cy - 15}) scale(0.6)`}>
          <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z"
            fill="var(--sp-accent)" />
        </g>
        {RADAR_BRANCHES.map((code, i) => {
          const angle = (i / N) * Math.PI * 2 - Math.PI / 2
          const labelR = maxR + 22
          const x = cx + Math.cos(angle) * labelR
          const y = cy + Math.sin(angle) * labelR
          const color = data.ramas[code]?.color ?? '#8aa4be'
          const nombre = data.ramas[code]?.nombre ?? RADAR_LABELS[code]
          return (
            <text key={code} x={x} y={y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="700" fill={color}
              style={{ fontFamily: 'var(--font-figtree, system-ui)' }}>
              {nombre}
            </text>
          )
        })}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12, padding: '0 16px' }}>
        {RADAR_BRANCHES.filter(code => data.ramas[code]).map(code => {
          const rama = data.ramas[code]!
          return (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--sp-text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: rama.color, display: 'block' }} />
              {rama.nombre} · Nv.{rama.lv}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildDespeguesSVG(ramas: [string, RamaData][]): { content: string; W: number; Hh: number } {
  const W = 470
  const scale = 1
  const Hh = Math.round(W * 0.81)
  const ground = Math.round(Hh * 0.826)
  const topY = Math.round(Hh * 0.21)
  const range = ground - topY
  const ramaMap = Object.fromEntries(ramas)
  const maxXP = Math.max(...ramas.map(([, r]) => r.xp), 1)
  const progMap: Record<string, number> = {}
  ramas.forEach(([code, rama]) => { progMap[code] = (rama.xp / maxXP) * 100 })
  const soon = BRANCH_ORDER.filter(c => ramaMap[c]).sort((a, b) => progMap[b] - progMap[a])[0] ?? ''
  const boltPath = 'M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z'

  function colX(branchIdx: number): number { return Math.round(W * 0.11 + branchIdx * (W * 0.78) / 5) }

  function rocketSVG(x: number, p: number, code: string, isL: boolean, idx: number): string {
    const col = ramaMap[code].color
    const light = tintC(col, .42)
    const dark = shadeC(col, .25)
    const [cr, cg, cb] = parseColor(col)
    const noseY = ground - p / 100 * range
    const headR = Math.round(13 * scale)
    const headCY = noseY + headR
    const bw = Math.round(22 * scale)
    const bodyTop = headCY + 3
    const bodyH = Math.round(26 * scale)
    const bodyBot = bodyTop + bodyH
    const noz = bodyBot + Math.round(5 * scale)
    const off = (ground - noseY).toFixed(1)
    const bobDur = (3.6 + idx * 0.22).toFixed(2)
    const bobDelay = (-idx * 0.7).toFixed(2)
    const fL = (12 + (p / 100) * 26) * scale
    const fw = (5 + (p / 100) * 3.4) * scale
    const fw2 = fw * 0.5
    const fin = Math.round(15 * scale)
    const arm = Math.round(11 * scale)
    const nz = Math.round(6 * scale)
    const nz2 = Math.round(8 * scale)
    const iconS = Math.round(18 * scale)
    const haloA = (0.14 + p / 100 * 0.40).toFixed(2)
    const haloR = (15 * scale + p * 0.16).toFixed(1)
    const iconPaths = branchIconHTML(code, col)

    let g = `<g class="gx-r-launch" data-off="${off}" style="transform:translateY(${off}px);transition:transform 1.7s cubic-bezier(.22,.72,.2,1);">`
    g += `<g class="gx-r-bob" style="transform-origin:${x}px ${bodyBot}px;animation:rbob ${bobDur}s ease-in-out infinite;animation-delay:${bobDelay}s">`
    g += `<circle cx="${x}" cy="${(noseY + 24 * scale).toFixed(1)}" r="${haloR}" fill="rgba(${cr},${cg},${cb},${haloA})" style="filter:blur(${Math.round(9 * scale)}px)"/>`
    g += `<line x1="${x}" y1="${(noz + 3 * scale).toFixed(1)}" x2="${x}" y2="${ground}" stroke="${col}" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round" opacity=".32"/>`
    g += `<g class="gx-flame" style="transform-origin:${x}px ${noz}px;animation:flame 1.15s ease-in-out infinite alternate">`
    g += `<path d="M${(x-fw).toFixed(1)} ${noz} C${(x-fw).toFixed(1)} ${(noz+fL*0.42).toFixed(1)} ${(x-fw2).toFixed(1)} ${(noz+fL*0.74).toFixed(1)} ${x} ${(noz+fL).toFixed(1)} C${(x+fw2).toFixed(1)} ${(noz+fL*0.74).toFixed(1)} ${(x+fw).toFixed(1)} ${(noz+fL*0.42).toFixed(1)} ${(x+fw).toFixed(1)} ${noz} Z" fill="#F97316"/>`
    g += `<path d="M${(x-fw*0.66).toFixed(1)} ${noz} C${(x-fw*0.66).toFixed(1)} ${(noz+fL*0.38).toFixed(1)} ${(x-fw2*0.6).toFixed(1)} ${(noz+fL*0.62).toFixed(1)} ${x} ${(noz+fL*0.82).toFixed(1)} C${(x+fw2*0.6).toFixed(1)} ${(noz+fL*0.62).toFixed(1)} ${(x+fw*0.66).toFixed(1)} ${(noz+fL*0.38).toFixed(1)} ${(x+fw*0.66).toFixed(1)} ${noz} Z" fill="#FBB03B"/>`
    g += `<path d="M${(x-fw*0.34).toFixed(1)} ${noz} C${(x-fw*0.34).toFixed(1)} ${(noz+fL*0.28).toFixed(1)} ${x} ${(noz+fL*0.44).toFixed(1)} ${x} ${(noz+fL*0.56).toFixed(1)} C${x} ${(noz+fL*0.44).toFixed(1)} ${(x+fw*0.34).toFixed(1)} ${(noz+fL*0.28).toFixed(1)} ${(x+fw*0.34).toFixed(1)} ${noz} Z" fill="#FFF3C6"/>`
    g += `</g>`
    g += `<path d="M${x-bw/2+2} ${bodyBot-fin} Q${x-bw/2-arm} ${bodyBot-2} ${x-bw/2-nz} ${bodyBot+nz} Q${x-bw/2-2} ${bodyBot+2} ${x-bw/2+2} ${bodyBot} Z" fill="${dark}"/>`
    g += `<path d="M${x+bw/2-2} ${bodyBot-fin} Q${x+bw/2+arm} ${bodyBot-2} ${x+bw/2+nz} ${bodyBot+nz} Q${x+bw/2+2} ${bodyBot+2} ${x+bw/2-2} ${bodyBot} Z" fill="${dark}"/>`
    g += `<path d="M${x-nz} ${bodyBot} L${x+nz} ${bodyBot} L${x+nz2} ${noz} L${x-nz2} ${noz} Z" fill="${dark}"/>`
    g += `<rect x="${x-bw/2}" y="${bodyTop}" width="${bw}" height="${bodyH}" rx="${Math.round(9*scale)}" fill="${col}"/>`
    g += `<rect x="${x-bw/2+3.5*scale}" y="${bodyTop+4*scale}" width="${Math.round(5*scale)}" height="${bodyH-9*scale}" rx="${Math.round(2.5*scale)}" fill="${light}" opacity=".55"/>`
    g += `<rect x="${x-bw/2}" y="${bodyBot-9*scale}" width="${bw}" height="${Math.round(5*scale)}" fill="${dark}" opacity=".5"/>`
    g += `<circle cx="${x}" cy="${headCY}" r="${headR}" fill="#fff"/>`
    g += `<circle cx="${x}" cy="${headCY}" r="${headR}" fill="none" stroke="${col}" stroke-width="${(3*scale).toFixed(1)}"/>`
    g += `<g transform="translate(${(x-iconS/2).toFixed(1)},${(headCY-iconS/2).toFixed(1)})"><svg width="${iconS}" height="${iconS}" viewBox="0 0 24 24" fill="none">${iconPaths}</svg></g>`
    g += `<circle cx="${x}" cy="${(noseY-2).toFixed(1)}" r="${(2.2*scale).toFixed(1)}" fill="${col}"/>`
    if (isL) {
      const lw = Math.round(62 * scale), lh = Math.round(20 * scale), lfs = Math.max(8, Math.round(10 * scale))
      g += `<g transform="translate(${(x+15*scale).toFixed(1)},${(noseY-26*scale).toFixed(1)})"><rect x="0" y="0" width="${lw}" height="${lh}" rx="${Math.round(10*scale)}" fill="#2F3A4A"/><text x="${lw/2}" y="${lh*0.72}" text-anchor="middle" font-family="Figtree,system-ui" font-size="${lfs}" font-weight="900" fill="#fff">¡a punto!</text></g>`
    }
    g += '</g></g>'
    return g
  }

  function boltMeter(x: number, by: number, p: number, code: string, idx: number): string {
    const bH = Math.round(36 * scale), bW = Math.round(bH * 16 / 31)
    const bx = x - bW / 2
    const col = ramaMap[code].color
    const light = tintC(col, .62)
    return `<svg x="${bx.toFixed(1)}" y="${by}" width="${bW.toFixed(1)}" height="${bH}" viewBox="7 2 16 31" overflow="visible">`
      + `<defs><clipPath id="gxbc${idx}"><path d="${boltPath}"/></clipPath></defs>`
      + `<path d="${boltPath}" fill="${light}"/>`
      + `<g clip-path="url(#gxbc${idx})"><rect class="gx-bolt-liq" x="6" y="2" width="18" height="31.6" fill="${col}" style="transform:scaleY(0);transition:transform 0.8s cubic-bezier(.22,.72,.2,1)" data-s="${(p/100).toFixed(3)}"/></g>`
      + `<path d="${boltPath}" fill="none" stroke="${col}" stroke-width="1.3" stroke-linejoin="round"/></svg>`
  }

  const fs = Math.max(7, Math.round(8.5 * scale))
  const fs2 = Math.max(8, Math.round(9.5 * scale))
  const lx = Math.round(36 * scale), rx = W - Math.round(16 * scale)
  const bmW = Math.round(38 * scale), bmH = Math.round(15 * scale)
  const bmY = Math.round(5 * scale), bmLblY = Math.round(48 * scale)
  const gl = Math.round(16 * scale)

  let s = `<defs><linearGradient id="gxsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7F1FF"/><stop offset="1" stop-color="#FBFDFF"/></linearGradient></defs>`
  s += `<rect width="${W}" height="${Hh}" fill="url(#gxsky)"/>`
  ;[25, 50, 75].forEach(t => {
    const y = (ground - t / 100 * range).toFixed(1)
    s += `<line x1="${lx}" y1="${y}" x2="${rx}" y2="${y}" stroke="#7CB8F5" stroke-width="1" stroke-dasharray="2 6" opacity=".3"/>`
    s += `<text x="${lx-4}" y="${(+y+3).toFixed(1)}" text-anchor="end" font-family="Figtree,system-ui" font-size="${fs}" font-weight="800" fill="#9bb4cf">${t}%</text>`
  })
  s += `<line x1="${lx}" y1="${topY}" x2="${rx}" y2="${topY}" stroke="var(--sp-accent)" stroke-width="1.5" stroke-dasharray="3 5" stroke-linecap="round" opacity=".5"/>`
  BRANCH_ORDER.forEach((code, i) => {
    if (!ramaMap[code]) return
    const x = colX(i)
    s += `<line x1="${x}" y1="${Math.round(46*scale)}" x2="${x}" y2="${ground}" stroke="${ramaMap[code].color}" stroke-width="1" stroke-dasharray="1 8" stroke-linecap="round" opacity=".2"/>`
    s += boltMeter(x, bmY, progMap[code], code, i)
    s += `<g transform="translate(${(x-bmW/2).toFixed(1)},${bmLblY})"><rect width="${bmW}" height="${bmH}" rx="${Math.round(7.5*scale)}" fill="#fff" stroke="${ramaMap[code].color}" stroke-width="1.4"/><text x="${bmW/2}" y="${bmH*0.73}" text-anchor="middle" font-family="Figtree,system-ui" font-size="${fs}" font-weight="900" fill="${ramaMap[code].color}">Niv ${ramaMap[code].lv+1}</text></g>`
  })
  s += `<path d="M0 ${ground} Q${W/2} ${ground-gl} ${W} ${ground} L${W} ${Hh} L0 ${Hh} Z" fill="#DCEBFB"/>`
  s += `<path d="M0 ${ground+gl} Q${W/2} ${ground-2} ${W} ${ground+gl} L${W} ${Hh} L0 ${Hh} Z" fill="#C6DDF5"/>`
  BRANCH_ORDER.forEach((code, i) => {
    if (!ramaMap[code]) return
    s += rocketSVG(colX(i), progMap[code], code, code === soon, i)
  })
  BRANCH_ORDER.forEach((code, i) => {
    if (!ramaMap[code]) return
    const x = colX(i)
    s += `<text x="${x}" y="${ground+Math.round(20*scale)}" text-anchor="middle" font-family="Figtree,system-ui" font-size="${fs2}" font-weight="900" fill="${ramaMap[code].color}">${ramaMap[code].nombre}</text>`
    s += `<text x="${x}" y="${ground+Math.round(32*scale)}" text-anchor="middle" font-family="Figtree,system-ui" font-size="${fs}" font-weight="800" fill="#9bb4cf">Niv ${ramaMap[code].lv} · ${Math.round(progMap[code])}%</text>`
  })
  return { content: s, W, Hh }
}

function DespeguesView({ ramas }: { ramas: [string, RamaData][] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { content, W, Hh } = buildDespeguesSVG(ramas)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.querySelectorAll<SVGElement & { dataset: DOMStringMap }>('.gx-r-launch').forEach((g, i) => {
      const off = g.getAttribute('data-off') ?? '0'
      g.style.transform = `translateY(${off}px)`
      void svg.getBoundingClientRect()
      setTimeout(() => { g.style.transform = 'translateY(0)' }, 150 + i * 140)
    })
    svg.querySelectorAll<SVGElement & { dataset: DOMStringMap }>('.gx-bolt-liq').forEach((el, i) => {
      el.style.transform = 'scaleY(0)'
      void svg.getBoundingClientRect()
      setTimeout(() => { el.style.transform = `scaleY(${el.getAttribute('data-s') ?? '0'})` }, 350 + i * 140)
    })
  }, [ramas])

  if (ramas.length === 0) {
    return <div style={{ ...CARD, padding: 32, textAlign: 'center' as const, color: 'var(--sp-muted)', fontSize: 13 }}>Sin datos aún</div>
  }
  return (
    <div style={{ background: 'var(--card-a)', borderRadius: 16, border: '1px solid rgba(124,184,245,.18)', boxShadow: '0 6px 20px rgba(62,111,168,.1)', overflow: 'hidden', marginBottom: 10 }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${Hh}`} width="100%" style={{ display: 'block' }}
        dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

function PovOverlay({
  branchCode,
  rama,
  onClose,
}: {
  branchCode: string
  rama: StudentPortalData['ramas'][string]
  onClose: () => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [cardWidth, setCardWidth] = useState(300)
  const [gap, setGap] = useState(20)

  const col = rama.color
  const skills = rama.habilidades.slice().sort((a, b) => b.xp - a.xp)
  const iconPaths = branchIconHTML(branchCode)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function layout() {
      const stage = stageRef.current
      if (!stage) return
      const cw = Math.min(Math.round(window.innerWidth * 0.82), 360)
      const g = window.innerWidth < 520 ? 20 : 30
      const pad = Math.max(0, (stage.clientWidth - cw) / 2)
      stage.style.paddingLeft = pad + 'px'
      stage.style.paddingRight = pad + 'px'
      setCardWidth(cw)
      setGap(g)
    }
    layout()
    window.addEventListener('resize', layout)
    return () => window.removeEventListener('resize', layout)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const handler = () => {
      const cw = Math.min(Math.round(window.innerWidth * 0.82), 360)
      const g = window.innerWidth < 520 ? 20 : 30
      const idx = Math.round(stage.scrollLeft / (cw + g))
      setActiveIdx(Math.max(0, Math.min(idx, skills.length - 1)))
    }
    stage.addEventListener('scroll', handler, { passive: true })
    return () => stage.removeEventListener('scroll', handler)
  }, [skills.length])

  useEffect(() => {
    const stage = stageRef.current
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (!stage) return
      const cw = Math.min(Math.round(window.innerWidth * 0.82), 360)
      const g = window.innerWidth < 520 ? 20 : 30
      if (e.key === 'ArrowRight') stage.scrollBy({ left: cw + g, behavior: 'smooth' })
      if (e.key === 'ArrowLeft') stage.scrollBy({ left: -(cw + g), behavior: 'smooth' })
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function navTo(i: number) {
    const stage = stageRef.current
    if (!stage) return
    const clamped = Math.max(0, Math.min(i, skills.length - 1))
    stage.scrollTo({ left: clamped * (cardWidth + gap), behavior: 'smooth' })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 35%,#ffffff 0%,#F3F7FE 45%,var(--warm) 100%)',
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <span style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(85px)', opacity: .4, width: '56vmin', height: '56vmin', background: 'var(--blue-main)', left: '-14vmin', top: '-12vmin', animation: 'drift1 23s ease-in-out infinite' }} />
        <span style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(85px)', opacity: .3, width: '48vmin', height: '48vmin', background: 'var(--cta)', right: '-16vmin', bottom: '4vmin', animation: 'drift2 29s ease-in-out infinite' }} />
        <span style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(85px)', opacity: .26, width: '42vmin', height: '42vmin', background: 'var(--sp-accent)', left: '32vmin', bottom: '-16vmin', animation: 'drift3 26s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: '-25%', backgroundRepeat: 'repeat', opacity: .6, backgroundImage: 'radial-gradient(2px 2px at 30px 40px,var(--blue-main),transparent),radial-gradient(2px 2px at 120px 90px,var(--cta),transparent),radial-gradient(1.5px 1.5px at 180px 30px,var(--blue-main),transparent),radial-gradient(2px 2px at 80px 160px,var(--sp-accent),transparent)', backgroundSize: '220px 220px', animation: 'pan1 90s linear infinite,tw 4s ease-in-out infinite' }} />
        <span style={{ position: 'absolute', top: '18%', left: '-10%', width: 130, height: 2, background: 'linear-gradient(90deg,transparent,var(--blue-dark))', borderRadius: 2, opacity: 0, animation: 'shoot 9s ease-in infinite' }} />
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '70vmin', height: '70vmin', borderRadius: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(65px)', opacity: .3, zIndex: 1, animation: 'glowpulse 5s ease-in-out infinite', background: `radial-gradient(circle,${col},transparent 70%)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', zIndex: 8 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: iconPaths }} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.4px', color: shadeC(col, .15), lineHeight: 1 }}>{rama.nombre}</div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--sp-muted)', marginTop: 2 }}>Poder {activeIdx + 1} de {skills.length}</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--card-a)', boxShadow: '0 4px 14px rgba(62,111,168,.18)', fontSize: 18, fontWeight: 900, color: 'var(--sp-text)', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
      </div>
      <div
        ref={stageRef}
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x proximity', scrollbarWidth: 'none', perspective: 1600, zIndex: 2 }}
      >
        {skills.map((h, i) => (
          <div
            key={h.skillId}
            style={{ width: cardWidth, flexShrink: 0, scrollSnapAlign: 'center', position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,.62)', backdropFilter: 'blur(16px) saturate(1.3)', borderRadius: 26, padding: '26px 24px 28px', border: '1px solid rgba(255,255,255,.75)', boxShadow: '0 22px 60px rgba(20,40,70,.18)', willChange: 'transform, opacity', transformOrigin: 'center center', marginRight: i < skills.length - 1 ? gap : 0 }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 26, background: 'linear-gradient(155deg,rgba(255,255,255,.55),rgba(255,255,255,0) 42%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: iconPaths }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' as const, color: col }}>Nivel {h.lv}</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.5px', lineHeight: 1.05, marginTop: 4, color: shadeC(col, .15) }}>{h.nombre}</div>
              <div style={{ display: 'flex', gap: 4, margin: '12px 0 14px', flexWrap: 'wrap' }}>
                {Array.from({ length: h.lv }, (_, k) => (
                  <span key={k} style={{ width: 9, height: 9, borderRadius: '50%', background: col, display: 'block' }} />
                ))}
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: tintC(col, .6), display: 'block', transform: 'scale(.8)', opacity: .6 }} />
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 900, padding: '5px 12px', borderRadius: 30, background: tintC(col, .88), color: shadeC(col, .2) }}>
                <svg width="10" height="14" viewBox="7 2 16 31" fill="none"><path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="currentColor" /></svg>
                {h.xp} XP
              </span>
              {h.descripcion && (
                <p style={{ fontSize: 13.5, fontWeight: 600, color: '#5b7488', lineHeight: 1.55, marginTop: 14, marginBottom: 0 }}>{h.descripcion}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 68, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 10, flexWrap: 'wrap', padding: '0 16px' }}>
        {skills.map((_, i) => (
          <button key={i} onClick={() => navTo(i)} style={{ boxSizing: 'content-box' as const, width: i === activeIdx ? 24 : 7, height: 7, padding: 7, backgroundClip: 'content-box' as const, borderRadius: i === activeIdx ? 30 : '50%', background: 'var(--blue-dark)', opacity: i === activeIdx ? 1 : .3, border: 'none', cursor: 'pointer', display: 'block', transition: 'opacity .25s, width .25s' }} />
        ))}
      </div>
      <button onClick={() => navTo(activeIdx - 1)} style={{ position: 'absolute', bottom: 18, left: 14, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(124,184,245,.35)', background: 'rgba(255,255,255,.5)', backdropFilter: 'blur(8px)', color: 'var(--blue-dark)', cursor: 'pointer', zIndex: 9, opacity: .42, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(62,111,168,.14)', transition: 'opacity .25s' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <button onClick={() => navTo(activeIdx + 1)} style={{ position: 'absolute', bottom: 18, right: 14, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(124,184,245,.35)', background: 'rgba(255,255,255,.5)', backdropFilter: 'blur(8px)', color: 'var(--blue-dark)', cursor: 'pointer', zIndex: 9, opacity: .42, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(62,111,168,.14)', transition: 'opacity .25s' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--sp-muted)', zIndex: 8, pointerEvents: 'none' }}>
        Desliza al lado para explorar <span style={{ display: 'inline-block', animation: 'ar 1.4s ease-in-out infinite' }}>&#8594;</span>
      </div>
    </div>
  )
}

// ─── PoderesTab ───────────────────────────────────────────────────────────────

function BranchCard({ rama }: { rama: RamaData }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={CARD}>
      <div style={{ padding: '18px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: rama.color, display: 'block', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 17, fontWeight: 900, color: 'var(--sp-text)' }}>{rama.nombre}</span>
          <span style={{ fontSize: 32, fontWeight: 900, color: rama.color }}>{rama.lv}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--blue-dark)', fontWeight: 600, marginBottom: 10 }}>{rama.xp.toLocaleString('es')} XP · {rama.progPct}%</div>
          <div style={{ height: 8, borderRadius: 10, background: 'rgba(62,111,168,.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 10, background: rama.color, width: `${rama.progPct}%` }} />
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: 'var(--blue-dark)', padding: 0 }}
        >
          <span style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s', fontSize: 10 }}>▶</span>
          {rama.habilidades.length} habilidad{rama.habilidades.length !== 1 ? 'es' : ''}
        </button>
        {expanded && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rama.habilidades.slice().sort((a, b) => b.xp - a.xp).map((sk) => (
              <div key={sk.skillId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--sp-text)' }}>{sk.nombre}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: rama.color }}>+{sk.xp} XP</span>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', display: 'block',
                      background: i < sk.lv ? rama.color : 'rgba(0,0,0,0.08)',
                      border: `1px solid ${i < sk.lv ? rama.color : 'rgba(0,0,0,0.08)'}`,
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PoderesTab({ data }: { data: StudentPortalData }) {
  const [gxView, setGxView] = useState<GalaxiaView>('niveles')
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const ramas = Object.entries(data.ramas).filter(([, r]) => r.xp > 0)
  const selectedRama = selectedBranch !== null ? data.ramas[selectedBranch] : null
  const totalXP = ramas.reduce((a, [, r]) => a + r.xp, 0)
  const totalSkills = ramas.reduce((a, [, r]) => a + r.habilidades.length, 0)
  const strongest = ramas.length > 0 ? ramas.reduce((a, b) => b[1].xp > a[1].xp ? b : a)[1].nombre : ''

  const tabIcons: Record<GalaxiaView, React.ReactNode> = {
    niveles:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.9"/><ellipse cx="12" cy="12" rx="11" ry="4" stroke="currentColor" strokeWidth="1.9" transform="rotate(-20 12 12)"/></svg>,
    radar:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 12L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    despegues: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 15c-2 1-3 5-3 5s4-1 5-3M14 4c4 2 6 8 4 13l-5 2-5-5 2-5c1-2 2-4 4-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  }

  return (
    <div style={{ padding: '0 20px', paddingBottom: 32 }}>
      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg,var(--blue-dark),var(--cta))', color: '#fff', borderRadius: 22, padding: '16px 18px', position: 'relative', overflow: 'hidden', marginBottom: 14, boxShadow: '0 6px 22px rgba(62,111,168,.18)' }}>
        <div style={{ position: 'absolute', right: -28, top: -36, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.09)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.1px', textTransform: 'uppercase', opacity: .85 }}>Ignite Nexus · Mi progreso</div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.5px', margin: '2px 0 0' }}>Mi Galaxia de Poderes</div>
          </div>
          <nav style={{ display: 'flex', background: 'rgba(255,255,255,.16)', borderRadius: 30, padding: 3, gap: 2, flexWrap: 'wrap' }}>
            {(['niveles', 'radar', 'despegues'] as GalaxiaView[]).map((v) => (
              <button key={v} onClick={() => setGxView(v)} style={{ border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 11.5, padding: '6px 12px', borderRadius: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', background: gxView === v ? '#fff' : 'none', color: gxView === v ? 'var(--cta)' : '#fff', opacity: gxView === v ? 1 : 0.8, transition: 'background .2s,opacity .2s' }}>
                {tabIcons[v]}
                {v === 'niveles' ? 'Niveles' : v === 'radar' ? 'Radar' : 'Despegues'}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="20" viewBox="7 2 16 31" fill="none"><path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="#fff"/></svg>
            <div><b style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, display: 'block' }}>{totalXP.toLocaleString('es')}</b><span style={{ fontSize: 9.5, fontWeight: 800, opacity: .85, textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginTop: 2 }}>XP total</span></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3L14.5 9L21 9.3L16 13.3L17.8 19.6L12 15.8L6.2 19.6L8 13.3L3 9.3L9.5 9Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/></svg>
            <div><b style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, display: 'block' }}>{totalSkills}</b><span style={{ fontSize: 9.5, fontWeight: 800, opacity: .85, textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginTop: 2 }}>poderes</span></div>
          </div>
          {strongest && (
            <div style={{ background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M3 7l4 4 5-6 5 6 4-4-2 12H5z"/></svg>
              <div><b style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, display: 'block' }}>{strongest}</b><span style={{ fontSize: 9.5, fontWeight: 800, opacity: .85, textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginTop: 2 }}>más fuerte</span></div>
            </div>
          )}
        </div>
      </div>

      {ramas.length === 0 ? (
        <div style={{ ...CARD, padding: 32, textAlign: 'center' as const, color: 'var(--sp-muted)', fontSize: 13 }}>Sin poderes aún</div>
      ) : (
        <>
          {gxView === 'niveles'   && <NivelesView ramas={ramas} onBranchClick={setSelectedBranch} />}
          {gxView === 'radar'     && <RadarView data={data} />}
          {gxView === 'despegues' && <DespeguesView ramas={ramas} />}
        </>
      )}

      {selectedBranch !== null && selectedRama && (
        <PovOverlay branchCode={selectedBranch} rama={selectedRama} onClose={() => setSelectedBranch(null)} />
      )}
    </div>
  )
}

// ─── ActitudTab ───────────────────────────────────────────────────────────────

function ActitudRow({ a }: { a: StudentPortalData['actitud'][0] }) {
  const isPos = a.tipo === 'positiva'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', transition: 'transform .15s' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPos ? '#dcfce7' : '#fee2e2' }}>
        {isPos ? (
          <svg width="44" height="44" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="26" fill="#bbf7d0"/>
            <path d="M18 32L26 40L42 22" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="44" height="44" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="26" fill="#fecaca"/>
            <path d="M20 20L40 40M40 20L20 40" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sp-text)' }}>{a.nombre}</div>
        <div style={{ fontSize: 12, color: '#8aa4be', marginTop: 2 }}>
          {new Date(a.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      <span style={{ flexShrink: 0, fontSize: 16, fontWeight: 900, color: isPos ? '#16a34a' : '#dc2626' }}>
        {a.xp > 0 ? '+' : ''}{a.xp} XP
      </span>
    </div>
  )
}

function ActitudAllModal({ items, onClose }: { items: StudentPortalData['actitud']; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const PER_PAGE = 8
  const totalPages = Math.ceil(items.length / PER_PAGE)
  const shown = items.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const posCount = items.filter(a => a.tipo === 'positiva').length
  const negCount = items.filter(a => a.tipo === 'negativa').length
  const netXp = items.reduce((acc, a) => acc + a.xp, 0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--warm)', overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'rgba(255,255,255,.75)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1.5px solid var(--sp-border)' }}>
        <button
          type="button"
          onClick={onClose}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, letterSpacing: '.3px', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--sp-text)' }}>Registros de actitud</span>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px,5vw,48px) 24px 80px' }}>
        <div style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900, color: 'var(--sp-text)', letterSpacing: '-.5px', marginBottom: 6 }}>Historial completo</div>
        <div style={{ fontSize: 14, color: '#8aa4be', marginBottom: 24 }}>
          {posCount} positivas · {negCount} negativas · Neto: {netXp > 0 ? '+' : ''}{netXp} XP
        </div>
        <div style={CARD}>
          {shown.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <div style={{ height: 1, background: 'var(--sp-border)', margin: '0 14px' }} />}
              <ActitudRow a={a} />
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? .35 : 1 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Anterior
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#8aa4be' }}>{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--blue-dark)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? .35 : 1 }}
            >
              Siguiente
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActitudTab({ data }: { data: StudentPortalData }) {
  const [showAll, setShowAll] = useState(false)
  const INITIAL = 8
  const shown = data.actitud.slice(0, INITIAL)
  return (
    <>
      {showAll && <ActitudAllModal items={data.actitud} onClose={() => setShowAll(false)} />}
      <div style={{ padding: '0 20px', paddingBottom: 32 }}>
        <div style={SECTION_TITLE}>Registro de actitud</div>
        {data.actitud.length === 0 ? (
          <div style={{ ...CARD, padding: 32, textAlign: 'center', color: 'var(--sp-muted)', fontSize: 13 }}>Sin registros aún</div>
        ) : (
          <>
            <div style={CARD}>
              {shown.map((a, i) => (
                <div key={a.id}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--sp-border)', margin: '0 14px' }} />}
                  <ActitudRow a={a} />
                </div>
              ))}
            </div>
            {data.actitud.length > INITIAL && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '12px auto 0', padding: '10px 24px', borderRadius: 30, background: 'var(--card-a)', border: '1.5px solid var(--blue-main)', color: 'var(--blue-dark)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Ver todos los registros →
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Familia color tokens (palette-immune) ────────────────────────────────────

const F_INK       = '#2F3A4A'
const F_DEEP      = '#3E6FA8'
const F_CTA       = '#2596BE'
const F_AMBER     = '#FBB03B'
const F_YELLOW    = '#FBEFCB'
const F_BLUE_SOFT = '#EAF1FA'
const F_OAT       = '#EEE6D2'
const F_YELLOW2   = '#FAEFC6'
const F_OAT_BROWN = '#7a6433'
const F_OAT_MID   = '#a08a5e'

// ─── FamWave ──────────────────────────────────────────────────────────────────

function FamWave({ fill }: { fill: string }) {
  return (
    <svg
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 64,
        transform: 'translateY(-100%)',
        pointerEvents: 'none',
        display: 'block',
      }}
    >
      <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" fill={fill} />
    </svg>
  )
}

// ─── useFadeIn / RevealDiv ─────────────────────────────────────────────────────

function useFadeIn(ref: React.RefObject<HTMLElement>, threshold = 0.15) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return visible
}

function RevealDiv({ delay = '0s', children, style }: { delay?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useFadeIn(ref as React.RefObject<HTMLElement>)
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
      transitionDelay: delay,
    }}>
      {children}
    </div>
  )
}

// ─── AreaRow ──────────────────────────────────────────────────────────────────

function AreaRow({ code, rama, isOpen, onToggle }: {
  code: string
  rama: StudentPortalData['ramas'][string]
  isOpen: boolean
  onToggle: () => void
}) {
  const skills = rama.habilidades.slice().sort((a, b) => b.xp - a.xp)
  const [hovered, setHovered] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const [barVisible, setBarVisible] = useState(false)
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setBarVisible(true); obs.disconnect() }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div style={{ borderBottom: '1px solid rgba(62,111,168,0.12)' }}>
      <div onClick={onToggle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', cursor: 'pointer' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 6px rgba(62,111,168,.10)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: branchIconHTML(code, F_DEEP) }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: F_CTA, marginBottom: 2 }}>
            Competencia STEAM
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 600, fontSize: 18, color: hovered ? rama.color : F_INK, transform: hovered ? 'translateX(6px)' : 'translateX(0)', transition: 'color 0.25s, transform 0.25s' }}>
            {rama.nombre}
          </div>
          <div style={{ fontSize: 12, color: '#8aa4be', marginTop: 1 }}>Nivel {rama.lv} · {rama.xp} XP</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div ref={barRef} style={{ width: 56, height: 6, borderRadius: 999, background: 'rgba(62,111,168,.15)' }}>
            <div style={{ width: barVisible ? `${rama.progPct}%` : '0%', height: '100%', borderRadius: 999, background: F_DEEP, transition: 'width 1s cubic-bezier(.2,.7,.2,1)' }} />
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${F_DEEP}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .25s ease', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', color: F_DEEP, fontSize: 18, fontWeight: 300, flexShrink: 0 }}>+</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease', overflow: 'hidden' }}>
        <div style={{ minHeight: 0 }}>
          <div style={{ paddingBottom: 20 }}>
            {skills.map((skill, i) => (
              <div key={skill.skillId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(62,111,168,.08)' : undefined }}>
                <div style={{ display: 'flex', gap: 3, paddingTop: 3, flexShrink: 0 }}>
                  {[1,2,3,4,5].map(pip => (
                    <div key={pip} style={{ width: 7, height: 7, borderRadius: '50%', background: pip <= Math.min(skill.lv, 5) ? F_DEEP : 'rgba(62,111,168,.15)' }} />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: F_INK }}>{skill.nombre}</div>
                  {skill.descripcion && <div style={{ fontSize: 11.5, color: '#8aa4be', marginTop: 2, lineHeight: 1.45 }}>{skill.descripcion}</div>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: F_DEEP, flexShrink: 0 }}>{skill.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FamiliaPortal helpers ────────────────────────────────────────────────────

function FamColeccionPin({ proyectos, onOpenAll }: {
  proyectos: StudentPortalData['proyectos']
  onOpenAll: () => void
}) {
  const pinRef      = useRef<HTMLDivElement>(null)   // .f-horiz-pin
  const stickyRef   = useRef<HTMLDivElement>(null)   // .f-horiz-sticky
  const trackRef    = useRef<HTMLDivElement>(null)   // .f-horiz-track
  const counterRef  = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const rafRef      = useRef<number>(0)
  const cards = proyectos.slice(0, 4)
  const n = cards.length  // FH.n

  useEffect(() => {
    const pin    = pinRef.current
    const sticky = stickyRef.current
    const track  = trackRef.current
    if (!pin || !sticky || !track) return

    let dist = 0         // FH.dist
    let fTicking = false // scroll batching flag

    // EXACT translation of setupFamHoriz():
    function setup() {
      // var inner=root.querySelector('#fam-collection .f-scene-inner');
      // var padL=inner?Math.max(16,inner.getBoundingClientRect().left):24;
      const padL = Math.max(16, Math.min(Math.round(window.innerWidth * 0.05), 60))
      // FH.track.style.paddingLeft=padL+'px'; FH.track.style.paddingRight=padL+'px';
      track!.style.paddingLeft  = padL + 'px'
      track!.style.paddingRight = padL + 'px'
      // var dist=FH.track.scrollWidth-FH.sticky.clientWidth; if(dist<0)dist=0;
      dist = track!.scrollWidth - sticky!.clientWidth
      if (dist < 0) dist = 0
      // FH.dist=dist; FH.pin.style.height=(window.innerHeight+dist)+'px';
      pin!.style.height = (window.innerHeight + dist) + 'px'
      // updateFamHoriz();
      update()
    }

    // EXACT translation of updateFamHoriz():
    function update() {
      // if(!FH.pin||reduce)return;
      // var scrollable=FH.pin.offsetHeight-window.innerHeight;
      const scrollable = pin!.offsetHeight - window.innerHeight
      // var rectTop=FH.pin.getBoundingClientRect().top;
      const rectTop = pin!.getBoundingClientRect().top
      // var prog=scrollable>0?Math.min(Math.max(-rectTop/scrollable,0),1):0;
      const prog = scrollable > 0 ? Math.min(Math.max(-rectTop / scrollable, 0), 1) : 0
      // FH.track.style.transform='translateX('+(-prog*FH.dist).toFixed(1)+'px)';
      track!.style.transform = 'translateX(' + (-prog * dist).toFixed(1) + 'px)'
      // var bar=document.getElementById('famHorizBar'); if(bar)bar.style.transform='scaleX('+prog.toFixed(3)+')';
      if (progressRef.current) progressRef.current.style.transform = 'scaleX(' + prog.toFixed(3) + ')'
      // var cnt=...; var idx=Math.min(FH.n,Math.max(1,Math.round(prog*(FH.n-1))+1)); cnt.textContent=...
      const idx = Math.min(n, Math.max(1, Math.round(prog * (n - 1)) + 1))
      if (counterRef.current) counterRef.current.textContent = (idx < 10 ? '0' : '') + idx
    }

    // onFamScroll() — fTicking pattern with rAF
    function onScroll() {
      if (fTicking) return
      fTicking = true
      rafRef.current = requestAnimationFrame(() => {
        update()
        fTicking = false
      })
    }

    // Resize debounce 180ms (matches HTML: clearTimeout(rsz);rsz=setTimeout(setupFamHoriz,180))
    let rsz: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(rsz)
      rsz = setTimeout(setup, 180)
    }

    // Mount: setupFamHoriz(); setTimeout(setupFamHoriz,400);
    setup()
    const t400 = setTimeout(setup, 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(t400)
      clearTimeout(rsz!)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [proyectos.length, n])

  return (
    <div ref={pinRef} data-debug="pin" style={{ position: 'relative' }}>
      {/* .f-horiz-sticky */}
      <div ref={stickyRef} data-debug="sticky" style={{
        position: 'sticky', top: 0, height: '100svh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 30, overflow: 'hidden',
        background: F_OAT, willChange: 'transform',
      }}>
        {/* .f-horiz-track — padding set dynamically by setup() */}
        <div ref={trackRef} style={{
          display: 'flex', gap: 22, alignItems: 'stretch',
          willChange: 'transform',
        }}>
          {/* Project cards (.f-hcard) */}
          {cards.map((p, i) => (
            <article key={p.id}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-7px)'; el.style.boxShadow = '0 34px 64px -36px rgba(47,58,74,.4)' }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '' }}
              style={{
              position: 'relative', flexShrink: 0,
              width: 'clamp(280px, 82vw, 430px)', minHeight: 'min(62vh, 520px)',
              background: '#FBF6EB', border: '1px solid rgba(120,95,40,.16)',
              borderRadius: 24, padding: '34px 32px',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              transition: 'transform 0.45s cubic-bezier(.2,.7,.2,1), box-shadow 0.45s',
            }}>
              {/* .f-hcard-wm */}
              <span style={{
                position: 'absolute', right: 20, top: -2,
                fontFamily: 'var(--font-fraunces, serif)', fontWeight: 300,
                fontSize: 128, lineHeight: 1, color: 'rgba(120,95,40,.07)', pointerEvents: 'none',
              }}>0{i + 1}</span>
              {/* .f-hcard-cat */}
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: '#8a7234', position: 'relative' }}>
                {p.materialType ?? 'Proyecto'}
              </span>
              {/* .f-hcard-title */}
              <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 600, fontSize: 'clamp(24px, 4vw, 30px)', letterSpacing: -0.5, lineHeight: 1.1, margin: '14px 0 8px', position: 'relative', color: F_INK }}>
                {p.nombre}
              </div>
              {/* .f-hcard-date */}
              <span style={{ fontSize: 12.5, fontWeight: 700, color: F_OAT_MID }}>
                {p.fechaInicio ? fmtDate(p.fechaInicio) : fmtDate(p.evaluadoEn)}
              </span>
              {/* .f-hcard-desc */}
              {p.descripcion && (
                <p style={{ fontSize: 14.5, color: '#56616c', lineHeight: 1.62, marginTop: 14 }}>
                  {p.descripcion.length > 160 ? p.descripcion.slice(0, 160) + '…' : p.descripcion}
                </p>
              )}
              {/* .f-hcard-tags */}
              <div style={{ marginTop: 'auto', paddingTop: 22 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase' as const, color: '#a08f63' }}>Lo que aprendió</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {p.habilidades.slice(0, 4).map((h, j) => (
                    <span key={j} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      fontSize: 12, fontWeight: 600, color: '#3a4350',
                      border: '1px solid rgba(47,58,74,.14)', borderRadius: 999,
                      padding: '5px 12px', background: 'rgba(255,255,255,.5)',
                    }}>{h.nombre}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}

          {/* CTA card (.f-hcard.f-hcard-cta) */}
          <article
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-7px)'; el.style.boxShadow = '0 34px 64px -36px rgba(47,58,74,.4)' }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '' }}
            style={{
            position: 'relative', flexShrink: 0,
            width: 'clamp(280px, 82vw, 430px)', minHeight: 'min(62vh, 520px)',
            background: F_INK, border: '1px solid ' + F_INK,
            borderRadius: 24, padding: '34px 32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            overflow: 'hidden',
            transition: 'transform 0.45s cubic-bezier(.2,.7,.2,1), box-shadow 0.45s',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: '#9fb4cf' }}>
              La colección al completo
            </span>
            <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 600, fontSize: 'clamp(24px, 4vw, 30px)', letterSpacing: -0.5, lineHeight: 1.1, margin: '14px 0 8px', color: '#fff' }}>
              {proyectos.length} proyectos,<br />y subiendo.
            </div>
            <button onClick={onOpenAll} style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              marginTop: 22, alignSelf: 'flex-start',
              background: F_AMBER, color: F_INK,
              border: 'none', borderRadius: 999,
              padding: '15px 26px', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 800, letterSpacing: 0.4,
              textTransform: 'uppercase' as const, cursor: 'pointer',
            }}>
              Verlos todos →
            </button>
          </article>
        </div>

        {/* .f-horiz-foot */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          maxWidth: 1080, width: '100%', margin: '0 auto', padding: '0 24px',
        }}>
          {/* .f-horiz-count */}
          <span ref={counterRef} style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 400, fontSize: 22, color: F_OAT_BROWN }}>
            01
          </span>
          {/* .f-horiz-total */}
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: F_OAT_MID }}>
            / 0{cards.length}
          </span>
          {/* .f-horiz-progress */}
          <div style={{ flex: 1, height: 3, borderRadius: 999, background: 'rgba(120,95,40,.18)', overflow: 'hidden' }}>
            <div ref={progressRef} style={{
              display: 'block', height: '100%', width: '100%',
              transform: 'scaleX(0)', transformOrigin: 'left',
              background: F_OAT_BROWN, transition: 'transform .1s linear',
            }} />
          </div>
          {/* .f-horiz-hint */}
          <span style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2,
            textTransform: 'uppercase' as const, color: F_OAT_MID,
            display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
          }}>Baja para avanzar →</span>
        </div>
      </div>
    </div>
  )
}

// ─── AllProyectosOverlay ──────────────────────────────────────────────────────

function AllProyectosOverlay({ proyectos, nombre, onClose }: {
  proyectos: StudentPortalData['proyectos']
  nombre: string
  onClose: () => void
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handler) }
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'linear-gradient(180deg, #EEE6D2 0%, #E4D9C0 100%)', overflowY: 'auto' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(238,230,210,.88)', backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(120,95,40,.18)',
        padding: '16px clamp(16px, 5vw, 60px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: F_OAT_MID, letterSpacing: 2, textTransform: 'uppercase' as const }}>Toda la colección</div>
          <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 600, fontSize: 18, color: F_OAT_BROWN }}>Todo lo que ha creado.</div>
        </div>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(120,95,40,.3)', background: 'transparent', fontSize: 18, cursor: 'pointer', color: F_OAT_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(32px, 5vh, 60px) clamp(16px, 5vw, 60px)' }}>
        <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, fontSize: 'clamp(28px,6vw,46px)', letterSpacing: -1, lineHeight: 1.05, color: F_OAT_BROWN, marginBottom: 8 }}>
          La colección de {nombre}.
        </div>
        <p style={{ fontSize: 15, color: '#6a5d44', marginBottom: 30, lineHeight: 1.6 }}>
          Abre cualquier proyecto para ver qué aprendió.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {proyectos.map((p, i) => (
            <div key={p.id} style={{
              background: '#FBF6EB', borderRadius: 20,
              border: '1px solid rgba(120,95,40,.16)',
              padding: '24px 26px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-fraunces, serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 15, color: '#b89a52' }}>
                  N.Âº {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const, color: '#8a7234' }}>
                  {p.materialType ?? 'Proyecto'}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 600, fontSize: 22, letterSpacing: -.5, lineHeight: 1.12, color: F_OAT_BROWN, marginBottom: 7 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#a08a5e', marginBottom: p.descripcion ? 11 : 0 }}>
                {p.fechaInicio ? fmtDate(p.fechaInicio) : fmtDate(p.evaluadoEn)}
              </div>
              {p.descripcion && <p style={{ fontSize: 14, color: '#56616c', marginTop: 11, lineHeight: 1.6 }}>{p.descripcion}</p>}
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 0, borderTop: '1px dashed rgba(120,95,40,.25)',
                  width: '100%', marginTop: 8, padding: '7px 0',
                  fontSize: 12, fontWeight: 800, color: F_CTA, cursor: 'pointer',
                  textTransform: 'uppercase' as const,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: openIdx === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Ver lo que aprendió
              </button>
              <div style={{ display: 'grid', gridTemplateRows: openIdx === i ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease', overflow: 'hidden' }}>
                <div style={{ minHeight: 0 }}>
                  <div style={{ paddingTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {p.habilidades.map((h, j) => (
                      <span key={j} style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(120,95,40,.2)', background: 'rgba(255,255,255,.6)', color: F_INK }}>{h.nombre}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MomentosModal ────────────────────────────────────────────────────────────

function MomentosModal({ acciones, onClose }: {
  acciones: StudentPortalData['actitud']
  onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handler) }
  }, [onClose])

  const positive = acciones.filter(a => a.tipo === 'positiva')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'linear-gradient(180deg, #FBF0CC 0%, #F6E9B8 100%)', overflowY: 'auto' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(251,240,204,.88)', backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(120,95,40,.18)',
        padding: '16px clamp(16px, 5vw, 60px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: F_OAT_MID, letterSpacing: 2, textTransform: 'uppercase' as const }}>Momentos en el aula</div>
          <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 600, fontSize: 18, color: F_OAT_BROWN }}>Momentos que merecen un marco.</div>
        </div>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(120,95,40,.3)', background: 'transparent', fontSize: 18, cursor: 'pointer', color: F_OAT_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(32px, 5vh, 60px) clamp(16px, 5vw, 60px)' }}>
        <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, fontSize: 'clamp(28px,6vw,46px)', letterSpacing: -1, lineHeight: 1.05, color: F_OAT_BROWN, marginBottom: 8 }}>
          Todo lo que merece un marco.
        </div>
        <p style={{ fontSize: 15, color: '#6a5d44', marginBottom: 30, lineHeight: 1.6 }}>
          Todo lo que el profesorado ha recogido clase a clase.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {positive.map(a => (
            <div key={a.id} style={{
              background: '#FCF6E6', borderRadius: 18,
              border: '1px solid rgba(120,95,40,.18)',
              padding: '22px 24px 22px 28px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: F_AMBER, borderRadius: '18px 0 0 18px' }} />
              <div style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 600, fontSize: 16, color: F_INK, marginBottom: 6, lineHeight: 1.3 }}>{a.nombre}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: F_OAT_MID, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                {new Date(a.fecha.includes('T') ? a.fecha : a.fecha + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── FamSeal ──────────────────────────────────────────────────────────────────

function FamSeal({ nombre }: { nombre: string }) {
  const SIZE = 200
  const cx = SIZE / 2   // 100
  const cy = SIZE / 2   // 100
  const R = 72          // text circle radius — large enough for text to fit without overlap
  const text = `· IGNITE NEXUS · BIENVENIDO AL UNIVERSO DE ${nombre.toUpperCase()} · IGNITE NEXUS · BIENVENIDO AL UNIVERSO DE ${nombre.toUpperCase()} `

  return (
    <div style={{
      width: 'clamp(150px, 18vw, 220px)',
      height: 'clamp(150px, 18vw, 220px)',
      flexShrink: 0,
    }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        height="100%"
      >
        <defs>
          {/* Full circle path for textPath — starts at top */}
          <path
            id="seal-circle"
            d={`M ${cx},${cy - R} A ${R},${R} 0 1,1 ${cx - 0.01},${cy - R}`}
          />
        </defs>

        {/* Outer dashed ring */}
        <circle
          cx={cx} cy={cy} r={R + 10}
          fill="none"
          stroke="rgba(47,58,74,0.18)"
          strokeWidth="1"
          strokeDasharray="2 5"
        />

        {/* Inner ring */}
        <circle
          cx={cx} cy={cy} r={R - 10}
          fill="none"
          stroke="rgba(47,58,74,0.10)"
          strokeWidth="0.7"
        />

        {/* Spinning text */}
        <g style={{
          animation: 'fSealSpin 26s linear infinite',
          transformOrigin: `${cx}px ${cy}px`,
        }}>
          <text
            fontSize="7"
            fontFamily="'Figtree', system-ui, sans-serif"
            fontWeight="700"
            letterSpacing="3"
            fill="rgba(47,58,74,0.50)"
          >
            <textPath href="#seal-circle" startOffset="0%">
              {text}
            </textPath>
          </text>
        </g>

        {/* Center: exact IGNITE NEXUS bolt — same path as LogoIcon */}
        {/* The bolt path has natural bounds roughly -7 to +7 wide, -15 to +18.4 tall */}
        {/* Center it at (cx, cy) by translating to cx, cy-2 (optical center) */}
        <g transform={`translate(${cx}, ${cy - 2})`}>
          <path
            d="M-3.2-15 L3.2-14 L6.4 4.6 L.8 4.6 L-.8 18.4 L-7.2-2.3 L-1.6-2.3Z"
            fill="#FBB03B"
            stroke="#FBB03B"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  )
}

// ─── FamiliaPortal ─────────────────────────────────────────────────────────────

function FamiliaPortal({ data, onSwitchToAlumno }: { data: StudentPortalData; onSwitchToAlumno: () => void }) {
  const [expandedArea, setExpandedArea] = useState<string | null>(null)
  const [allProjOpen, setAllProjOpen] = useState(false)
  const [momentosOpen, setMomentosOpen] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const ramas = Object.entries(data.ramas).filter(([, r]) => r.xp > 0)
  const displayProject = data.misionActiva ?? (data.proyectos[0]
    ? {
        nombre: data.proyectos[0].nombre,
        descripcion: data.proyectos[0].descripcion,
        materialType: data.proyectos[0].materialType,
        habilidades: data.proyectos[0].habilidades.map(h => ({
          nombre: h.nombre,
          xpBase: h.xpAward,
          branchCode: h.branchCode,
        })),
        xpMaximo: data.proyectos[0].xpTotal,
        fechaInicio: data.proyectos[0].fechaInicio,
      }
    : null)
  const isUsingMisionActiva = data.misionActiva !== null
  const positiveActions = data.actitud.filter(a => a.tipo === 'positiva')

  const SCENE: React.CSSProperties = {
    padding: 'clamp(80px,12vh,140px) 0 clamp(64px,9vh,110px)',
    position: 'relative',
  }
  const INNER: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }
  const EYEBROW: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, letterSpacing: '2.6px',
    textTransform: 'uppercase', color: F_DEEP, marginBottom: 8,
  }
  const HEADING: React.CSSProperties = {
    fontFamily: 'var(--font-fraunces, Georgia, serif)',
    fontWeight: 600,
    fontSize: 'clamp(28px,4.5vw,50px)',
    lineHeight: 1.2,
    color: F_INK,
    marginBottom: 20,
  }
  const LEDE: React.CSSProperties = {
    fontSize: 'clamp(15px,1.8vw,17px)',
    lineHeight: 1.7,
    color: F_INK,
    opacity: 0.68,
    maxWidth: 560,
    marginBottom: 36,
  }

  return (
    <div style={{ fontFamily: "'Figtree', system-ui, sans-serif", background: F_YELLOW, color: F_INK }}>
      <style>{`
        @keyframes fTwinkle {
          0%,100%{opacity:1;transform:scale(1) rotate(0deg)}
          33%{opacity:.5;transform:scale(.82) rotate(18deg)}
          66%{opacity:.85;transform:scale(1.12) rotate(-12deg)}
        }
        @keyframes famSpin {
          from{transform:rotate(0deg)}
          to{transform:rotate(360deg)}
        }
        @keyframes famBreathe {
          0%,100%{transform:scale(1);opacity:.18}
          50%{transform:scale(1.09);opacity:.28}
        }
        @keyframes famScrollCue {
          0%,100%{transform:translateY(0);opacity:.6}
          50%{transform:translateY(9px);opacity:.25}
        }
        @keyframes fSealSpin {
          from{transform:rotate(0deg)}
          to{transform:rotate(360deg)}
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{
        ...SCENE,
        background: F_YELLOW,
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: 'clamp(100px,15vh,170px)',
        paddingBottom: 'clamp(60px,8vh,100px)',
      }}>
        <div style={{ position: 'absolute', top: '-8%', right: '-6%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,150,190,0.13) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '6%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,176,59,0.18) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '16%', left: '8%', animation: 'fTwinkle 3.4s ease-in-out infinite', pointerEvents: 'none' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill={F_AMBER}><path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5Z"/></svg>
        </div>
        <div style={{ position: 'absolute', top: '40%', right: '10%', animation: 'fTwinkle 4.2s ease-in-out infinite .9s', pointerEvents: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={F_AMBER}><path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5Z"/></svg>
        </div>
        <div style={INNER}>
          {/* Hero inner — two column on desktop */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(32px, 6vw, 80px)',
            flexWrap: 'wrap',
          }}>
            {/* Left column — text content */}
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={EYEBROW}>Espacio de la familia</div>
              <h1 style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 600, fontSize: 'clamp(40px,7vw,74px)', lineHeight: 1.08, color: F_INK, marginBottom: 12 }}>
                {data.nombre} {data.apellido}
              </h1>
              {(data.colegio || data.grupo) && (
                <div style={{ fontSize: 15, color: F_DEEP, fontWeight: 600, marginBottom: 32, opacity: .8 }}>
                  {data.colegio}{data.colegio && data.grupo ? ' · ' : ''}{data.grupo}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 600, fontSize: 'clamp(22px,3.5vw,40px)', lineHeight: 1.35, color: F_INK, maxWidth: 560, marginBottom: 20 }}>
                Mira todo lo que ha <em style={{ fontStyle: 'italic' }}>creado.</em>
              </div>
              <p style={{ ...LEDE, marginBottom: 8 }}>
                Aquí tienes un resumen de su aprendizaje, sus proyectos y los momentos que merece recordar.
              </p>
              <div style={{ display: 'inline-block', animation: 'famScrollCue 2.2s ease-in-out infinite', color: F_DEEP, fontSize: 24, marginTop: 8 }}>↓</div>
            </div>

            {/* Right column — rotating seal */}
            <div style={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
              marginTop: 20,
            }}>
              <FamSeal nombre={data.nombre} />
            </div>
          </div>
        </div>
      </section>

      {/* Sentinel — triggers topbar collapse when hero exits viewport */}
      <div id="topbar-sentinel" style={{ height: 0 }} />

      {/* ── 01 EN CURSO ─────────────────────────────────────────────────────── */}
      <section style={{ ...SCENE, background: '#FCF6EF' }}>
        <FamWave fill="#FCF6EF" />
        <div style={{ position: 'absolute', top: 40, right: 40, pointerEvents: 'none' }}>
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" style={{ animation: 'famSpin 24s linear infinite', opacity: .10 }}>
            <circle cx="80" cy="80" r="70" stroke={F_DEEP} strokeWidth="3" strokeDasharray="16 12" />
            <circle cx="80" cy="80" r="50" stroke={F_AMBER} strokeWidth="2" strokeDasharray="10 16" />
          </svg>
        </div>
        <div style={INNER}>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(80px,15vw,140px)', color: 'rgba(62,111,168,0.06)', lineHeight: 1, marginBottom: -20, userSelect: 'none', pointerEvents: 'none' }}>01</div>
          <RevealDiv delay="0.1s"><div style={EYEBROW}>Ahora mismo</div></RevealDiv>
          <RevealDiv delay="0.25s"><h2 style={HEADING}>Está en mitad de algo <em style={{ fontStyle: 'italic' }}>grande.</em></h2></RevealDiv>
          <RevealDiv delay="0.4s"><p style={LEDE}>El proyecto en el que trabaja ahora mismo en clase, las habilidades que practica y lo que está aprendiendo.</p></RevealDiv>
          <RevealDiv delay="0.55s">
          {displayProject ? (
            <div style={{ background: '#FCF6EB', borderRadius: 24, overflow: 'hidden', maxWidth: 620, boxShadow: '0 4px 32px rgba(62,111,168,0.09)' }}>
              <div style={{ aspectRatio: '16/10', background: 'linear-gradient(135deg, #F3E9D8 0%, #EAD9C2 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderTop: `2px solid ${F_AMBER}`, borderLeft: `2px solid ${F_AMBER}` }} />
                <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderTop: `2px solid ${F_AMBER}`, borderRight: `2px solid ${F_AMBER}` }} />
                <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderBottom: `2px solid ${F_AMBER}`, borderLeft: `2px solid ${F_AMBER}` }} />
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderBottom: `2px solid ${F_AMBER}`, borderRight: `2px solid ${F_AMBER}` }} />
                <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 300, fontSize: 72, color: F_AMBER, opacity: .3, lineHeight: 1 }}>✦</div>
              </div>
              <div style={{ padding: '24px 28px 28px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' as const, color: F_CTA, marginBottom: 8 }}>
                  {isUsingMisionActiva ? 'En curso' : 'Último proyecto'}
                </div>
                <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 600, fontSize: 'clamp(18px,3vw,26px)', color: F_INK, marginBottom: 10 }}>
                  {displayProject.nombre}
                </div>
                {displayProject.descripcion && (
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: F_INK, opacity: .65, marginBottom: 16 }}>{displayProject.descripcion}</p>
                )}
                {displayProject.habilidades.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {displayProject.habilidades.slice(0, 5).map((h, i) => (
                      <span key={i} style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(62,111,168,0.1)', color: F_DEEP }}>{h.nombre}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: 32, borderRadius: 20, background: 'rgba(62,111,168,0.06)', textAlign: 'center' as const, color: F_DEEP, opacity: .7 }}>
              Aún no hay proyectos registrados.
            </div>
          )}
          </RevealDiv>
        </div>
      </section>

      {/* ── 02 ÁREAS ────────────────────────────────────────────────────────── */}
      <section style={{ ...SCENE, background: F_BLUE_SOFT }}>
        <FamWave fill={F_BLUE_SOFT} />
        <div style={{ position: 'absolute', bottom: 30, left: 30, pointerEvents: 'none' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none" style={{ animation: 'famSpin 32s linear infinite reverse', opacity: .09 }}>
            <circle cx="90" cy="90" r="78" stroke={F_DEEP} strokeWidth="2" strokeDasharray="14 10" />
          </svg>
        </div>
        <div style={INNER}>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(80px,15vw,140px)', color: 'rgba(62,111,168,0.06)', lineHeight: 1, marginBottom: -20, userSelect: 'none', pointerEvents: 'none' }}>02</div>
          <RevealDiv delay="0.1s"><div style={EYEBROW}>Lo que explora</div></RevealDiv>
          <RevealDiv delay="0.25s"><h2 style={HEADING}>Seis territorios. Una mente <em style={{ fontStyle: 'italic' }}>inquieta.</em></h2></RevealDiv>
          <RevealDiv delay="0.4s"><p style={LEDE}>La metodología STEAM integra Ciencia, Tecnología, Ingeniería, Arte y Matemáticas con habilidades transversales como trabajo en equipo, pensamiento crítico y comunicación.</p></RevealDiv>
          <RevealDiv delay="0.55s">
          {ramas.length === 0 ? (
            <div style={{ padding: 32, borderRadius: 20, background: 'rgba(62,111,168,0.08)', textAlign: 'center' as const, color: F_DEEP, opacity: .7 }}>
              Aún no hay áreas con XP registrado.
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 20, padding: '0 24px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              {ramas.map(([code, rama]) => (
                <AreaRow
                  key={code}
                  code={code}
                  rama={rama}
                  isOpen={expandedArea === code}
                  onToggle={() => setExpandedArea(expandedArea === code ? null : code)}
                />
              ))}
            </div>
          )}
          </RevealDiv>
        </div>
      </section>

      {/* ── 03 COLECCIÓN ────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: F_OAT, padding: 0 }}>
        <FamWave fill={F_OAT} />
        <div style={{ position: 'absolute', top: '45%', right: '-4%', transform: 'translateY(-50%)', pointerEvents: 'none', animation: 'famBreathe 4.5s ease-in-out infinite' }}>
          <div style={{ width: 280, height: 280, borderRadius: '50%', background: F_OAT_MID, opacity: .15 }} />
        </div>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(80px,12vh,140px) clamp(16px,5vw,60px) clamp(40px,5vh,60px)', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(80px,15vw,140px)', color: 'rgba(122,100,51,0.08)', lineHeight: 1, marginBottom: -20, userSelect: 'none', pointerEvents: 'none' }}>03</div>
          <RevealDiv delay="0.1s"><div style={{ ...EYEBROW, color: F_OAT_MID }}>Su colección</div></RevealDiv>
          <RevealDiv delay="0.25s"><h2 style={{ ...HEADING, color: F_OAT_BROWN }}>Cosas que ha hecho... <em style={{ fontStyle: 'italic' }}>(y su cabeza).</em></h2></RevealDiv>
          <RevealDiv delay="0.4s"><p style={{ ...LEDE, color: F_OAT_BROWN, marginBottom: 0 }}>Cada proyecto es un pedazo de lo que ha aprendido y construido.</p></RevealDiv>
        </div>
        {data.proyectos.length === 0 ? (
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(32px,5vh,48px) clamp(16px, 5vw, 60px) clamp(64px,9vh,110px)' }}>
            <div style={{ padding: 32, borderRadius: 20, background: 'rgba(122,100,51,0.08)', textAlign: 'center' as const, color: F_OAT_BROWN, opacity: .7 }}>
              Aún sin proyectos.
            </div>
          </div>
        ) : (
          <FamColeccionPin
            proyectos={data.proyectos}
            onOpenAll={() => setAllProjOpen(true)}
          />
        )}
      </section>

      {/* ── 04 MOMENTOS ─────────────────────────────────────────────────────── */}
      <section style={{ ...SCENE, background: F_YELLOW2 }}>
        <FamWave fill={F_YELLOW2} />
        <div style={INNER}>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(80px,15vw,140px)', color: 'rgba(62,111,168,0.07)', lineHeight: 1, marginBottom: -20, userSelect: 'none', pointerEvents: 'none' }}>04</div>
          <RevealDiv delay="0.1s"><div style={EYEBROW}>En el aula</div></RevealDiv>
          <RevealDiv delay="0.25s"><h2 style={HEADING}>Momentos que merecen un <em style={{ fontStyle: 'italic' }}>marco.</em></h2></RevealDiv>
          <RevealDiv delay="0.4s"><p style={LEDE}>Actitudes positivas que {data.nombre} ha demostrado en clase y que queremos que la familia conozca.</p></RevealDiv>
          {positiveActions.length === 0 ? (
            <div style={{ padding: 32, borderRadius: 20, background: 'rgba(62,111,168,0.06)', textAlign: 'center' as const, color: F_DEEP, opacity: .7 }}>
              Sin momentos registrados aún.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {positiveActions.slice(0, 4).map((a, i) => (
                  <RevealDiv key={a.id} delay={`${0.5 + i * 0.1}s`}>
                  <div style={{ background: '#FCF6E6', borderRadius: 18, padding: '24px 26px 24px 30px', position: 'relative', overflow: 'hidden', transition: 'transform 0.38s cubic-bezier(.2,.7,.2,1), box-shadow 0.38s' }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 26px 50px -32px rgba(120,90,20,.4)' }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '' }}
                  >
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: F_AMBER, borderRadius: '18px 0 0 18px' }} />
                    <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, fontWeight: 900, color: '#16a34a' }}>+{a.xp} XP</div>
                    <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 600, fontSize: 15, color: F_INK, marginBottom: 8, lineHeight: 1.35, paddingRight: 40 }}>
                      {a.nombre}
                    </div>
                    <div style={{ fontSize: 12, color: '#8aa4be', fontWeight: 600 }}>
                      {new Date(a.fecha.includes('T') ? a.fecha : a.fecha + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  </RevealDiv>
                ))}
              </div>
              {positiveActions.length > 4 && (
                <button onClick={() => setMomentosOpen(true)} style={{ marginTop: 24, display: 'block', padding: '12px 28px', borderRadius: 999, background: 'transparent', border: `1.5px solid ${F_DEEP}`, color: F_DEEP, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Ver todos los momentos →
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── CIERRE ──────────────────────────────────────────────────────────── */}
      <section style={{ ...SCENE, background: '#DDEAF8', textAlign: 'center' as const }}>
        <FamWave fill="#DDEAF8" />
        <div style={INNER}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: F_AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontWeight: 600, fontStyle: 'italic', fontSize: 'clamp(22px,4vw,36px)', color: F_INK, lineHeight: 1.5, maxWidth: 580, margin: '0 auto 16px' }}>
            &ldquo;Gracias por acompañar el aprendizaje de <strong style={{ fontStyle: 'normal' }}>{data.nombre}.</strong>&rdquo;
          </div>
          <div style={{ fontSize: 15, color: F_DEEP, fontWeight: 700, marginBottom: 6 }}>El equipo de Ignite</div>
          <div style={{ fontSize: 13, color: F_INK, opacity: .45, marginBottom: 48 }}>Seguimos construyendo juntos.</div>
          <LogoFull />
        </div>
      </section>

      {allProjOpen && <AllProyectosOverlay proyectos={data.proyectos} nombre={data.nombre} onClose={() => setAllProjOpen(false)} />}
      {momentosOpen && <MomentosModal acciones={data.actitud} onClose={() => setMomentosOpen(false)} />}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function StudentPortal({ data }: { data: StudentPortalData }) {
  const [theme,       setTheme]       = useState<Theme>('amarillo')
  const [lang,        setLang]        = useState<Lang>('es')
  const [profileMode, setProfileMode] = useState<'alumno' | 'familia'>('alumno')
  const [mascotId,    setMascotId]    = useState<MascotId>('spark')
  const [mascotColor, setMascotColor] = useState('#7ba6e2')
  const [accId,       setAccId]       = useState<AccId>('none')
  const [boltId,      setBoltId]      = useState<BoltId>('sparkle')
  const [fraseId,     setFraseId]     = useState('ignite')

  const [collapsed,    setCollapsed]   = useState(false)
  const [mascotOpen,   setMascotOpen]  = useState(false)
  const [boltOpen,     setBoltOpen]    = useState(false)
  const [fraseOpen,    setFraseOpen]   = useState(false)
  const [paletteOpen,  setPaletteOpen] = useState(false)

  function handleMascotChange(id: MascotId, defaultColor: string) {
    setMascotId(id)
    setMascotColor(defaultColor)
    setMascotOpen(false)
  }

  return (
    <div
      data-theme={theme}
      className="theme-student"
      style={{ width: '100%', minHeight: '100dvh', background: 'var(--warm)', color: 'var(--sp-text)', fontFamily: 'var(--font-figtree), system-ui, sans-serif', paddingTop: 60, position: 'relative' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes bob{0%,100%{transform:translateY(1.5px)}50%{transform:translateY(-4px)}}@keyframes rbob{0%,100%{transform:translateY(2px) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}@keyframes flame{from{transform:scaleY(.85) scaleX(1.06)}to{transform:scaleY(1.15) scaleX(.94)}}@keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(10vmin,7vmin) scale(1.15)}}@keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-11vmin,-8vmin) scale(1.12)}}@keyframes drift3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(9vmin,-9vmin) scale(1.18)}}@keyframes glowpulse{0%,100%{opacity:.25}50%{opacity:.38}}@keyframes pan1{to{background-position:220px 0}}@keyframes pan2{to{background-position:-300px 120px}}@keyframes tw{0%,100%{opacity:.6}50%{opacity:.3}}@keyframes shoot{0%{transform:translate(0,0) rotate(18deg);opacity:0}4%{opacity:.7}12%{transform:translate(60vw,22vh) rotate(18deg);opacity:0}100%{opacity:0}}@keyframes ar{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}` }} />
      <Topbar lang={lang} onLangChange={setLang} profileMode={profileMode} onCollapsedChange={setCollapsed} />

      {profileMode === 'alumno' && (
        <>
          <HeroZone
            data={data} theme={theme}
            mascotId={mascotId} mascotColor={mascotColor} accId={accId}
            boltId={boltId} fraseId={fraseId}
            onMascotClick={() => setMascotOpen(true)}
            onBoltClick={() => setBoltOpen(true)}
            onFraseClick={() => setFraseOpen(true)}
            onPaletteClick={() => setPaletteOpen(true)}
          />
          <div id="topbar-sentinel" style={{ height: 0 }} />
          {data.misionActiva && (
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--blue-dark)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="20" viewBox="7 2 16 31" fill="none">
                  <path d="M13.3 3.2 L18.7 4.1 L21.4 19.9 L16.7 19.9 L15.3 31.6 L9.9 14 L14.6 14Z" fill="var(--sp-accent)"/>
                </svg>
                Misión activa
              </div>
              <MisionActivaCard mision={data.misionActiva} ramas={data.ramas} />
            </div>
          )}
          <PoderesTab  data={data} />
          <MisionesTab data={data} />
          <ActitudTab  data={data} />
          <div style={{ height: 96 }} />
        </>
      )}

      {profileMode === 'familia' && (
        <FamiliaPortal data={data} onSwitchToAlumno={() => setProfileMode('alumno')} />
      )}

      <MascotModal
        open={mascotOpen} onClose={() => setMascotOpen(false)}
        mascotId={mascotId} mascotColor={mascotColor} accId={accId} level={data.nivelGlobal}
        onMascotChange={handleMascotChange}
        onColorChange={(hex) => { setMascotColor(hex); setMascotOpen(false) }}
        onAccChange={(id) => { setAccId(id); setMascotOpen(false) }}
      />
      <BoltModal open={boltOpen} onClose={() => setBoltOpen(false)} boltId={boltId} level={data.nivelGlobal} onBoltChange={setBoltId} />
      <FraseModal open={fraseOpen} onClose={() => setFraseOpen(false)} fraseId={fraseId} level={data.nivelGlobal} onFraseChange={setFraseId} />
      <PaletteModal open={paletteOpen} onClose={() => setPaletteOpen(false)} theme={theme} onThemeChange={setTheme} level={data.nivelGlobal} />
      <ProfileSwitcher mode={profileMode} onChange={setProfileMode} collapsed={collapsed} />
    </div>
  )
}
