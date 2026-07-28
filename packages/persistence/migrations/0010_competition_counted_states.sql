alter table match_sets
  drop constraint if exists match_sets_counted_status_check,
  drop constraint if exists match_sets_public_counted_reason_check;

alter table match_sets
  add constraint match_sets_counted_status_check
  check (
    counted_status in (
      'pending', 'counted', 'retrying', 'degraded_system_failure',
      'non_counted', 'non_competitive', 'under_review', 'disputed',
      'invalid', 'invalidated'
    )
  ) not valid,
  add constraint match_sets_public_counted_reason_check
  check (
    public_counted_reason is null or
    public_counted_reason in (
      'system_failure', 'incomplete_evidence', 'invalid_result',
      'governance_hold', 'non_counted', 'non_competitive',
      'disputed', 'invalidated'
    )
  ) not valid;
