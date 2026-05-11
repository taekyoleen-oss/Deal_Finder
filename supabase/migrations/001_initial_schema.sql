-- =============================================
-- DealRadar v1.4 — Initial Schema
-- =============================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "unaccent";

-- =============================================
-- ENUMS
-- =============================================

create type event_status as enum ('pending', 'published', 'completed', 'rejected');
create type date_quality as enum ('confirmed', 'estimated', 'missing', 'unrealistic', 'reversed');
create type media_tier as enum ('major', 'minor', 'blog', 'community');
create type cover_image_source as enum ('og_extracted', 'category_fallback', 'manual');
create type report_reason_type as enum ('ended', 'promotional', 'wrong_period', 'wrong_category', 'other');

-- =============================================
-- CATEGORIES
-- =============================================

create table categories (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  name         text not null,
  parent_id    uuid references categories(id),
  display_order int not null default 0,
  icon_svg     text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index idx_categories_parent_order on categories(parent_id, display_order);

-- =============================================
-- TAGS
-- =============================================

create table tags (
  id    uuid primary key default uuid_generate_v4(),
  slug  text unique not null,
  name  text not null
);

-- =============================================
-- BRANDS
-- =============================================

create table brands (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  aliases     text[] not null default '{}',  -- 표기 변형 사전
  category_id uuid references categories(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_brands_name on brands(name);

-- =============================================
-- REGIONS
-- =============================================

create table regions (
  id   uuid primary key default uuid_generate_v4(),
  name text unique not null
);

-- =============================================
-- SOURCES (news sources config)
-- =============================================

create table sources (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  url         text,
  tier        media_tier not null default 'minor',
  config      jsonb not null default '{}',  -- keyword_sets, api_config
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================
-- RAW ARTICLES
-- =============================================

create table raw_articles (
  id                     uuid primary key default uuid_generate_v4(),
  source_id              uuid references sources(id),
  original_url           text unique not null,
  title                  text not null,
  body_excerpt           text,              -- 100자 이내 발췌
  original_published_at  timestamptz,
  fetched_at             timestamptz not null default now(),
  processing_status      text not null default 'pending',  -- pending|processing|done|failed
  search_run_id          uuid,
  created_at             timestamptz not null default now()
);

create index idx_raw_articles_status_fetched on raw_articles(processing_status, fetched_at);
create index idx_raw_articles_url on raw_articles(original_url);

-- =============================================
-- SEARCH RUNS
-- =============================================

create table search_runs (
  id               uuid primary key default uuid_generate_v4(),
  window_start     date not null,
  window_end       date not null,
  status           text not null default 'running',  -- running|finished|failed
  articles_count   int not null default 0,
  events_count     int not null default 0,
  ai_cost_usd      numeric(10,4) not null default 0,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  error_message    text
);

-- =============================================
-- EVENTS (core table)
-- =============================================

create table events (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  summary               text,
  key_points            text[],              -- 3~5 bullet points
  brand_id              uuid references brands(id),
  brand_raw             text,               -- AI 추출 원문 (brand_id 없을 때)
  category_id           uuid references categories(id),
  subcategory_id        uuid references categories(id),
  discount_type         text,
  discount_value        text,
  starts_at             date,
  ends_at               date,
  is_ongoing            boolean not null default false,
  regions               text[] not null default '{}',
  status                event_status not null default 'pending',
  confidence            numeric(3,2),
  date_quality          date_quality,
  affiliate_url         text,               -- 관리자 수동 입력
  cover_image_url       text,               -- Supabase Storage URL
  cover_image_source    cover_image_source,
  cover_image_checked_at timestamptz,
  slug                  text,               -- 선택적 한글 slug
  auto_published        boolean not null default false,
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  fts_doc               tsvector            -- 한국어 FTS 컬럼 (트리거로 유지)
);

-- 메인 정렬
create index idx_events_status_published on events(status, published_at desc);
-- 카테고리별
create index idx_events_category_status on events(category_id, status, published_at desc);
-- 마감 임박 + 자동 완료 cron
create index idx_events_ends_at on events(ends_at) where status='published' and ends_at is not null;
-- 유효한 이벤트 기본 쿼리
create index idx_events_status_ends on events(status, ends_at) where status='published';
-- 예정 정렬
create index idx_events_starts_at on events(starts_at) where status='published';
-- 과거 dedup 1차 필터
create index idx_events_brand_category on events(brand_id, category_id) where status='published';
-- 한국어 FTS (GIN 인덱스) — fts_doc 컬럼 기반 (트리거 유지)
create index idx_events_fts on events using gin(fts_doc);

-- =============================================
-- EVENT SOURCES (출처 연결)
-- =============================================

create table event_sources (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references events(id) on delete cascade,
  raw_article_id  uuid references raw_articles(id),
  source_name     text,
  source_url      text,
  media_tier      media_tier,
  published_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_event_sources_event on event_sources(event_id);

-- =============================================
-- EVENT TAGS
-- =============================================

create table event_tags (
  event_id uuid not null references events(id) on delete cascade,
  tag_id   uuid not null references tags(id),
  primary key (event_id, tag_id)
);

create index idx_event_tags_tag on event_tags(tag_id, event_id);

-- =============================================
-- EVENT REGIONS
-- =============================================

create table event_regions (
  event_id  uuid not null references events(id) on delete cascade,
  region_id uuid not null references regions(id),
  primary key (event_id, region_id)
);

-- =============================================
-- EVENT EMBEDDINGS (pgvector)
-- =============================================

create table event_embeddings (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid unique not null references events(id) on delete cascade,
  embedding  vector(1536),        -- text-embedding-3-small
  input_text text,               -- 임베딩 입력 원문 (캐싱)
  model      text not null default 'text-embedding-3-small',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_event_embeddings_ivfflat on event_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- =============================================
-- ADMIN SESSIONS (감사용, JWT 보조)
-- =============================================

create table admin_sessions (
  id          uuid primary key default uuid_generate_v4(),
  token_hash  text unique,        -- JWT jti 해시 (강제 로그아웃용 블랙리스트)
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  revoked_at  timestamptz
);

create index idx_admin_sessions_token on admin_sessions(token_hash);

-- =============================================
-- ADMIN LOGIN ATTEMPTS (IP rate limit)
-- =============================================

create table admin_login_attempts (
  id           uuid primary key default uuid_generate_v4(),
  ip           text not null,
  attempted_at timestamptz not null default now(),
  success      boolean not null default false
);

create index idx_admin_login_ip_time on admin_login_attempts(ip, attempted_at desc);

-- =============================================
-- ADMIN AUDIT LOG
-- =============================================

create table admin_audit_log (
  id           uuid primary key default uuid_generate_v4(),
  action       text not null,
  entity_type  text,
  entity_id    uuid,
  before_data  jsonb,
  after_data   jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);

create index idx_audit_log_created on admin_audit_log(created_at desc);
create index idx_audit_log_entity on admin_audit_log(entity_type, entity_id);

-- =============================================
-- EVENT REPORTS (사용자 익명 제보)
-- =============================================

create table event_reports (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references events(id) on delete cascade,
  reason_type     report_reason_type not null,
  message         text check (char_length(message) <= 200),
  ip_hash         text not null,   -- sha256(ip + REPORT_HASH_SALT)
  user_agent_hash text,
  created_at      timestamptz not null default now(),
  reviewed        boolean not null default false,
  reviewed_by     text,
  reviewed_at     timestamptz
);

create index idx_event_reports_event on event_reports(event_id, created_at desc);
create index idx_event_reports_queue on event_reports(reviewed, created_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
alter table events enable row level security;
alter table event_sources enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table brands enable row level security;
alter table regions enable row level security;
alter table event_tags enable row level security;
alter table event_regions enable row level security;
alter table event_embeddings enable row level security;
alter table raw_articles enable row level security;
alter table sources enable row level security;
alter table search_runs enable row level security;
alter table admin_sessions enable row level security;
alter table admin_login_attempts enable row level security;
alter table admin_audit_log enable row level security;
alter table event_reports enable row level security;

-- Public read policies (anon + authenticated)
create policy "events_public_read" on events
  for select using (status in ('published', 'completed'));

create policy "event_sources_public_read" on event_sources
  for select using (true);

create policy "categories_public_read" on categories
  for select using (true);

create policy "tags_public_read" on tags
  for select using (true);

create policy "brands_public_read" on brands
  for select using (true);

create policy "regions_public_read" on regions
  for select using (true);

create policy "event_tags_public_read" on event_tags
  for select using (true);

create policy "event_regions_public_read" on event_regions
  for select using (true);

-- Server-only tables (no public access — service role bypasses RLS)
-- event_embeddings, raw_articles, sources, search_runs,
-- admin_sessions, admin_login_attempts, admin_audit_log, event_reports
-- → No permissive policies = deny all for non-service-role

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_events_updated_at
  before update on events
  for each row execute function update_updated_at();

create trigger trg_brands_updated_at
  before update on brands
  for each row execute function update_updated_at();

create trigger trg_event_embeddings_updated_at
  before update on event_embeddings
  for each row execute function update_updated_at();

-- =============================================
-- FTS TRIGGER (fts_doc 컬럼 유지)
-- =============================================

create or replace function update_events_fts()
returns trigger as $$
begin
  new.fts_doc := to_tsvector('simple',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.summary, '') || ' ' ||
    array_to_string(coalesce(new.key_points, '{}'::text[]), ' ')
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_events_fts
  before insert or update on events
  for each row execute function update_events_fts();

-- =============================================
-- VECTOR SEARCH RPC FUNCTIONS
-- =============================================

create or replace function match_events_by_embedding(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  event_id uuid,
  similarity float
)
language sql stable
as $$
  select
    ee.event_id,
    1 - (ee.embedding <=> query_embedding) as similarity
  from event_embeddings ee
  join events e on e.id = ee.event_id
  where e.status in ('published', 'completed')
    and 1 - (ee.embedding <=> query_embedding) > match_threshold
  order by ee.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_related_events(
  source_event_id uuid,
  match_threshold float default 0.6,
  match_count int default 6
)
returns table (
  event_id uuid,
  similarity float
)
language sql stable
as $$
  select
    ee.event_id,
    1 - (ee.embedding <=> src.embedding) as similarity
  from event_embeddings ee
  join event_embeddings src on src.event_id = source_event_id
  join events e on e.id = ee.event_id
  where ee.event_id <> source_event_id
    and e.status = 'published'
    and 1 - (ee.embedding <=> src.embedding) > match_threshold
  order by ee.embedding <=> src.embedding
  limit match_count;
$$;
