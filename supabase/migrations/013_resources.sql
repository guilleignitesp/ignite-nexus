-- ============================================================
-- Bloque 3 – Recursos globales: nuevas columnas + RLS
-- ============================================================

-- Tipo del recurso (presentación, guía…), nulo = sin clasificar
alter table public.global_resources
  add column if not exists resource_type text;

-- Rol destinatario: null = todos, 'worker' = solo profesores, 'student' = solo alumnos
alter table public.global_resources
  add column if not exists target_role text;

-- visible_to_type ya soporta null / 'school' / 'group'
-- visible_to_id contiene el uuid de la escuela o el grupo

-- ─── Eliminar política provisional ────────────────────────────

drop policy if exists "authenticated_read_all" on public.global_resources;

-- ─── Lectura para trabajadores (profesores) ───────────────────
-- Un profesor ve el recurso si:
--   1. Está activo
--   2. target_role es null o 'worker'
--   3. visible_to_type es null (todos), o coincide su escuela/grupo

create policy "worker_read_visible_resources"
  on public.global_resources
  for select
  using (
    is_active = true
    and (target_role is null or target_role = 'worker')
    and (
      visible_to_type is null
      or (
        visible_to_type = 'school'
        and exists (
          select 1
          from public.group_assignments ga
          join public.groups g on g.id = ga.group_id
          where ga.worker_id = public.get_my_worker_id()
            and ga.end_date is null
            and g.school_id = visible_to_id
        )
      )
      or (
        visible_to_type = 'group'
        and exists (
          select 1
          from public.group_assignments ga
          where ga.worker_id = public.get_my_worker_id()
            and ga.end_date is null
            and ga.group_id = visible_to_id
        )
      )
    )
  );

-- ─── Gestión completa para admin ──────────────────────────────

create policy "admin_manage_resources"
  on public.global_resources
  for all
  using (public.can_manage('resources'))
  with check (public.can_manage('resources'));
