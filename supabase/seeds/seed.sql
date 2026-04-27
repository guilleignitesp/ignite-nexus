-- ============================================================
-- IGNITE NEXUS — Datos de prueba
-- ============================================================
-- Requisitos previos: todas las migraciones aplicadas (001-016).
-- Se puede ejecutar directamente en el SQL Editor de Supabase.
-- UUIDs fijos para permitir referencias cruzadas entre entidades.
--
-- IDs de referencia rápida:
--   school_year : 00000000-0000-0000-0001-000000000001
--   schools     : 00000000-0000-0000-0002-00000000000{1,2}
--   groups      : 00000000-0000-0000-0003-00000000000{1..4}
--   workers     : 00000000-0000-0000-0004-00000000000{1..6}
--   students    : 00000000-0000-0000-0005-00000000000{1..15}
--   projects    : 00000000-0000-0000-0006-00000000000{1..5}
--   skills      : 00000000-0000-0000-0007-00000000000{1..6}
--   project_map : 00000000-0000-0000-0008-000000000001
--   plannings   : 00000000-0000-0000-0009-00000000000{1..4}
--   sessions    : 00000000-0000-0000-0010-00000000000{1..10}
--   attitudes   : 00000000-0000-0000-0011-00000000000{1..5}
--   stock_locs  : 00000000-0000-0000-0012-00000000000{1..3}
--   stock_items : 00000000-0000-0000-0013-00000000000{1..5}
--   abs_reasons : 00000000-0000-0000-0014-00000000000{1,2}
--   global_res  : 00000000-0000-0000-0015-00000000000{1..3}
-- ============================================================

-- ─── 1. Curso escolar ────────────────────────────────────────
insert into public.school_years (id, name, start_date, end_date, is_active) values
  ('00000000-0000-0000-0001-000000000001', 'Curso 2025-2026', '2025-09-01', '2026-06-30', true);

-- ─── 2. Escuelas ─────────────────────────────────────────────
insert into public.schools (id, name, address, is_active) values
  ('00000000-0000-0000-0002-000000000001', 'CEIP Les Corts',    'Carrer de les Corts, 1, Barcelona',  true),
  ('00000000-0000-0000-0002-000000000002', 'CEIP Sant Gervasi', 'Carrer de Mandri, 25, Barcelona',    true);

-- ─── 3. Grupos ───────────────────────────────────────────────
insert into public.groups (id, school_id, school_year_id, name, is_active) values
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', '6è A', true),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', '5è B', true),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', '6è A', true),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', '4t A', true);

-- ─── 4. Horarios de grupo (weekday: 1=Lun … 5=Vie) ───────────
insert into public.group_schedule (id, group_id, weekday, start_time, end_time) values
  (gen_random_uuid(), '00000000-0000-0000-0003-000000000001', 2, '15:00', '16:30'),  -- Grupo 1 → Martes
  (gen_random_uuid(), '00000000-0000-0000-0003-000000000002', 4, '16:00', '17:30'),  -- Grupo 2 → Jueves
  (gen_random_uuid(), '00000000-0000-0000-0003-000000000003', 1, '15:30', '17:00'),  -- Grupo 3 → Lunes
  (gen_random_uuid(), '00000000-0000-0000-0003-000000000004', 3, '15:00', '16:30');  -- Grupo 4 → Miércoles

-- ─── 5. Trabajadores (user_id NULL — vincular manualmente) ───
insert into public.workers (id, user_id, first_name, last_name, status) values
  ('00000000-0000-0000-0004-000000000001', null, 'Ana',    'García',   'active'),
  ('00000000-0000-0000-0004-000000000002', null, 'Jordi',  'Martínez', 'active'),
  ('00000000-0000-0000-0004-000000000003', null, 'María',  'López',    'active'),
  ('00000000-0000-0000-0004-000000000004', null, 'Carlos', 'Puig',     'active'),
  ('00000000-0000-0000-0004-000000000005', null, 'Laura',  'Ferrer',   'active'),
  ('00000000-0000-0000-0004-000000000006', null, 'David',  'Sánchez',  'active');

