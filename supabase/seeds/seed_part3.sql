-- ============================================================
-- IGNITE NEXUS — Seed real (parte 3/4)
-- skills · projects · resources · skills · project_map
-- plannings · planning_project_log · sessions
-- ============================================================

-- ─── 10. Habilidades (una por rama) ──────────────────────────
-- IDs: 00000000-0000-0000-0007-000000000001..006
insert into public.skills (id, branch_id, name_es, name_en, name_ca, base_xp, is_active) values
  ('00000000-0000-0000-0007-000000000001',(select id from public.branches where code='science'),
    'Pensamiento Científico','Scientific Thinking','Pensament Científic',150,true),
  ('00000000-0000-0000-0007-000000000002',(select id from public.branches where code='technology'),
    'Pensamiento Computacional','Computational Thinking','Pensament Computacional',150,true),
  ('00000000-0000-0000-0007-000000000003',(select id from public.branches where code='engineering'),
    'Diseño de Soluciones','Solution Design','Disseny de Solucions',150,true),
  ('00000000-0000-0000-0007-000000000004',(select id from public.branches where code='art'),
    'Creatividad Visual','Visual Creativity','Creativitat Visual',100,true),
  ('00000000-0000-0000-0007-000000000005',(select id from public.branches where code='mathematics'),
    'Razonamiento Lógico','Logical Reasoning','Raonament Lògic',150,true),
  ('00000000-0000-0000-0007-000000000006',(select id from public.branches where code='transversal'),
    'Trabajo en Equipo','Teamwork','Treball en Equip',100,true);

-- ─── 11. Proyectos ───────────────────────────────────────────
-- IDs: 00000000-0000-0000-0006-000000000001..005
insert into public.projects (id, name, material_type, recommended_hours, description, is_active) values
  ('00000000-0000-0000-0006-000000000001','Robot Seguidor de Línea','hardware', 4.0,'Construye un robot autónomo que sigue líneas con sensores infrarrojos y Arduino.',true),
  ('00000000-0000-0000-0006-000000000002','Puente de Espaguetis',  'materials',3.0,'Diseña y construye el puente más resistente posible con espaguetis y marshmallows.',true),
  ('00000000-0000-0000-0006-000000000003','Criptografía Básica',   'digital',  2.0,'Aprende y aplica técnicas clásicas de cifrado: César, Vigenère y escítala.',true),
  ('00000000-0000-0000-0006-000000000004','Arte Generativo',       'digital',  3.0,'Crea arte visual con código usando algoritmos generativos con p5.js.',true),
  ('00000000-0000-0000-0006-000000000005','Ecosistema en Botella', 'biology',  4.0,'Crea un ecosistema autosuficiente terrestre y acuático dentro de una botella.',true);

-- ─── 12. Recursos de proyectos ───────────────────────────────
insert into public.project_resources (id, project_id, title, url, type) values
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000001','Guía Arduino Robot',        'https://example.com/robot-guide',  'guide'),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000001','Slides Sesión 1 — Robot',   'https://example.com/robot-slides', 'presentation'),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000002','Instrucciones Puente',       'https://example.com/bridge-guide', 'guide'),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000003','Taller de Criptografía',     'https://example.com/crypto-guide', 'guide'),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000004','Intro a p5.js',              'https://example.com/p5js-slides',  'presentation'),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000005','Guía Ecosistema en Botella', 'https://example.com/eco-guide',    'guide');

-- ─── 13. Habilidades por proyecto ────────────────────────────
insert into public.project_skills (id, project_id, skill_id, base_xp, difficulty_grade) values
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000001','00000000-0000-0000-0007-000000000002',200,3),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000001','00000000-0000-0000-0007-000000000003',150,3),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000002','00000000-0000-0000-0007-000000000003',150,2),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000002','00000000-0000-0000-0007-000000000005',100,2),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000003','00000000-0000-0000-0007-000000000005',200,3),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000003','00000000-0000-0000-0007-000000000006',100,2),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000004','00000000-0000-0000-0007-000000000004',150,2),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000004','00000000-0000-0000-0007-000000000002',100,2),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000005','00000000-0000-0000-0007-000000000001',200,2),
  (gen_random_uuid(),'00000000-0000-0000-0006-000000000005','00000000-0000-0000-0007-000000000006',100,1);

