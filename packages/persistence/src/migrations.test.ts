import {
  BOTTOM_STARTING_POSITIONS,
  TOP_STARTING_POSITIONS,
  type BoardBounds,
  type Position,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { createDevelopmentSeedData } from "./seed.js"
import { migrationsDirectory, readMigrationFiles } from "./migrations.js"

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
    expect(names).toEqual([...names].sort())
  })

  it("defines an all-or-none immutable source identity v2 group without legacy backfill", async () => {
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
    expect(sql).toContain("source_line_endings - 'kind' - 'lf' - 'crlf' - 'cr'")
    expect(sql).toContain("normalized_source_bytes = octet_length")
    expect(sql).toContain("source_has_final_newline =")
    expect(sql).toContain("old.source is distinct from new.source")
    expect(sql).toContain("source identity v2 is immutable")
    expect(sql).not.toMatch(
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
