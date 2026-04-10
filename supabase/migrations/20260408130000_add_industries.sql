-- Industries table
create table industries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_zh text not null,
  name_en text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Prompt-Industry junction (a prompt can apply to multiple industries)
create table prompt_industries (
  prompt_id uuid not null references prompts(id) on delete cascade,
  industry_id uuid not null references industries(id) on delete cascade,
  primary key (prompt_id, industry_id)
);

create index prompt_industries_prompt_id_idx on prompt_industries(prompt_id);
create index prompt_industries_industry_id_idx on prompt_industries(industry_id);

-- RLS
alter table industries enable row level security;
create policy "industries_public_read" on industries for select using (true);
create policy "industries_admin_insert" on industries for insert with check ((select is_admin()));
create policy "industries_admin_update" on industries for update using ((select is_admin()));
create policy "industries_admin_delete" on industries for delete using ((select is_admin()));

alter table prompt_industries enable row level security;
create policy "prompt_industries_public_read" on prompt_industries for select using (true);
create policy "prompt_industries_admin_insert" on prompt_industries for insert with check ((select is_admin()));
create policy "prompt_industries_admin_delete" on prompt_industries for delete using ((select is_admin()));