-- ─── 14. Mapa de proyectos ───────────────────────────────────
insert into public.project_maps (id, name, description, is_active) values
  ('00000000-0000-0000-0008-000000000001','Ruta STEAM Básica','Itinerario introductorio a las 5 disciplinas STEAM',true);

insert into public.project_map_nodes (id, map_id, project_id) values
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000001'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000002'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000003'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000004'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000005');

insert into public.project_map_edges (id, map_id, from_project_id, to_project_id) values
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0006-000000000002'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000002','00000000-0000-0000-0006-000000000003'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000003','00000000-0000-0000-0006-000000000004'),
  (gen_random_uuid(),'00000000-0000-0000-0008-000000000001','00000000-0000-0000-0006-000000000004','00000000-0000-0000-0006-000000000005');

-- ─── 15. Planificaciones (16 — una por grupo, escuelas 01-05) ─
-- IDs: 00000000-0000-0000-0009-000000000001..016
insert into public.plannings (id, group_id, project_map_id, is_active) values
  ('00000000-0000-0000-0009-000000000001','00000000-0000-0000-0003-000000000001','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000002','00000000-0000-0000-0003-000000000002','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000003','00000000-0000-0000-0003-000000000003','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000004','00000000-0000-0000-0003-000000000004','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000005','00000000-0000-0000-0003-000000000005','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000006','00000000-0000-0000-0003-000000000006','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000007','00000000-0000-0000-0003-000000000007','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000008','00000000-0000-0000-0003-000000000008','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000009','00000000-0000-0000-0003-000000000009','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000010','00000000-0000-0000-0003-000000000010','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000011','00000000-0000-0000-0003-000000000011','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000012','00000000-0000-0000-0003-000000000012','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000013','00000000-0000-0000-0003-000000000013','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000014','00000000-0000-0000-0003-000000000014','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000015','00000000-0000-0000-0003-000000000015','00000000-0000-0000-0008-000000000001',true),
  ('00000000-0000-0000-0009-000000000016','00000000-0000-0000-0003-000000000016','00000000-0000-0000-0008-000000000001',true);

-- ─── 16. Registro de proyectos en planificaciones ────────────
-- Proyecto activo por planning (asignado al inicio de curso)
insert into public.planning_project_log (id, planning_id, project_id, assigned_by, assigned_at, status) values
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000001','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:00:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000002','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:02:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000003','00000000-0000-0000-0006-000000000004','00000000-0000-0000-0004-000000000001','2025-09-15 10:04:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000004','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:06:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000005','00000000-0000-0000-0006-000000000004','00000000-0000-0000-0004-000000000001','2025-09-15 10:08:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000006','00000000-0000-0000-0006-000000000005','00000000-0000-0000-0004-000000000001','2025-09-15 10:10:00+02','pending'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000007','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:12:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000008','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:14:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000009','00000000-0000-0000-0006-000000000002','00000000-0000-0000-0004-000000000001','2025-09-15 10:16:00+02','pending'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000010','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:18:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000011','00000000-0000-0000-0006-000000000003','00000000-0000-0000-0004-000000000001','2025-09-15 10:20:00+02','validated'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000012','00000000-0000-0000-0006-000000000005','00000000-0000-0000-0004-000000000001','2025-09-15 10:22:00+02','pending'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000013','00000000-0000-0000-0006-000000000004','00000000-0000-0000-0004-000000000001','2025-09-15 10:24:00+02','pending'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000014','00000000-0000-0000-0006-000000000005','00000000-0000-0000-0004-000000000001','2025-09-15 10:26:00+02','pending'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000015','00000000-0000-0000-0006-000000000002','00000000-0000-0000-0004-000000000001','2025-09-15 10:28:00+02','pending'),
  (gen_random_uuid(),'00000000-0000-0000-0009-000000000016','00000000-0000-0000-0006-000000000001','00000000-0000-0000-0004-000000000001','2025-09-15 10:30:00+02','validated');

-- ─── 17. Sesiones (48) ───────────────────────────────────────
-- Hoy = 2026-04-21 (lunes). Últimas 3 semanas:
--   Semana 1: 2026-03-31 (lun) — 2026-04-06 (dom)
--   Semana 2: 2026-04-07 (lun) — 2026-04-13 (dom)
--   Semana 3: 2026-04-14 (lun) — 2026-04-20 (dom)
-- S001-S032 (sem1+2): completed, is_consolidated=true
-- S033-S045 (sem3 lun-mié): completed, is_consolidated=false
-- S046-S048 (sem3 jue 04-17): pending (no registradas aún)
--
-- IDs: 00000000-0000-0000-0010-000000000001..048
-- Columnas: id, planning_id, project_id, session_date, start_time, end_time,
--           status, traffic_light, teacher_comment, is_consolidated

