-- ============================================================
-- IGNITE NEXUS — Reset de datos de prueba
-- ============================================================
-- Elimina TODOS los datos en orden FK-seguro y vuelve a insertar
-- los datos de catálogo iniciales (branches, level_thresholds,
-- platform_settings) del mismo modo que en migración 001.
--
-- NO elimina ni modifica tablas, funciones ni políticas.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- ─── Eliminar datos en orden inverso a la cadena de FKs ──────

delete from public.student_unlockables;
delete from public.skill_evaluations;
delete from public.project_evaluations;
delete from public.attitude_logs;
delete from public.student_xp;
delete from public.session_attendances;
delete from public.session_teacher_assignments;
delete from public.dashboard_change_log;
delete from public.sessions;
delete from public.planning_project_log;
delete from public.plannings;
delete from public.group_enrollments;
delete from public.group_assignments;
delete from public.group_schedule;
delete from public.groups;
delete from public.students;
delete from public.absences;
delete from public.timesheet_reports;
delete from public.timesheets;
delete from public.admin_permissions;
delete from public.workers;
delete from public.schools;
delete from public.school_years;
delete from public.project_map_edges;
delete from public.project_map_nodes;
delete from public.project_maps;
delete from public.project_skills;
delete from public.project_resources;
delete from public.projects;
delete from public.skills;
delete from public.level_thresholds;
delete from public.branches;
delete from public.absence_reasons;
delete from public.stock_movements;
delete from public.stock_items;
delete from public.stock_locations;
delete from public.global_resources;
delete from public.platform_settings;

-- ─── Re-insertar datos de catálogo (migración 001) ───────────

-- 6 ramas STEAM
insert into public.branches (code, name_es, name_en, name_ca, color) values
  ('science',      'Ciencia',                    'Science',                  'Ciència',                   '#3B82F6'),
  ('technology',   'Tecnología',                 'Technology',               'Tecnologia',                '#8B5CF6'),
  ('engineering',  'Ingeniería',                 'Engineering',              'Enginyeria',                '#F59E0B'),
  ('art',          'Arte',                       'Art',                      'Art',                       '#EC4899'),
  ('mathematics',  'Matemáticas',                'Mathematics',              'Matemàtiques',              '#10B981'),
  ('transversal',  'Competencias Transversales', 'Transversal Competencies', 'Competències Transversals', '#6B7280');

-- Umbrales de nivel globales y por rama
insert into public.level_thresholds (scope, level, xp_required) values
  ('global', 1,     0),
  ('global', 2,   500),
  ('global', 3,  1500),
  ('global', 4,  3000),
  ('global', 5,  5500),
  ('global', 6,  9000),
  ('global', 7, 14000),
  ('global', 8, 21000),
  ('global', 9, 30000),
  ('global', 10, 42000),
  ('branch', 1,     0),
  ('branch', 2,   200),
  ('branch', 3,   600),
  ('branch', 4,  1200),
  ('branch', 5,  2200),
  ('branch', 6,  3600),
  ('branch', 7,  5500),
  ('branch', 8,  8000),
  ('branch', 9, 11500),
  ('branch', 10, 16000),
  ('skill', 1,    0),
  ('skill', 2,  100),
  ('skill', 3,  300),
  ('skill', 4,  600),
  ('skill', 5, 1000);

-- Configuración inicial de la plataforma
insert into public.platform_settings (key, value) values
  ('platform_name',     'IGNITE NEXUS'),
  ('platform_logo_url', null);
