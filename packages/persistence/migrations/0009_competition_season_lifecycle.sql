alter table trial_ladder_seasons
  add column if not exists outcome_status text,
  add column if not exists public_outcome_explanation text;

alter table trial_ladder_seasons
  drop constraint if exists trial_ladder_seasons_outcome_status_check;

alter table trial_ladder_seasons
  add constraint trial_ladder_seasons_outcome_status_check
  check (
    outcome_status is null or
    outcome_status in ('scheduled', 'insufficient_evidence')
  ) not valid;
