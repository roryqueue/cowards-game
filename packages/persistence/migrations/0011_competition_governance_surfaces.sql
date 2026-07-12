alter table match_sets
  add column if not exists governance_changed_at timestamptz;

alter table match_sets
  drop constraint if exists match_sets_review_status_check;

alter table match_sets
  add constraint match_sets_review_status_check
  check (review_status in ('none', 'under_review', 'disputed', 'resolved')) not valid;

create table if not exists competition_reports (
  id text primary key,
  match_set_id text not null references match_sets(id) on delete cascade,
  reporter_user_id text not null references users(id) on delete cascade,
  submission_type text not null check (submission_type in ('report', 'dispute')),
  category text not null check (category in (
    'result_integrity', 'entry_eligibility', 'identity_or_coordination',
    'abusive_conduct', 'other'
  )),
  private_detail text check (private_detail is null or char_length(private_detail) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists competition_reports_open_unique_idx
  on competition_reports(match_set_id, reporter_user_id, submission_type, category)
  where status = 'open';

create index if not exists competition_reports_reporter_created_idx
  on competition_reports(reporter_user_id, created_at desc);

create or replace function reject_competition_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'competition audit events are append-only';
end;
$$;

drop trigger if exists competition_audit_events_append_only on competition_audit_events;
create trigger competition_audit_events_append_only
before update or delete on competition_audit_events
for each row execute function reject_competition_audit_mutation();
