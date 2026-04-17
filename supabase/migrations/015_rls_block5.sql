-- ============================================================
-- Bloque 5 — RLS
-- Módulos: attitudes (AD15), timesheet admin (AD14), stock (AD16)
-- ============================================================

-- ─── attitude_actions ────────────────────────────────────────
-- Lectura autenticada ya existe desde migración 001.
-- Añadir escritura para el módulo 'attitudes'.
create policy "attitudes_write"
  on public.attitude_actions for all
  using (public.can_manage('attitudes'))
  with check (public.can_manage('attitudes'));

-- ─── timesheets ──────────────────────────────────────────────
-- Lectura admin ya existe (migración 012).
-- Añadir INSERT / UPDATE / DELETE para gestión admin manual.
create policy "admin_manage_timesheets"
  on public.timesheets for all
  using (public.can_manage('timesheet'))
  with check (public.can_manage('timesheet'));

-- ─── stock_locations ─────────────────────────────────────────
-- Lectura autenticada ya existe desde migración 001.
create policy "stock_write_locations"
  on public.stock_locations for all
  using (public.can_manage('stock'))
  with check (public.can_manage('stock'));

-- ─── stock_items ─────────────────────────────────────────────
-- Lectura autenticada ya existe desde migración 001.
create policy "stock_write_items"
  on public.stock_items for all
  using (public.can_manage('stock'))
  with check (public.can_manage('stock'));

-- ─── stock_movements ─────────────────────────────────────────
-- Sin políticas previas — añadir lectura autenticada y escritura admin.
create policy "stock_read_movements"
  on public.stock_movements for select
  using (auth.role() = 'authenticated');

create policy "stock_write_movements"
  on public.stock_movements for all
  using (public.can_manage('stock'))
  with check (public.can_manage('stock'));
