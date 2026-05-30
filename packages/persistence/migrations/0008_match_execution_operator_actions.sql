create table match_execution_operator_actions (
  id text primary key,
  idempotency_key text not null unique,
  action_type text not null,
  job_id text not null references match_jobs(id),
  match_id text not null references matches(id),
  operator_id text not null,
  status text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (action_type in ('requeue', 'rerun')),
  check (status in ('applied', 'rejected')),
  check (idempotency_key <> ''),
  check (operator_id <> '')
);

create index match_execution_operator_actions_job_id_idx
  on match_execution_operator_actions(job_id, created_at);