-- ─── 6. Permisos de administración ───────────────────────────
--   Worker 1 (Ana): superadmin
--   Worker 2 (Jordi): módulos específicos con can_view+can_edit
insert into public.admin_permissions (id, worker_id, module, can_view, can_edit, is_superadmin) values
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000001', 'superadmin', true,  true,  true),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000002', 'schools',    true,  true,  false),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000002', 'teachers',   true,  true,  false),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000002', 'attitudes',  true,  true,  false),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000002', 'timesheet',  true,  false, false),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000002', 'stock',      true,  false, false);

-- ─── 7. Asignaciones de grupo ────────────────────────────────
insert into public.group_assignments (id, worker_id, group_id, start_date, end_date, type, is_active) values
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0003-000000000001', '2025-09-01', null, 'permanent', true),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0003-000000000002', '2025-09-01', null, 'permanent', true),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0003-000000000003', '2025-09-01', null, 'permanent', true),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0003-000000000004', '2025-09-01', null, 'permanent', true);

-- ─── 8. Alumnos ──────────────────────────────────────────────
insert into public.students (id, first_name, last_name, status) values
  ('00000000-0000-0000-0005-000000000001', 'Martina',  'Puigdomènech', 'active'),
  ('00000000-0000-0000-0005-000000000002', 'Pau',      'Roca',         'active'),
  ('00000000-0000-0000-0005-000000000003', 'Júlia',    'Vidal',        'active'),
  ('00000000-0000-0000-0005-000000000004', 'Marc',     'Soler',        'active'),
  ('00000000-0000-0000-0005-000000000005', 'Laia',     'Bosch',        'active'),
  ('00000000-0000-0000-0005-000000000006', 'Arnau',    'Mas',          'active'),
  ('00000000-0000-0000-0005-000000000007', 'Clàudia',  'Serra',        'active'),
  ('00000000-0000-0000-0005-000000000008', 'Biel',     'Prats',        'active'),
  ('00000000-0000-0000-0005-000000000009', 'Noa',      'Font',         'active'),
  ('00000000-0000-0000-0005-000000000010', 'Jan',      'Casas',        'active'),
  ('00000000-0000-0000-0005-000000000011', 'Aina',     'Ferrer',       'active'),
  ('00000000-0000-0000-0005-000000000012', 'Guillem',  'Torrent',      'active'),
  ('00000000-0000-0000-0005-000000000013', 'Ona',      'Bassas',       'active'),
  ('00000000-0000-0000-0005-000000000014', 'Oriol',    'Camps',        'active'),
  ('00000000-0000-0000-0005-000000000015', 'Marta',    'Esteve',       'active');

-- ─── 9. Matrículas ───────────────────────────────────────────
--   Alumnos 01-04 → Grupo 1 (CEIP Les Corts / 6è A)
--   Alumnos 05-08 → Grupo 2 (CEIP Les Corts / 5è B)
--   Alumnos 09-11 → Grupo 3 (CEIP Sant Gervasi / 6è A)
--   Alumnos 12-15 → Grupo 4 (CEIP Sant Gervasi / 4t A)
insert into public.group_enrollments (id, student_id, group_id, is_active) values
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0003-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0003-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0003-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0003-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0003-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0003-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0003-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0003-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000009', '00000000-0000-0000-0003-000000000003', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000010', '00000000-0000-0000-0003-000000000003', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0003-000000000003', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0003-000000000004', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000013', '00000000-0000-0000-0003-000000000004', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000014', '00000000-0000-0000-0003-000000000004', true),
  (gen_random_uuid(), '00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0003-000000000004', true);

-- ─── 10. Habilidades (una por rama) ──────────────────────────
insert into public.skills (id, branch_id, name_es, name_en, name_ca, base_xp, is_active) values
  ('00000000-0000-0000-0007-000000000001',
    (select id from public.branches where code = 'science'),
    'Pensamiento Científico', 'Scientific Thinking', 'Pensament Científic', 150, true),
  ('00000000-0000-0000-0007-000000000002',
    (select id from public.branches where code = 'technology'),
    'Pensamiento Computacional', 'Computational Thinking', 'Pensament Computacional', 150, true),
  ('00000000-0000-0000-0007-000000000003',
    (select id from public.branches where code = 'engineering'),
    'Diseño de Soluciones', 'Solution Design', 'Disseny de Solucions', 150, true),
  ('00000000-0000-0000-0007-000000000004',
    (select id from public.branches where code = 'art'),
    'Creatividad Visual', 'Visual Creativity', 'Creativitat Visual', 100, true),
  ('00000000-0000-0000-0007-000000000005',
    (select id from public.branches where code = 'mathematics'),
    'Razonamiento Lógico', 'Logical Reasoning', 'Raonament Lògic', 150, true),
  ('00000000-0000-0000-0007-000000000006',
    (select id from public.branches where code = 'transversal'),
    'Trabajo en Equipo', 'Teamwork', 'Treball en Equip', 100, true);

