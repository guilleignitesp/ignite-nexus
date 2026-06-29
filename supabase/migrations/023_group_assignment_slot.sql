-- Allow group_assignments to be scoped to a specific schedule slot.
-- NULL weekday = applies to ALL slots of the group (backward compatible).
ALTER TABLE public.group_assignments
  ADD COLUMN weekday smallint CHECK (weekday >= 1 AND weekday <= 5),
  ADD COLUMN slot_start_time time,
  ADD COLUMN slot_end_time time;
