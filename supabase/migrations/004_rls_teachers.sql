-- ============================================================
-- AD3+AD4 Profesores – RLS y función is_admin
-- ============================================================

-- Función auxiliar: devuelve true si el usuario tiene cualquier permiso de admin activo
create or replace function public.is_admin()
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
      and (ap.can_view = true or ap.is_superadmin = true)
  )
$$;

-- ─── admin_permissions ───────────────────────────────────────

-- Lectura: cualquier admin puede ver todos los permisos, o el propio trabajador los suyos
create policy "admin_or_own_read" on public.admin_permissions
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.workers w
      where w.id = admin_permissions.worker_id
        and w.user_id = auth.uid()
    )
  );

-- Escritura: solo superadmin
create policy "superadmin_write" on public.admin_permissions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ─── workers ─────────────────────────────────────────────────

-- Escritura: quien puede gestionar el módulo 'teachers'
create policy "teachers_write" on public.workers
  for all
  using (public.can_manage('teachers'))
  with check (public.can_manage('teachers'));
