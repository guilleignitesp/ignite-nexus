# Arquitectura técnica — IGNITE NEXUS

> Documento vivo. Actualizar cada vez que se introduzca un patrón nuevo o se cambie una convención.

---

## Tabla de contenidos

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Patrones de código](#3-patrones-de-código)
4. [Sistema de autenticación y roles](#4-sistema-de-autenticación-y-roles)
5. [Internacionalización](#5-internacionalización)
6. [Sistema de caché](#6-sistema-de-caché)
7. [Convenciones de nombrado](#7-convenciones-de-nombrado)
8. [Flujo completo de una petición](#8-flujo-completo-de-una-petición)

---

## 1. Stack tecnológico

### Framework principal

| Tecnología | Versión | Justificación |
|------------|---------|---------------|
| **Next.js** | 16.2.3 | App Router + Server Components + Server Actions. La versión 16 introduce cambios breaking (ver abajo). Turbopack activo en dev y build. |
| **React** | 19.2.4 | Requerido por Next.js 16. Incluye el hook `cache()` usado para deduplicación por request. |
| **TypeScript** | ^5 | Tipado estático en todo el proyecto. Configurado con `strict: true`. |

### Base de datos y autenticación

| Tecnología | Versión | Justificación |
|------------|---------|---------------|
| **Supabase** | cloud | PostgreSQL gestionado + autenticación + RLS integrado. Evita gestionar infraestructura de base de datos. |
| **@supabase/ssr** | ^0.10.2 | Cliente Supabase adaptado para SSR/Next.js. Gestiona cookies de sesión correctamente en Server Components. |
| **@supabase/supabase-js** | ^2.103.1 | Cliente público (sin cookies) usado exclusivamente dentro de `unstable_cache` para datos estáticos públicos. |

### UI y estilos

| Tecnología | Versión | Justificación |
|------------|---------|---------------|
| **Tailwind CSS** | ^4 | v4 usa un nuevo motor CSS-first (configuración en `globals.css`, no `tailwind.config`). |
| **shadcn/ui** | ^4.2.0 (CLI) | Componentes copiados en `src/components/ui/`. El preset elegido es **base-nova**, que usa `@base-ui/react` como primitiva. |
| **@base-ui/react** | ^1.4.0 | Primitivas accesibles sin estilos. **IMPORTANTE:** usa prop `render={<Component />}` en lugar del `asChild` de Radix. |
| **class-variance-authority** | ^0.7.1 | Gestión de variantes de componentes (`cva`). Usado en Badge, Button, etc. |
| **clsx + tailwind-merge** | — | Combinados en la utilidad `cn()` de `src/lib/utils.ts` para clases condicionales sin conflictos. |
| **lucide-react** | ^1.8.0 | Iconos SVG. Importación individual para tree-shaking. |

### Internacionalización

| Tecnología | Versión | Justificación |
|------------|---------|---------------|
| **next-intl** | ^4.9.1 | i18n con routing por segmento `[locale]`. Integración nativa con App Router y Server Components. |

### Breaking changes de Next.js 16.2.3

Estas diferencias con versiones anteriores son críticas y han causado errores en el pasado:

```
❌ middleware.ts           →  ✅ proxy.ts (función exportada: `proxy`, no `middleware`)
❌ revalidateTag(tag)      →  ✅ updateTag(tag) en Server Actions (1 argumento, en 'next/cache')
❌ params (síncrono)       →  ✅ await params (es una Promise en páginas y layouts)
❌ searchParams (síncrono) →  ✅ await searchParams (es una Promise en páginas)
❌ asChild (Radix)         →  ✅ render={<Component />} (base-ui/react)
```

---

## 2. Estructura de carpetas

```
ignite-nexus/
├── docs/                          # Documentación técnica del proyecto
│   ├── arquitectura.md            # Este documento
│   └── base-de-datos.md           # Esquema, RLS y funciones SQL
│
├── supabase/
│   └── migrations/                # Migraciones SQL numeradas y acumulativas
│       ├── 001_initial_schema.sql # Todas las tablas + RLS habilitado + datos iniciales
│       ├── 002_rls_settings.sql   # Políticas para platform_settings y school_years
│       ├── 003_rls_schools.sql    # Políticas para schools, groups, workers (lectura)
│       ├── 004_rls_teachers.sql   # Políticas para workers (escritura) y admin_permissions
│       ├── 005_rls_students.sql   # Políticas para students, XP, evaluaciones + función search_students_page
│       └── 006_rls_enrollments.sql # Políticas para group_enrollments + función get_enrollment_stats
│
├── src/
│   ├── app/                       # App Router de Next.js
│   │   ├── layout.tsx             # Root layout: shell HTML, fuentes, metadata global
│   │   ├── globals.css            # Estilos globales, variables CSS de Tailwind v4, tema gamificado (.theme-student)
│   │   │
│   │   └── [locale]/              # Segmento dinámico: 'es', 'en', 'ca'
│   │       ├── layout.tsx         # Locale layout: valida locale, provee NextIntlClientProvider con mensajes
│   │       │
│   │       ├── (admin)/           # Route group admin (no afecta a la URL)
│   │       │   ├── layout.tsx     # Guard requireAdmin + AdminSidebar + SidebarProvider
│   │       │   └── admin/
│   │       │       ├── dashboard/page.tsx
│   │       │       ├── settings/page.tsx
│   │       │       ├── schools/
│   │       │       │   ├── page.tsx
│   │       │       │   └── groups/[groupId]/page.tsx
│   │       │       ├── teachers/
│   │       │       │   ├── page.tsx
│   │       │       │   └── [workerId]/page.tsx
│   │       │       ├── students/
│   │       │       │   ├── page.tsx
│   │       │       │   └── [studentId]/page.tsx
│   │       │       └── enrollments/page.tsx
│   │       │
│   │       ├── (teacher)/         # Route group profesor
│   │       │   ├── layout.tsx     # Guard requireWorker + TeacherNav
│   │       │   └── teacher/
│   │       │       └── home/page.tsx
│   │       │
│   │       ├── (student)/         # Route group alumno
│   │       │   ├── layout.tsx     # Tema gamificado (.theme-student)
│   │       │   └── student/
│   │       │       └── home/page.tsx
│   │       │
│   │       ├── auth/callback/     # Callback OAuth de Supabase
│   │       └── login/page.tsx     # Página de inicio de sesión
│   │
│   ├── components/
│   │   ├── admin/                 # Componentes exclusivos del panel de administración
│   │   │   ├── AdminSidebar.tsx   # Sidebar con filtrado por módulos según perfil del admin
│   │   │   ├── schools/           # SchoolsList, AddSchoolDialog, AddGroupDialog
│   │   │   ├── teachers/          # TeachersList, AddTeacherDialog, PermissionsGrid
│   │   │   ├── students/          # StudentsList, EditStudentDialog, GroupsCard, XPTrajectory, EvaluationHistory, AttitudeLog
│   │   │   ├── enrollments/       # EnrollmentStats, RecentActivity, CSVUploadTool, BulkDeactivateTool
│   │   │   └── settings/          # PlatformNameForm, SchoolYearsSection, CreateSchoolYearDialog, CloseCourseDialog
│   │   │
│   │   ├── auth/                  # LoginForm
│   │   ├── teacher/               # TeacherNav (barra de navegación del profesor)
│   │   └── ui/                    # Componentes base de shadcn/ui copiados y personalizados
│   │       ├── button.tsx         # Variantes: default, outline, ghost, destructive, secondary
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── badge.tsx          # Variantes: default, secondary, destructive, outline
│   │       ├── dialog.tsx         # Basado en @base-ui/react/dialog
│   │       └── sidebar.tsx        # Sidebar colapsable del admin
│   │
│   ├── lib/
│   │   ├── auth.ts                # getUserProfile (cacheado), requireAuth/Worker/Admin/SuperAdmin, getRoleHomePath
│   │   ├── supabase-server.ts     # createClient() — cliente Supabase con cookies para Server Components/Actions
│   │   ├── utils.ts               # cn() — helper de clases Tailwind
│   │   │
│   │   ├── data/                  # Capa de acceso a datos (solo lectura)
│   │   │   ├── settings.ts        # getSettings(), getSchoolYears() — unstable_cache, cliente público
│   │   │   ├── schools.ts         # getSchoolsWithGroups(), getActiveWorkers() — unstable_cache, cliente público
│   │   │   ├── teachers.ts        # getWorkersPage(), getWorkerProfile() — cliente autenticado, sin caché
│   │   │   ├── students.ts        # getStudentsPage() (RPC), getStudentProfile() — cliente autenticado, sin caché
│   │   │   └── enrollments.ts     # getEnrollmentStats() (RPC), getRecentEnrollments/Leaves(), getActiveGroups() — mixto
│   │   │
│   │   └── actions/               # Server Actions (mutaciones)
│   │       ├── settings.ts        # updatePlatformName, createSchoolYear, activateSchoolYear, closeCourse
│   │       ├── schools.ts         # createSchool, createGroup
│   │       ├── teachers.ts        # createWorker, toggleWorkerStatus, upsertModulePermission, setSuperAdmin
│   │       ├── students.ts        # updateStudent, toggleStudentStatus, updateEvaluationMultiplier
│   │       └── enrollments.ts     # bulkEnroll, bulkDeactivate
│   │
│   ├── i18n/
│   │   ├── routing.ts             # Define locales ['es','en','ca'] y defaultLocale 'es'
│   │   └── request.ts             # Carga mensajes JSON según locale por request
│   │
│   ├── messages/                  # Ficheros de traducción JSON
│   │   ├── es.json                # Español (locale por defecto)
│   │   ├── en.json                # Inglés
│   │   └── ca.json                # Catalán
│   │
│   └── types/                     # Tipos TypeScript compartidos
│       └── index.ts               # Role = 'worker' | 'student' | 'admin'
│
├── proxy.ts                       # Next.js 16 proxy (equivale a middleware): refresca sesión Supabase + routing i18n
├── next.config.ts                 # Configuración Next.js + plugin next-intl
├── package.json
├── tsconfig.json
└── CLAUDE.md / AGENTS.md          # Instrucciones para el agente de IA
```

---

## 3. Patrones de código

### 3.1 Páginas (Server Components)

Todas las páginas del admin son Server Components asíncronos. Patrón estándar:

```tsx
// src/app/[locale]/(admin)/admin/[módulo]/page.tsx

import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth'
import { getDatos, PAGE_LIMIT } from '@/lib/data/modulo'
import { ComponentePrincipal } from '@/components/admin/modulo/ComponentePrincipal'

export default async function ModuloPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>       // ⚠️ Promise en Next.js 16
  searchParams: Promise<{ page?: string; search?: string }>  // ⚠️ Promise en Next.js 16
}) {
  const { locale } = await params
  const { page: pageParam = '0', search = '' } = await searchParams

  // 1. Guard de autenticación (redirige si no cumple)
  await requireAdmin(locale)

  const page = parseInt(pageParam, 10)

  // 2. Fetch en paralelo (nunca secuencial si son independientes)
  const [t, { datos, total }] = await Promise.all([
    getTranslations('modulo'),
    getDatos(search, page),
  ])

  // 3. Renderizar (sin lógica de negocio aquí)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <ComponentePrincipal datos={datos} total={total} page={page} locale={locale} />
    </div>
  )
}
```

**Reglas de las páginas:**
- Solo orquestan: auth + fetch + renderizado
- Sin lógica de negocio ni manipulación de datos
- El fetch siempre en `Promise.all` si hay múltiples llamadas independientes
- Pasan todos los datos como props a Client Components

### 3.2 Capa de datos (`src/lib/data/`)

Dos patrones según el tipo de datos:

#### Datos públicos estáticos — `unstable_cache` + cliente público

```ts
// Para datos que no cambian frecuentemente y no son sensibles
// Ejemplos: schools, groups, workers list, settings, school years

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'  // ⚠️ Cliente público, sin cookies

export const getDatosEstaticos = unstable_cache(
  async (): Promise<Dato[]> => {
    // Cliente público: funciona sin contexto de request (dentro de unstable_cache)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.from('tabla').select('...')
    if (error) throw new Error(error.message)
    return transformar(data)
  },
  ['cache-key-único'],
  { tags: ['tag-para-invalidar'], revalidate: false }
)
// revalidate: false → nunca expira por tiempo, solo por updateTag()
// Las tablas deben tener política RLS `public_read` (USING true) para que funcione sin auth
```

#### Datos autenticados en tiempo real — sin caché

```ts
// Para datos sensibles o que cambian frecuentemente
// Ejemplos: listas de alumnos, perfiles de profesores, permisos

import { createClient } from '@/lib/supabase-server'  // ⚠️ Cliente SSR con cookies

export async function getDatosAutenticados(id: string): Promise<Dato | null> {
  const supabase = await createClient()  // Heredita las cookies de la request actual

  // ✅ Query única con nested selects (evita N+1)
  const { data, error } = await supabase
    .from('tabla_principal')
    .select(`
      id, campo1, campo2,
      tabla_relacionada(campo_a, campo_b),
      otra_tabla(id, nombre, subtabla(x, y))
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return transformar(data as unknown as RawType)
}
```

**Reglas de la capa de datos:**
- Nunca hacer queries N+1 (un query por fila del resultado anterior)
- Usar nested selects de PostgREST en lugar de queries encadenadas
- Siempre tipar el raw de Supabase con interfaces locales y hacer la transformación en la función
- Exportar `PAGE_LIMIT` como constante junto a las funciones paginadas
- Funciones de datos solo leen, nunca mutan

### 3.3 Server Actions (`src/lib/actions/`)

```ts
'use server'

import { updateTag } from 'next/cache'      // ⚠️ updateTag, no revalidateTag
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

// Guard de autorización — patrón estándar para cada módulo
async function assertAccesoModulo(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('nombre_modulo')) {
    throw new Error('Unauthorized')
  }
}

export async function crearEntidad(datos: Input): Promise<void> {
  await assertAccesoModulo()          // 1. Autorización
  const supabase = await createClient()
  
  const { error } = await supabase    // 2. Mutación
    .from('tabla')
    .insert({ ...datos })
  
  if (error) throw new Error(error.message)
  
  updateTag('tag-cache')              // 3. Invalidar caché si aplica
}
```

**Reglas de Server Actions:**
- Siempre `'use server'` en la primera línea del fichero
- Siempre verificar autorización como primer paso
- Usar `updateTag()` (no `revalidateTag()`) para invalidar caché tras mutaciones
- `updateTag()` solo funciona en Server Actions (no en Server Components)
- Lanzar `Error` en caso de fallo (el cliente lo captura en `try/catch`)
- Para datos no cacheados (alumnos, profesores), no llamar `updateTag` — el cliente llama `router.refresh()` para re-renderizar el Server Component

### 3.4 Componentes cliente (`src/components/`)

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { accionServidor } from '@/lib/actions/modulo'

interface Props {
  // Recibe todos los datos como props (del Server Component padre)
  initialData: Dato
}

export function ComponenteCliente({ initialData }: Props) {
  const t = useTranslations('namespace')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleAction() {
    startTransition(async () => {
      try {
        await accionServidor(datos)
        router.refresh()  // Re-renderiza el Server Component padre con datos frescos
      } catch {
        // Manejar error
      }
    })
  }

  // Renderizado con render prop para links (patrón base-nova):
  // <Button render={<Link href="/ruta" />}>Texto</Button>
  // ⚠️ NO usar asChild (no existe en @base-ui/react)
}
```

**Reglas de componentes cliente:**
- No hacen fetches directos (toda la data viene del Server Component padre)
- Usan `useTransition` para marcar acciones asíncronas sin bloquear la UI
- Llaman `router.refresh()` tras mutaciones para sincronizar con el servidor
- Los formularios usan `<form onSubmit={handler}>` con `e.preventDefault()`
- Para navegación programática: `router.push(url)` con URLSearchParams

### 3.5 Componentes UI base (`src/components/ui/`)

Componentes copiados de shadcn/ui con preset **base-nova** (`@base-ui/react`).

El patrón clave de `render` prop:
```tsx
// ✅ Correcto (base-nova / @base-ui)
<Button render={<Link href="/admin/students" />}>Volver</Button>
<DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>

// ❌ Incorrecto (patrón Radix/shadcn clásico — no funciona aquí)
<Button asChild><Link href="/admin/students">Volver</Link></Button>
```

---

## 4. Sistema de autenticación y roles

### 4.1 Flujo de autenticación

```
Usuario → Login (email/password)
       → Supabase Auth crea sesión en cookies
       → proxy.ts refresca token en cada request
       → Server Components llaman getUserProfile()
       → getUserProfile() lee auth.users → workers → admin_permissions
       → Retorna UserProfile con rol y permisos
```

### 4.2 Interface UserProfile

```ts
interface UserProfile {
  id: string              // UUID de auth.users
  role: 'worker' | 'student'  // Tipo de usuario
  workerId?: string       // UUID en tabla workers (si role = 'worker')
  studentId?: string      // UUID en tabla students (futuro)
  hasAdminAccess: boolean // true si tiene alguna fila en admin_permissions
  isSuperAdmin: boolean   // true si alguna fila tiene is_superadmin = true
  adminModules: string[]  // Lista de módulos con can_view = true
                          // Ej: ['schools', 'teachers', 'students']
}
```

### 4.3 Roles y guardas

| Guard | Condición | Redirige a |
|-------|-----------|-----------|
| `requireAuth(locale)` | Usuario autenticado | `/[locale]/login` |
| `requireWorker(locale)` | role = 'worker' | `/[locale]/login` |
| `requireAdmin(locale)` | hasAdminAccess = true | `/[locale]/teacher/home` |
| `requireSuperAdmin(locale)` | isSuperAdmin = true | `/[locale]/admin/dashboard` |

Todas las guardas están en `src/lib/auth.ts` y son usadas en:
- **Layouts**: protegen rutas completas (todos sus children)
- **Páginas**: protección adicional cuando una página requiere más privilegios que el layout

### 4.4 Permisos granulares de admin

Los admins no son todos iguales. Un `worker` puede tener acceso solo a ciertos módulos:

```
workers.id → admin_permissions (0 o más filas)
  ├── module = 'schools',    can_view = true, can_edit = true
  ├── module = 'teachers',   can_view = true, can_edit = false
  └── module = 'superadmin', is_superadmin = true  ← fila centinela para superadmin
```

El sidebar filtra los items visibles según `adminModules` del perfil:
```ts
const visibleItems = items.filter(
  item => isSuperAdmin || adminModules.includes(item.key)
)
```

### 4.5 Funciones SQL de seguridad

Definidas como `SECURITY DEFINER` para evitar recursión en RLS:

- `is_admin()` — Cualquier acceso admin (can_view OR is_superadmin)
- `is_superadmin()` — Solo superadmin
- `can_manage(module)` — Superadmin OR (can_edit = true para ese módulo)

### 4.6 Deduplicación con React cache()

`getUserProfile()` está envuelta en `cache()` de React, lo que garantiza que aunque sea llamada desde el layout, la página, y múltiples Server Components en el mismo render tree, solo ejecuta **una query** a Supabase por request.

```ts
import { cache } from 'react'
export const getUserProfile = cache(async () => { ... })
```

---

## 5. Internacionalización

### 5.1 Locales soportados

| Locale | Idioma | Por defecto |
|--------|--------|-------------|
| `es` | Español | ✅ Sí |
| `en` | Inglés | No |
| `ca` | Catalán | No |

### 5.2 Routing

El locale forma parte de la URL: `/es/admin/students`, `/en/admin/students`.

Configurado en `src/i18n/routing.ts`:
```ts
export const routing = defineRouting({
  locales: ['es', 'en', 'ca'],
  defaultLocale: 'es',
})
```

La raíz `/` redirige automáticamente a `/{defaultLocale}` gracias a `proxy.ts`.

### 5.3 Estructura de mensajes

Los mensajes están en `src/messages/{locale}.json` organizados por namespaces:

```json
{
  "common": { ... },       // Textos compartidos (save, cancel, etc.)
  "auth": { ... },         // Login
  "admin": { ... },        // Labels de navegación del admin
  "schools": { ... },      // Módulo escuelas (34 claves)
  "teachers": { ... },     // Módulo profesores (39 claves)
  "students": { ... },     // Módulo alumnos (58 claves)
  "enrollments": { ... },  // Módulo altas/bajas (42 claves)
  "settings": { ... },     // Módulo configuración (30 claves)
  "school": { ... },       // Datos de escuela para vistas de profesor/alumno
  ...
}
```

### 5.4 Uso en Server Components

```ts
// En páginas y layouts (Server Components)
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('namespace')
t('clave')                          // String
t('claveConParams', { count: 5 })   // Con interpolación
```

### 5.5 Uso en Client Components

```tsx
// En componentes cliente
import { useTranslations } from 'next-intl'
const t = useTranslations('namespace')
// Los mensajes ya están disponibles porque NextIntlClientProvider los pasa
// desde [locale]/layout.tsx
```

### 5.6 Cómo añadir una nueva clave

1. Añadir la clave en `src/messages/en.json`
2. Añadir la misma clave (traducida) en `es.json` y `ca.json`
3. Verificar paridad: `node -e "const en=require('./src/messages/en.json'); const es=require('./src/messages/es.json'); console.log(Object.keys(en.namespace).filter(k => !es.namespace[k]))"`

---

## 6. Sistema de caché

### 6.1 Principio

```
¿El dato es público Y raramente cambia?
  → SÍ: unstable_cache + cliente público + tag de invalidación
  → NO: sin caché, cliente autenticado, router.refresh() tras mutaciones
```

### 6.2 Datos cacheados (datos maestros públicos)

| Función | Tag | Qué contiene |
|---------|-----|--------------|
| `getSettings()` | `['settings']` | Nombre y logo de la plataforma |
| `getSchoolYears()` | `['settings']` | Lista de cursos escolares |
| `getSchoolsWithGroups()` | `['schools']` | Escuelas → grupos → horarios → profesores asignados |
| `getActiveWorkers()` | `['workers']` | Lista de profesores activos (para dropdowns) |
| `getActiveGroups()` | `['schools']` | Grupos activos con escuela (para CSV upload) |

**Requisito:** Las tablas accedidas deben tener una política RLS `public_read` con `USING (true)` para que el cliente sin autenticación pueda leerlas.

```ts
// Patrón de invalidación en Server Actions tras mutación:
import { updateTag } from 'next/cache'
updateTag('schools')  // Invalida todo lo etiquetado con 'schools'
```

### 6.3 Datos NO cacheados (datos operativos en tiempo real)

| Dato | Motivo |
|------|--------|
| Listas de profesores (`getWorkersPage`) | Paginado con búsqueda, datos sensibles |
| Perfil de profesor (`getWorkerProfile`) | Incluye permisos admin, sensible |
| Lista de alumnos (`getStudentsPage`) | Via RPC, filtros dinámicos |
| Perfil de alumno (`getStudentProfile`) | XP y evaluaciones, actualizaciones frecuentes |
| Stats de altas/bajas (`getEnrollmentStats`) | Tiempo real, cambia con cada alta/baja |
| Actividad reciente (`getRecent*`) | Datos en tiempo real |

Para estos datos, tras una mutación el Client Component llama `router.refresh()`, que re-ejecuta el Server Component y sus fetches.

### 6.4 Deduplicación por request

`getUserProfile()` usa `cache()` de React, que deduplica dentro del mismo render tree. No se puede usar en datos que varían por parámetro de URL; para esos casos, la deduplicación la maneja directamente Next.js.

### 6.5 Por qué `unstable_cache` con cliente público

El callback de `unstable_cache` se ejecuta fuera del contexto de la request HTTP (no hay cookies disponibles). Por tanto, el cliente SSR (`createClient()` de `supabase-server.ts`) fallaría al intentar leer las cookies de sesión.

La solución: usar el cliente público de `@supabase/supabase-js` sin cookies, y asegurarse de que las tablas accedidas tengan `public_read` en RLS.

---

## 7. Convenciones de nombrado

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `TeachersList.tsx` |
| Páginas Next.js | `page.tsx`, `layout.tsx` | siempre igual |
| Funciones de datos | camelCase descriptivo | `getWorkersPage`, `getStudentProfile` |
| Server Actions | camelCase verbo-nombre | `createSchool`, `toggleStudentStatus` |
| Migraciones SQL | `NNN_descripcion.sql` | `004_rls_teachers.sql` |
| Carpetas | kebab-case | `components/admin/schools/` |

### Variables y funciones

| Patrón | Convención |
|--------|-----------|
| Constantes exportadas | SCREAMING_SNAKE | `PAGE_LIMIT = 15` |
| Props interfaces | PascalCase + Props sufijo | `TeachersListProps` |
| Raw types internos | Raw prefijo | `RawWorkerProfile` |
| Guards de autorización | `assert` prefijo | `assertStudentsAccess()` |
| Helpers privados del módulo | sin exportar | `buildGroupMap()` |

### Claves de traducción

- camelCase dentro de cada namespace
- Nombres descriptivos del uso, no del contenido: `pageTitle`, no `title`
- Sufijos estándar: `Label`, `Placeholder`, `Error`, `Submit`, `Badge`
- Para conteos: `{count}` como parámetro de interpolación

### Módulos del sistema de permisos

Los nombres de módulo en `admin_permissions.module` deben coincidir exactamente con las keys del sidebar:

```
'schools' | 'teachers' | 'students' | 'enrollments' | 'projects' | 
'skills' | 'project_maps' | 'validation' | 'sessions_dashboard' | 
'resources' | 'attitudes' | 'timesheet' | 'absences' | 'stock'
```

---

## 8. Flujo completo de una petición

Ejemplo: **Admin hace clic en "Ver perfil" de un alumno**.

```
[1] CLIC en el botón "Ver perfil"
    └── <Button render={<Link href="/es/admin/students/abc-123" />}>
        → Next.js Router intercepta la navegación (client-side)

[2] PROXY (proxy.ts) — ejecuta en cada request
    ├── Supabase: supabase.auth.getUser() → refresca token si está próximo a expirar
    └── next-intl: valida locale 'es', no redirige

[3] LAYOUT [locale]/layout.tsx
    ├── Valida locale 'es' en routing.locales
    └── Carga messages/es.json → NextIntlClientProvider

[4] LAYOUT (admin)/layout.tsx
    ├── requireAdmin('es')
    │   └── getUserProfile() [React cache — 1 query]
    │       ├── supabase.auth.getUser() → userId
    │       └── workers + admin_permissions [1 query Supabase]
    ├── Si hasAdminAccess = false → redirect('/es/teacher/home')
    └── Renderiza AdminSidebar + shell

[5] PAGE /admin/students/[studentId]/page.tsx
    ├── await params → { locale: 'es', studentId: 'abc-123' }
    ├── requireAdmin('es') → getUserProfile() [React cache — 0 queries adicionales]
    └── Promise.all([
          getTranslations('students'),   → mensajes de es.json
          getStudentProfile('abc-123')   → 1 query Supabase (nested select profundo)
        ])

[6] QUERY Supabase (getStudentProfile)
    ├── supabase.from('students')
    │   .select('*, group_enrollments(...), student_xp(...), project_evaluations(...), attitude_logs(...)')
    │   .eq('id', 'abc-123').single()
    ├── RLS: is_admin() → true → acceso permitido
    └── Retorna StudentProfile con todos los datos anidados

[7] RENDERIZADO Server
    ├── StudentProfilePage → JSX con datos
    ├── Client Components reciben datos como props (sin fetches propios):
    │   ├── EditStudentDialog (interactivo)
    │   ├── GroupsCard (display)
    │   ├── XPTrajectory (display)
    │   ├── EvaluationHistory (interactivo — edita multiplicador)
    │   └── AttitudeLog (display)
    └── HTML enviado al cliente con componentes hidratados

[8] USUARIO VE la página con todos los datos del alumno
    └── Los Client Components se hidratan y son interactivos

--- Si el usuario edita el multiplicador de una evaluación: ---

[9] CLIC en el multiplicador → MultiplierCell pasa a modo edición

[10] CLIC en "Guardar"
     └── updateEvaluationMultiplier(evaluationId, 150) — Server Action

[11] SERVER ACTION (actions/students.ts)
     ├── assertStudentsAccess() → getUserProfile() [React cache si mismo render]
     │   → profile.adminModules.includes('students') → true
     ├── Math.min(200, Math.max(20, 150)) = 150
     ├── supabase.from('project_evaluations').update({ xp_multiplier_pct: 150 }).eq('id', evaluationId)
     └── RLS: can_manage('students') → true → actualización permitida

[12] Client Component recibe respuesta
     ├── setEditing(false)
     └── router.refresh() → re-ejecuta pasos [5]-[7] con datos frescos

[13] USUARIO VE el multiplicador actualizado (150%)
```

**Total de queries Supabase para cargar la página:** 2 (getUserProfile + getStudentProfile)  
**Para la mutación:** 2 (getUserProfile [cacheado] + update)  
**Re-render tras mutación:** mismas 2 queries del paso 5-6