-- ── Semana 1 — Lunes 2026-03-31 ──────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000001','00000000-0000-0000-0009-000000000001','00000000-0000-0000-0006-000000000001','2026-03-31','15:45','17:30','completed','green', 'Primer contacto con Arduino. Todos motivados.',true),
('00000000-0000-0000-0010-000000000002','00000000-0000-0000-0009-000000000002','00000000-0000-0000-0006-000000000001','2026-03-31','15:45','17:30','completed','green', 'Ensamblaje del chasis completado sin incidencias.',true),
('00000000-0000-0000-0010-000000000003','00000000-0000-0000-0009-000000000003','00000000-0000-0000-0006-000000000004','2026-03-31','15:45','17:30','completed','green', 'Introducción a p5.js. Buen nivel del grupo.',true),
('00000000-0000-0000-0010-000000000004','00000000-0000-0000-0009-000000000014','00000000-0000-0000-0006-000000000005','2026-03-31','16:00','17:00','completed','green', 'Presentación del ecosistema. Muchas preguntas, buena señal.',true);

-- ── Semana 1 — Martes 2026-04-01 ─────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000005','00000000-0000-0000-0009-000000000005','00000000-0000-0000-0006-000000000004','2026-04-01','15:45','17:30','completed','green', 'Primeras creaciones con código generativo. Excelente creatividad.',true),
('00000000-0000-0000-0010-000000000006','00000000-0000-0000-0009-000000000010','00000000-0000-0000-0006-000000000001','2026-04-01','16:00','17:00','completed','green', 'Sensores IR calibrados. Robot avanza recto.',true),
('00000000-0000-0000-0010-000000000007','00000000-0000-0000-0009-000000000011','00000000-0000-0000-0006-000000000003','2026-04-01','16:00','17:00','completed','yellow','El cifrado César entendido; Vigenère pendiente.',true),
('00000000-0000-0000-0010-000000000008','00000000-0000-0000-0009-000000000012','00000000-0000-0000-0006-000000000005','2026-04-01','16:30','17:30','completed','green', 'Montaje del ecosistema iniciado. Gran trabajo.',true);

-- ── Semana 1 — Miércoles 2026-04-02 ──────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000009','00000000-0000-0000-0009-000000000006','00000000-0000-0000-0006-000000000005','2026-04-02','15:30','17:00','completed','green', 'Ecosistema en marcha. Alumnos muy implicados.',true),
('00000000-0000-0000-0010-000000000010','00000000-0000-0000-0009-000000000007','00000000-0000-0000-0006-000000000001','2026-04-02','15:30','17:00','completed','green', 'Robot sigue la línea al 70%. Ajustes pendientes.',true),
('00000000-0000-0000-0010-000000000011','00000000-0000-0000-0009-000000000008','00000000-0000-0000-0006-000000000001','2026-04-02','12:30','14:00','completed','yellow','Falló el sensor de uno de los robots. Solucionado.',true),
('00000000-0000-0000-0010-000000000012','00000000-0000-0000-0009-000000000009','00000000-0000-0000-0006-000000000002','2026-04-02','14:00','15:30','completed','green', 'Diseño del puente finalizado. Listo para construir.',true),
('00000000-0000-0000-0010-000000000013','00000000-0000-0000-0009-000000000015','00000000-0000-0000-0006-000000000002','2026-04-02','15:00','16:15','completed','green', 'Buen ritmo. Estructura del puente a mitad.',true);

-- ── Semana 1 — Jueves 2026-04-03 ─────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000014','00000000-0000-0000-0009-000000000004','00000000-0000-0000-0006-000000000001','2026-04-03','15:45','17:30','completed','green', 'Robot finalizado y testado. Grupo muy sólido.',true),
('00000000-0000-0000-0010-000000000015','00000000-0000-0000-0009-000000000013','00000000-0000-0000-0006-000000000004','2026-04-03','16:30','17:30','completed','green', 'Arte generativo: paletas de color muy originales.',true),
('00000000-0000-0000-0010-000000000016','00000000-0000-0000-0009-000000000016','00000000-0000-0000-0006-000000000001','2026-04-03','16:00','17:15','completed','yellow','Robot construido pero calibración pendiente.',true);

