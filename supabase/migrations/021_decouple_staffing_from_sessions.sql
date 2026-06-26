ALTER TABLE public.session_teacher_assignments
  ALTER COLUMN session_id DROP NOT NULL,
  ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  ADD COLUMN slot_date date,
  ADD COLUMN start_time_local time,
  ADD COLUMN end_time_local time;

ALTER TABLE public.session_teacher_assignments
  ADD CONSTRAINT sta_needs_session_or_slot CHECK (
    session_id IS NOT NULL OR (
      group_id IS NOT NULL AND
      slot_date IS NOT NULL AND
      start_time_local IS NOT NULL AND
      end_time_local IS NOT NULL
    )
  );

CREATE INDEX idx_sta_slot ON public.session_teacher_assignments
  (group_id, slot_date) WHERE group_id IS NOT NULL AND is_active = true;

CREATE INDEX idx_sta_worker_date ON public.session_teacher_assignments
  (worker_id, slot_date) WHERE is_active = true;
