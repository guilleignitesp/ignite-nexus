-- ============================================================
-- 005_rls_students.sql
-- RLS policies + search function for students module (AD5+AD6)
-- ============================================================

-- Search function: handles name/school/group text search with pagination.
-- SECURITY DEFINER bypasses row-level access for joins.
-- Internal is_admin() check ensures only admins can call it.
CREATE OR REPLACE FUNCTION public.search_students_page(
  p_search    text    DEFAULT '',
  p_page      int     DEFAULT 0,
  p_page_size int     DEFAULT 20,
  p_status    text    DEFAULT ''
)
RETURNS TABLE (
  id             uuid,
  first_name     text,
  last_name      text,
  status         text,
  created_at     timestamptz,
  current_group  text,
  current_school text,
  total_count    bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT DISTINCT ON (s.id)
      s.id,
      s.first_name,
      s.last_name,
      s.status::text,
      s.created_at,
      g.name  AS current_group,
      sc.name AS current_school
    FROM students s
    LEFT JOIN group_enrollments ge ON ge.student_id = s.id AND ge.is_active = true
    LEFT JOIN groups g             ON g.id  = ge.group_id
    LEFT JOIN schools sc           ON sc.id = g.school_id
    WHERE
      (p_search = ''
        OR s.first_name ILIKE '%' || p_search || '%'
        OR s.last_name  ILIKE '%' || p_search || '%'
        OR g.name       ILIKE '%' || p_search || '%'
        OR sc.name      ILIKE '%' || p_search || '%')
      AND (p_status = '' OR s.status::text = p_status)
    ORDER BY s.id
  ),
  counted AS (
    SELECT *, COUNT(*) OVER () AS total_count FROM base
  )
  SELECT * FROM counted
  ORDER BY last_name ASC, first_name ASC
  LIMIT  p_page_size
  OFFSET p_page * p_page_size;
END;
$$;

-- ─── students ────────────────────────────────────────────────
CREATE POLICY "admin_read_students" ON public.students
  FOR SELECT USING (public.is_admin());

CREATE POLICY "students_write" ON public.students
  FOR ALL USING (public.can_manage('students'));

-- ─── student_xp ──────────────────────────────────────────────
CREATE POLICY "admin_read_student_xp" ON public.student_xp
  FOR SELECT USING (public.is_admin());

CREATE POLICY "students_write_student_xp" ON public.student_xp
  FOR ALL USING (public.can_manage('students'));

-- ─── project_evaluations ─────────────────────────────────────
CREATE POLICY "admin_read_project_evaluations" ON public.project_evaluations
  FOR SELECT USING (public.is_admin());

CREATE POLICY "students_write_project_evaluations" ON public.project_evaluations
  FOR ALL USING (public.can_manage('students'));

-- ─── skill_evaluations ───────────────────────────────────────
CREATE POLICY "admin_read_skill_evaluations" ON public.skill_evaluations
  FOR SELECT USING (public.is_admin());

CREATE POLICY "students_write_skill_evaluations" ON public.skill_evaluations
  FOR ALL USING (public.can_manage('students'));

-- ─── attitude_logs ────────────────────────────────────────────
CREATE POLICY "admin_read_attitude_logs" ON public.attitude_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "students_write_attitude_logs" ON public.attitude_logs
  FOR ALL USING (public.can_manage('students'));
