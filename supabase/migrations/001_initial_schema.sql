-- ============================================================
-- IGNITE NEXUS – Schema inicial
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. CORE
-- ============================================================

create table public.school_years (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.groups (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools(id),
  school_year_id  uuid not null references public.school_years(id),
  name            text not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table public.group_schedule (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  weekday     smallint not null check (weekday between 1 and 5), -- 1=Lunes, 5=Viernes
  start_time  time not null,
  end_time    time not null
);

create table public.students (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now()
);

create table public.group_enrollments (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id),
  group_id     uuid not null references public.groups(id),
  enrolled_at  timestamptz not null default now(),
  left_at      timestamptz,
  is_active    boolean not null default true
);

-- Un alumno no puede estar activo dos veces en el mismo grupo
create unique index group_enrollments_active_unique
  on public.group_enrollments (student_id, group_id)
  where is_active = true;

create table public.workers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now()
);

create table public.admin_permissions (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.workers(id) on delete cascade,
  module        text not null,
  can_view      boolean not null default false,
  can_edit      boolean not null default false,
  is_superadmin boolean not null default false
);

-- Un worker tiene como máximo un registro de permisos por módulo
create unique index admin_permissions_worker_module
  on public.admin_permissions (worker_id, module);

create table public.group_assignments (
  id           uuid primary key default gen_random_uuid(),
  worker_id    uuid not null references public.workers(id),
  group_id     uuid not null references public.groups(id),
  start_date   date not null,
  end_date     date,
  type         text not null default 'permanent' check (type in ('permanent', 'substitute')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 2. PEDAGÓGICO
-- ============================================================

create table public.branches (
  id       uuid primary key default gen_random_uuid(),
  code     text not null unique, -- e.g. 'science', 'technology', 'engineering', 'art', 'mathematics', 'transversal'
  name_es  text not null,
  name_en  text not null,
  name_ca  text not null,
  color    text not null default '#000000' -- hex color
);

create table public.skills (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references public.branches(id),
  name_es     text not null,
  name_en     text not null,
  name_ca     text not null,
  description text,
  base_xp     integer not null default 100 check (base_xp > 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.level_thresholds (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('global', 'branch', 'skill')),
  level       integer not null check (level > 0),
  xp_required integer not null check (xp_required >= 0),
  unique (scope, level)
);

create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  material_type     text,
  recommended_hours numeric(4,1),
  description       text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table public.project_resources (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  url         text not null,
  type        text not null check (type in ('presentation', 'guide'))
);

create table public.project_skills (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  skill_id         uuid not null references public.skills(id),
  base_xp          integer not null check (base_xp > 0),
  difficulty_grade smallint check (difficulty_grade between 1 and 5),
  unique (project_id, skill_id)
);

create table public.project_maps (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.project_map_nodes (
  id         uuid primary key default gen_random_uuid(),
  map_id     uuid not null references public.project_maps(id) on delete cascade,
  project_id uuid not null references public.projects(id),
  unique (map_id, project_id)
);

create table public.project_map_edges (
  id              uuid primary key default gen_random_uuid(),
  map_id          uuid not null references public.project_maps(id) on delete cascade,
  from_project_id uuid not null references public.projects(id),
  to_project_id   uuid not null references public.projects(id),
  check (from_project_id <> to_project_id),
  unique (map_id, from_project_id, to_project_id)
);

create table public.plannings (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups(id),
  project_map_id   uuid references public.project_maps(id) on delete set null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.planning_project_log (
  id            uuid primary key default gen_random_uuid(),
  planning_id   uuid not null references public.plannings(id),
  project_id    uuid not null references public.projects(id),
  assigned_by   uuid references public.workers(id) on delete set null,
  validated_by  uuid references public.workers(id) on delete set null,
  assigned_at   timestamptz not null default now(),
  validated_at  timestamptz,
  status        text not null default 'pending' check (status in ('pending', 'validated', 'modified'))
);

-- ============================================================
-- 3. SESIONES
-- ============================================================

create table public.sessions (
  id                    uuid primary key default gen_random_uuid(),
  planning_id           uuid not null references public.plannings(id),
  project_id            uuid references public.projects(id) on delete set null,
  session_date          date not null,
  start_time            time not null,
  end_time              time not null,
  min_teachers_required smallint not null default 1 check (min_teachers_required > 0),
  status                text not null default 'pending' check (status in ('pending', 'completed', 'suspended', 'holiday')),
  teacher_comment       text,
  traffic_light         text check (traffic_light in ('green', 'yellow', 'orange', 'red')),
  is_consolidated       boolean not null default false,
  consolidated_at       timestamptz,
  created_at            timestamptz not null default now()
);

create table public.session_attendances (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  student_id  uuid not null references public.students(id),
  attended    boolean not null default false,
  unique (session_id, student_id)
);

create table public.session_teacher_assignments (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  worker_id   uuid not null references public.workers(id),
  type        text not null check (type in ('substitute', 'absent')),
  valid_from  date not null,
  valid_until date not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.dashboard_change_log (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions(id),
  worker_id      uuid references public.workers(id) on delete set null,
  changed_by     uuid references public.workers(id) on delete set null,
  change_type    text not null,
  previous_state jsonb,
  new_state      jsonb,
  is_reverted    boolean not null default false,
  changed_at     timestamptz not null default now()
);

-- ============================================================
-- 4. GAMIFICACIÓN Y XP
-- ============================================================

create table public.student_xp (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  skill_id     uuid not null references public.skills(id),
  academic_xp  integer not null default 0 check (academic_xp >= 0),
  attitude_xp  integer not null default 0 check (attitude_xp >= 0),
  total_xp     integer not null default 0 check (total_xp >= 0),
  level        integer not null default 1 check (level > 0),
  updated_at   timestamptz not null default now(),
  unique (student_id, skill_id)
);

create table public.project_evaluations (
  id                      uuid primary key default gen_random_uuid(),
  planning_project_log_id uuid not null references public.planning_project_log(id),
  student_id              uuid not null references public.students(id),
  project_id              uuid not null references public.projects(id),
  worker_id               uuid references public.workers(id) on delete set null,
  xp_multiplier_pct       integer not null default 100 check (xp_multiplier_pct between 20 and 200),
  evaluated_at            timestamptz not null default now()
);

create table public.skill_evaluations (
  id             uuid primary key default gen_random_uuid(),
  evaluation_id  uuid not null references public.project_evaluations(id) on delete cascade,
  skill_id       uuid not null references public.skills(id),
  xp_awarded     integer not null check (xp_awarded >= 0)
);

create table public.attitude_actions (
  id          uuid primary key default gen_random_uuid(),
  name_es     text not null,
  name_en     text not null,
  name_ca     text not null,
  description text,
  xp_value    integer not null, -- puede ser negativo
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.attitude_logs (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  student_id   uuid not null references public.students(id),
  worker_id    uuid references public.workers(id) on delete set null,
  action_id    uuid not null references public.attitude_actions(id),
  xp_awarded   integer not null,
  recorded_at  timestamptz not null default now()
);

create table public.student_unlockables (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students(id) on delete cascade,
  unlockable_type  text not null, -- 'avatar', 'theme', 'reward', etc.
  unlockable_id    text not null,
  unlocked_at      timestamptz not null default now()
);

-- ============================================================
-- 5. RRHH
-- ============================================================

create table public.timesheets (
  id           uuid primary key default gen_random_uuid(),
  worker_id    uuid not null references public.workers(id),
  type         text not null check (type in ('in', 'out')),
  recorded_at  timestamptz not null default now()
);

create table public.timesheet_reports (
  id           uuid primary key default gen_random_uuid(),
  timesheet_id uuid references public.timesheets(id) on delete set null,
  worker_id    uuid not null references public.workers(id),
  comment      text not null,
  status       text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at   timestamptz not null default now()
);

create table public.absence_reasons (
  id           uuid primary key default gen_random_uuid(),
  name_es      text not null,
  name_en      text not null,
  name_ca      text not null,
  auto_approve boolean not null default false,
  is_active    boolean not null default true
);

create table public.absences (
  id          uuid primary key default gen_random_uuid(),
  worker_id   uuid not null references public.workers(id),
  reason_id   uuid not null references public.absence_reasons(id),
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  file_url    text,
  comment     text,
  created_at  timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ============================================================
-- 6. STOCK
-- ============================================================

create table public.stock_locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text
);

create table public.stock_items (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  current_holder_type text check (current_holder_type in ('location', 'worker')),
  current_holder_id   uuid, -- referencia polimórfica a stock_locations o workers
  status              text not null default 'available',
  created_at          timestamptz not null default now()
);

create table public.stock_movements (
  id               uuid primary key default gen_random_uuid(),
  stock_item_id    uuid not null references public.stock_items(id),
  from_holder_type text check (from_holder_type in ('location', 'worker')),
  from_holder_id   uuid,
  to_holder_type   text check (to_holder_type in ('location', 'worker')),
  to_holder_id     uuid,
  moved_by         uuid references public.workers(id) on delete set null,
  moved_at         timestamptz not null default now(),
  notes            text
);

-- ============================================================
-- 7. RECURSOS Y CONFIGURACIÓN
-- ============================================================

create table public.global_resources (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  url              text not null,
  visible_to_type  text, -- null = todos, 'role', 'group', 'school'
  visible_to_id    uuid, -- referencia según visible_to_type
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.platform_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- 6 ramas STEAM
insert into public.branches (code, name_es, name_en, name_ca, color) values
  ('science',      'Ciencia',                    'Science',                    'Ciència',                  '#3B82F6'),
  ('technology',   'Tecnología',                 'Technology',                 'Tecnologia',               '#8B5CF6'),
  ('engineering',  'Ingeniería',                 'Engineering',                'Enginyeria',               '#F59E0B'),
  ('art',          'Arte',                       'Art',                        'Art',                      '#EC4899'),
  ('mathematics',  'Matemáticas',                'Mathematics',                'Matemàtiques',             '#10B981'),
  ('transversal',  'Competencias Transversales', 'Transversal Competencies',   'Competències Transversals','#6B7280');

-- Umbrales de nivel por defecto (global y rama)
insert into public.level_thresholds (scope, level, xp_required) values
  ('global', 1, 0),
  ('global', 2, 500),
  ('global', 3, 1500),
  ('global', 4, 3000),
  ('global', 5, 5500),
  ('global', 6, 9000),
  ('global', 7, 14000),
  ('global', 8, 21000),
  ('global', 9, 30000),
  ('global', 10, 42000),
  ('branch', 1, 0),
  ('branch', 2, 200),
  ('branch', 3, 600),
  ('branch', 4, 1200),
  ('branch', 5, 2200),
  ('branch', 6, 3600),
  ('branch', 7, 5500),
  ('branch', 8, 8000),
  ('branch', 9, 11500),
  ('branch', 10, 16000),
  ('skill', 1, 0),
  ('skill', 2, 100),
  ('skill', 3, 300),
  ('skill', 4, 600),
  ('skill', 5, 1000);

-- Configuración inicial de la plataforma
insert into public.platform_settings (key, value) values
  ('platform_name', 'IGNITE NEXUS'),
  ('platform_logo_url', null);

-- ============================================================
-- ROW LEVEL SECURITY (base — se ampliará por módulo)
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table public.school_years           enable row level security;
alter table public.schools                enable row level security;
alter table public.groups                 enable row level security;
alter table public.group_schedule         enable row level security;
alter table public.students               enable row level security;
alter table public.group_enrollments      enable row level security;
alter table public.workers                enable row level security;
alter table public.admin_permissions      enable row level security;
alter table public.group_assignments      enable row level security;
alter table public.branches               enable row level security;
alter table public.skills                 enable row level security;
alter table public.level_thresholds       enable row level security;
alter table public.projects               enable row level security;
alter table public.project_resources      enable row level security;
alter table public.project_skills         enable row level security;
alter table public.project_maps           enable row level security;
alter table public.project_map_nodes      enable row level security;
alter table public.project_map_edges      enable row level security;
alter table public.plannings              enable row level security;
alter table public.planning_project_log   enable row level security;
alter table public.sessions               enable row level security;
alter table public.session_attendances    enable row level security;
alter table public.session_teacher_assignments enable row level security;
alter table public.dashboard_change_log   enable row level security;
alter table public.student_xp             enable row level security;
alter table public.project_evaluations    enable row level security;
alter table public.skill_evaluations      enable row level security;
alter table public.attitude_actions       enable row level security;
alter table public.attitude_logs          enable row level security;
alter table public.student_unlockables    enable row level security;
alter table public.timesheets             enable row level security;
alter table public.timesheet_reports      enable row level security;
alter table public.absence_reasons        enable row level security;
alter table public.absences               enable row level security;
alter table public.stock_locations        enable row level security;
alter table public.stock_items            enable row level security;
alter table public.stock_movements        enable row level security;
alter table public.global_resources       enable row level security;
alter table public.platform_settings      enable row level security;

-- Política temporal: solo autenticados pueden leer/escribir (se reemplazará por políticas granulares)
-- En producción se deben definir políticas por rol específicas
create policy "authenticated_read_all" on public.school_years      for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.schools           for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.groups            for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.group_schedule    for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.branches          for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.skills            for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.level_thresholds  for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.projects          for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.project_resources for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.project_skills    for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.project_maps      for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.project_map_nodes for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.project_map_edges for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.attitude_actions  for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.absence_reasons   for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.platform_settings for select using (auth.role() = 'authenticated');
create policy "authenticated_read_all" on public.global_resources  for select using (auth.role() = 'authenticated' and is_active = true);
create policy "authenticated_read_all" on public.stock_locations   for select using (auth.role() = 'authenticated');