-- ── Semana 2 — Lunes 2026-04-07 ──────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000017','00000000-0000-0000-0009-000000000001','00000000-0000-0000-0006-000000000001','2026-04-07','15:45','17:30','completed','green', 'Robot sigue línea perfectamente. Presentación final.',true),
('00000000-0000-0000-0010-000000000018','00000000-0000-0000-0009-000000000002','00000000-0000-0000-0006-000000000001','2026-04-07','15:45','17:30','completed','yellow','Un alumno ausente. El resto completó el reto.',true),
('00000000-0000-0000-0010-000000000019','00000000-0000-0000-0009-000000000003','00000000-0000-0000-0006-000000000004','2026-04-07','15:45','17:30','completed','green', 'Generadores de fractales. Resultados espectaculares.',true),
('00000000-0000-0000-0010-000000000020','00000000-0000-0000-0009-000000000014','00000000-0000-0000-0006-000000000005','2026-04-07','16:00','17:00','completed','green', 'Ecosistema estabilizado. Plantas creciendo bien.',true);

-- ── Semana 2 — Martes 2026-04-08 ─────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000021','00000000-0000-0000-0009-000000000005','00000000-0000-0000-0006-000000000004','2026-04-08','15:45','17:30','completed','yellow','Ritmo algo bajo hoy. Motivación variable.',true),
('00000000-0000-0000-0010-000000000022','00000000-0000-0000-0009-000000000010','00000000-0000-0000-0006-000000000001','2026-04-08','16:00','17:00','completed','green', 'Robot terminado. Prueba de velocidad superada.',true),
('00000000-0000-0000-0010-000000000023','00000000-0000-0000-0009-000000000011','00000000-0000-0000-0006-000000000003','2026-04-08','16:00','17:00','completed','green', 'Vigenère dominado. Avanzamos a escítala.',true),
('00000000-0000-0000-0010-000000000024','00000000-0000-0000-0009-000000000012','00000000-0000-0000-0006-000000000005','2026-04-08','16:30','17:30','completed','orange','Incidencia: botella del ecosistema rota. Reparada.',true);

-- ── Semana 2 — Miércoles 2026-04-09 ──────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000025','00000000-0000-0000-0009-000000000006','00000000-0000-0000-0006-000000000005','2026-04-09','15:30','17:00','completed','green', 'Observación del ecosistema y registro de datos.',true),
('00000000-0000-0000-0010-000000000026','00000000-0000-0000-0009-000000000007','00000000-0000-0000-0006-000000000001','2026-04-09','15:30','17:00','completed','yellow','Robot pierde la línea en curvas. Ajuste de PID.',true),
('00000000-0000-0000-0010-000000000027','00000000-0000-0000-0009-000000000008','00000000-0000-0000-0006-000000000001','2026-04-09','12:30','14:00','completed','green', 'Todos los robots siguen la línea. Gran sesión.',true),
('00000000-0000-0000-0010-000000000028','00000000-0000-0000-0009-000000000009','00000000-0000-0000-0006-000000000002','2026-04-09','14:00','15:30','completed','green', 'Puente aguanta 450g. Por encima del objetivo.',true),
('00000000-0000-0000-0010-000000000029','00000000-0000-0000-0009-000000000015','00000000-0000-0000-0006-000000000002','2026-04-09','15:00','16:15','completed','yellow','Puente resistió 300g. Refuerzo del diseño.',true);

-- ── Semana 2 — Jueves 2026-04-10 ─────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000030','00000000-0000-0000-0009-000000000004','00000000-0000-0000-0006-000000000001','2026-04-10','15:45','17:30','completed','green', 'Competición interna de robots. Ganó el equipo azul.',true),
('00000000-0000-0000-0010-000000000031','00000000-0000-0000-0009-000000000013','00000000-0000-0000-0006-000000000004','2026-04-10','16:30','17:30','completed','green', 'Arte generativo finalizado. Preparamos exposición.',true),
('00000000-0000-0000-0010-000000000032','00000000-0000-0000-0009-000000000016','00000000-0000-0000-0006-000000000001','2026-04-10','16:00','17:15','completed','green', 'Robot calibrado y funcionando a pleno rendimiento.',true);

