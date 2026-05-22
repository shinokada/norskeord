-- Migration: add contact_messages table
-- Stores support messages from all logged-in users (free + plus).
-- ip_address and user_agent are collected for abuse prevention (GDPR: legitimate interest).

CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  app_version text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for fast per-user lookups (ban/audit)
CREATE INDEX contact_messages_user_id_idx ON public.contact_messages (user_id);
-- Index for burst-pattern detection by IP
CREATE INDEX contact_messages_ip_created_idx ON public.contact_messages (ip_address, created_at);

-- RLS: users cannot read or write directly; only the service role (server) can insert.
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for users — admin access is via service role only.
-- Insert is also handled server-side via service role; no user-facing policy needed.
