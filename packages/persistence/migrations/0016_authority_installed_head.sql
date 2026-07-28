-- The publication ledger owns one monotonic installed head. Terminal install
-- transitions serialize against scheduling/lifecycle transactions through the
-- singleton publication-head row; no application writer may bypass this lock.

create or replace function lock_runtime_evidence_authority_terminal_transition()
returns trigger language plpgsql as $$
begin
  if new.event_kind in ('installed', 'failed', 'uncertain') then
    perform 1
      from runtime_evidence_authority_publication_head
     where singleton = true
     for update;
    if not found then
      raise exception 'runtime evidence authority publication head is unavailable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists runtime_evidence_authority_terminal_transition_lock
  on runtime_evidence_authority_publication_events;
create trigger runtime_evidence_authority_terminal_transition_lock
before insert on runtime_evidence_authority_publication_events
for each row execute function lock_runtime_evidence_authority_terminal_transition();

create or replace view runtime_evidence_authority_installed_head as
with publication_state as (
  select
    publication.id as publication_id,
    publication.generation,
    terminal.id as terminal_event_id,
    terminal.event_kind as terminal_event_kind,
    terminal.receipt as terminal_receipt,
    exists (
      select 1
        from runtime_evidence_authority_publication_events installed
       where installed.publication_id = publication.id
         and installed.event_kind = 'installed'
         and installed.reason_code is null
         and installed.envelope_sha256 = publication.envelope_sha256
         and installed.receipt->>'schemaVersion' =
           'v1.37-runtime-evidence-authority-install-receipt-v1'
         and installed.receipt->>'generation' = publication.generation::text
         and installed.receipt->>'payloadSha256' = publication.payload_sha256
         and installed.receipt->>'envelopeSha256' = publication.envelope_sha256
         and installed.receipt->>'sourceManifestHash' = publication.source_manifest_hash
         and installed.receipt->'sourceIds'->'attestationIds' = publication.attestation_ids
         and installed.receipt->'sourceIds'->'certificateIds' = publication.certificate_ids
         and installed.receipt->'sourceIds'->'revocationIds' = publication.revocation_ids
         and installed.receipt->'sourceIds'->'supersessionIds' = publication.supersession_ids
         and installed.receipt->'sourceIds'->'laneControlIds' = publication.lane_control_ids
    ) as ever_installed,
    coalesce(
      terminal.event_kind = 'installed'
      and terminal.reason_code is null
      and terminal.envelope_sha256 = publication.envelope_sha256
      and terminal.receipt->>'schemaVersion' =
        'v1.37-runtime-evidence-authority-install-receipt-v1'
      and terminal.receipt->>'generation' = publication.generation::text
      and terminal.receipt->>'payloadSha256' = publication.payload_sha256
      and terminal.receipt->>'envelopeSha256' = publication.envelope_sha256
      and terminal.receipt->>'sourceManifestHash' = publication.source_manifest_hash
      and terminal.receipt->'sourceIds'->'attestationIds' = publication.attestation_ids
      and terminal.receipt->'sourceIds'->'certificateIds' = publication.certificate_ids
      and terminal.receipt->'sourceIds'->'revocationIds' = publication.revocation_ids
      and terminal.receipt->'sourceIds'->'supersessionIds' = publication.supersession_ids
      and terminal.receipt->'sourceIds'->'laneControlIds' = publication.lane_control_ids,
      false
    ) as currently_installed
  from runtime_evidence_authority_publications publication
  left join lateral (
    select event.id, event.event_kind, event.envelope_sha256,
           event.reason_code, event.receipt
      from runtime_evidence_authority_publication_events event
     where event.publication_id = publication.id
       and event.event_kind in ('installed', 'failed', 'uncertain')
     order by event.occurred_at desc, event.id desc
     limit 1
  ) terminal on true
), highest_ever_installed as (
  select max(generation) as generation
    from publication_state
   where ever_installed
)
select
  state.publication_id,
  state.generation,
  state.terminal_event_id as install_receipt_id,
  state.terminal_receipt as receipt
from publication_state state
join highest_ever_installed highest
  on highest.generation = state.generation
where state.currently_installed
  and not exists (
    select 1
      from publication_state newer
     where newer.generation > state.generation
       and newer.terminal_event_kind = 'uncertain'
  );
