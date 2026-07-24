
ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS other_last_read_at timestamptz;
