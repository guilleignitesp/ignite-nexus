-- Allow session_id to be null for permanent assignment changes
ALTER TABLE public.dashboard_change_log
  ALTER COLUMN session_id DROP NOT NULL;

-- Add group_id for permanent changes (null for session-level changes)
ALTER TABLE public.dashboard_change_log
  ADD COLUMN IF NOT EXISTS group_id uuid references public.groups(id);
