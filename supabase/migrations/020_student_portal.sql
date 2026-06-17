-- Add user_id to students
ALTER TABLE public.students
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_students_user_id ON public.students(user_id);

-- Function to get current student's id (mirrors get_my_worker_id)
CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS: student can read their own data
CREATE POLICY "student_read_own" ON public.students
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- student_xp: student can read own
CREATE POLICY "student_read_own_xp" ON public.student_xp
  FOR SELECT USING (
    student_id = public.get_my_student_id()
    OR public.is_admin()
  );

-- project_evaluations: student can read own
CREATE POLICY "student_read_own_evaluations" ON public.project_evaluations
  FOR SELECT USING (
    student_id = public.get_my_student_id()
    OR public.is_admin()
  );

-- skill_evaluations: student can read own (via evaluation)
CREATE POLICY "student_read_own_skill_evaluations" ON public.skill_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_evaluations pe
      WHERE pe.id = evaluation_id
      AND pe.student_id = public.get_my_student_id()
    )
    OR public.is_admin()
  );

-- attitude_logs: student can read own
CREATE POLICY "student_read_own_attitude_logs" ON public.attitude_logs
  FOR SELECT USING (
    student_id = public.get_my_student_id()
    OR public.is_admin()
  );

-- group_enrollments: student can read own
CREATE POLICY "student_read_own_enrollments" ON public.group_enrollments
  FOR SELECT USING (
    student_id = public.get_my_student_id()
    OR public.is_admin()
  );

-- planning_project_log: student can read entries for their planning
CREATE POLICY "student_read_own_project_log" ON public.planning_project_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.plannings pl
      JOIN public.group_enrollments ge ON ge.group_id = pl.group_id
      WHERE pl.id = planning_id
      AND ge.student_id = public.get_my_student_id()
      AND ge.is_active = true
    )
    OR public.is_admin()
  );

-- sessions: student can read sessions for their groups
CREATE POLICY "student_read_own_sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.plannings pl
      JOIN public.group_enrollments ge ON ge.group_id = pl.group_id
      WHERE pl.id = planning_id
      AND ge.student_id = public.get_my_student_id()
      AND ge.is_active = true
    )
    OR public.is_admin()
  );