-- ─── 11. Proyectos ───────────────────────────────────────────
insert into public.projects (id, name, material_type, recommended_hours, description, is_active) values
  ('00000000-0000-0000-0006-000000000001', 'Robot Seguidor de Línea', 'hardware',  4.0, 'Construye un robot autónomo que sigue líneas usando sensores infrarrojos y una placa Arduino.', true),
  ('00000000-0000-0000-0006-000000000002', 'Puente de Espaguetis',    'materials', 3.0, 'Diseña y construye el puente más resistente posible usando solo espaguetis y marshmallows.',     true),
  ('00000000-0000-0000-0006-000000000003', 'Criptografía Básica',     'digital',   2.0, 'Aprende y aplica técnicas clásicas de cifrado: César, Vigenère y escítala.',                    true),
  ('00000000-0000-0000-0006-000000000004', 'Arte Generativo',         'digital',   3.0, 'Crea arte visual con código usando algoritmos generativos con p5.js.',                          true),
  ('00000000-0000-0000-0006-000000000005', 'Ecosistema en Botella',   'biology',   4.0, 'Crea un ecosistema terrestre y acuático autosuficiente dentro de una botella de plástico.',     true);

-- ─── 12. Recursos de proyectos ───────────────────────────────
insert into public.project_resources (id, project_id, title, url, type) values
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000001', 'Guía Arduino — Robot Seguidor',     'https://example.com/robot-guide',   'guide'),
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000001', 'Slides Sesión 1 — Robot',           'https://example.com/robot-slides',  'presentation'),
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000002', 'Instrucciones Puente de Espaguetis','https://example.com/bridge-guide',  'guide'),
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000003', 'Taller de Criptografía',            'https://example.com/crypto-guide',  'guide'),
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000004', 'Introducción a p5.js',              'https://example.com/p5js-slides',   'presentation'),
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000005', 'Guía Ecosistema en Botella',        'https://example.com/eco-guide',     'guide');

-- ─── 13. Habilidades de proyectos ────────────────────────────
insert into public.project_skills (id, project_id, skill_id, base_xp, difficulty_grade) values
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0007-000000000002', 200, 3),  -- Robot → Computacional
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0007-000000000003', 150, 3),  -- Robot → Ingeniería
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0007-000000000003', 150, 2),  -- Puente → Ingeniería
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0007-000000000005', 100, 2),  -- Puente → Matemáticas
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0007-000000000005', 200, 3),  -- Cripto → Matemáticas
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0007-000000000006', 100, 2),  -- Cripto → Transversal
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0007-000000000004', 150, 2),  -- Arte → Visual
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0007-000000000002', 100, 2),  -- Arte → Computacional
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0007-000000000001', 200, 2),  -- Ecosistema → Ciencia
  (gen_random_uuid(), '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0007-000000000006', 100, 1);  -- Ecosistema → Transversal

-- ─── 14. Mapa de proyectos ───────────────────────────────────
insert into public.project_maps (id, name, description, is_active) values
  ('00000000-0000-0000-0008-000000000001', 'Ruta STEAM Básica', 'Itinerario introductorio que recorre las 5 disciplinas STEAM', true);

-- ─── 15. Nodos del mapa ──────────────────────────────────────
insert into public.project_map_nodes (id, map_id, project_id) values
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000001'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000002'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000003'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000004'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000005');

-- ─── 16. Aristas del mapa (cadena P1→P2→P3→P4→P5) ───────────
insert into public.project_map_edges (id, map_id, from_project_id, to_project_id) values
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0006-000000000002'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0006-000000000003'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0006-000000000004'),
  (gen_random_uuid(), '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0006-000000000005');

-- ─── 17. Planificaciones (una por grupo) ─────────────────────
insert into public.plannings (id, group_id, project_map_id, is_active) values
  ('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0008-000000000001', true),
  ('00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0008-000000000001', true),
  ('00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0008-000000000001', true),
  ('00000000-0000-0000-0009-000000000004', '00000000-0000-0000-0003-000000000004', null,                                    true);

