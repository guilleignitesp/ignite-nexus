-- ============================================================
-- AD8 Mapas de proyectos – RLS + initial_project_id
-- ============================================================

-- Separamos el módulo project_maps del módulo projects.
-- Migration 008 asignó can_manage('projects') a estas tablas;
-- ahora las movemos a can_manage('project_maps').

drop policy if exists "projects_write" on public.project_maps;
drop policy if exists "projects_write" on public.project_map_nodes;
drop policy if exists "projects_write" on public.project_map_edges;

create policy "project_maps_write" on public.project_maps
  for all
  using (public.can_manage('project_maps'))
  with check (public.can_manage('project_maps'));

create policy "project_maps_write" on public.project_map_nodes
  for all
  using (public.can_manage('project_maps'))
  with check (public.can_manage('project_maps'));

create policy "project_maps_write" on public.project_map_edges
  for all
  using (public.can_manage('project_maps'))
  with check (public.can_manage('project_maps'));

-- Proyecto inicial del mapa (primera entrega de un alumno)
alter table public.project_maps
  add column if not exists initial_project_id uuid
  references public.projects(id) on delete set null;
