-- ============================================================
-- AI Prompt Library — Initial Schema
-- ============================================================

-- gen_random_uuid() is built into Postgres 13+, no extension needed

-- ============================================================
-- ENUMS
-- ============================================================
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type prompt_status as enum ('draft', 'published');
create type event_type as enum ('view', 'copy', 'favorite');
create type input_type as enum ('text', 'number', 'select', 'textarea');

-- ============================================================
-- TABLES
-- ============================================================

-- Admin allowlist
create table admins (
  email text primary key
);

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_zh text not null,
  name_en text not null,
  icon text not null default 'folder',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Prompts
create table prompts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text not null,
  title_en text not null default '',
  subtitle text not null default '',
  category_id uuid not null references categories(id) on delete restrict,
  difficulty difficulty_level not null default 'easy',
  estimated_minutes int not null default 10,
  version text not null default 'v1.0',
  prompt_body text not null default '',
  preview_image_url text,
  boss_tip text,
  status prompt_status not null default 'draft',
  times_copied int not null default 0,
  times_viewed int not null default 0,
  rating numeric not null default 0,
  ratings_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prompt variables
create table prompt_variables (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  key text not null,
  label_zh text not null,
  label_en text not null default '',
  default_value text not null default '',
  input_type input_type not null default 'text',
  options jsonb,
  sort_order int not null default 0
);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

-- Prompt-Tag junction
create table prompt_tags (
  prompt_id uuid not null references prompts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (prompt_id, tag_id)
);

-- Related prompts
create table related_prompts (
  prompt_id uuid not null references prompts(id) on delete cascade,
  related_id uuid not null references prompts(id) on delete cascade,
  sort_order int not null default 0,
  primary key (prompt_id, related_id)
);

-- Analytics events
create table prompt_events (
  id bigserial primary key,
  prompt_id uuid not null references prompts(id) on delete cascade,
  event_type event_type not null,
  anon_id text not null default '',
  created_at timestamptz not null default now()
);

-- Prompt ratings (one per anon_id per prompt)
create table prompt_ratings (
  prompt_id uuid not null references prompts(id) on delete cascade,
  anon_id text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  primary key (prompt_id, anon_id)
);

-- ============================================================
-- INDEXES (foreign keys + common queries)
-- ============================================================
create index prompts_category_id_idx on prompts(category_id);
create index prompts_status_idx on prompts(status);
create index prompts_slug_idx on prompts(slug);
create index prompt_variables_prompt_id_idx on prompt_variables(prompt_id);
create index prompt_tags_prompt_id_idx on prompt_tags(prompt_id);
create index prompt_tags_tag_id_idx on prompt_tags(tag_id);
create index related_prompts_prompt_id_idx on related_prompts(prompt_id);
create index related_prompts_related_id_idx on related_prompts(related_id);
create index prompt_events_prompt_id_idx on prompt_events(prompt_id);
create index prompt_events_created_at_idx on prompt_events(created_at);
create index prompt_ratings_prompt_id_idx on prompt_ratings(prompt_id);

-- ============================================================
-- FULL TEXT SEARCH
-- ============================================================
alter table prompts add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title_zh, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(prompt_body, ''))
  ) stored;

create index prompts_search_idx on prompts using gin(search_vector);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prompts_updated_at
  before update on prompts
  for each row execute function update_updated_at();

-- ============================================================
-- RPC: INCREMENT COUNTER
-- ============================================================
create or replace function increment_counter(row_id uuid, column_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  execute format(
    'update public.prompts set %I = %I + 1 where id = $1',
    column_name, column_name
  ) using row_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where email = (select auth.email())
  );
$$;

-- Categories: public read, admin write
alter table categories enable row level security;
create policy "categories_public_read" on categories for select using (true);
create policy "categories_admin_insert" on categories for insert with check ((select is_admin()));
create policy "categories_admin_update" on categories for update using ((select is_admin()));
create policy "categories_admin_delete" on categories for delete using ((select is_admin()));

-- Prompts: public read published, admin full access
alter table prompts enable row level security;
create policy "prompts_public_read" on prompts for select using (
  status = 'published' or (select is_admin())
);
create policy "prompts_admin_insert" on prompts for insert with check ((select is_admin()));
create policy "prompts_admin_update" on prompts for update using ((select is_admin()));
create policy "prompts_admin_delete" on prompts for delete using ((select is_admin()));

-- Prompt variables: public read, admin write
alter table prompt_variables enable row level security;
create policy "variables_public_read" on prompt_variables for select using (true);
create policy "variables_admin_insert" on prompt_variables for insert with check ((select is_admin()));
create policy "variables_admin_update" on prompt_variables for update using ((select is_admin()));
create policy "variables_admin_delete" on prompt_variables for delete using ((select is_admin()));

-- Tags: public read, admin write
alter table tags enable row level security;
create policy "tags_public_read" on tags for select using (true);
create policy "tags_admin_insert" on tags for insert with check ((select is_admin()));
create policy "tags_admin_update" on tags for update using ((select is_admin()));
create policy "tags_admin_delete" on tags for delete using ((select is_admin()));

-- Prompt tags: public read, admin write
alter table prompt_tags enable row level security;
create policy "prompt_tags_public_read" on prompt_tags for select using (true);
create policy "prompt_tags_admin_insert" on prompt_tags for insert with check ((select is_admin()));
create policy "prompt_tags_admin_delete" on prompt_tags for delete using ((select is_admin()));

-- Related prompts: public read, admin write
alter table related_prompts enable row level security;
create policy "related_public_read" on related_prompts for select using (true);
create policy "related_admin_insert" on related_prompts for insert with check ((select is_admin()));
create policy "related_admin_delete" on related_prompts for delete using ((select is_admin()));

-- Events: public insert, admin read
alter table prompt_events enable row level security;
create policy "events_public_insert" on prompt_events for insert with check (true);
create policy "events_admin_read" on prompt_events for select using ((select is_admin()));

-- Ratings: public insert/update (upsert), admin read
alter table prompt_ratings enable row level security;
create policy "ratings_public_insert" on prompt_ratings for insert with check (true);
create policy "ratings_public_update" on prompt_ratings for update using (true);
create policy "ratings_admin_read" on prompt_ratings for select using (true);

-- Admins table: only readable by admins (and the is_admin function via security definer)
alter table admins enable row level security;
create policy "admins_admin_read" on admins for select using ((select auth.email()) in (select email from admins));