-- ─── 18. Registro de proyectos en planificaciones ────────────
insert into public.planning_project_log (id, planning_id, project_id, assigned_by, assigned_at, status) values
  (gen_random_uuid(), '00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0004-000000000001', '2025-09-15 10:00:00+02', 'validated'),
  (gen_random_uuid(), '00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0004-000000000001', '2025-09-15 10:05:00+02', 'validated'),
  (gen_random_uuid(), '00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0004-000000000001', '2025-09-15 10:10:00+02', 'pending');

-- ─── 19. Sesiones ────────────────────────────────────────────
-- Hoy = 2026-04-17 (viernes). Últimas 3 semanas:
--   Semana 1: 2026-03-30 – 2026-04-05
--   Semana 2: 2026-04-06 – 2026-04-12
--   Semana 3: 2026-04-13 – 2026-04-19
--
-- Grupo 1 (Martes,  Plan 1): S02=2026-03-31, S06=2026-04-07, S09=2026-04-14
-- Grupo 2 (Jueves,  Plan 2): S04=2026-04-02, S07=2026-04-09, S10=2026-04-16 (pendiente)
-- Grupo 3 (Lunes,   Plan 3): S01=2026-03-30, S05=2026-04-06, S08=2026-04-13
-- Grupo 4 (Miérc.,  Plan 4): S03=2026-04-01
insert into public.sessions
  (id, planning_id, project_id, session_date, start_time, end_time,
   status, traffic_light, teacher_comment, is_consolidated)
values
  ('00000000-0000-0000-0010-000000000001',
    '00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0006-000000000003',
    '2026-03-30', '15:30', '17:00', 'completed', 'green',
    'Buena sesión introductoria, todos participaron.', true),

  ('00000000-0000-0000-0010-000000000002',
    '00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0006-000000000001',
    '2026-03-31', '15:00', '16:30', 'completed', 'green',
    'Robot ensamblado. Primer test de sensores exitoso.', true),

  ('00000000-0000-0000-0010-000000000003',
    '00000000-0000-0000-0009-000000000004', '00000000-0000-0000-0006-000000000004',
    '2026-04-01', '15:00', '16:30', 'completed', 'yellow',
    'Algunos alumnos tuvieron dificultades con p5.js. Necesitan más soporte.', true),

  ('00000000-0000-0000-0010-000000000004',
    '00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0006-000000000002',
    '2026-04-02', '16:00', '17:30', 'completed', 'green',
    'Excelente trabajo en equipo. Diseños muy creativos.', true),

  ('00000000-0000-0000-0010-000000000005',
    '00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0006-000000000003',
    '2026-04-06', '15:30', '17:00', 'completed', 'yellow',
    'Avanzamos más lento de lo previsto. Revisaremos ritmo la próxima sesión.', true),

  ('00000000-0000-0000-0010-000000000006',
    '00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0006-000000000001',
    '2026-04-07', '15:00', '16:30', 'completed', 'green',
    'Robot completado y funcionando. Gran logro del grupo.', true),

  ('00000000-0000-0000-0010-000000000007',
    '00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0006-000000000002',
    '2026-04-09', '16:00', '17:30', 'completed', 'orange',
    'Incidencia: un alumno abandonó la sesión antes de tiempo. Puente resistió 200g.', false),

  ('00000000-0000-0000-0010-000000000008',
    '00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0006-000000000003',
    '2026-04-13', '15:30', '17:00', 'completed', 'green',
    'Presentación final del proyecto. Resultados muy buenos.', true),

  ('00000000-0000-0000-0010-000000000009',
    '00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0006-000000000002',
    '2026-04-14', '15:00', '16:30', 'completed', 'yellow',
    'Inicio del proyecto Puente. Fase de diseño completada.', false),

  ('00000000-0000-0000-0010-000000000010',
    '00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0006-000000000003',
    '2026-04-16', '16:00', '17:30', 'pending', null, null, false);

