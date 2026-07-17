-- Additive v1.19 candidate persistence. Historical arena, MatchSet, Match,
-- Chronicle, certificate, receipt, and Strategy Revision rows remain unchanged.

create table arena_catalog_entries (
  catalog_version text not null,
  arena_id text not null,
  arena_version text not null,
  arena_name text not null,
  arena_status text not null check (arena_status in ('active', 'historical_alias')),
  schedulable boolean not null,
  alias_of_arena_id text,
  geometry_hash_profile text not null,
  semantic_geometry_hash text not null
    check (semantic_geometry_hash ~ '^sha256:[0-9a-f]{64}$'),
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  created_at timestamptz not null default now(),
  primary key (catalog_version, arena_id),
  unique (catalog_version, arena_id, semantic_geometry_hash),
  check (
    (arena_status = 'active' and schedulable and alias_of_arena_id is null)
    or
    (arena_status = 'historical_alias' and not schedulable and alias_of_arena_id is not null)
  ),
  check (alias_of_arena_id is null or alias_of_arena_id <> arena_id),
  check (config->>'id' = arena_id),
  check (config->>'version' = arena_version),
  check (config->>'name' = arena_name),
  check (config->>'status' = arena_status),
  check ((config->>'schedulable')::boolean = schedulable),
  check (config->>'semanticGeometryHash' = semantic_geometry_hash),
  foreign key (catalog_version, alias_of_arena_id)
    references arena_catalog_entries(catalog_version, arena_id)
    deferrable initially deferred
);

create unique index arena_catalog_active_geometry_unique
  on arena_catalog_entries(catalog_version, semantic_geometry_hash)
  where arena_status = 'active' and schedulable;

create function validate_arena_catalog_alias()
returns trigger language plpgsql as $$
declare
  target arena_catalog_entries%rowtype;
begin
  if new.arena_status = 'historical_alias' then
    select * into target
      from arena_catalog_entries
     where catalog_version = new.catalog_version
       and arena_id = new.alias_of_arena_id;
    if not found or target.arena_status <> 'active' or not target.schedulable or
       target.semantic_geometry_hash <> new.semantic_geometry_hash then
      raise exception 'arena alias must bind an exact active semantic geometry';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger arena_catalog_alias_exact
after insert on arena_catalog_entries
deferrable initially deferred
for each row execute function validate_arena_catalog_alias();

create trigger arena_catalog_entries_append_only
before update or delete on arena_catalog_entries
for each row execute function reject_integrity_authority_mutation();

create table set_scenarios (
  match_set_id text not null references match_sets(id) on delete cascade,
  scenario_id text not null
    check (scenario_id ~ '^set-scenario:sha256:[0-9a-f]{64}$'),
  set_policy_version text not null,
  arena_catalog_version text not null,
  arena_id text not null,
  arena_semantic_geometry_hash text not null
    check (arena_semantic_geometry_hash ~ '^sha256:[0-9a-f]{64}$'),
  entrant_a_key text not null,
  entrant_b_key text not null,
  entrant_a_player_id text not null,
  entrant_b_player_id text not null,
  base_seed text not null,
  created_at timestamptz not null default now(),
  primary key (match_set_id, scenario_id),
  unique (
    match_set_id,
    scenario_id,
    arena_catalog_version,
    arena_semantic_geometry_hash
  ),
  check (entrant_a_key <> entrant_b_key),
  check (entrant_a_player_id <> entrant_b_player_id),
  foreign key (arena_catalog_version, arena_id, arena_semantic_geometry_hash)
    references arena_catalog_entries(
      catalog_version,
      arena_id,
      semantic_geometry_hash
    )
);

create function validate_set_scenario_arena()
returns trigger language plpgsql as $$
declare
  catalog_status text;
  catalog_schedulable boolean;
begin
  select arena_status, schedulable
    into catalog_status, catalog_schedulable
    from arena_catalog_entries
   where catalog_version = new.arena_catalog_version
     and arena_id = new.arena_id
     and semantic_geometry_hash = new.arena_semantic_geometry_hash
   for key share;
  if not found or catalog_status <> 'active' or not catalog_schedulable then
    raise exception 'Set scenario requires an exact active schedulable arena';
  end if;
  return new;
end;
$$;

