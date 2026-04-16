-- ============================================================
-- WEIGHTED SEARCH VECTOR: titles rank higher than body text
-- ============================================================
-- Weight A = title_zh, title_en (most important)
-- Weight B = subtitle
-- Weight D = prompt_body, prompt_body_en (least important)
--
-- This ensures that searching "whatsapp" ranks the WhatsApp
-- prompt (title match) far above prompts that merely mention
-- WhatsApp as a notification channel in their body.

drop index if exists prompts_search_idx;
alter table prompts drop column if exists search_vector;

alter table prompts add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title_zh, '') || ' ' || coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(prompt_body, '') || ' ' || coalesce(prompt_body_en, '')), 'D')
  ) stored;

create index prompts_search_idx on prompts using gin(search_vector);

-- ============================================================
-- UPDATE SEARCH RPC: weighted ranking, capped at 20 results
-- ============================================================
-- Replaces the previous unweighted version.
-- Limit 20 keeps results tight (~2 pages); weighting ensures
-- title matches always outrank casual body mentions.

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
  order by rank desc
  limit 20;
$$;