-- ─── 20. Asistencias (solo sesiones completadas) ─────────────
insert into public.session_attendances (id, session_id, student_id, attended) values
  -- S01 · Grupo 3 (alumnos 09-11)
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0005-000000000009', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0005-000000000010', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0005-000000000011', false),
  -- S02 · Grupo 1 (alumnos 01-04)
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0005-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0005-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0005-000000000003', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0005-000000000004', false),
  -- S03 · Grupo 4 (alumnos 12-15)
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0005-000000000012', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0005-000000000013', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0005-000000000014', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0005-000000000015', true),
  -- S04 · Grupo 2 (alumnos 05-08)
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0005-000000000005', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0005-000000000006', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0005-000000000007', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0005-000000000008', true),
  -- S05 · Grupo 3
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000005', '00000000-0000-0000-0005-000000000009', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000005', '00000000-0000-0000-0005-000000000010', false),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000005', '00000000-0000-0000-0005-000000000011', true),
  -- S06 · Grupo 1
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000006', '00000000-0000-0000-0005-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000006', '00000000-0000-0000-0005-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000006', '00000000-0000-0000-0005-000000000003', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000006', '00000000-0000-0000-0005-000000000004', true),
  -- S07 · Grupo 2
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000007', '00000000-0000-0000-0005-000000000005', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000007', '00000000-0000-0000-0005-000000000006', false),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000007', '00000000-0000-0000-0005-000000000007', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000007', '00000000-0000-0000-0005-000000000008', true),
  -- S08 · Grupo 3
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000008', '00000000-0000-0000-0005-000000000009', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000008', '00000000-0000-0000-0005-000000000010', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000008', '00000000-0000-0000-0005-000000000011', true),
  -- S09 · Grupo 1
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000009', '00000000-0000-0000-0005-000000000001', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000009', '00000000-0000-0000-0005-000000000002', true),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000009', '00000000-0000-0000-0005-000000000003', false),
  (gen_random_uuid(), '00000000-0000-0000-0010-000000000009', '00000000-0000-0000-0005-000000000004', true);
  -- S10 está pendiente, sin asistencias

-- ─── 21. Acciones actitudinales ──────────────────────────────
insert into public.attitude_actions (id, name_es, name_en, name_ca, xp_value, is_active) values
  ('00000000-0000-0000-0011-000000000001', 'Participación activa',      'Active Participation',   'Participació activa',       50,  true),
  ('00000000-0000-0000-0011-000000000002', 'Ayuda a compañeros',        'Helps Classmates',       'Ajuda als companys',        30,  true),
  ('00000000-0000-0000-0011-000000000003', 'Entrega a tiempo',          'On-time Delivery',       'Entrega a temps',           20,  true),
  ('00000000-0000-0000-0011-000000000004', 'Comportamiento disruptivo', 'Disruptive Behaviour',   'Comportament disruptiu',   -40,  true),
  ('00000000-0000-0000-0011-000000000005', 'No trae material',          'Missing Materials',      'No porta material',        -15,  true);

-- ─── 22. Ubicaciones de stock ────────────────────────────────
insert into public.stock_locations (id, name, description, is_active) values
  ('00000000-0000-0000-0012-000000000001', 'Armario Principal',    'Armario metálico en la entrada de la sala STEAM',    true),
  ('00000000-0000-0000-0012-000000000002', 'Sala de Tecnología',   'Estantería principal — sala de informática P.Baja',  true),
  ('00000000-0000-0000-0012-000000000003', 'Sala de Ciencias',     'Almacén lateral — sala de ciencias P.Primera',       true);

-- ─── 23. Ítems de stock ──────────────────────────────────────
insert into public.stock_items (id, name, description, quantity, holder_type, holder_id, is_active) values
  ('00000000-0000-0000-0013-000000000001', 'Arduino Mega',    'Placa Arduino Mega 2560 R3',          5,  'location', '00000000-0000-0000-0012-000000000001', true),
  ('00000000-0000-0000-0013-000000000002', 'Kit de Robótica', 'Kit genérico con servos y ruedas',    3,  'location', '00000000-0000-0000-0012-000000000002', true),
  ('00000000-0000-0000-0013-000000000003', 'Multímetro',      'Multímetro digital básico',           8,  'location', '00000000-0000-0000-0012-000000000003', true),
  ('00000000-0000-0000-0013-000000000004', 'Portátil HP',     'HP Pavilion 15 — 8GB RAM, SSD 256GB', 2,  'worker',   '00000000-0000-0000-0004-000000000003', true),
  ('00000000-0000-0000-0013-000000000005', 'Cable USB-C 1m',  'Cable USB-C carga rápida 60W',        20, 'location', '00000000-0000-0000-0012-000000000001', true);

