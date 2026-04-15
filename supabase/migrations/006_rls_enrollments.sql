-- ============================================================
-- 006_rls_enrollments.sql
-- DB function + RLS policies for enrollments module (AD11)
-- ============================================================

-- Stats function: returns aggregate enrollment data in a single call.
-- is_admin() check enforces access control.
CREATE OR REPLACE FUNCTION public.get_enrollment_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'total_active', (
        SELECT COUNT(DISTINCT student_id)
        FROM group_enrollments
        WHERE is_active = true
      ),
      'recent_enrollments', (
        SELECT COUNT(*)
        FROM group_enrollments
        WHERE enrolled_at >= NOW() - INTERVAL '30 days'
      ),
      'recent_leaves', (
        SELECT COUNT(*)
        FROM group_enrollments
        WHERE is_active = false
          AND left_at IS NOT NULL
          AND left_at >= NOW() - INTERVAL '30 days'
      ),
      'by_school', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'school_id', s.id,
            'school_name', s.name,
            'active_students', (
              SELECT COUNT(DISTINCT ge.student_id)
              FROM groups g
              JOIN group_enrollments ge ON ge.group_id = g.id AND ge.is_active = true
              WHERE g.school_id = s.id
            )
          )
          ORDER BY s.name
        ), '[]'::jsonb)
        FROM schools s
        WHERE s.is_active = true
      )
    )
  );
END;
$$;

-- ─── group_enrollments: write for enrollments module ─────────
CREATE POLICY "enrollments_write" ON public.group_enrollments
  FOR ALL USING (public.can_manage('enrollments'));

-- ─── students: enrollments module can create new students ────
-- (SELECT covered by admin_read_students from migration 005)
CREATE POLICY "enrollments_insert_students" ON public.students
  FOR INSERT WITH CHECK (public.can_manage('enrollments'));
