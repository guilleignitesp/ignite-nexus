-- ============================================================
-- AD10 Sessions Dashboard – RLS
-- ============================================================

-- ─── session_teacher_assignments ─────────────────────────────
-- Admin reads all
create policy "admin_read_session_teacher_assignments"
  on public.session_teacher_assignments for select
  using (public.is_admin());

-- Dashboard admin writes (add/remove substitutes and absences)
create policy "dashboard_write_session_teacher_assignments"
  on public.session_teacher_assignments for all
  using (public.can_manage('sessions_dashboard'))
  with check (public.can_manage('sessions_dashboard'));

-- ─── group_assignments ───────────────────────────────────────
-- Dashboard admin can also manage permanent assignments
create policy "dashboard_write_group_assignments"
  on public.group_assignments for all
  using (public.can_manage('sessions_dashboard'))
  with check (public.can_manage('sessions_dashboard'));

-- ─── dashboard_change_log ────────────────────────────────────
create policy "admin_read_dashboard_change_log"
  on public.dashboard_change_log for select
  using (public.is_admin());

create policy "dashboard_write_change_log"
  on public.dashboard_change_log for all
  using (public.can_manage('sessions_dashboard'))
  with check (public.can_manage('sessions_dashboard'));