-- ─── 24. Movimientos de stock ────────────────────────────────
-- Colocación inicial de los ítems
insert into public.stock_movements (id, item_id, from_type, from_id, to_type, to_id, moved_by, moved_at) values
  (gen_random_uuid(), '00000000-0000-0000-0013-000000000001',
    null, null, 'location', '00000000-0000-0000-0012-000000000001',
    '00000000-0000-0000-0004-000000000001', '2025-09-10 09:00:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0013-000000000002',
    null, null, 'location', '00000000-0000-0000-0012-000000000002',
    '00000000-0000-0000-0004-000000000001', '2025-09-10 09:05:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0013-000000000003',
    null, null, 'location', '00000000-0000-0000-0012-000000000003',
    '00000000-0000-0000-0004-000000000001', '2025-09-10 09:10:00+02');

-- Portátiles prestados a María López (Worker 3)
insert into public.stock_movements (id, item_id, from_type, from_id, to_type, to_id, moved_by, moved_at) values
  (gen_random_uuid(), '00000000-0000-0000-0013-000000000004',
    'location', '00000000-0000-0000-0012-000000000001',
    'worker',   '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0004-000000000001', '2025-10-05 11:00:00+02');

-- ─── 25. Motivos de ausencia ─────────────────────────────────
insert into public.absence_reasons (id, name_es, name_en, name_ca, auto_approve, is_active) values
  ('00000000-0000-0000-0014-000000000001', 'Enfermedad',         'Illness',         'Malaltia',           false, true),
  ('00000000-0000-0000-0014-000000000002', 'Asuntos personales', 'Personal matters', 'Assumptes personals', false, true);

-- ─── 26. Fichajes (timesheets) ───────────────────────────────
insert into public.timesheets (id, worker_id, type, recorded_at) values
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'in',  '2026-04-14 14:45:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'out', '2026-04-14 16:50:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000004', 'in',  '2026-04-09 15:50:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000004', 'out', '2026-04-09 17:40:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000005', 'in',  '2026-04-13 15:25:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000005', 'out', '2026-04-13 17:05:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'in',  '2026-04-07 14:55:00+02'),
  (gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'out', '2026-04-07 16:35:00+02');

-- ─── 27. Recursos globales ───────────────────────────────────
insert into public.global_resources (id, title, url, visible_to_type, visible_to_id, is_active, resource_type, target_role) values
  ('00000000-0000-0000-0015-000000000001',
    'Guía de inicio STEAM', 'https://example.com/steam-intro',
    null, null, true, 'guide', null),
  ('00000000-0000-0000-0015-000000000002',
    'Manual del Profesor IGNITE', 'https://example.com/teacher-manual',
    null, null, true, 'guide', 'worker'),
  ('00000000-0000-0000-0015-000000000003',
    'Rúbrica de Evaluación', 'https://example.com/rubric',
    null, null, true, 'presentation', 'worker');

-- ============================================================
-- INSTRUCCIONES DE VINCULACIÓN A SUPABASE AUTH
-- ============================================================
-- Para que un worker pueda iniciar sesión, vincula su fila al
-- usuario de Auth correspondiente (crear primero en el Dashboard):
--
--   Supabase Dashboard → Authentication → Users → "Add user"
--
-- Luego ejecuta:
--
--   UPDATE public.workers
--   SET user_id = '<uuid-del-usuario-auth>'
--   WHERE id = '00000000-0000-0000-0004-000000000001';  -- Ana García (superadmin)
--
--   UPDATE public.workers
--   SET user_id = '<uuid-del-usuario-auth>'
--   WHERE id = '00000000-0000-0000-0004-000000000003';  -- María López (prof. Grupo 1)
--
-- IDs de workers de prueba:
--   00000000-0000-0000-0004-000000000001  Ana García      (superadmin)
--   00000000-0000-0000-0004-000000000002  Jordi Martínez  (admin parcial)
--   00000000-0000-0000-0004-000000000003  María López     (profe Grupo 1)
--   00000000-0000-0000-0004-000000000004  Carlos Puig     (profe Grupo 2)
--   00000000-0000-0000-0004-000000000005  Laura Ferrer    (profe Grupo 3)
--   00000000-0000-0000-0004-000000000006  David Sánchez   (profe Grupo 4)
-- ============================================================