create trigger set_scenarios_validate_arena
before insert on set_scenarios
for each row execute function validate_set_scenario_arena();

create trigger set_scenarios_append_only
before update or delete on set_scenarios
for each row execute function reject_integrity_authority_mutation();

create table set_conditions (
  match_set_id text not null,
  scenario_id text not null,
  condition_id text not null
    check (condition_id ~ '^set-condition:sha256:[0-9a-f]{64}$'),
  condition_ordinal integer not null check (condition_ordinal between 0 and 3),
  condition_suffix text not null check (condition_suffix in (
    'a-bottom-a-first',
    'a-bottom-b-first',
    'a-top-a-first',
    'a-top-b-first'
  )),
  request_identity text not null
    check (request_identity ~ '^set-request:sha256:[0-9a-f]{64}$'),
  arena_catalog_version text not null,
  arena_semantic_geometry_hash text not null
    check (arena_semantic_geometry_hash ~ '^sha256:[0-9a-f]{64}$'),
  bottom_entrant_key text not null,
  top_entrant_key text not null,
  initial_initiative_entrant_key text not null,
  bottom_player_id text not null,
  top_player_id text not null,
  initial_initiative_player_id text not null,
  created_at timestamptz not null default now(),
  primary key (match_set_id, scenario_id, condition_id),
  unique (match_set_id, scenario_id, condition_ordinal),
  unique (request_identity),
  unique (
    match_set_id,
    scenario_id,
    condition_id,
    condition_ordinal,
    arena_catalog_version,
    arena_semantic_geometry_hash,
    bottom_entrant_key,
    top_entrant_key,
    initial_initiative_entrant_key,
    initial_initiative_player_id
  ),
  check (bottom_entrant_key <> top_entrant_key),
  check (initial_initiative_entrant_key in (bottom_entrant_key, top_entrant_key)),
  check (initial_initiative_player_id in (bottom_player_id, top_player_id)),
  foreign key (
    match_set_id,
    scenario_id,
    arena_catalog_version,
    arena_semantic_geometry_hash
  ) references set_scenarios (
    match_set_id,
    scenario_id,
    arena_catalog_version,
    arena_semantic_geometry_hash
  )
);

create function validate_set_condition_membership()
returns trigger language plpgsql as $$
declare
  scenario set_scenarios%rowtype;
  expected_suffix text;
  expected_bottom_key text;
  expected_top_key text;
  expected_first_key text;
  expected_bottom_player text;
  expected_top_player text;
  expected_first_player text;
begin
  select * into scenario
    from set_scenarios
   where match_set_id = new.match_set_id and scenario_id = new.scenario_id
   for key share;
  if not found then
    raise exception 'Set condition requires an existing scenario';
  end if;

  case new.condition_ordinal
    when 0 then
      expected_suffix := 'a-bottom-a-first';
      expected_bottom_key := scenario.entrant_a_key;
      expected_top_key := scenario.entrant_b_key;
      expected_first_key := scenario.entrant_a_key;
      expected_bottom_player := scenario.entrant_a_player_id;
      expected_top_player := scenario.entrant_b_player_id;
      expected_first_player := scenario.entrant_a_player_id;
    when 1 then
      expected_suffix := 'a-bottom-b-first';
      expected_bottom_key := scenario.entrant_a_key;
      expected_top_key := scenario.entrant_b_key;
      expected_first_key := scenario.entrant_b_key;
      expected_bottom_player := scenario.entrant_a_player_id;
      expected_top_player := scenario.entrant_b_player_id;
      expected_first_player := scenario.entrant_b_player_id;
    when 2 then
      expected_suffix := 'a-top-a-first';
      expected_bottom_key := scenario.entrant_b_key;
      expected_top_key := scenario.entrant_a_key;
      expected_first_key := scenario.entrant_a_key;
      expected_bottom_player := scenario.entrant_b_player_id;
      expected_top_player := scenario.entrant_a_player_id;
      expected_first_player := scenario.entrant_a_player_id;
    when 3 then
      expected_suffix := 'a-top-b-first';
      expected_bottom_key := scenario.entrant_b_key;
      expected_top_key := scenario.entrant_a_key;
      expected_first_key := scenario.entrant_b_key;
      expected_bottom_player := scenario.entrant_b_player_id;
      expected_top_player := scenario.entrant_a_player_id;
      expected_first_player := scenario.entrant_b_player_id;
    else
      raise exception 'condition_ordinal must be between 0 and 3';
  end case;

  if new.condition_suffix <> expected_suffix or
     new.bottom_entrant_key <> expected_bottom_key or
     new.top_entrant_key <> expected_top_key or
     new.initial_initiative_entrant_key <> expected_first_key or
     new.bottom_player_id <> expected_bottom_player or
     new.top_player_id <> expected_top_player or
     new.initial_initiative_player_id <> expected_first_player then
    raise exception 'Set condition membership does not match canonical ordinal';
  end if;
  return new;
