-- ============================================================
-- FIX SEARCH VECTOR: include prompt_body_en
-- ============================================================
-- Postgres does not allow ALTER on generated columns, so we
-- drop the index, drop the column, and recreate both.

drop index if exists prompts_search_idx;

alter table prompts drop column if exists search_vector;

alter table prompts add column search_vector tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(title_zh, '') || ' ' ||
      coalesce(title_en, '') || ' ' ||
      coalesce(subtitle, '') || ' ' ||
      coalesce(prompt_body, '') || ' ' ||
      coalesce(prompt_body_en, ''))
  ) stored;

create index prompts_search_idx on prompts using gin(search_vector);

-- ============================================================
-- SEARCH RPC: returns (id, rank) pairs ordered by relevance
-- ============================================================
-- Uses websearch_to_tsquery for natural user input handling
-- (implicit AND, quoted phrases, - exclusion).
-- SECURITY INVOKER so RLS policies are respected.

create or replace function search_prompts(search_query text)
returns table(id uuid, rank real)
language sql
security invoker
stable
as $$
  select
    p.id,
    ts_rank(p.search_vector, websearch_to_tsquery('simple', search_query)) as rank
  from prompts p
  where p.status = 'published'
    and p.search_vector @@ websearch_to_tsquery('simple', search_query)
  order by rank desc;
$$;
