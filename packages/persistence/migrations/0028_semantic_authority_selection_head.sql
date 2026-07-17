-- One crash-safe semantic authority selection head. This migration preserves
-- Phase-259 as current; runtime-v1.19 remains a reviewed inactive target.

create function semantic_authority_selection_is_exact(
  candidate jsonb,
  candidate_root text
) returns boolean language sql immutable as $$
  select
    (candidate = '{"schemaVersion":"semantic-authority-selection-v1","semanticAuthorityKey":"runtime-v1.17","tupleId":"sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe","rulesVersion":"cowards-rules-v1.4","engineVersion":"engine-kernel-v1.37-candidate-1","runtimeAbiVersion":"strategy-runtime-abi-v1.17","chronicleVersion":"chronicle-recorder-current-events-v1.37-candidate-1","conformanceCertificateVersion":"runtime-conformance-certificate-v1.17","conformanceCorpusVersion":"v2","conformanceCorpusRoot":"sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2","conformanceTraceVersion":"v1.37-conformance-trace-v3","conformanceTraceRoot":"sha256:53ac4a34b8ea3a52b65b566dfb1da94cbc36ce220c590fe46c0bf43489668696","workshopContractVersion":"workshop-contract-v1.17","workshopContractRoot":"sha256:1bed9b99ce512da13a3aa37554dc9b279f51dca619280ff3cbd85cc773ce18d3","arenaCatalogVersion":"semantic-arena-catalog-v1.37-candidate-1","setPolicyVersion":"canonical-set-policy-v1.4","strategyRevisionEvidencePolicy":"phase259-explicit-current-evidence-v1"}'::jsonb and
     candidate_root = 'sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a')
    or
    (candidate = '{"schemaVersion":"semantic-authority-selection-v1","semanticAuthorityKey":"runtime-v1.19","tupleId":"sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73","rulesVersion":"cowards-rules-v1.4","engineVersion":"engine-kernel-v1.37-candidate-1","runtimeAbiVersion":"strategy-runtime-abi-v1.19","chronicleVersion":"chronicle-recorder-current-events-v1.37-candidate-1","conformanceCertificateVersion":"runtime-conformance-certificate-v1.19","conformanceCorpusVersion":"v3","conformanceCorpusRoot":"sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d","conformanceTraceVersion":"v1.37-observation-trace-v4","conformanceTraceRoot":"sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a","workshopContractVersion":"workshop-contract-v1.19","workshopContractRoot":"sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d","arenaCatalogVersion":"canonical-arena-catalog-v1.37","setPolicyVersion":"canonical-set-policy-v1.37-four-condition-v1","strategyRevisionEvidencePolicy":"strategy-revision-v1.19-revalidation-v1"}'::jsonb and
     candidate_root = 'sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2')
$$;