end;
$$;

create trigger set_conditions_validate_membership
before insert on set_conditions
for each row execute function validate_set_condition_membership();

create trigger set_conditions_append_only
before update or delete on set_conditions
for each row execute function reject_integrity_authority_mutation();

alter table matches
  add column successor_match_set_id text,
  add column successor_scenario_id text,
  add column successor_condition_id text,
  add column successor_condition_ordinal integer,
  add column successor_arena_catalog_version text,
  add column successor_arena_semantic_geometry_hash text,
  add column successor_bottom_entrant_key text,
  add column successor_top_entrant_key text,
  add column successor_initial_initiative_entrant_key text,
  add column initial_initiative_player_id text,
  add constraint matches_successor_identity_all_or_none check (
    num_nonnulls(
      successor_match_set_id,
      successor_scenario_id,
      successor_condition_id,
      successor_condition_ordinal,
      successor_arena_catalog_version,
      successor_arena_semantic_geometry_hash,
      successor_bottom_entrant_key,
      successor_top_entrant_key,
      successor_initial_initiative_entrant_key,
      initial_initiative_player_id
    ) in (0, 10)
  ) not valid,
  add constraint matches_successor_condition_ordinal check (
    successor_condition_ordinal is null or successor_condition_ordinal between 0 and 3
  ) not valid,
  add constraint matches_successor_condition_fk foreign key (
    successor_match_set_id,
    successor_scenario_id,
    successor_condition_id,
    successor_condition_ordinal,
    successor_arena_catalog_version,
    successor_arena_semantic_geometry_hash,
    successor_bottom_entrant_key,
    successor_top_entrant_key,
    successor_initial_initiative_entrant_key,
    initial_initiative_player_id
  ) references set_conditions (
    match_set_id,
    scenario_id,
    condition_id,
    condition_ordinal,
    arena_catalog_version,
    arena_semantic_geometry_hash,
    bottom_entrant_key,
    top_entrant_key,
    initial_initiative_entrant_key,
    initial_initiative_player_id
  ) not valid;

create function prevent_match_successor_identity_rewrite()
returns trigger language plpgsql as $$
begin
  if old.successor_scenario_id is not null and (
    old.successor_match_set_id is distinct from new.successor_match_set_id or
    old.successor_scenario_id is distinct from new.successor_scenario_id or
    old.successor_condition_id is distinct from new.successor_condition_id or
    old.successor_condition_ordinal is distinct from new.successor_condition_ordinal or
    old.successor_arena_catalog_version is distinct from new.successor_arena_catalog_version or
    old.successor_arena_semantic_geometry_hash is distinct from new.successor_arena_semantic_geometry_hash or
    old.successor_bottom_entrant_key is distinct from new.successor_bottom_entrant_key or
    old.successor_top_entrant_key is distinct from new.successor_top_entrant_key or
    old.successor_initial_initiative_entrant_key is distinct from new.successor_initial_initiative_entrant_key or
    old.initial_initiative_player_id is distinct from new.initial_initiative_player_id
  ) then
    raise exception 'persisted successor Match condition identity is immutable';
  end if;
  return new;
end;
$$;

create trigger matches_successor_identity_immutable
before update on matches
for each row execute function prevent_match_successor_identity_rewrite();

