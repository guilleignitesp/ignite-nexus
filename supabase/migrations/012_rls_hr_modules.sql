-- ============================================================
-- Bloque 3 – RLS fichajes (timesheets) y ausencias (absences)
-- ============================================================

-- ─── timesheets ───────────────────────────────────────────────

-- El propio trabajador lee sus fichajes
create policy "worker_read_own_timesheets"
  on public.timesheets
  for select
  using (worker_id = public.get_my_worker_id());

-- El propio trabajador registra sus fichajes
create policy "worker_insert_timesheets"
  on public.timesheets
  for insert
  with check (worker_id = public.get_my_worker_id());

-- Admin puede leer todos los fichajes
create policy "admin_read_timesheets"
  on public.timesheets
  for select
  using (public.is_admin());

-- ─── absences ─────────────────────────────────────────────────

-- El propio trabajador ve sus ausencias
create policy "worker_read_own_absences"
  on public.absences
  for select
  using (worker_id = public.get_my_worker_id());

-- El propio trabajador crea sus ausencias (siempre en estado 'pending')
create policy "worker_insert_own_absences"
  on public.absences
  for insert
  with check (
    worker_id = public.get_my_worker_id()
    and status = 'pending'
  );

-- Admin puede leer todas las ausencias
create policy "admin_read_absences"
  on public.absences
  for select
  using (public.is_admin());

-- Admin puede actualizar el estado (aprobar / rechazar)
create policy "admin_update_absence_status"
  on public.absences
  for update
  using (public.is_admin())
  with check (public.is_admin());
