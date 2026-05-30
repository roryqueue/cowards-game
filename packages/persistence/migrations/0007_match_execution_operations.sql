create table match_execution_quarantines (
  id text primary key,
  job_id text not null unique references match_jobs(id),
  match_id text not null references matches(id),
  status text not null default 'active',
  reason text not null,
  failure_category text not null,
  retryable boolean not null,
  attempt_number integer not null,
  operator_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'released', 'resolved')),
  check (reason in ('retry_exhausted', 'non_retryable_terminal'))
);

create index match_execution_quarantines_match_id_idx
  on match_execution_quarantines(match_id);

create index match_execution_quarantines_status_idx
  on match_execution_quarantines(status, created_at);
