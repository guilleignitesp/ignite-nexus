-- Migration: add 'unknown' and 'excused' to sessions status enum
-- Execute manually in Supabase SQL editor

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'completed', 'suspended', 'holiday', 'cancelled', 'unknown', 'excused'));
