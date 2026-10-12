-- B1: remember when the voice was analysed and whether a human edited the tone.
alter table public.voice_profiles
  add column analyzed_at timestamptz,
  add column tone_source text check (tone_source in ('ai','user'));
