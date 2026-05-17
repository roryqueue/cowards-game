create type match_status as enum (
  'pending',
  'running',
  'complete',
  'failed_system',
  'blocked'
);

create type match_set_status as enum (
  'pending',
  'running',
  'complete',
  'failed_system',
  'blocked',
  'degraded'
);

create type match_job_status as enum (
  'queued',
  'running',
  'complete',
  'failed_system'
);

create table users (
  id text primary key,
  display_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table strategies (
  id text primary key,
  owner_user_id text not null references users(id),
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table strategy_revisions (
  id text primary key,
  strategy_id text references strategies(id),
  source text not null,
  source_hash text not null,
  source_bytes integer not null,
  runtime jsonb not null,
  engine_compatibility jsonb not null,
  validation jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  locked_at timestamptz,
  created_at timestamptz not null default now()
);

create table arena_variants (
  id text primary key,
  name text not null,
  version text not null default 'arena-v1',
  config jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table matches (
  id text primary key,
  bottom_strategy_revision_id text not null references strategy_revisions(id),
  top_strategy_revision_id text not null references strategy_revisions(id),
  arena_variant_id text not null references arena_variants(id),
  seed text not null,
  status match_status not null default 'pending',
  outcome jsonb,
  bottom_player_id text not null,
  top_player_id text not null,
  winner_player_id text,
  surviving_soldiers integer,
  bottom_surviving_soldiers integer,
  top_surviving_soldiers integer,
  survival_turns integer,
  bottom_survival_turns integer,
  top_survival_turns integer,
  failure_category text,
  failure_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table match_sets (
  id text primary key,
  status match_set_status not null default 'pending',
  preset_id text,
  preset_version text,
  matrix jsonb not null,
  scoring jsonb,
  degraded boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table match_set_matches (
  match_set_id text not null references match_sets(id) on delete cascade,
  match_id text not null references matches(id),
  matrix_index integer not null,
  primary key(match_set_id, match_id),
  unique(match_set_id, matrix_index)
);

create table chronicles (
  id text primary key,
  match_id text not null unique references matches(id),
  schema_version text not null,
  hash text not null,
  outcome jsonb not null,
  event_count integer not null,
  snapshot_count integer not null,
  bottom_player_id text not null,
  top_player_id text not null,
  bottom_strategy_revision_id text not null,
  top_strategy_revision_id text not null,
  arena_variant_id text not null,
  artifact jsonb not null,
  created_at timestamptz not null default now()
);

create table match_jobs (
  id text primary key,
  match_id text not null unique references matches(id),
  status match_job_status not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  worker_id text,
  lease_token text,
  lease_expires_at timestamptz,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table match_job_attempts (
  id text primary key,
  job_id text not null references match_jobs(id),
  attempt_number integer not null,
  worker_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null,
  error_class text,
  error_message text,
  retryable boolean not null default true,
  details jsonb not null default '{}'::jsonb,
  unique(job_id, attempt_number)
);

create index matches_status_idx on matches(status);
create index match_sets_status_idx on match_sets(status);
create index match_jobs_claim_idx on match_jobs(status, run_after, lease_expires_at);
create index chronicles_hash_idx on chronicles(hash);
create index strategy_revisions_strategy_id_idx on strategy_revisions(strategy_id);

-- Job claiming uses select ... for update skip locked in packages/persistence/src/jobs.ts.
