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
9. [Módulos construidos](#9-módulos-construidos)

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
│       ├── 001_initial_schema.sql  # Todas las tablas + RLS habilitado + datos iniciales
│       ├── 002_rls_settings.sql    # Políticas para platform_settings y school_years
│       ├── 003_rls_schools.sql     # Políticas para schools, groups, workers (lectura)
│       ├── 004_rls_teachers.sql    # Políticas para workers (escritura) y admin_permissions
│       ├── 005_rls_students.sql    # Políticas para students, XP, evaluaciones + función search_students_page
│       ├── 006_rls_enrollments.sql # Políticas para group_enrollments + función get_enrollment_stats
│       ├── 007_rls_skills.sql      # Políticas para branches y skills
│       ├── 008_rls_projects.sql    # Políticas para projects, project_resources, project_skills, project_maps
│       ├── 009_project_maps.sql    # Separación módulo project_maps, column initial_project_id
│       ├── 010_rls_validation.sql  # Políticas para plannings, planning_project_log, sessions (lectura)
│       ├── 011_rls_sessions.sql    # RLS sesiones del profesor + función get_my_worker_id + índice único
│       ├── 012_rls_hr_modules.sql  # RLS fichajes y ausencias
│       └── 013_resources.sql       # Columnas resource_type/target_role + RLS recursos globales
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
│   │       │       ├── enrollments/page.tsx
│   │       │       ├── absences/page.tsx
│   │       │       └── resources/page.tsx
│   │       │
│   │       ├── (teacher)/         # Route group profesor
│   │       │   ├── layout.tsx     # Guard requireWorker + TeacherNav
│   │       │   └── teacher/
│   │       │       ├── home/page.tsx
│   │       │       ├── groups/[groupId]/page.tsx
│   │       │       ├── timesheet/page.tsx
│   │       │       ├── absences/page.tsx
│   │       │       └── resources/page.tsx
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
│   │   │   ├── settings/          # PlatformNameForm, SchoolYearsSection, CreateSchoolYearDialog, CloseCourseDialog
│   │   │   ├── project-maps/      # MapsList, CreateMapDialog, MapEditor
│   │   │   ├── validation/        # ValidationList, ValidationPanel
│   │   │   ├── absences/          # AbsencesAdminList
│   │   │   └── resources/         # ResourcesAdminList, ResourceDialog
│   │   │
│   │   ├── auth/                  # LoginForm
│   │   ├── teacher/
│   │   │   ├── TeacherNav.tsx     # Barra de navegación del profesor
│   │   │   ├── group/             # ActiveSessionForm, AttendanceHistorySection, ProjectMapReadOnly
│   │   │   ├── timesheet/         # TimesheetToggle, TimesheetHistoryList
│   │   │   ├── absences/          # AbsencesList, RequestAbsenceDialog
│   │   │   └── resources/         # ResourcesList
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
│   │   │   ├── enrollments.ts     # getEnrollmentStats() (RPC), getRecentEnrollments/Leaves(), getActiveGroups() — mixto
│   │   │   ├── teacher.ts         # getTeacherGroupDetail(), getActiveSession() — datos operativos del profesor
│   │   │   ├── timesheets.ts      # getTimesheetStatus() — fichajes del profesor
│   │   │   ├── absences.ts        # getMyAbsences(), getAdminAbsencesPage(), getAbsenceReasons()
│   │   │   ├── global-resources.ts # getTeacherResources(), getAdminResourcesPage(), getSchoolsForSelect(), getGroupsForSelect()
│   │   │   ├── skills.ts          # getBranchesWithSkills() — unstable_cache
│   │   │   ├── projects.ts        # getProjectsList() — unstable_cache
│   │   │   ├── project-maps.ts    # getProjectMapsList() (cached), getProjectMapDetail() (live)
│   │   │   └── validation.ts      # getValidationList()
│   │   │
│   │   ├── actions/               # Server Actions (mutaciones)
│   │   │   ├── settings.ts        # updatePlatformName, createSchoolYear, activateSchoolYear, closeCourse
│   │   │   ├── schools.ts         # createSchool, createGroup
│   │   │   ├── teachers.ts        # createWorker, toggleWorkerStatus, upsertModulePermission, setSuperAdmin
│   │   │   ├── students.ts        # updateStudent, toggleStudentStatus, updateEvaluationMultiplier
│   │   │   ├── enrollments.ts     # bulkEnroll, bulkDeactivate
│   │   │   ├── teacher-sessions.ts # startSession, endSession, markAttendance, finalizeSession, assignProject
│   │   │   ├── timesheets.ts      # recordTimesheet
│   │   │   ├── absences.ts        # requestAbsence, approveAbsence, rejectAbsence
│   │   │   ├── global-resources.ts # createGlobalResource, updateGlobalResource, toggleGlobalResourceStatus
│   │   │   ├── skills.ts          # createBranch, updateBranch, createSkill, updateSkill
│   │   │   ├── projects.ts        # createProject, updateProject
│   │   │   ├── project-maps.ts    # createProjectMap, saveProjectMap, toggleProjectMapStatus
│   │   │   └── validation.ts      # getSessionTrajectory, validateAssignment, changeProjectAssignment
│   │   │
│   │   └── utils/                 # Utilidades compartidas
│   │       └── map-layout.ts      # computeLayout() — BFS topológico para MapEditor y ProjectMapReadOnly
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

---

## 9. Módulos construidos

Todos los módulos del panel de administración completados hasta la fecha, con su ruta, descripción y archivos principales.

---

### Dashboard

**Ruta:** `/admin/dashboard`  
**Descripción:** Página de bienvenida del administrador. Muestra el nombre de la plataforma y el año escolar activo. Punto de entrada tras login.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/dashboard/page.tsx` |
| Datos | `src/lib/data/settings.ts` — `getSettings()`, `getSchoolYears()` |

---

### Configuración

**Ruta:** `/admin/settings`  
**Descripción:** Gestión del nombre de la plataforma y ciclos de años escolares. Permite crear un nuevo año escolar, activar uno existente y cerrar el curso actual.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/settings/page.tsx` |
| Datos | `src/lib/data/settings.ts` — `getSettings()`, `getSchoolYears()` |
| Acciones | `src/lib/actions/settings.ts` — `updatePlatformName`, `createSchoolYear`, `activateSchoolYear`, `closeCourse` |
| Componentes | `src/components/admin/settings/PlatformNameForm.tsx`, `SchoolYearsSection.tsx`, `CreateSchoolYearDialog.tsx`, `CloseCourseDialog.tsx` |

---

### Escuelas y grupos

**Rutas:** `/admin/schools` · `/admin/schools/groups/[groupId]`  
**Descripción:** Listado de escuelas con sus grupos. Permite crear escuelas y grupos. La vista de detalle de grupo muestra horario semanal y profesores asignados, con edición inline.

| Capa | Archivos |
|------|---------|
| Páginas | `src/app/[locale]/(admin)/admin/schools/page.tsx`, `.../groups/[groupId]/page.tsx` |
| Datos | `src/lib/data/schools.ts` — `getSchoolsWithGroups()`, `getGroupDetail()`, `getActiveWorkers()` |
| Acciones | `src/lib/actions/schools.ts` — `createSchool`, `createGroup` |
| Componentes | `src/components/admin/schools/SchoolsList.tsx`, `AddSchoolDialog.tsx`, `AddGroupDialog.tsx` |

---

### Profesores

**Rutas:** `/admin/teachers` · `/admin/teachers/[workerId]`  
**Descripción:** Listado paginado de profesores con búsqueda. Vista de detalle con gestión de permisos granulares por módulo (can_view / can_edit) y activación/desactivación de cuenta.

| Capa | Archivos |
|------|---------|
| Páginas | `src/app/[locale]/(admin)/admin/teachers/page.tsx`, `.../[workerId]/page.tsx` |
| Datos | `src/lib/data/teachers.ts` — `getWorkersPage()`, `getWorkerProfile()` |
| Acciones | `src/lib/actions/teachers.ts` — `createWorker`, `toggleWorkerStatus`, `upsertModulePermission`, `setSuperAdmin` |
| Componentes | `src/components/admin/teachers/TeachersList.tsx`, `AddTeacherDialog.tsx`, `PermissionsGrid.tsx` |

---

### Alumnos

**Rutas:** `/admin/students` · `/admin/students/[studentId]`  
**Descripción:** Listado paginado de alumnos con búsqueda por nombre/email/grupo. Vista de detalle con trayectoria de XP, historial de evaluaciones (con multiplicador editable), log de actitudes y grupos actuales.

| Capa | Archivos |
|------|---------|
| Páginas | `src/app/[locale]/(admin)/admin/students/page.tsx`, `.../[studentId]/page.tsx` |
| Datos | `src/lib/data/students.ts` — `getStudentsPage()` (RPC), `getStudentProfile()` |
| Acciones | `src/lib/actions/students.ts` — `updateStudent`, `toggleStudentStatus`, `updateEvaluationMultiplier` |
| Componentes | `src/components/admin/students/StudentsList.tsx`, `EditStudentDialog.tsx`, `GroupsCard.tsx`, `XPTrajectory.tsx`, `EvaluationHistory.tsx`, `AttitudeLog.tsx` |

---

### Altas/Bajas

**Ruta:** `/admin/enrollments`  
**Descripción:** Panel de gestión de matrículas. Muestra estadísticas del año activo, actividad reciente (altas y bajas), carga masiva via CSV y herramienta de desactivación masiva.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/enrollments/page.tsx` |
| Datos | `src/lib/data/enrollments.ts` — `getEnrollmentStats()` (RPC), `getRecentEnrollments()`, `getRecentLeaves()`, `getActiveGroups()` |
| Acciones | `src/lib/actions/enrollments.ts` — `bulkEnroll`, `bulkDeactivate` |
| Componentes | `src/components/admin/enrollments/EnrollmentStats.tsx`, `RecentActivity.tsx`, `CSVUploadTool.tsx`, `BulkDeactivateTool.tsx` |

---

### Habilidades

**Ruta:** `/admin/skills`  
**Descripción:** Árbol de ramas y habilidades del catálogo curricular. Permite crear, editar y reordenar ramas y habilidades. Datos cacheados con `public_read` (catálogo estático).

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/skills/page.tsx` |
| Datos | `src/lib/data/skills.ts` — `getBranchesWithSkills()` |
| Acciones | `src/lib/actions/skills.ts` — `createBranch`, `updateBranch`, `createSkill`, `updateSkill` |
| Componentes | `src/components/admin/skills/SkillsView.tsx`, `EditBranchDialog.tsx`, `SkillDialog.tsx` |

---

### Proyectos

**Ruta:** `/admin/projects`  
**Descripción:** Catálogo de proyectos didácticos. Permite crear y editar proyectos con nombre, descripción, tipo de material, horas recomendadas y habilidades asociadas. Datos cacheados.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/projects/page.tsx` |
| Datos | `src/lib/data/projects.ts` — `getProjectsList()` |
| Acciones | `src/lib/actions/projects.ts` — `createProject`, `updateProject` |
| Componentes | `src/components/admin/projects/ProjectsList.tsx`, `ProjectDialog.tsx` |

---

### Mapas de proyectos

**Rutas:** `/admin/project-maps` · `/admin/project-maps/[mapId]`  
**Descripción:** Editor visual de itinerarios curriculares basado en grafos dirigidos (`@xyflow/react`). Permite crear mapas, añadir proyectos como nodos, conectarlos con aristas dirigidas, marcar el proyecto inicial y aplicar auto-layout BFS. Los mapas se guardan en DB con patrón delete-and-reinsert.

| Capa | Archivos |
|------|---------|
| Páginas | `src/app/[locale]/(admin)/admin/project-maps/page.tsx`, `.../[mapId]/page.tsx` |
| Datos | `src/lib/data/project-maps.ts` — `getProjectMapsList()` (cached), `getProjectMapDetail()` (live) |
| Acciones | `src/lib/actions/project-maps.ts` — `createProjectMap`, `saveProjectMap`, `toggleProjectMapStatus` |
| Componentes | `src/components/admin/project-maps/MapsList.tsx`, `CreateMapDialog.tsx`, `MapEditor.tsx` |

**Notas técnicas:**
- `nodeTypes` definido fuera del componente para evitar recreación en cada render
- Auto-layout implementado con BFS topológico propio (sin dependencias como dagre)
- `onSelectionChange` como prop de `<ReactFlow>` (no el hook, que requiere estar dentro del provider)
- CSS de React Flow importado con `import '@xyflow/react/dist/style.css'`

---

### Validación

**Ruta:** `/admin/validation`  
**Descripción:** Panel de validación de asignaciones de proyectos realizadas por profesores. Muestra todas las entradas de `planning_project_log` con filtros por estado, escuela, grupo y profesor. Al seleccionar una fila se abre un panel lateral con la trayectoria de sesiones del grupo para verificar coherencia pedagógica. El admin puede validar la asignación o cambiarla a otro proyecto.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/validation/page.tsx` |
| Datos | `src/lib/data/validation.ts` — `getValidationList()` (FK disambiguation con `workers!assigned_by`, `workers!validated_by`) |
| Acciones | `src/lib/actions/validation.ts` — `getSessionTrajectory()` (server action que devuelve datos), `validateAssignment()`, `changeProjectAssignment()` |
| Componentes | `src/components/admin/validation/ValidationList.tsx`, `ValidationPanel.tsx` |

**Notas técnicas:**
- Filtrado en memoria en el cliente (volumen acotado para colas de validación)
- `getSessionTrajectory` es un Server Action que retorna datos, llamado con `useEffect` desde el cliente para carga lazy
- Diseño split-panel: lista `flex-1` + panel fijo `w-[400px]` cuando hay ítem seleccionado

---

### Home del profesor

**Ruta:** `/teacher/home`  
**Descripción:** Página de bienvenida del profesor tras login. Muestra el nombre de la plataforma y los grupos activos del profesor con acceso directo a cada pantalla de grupo.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(teacher)/teacher/home/page.tsx` |
| Datos | `src/lib/data/teacher.ts` — `getTeacherHome()` |

---

### Pantalla de grupo

**Ruta:** `/teacher/groups/[groupId]`  
**Descripción:** Vista operativa principal del profesor para un grupo. Muestra el mapa curricular del grupo (ProjectMapReadOnly), permite iniciar/finalizar sesiones y registrar asistencia (ActiveSessionForm), y consultar el historial de asistencia (AttendanceHistorySection).

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(teacher)/teacher/groups/[groupId]/page.tsx` |
| Datos | `src/lib/data/teacher.ts` — `getTeacherGroupDetail()`, `getActiveSession()` |
| Acciones | `src/lib/actions/teacher-sessions.ts` — `startSession`, `endSession`, `markAttendance`, `finalizeSession`, `assignProject` |
| Componentes | `src/components/teacher/group/ActiveSessionForm.tsx`, `AttendanceHistorySection.tsx`, `ProjectMapReadOnly.tsx` |
| Utilidades | `src/lib/utils/map-layout.ts` — `computeLayout()` BFS topológico compartido con MapEditor (hgap=200) |

**Notas técnicas:**
- `TrafficLight` y `SessionStatus` definidos en `@/types/index.ts` y re-exportados desde `teacher.ts` para compatibilidad hacia atrás
- `attendanceMap` pre-computado como `Map<studentId, attended>` para evitar O(n²) en el render

---

### Fichaje del profesor

**Ruta:** `/teacher/timesheet`  
**Descripción:** Panel de fichaje del profesor. Muestra el estado actual (fichado/no fichado), permite fichar entrada o salida con un botón, y presenta el historial de fichajes del día actual y los últimos días con totales por día.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(teacher)/teacher/timesheet/page.tsx` |
| Datos | `src/lib/data/timesheets.ts` — `getTimesheetStatus()` (últimos 14 días en una query, agrupados por fecha) |
| Acciones | `src/lib/actions/timesheets.ts` — `recordTimesheet(type)` (worker_id determinado en servidor) |
| Componentes | `src/components/teacher/timesheet/TimesheetToggle.tsx` (client), `TimesheetHistoryList.tsx` (server) |

**Notas técnicas:**
- RLS: `worker_read_own_timesheets` y `worker_insert_timesheets` usan `get_my_worker_id()` (migración 012)
- Parsing de fechas con `T12:00:00` para evitar desfase UTC en visualización
- `isIn` se determina por el tipo (`in`/`out`) del fichaje más reciente entre todos los registros cargados

---

### Ausencias del profesor

**Ruta:** `/teacher/absences`  
**Descripción:** El profesor puede ver sus ausencias pasadas (con estado: pendiente/aprobada/rechazada) y solicitar nuevas ausencias indicando motivo del catálogo, fechas de inicio y fin, y comentario opcional.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(teacher)/teacher/absences/page.tsx` |
| Datos | `src/lib/data/absences.ts` — `getMyAbsences()`, `getAbsenceReasons()` |
| Acciones | `src/lib/actions/absences.ts` — `requestAbsence()` (inserta con status='pending') |
| Componentes | `src/components/teacher/absences/AbsencesList.tsx` (server async), `RequestAbsenceDialog.tsx` (client) |

---

### Gestión de ausencias (admin)

**Ruta:** `/admin/absences`  
**Descripción:** Panel de administración de ausencias. Lista todas las solicitudes con filtro por estado (pendiente/aprobada/rechazada). El admin puede aprobar o rechazar solicitudes pendientes.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/absences/page.tsx` |
| Datos | `src/lib/data/absences.ts` — `getAdminAbsencesPage(status, page, locale)` |
| Acciones | `src/lib/actions/absences.ts` — `approveAbsence()`, `rejectAbsence()` |
| Componentes | `src/components/admin/absences/AbsencesAdminList.tsx` (client: tabs de estado + botones) |

**Notas técnicas:**
- RLS: `admin_read_absences` y `admin_update_absence_status` (migración 012)
- El profesor solo puede insertar con `status='pending'` (policy WITH CHECK)

---

### Recursos globales del profesor

**Ruta:** `/teacher/resources`  
**Descripción:** Vista de solo lectura de los recursos globales activos y visibles para el profesor. El RLS filtra automáticamente por rol, escuela y grupo según la configuración de cada recurso.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(teacher)/teacher/resources/page.tsx` |
| Datos | `src/lib/data/global-resources.ts` — `getTeacherResources()` |
| Componentes | `src/components/teacher/resources/ResourcesList.tsx` (server async) |

---

### Recursos globales (admin)

**Ruta:** `/admin/resources`  
**Descripción:** Gestión completa de recursos globales. Permite crear, editar y desactivar recursos configurando visibilidad por rol (todos/profesor/alumno), por escuela o por grupo.

| Capa | Archivos |
|------|---------|
| Página | `src/app/[locale]/(admin)/admin/resources/page.tsx` |
| Datos | `src/lib/data/global-resources.ts` — `getAdminResourcesPage()`, `getSchoolsForSelect()`, `getGroupsForSelect()` |
| Acciones | `src/lib/actions/global-resources.ts` — `createGlobalResource`, `updateGlobalResource`, `toggleGlobalResourceStatus` |
| Componentes | `src/components/admin/resources/ResourcesAdminList.tsx` (client), `ResourceDialog.tsx` (client) |

**Notas técnicas:**
- Columnas `resource_type` y `target_role` añadidas en migración 013 (la tabla original usaba nombres distintos)
- Visibilidad polimórfica: `visible_to_type` ('school'/'group'/null) + `visible_to_id` (UUID)
- Batch lookup para nombres: IDs únicos por tipo → dos queries `.in()` en paralelo → Maps para resolución O(1)
- RLS worker: verifica `target_role` + EXISTS con JOIN `group_assignments → groups` para scope escuela/grupo (migración 013)
