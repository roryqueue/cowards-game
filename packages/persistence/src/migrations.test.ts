import {
  BOTTOM_STARTING_POSITIONS,
  TOP_STARTING_POSITIONS,
  type BoardBounds,
  type Position,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { Pool } from "pg"
import { createDevelopmentSeedData } from "./seed.js"
import {
  migrate,
  migrationsDirectory,
  readMigrationFiles,
} from "./migrations.js"

const databaseUrl = process.env.DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip

const requiredTables = [
  "users",
  "strategies",
  "strategy_revisions",
  "arena_variants",
  "matches",
  "match_sets",
  "match_set_matches",
  "chronicles",
  "match_jobs",
  "match_job_attempts",
]

const containsPosition = (bounds: BoardBounds, position: Position): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

describe("migrations", () => {
  it("reads migration files in lexical order", async () => {
    const files = await readMigrationFiles()
    const names = files.map((file) => file.name)

    expect(names).toContain("0001_initial.sql")
    expect(names).toContain("0002_match_side_completion_stats.sql")
    expect(names).toContain("0011_competition_governance_surfaces.sql")
    expect(names).toContain("0012_integrity_authority.sql")
    expect(names).toContain("0013_runtime_evidence_authority_publication.sql")
    expect(names).toContain("0014_matchset_authority_install_receipts.sql")
    expect(names).toContain("0018_strategy_revision_source_identity.sql")
    expect(names).toContain(
      "0019_strategy_revision_source_identity_hardening.sql",
    )
    expect(names).toContain("0020_runtime_evidence_v1_17_graph.sql")
    expect(names).toContain("0021_runtime_abi_v1_17_activation.sql")
    expect(names).toContain(
      "0022_runtime_evidence_v1_17_installed_authority.sql",
    )
    expect(names).toContain("0023_runtime_conformance_certificates.sql")
    expect(names).toEqual([...names].sort())
  })

  it("extends the existing certificate ledger with exact Phase-259 provenance", async () => {
    const sql = await readFile(
      new URL("0023_runtime_conformance_certificates.sql", migrationsDirectory),
      "utf8",
    )
    for (const required of [
      "alter table runtime_evidence_certificates",
      "exact_certificate_bytes",
      "exact_certificate_sha256",
      "conformance_language_id",
      "conformance_fixture_source_sha256",
      "conformance_artifact_sha256",
      "conformance_runtime_executable_sha256",
      "conformance_toolchain_sha256",
      "conformance_identity_manifest_root",
      "conformance_evidence_graph_root",
      "conformance_result_root_sha256",
      "conformance_evidence_root_sha256",
      "runtime_evidence_conformance_certificate_runs",
      "reject_integrity_authority_mutation",
    ]) {
      expect(sql).toContain(required)
    }
    expect(sql).toContain("conformance_run_count = 3")
    expect(sql).toContain("skipped_case_count = 0")
    expect(sql).toContain("not fallback_used")
    expect(sql).toContain("not synthetic_evidence")
    expect(sql).not.toMatch(
      /create table runtime_evidence_conformance_certificates/iu,
    )
    expect(sql).not.toMatch(/update\s+runtime_evidence_/iu)
    expect(sql).not.toMatch(/insert\s+into\s+runtime_evidence_/iu)
  })

  it("stores v1.17 installed authority independently from legacy publication bytes", async () => {
    const sql = await readFile(
      new URL(
        "0022_runtime_evidence_v1_17_installed_authority.sql",
        migrationsDirectory,
      ),
      "utf8",
    )
    for (const required of [
      "runtime_evidence_v1_17_installed_authorities",
      "authority_bundle_hash",
      "source_manifest_hash",
      "registry_generation",
      "semantic_tuple_manifest_hash",
      "envelope_sha256",
      "install_receipt_id",
      "install_receipt_hash",
      "payload_bytes",
      "envelope_bytes",
      "certificate_ids",
      "reject_integrity_authority_mutation",
    ])
      expect(sql).toContain(required)
    expect(sql).toContain(
      "trust_domain = 'cowards-game:runtime-evidence-authority:production:v1'",
    )
    expect(sql).not.toMatch(
      /insert\s+into\s+runtime_evidence_v1_17_installed_authorities/iu,
    )
  })

  it("binds new v1.17 receipts without rewriting v1.16 Chronicle evidence", async () => {
    const sql = await readFile(
      new URL("0021_runtime_abi_v1_17_activation.sql", migrationsDirectory),
      "utf8",
    )
    expect(sql).toContain("runtime_semantic_receipt_version")
    expect(sql).toContain("runtime-semantic-receipt-v1.17")
    expect(sql).toContain("runtime_semantic_receipt ->> 'schemaVersion'")
    expect(sql).toContain(
      "persisted Chronicle runtime semantic receipt is immutable",
    )
    expect(sql).not.toMatch(/update\s+chronicles\s+set/iu)
  })

  it("adds an all-or-none immutable v1.17 graph binding without rewriting legacy rows", async () => {
    const sql = await readFile(
      new URL("0020_runtime_evidence_v1_17_graph.sql", migrationsDirectory),
      "utf8",
    )
    for (const column of [
      "graph_schema_version",
      "graph_profile",
      "identity_manifest_root",
      "evidence_graph_root",
      "exact_pin_expansion",
    ])
      expect(sql).toContain(column)
    expect(sql).toContain("num_nonnulls")
    expect(sql).toContain("jsonb_array_length(exact_pin_expansion) = 10")
    expect(sql).not.toMatch(/update\s+runtime_evidence_/iu)
  })

  it("defines the additive all-or-none source identity v2 group without legacy backfill", async () => {
    const sql = await readFile(
      new URL(
        "0018_strategy_revision_source_identity.sql",
        migrationsDirectory,
      ),
      "utf8",
    )
    for (const column of [
      "source_identity_version",
      "original_source_hash",
      "original_source_bytes",
      "normalized_source_hash",
      "normalized_source_bytes",
      "source_normalization_policy",
      "source_line_endings",
      "source_has_final_newline",
    ]) {
      expect(sql).toContain(column)
    }
    expect(sql).toContain("num_nonnulls")
    expect(sql).toContain("strategy_revisions_source_identity_v2_shape")
    expect(sql).toContain(
      "old.source_identity_version is not null and old.source is distinct from new.source",
    )
    expect(sql).toContain("source identity v2 is immutable")
    expect(sql).not.toMatch(
      /update\s+strategy_revisions\s+set\s+source_identity_version/iu,
    )
  })

  it("puts post-release source identity hardening in follow-on migration 0019", async () => {
    const original = await readFile(
      new URL(
        "0018_strategy_revision_source_identity.sql",
        migrationsDirectory,
      ),
      "utf8",
    )
    const hardening = await readFile(
      new URL(
        "0019_strategy_revision_source_identity_hardening.sql",
        migrationsDirectory,
      ),
      "utf8",
    )
    expect(original).toContain(
      "old.source_identity_version is not null and old.source is distinct from new.source",
    )
    expect(original).not.toContain(
      "source_line_endings - 'kind' - 'lf' - 'crlf' - 'cr'",
    )
    expect(hardening).toContain(
      "source_line_endings - 'kind' - 'lf' - 'crlf' - 'cr'",
    )
    expect(hardening).toContain("old.source is distinct from new.source")
    expect(hardening).not.toMatch(
      /update\s+strategy_revisions\s+set\s+source_identity_version/iu,
    )
  })

  it("defines report deduplication and append-only governance audit", async () => {
    const sql = await readFile(
      new URL("0011_competition_governance_surfaces.sql", migrationsDirectory),
      "utf8",
    )
    expect(sql).toContain("create table if not exists competition_reports")
    expect(sql).toContain("where status = 'open'")
    expect(sql).toContain("'disputed'")
    expect(sql).toContain("governance_changed_at")
    expect(sql).toContain("before update or delete on competition_audit_events")
  })

  it("initial schema defines every Phase 5 persistence table", async () => {
    const sql = await readFile(
      new URL("0001_initial.sql", migrationsDirectory),
      "utf8",
    )

    for (const table of requiredTables) {
      expect(sql).toContain(`create table ${table}`)
    }
  })

  it("defines exact per-entrant identity and append-only integrity authority", async () => {
    const sql = await readFile(
      new URL("0012_integrity_authority.sql", migrationsDirectory),
      "utf8",
    )

    expect(sql).toContain("match_set_execution_entrants")
    expect(sql).toContain("compatibility_tuple_id")
    expect(sql).toContain("execution_evidence_set_hash")
    expect(sql).toContain("bottom_execution_entrant_key")
    expect(sql).toContain("top_execution_entrant_key")
    expect(sql).toContain("runtime_evidence_verified_attestations")
    expect(sql).toContain("runtime_evidence_certificates")
    expect(sql).toContain("verified_attestation_id")
    expect(sql).toContain("canonical_release_manifests")
    expect(sql).toContain("runtime_lane_control_events")
    expect(sql).toContain("integrity_cohort_classification_events")
    expect(sql).toContain("integrity_compensation_events")
    expect(sql).toContain("reject_integrity_authority_mutation")
    expect(sql).toMatch(
      /before update or delete on runtime_evidence_certificates/u,
    )
    expect(sql).toContain("derived_certificate_record_hash")
    expect(sql).toContain("containment_certificate_kind")
    expect(sql).toContain("conformance_certificate_kind")
    expect(sql).toContain("prevent_match_set_integrity_identity_rewrite")
    expect(sql).toContain("prevent_ordered_execution_evidence_rewrite")
    expect(sql).toContain("prevent_competition_entrant_evidence_rewrite")
    expect(sql).not.toContain("prevent_integrity_identity_rewrite")
    expect(sql).not.toMatch(
      /compatibility_tuple_id\s+text\s+not null\s+default/iu,
    )
  })

  it("binds MatchSets to exact installed authority receipts", async () => {
    const sql = await readFile(
      new URL(
        "0014_matchset_authority_install_receipts.sql",
        migrationsDirectory,
      ),
      "utf8",
    )

    expect(sql).toContain("authority_publication_id")
    expect(sql).toContain("authority_install_receipt_id")
    expect(sql).toContain("authority_payload_sha256")
    expect(sql).toContain("authority_envelope_sha256")
    expect(sql).toContain("authority_source_manifest_hash")
    expect(sql).toContain("authority_source_set")
    expect(sql).toContain("prevent_match_set_authority_receipt_rewrite")
    expect(sql).toContain(
      "alter column conformance_certificate_id drop not null",
    )
    expect(sql).toContain("match_set_execution_entrants_purpose_floor")
  })
})

describeDatabase("source identity hardening migration upgrade", () => {
  it("applies 0019 when 0018 is already recorded and hardens legacy rows", async () => {
    const schema = `phase258_0019_${randomUUID().replaceAll("-", "")}`
    const admin = new Pool({ connectionString: databaseUrl!, max: 1 })
    await admin.query(`create schema ${schema}`)
    const pool = new Pool({
      connectionString: databaseUrl!,
      max: 1,
      options: `-c search_path=${schema}`,
    })
    try {
      await pool.query(`
        create table strategy_revisions (
          id text primary key,
          source text not null,
          source_identity_version text,
          original_source_hash text,
          original_source_bytes integer,
          normalized_source_hash text,
          normalized_source_bytes integer,
          source_normalization_policy text,
          source_line_endings jsonb,
          source_has_final_newline boolean
        );
        alter table strategy_revisions
          add constraint strategy_revisions_source_identity_all_or_none
          check (
            num_nonnulls(
              source_identity_version, original_source_hash,
              original_source_bytes, normalized_source_hash,
              normalized_source_bytes, source_normalization_policy,
              source_line_endings, source_has_final_newline
            ) in (0, 8)
          ),
          add constraint strategy_revisions_source_identity_v2_shape
          check (
            source_identity_version is null or (
              source_identity_version = 'strategy-source-identity-v2' and
              original_source_hash ~ '^[0-9a-f]{64}$' and
              original_source_bytes = octet_length(source) and
              normalized_source_hash ~ '^[0-9a-f]{64}$' and
              normalized_source_bytes >= 0 and
              source_normalization_policy = 'source-line-endings-lf-v1.17' and
              jsonb_typeof(source_line_endings) = 'object'
            )
          );
        create function prevent_strategy_revision_source_identity_update()
        returns trigger language plpgsql as $$
        begin
          if old.source_identity_version is distinct from new.source_identity_version or
             old.original_source_hash is distinct from new.original_source_hash or
             old.original_source_bytes is distinct from new.original_source_bytes or
             old.normalized_source_hash is distinct from new.normalized_source_hash or
             old.normalized_source_bytes is distinct from new.normalized_source_bytes or
             old.source_normalization_policy is distinct from new.source_normalization_policy or
             old.source_line_endings is distinct from new.source_line_endings or
             old.source_has_final_newline is distinct from new.source_has_final_newline or
             (old.source_identity_version is not null and old.source is distinct from new.source)
          then
            raise exception 'source identity v2 is immutable';
          end if;
          return new;
        end;
        $$;
        create trigger strategy_revisions_source_identity_immutable
        before update on strategy_revisions for each row
        execute function prevent_strategy_revision_source_identity_update();
        insert into strategy_revisions (id, source) values ('legacy', 'legacy');
        create table schema_migrations (
          filename text primary key,
          applied_at timestamptz not null default now()
        );
      `)
      const files = await readMigrationFiles()
      for (const file of files) {
        if (
          file.name !== "0019_strategy_revision_source_identity_hardening.sql"
        ) {
          await pool.query(
            "insert into schema_migrations (filename) values ($1)",
            [file.name],
          )
        }
      }

      const result = await migrate(pool)
      expect(result.applied).toEqual([
        "0019_strategy_revision_source_identity_hardening.sql",
      ])
      await expect(
        pool.query(
          "update strategy_revisions set source = 'rewritten' where id = 'legacy'",
        ),
      ).rejects.toThrow(/immutable/iu)
      await expect(
        pool.query(
          `insert into strategy_revisions (
             id, source, source_identity_version, original_source_hash,
             original_source_bytes, normalized_source_hash,
             normalized_source_bytes, source_normalization_policy,
             source_line_endings, source_has_final_newline
           ) values (
             'bad', 'a\\nb', 'strategy-source-identity-v2', $1, 4, $2, 4,
             'source-line-endings-lf-v1.17',
             '{"kind":"lf","lf":0,"crlf":0,"cr":0,"extra":1}'::jsonb,
             false
           )`,
          ["a".repeat(64), "b".repeat(64)],
        ),
      ).rejects.toThrow(/source_identity_v2_shape/iu)
    } finally {
      await pool.end()
      await admin.query(`drop schema if exists ${schema} cascade`)
      await admin.end()
    }
  })
})

describeDatabase("runtime semantic receipt v1.17 migration", () => {
  it("requires the exact version binding for new v1.17 receipts and preserves v1.16 rows", async () => {
    const schema = `phase258_0021_${randomUUID().replaceAll("-", "")}`
    const admin = new Pool({ connectionString: databaseUrl!, max: 1 })
    await admin.query(`create schema ${schema}`)
    const pool = new Pool({
      connectionString: databaseUrl!,
      max: 1,
      options: `-c search_path=${schema}`,
    })
    try {
      await pool.query(`
        create table chronicles (
          id text primary key,
          runtime_semantic_receipt jsonb,
          runtime_semantic_receipt_hash text
        );
        insert into chronicles (
          id, runtime_semantic_receipt, runtime_semantic_receipt_hash
        ) values (
          'historical-v1.16',
          '{"schemaVersion":"runtime-semantic-receipt-v1.16"}'::jsonb,
          'sha256:${"1".repeat(64)}'
        );
        create table schema_migrations (
          filename text primary key,
          applied_at timestamptz not null default now()
        );
      `)
      for (const file of await readMigrationFiles()) {
        if (file.name !== "0021_runtime_abi_v1_17_activation.sql") {
          await pool.query(
            "insert into schema_migrations (filename) values ($1)",
            [file.name],
          )
        }
      }

      const result = await migrate(pool)
      expect(result.applied).toEqual(["0021_runtime_abi_v1_17_activation.sql"])
      const historical = await pool.query<{
        runtime_semantic_receipt_version: string | null
      }>(
        "select runtime_semantic_receipt_version from chronicles where id = 'historical-v1.16'",
      )
      expect(historical.rows[0]?.runtime_semantic_receipt_version).toBeNull()
      await expect(
        pool.query(
          `insert into chronicles (
             id, runtime_semantic_receipt, runtime_semantic_receipt_hash
           ) values (
             'unbound-v1.17',
             '{"schemaVersion":"runtime-semantic-receipt-v1.17"}'::jsonb,
             'sha256:${"2".repeat(64)}'
           )`,
        ),
      ).rejects.toThrow(/runtime_semantic_receipt_v1_17_binding/iu)
      await pool.query(
        `insert into chronicles (
           id, runtime_semantic_receipt, runtime_semantic_receipt_hash,
           runtime_semantic_receipt_version
         ) values (
           'bound-v1.17',
           '{"schemaVersion":"runtime-semantic-receipt-v1.17"}'::jsonb,
           'sha256:${"3".repeat(64)}',
           'runtime-semantic-receipt-v1.17'
         )`,
      )
      await expect(
        pool.query(
          `update chronicles
           set runtime_semantic_receipt = runtime_semantic_receipt || '{"changed":true}'::jsonb,
               runtime_semantic_receipt_hash = 'sha256:${"4".repeat(64)}'
           where id = 'bound-v1.17'`,
        ),
      ).rejects.toThrow(/immutable/iu)
    } finally {
      await pool.end()
      await admin.query(`drop schema if exists ${schema} cascade`)
      await admin.end()
    }
  })
})

describe("development seed data", () => {
  it("includes deterministic local data for development smoke runs", () => {
    const seed = createDevelopmentSeedData()

    expect(seed.users).toHaveLength(1)
    expect(seed.strategies.map((strategy) => strategy.id)).toEqual([
      "strategy:cautious",
      "strategy:reckless",
    ])
    expect(seed.revisions).toHaveLength(2)
    expect(seed.arenas.map((arena) => arena.id)).toContain("arena:smoke:v1")
    expect(seed.matchSets[0]?.matrix[0]?.seed).toBe("seed:smoke:001")
  })

  it("keeps every seeded arena compatible with canonical starting positions", () => {
    const seed = createDevelopmentSeedData()
    const startingPositions = [
      ...BOTTOM_STARTING_POSITIONS,
      ...TOP_STARTING_POSITIONS,
    ]

    for (const arena of seed.arenas) {
      for (const position of startingPositions) {
        expect(
          containsPosition(arena.initialBounds, position),
          `${arena.id} initial bounds must contain (${position.x}, ${position.y})`,
        ).toBe(true)
      }
    }
  })
})
