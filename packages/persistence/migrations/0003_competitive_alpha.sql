alter table users
  add column if not exists username text,
  add column if not exists handle text,
  add column if not exists password_hash text;

create unique index if not exists users_username_unique_idx
  on users (lower(username))
  where username is not null;

create unique index if not exists users_handle_unique_idx
  on users (lower(handle))
  where handle is not null;

create table if not exists user_sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists user_sessions_user_id_idx on user_sessions(user_id);
create index if not exists user_sessions_token_hash_idx on user_sessions(token_hash);
create index if not exists user_sessions_active_idx
  on user_sessions(user_id, expires_at)
  where revoked_at is null;

alter table match_sets
  add column if not exists creator_user_id text references users(id),
  add column if not exists competition_preset_id text,
  add column if not exists competition_preset_version text,
  add column if not exists scoring_policy_version text,
  add column if not exists visibility text,
  add column if not exists entrant_snapshot_set jsonb not null default '[]'::jsonb,
  add column if not exists publication_policy jsonb not null default '{}'::jsonb,
  add column if not exists duplicate_key text,
  add column if not exists locked_at timestamptz;

create table if not exists competition_entrants (
  id text primary key,
  match_set_id text not null references match_sets(id) on delete cascade,
  entrant_index integer not null,
  strategy_revision_id text not null references strategy_revisions(id),
  owner_user_id text not null references users(id),
  owner_handle text not null,
  display_label text not null,
  source_hash text not null,
  source_bytes integer not null,
  runtime jsonb not null,
  engine_compatibility jsonb not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(match_set_id, entrant_index),
  unique(match_set_id, strategy_revision_id)
);

create index if not exists competition_entrants_match_set_idx
  on competition_entrants(match_set_id, entrant_index);

create index if not exists competition_entrants_owner_idx
  on competition_entrants(owner_user_id);

create unique index if not exists match_sets_active_duplicate_idx
  on match_sets(creator_user_id, competition_preset_id, duplicate_key)
  where creator_user_id is not null
    and competition_preset_id is not null
    and duplicate_key is not null
    and status in ('pending', 'running');

create table if not exists competition_submission_events (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  action text not null,
  preset_id text,
  match_set_id text references match_sets(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists competition_submission_events_user_action_created_idx
  on competition_submission_events(user_id, action, created_at desc);
