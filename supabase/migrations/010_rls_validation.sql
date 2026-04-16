-- ============================================================
-- AD9 Validación de asignaciones – RLS
-- ============================================================

-- plannings: los admins (y profesores autenticados) necesitan leer
-- los plannings de grupos para el módulo de validación
create policy "authenticated_read_all" on public.plannings
  for select using (auth.role() = 'authenticated');

-- planning_project_log: lectura autenticada + escritura para validación
create policy "authenticated_read_all" on public.planning_project_log
  for select using (auth.role() = 'authenticated');

create policy "validation_write" on public.planning_project_log
  for all
  using (public.can_manage('validation'))
  with check (public.can_manage('validation'));

-- sessions: lectura autenticada (escrita gestionada por módulo de sesiones)
create policy "authenticated_read_all" on public.sessions
  for select using (auth.role() = 'authenticated');
