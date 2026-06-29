-- No schema changes needed — all existing fields support this feature.
-- group_assignments already has end_date, is_active
-- group_enrollments already has is_active, left_at
-- group_schedule already supports update
-- This migration is a placeholder to document the feature
SELECT 1; -- 025: group deactivate and edit schedule feature
