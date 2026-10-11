-- Qiva Reach core schema (Phase 1). 14 tables, row-level security on every one.
create extension if not exists pgcrypto;

-- ===== Tables =====

-- 1. users and profiles (one row per auth user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  goal text check (goal in ('grow_audience','get_leads','build_authority','find_a_job')),
  niche text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. workspace_members
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','editor','client_viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- 4. linkedin_profiles (tokens are encrypted by the server before saving)
create table public.linkedin_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  linkedin_sub text not null unique,
  name text,
  headline text,
  picture_url text,
  access_token_enc text,
  refresh_token_enc text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. voice_profiles
create table public.voice_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  tone text,
  preset text check (preset in ('professional','story_led','contrarian','hinglish_friendly','data_driven')),
  avg_length int,
  emoji_use text check (emoji_use in ('none','light','frequent')),
  banned_phrases text[] not null default '{}',
  signature_phrases text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 6. posts (drafts, scheduled, published, and imported voice samples)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  hook text,
  status text not null default 'draft' check (status in ('imported','draft','scheduled','published','failed')),
  scheduled_at timestamptz,
  linkedin_post_id text,
  created_at timestamptz not null default now()
);
create index on public.posts (workspace_id, status);

-- 7. post_metrics
create table public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  impressions int,
  reactions int,
  comments int,
  captured_at timestamptz not null default now()
);

-- 8. ideas
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  text text not null,
  saved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. circles (browsable by any signed-in user; managed by admins via service role)
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

-- 10. circle_members
create table public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

-- 11. engagement_tasks
create table public.engagement_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  circle_id uuid references public.circles(id) on delete cascade,
  post_url text not null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- 12. ai_usage (written by the server only)
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  cost_usd numeric(10,6) not null default 0,
  created_at timestamptz not null default now()
);

-- 13. subscriptions
create table public.subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','starter','pro','agency')),
  status text not null default 'active',
  provider text,
  provider_ref text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- 14. audit_log (written by the server only)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ===== Helpers =====

create function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members where workspace_id = ws and user_id = auth.uid());
$$;

create function public.can_write(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner','editor'));
$$;

-- New user: create profile, personal workspace, owner membership, free plan.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  insert into profiles (id, full_name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  insert into workspaces (name, owner_id) values (coalesce(new.raw_user_meta_data->>'full_name','My workspace'), new.id)
    returning id into ws;
  insert into workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  insert into subscriptions (workspace_id) values (ws);
  insert into voice_profiles (workspace_id) values (ws);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Row-level security =====

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.linkedin_profiles enable row level security;
alter table public.voice_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_metrics enable row level security;
alter table public.ideas enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.engagement_tasks enable row level security;
alter table public.ai_usage enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_log enable row level security;

-- profiles: own row only
create policy profiles_select on public.profiles for select using (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- workspaces and members: see what you belong to; the owner edits the workspace
create policy workspaces_select on public.workspaces for select using (is_member(id));
create policy workspaces_update on public.workspaces for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy members_select on public.workspace_members for select using (user_id = auth.uid() or is_member(workspace_id));

-- linkedin_profiles: members read; the server (service role) writes. Token columns are hidden from the browser.
create policy linkedin_select on public.linkedin_profiles for select using (is_member(workspace_id));
revoke all on public.linkedin_profiles from anon, authenticated;
grant select (id, workspace_id, user_id, linkedin_sub, name, headline, picture_url, created_at)
  on public.linkedin_profiles to authenticated;

-- voice_profiles, posts, post_metrics, ideas: members read, owners and editors write
create policy voice_select on public.voice_profiles for select using (is_member(workspace_id));
create policy voice_update on public.voice_profiles for update using (can_write(workspace_id)) with check (can_write(workspace_id));

create policy posts_select on public.posts for select using (is_member(workspace_id));
create policy posts_insert on public.posts for insert with check (can_write(workspace_id) and author_id = auth.uid());
create policy posts_update on public.posts for update using (can_write(workspace_id)) with check (can_write(workspace_id));
create policy posts_delete on public.posts for delete using (can_write(workspace_id));

create policy metrics_select on public.post_metrics for select using (is_member(workspace_id));

create policy ideas_select on public.ideas for select using (is_member(workspace_id));
create policy ideas_insert on public.ideas for insert with check (can_write(workspace_id));
create policy ideas_update on public.ideas for update using (can_write(workspace_id)) with check (can_write(workspace_id));
create policy ideas_delete on public.ideas for delete using (can_write(workspace_id));

-- circles: public circles browsable by signed-in users; membership is your own row
create policy circles_select on public.circles for select to authenticated using (not is_private);
create policy circle_members_select on public.circle_members for select using (user_id = auth.uid());
create policy circle_members_insert on public.circle_members for insert with check (user_id = auth.uid());
create policy circle_members_delete on public.circle_members for delete using (user_id = auth.uid());

-- engagement_tasks: own rows
create policy tasks_select on public.engagement_tasks for select using (user_id = auth.uid());
create policy tasks_update on public.engagement_tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ai_usage, subscriptions: members read; only the server writes
create policy usage_select on public.ai_usage for select using (workspace_id is not null and is_member(workspace_id));
create policy subs_select on public.subscriptions for select using (is_member(workspace_id));

-- audit_log: no policies = no access from the browser. Service role only.