create function semantic_authority_selector_manifest_is_exact(candidate jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(candidate) = 'array'
    and jsonb_array_length(candidate) = 5
    and (
      select count(*) = 5
        and count(distinct member->>'path') = 5
        and bool_and(
          jsonb_typeof(member) = 'object'
          and (select count(*) from jsonb_object_keys(member)) = 2
          and member ?& array['path','sha256']
          and member->>'sha256' ~ '^sha256:[0-9a-f]{64}$'
          and member->>'path' in (
            'packages/spec/src/current-semantic-authority-source.ts',
            'apps/go-backend/current_semantic_authority_generated.go',
            'packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json',
            'packages/golden/src/v1-37-conformance-corpus-pin.ts',
            'packages/golden/src/fixtures/v1-37-conformance-traces/registry.json'
          )
        )
      from jsonb_array_elements(candidate) member
    )
$$;

create function semantic_authority_pending_is_exact(
  candidate jsonb,
  expected_direction text
) returns boolean language sql immutable as $$
  select case expected_direction
    when 'forward' then
      jsonb_typeof(candidate) = 'object'
      and (select count(*) from jsonb_object_keys(candidate)) = 9
      and candidate ?& array[
        'direction','activationId','expectedOldRoot','targetSelection',
        'targetRoot','parentHead','selectorManifest','selectorManifestRoot',
        'proofPreimageRoot'
      ]
      and candidate->>'direction' = 'forward'
      and candidate->>'activationId' ~ '^activation:[A-Za-z0-9._:-]{1,160}$'
      and candidate->>'expectedOldRoot' =
        'sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a'
      and semantic_authority_selection_is_exact(
        candidate->'targetSelection', candidate->>'targetRoot'
      )
      and candidate->'targetSelection'->>'semanticAuthorityKey' = 'runtime-v1.19'
      and candidate->>'parentHead' ~ '^[0-9a-f]{40,64}$'
      and semantic_authority_selector_manifest_is_exact(candidate->'selectorManifest')
      and candidate->>'selectorManifestRoot' ~ '^sha256:[0-9a-f]{64}$'
      and candidate->>'proofPreimageRoot' ~ '^sha256:[0-9a-f]{64}$'
    when 'reverse' then
      jsonb_typeof(candidate) = 'object'
      and (select count(*) from jsonb_object_keys(candidate)) = 10
      and candidate ?& array[
        'direction','activationId','sourceActivationId','expectedOldRoot',
        'targetSelection','targetRoot','parentHead','selectorManifest',
        'selectorManifestRoot','proofPreimageRoot'
      ]
      and candidate->>'direction' = 'reverse'
      and candidate->>'activationId' ~ '^compensation:[A-Za-z0-9._:-]{1,156}$'
      and candidate->>'sourceActivationId' ~ '^activation:[A-Za-z0-9._:-]{1,160}$'
      and candidate->>'expectedOldRoot' =
        'sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2'
      and semantic_authority_selection_is_exact(
        candidate->'targetSelection', candidate->>'targetRoot'
      )
      and candidate->'targetSelection'->>'semanticAuthorityKey' = 'runtime-v1.17'
      and candidate->>'parentHead' ~ '^[0-9a-f]{40,64}$'
      and semantic_authority_selector_manifest_is_exact(candidate->'selectorManifest')
      and candidate->>'selectorManifestRoot' ~ '^sha256:[0-9a-f]{64}$'
      and candidate->>'proofPreimageRoot' ~ '^sha256:[0-9a-f]{64}$'
    else false
  end
$$;

create function semantic_authority_finalization_is_exact(candidate jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(candidate) = 'object'
    and (select count(*) from jsonb_object_keys(candidate)) = 5
    and candidate ?& array[
      'activationId','proofDigest','commitSha','treeSha','selectorManifestRoot'
    ]
    and candidate->>'activationId' ~ '^activation:[A-Za-z0-9._:-]{1,160}$'
    and candidate->>'proofDigest' ~ '^sha256:[0-9a-f]{64}$'
    and candidate->>'commitSha' ~ '^[0-9a-f]{40,64}$'
    and candidate->>'treeSha' ~ '^[0-9a-f]{40,64}$'
    and candidate->>'selectorManifestRoot' ~ '^sha256:[0-9a-f]{64}$'
$$;

create function semantic_authority_compensation_is_exact(candidate jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(candidate) = 'object'
    and (select count(*) from jsonb_object_keys(candidate)) = 6
    and candidate ?& array[
      'activationId','sourceActivationId','recoveryReceiptDigest',
      'commitSha','treeSha','selectorManifestRoot'
    ]
    and candidate->>'activationId' ~ '^compensation:[A-Za-z0-9._:-]{1,156}$'
    and candidate->>'sourceActivationId' ~ '^activation:[A-Za-z0-9._:-]{1,160}$'
    and candidate->>'recoveryReceiptDigest' ~ '^sha256:[0-9a-f]{64}$'
    and candidate->>'commitSha' ~ '^[0-9a-f]{40,64}$'
    and candidate->>'treeSha' ~ '^[0-9a-f]{40,64}$'
    and candidate->>'selectorManifestRoot' ~ '^sha256:[0-9a-f]{64}$'
$$;

create function semantic_authority_head_state_is_exact(
  candidate_state text,
  candidate_active jsonb,
  candidate_active_root text,
  candidate_pending jsonb,
  candidate_finalization jsonb,
  candidate_compensation jsonb
) returns boolean language sql immutable as $$
  select case candidate_state
    when 'active-v1.17-bootstrap' then
      semantic_authority_selection_is_exact(candidate_active, candidate_active_root)
      and candidate_active->>'semanticAuthorityKey' = 'runtime-v1.17'
      and candidate_pending is null
      and candidate_finalization is null
      and candidate_compensation is null
    when 'pending-precommit' then
      semantic_authority_selection_is_exact(candidate_active, candidate_active_root)
      and candidate_active->>'semanticAuthorityKey' = 'runtime-v1.17'
      and semantic_authority_pending_is_exact(candidate_pending, 'forward')
      and candidate_finalization is null
      and candidate_compensation is null
    when 'active-v1.19-finalized' then
      semantic_authority_selection_is_exact(candidate_active, candidate_active_root)
      and candidate_active->>'semanticAuthorityKey' = 'runtime-v1.19'
      and candidate_pending is null
      and semantic_authority_finalization_is_exact(candidate_finalization)
      and candidate_compensation is null
    when 'pending-compensation' then
      semantic_authority_selection_is_exact(candidate_active, candidate_active_root)
      and candidate_active->>'semanticAuthorityKey' = 'runtime-v1.19'
      and semantic_authority_pending_is_exact(candidate_pending, 'reverse')
      and semantic_authority_finalization_is_exact(candidate_finalization)
      and candidate_pending->>'sourceActivationId' =
          candidate_finalization->>'activationId'
      and candidate_compensation is null
    when 'active-v1.17-compensated' then
      semantic_authority_selection_is_exact(candidate_active, candidate_active_root)
      and candidate_active->>'semanticAuthorityKey' = 'runtime-v1.17'
      and candidate_pending is null
      and semantic_authority_finalization_is_exact(candidate_finalization)
      and semantic_authority_compensation_is_exact(candidate_compensation)
      and candidate_compensation->>'sourceActivationId' =
          candidate_finalization->>'activationId'
    else false
  end
$$;

create table semantic_authority_selection_head (
  singleton boolean primary key default true check (singleton),
  state text not null check (state in (
    'active-v1.17-bootstrap',
    'pending-precommit',
    'active-v1.19-finalized',
    'pending-compensation',
    'active-v1.17-compensated'
  )),
  revision bigint not null check (revision >= 0),
  active_selection jsonb not null,
  active_selection_root text not null
    check (active_selection_root ~ '^sha256:[0-9a-f]{64}$'),
  pending_intent jsonb,
  finalization jsonb,
  compensation jsonb,
  updated_at timestamptz not null default now(),
  constraint semantic_authority_selection_head_exact_state check (
    semantic_authority_head_state_is_exact(
      state, active_selection, active_selection_root,
      pending_intent, finalization, compensation
    )
  )
);

create table semantic_authority_selection_history (
  sequence bigint generated always as identity primary key,
  transition_kind text not null check (transition_kind in (
    'bootstrap','prepared','aborted','finalized','compensation-prepared',
    'compensation-aborted','compensated'
  )),
  state text not null,
  revision bigint not null check (revision >= 0),
  activation_id text,
  active_selection jsonb not null,
  active_selection_root text not null
    check (active_selection_root ~ '^sha256:[0-9a-f]{64}$'),
  pending_intent jsonb,
  finalization jsonb,
  compensation jsonb,
  created_at timestamptz not null default now(),
  check (semantic_authority_head_state_is_exact(
    state, active_selection, active_selection_root,
    pending_intent, finalization, compensation
  )),
  check (
    (transition_kind = 'bootstrap' and activation_id is null)
    or
    (transition_kind <> 'bootstrap' and activation_id is not null)
  )
);

create trigger semantic_authority_selection_history_append_only
before update or delete on semantic_authority_selection_history
for each row execute function reject_integrity_authority_mutation();

create function prevent_semantic_authority_head_partial_update()
returns trigger language plpgsql as $$
begin
  if current_setting('cowards.semantic_authority_transition', true)
       is distinct from 'phase260-plan28' then
    raise exception 'semantic authority head requires an exact transition API';
  end if;
  if new.revision <> old.revision + 1 then
    raise exception 'semantic authority head revision must advance exactly once';
  end if;
  return new;
end;
$$;

create trigger semantic_authority_selection_head_exact_transition
before update or delete on semantic_authority_selection_head
for each row execute function prevent_semantic_authority_head_partial_update();

insert into semantic_authority_selection_head (
  singleton, state, revision, active_selection, active_selection_root
) values (
  true,
  'active-v1.17-bootstrap',
  0,
  '{"schemaVersion":"semantic-authority-selection-v1","semanticAuthorityKey":"runtime-v1.17","tupleId":"sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe","rulesVersion":"cowards-rules-v1.4","engineVersion":"engine-kernel-v1.37-candidate-1","runtimeAbiVersion":"strategy-runtime-abi-v1.17","chronicleVersion":"chronicle-recorder-current-events-v1.37-candidate-1","conformanceCertificateVersion":"runtime-conformance-certificate-v1.17","conformanceCorpusVersion":"v2","conformanceCorpusRoot":"sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2","conformanceTraceVersion":"v1.37-conformance-trace-v3","conformanceTraceRoot":"sha256:53ac4a34b8ea3a52b65b566dfb1da94cbc36ce220c590fe46c0bf43489668696","workshopContractVersion":"workshop-contract-v1.17","workshopContractRoot":"sha256:1bed9b99ce512da13a3aa37554dc9b279f51dca619280ff3cbd85cc773ce18d3","arenaCatalogVersion":"semantic-arena-catalog-v1.37-candidate-1","setPolicyVersion":"canonical-set-policy-v1.4","strategyRevisionEvidencePolicy":"phase259-explicit-current-evidence-v1"}'::jsonb,
  'sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a'
);

insert into semantic_authority_selection_history (
  transition_kind, state, revision, active_selection, active_selection_root
)
select 'bootstrap', state, revision, active_selection, active_selection_root
  from semantic_authority_selection_head where singleton = true;

alter table match_sets
  add column semantic_authority_selection jsonb,
  add column semantic_authority_selection_root text,
  add constraint match_sets_semantic_authority_selection_all_or_none check (
    num_nonnulls(
      semantic_authority_selection,
      semantic_authority_selection_root
    ) in (0, 2)
  ) not valid,
  add constraint match_sets_semantic_authority_selection_exact check (
    semantic_authority_selection is null
    or semantic_authority_selection_is_exact(
      semantic_authority_selection,
      semantic_authority_selection_root
    )
  ) not valid,
  add constraint match_sets_v1_19_semantic_authority_exact check (
    compatibility_runtime_abi_version is distinct from 'strategy-runtime-abi-v1.19'
    or (
      semantic_authority_selection =
        '{"schemaVersion":"semantic-authority-selection-v1","semanticAuthorityKey":"runtime-v1.19","tupleId":"sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73","rulesVersion":"cowards-rules-v1.4","engineVersion":"engine-kernel-v1.37-candidate-1","runtimeAbiVersion":"strategy-runtime-abi-v1.19","chronicleVersion":"chronicle-recorder-current-events-v1.37-candidate-1","conformanceCertificateVersion":"runtime-conformance-certificate-v1.19","conformanceCorpusVersion":"v3","conformanceCorpusRoot":"sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d","conformanceTraceVersion":"v1.37-observation-trace-v4","conformanceTraceRoot":"sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a","workshopContractVersion":"workshop-contract-v1.19","workshopContractRoot":"sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d","arenaCatalogVersion":"canonical-arena-catalog-v1.37","setPolicyVersion":"canonical-set-policy-v1.37-four-condition-v1","strategyRevisionEvidencePolicy":"strategy-revision-v1.19-revalidation-v1"}'::jsonb
      and semantic_authority_selection_root =
        'sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2'
    )
  ) not valid;

alter table matches
  add column semantic_authority_selection_root text,
  add constraint matches_semantic_authority_selection_root_exact check (
    semantic_authority_selection_root is null or
    semantic_authority_selection_root in (
      'sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a',
      'sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2'
    )
  ) not valid,
  add constraint matches_v1_19_semantic_authority_exact check (
    successor_scenario_id is null or
    semantic_authority_selection_root =
      'sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2'
  ) not valid;

alter table match_jobs
  add column semantic_authority_selection_root text,
  add constraint match_jobs_semantic_authority_selection_root_exact check (
    semantic_authority_selection_root is null or
    semantic_authority_selection_root in (
      'sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a',
      'sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2'
    )
  ) not valid;

create function validate_frozen_semantic_authority_root()
returns trigger language plpgsql as $$
declare
  parent_root text;
begin
  if tg_table_name = 'matches' and new.semantic_authority_selection_root is not null then
    if new.successor_match_set_id is not null then
      select semantic_authority_selection_root into parent_root
        from match_sets where id = new.successor_match_set_id;
      if parent_root is distinct from new.semantic_authority_selection_root then
        raise exception 'Match semantic authority root must match its MatchSet';
      end if;
    end if;
  elsif tg_table_name = 'match_jobs' and new.semantic_authority_selection_root is not null then
    select semantic_authority_selection_root into parent_root
      from matches where id = new.match_id;
    if parent_root is distinct from new.semantic_authority_selection_root then
      raise exception 'job semantic authority root must match its Match';
    end if;
  end if;
  return new;
end;
$$;

create function prevent_frozen_semantic_authority_rewrite()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'match_sets' then
    if old.semantic_authority_selection_root is not null and (
      old.semantic_authority_selection is distinct from new.semantic_authority_selection
      or old.semantic_authority_selection_root is distinct from new.semantic_authority_selection_root
    ) then
      raise exception 'frozen MatchSet semantic authority is immutable';
    end if;
  elsif old.semantic_authority_selection_root is not null and
        old.semantic_authority_selection_root is distinct from
          new.semantic_authority_selection_root then
    raise exception 'frozen semantic authority root is immutable';
  end if;
  return new;
end;
$$;

create trigger match_sets_semantic_authority_immutable
before update on match_sets
for each row execute function prevent_frozen_semantic_authority_rewrite();

create trigger matches_semantic_authority_validate
before insert or update on matches
for each row execute function validate_frozen_semantic_authority_root();

create trigger matches_semantic_authority_immutable
before update on matches
for each row execute function prevent_frozen_semantic_authority_rewrite();

create trigger match_jobs_semantic_authority_validate
before insert or update on match_jobs
for each row execute function validate_frozen_semantic_authority_root();

create trigger match_jobs_semantic_authority_immutable
before update on match_jobs
for each row execute function prevent_frozen_semantic_authority_rewrite();
