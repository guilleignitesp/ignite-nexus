-- ============================================================
-- AD1 Escuelas y grupos – RLS
-- ============================================================

-- Función auxiliar: devuelve true si el usuario puede gestionar el módulo indicado
create or replace function public.can_manage(p_module text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.workers w
    join public.admin_permissions ap on ap.worker_id = w.id
    where w.user_id = auth.uid()
      and w.status = 'active'
      and (
        ap.is_superadmin = true
        or (ap.module = p_module and ap.can_edit = true)
      )
  )
$$;

-- ─── Eliminar políticas temporales ───────────────────────────
drop policy if exists "authenticated_read_all" on public.schools;
drop policy if exists "authenticated_read_all" on public.groups;
drop policy if exists "authenticated_read_all" on public.group_schedule;

-- ─── schools ─────────────────────────────────────────────────
create policy "public_read" on public.schools
  for select using (true);

create policy "schools_write" on public.schools
  for all
  using (public.can_manage('schools'))
  with check (public.can_manage('schools'));

-- ─── groups ──────────────────────────────────────────────────
create policy "public_read" on public.groups
  for select using (true);

create policy "schools_write" on public.groups
  for all
  using (public.can_manage('schools'))
  with check (public.can_manage('schools'));

-- ─── group_schedule ──────────────────────────────────────────
create policy "public_read" on public.group_schedule
  for select using (true);

create policy "schools_write" on public.group_schedule
  for all
  using (public.can_manage('schools'))
  with check (public.can_manage('schools'));

-- ─── group_assignments ───────────────────────────────────────
create policy "public_read" on public.group_assignments
  for select using (true);

create policy "schools_write" on public.group_assignments
  for all
  using (public.can_manage('schools'))
  with check (public.can_manage('schools'));

-- ─── workers ─────────────────────────────────────────────────
create policy "public_read" on public.workers
  for select using (true);

-- ─── group_enrollments ───────────────────────────────────────
create policy "authenticated_read" on public.group_enrollments
  for select using (auth.role() = 'authenticated');