create table strategy_revision_v1_19_revalidations (
  id text primary key,
  strategy_revision_id text not null references strategy_revisions(id),
  source_hash text not null check (source_hash ~ '^[0-9a-f]{64}$'),
  source_bytes integer not null check (source_bytes >= 0),
  artifact_sha256 text not null check (artifact_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  artifact_bytes integer not null check (artifact_bytes > 0),
  language_id text not null check (language_id in ('typescript', 'python', 'rust', 'zig')),
  provider_id text not null,
  lane_id text not null,
  runtime_abi_version text not null check (
    runtime_abi_version = 'strategy-runtime-abi-v1.19'
  ),
  semantic_runtime_version text not null check (
    semantic_runtime_version = 'runtime-v1.19'
  ),
  semantic_tuple_id text not null check (semantic_tuple_id ~ '^sha256:[0-9a-f]{64}$'),
  execution_kind text not null check (execution_kind = 'real_service_execution'),
  synthetic_evidence boolean not null check (not synthetic_evidence),
  execution_request_root text not null check (execution_request_root ~ '^sha256:[0-9a-f]{64}$'),
  execution_result_root text not null check (execution_result_root ~ '^sha256:[0-9a-f]{64}$'),
  execution_receipt_root text not null check (execution_receipt_root ~ '^sha256:[0-9a-f]{64}$'),
  service_receipt_version text not null check (
    service_receipt_version = 'runtime-semantic-receipt-v1.19'
  ),
  reviewed_certificate_id text not null,
  reviewed_certificate_sha256 text not null
    check (reviewed_certificate_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  review_status text not null check (review_status = 'reviewed'),
  evidence_status text not null check (evidence_status = 'passed'),
  evidence_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (strategy_revision_id, semantic_runtime_version),
  unique (execution_receipt_root),
  check (evidence_created_at <= created_at)
);

create function validate_strategy_revision_v1_19_revalidation()
returns trigger language plpgsql as $$
declare
  revision strategy_revisions%rowtype;
  persisted_artifact_hash text;
  persisted_artifact_bytes integer;
begin
  select * into revision
    from strategy_revisions
   where id = new.strategy_revision_id
   for key share;
  if not found or revision.locked_at is null then
    raise exception 'runtime-v1.19 revalidation requires an immutable Strategy Revision';
  end if;
  if revision.source_hash <> new.source_hash or revision.source_bytes <> new.source_bytes then
    raise exception 'runtime-v1.19 revalidation source identity mismatch';
  end if;
  persisted_artifact_hash := coalesce(
    revision.compiled_artifact->>'hash',
    revision.metadata->'sourceArtifact'->>'artifactHash',
    revision.metadata->'sourceArtifact'->>'hash',
    revision.metadata->>'artifactHash'
  );
  if persisted_artifact_hash ~ '^[0-9a-f]{64}$' then
    persisted_artifact_hash := 'sha256:' || persisted_artifact_hash;
  end if;
  persisted_artifact_bytes := coalesce(
    (revision.compiled_artifact->>'bytes')::integer,
    (revision.metadata->'sourceArtifact'->>'bytes')::integer,
    (revision.metadata->>'artifactBytes')::integer,
    (revision.metadata->'providerValidation'->>'artifactBytes')::integer
  );
  if persisted_artifact_hash is null or
     persisted_artifact_hash <> new.artifact_sha256 or
     persisted_artifact_bytes is null or
     persisted_artifact_bytes <> new.artifact_bytes then
    raise exception 'runtime-v1.19 revalidation artifact identity mismatch';
  end if;
  if revision.runtime->'language'->>'id' is distinct from new.language_id or
     revision.metadata->'providerValidation'->>'providerId' is distinct from new.provider_id then
    raise exception 'runtime-v1.19 revalidation lane identity mismatch';
  end if;
  return new;
end;
$$;

create trigger strategy_revision_v1_19_revalidations_validate
before insert on strategy_revision_v1_19_revalidations
for each row execute function validate_strategy_revision_v1_19_revalidation();

create trigger strategy_revision_v1_19_revalidations_append_only
before update or delete on strategy_revision_v1_19_revalidations
for each row execute function reject_integrity_authority_mutation();

create table strategy_revision_v1_19_revalidation_revocations (
  id text primary key,
  revalidation_id text not null unique
    references strategy_revision_v1_19_revalidations(id),
  reason_code text not null,
  evidence_root text not null check (evidence_root ~ '^sha256:[0-9a-f]{64}$'),
  revoked_at timestamptz not null default now()
);

create trigger strategy_revision_v1_19_revalidation_revocations_append_only
before update or delete on strategy_revision_v1_19_revalidation_revocations
for each row execute function reject_integrity_authority_mutation();
