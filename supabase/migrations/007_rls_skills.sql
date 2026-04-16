-- ============================================================
-- AD7b Habilidades y ramas STEAM – RLS
-- ============================================================

-- Reemplazamos las políticas temporales de lectura autenticada
-- por acceso público (necesario para unstable_cache con cliente anon)
drop policy if exists "authenticated_read_all" on public.branches;
drop policy if exists "authenticated_read_all" on public.skills;

-- ─── branches ────────────────────────────────────────────────
create policy "public_read" on public.branches
  for select using (true);

create policy "skills_write" on public.branches
  for all
  using (public.can_manage('skills'))
  with check (public.can_manage('skills'));

-- ─── skills ──────────────────────────────────────────────────
create policy "public_read" on public.skills
  for select using (true);

create policy "skills_write" on public.skills
  for all
  using (public.can_manage('skills'))
  with check (public.can_manage('skills'));
