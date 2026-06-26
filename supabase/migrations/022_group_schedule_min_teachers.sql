ALTER TABLE public.group_schedule
  ADD COLUMN min_teachers_required smallint NOT NULL DEFAULT 1
  CHECK (min_teachers_required > 0);
