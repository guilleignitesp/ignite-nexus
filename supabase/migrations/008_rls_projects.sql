-- ============================================================
-- AD7 Banco de proyectos – RLS
-- ============================================================

-- Reemplazamos políticas temporales de lectura autenticada
-- por acceso público (necesario para unstable_cache con cliente anon)
drop policy if exists "authenticated_read_all" on public.projects;
drop policy if exists "authenticated_read_all" on public.project_resources;
drop policy if exists "authenticated_read_all" on public.project_skills;
drop policy if exists "authenticated_read_all" on public.project_maps;
drop policy if exists "authenticated_read_all" on public.project_map_nodes;
drop policy if exists "authenticated_read_all" on public.project_map_edges;

-- ─── projects ────────────────────────────────────────────────
create policy "public_read" on public.projects
  for select using (true);

create policy "projects_write" on public.projects
  for all
  using (public.can_manage('projects'))
  with check (public.can_manage('projects'));

-- ─── project_resources ───────────────────────────────────────
create policy "public_read" on public.project_resources
  for select using (true);

create policy "projects_write" on public.project_resources
  for all
  using (public.can_manage('projects'))
  with check (public.can_manage('projects'));

-- ─── project_skills ──────────────────────────────────────────
create policy "public_read" on public.project_skills
  for select using (true);

create policy "projects_write" on public.project_skills
  for all
  using (public.can_manage('projects'))
  with check (public.can_manage('projects'));

-- ─── project_maps ────────────────────────────────────────────
create policy "public_read" on public.project_maps
  for select using (true);

create policy "projects_write" on public.project_maps
  for all
  using (public.can_manage('projects'))
  with check (public.can_manage('projects'));

-- ─── project_map_nodes ───────────────────────────────────────
create policy "public_read" on public.project_map_nodes
  for select using (true);

create policy "projects_write" on public.project_map_nodes
  for all
  using (public.can_manage('projects'))
  with check (public.can_manage('projects'));

-- ─── project_map_edges ───────────────────────────────────────
create policy "public_read" on public.project_map_edges
  for select using (true);

create policy "projects_write" on public.project_map_edges
  for all
  using (public.can_manage('projects'))
  with check (public.can_manage('projects'));
