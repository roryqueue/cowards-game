create table workshop_gauntlet_profiles (
  id text primary key,
  owner_user_id text not null references users(id) on delete cascade,
  name text not null,
  notes text,
  status text not null check (status in ('active', 'archived')),
  profile_schema_version text not null,
  definition jsonb not null,
  compatibility_key jsonb not null,
  compatibility_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workshop_gauntlet_profile_runs (
  id text primary key,
  profile_id text not null references workshop_gauntlet_profiles(id) on delete cascade,
  owner_user_id text not null references users(id) on delete cascade,
  run_index integer not null check (run_index >= 0),
  lifecycle_status text not null check (lifecycle_status in ('queued', 'running', 'complete', 'blocked_preflight')),
  compatibility_hash text not null,
  match_set_ids jsonb not null default '[]'::jsonb,
  summary jsonb not null,
  preflight_errors jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (profile_id, run_index)
);

create unique index workshop_gauntlet_profile_runs_one_active
  on workshop_gauntlet_profile_runs (profile_id)
  where lifecycle_status in ('queued', 'running');
