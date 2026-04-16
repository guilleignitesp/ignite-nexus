# Base de datos — IGNITE NEXUS

> PostgreSQL gestionado por Supabase. Todas las migraciones están en `supabase/migrations/` numeradas secuencialmente.

---

## Tabla de contenidos

1. [Esquema completo de tablas](#1-esquema-completo-de-tablas)
2. [Diagrama de relaciones](#2-diagrama-de-relaciones)
3. [Funciones SQL](#3-funciones-sql)
4. [Políticas RLS por tabla](#4-políticas-rls-por-tabla)
5. [Decisiones de diseño](#5-decisiones-de-diseño)
6. [Guía para añadir nuevas tablas](#6-guía-para-añadir-nuevas-tablas)

---

## 1. Esquema completo de tablas

### Sección 1: Core (estructura organizativa)

---

#### `school_years`
Cursos escolares. Solo puede haber uno activo a la vez.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador único |
| `name` | text NOT NULL | Nombre del curso, ej: "2025-2026" |
| `start_date` | date NOT NULL | Fecha de inicio |
| `end_date` | date NOT NULL | Fecha de fin |
| `is_active` | boolean NOT NULL default false | Solo uno puede ser true simultáneamente |
| `created_at` | timestamptz NOT NULL default now() | Fecha de creación |

---

#### `schools`
Centros educativos donde opera Ignite.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador único |
| `name` | text NOT NULL | Nombre del centro |
| `address` | text | Dirección postal (opcional) |
| `is_active` | boolean NOT NULL default true | Centros inactivos se ocultan |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `groups`
Grupos de alumnos dentro de un centro. Cada grupo pertenece a un curso escolar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `school_id` | uuid FK → schools.id | Centro al que pertenece |
| `school_year_id` | uuid FK → school_years.id | Curso escolar |
| `name` | text NOT NULL | Nombre del grupo, ej: "Grupo A" |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `group_schedule`
Horario semanal de un grupo. Cada fila es un bloque horario (día + hora).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `group_id` | uuid FK → groups.id ON DELETE CASCADE | Al borrar el grupo, se borran horarios |
| `weekday` | smallint CHECK (1-5) | 1=Lunes, 2=Martes, …, 5=Viernes |
| `start_time` | time NOT NULL | Hora de inicio de la sesión |
| `end_time` | time NOT NULL | Hora de fin |

---

#### `students`
Alumnos del programa. Actualmente sin vinculación a `auth.users` (los alumnos no inician sesión todavía).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `first_name` | text NOT NULL | Nombre |
| `last_name` | text NOT NULL | Apellidos |
| `status` | text CHECK ('active','inactive') default 'active' | Baja activa/inactiva |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `group_enrollments`
Matriculaciones de alumnos en grupos. Una fila = una matrícula (alta o baja).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `student_id` | uuid FK → students.id | Alumno matriculado |
| `group_id` | uuid FK → groups.id | Grupo al que se matricula |
| `enrolled_at` | timestamptz NOT NULL default now() | Fecha de alta |
| `left_at` | timestamptz | Fecha de baja (null = sigue activo) |
| `is_active` | boolean NOT NULL default true | false cuando el alumno causa baja |

**Índice único:** `(student_id, group_id) WHERE is_active = true`  
→ Un alumno no puede estar activo dos veces en el mismo grupo.

---

#### `workers`
Profesores y personal de Ignite. Los que tienen `user_id` pueden iniciar sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `user_id` | uuid FK → auth.users(id) ON DELETE SET NULL | Cuenta de autenticación (opcional) |
| `first_name` | text NOT NULL | — |
| `last_name` | text NOT NULL | — |
| `status` | text CHECK ('active','inactive') default 'active' | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `admin_permissions`
Permisos de administración por módulo para cada worker. Una fila = acceso a un módulo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `worker_id` | uuid FK → workers.id ON DELETE CASCADE | Worker al que se da acceso |
| `module` | text NOT NULL | Nombre del módulo: 'schools', 'teachers', etc. |
| `can_view` | boolean NOT NULL default false | Puede ver el módulo |
| `can_edit` | boolean NOT NULL default false | Puede modificar datos del módulo |
| `is_superadmin` | boolean NOT NULL default false | Flag global: acceso total |

**Índice único:** `(worker_id, module)`  
**Fila centinela de superadmin:** Se crea una fila con `module='superadmin'` e `is_superadmin=true` para marcar a un worker como superadministrador. Las funciones SQL detectan esta fila.

---

#### `group_assignments`
Asignación de profesores a grupos. Permite rastrear histórico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `worker_id` | uuid FK → workers.id | Profesor asignado |
| `group_id` | uuid FK → groups.id | Grupo |
| `start_date` | date NOT NULL | Inicio de la asignación |
| `end_date` | date | Fin (null = asignación activa) |
| `type` | text CHECK ('permanent','substitute') default 'permanent' | Permanente o sustitución |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

### Sección 2: Pedagógico (habilidades, proyectos, XP)

---

#### `branches`
Ramas STEAM. Datos de referencia, inicializados en la migración 001.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `code` | text UNIQUE | Código: 'science', 'technology', 'engineering', 'art', 'mathematics', 'transversal' |
| `name_es` | text NOT NULL | Nombre en español |
| `name_en` | text NOT NULL | Nombre en inglés |
| `name_ca` | text NOT NULL | Nombre en catalán |
| `color` | text NOT NULL default '#000000' | Color hex para visualización |

**Datos iniciales:** 6 ramas — Science (#3B82F6), Technology (#10B981), Engineering (#F59E0B), Art (#EC4899), Mathematics (#8B5CF6), Transversal (#6B7280).

---

#### `skills`
Habilidades evaluables dentro de cada rama.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `branch_id` | uuid FK → branches.id | Rama a la que pertenece |
| `name_es` | text NOT NULL | — |
| `name_en` | text NOT NULL | — |
| `name_ca` | text NOT NULL | — |
| `description` | text | Descripción opcional |
| `base_xp` | integer NOT NULL default 100 CHECK > 0 | XP base que otorga trabajar esta habilidad |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `level_thresholds`
Tabla de umbrales de nivel. Define cuánto XP se necesita para cada nivel.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `scope` | text CHECK ('global','branch','skill') | Ámbito del nivel |
| `level` | integer CHECK > 0 | Número de nivel |
| `xp_required` | integer CHECK >= 0 | XP acumulado necesario |

**Índice único:** `(scope, level)`  
**Datos iniciales:** Niveles 1-10 para global y branch, niveles 1-5 para skill.

---

#### `projects`
Proyectos del catálogo pedagógico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `name` | text NOT NULL | Nombre del proyecto |
| `material_type` | text | Tipo de material necesario |
| `recommended_hours` | numeric(4,1) | Horas estimadas |
| `description` | text | Descripción extendida |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `project_resources`
Recursos digitales asociados a un proyecto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `project_id` | uuid FK → projects.id ON DELETE CASCADE | — |
| `title` | text NOT NULL | Título del recurso |
| `url` | text NOT NULL | Enlace |
| `type` | text CHECK ('presentation','guide') | Tipo de recurso |

---

#### `project_skills`
Relación M:N entre proyectos y habilidades. Define qué habilidades evalúa un proyecto y cuánto XP otorga.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `project_id` | uuid FK → projects.id ON DELETE CASCADE | — |
| `skill_id` | uuid FK → skills.id | — |
| `base_xp` | integer NOT NULL CHECK > 0 | XP base para esta habilidad en este proyecto |
| `difficulty_grade` | smallint CHECK (1-5) | Multiplicador de dificultad |

**Índice único:** `(project_id, skill_id)`

---

#### `project_maps` y `project_map_nodes` y `project_map_edges`
Mapas curriculares que organizan proyectos con dependencias (grafo dirigido).

**`project_maps`**: id, name, description, is_active, created_at  
**`project_map_nodes`**: id, map_id, project_id — `UNIQUE(map_id, project_id)`  
**`project_map_edges`**: id, map_id, from_project_id, to_project_id — `UNIQUE(map_id, from, to)`

---

#### `plannings`
Planificación de proyectos para un grupo en un curso.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `group_id` | uuid FK → groups.id | Grupo al que aplica la planificación |
| `project_map_id` | uuid FK → project_maps.id ON DELETE SET NULL | Mapa curricular usado (opcional) |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `planning_project_log`
Historial de proyectos asignados dentro de una planificación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `planning_id` | uuid FK → plannings.id | — |
| `project_id` | uuid FK → projects.id | — |
| `assigned_by` | uuid FK → workers.id ON DELETE SET NULL | Quién asignó |
| `validated_by` | uuid FK → workers.id ON DELETE SET NULL | Quién validó |
| `assigned_at` | timestamptz NOT NULL default now() | — |
| `validated_at` | timestamptz | — |
| `status` | text CHECK ('pending','validated','modified') default 'pending' | Estado del log |

---

### Sección 3: Sesiones

---

#### `sessions`
Sesiones de clase. Son la unidad mínima de registro pedagógico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `planning_id` | uuid FK → plannings.id | Planificación a la que pertenece |
| `project_id` | uuid FK → projects.id ON DELETE SET NULL | Proyecto trabajado en la sesión |
| `session_date` | date NOT NULL | Fecha de la sesión |
| `start_time` | time NOT NULL | Hora de inicio |
| `end_time` | time NOT NULL | Hora de fin |
| `min_teachers_required` | smallint NOT NULL default 1 CHECK > 0 | Mínimo de profesores necesarios |
| `status` | text CHECK ('pending','completed','suspended','holiday') default 'pending' | Estado |
| `teacher_comment` | text | Comentario del profesor |
| `traffic_light` | text CHECK ('green','yellow','orange','red') | Valoración del profesor |
| `is_consolidated` | boolean NOT NULL default false | Si los datos son definitivos |
| `consolidated_at` | timestamptz | Fecha de consolidación |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `session_attendances`
Registro de asistencia por alumno por sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `session_id` | uuid FK → sessions.id ON DELETE CASCADE | — |
| `student_id` | uuid FK → students.id | — |
| `attended` | boolean NOT NULL default false | Asistió o no |

**Índice único:** `(session_id, student_id)`

---

#### `session_teacher_assignments`
Cambios de profesor en una sesión (sustituciones o ausencias).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `session_id` | uuid FK → sessions.id ON DELETE CASCADE | — |
| `worker_id` | uuid FK → workers.id | Profesor afectado |
| `type` | text CHECK ('substitute','absent') | Tipo de cambio |
| `valid_from` | date NOT NULL | Desde cuándo aplica |
| `valid_until` | date NOT NULL | Hasta cuándo aplica |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `dashboard_change_log`
Auditoría de cambios en sesiones. Almacena estados previo y nuevo en JSONB.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `session_id` | uuid FK → sessions.id | Sesión modificada |
| `worker_id` | uuid FK → workers.id ON DELETE SET NULL | Worker que realizó el cambio |
| `changed_by` | uuid FK → workers.id ON DELETE SET NULL | (reservado para futuro) |
| `change_type` | text NOT NULL | Tipo de cambio: 'status', 'traffic_light', etc. |
| `previous_state` | jsonb | Estado anterior (snapshot) |
| `new_state` | jsonb | Estado nuevo (snapshot) |
| `is_reverted` | boolean NOT NULL default false | Si se revirtió el cambio |
| `changed_at` | timestamptz NOT NULL default now() | — |

---

### Sección 4: Gamificación y XP

---

#### `student_xp`
XP acumulado por alumno por habilidad. Una fila = alumno × habilidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `student_id` | uuid FK → students.id ON DELETE CASCADE | — |
| `skill_id` | uuid FK → skills.id | Habilidad evaluada |
| `academic_xp` | integer NOT NULL default 0 CHECK >= 0 | XP ganado por proyectos |
| `attitude_xp` | integer NOT NULL default 0 CHECK >= 0 | XP ganado por actitud |
| `total_xp` | integer NOT NULL default 0 CHECK >= 0 | Suma de ambos |
| `level` | integer NOT NULL default 1 CHECK > 0 | Nivel actual en esta habilidad |
| `updated_at` | timestamptz NOT NULL default now() | Última actualización |

**Índice único:** `(student_id, skill_id)`

---

#### `project_evaluations`
Evaluación de un proyecto para un alumno específico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `planning_project_log_id` | uuid FK → planning_project_log.id | Log del proyecto en la planificación |
| `student_id` | uuid FK → students.id | Alumno evaluado |
| `project_id` | uuid FK → projects.id | Proyecto evaluado |
| `worker_id` | uuid FK → workers.id ON DELETE SET NULL | Profesor que evaluó |
| `xp_multiplier_pct` | integer NOT NULL default 100 CHECK (20-200) | Multiplicador del XP: 100% = nota estándar |
| `evaluated_at` | timestamptz NOT NULL default now() | Fecha de evaluación |

---

#### `skill_evaluations`
XP otorgado por habilidad dentro de una evaluación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `evaluation_id` | uuid FK → project_evaluations.id ON DELETE CASCADE | Evaluación a la que pertenece |
| `skill_id` | uuid FK → skills.id | Habilidad evaluada |
| `xp_awarded` | integer NOT NULL CHECK >= 0 | XP asignado para esta habilidad |

---

#### `attitude_actions`
Catálogo de acciones actitudinales predefinidas. XP puede ser negativo (penalización).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `name_es` | text NOT NULL | — |
| `name_en` | text NOT NULL | — |
| `name_ca` | text NOT NULL | — |
| `description` | text | Descripción (opcional) |
| `xp_value` | integer NOT NULL | XP que otorga (negativo = penalización) |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `attitude_logs`
Registro de acciones actitudinales aplicadas a alumnos en sesiones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `session_id` | uuid NOT NULL FK → sessions.id ON DELETE CASCADE | Sesión en la que ocurrió |
| `student_id` | uuid FK → students.id | Alumno afectado |
| `worker_id` | uuid FK → workers.id ON DELETE SET NULL | Profesor que la registró |
| `action_id` | uuid FK → attitude_actions.id | Acción del catálogo |
| `xp_awarded` | integer NOT NULL | XP aplicado (copia del valor en el momento) |
| `recorded_at` | timestamptz NOT NULL default now() | — |

---

#### `student_unlockables`
Recompensas desbloqueadas por el alumno (avatares, temas, etc.).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `student_id` | uuid FK → students.id ON DELETE CASCADE | — |
| `unlockable_type` | text NOT NULL | 'avatar', 'theme', 'reward', etc. |
| `unlockable_id` | text NOT NULL | ID del elemento desbloqueado |
| `unlocked_at` | timestamptz NOT NULL default now() | — |

---

### Sección 5: RRHH (profesores)

---

#### `timesheets`
Fichajes (entrada/salida) de los profesores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `worker_id` | uuid FK → workers.id | — |
| `type` | text CHECK ('in','out') | Entrada o salida |
| `recorded_at` | timestamptz NOT NULL default now() | Momento del fichaje |

---

#### `timesheet_reports`
Incidencias reportadas sobre un fichaje.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `timesheet_id` | uuid FK → timesheets.id ON DELETE CASCADE | Fichaje afectado |
| `worker_id` | uuid FK → workers.id | Worker que reporta |
| `description` | text NOT NULL | Descripción del problema |
| `resolved` | boolean NOT NULL default false | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `absence_reasons`
Catálogo de motivos de ausencia predefinidos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `name_es` | text NOT NULL | — |
| `name_en` | text NOT NULL | — |
| `name_ca` | text NOT NULL | — |
| `auto_approve` | boolean NOT NULL default false | Si se aprueba automáticamente |
| `is_active` | boolean NOT NULL default true | — |

---

#### `absences`
Solicitudes de ausencia de los profesores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `worker_id` | uuid FK → workers.id | Worker que solicita |
| `reason_id` | uuid FK → absence_reasons.id | Motivo del catálogo |
| `start_date` | date NOT NULL | Inicio de la ausencia |
| `end_date` | date NOT NULL | Fin |
| `comment` | text | Comentario adicional |
| `file_url` | text | Justificante adjunto (URL en Supabase Storage) |
| `status` | text CHECK ('pending','approved','rejected') default 'pending' | Estado de la solicitud |
| `reviewed_by` | uuid FK → workers.id ON DELETE SET NULL | Admin que revisó |
| `reviewed_at` | timestamptz | Momento de la revisión |
| `created_at` | timestamptz NOT NULL default now() | — |

---

### Sección 6: Inventario

---

#### `stock_locations`
Ubicaciones físicas del almacén.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `name` | text NOT NULL | Nombre de la ubicación, ej: "Almacén Bcn" |
| `description` | text | — |
| `is_active` | boolean NOT NULL default true | — |

---

#### `stock_items`
Elementos del inventario. El titular puede ser una ubicación o un worker.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `name` | text NOT NULL | Nombre del elemento |
| `description` | text | — |
| `quantity` | integer NOT NULL default 1 CHECK > 0 | Cantidad |
| `holder_type` | text CHECK ('location','worker') | Tipo de titular actual |
| `holder_id` | uuid NOT NULL | ID del titular (location o worker) |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `stock_movements`
Historial de movimientos de material entre ubicaciones/workers.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `item_id` | uuid FK → stock_items.id | Elemento movido |
| `from_type` | text CHECK ('location','worker') | Tipo de origen |
| `from_id` | uuid NOT NULL | ID del origen |
| `to_type` | text CHECK ('location','worker') | Tipo de destino |
| `to_id` | uuid NOT NULL | ID del destino |
| `moved_by` | uuid FK → workers.id ON DELETE SET NULL | Worker que realizó el movimiento |
| `moved_at` | timestamptz NOT NULL default now() | — |

---

### Sección 7: Recursos y configuración

---

#### `global_resources`
Recursos compartidos visibles para distintos roles/grupos/escuelas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `title` | text NOT NULL | — |
| `url` | text NOT NULL | — |
| `type` | text | Tipo de recurso |
| `visibility_role` | text | null = todos, o 'worker'/'student' |
| `visibility_group_id` | uuid FK → groups.id ON DELETE SET NULL | null = todos los grupos |
| `visibility_school_id` | uuid FK → schools.id ON DELETE SET NULL | null = todos los centros |
| `is_active` | boolean NOT NULL default true | — |
| `created_at` | timestamptz NOT NULL default now() | — |

---

#### `platform_settings`
Configuración clave-valor de la plataforma.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `key` | text UNIQUE NOT NULL | Clave: 'platform_name', 'platform_logo_url' |
| `value` | text | Valor actual |
| `updated_at` | timestamptz NOT NULL default now() | — |

**Datos iniciales:** `platform_name = 'IGNITE NEXUS'`, `platform_logo_url = null`

---

## 2. Diagrama de relaciones

```
auth.users (Supabase)
    │
    └── workers (user_id → auth.users)
            │
            ├── admin_permissions (worker_id → workers)
            │       └── módulo, can_view, can_edit, is_superadmin
            │
            ├── group_assignments (worker_id → workers)
            │       └── groups (group_id → groups)
            │
            ├── timesheets (worker_id → workers)
            ├── absences (worker_id → workers)
            ├── planning_project_log.assigned_by/validated_by → workers
            ├── session_teacher_assignments (worker_id → workers)
            └── attitude_logs (worker_id → workers)


schools
    └── groups (school_id → schools)
            │
            ├── school_years (school_year_id → school_years)
            ├── group_schedule (group_id → groups) [cascade delete]
            ├── group_enrollments (group_id → groups)
            │       └── students (student_id → students)
            │               │
            │               ├── student_xp (student_id → students) [cascade delete]
            │               │       └── skills (skill_id → skills)
            │               │               └── branches (branch_id → branches)
            │               │
            │               ├── project_evaluations (student_id → students)
            │               │       ├── planning_project_log (planning_project_log_id)
            │               │       ├── projects (project_id → projects)
            │               │       └── skill_evaluations (evaluation_id → project_evaluations) [cascade]
            │               │               └── skills (skill_id → skills)
            │               │
            │               ├── session_attendances (student_id → students)
            │               │       └── sessions (session_id → sessions)
            │               │
            │               ├── attitude_logs (student_id → students)
            │               │       ├── sessions (session_id → sessions)
            │               │       └── attitude_actions (action_id → attitude_actions)
            │               │
            │               └── student_unlockables (student_id → students) [cascade]
            │
            ├── plannings (group_id → groups)
            │       └── planning_project_log (planning_id → plannings)
            │               └── sessions (planning_id → plannings)
            │                       ├── session_attendances [cascade]
            │                       ├── session_teacher_assignments [cascade]
            │                       └── dashboard_change_log
            │
            └── group_assignments (group_id → groups)


projects
    ├── project_resources (project_id) [cascade]
    ├── project_skills (project_id) [cascade]
    │       └── skills
    ├── project_map_nodes → project_maps
    └── project_map_edges → project_maps


stock_locations
    └── stock_items (holder_type='location', holder_id → stock_locations)
            └── stock_movements


platform_settings (tabla independiente, clave-valor)
absence_reasons (catálogo independiente)
level_thresholds (catálogo independiente)
branches → skills (branch_id → branches)
```

---

## 3. Funciones SQL

Todas las funciones son `SECURITY DEFINER` (se ejecutan con los permisos del owner, no del caller) y tienen `SET search_path = public` para evitar ataques de búsqueda de esquema.

---

### `public.is_superadmin()` — migración 002

**Propósito:** Verifica si el usuario actual es superadministrador.

```sql
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_permissions ap
    JOIN workers w ON w.id = ap.worker_id
    WHERE w.user_id = auth.uid()
      AND ap.is_superadmin = true
  );
$$
```

**Uso:** En políticas RLS que requieren acceso total (`platform_settings`, `school_years`).

---

### `public.is_admin()` — migración 004

**Propósito:** Verifica si el usuario tiene cualquier tipo de acceso administrativo.

```sql
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_permissions ap
    JOIN workers w ON w.id = ap.worker_id
    WHERE w.user_id = auth.uid()
      AND (ap.can_view = true OR ap.is_superadmin = true)
  );
$$
```

**Uso:** En políticas SELECT de tablas administrativas (students, student_xp, etc.).

---

### `public.can_manage(p_module text)` — migración 003

**Propósito:** Verifica si el usuario puede modificar un módulo específico (superadmin O tiene can_edit=true para ese módulo).

```sql
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_permissions ap
    JOIN workers w ON w.id = ap.worker_id
    WHERE w.user_id = auth.uid()
      AND (
        ap.is_superadmin = true
        OR (ap.module = p_module AND ap.can_edit = true)
      )
  );
$$
```

**Uso:** En políticas ALL/INSERT/UPDATE/DELETE de tablas gestionables (schools, groups, workers, students, group_enrollments).

---

### `public.search_students_page(...)` — migración 005

**Propósito:** Búsqueda paginada de alumnos con filtro por nombre, escuela o grupo. La complejidad del JOIN hace inviable hacerlo con filtros PostgREST estándar.

```sql
PARAMETERS:
  p_search    text    DEFAULT ''
  p_page      int     DEFAULT 0
  p_page_size int     DEFAULT 20
  p_status    text    DEFAULT ''   -- '' = todos, 'active', 'inactive'

RETURNS TABLE:
  id, first_name, last_name, status, created_at,
  current_group, current_school, total_count

SEGURIDAD: Verifica is_admin() internamente antes de ejecutar.
```

**Lógica:**
1. `DISTINCT ON (s.id)` → un alumno puede estar en múltiples grupos activos, tomamos uno
2. LEFT JOINs para incluir alumnos sin grupo
3. Filtro ILIKE en nombre, apellidos, grupo y escuela simultáneamente
4. `COUNT(*) OVER()` → total sin paginación (window function)
5. LIMIT/OFFSET para paginación

---

### `public.get_enrollment_stats()` — migración 006

**Propósito:** Estadísticas agregadas de altas/bajas en una única llamada (evita N+1 desde JS).

```sql
RETURNS jsonb
SEGURIDAD: Verifica is_admin() internamente.

Retorna:
{
  "total_active": N,          -- COUNT(DISTINCT student_id) WHERE is_active = true
  "recent_enrollments": N,    -- COUNT(*) WHERE enrolled_at >= NOW() - 30 days
  "recent_leaves": N,         -- COUNT(*) WHERE is_active = false AND left_at >= NOW() - 30 days
  "by_school": [
    { "school_id": "...", "school_name": "...", "active_students": N },
    ...
  ]
}
```

El `by_school` usa un subquery correlacionado para contar `COUNT(DISTINCT ge.student_id)` por escuela, lo que da la cifra correcta sin importar cuántos grupos tenga la escuela.

---

## 4. Políticas RLS por tabla

> RLS está habilitado en **todas** las tablas desde la migración 001.  
> Las políticas se añaden en migraciones posteriores por módulo.

### Leyenda de actores

| Actor | Descripción |
|-------|-------------|
| **Anon** | Usuario no autenticado (solo lectura pública) |
| **Auth** | Cualquier usuario autenticado |
| **Admin** | `is_admin()` = true |
| **SuperAdmin** | `is_superadmin()` = true |
| **Module(X)** | `can_manage('X')` = true |

---

### Tablas con acceso público (USING true)

Cualquier petición, con o sin autenticación, puede leer estas tablas. Necesario para `unstable_cache` con cliente público.

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `platform_settings` | Anon | SuperAdmin |
| `school_years` | Anon | SuperAdmin |
| `schools` | Anon | Module(schools) |
| `groups` | Anon | Module(schools) |
| `group_schedule` | Anon | Module(schools) |
| `group_assignments` | Anon | Module(schools) |
| `workers` | Anon | Module(teachers) |

---

### Tablas con acceso autenticado

Requieren sesión de Supabase.

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `group_enrollments` | Auth | Module(enrollments) |
| `branches` | Auth | — (solo seed) |
| `skills` | Auth | — (futuro: Module(skills)) |
| `level_thresholds` | Auth | — (solo seed) |
| `projects` | Auth | — (futuro: Module(projects)) |
| `project_resources` | Auth | — |
| `project_skills` | Auth | — |
| `project_maps` | Auth | — |
| `project_map_nodes` | Auth | — |
| `project_map_edges` | Auth | — |
| `attitude_actions` | Auth | — |
| `absence_reasons` | Auth | — |
| `platform_settings` | Auth | SuperAdmin |
| `global_resources` | Auth (is_active=true) | — |
| `stock_locations` | Auth | — |

---

### Tablas con acceso admin

Solo admins pueden leer. Los managers del módulo correspondiente pueden escribir.

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `admin_permissions` | Admin o propietario de la fila | SuperAdmin |
| `students` | Admin | Module(students) + Module(enrollments) INSERT |
| `student_xp` | Admin | Module(students) |
| `project_evaluations` | Admin | Module(students) |
| `skill_evaluations` | Admin | Module(students) |
| `attitude_logs` | Admin | Module(students) |

---

### Detalle por migración

#### Migración 002 — `platform_settings` y `school_years`
```
platform_settings:
  SELECT → public_read      USING (true)
  ALL    → superadmin_write USING (is_superadmin())

school_years:
  SELECT → public_read      USING (true)
  ALL    → superadmin_write USING (is_superadmin())
```

#### Migración 003 — Escuelas y datos maestros
```
schools, groups, group_schedule, group_assignments:
  SELECT → public_read    USING (true)
  ALL    → schools_write  USING (can_manage('schools'))

workers:
  SELECT → public_read    USING (true)

group_enrollments:
  SELECT → authenticated_read  USING (auth.role() = 'authenticated')
```

#### Migración 004 — Profesores y permisos
```
admin_permissions:
  SELECT → admin_or_own_read  USING (is_admin() OR worker_id = [mi worker_id])
  ALL    → superadmin_write   USING (is_superadmin())

workers:
  ALL    → teachers_write     USING (can_manage('teachers'))
```

#### Migración 005 — Alumnos
```
students:
  SELECT → admin_read_students          USING (is_admin())
  ALL    → students_write               USING (can_manage('students'))
  INSERT → enrollments_insert_students  WITH CHECK (can_manage('enrollments'))

student_xp:
  SELECT → admin_read_student_xp        USING (is_admin())
  ALL    → students_write_student_xp    USING (can_manage('students'))

project_evaluations:
  SELECT → admin_read_project_evaluations  USING (is_admin())
  ALL    → students_write_project_evaluations USING (can_manage('students'))

skill_evaluations:
  SELECT → admin_read_skill_evaluations    USING (is_admin())
  ALL    → students_write_skill_evaluations USING (can_manage('students'))

attitude_logs:
  SELECT → admin_read_attitude_logs        USING (is_admin())
  ALL    → students_write_attitude_logs    USING (can_manage('students'))
```

#### Migración 006 — Altas y bajas
```
group_enrollments:
  ALL    → enrollments_write   USING (can_manage('enrollments'))

students:
  INSERT → enrollments_insert_students  WITH CHECK (can_manage('enrollments'))
```

---

## 5. Decisiones de diseño

### D1: Workers sin auth pueden existir
Un `worker` puede existir en la tabla `workers` sin tener `user_id`. Esto permite crear el perfil del profesor antes de que tenga cuenta en el sistema. La cuenta se vincula cuando Supabase Auth crea el usuario y se actualiza `user_id`.

### D2: Fila centinela para superadmin
En lugar de un campo `is_superadmin` en `workers`, se usa una fila en `admin_permissions` con `module = 'superadmin'` e `is_superadmin = true`. Ventajas:
- La lógica de comprobación es uniforme (siempre se mira `admin_permissions`)
- Facilita la consulta nested desde `workers`: `admin_permissions(module, is_superadmin)`
- La función `is_superadmin()` solo tiene que buscar `is_superadmin = true` en la tabla

### D3: Alumnos sin auth.users
Los alumnos no inician sesión todavía (la app de alumno está planificada para el Bloque 6). Cuando se implemente, se añadirá `user_id` a `students` y se crearán políticas RLS propias para que cada alumno vea solo sus datos.

### D4: `group_enrollments` registra el histórico completo
En lugar de borrar la matrícula cuando un alumno causa baja, se marca `is_active = false` y se registra `left_at`. Esto permite ver el histórico completo de grupos por alumno y calcular estadísticas de altas/bajas a lo largo del tiempo.

### D5: XP almacenado vs calculado
`student_xp` almacena el XP acumulado de forma desnormalizada (en lugar de calcularlo en tiempo real desde `skill_evaluations` y `attitude_logs`). Ventajas:
- Consultas de nivel/XP son O(1) en lugar de O(n evaluaciones)
- Permite actualización incremental (triggers en futuras migraciones)
- El campo `updated_at` permite detectar inconsistencias

### D6: Fechas en `attitude_logs`
`attitude_logs.session_id` es NOT NULL: toda acción actitudinal está vinculada a una sesión. Esto garantiza trazabilidad y permite calcular XP por sesión y fecha.

### D7: `project_evaluations` vinculado a `planning_project_log`
La evaluación está vinculada al log de planificación (no directamente a la sesión) porque el proyecto puede trabajarse en múltiples sesiones. La trazabilidad completa es: evaluación → planning_project_log → planning → group.

### D8: Funciones SQL para búsquedas complejas
Las búsquedas que requieren JOINs profundos (buscar alumnos por escuela/grupo, estadísticas de matriculaciones) se implementan como funciones SQL con `SECURITY DEFINER`. Ventajas:
- Una sola llamada desde el cliente (sin N+1)
- La lógica de seguridad está en la función, no en la capa de aplicación
- PostgREST las expone automáticamente como RPCs: `supabase.rpc('nombre_funcion', params)`

### D9: Políticas RLS en cascada
Los módulos de la aplicación se mapean directamente a nombres de módulo en `admin_permissions`. El nombre del módulo en la tabla debe coincidir con el `key` en el sidebar y con el string pasado a `can_manage()`. Si se añade un módulo nuevo, hay que:
1. Añadirlo al sidebar con el mismo `key`
2. Crear políticas RLS con `can_manage('nombre_modulo')`
3. Documentarlo en este archivo

### D10: `stock_items` usa holder polimórfico
El titular de un elemento de stock puede ser una ubicación (`stock_locations`) o un trabajador (`workers`). En lugar de dos FKs nullable, se usa un patrón polimórfico con `holder_type` + `holder_id`. Esto simplifica el modelo pero requiere que la aplicación gestione la relación correctamente (no hay FK de base de datos que lo garantice).

---

## 6. Guía para añadir nuevas tablas

### Paso 1: Crear la migración SQL

```bash
# Crear el archivo de migración con el siguiente número secuencial
supabase/migrations/007_nueva_funcionalidad.sql
```

### Paso 2: Definir la tabla

```sql
-- En el archivo de migración
CREATE TABLE public.nueva_tabla (
  id          uuid primary key default gen_random_uuid(),
  -- Siempre incluir FK a la tabla principal relacionada
  parent_id   uuid not null references public.tabla_padre(id) on delete cascade,
  -- Campos específicos
  name        text not null,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_at  timestamptz not null default now()
);

-- RLS (siempre habilitado desde el inicio)
-- NOTA: La migración 001 ya habilitó RLS en todas las tablas existentes.
-- Para tablas nuevas, habilitarlo explícitamente:
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;
```

### Paso 3: Decidir el tipo de acceso

**¿Es dato público (catálogo, configuración)?**
```sql
-- public_read: visible sin autenticación (necesario para unstable_cache)
CREATE POLICY "public_read_nueva_tabla" ON public.nueva_tabla
  FOR SELECT USING (true);
```

**¿Es dato administrativo?**
```sql
-- Lectura solo para admins
CREATE POLICY "admin_read_nueva_tabla" ON public.nueva_tabla
  FOR SELECT USING (public.is_admin());

-- Escritura solo para el módulo responsable
CREATE POLICY "modulo_write_nueva_tabla" ON public.nueva_tabla
  FOR ALL USING (public.can_manage('nombre_modulo'));
```

**¿Requiere búsqueda compleja con JOINs?**
```sql
CREATE OR REPLACE FUNCTION public.search_nueva_tabla(p_search text, p_page int, p_page_size int)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Verificar acceso
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN QUERY
  -- Query con JOINs aquí
  SELECT ...
  LIMIT p_page_size OFFSET p_page * p_page_size;
END;
$$;
```

### Paso 4: Crear la capa de datos en TypeScript

```ts
// src/lib/data/nuevo_modulo.ts

import { createClient } from '@/lib/supabase-server'
// Si es dato público y estático:
// import { unstable_cache } from 'next/cache'
// import { createClient } from '@supabase/supabase-js'

export const PAGE_LIMIT = 20  // Si es paginado

// Tipado del raw de Supabase
type RawNuevaTabla = {
  id: string
  name: string
  // ... todos los campos que se selecten
}

// Interface pública
export interface NuevaEntidad {
  id: string
  name: string
}

// Función de datos
export async function getNuevaTablaPage(
  search: string,
  page: number
): Promise<{ items: NuevaEntidad[]; total: number }> {
  const supabase = await createClient()

  const from = page * PAGE_LIMIT
  const to = from + PAGE_LIMIT - 1

  let query = supabase
    .from('nueva_tabla')
    .select('id, name, parent_id, tabla_padre(nombre_campo)', { count: 'exact' })
    .order('name')
    .range(from, to)

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  const items: NuevaEntidad[] = (data as RawNuevaTabla[]).map((r) => ({
    id: r.id,
    name: r.name,
  }))

  return { items, total: count ?? 0 }
}
```

### Paso 5: Crear las Server Actions

```ts
// src/lib/actions/nuevo_modulo.ts
'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('nombre_modulo')) {
    throw new Error('Unauthorized')
  }
}

export async function createNuevaEntidad(name: string): Promise<void> {
  await assertAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('nueva_tabla')
    .insert({ name: name.trim() })
  if (error) throw new Error(error.message)
  updateTag('tag-si-hay-cache')  // Solo si hay datos cacheados que invalidar
}
```

### Paso 6: Crear la página y los componentes

Seguir los patrones descritos en `arquitectura.md`:
- Página = Server Component con `await params`, `requireAdmin()`, `Promise.all`
- Lista = Client Component con URL-driven search + pagination
- Formularios = Client Components con `useTransition` + `router.refresh()`

### Paso 7: Añadir traducciones

```json
// src/messages/en.json (luego es.json y ca.json)
"nuevo_modulo": {
  "pageTitle": "...",
  "pageDescription": "...",
  // todos los keys necesarios
}
```

### Paso 8: Registrar en el sidebar

```ts
// src/components/admin/AdminSidebar.tsx
const operativaItems = [
  // ...items existentes...
  {
    key: 'nombre_modulo',        // debe coincidir con admin_permissions.module
    label: t('nombre_modulo'),   // clave en admin.json
    icon: IconComponent,
    href: '/nombre-ruta',
  },
]
```

### Paso 9: Añadir clave al namespace `admin` de traducciones

```json
// src/messages/en.json
"admin": {
  // ...claves existentes...
  "nombre_modulo": "Module Name"
}
```

### Checklist de verificación

```
□ Migración SQL creada y numerada correctamente
□ RLS habilitado + políticas definidas para SELECT y ALL
□ Funciones SQL con SECURITY DEFINER y is_admin() guard si aplica
□ Capa de datos en src/lib/data/nuevo_modulo.ts
□ Server Actions en src/lib/actions/nuevo_modulo.ts con assertAccess()
□ Página en src/app/[locale]/(admin)/admin/ruta/page.tsx
□ Componentes en src/components/admin/nuevo_modulo/
□ Traducciones en en.json, es.json, ca.json (mismo número de claves)
□ Sidebar actualizado con key correcto
□ npm run build sin errores
□ npx tsc --noEmit sin errores
```
