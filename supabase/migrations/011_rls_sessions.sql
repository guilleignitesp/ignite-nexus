-- ============================================================
-- P1/P2 Espacio del profesor – RLS y helpers de sesiones
-- ============================================================

-- Función helper: devuelve el worker_id del usuario actual
-- Usada en las políticas RLS para verificar la propiedad del profesor
create or replace function public.get_my_worker_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.workers
  where user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- Índice único para evitar crear dos sesiones el mismo día en la misma planificación
-- Permite el uso de upsert con onConflict en la action createTodaySession
create unique index if not exists sessions_planning_date_unique
  on public.sessions (planning_id, session_date);

-- ============================================================
-- sessions: escritura para el profesor asignado al grupo
-- (La lectura autenticada ya existe desde migración 010)
-- ============================================================
create policy "teacher_session_write" on public.sessions
  for all
  using (
    exists (
      select 1
      from public.plannings p
      join public.group_assignments ga on ga.group_id = p.group_id
      where p.id = sessions.planning_id
        and ga.worker_id = public.get_my_worker_id()
        and ga.end_date is null
    )
  )
  with check (
    exists (
      select 1
      from public.plannings p
      join public.group_assignments ga on ga.group_id = p.group_id
      where p.id = sessions.planning_id
        and ga.worker_id = public.get_my_worker_id()
        and ga.end_date is null
    )
  );

-- ============================================================
-- session_attendances: lectura autenticada + escritura del profesor
-- ============================================================
alter table public.session_attendances enable row level security;

create policy "authenticated_read_session_attendances"
  on public.session_attendances
  for select
  using (auth.role() = 'authenticated');

create policy "teacher_session_attendances_write"
  on public.session_attendances
  for all
  using (
    exists (
      select 1
      from public.sessions s
      join public.plannings p on p.id = s.planning_id
      join public.group_assignments ga on ga.group_id = p.group_id
      where s.id = session_attendances.session_id
        and ga.worker_id = public.get_my_worker_id()
        and ga.end_date is null
    )
  )
  with check (
    exists (
      select 1
      from public.sessions s
      join public.plannings p on p.id = s.planning_id
      join public.group_assignments ga on ga.group_id = p.group_id
      where s.id = session_attendances.session_id
        and ga.worker_id = public.get_my_worker_id()
        and ga.end_date is null
    )
  );

-- ============================================================
-- planning_project_log: INSERT para el profesor del grupo
-- (lectura autenticada ya existe; escritura de admin/validación ya existe)
-- ============================================================
create policy "teacher_planning_log_insert"
  on public.planning_project_log
  for insert
  with check (
    exists (
      select 1
      from public.plannings p
      join public.group_assignments ga on ga.group_id = p.group_id
      where p.id = planning_project_log.planning_id
        and ga.worker_id = public.get_my_worker_id()
        and ga.end_date is null
    )
  );
