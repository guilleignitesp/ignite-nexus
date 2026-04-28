-- ============================================================
-- 018_rls_teacher_students.sql
-- Allow teachers to read students enrolled in their groups.
--
-- Problem: the existing "admin_read_students" policy on public.students
-- uses is_admin(), which blocks non-admin teachers. When getGroupDetail
-- joins group_enrollments → students, RLS silently returns null for
-- each student row, so the filter `e.students !== null` removes them all.
--
-- Fix: add a second SELECT policy that lets any active worker read
-- students who are actively enrolled in a group the worker is assigned to.
-- Uses get_my_worker_id() (defined in 011_rls_sessions.sql) for efficiency.
-- ============================================================

CREATE POLICY "teacher_read_group_students"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_enrollments ge
      JOIN public.group_assignments ga ON ga.group_id = ge.group_id
      WHERE ge.student_id = students.id
        AND ge.is_active  = true
        AND ga.is_active  = true
        AND ga.end_date   IS NULL
        AND ga.worker_id  = public.get_my_worker_id()
    )
  );
