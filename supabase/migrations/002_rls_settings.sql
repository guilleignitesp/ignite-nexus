-- ============================================================
-- AD17 Configuración general – RLS
-- ============================================================

-- Función auxiliar: devuelve true si el usuario actual es superadmin activo
create or replace function public.is_superadmin()
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
      and ap.is_superadmin = true
  )
$$;

-- ─── platform_settings ───────────────────────────────────────
-- Eliminar la política temporal de Bloque 0
drop policy if exists "authenticated_read_all" on public.platform_settings;

-- Lectura pública (necesario para unstable_cache sin contexto de auth)
create policy "public_read" on public.platform_settings
  for select using (true);

-- Escritura exclusiva para superadmin
create policy "superadmin_write" on public.platform_settings
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ─── school_years ────────────────────────────────────────────
drop policy if exists "authenticated_read_all" on public.school_years;

create policy "public_read" on public.school_years
  for select using (true);

create policy "superadmin_write" on public.school_years
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());
