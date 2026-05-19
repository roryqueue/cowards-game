alter table users
  add column if not exists is_admin boolean not null default false;

alter table strategies
  add column if not exists description text,
  add column if not exists public_tags text[] not null default '{}'::text[];

alter table match_sets
  add column if not exists ladder_season_id text,
  add column if not exists ladder_schedule_run_id text,
  add column if not exists ladder_pod_index integer,
  add column if not exists counted_status text not null default 'pending',
  add column if not exists public_counted_reason text,
  add column if not exists public_counted_explanation text,
  add column if not exists review_status text not null default 'none';

alter table match_sets
  add constraint match_sets_counted_status_check
  check (counted_status in ('pending', 'counted', 'retrying', 'under_review', 'invalid', 'non_competitive', 'non_counted')) not valid,
  add constraint match_sets_review_status_check
  check (review_status in ('none', 'under_review', 'resolved')) not valid,
  add constraint match_sets_public_counted_reason_check
  check (
    public_counted_reason is null or
    public_counted_reason in ('system_failure', 'incomplete_evidence', 'invalid_result', 'governance_hold', 'non_counted')
  ) not valid;

create table if not exists trial_ladder_seasons (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  status text not null,
  season_seed text not null,
  minimum_entries integer not null default 4,
  target_pod_size integer not null default 4,
  scoring_policy_version text not null default 'exhibition-points-v1:v1',
  replacement_policy text not null default 'next-season-only',
  stale_revision_policy text not null default 'locked snapshot remains active for current season',
  opened_at timestamptz,
  closed_at timestamptz,
  scheduled_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trial_ladder_seasons
  add constraint trial_ladder_seasons_status_check
  check (status in ('draft', 'open', 'scheduling', 'active', 'completed', 'archived')) not valid;

create table if not exists trial_ladder_entries (
  id text primary key,
  season_id text not null references trial_ladder_seasons(id) on delete cascade,
  owner_user_id text not null references users(id),
  owner_handle text not null,
  strategy_id text not null references strategies(id),
  strategy_revision_id text not null references strategy_revisions(id),
  status text not null default 'active',
  snapshot jsonb not null,
  entry_index integer not null,
  withdrawn_at timestamptz,
  suspended_at timestamptz,
  invalidated_at timestamptz,
  stale_at timestamptz,
  created_at timestamptz not null default now(),
  unique(season_id, owner_user_id),
  unique(season_id, strategy_revision_id),
  unique(season_id, entry_index)
);

alter table trial_ladder_entries
  add constraint trial_ladder_entries_status_check
  check (status in ('active', 'withdrawn', 'suspended', 'invalidated', 'stale')) not valid;

create index if not exists trial_ladder_entries_season_status_idx
  on trial_ladder_entries(season_id, status, entry_index);

create table if not exists trial_ladder_schedule_runs (
  id text primary key,
  season_id text not null references trial_ladder_seasons(id) on delete cascade,
  run_index integer not null,
  status text not null default 'complete',
  created_match_set_ids jsonb not null default '[]'::jsonb,
  leftover_entry_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(season_id, run_index)
);

alter table trial_ladder_schedule_runs
  add constraint trial_ladder_schedule_runs_status_check
  check (status in ('complete', 'no_op', 'failed_system')) not valid;

create table if not exists result_flags (
  id text primary key,
  match_set_id text not null references match_sets(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  note text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  unique(match_set_id, user_id)
);

alter table result_flags
  add constraint result_flags_status_check
  check (status in ('open', 'resolved', 'dismissed')) not valid;

create table if not exists competition_audit_events (
  id text primary key,
  actor_user_id text references users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  reason text not null,
  public_explanation text,
  private_note text,
  created_at timestamptz not null default now()
);

create index if not exists competition_audit_events_target_idx
  on competition_audit_events(target_type, target_id, created_at desc);

alter table match_sets
  add constraint match_sets_ladder_season_fk
  foreign key (ladder_season_id)
  references trial_ladder_seasons(id)
  on delete set null
  not valid;
