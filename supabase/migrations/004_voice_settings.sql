-- Migration 004: Add voice_speed and voice_pitch columns to profiles
-- Run in Supabase SQL editor before deploying voice-settings-on-profile changes.

alter table public.profiles
  add column if not exists voice_speed numeric not null default 1.0
    check (voice_speed in (0.5, 0.75, 1.0, 1.25, 1.5)),
  add column if not exists voice_pitch numeric not null default 1.0
    check (voice_pitch in (0.7, 1.0, 1.3));
