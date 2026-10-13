-- C2: keep the notes and style a draft was written from, so "Write again" works.
alter table public.posts
  add column notes text,
  add column style text check (style in ('professional','story_led','contrarian','hinglish_friendly','data_driven'));