-- ── Semana 3 — Lunes 2026-04-14 ──────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000033','00000000-0000-0000-0009-000000000001','00000000-0000-0000-0006-000000000002','2026-04-14','15:45','17:30','completed','yellow','Inicio Puente de Espaguetis. Diseños muy diversos.',false),
('00000000-0000-0000-0010-000000000034','00000000-0000-0000-0009-000000000002','00000000-0000-0000-0006-000000000002','2026-04-14','15:45','17:30','completed','green', 'Diseño del puente completado. Construcción la semana que viene.',false),
('00000000-0000-0000-0010-000000000035','00000000-0000-0000-0009-000000000003','00000000-0000-0000-0006-000000000005','2026-04-14','15:45','17:30','completed','green', 'Cambio de proyecto. Ecosistema: gran acogida.',false),
('00000000-0000-0000-0010-000000000036','00000000-0000-0000-0009-000000000014','00000000-0000-0000-0006-000000000005','2026-04-14','16:00','17:00','completed','yellow','Dificultades con el equilibrio agua/tierra.',false);

-- ── Semana 3 — Martes 2026-04-15 ─────────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000037','00000000-0000-0000-0009-000000000005','00000000-0000-0000-0006-000000000005','2026-04-15','15:45','17:30','completed','green', 'Arte generativo: animaciones con funciones trigonométricas.',false),
('00000000-0000-0000-0010-000000000038','00000000-0000-0000-0009-000000000010','00000000-0000-0000-0006-000000000002','2026-04-15','16:00','17:00','completed','green', 'Inicio Puente. Alta participación.',false),
('00000000-0000-0000-0010-000000000039','00000000-0000-0000-0009-000000000011','00000000-0000-0000-0006-000000000003','2026-04-15','16:00','17:00','completed','yellow','Escítala: concepto asimilado a medias. Repasaremos.',false),
('00000000-0000-0000-0010-000000000040','00000000-0000-0000-0009-000000000012','00000000-0000-0000-0006-000000000005','2026-04-15','16:30','17:30','completed','green', 'Ecosistema con fauna añadida. Muy ilusionados.',false);

-- ── Semana 3 — Miércoles 2026-04-16 ──────────────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000041','00000000-0000-0000-0009-000000000006','00000000-0000-0000-0006-000000000005','2026-04-16','15:30','17:00','completed','green', 'Presentación del ecosistema al resto de la clase.',false),
('00000000-0000-0000-0010-000000000042','00000000-0000-0000-0009-000000000007','00000000-0000-0000-0006-000000000002','2026-04-16','15:30','17:00','completed','orange','Incidencia: conflicto entre dos alumnos. Resuelto.',false),
('00000000-0000-0000-0010-000000000043','00000000-0000-0000-0009-000000000008','00000000-0000-0000-0006-000000000002','2026-04-16','12:30','14:00','completed','green', 'Puente aguanta 550g. Récord del grupo.',false),
('00000000-0000-0000-0010-000000000044','00000000-0000-0000-0009-000000000009','00000000-0000-0000-0006-000000000002','2026-04-16','14:00','15:30','completed','yellow','Puente se rompió en la prueba. Rediseño en curso.',false),
('00000000-0000-0000-0010-000000000045','00000000-0000-0000-0009-000000000015','00000000-0000-0000-0006-000000000002','2026-04-16','15:00','16:15','completed','green', 'Segunda versión del puente más resistente.',false);

-- ── Semana 3 — Jueves 2026-04-17 (pendientes) ────────────────
insert into public.sessions (id,planning_id,project_id,session_date,start_time,end_time,status,traffic_light,teacher_comment,is_consolidated) values
('00000000-0000-0000-0010-000000000046','00000000-0000-0000-0009-000000000004','00000000-0000-0000-0006-000000000002','2026-04-17','15:45','17:30','pending',null,null,false),
('00000000-0000-0000-0010-000000000047','00000000-0000-0000-0009-000000000013','00000000-0000-0000-0006-000000000005','2026-04-17','16:30','17:30','pending',null,null,false),
('00000000-0000-0000-0010-000000000048','00000000-0000-0000-0009-000000000016','00000000-0000-0000-0006-000000000002','2026-04-17','16:00','17:15','pending',null,null,false);
