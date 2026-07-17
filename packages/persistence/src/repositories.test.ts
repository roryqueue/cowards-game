import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
} from "@cowards/spec"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { randomUUID } from "node:crypto"
import { Pool } from "pg"
import { migrate } from "./migrations.js"
import {
  createRepositories,
  type StrategyRevisionV119RevalidationInput,
} from "./repositories.js"

const databaseUrl = process.env.DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip

interface MutableArenaCatalog {
  catalogVersion: string
  arenas: Array<{
    name: string
    status: string
    aliasOf?: string
    semanticGeometryHash: string
  }>
}

describeDatabase("released arena catalog repositories", () => {
  let admin: Pool
  let pool: Pool
  let schema: string

  beforeAll(async () => {
    schema = `phase260_repositories_${randomUUID().replaceAll("-", "")}`
    admin = new Pool({ connectionString: databaseUrl!, max: 1 })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      max: 2,
      options: `-c search_path=${schema}`,
    })
    await migrate(pool)
  })

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema if exists ${schema} cascade`)
    await admin.end()
  })

  it("installs the exact released catalog idempotently and resolves aliases explicitly", async () => {
    const repositories = createRepositories(pool)
    const first = await repositories.installReleasedArenaCatalog(
      CANONICAL_ARENA_CATALOG_V1_37,
    )
    const second = await repositories.installReleasedArenaCatalog(
      CANONICAL_ARENA_CATALOG_V1_37,
    )

    expect(second).toEqual(first)
    expect(first).toHaveLength(3)
    expect(Object.isFrozen(first[0])).toBe(true)
    await expect(
      repositories.getReleasedArenaCatalogEntry(
        ARENA_CATALOG_VERSION_V1_37,
        "arena:smoke:v1",
      ),
    ).resolves.toMatchObject({
      arenaId: "arena:smoke:v1",
      status: "active",
      schedulable: true,
      aliasOfArenaId: null,
    })
    await expect(
      repositories.getReleasedArenaCatalogEntry(
        ARENA_CATALOG_VERSION_V1_37,
        "arena:open-field:v1",
      ),
    ).resolves.toMatchObject({
      arenaId: "arena:open-field:v1",
      status: "historical_alias",
      schedulable: false,
      aliasOfArenaId: "arena:smoke:v1",
    })
    await expect(
      repositories.getSchedulableArenaCatalogEntry(
        ARENA_CATALOG_VERSION_V1_37,
        "arena:open-field:v1",
      ),
    ).resolves.toBeNull()
  })

  it.each<[string, (catalog: MutableArenaCatalog) => void]>([
    ["config", (catalog: MutableArenaCatalog) => (catalog.arenas[0]!.name = "Changed")],
    ["status", (catalog: MutableArenaCatalog) => (catalog.arenas[0]!.status = "historical_alias")],
    ["alias", (catalog: MutableArenaCatalog) => (catalog.arenas[2]!.aliasOf = "arena:standard-cross:v1")],
    ["hash", (catalog: MutableArenaCatalog) => (catalog.arenas[0]!.semanticGeometryHash = `sha256:${"0".repeat(64)}`)],
    ["version", (catalog: MutableArenaCatalog) => (catalog.catalogVersion = "canonical-arena-catalog-v1.38")],
  ])("rejects changed released %s", async (_name, mutate) => {
    const repositories = createRepositories(pool)
    const changed = globalThis.structuredClone(
      CANONICAL_ARENA_CATALOG_V1_37,
    ) as unknown as MutableArenaCatalog
    mutate(changed)
    await expect(
      repositories.installReleasedArenaCatalog(changed),
    ).rejects.toThrow(/catalog|arena|geometry|alias|shape|mismatch/iu)
  })

  it("admits only exact non-revoked revision-scoped runtime-v1.19 evidence", async () => {
    const repositories = createRepositories(pool)
    const sourceHash = "a".repeat(64)
    const artifactSha256 = `sha256:${"b".repeat(64)}` as const
    await pool.query(
      "insert into users (id, display_name) values ('user:revalidation', 'Revalidation')",
    )
    await pool.query(
      `insert into strategies (id, owner_user_id, name)
         values ('strategy:revalidation', 'user:revalidation', 'Revalidation')`,
    )
    await pool.query(
      `insert into strategy_revisions (
         id, strategy_id, source, source_hash, source_bytes, runtime,
         engine_compatibility, validation, metadata, locked_at
       ) values (
         'revision:v1.19', 'strategy:revalidation', 'return {}', $1, 9,
         '{"language":{"id":"typescript"}}'::jsonb, '{}'::jsonb, '{}'::jsonb,
         jsonb_build_object(
           'artifactHash', $2::text,
           'artifactBytes', 9,
           'providerValidation', jsonb_build_object(
             'providerId', 'strategy-language-provider-js-ts',
             'artifactBytes', 9
           )
         ), now()
       )`,
      [sourceHash, artifactSha256],
    )
    await expect(
      repositories.getStrategyRevisionV119Admission("revision:v1.19"),
    ).resolves.toBeNull()

    const valid: StrategyRevisionV119RevalidationInput = {
      id: "revalidation:v1.19",
      strategyRevisionId: "revision:v1.19",
      sourceHash,
      sourceBytes: 9,
      artifactSha256,
      artifactBytes: 9,
      languageId: "typescript" as const,
      providerId: "strategy-language-provider-js-ts",
      laneId: "lane:typescript:v1.19",
      runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
      semanticRuntimeVersion: "runtime-v1.19" as const,
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      executionKind: "real_service_execution" as const,
      syntheticEvidence: false as const,
      executionRequestRoot: `sha256:${"c".repeat(64)}`,
      executionResultRoot: `sha256:${"d".repeat(64)}`,
      executionReceiptRoot: `sha256:${"e".repeat(64)}`,
      serviceReceiptVersion: "runtime-semantic-receipt-v1.19" as const,
      reviewedCertificateId: "certificate:typescript:v1.19",
      reviewedCertificateSha256: `sha256:${"f".repeat(64)}`,
      reviewStatus: "reviewed" as const,
      evidenceStatus: "passed" as const,
      evidenceCreatedAt: new Date(Date.now() - 1_000).toISOString(),
    }
    const admission = await repositories.appendStrategyRevisionV119Revalidation(
      valid,
    )
    expect(admission).toMatchObject({
      brand: "strategy-revision-v1.19-admission",
      strategyRevisionId: "revision:v1.19",
      semanticRuntimeVersion: "runtime-v1.19",
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
    })
    expect(Object.isFrozen(admission)).toBe(true)
    await expect(
      repositories.getStrategyRevisionV119Admission("revision:v1.19"),
    ).resolves.toEqual(admission)

    await pool.query(
      `insert into strategy_revisions (
         id, strategy_id, source, source_hash, source_bytes, runtime,
         engine_compatibility, validation, metadata, locked_at
       ) select
         'revision:sibling', strategy_id, source, source_hash, source_bytes,
         runtime, engine_compatibility, validation, metadata, now()
       from strategy_revisions where id = 'revision:v1.19'`,
    )
    await expect(
      repositories.appendStrategyRevisionV119Revalidation({
        ...valid,
        id: "revalidation:sibling-reused-receipt",
        strategyRevisionId: "revision:sibling",
      }),
    ).rejects.toThrow(/duplicate|unique|receipt/iu)
    await expect(
      repositories.getStrategyRevisionV119Admission("revision:sibling"),
    ).resolves.toBeNull()

    for (const changed of [
      { ...valid, id: "bad:abi", runtimeAbiVersion: "strategy-runtime-abi-v1.18" },
      { ...valid, id: "bad:tuple", semanticTupleId: `sha256:${"0".repeat(64)}` },
      { ...valid, id: "bad:source", sourceHash: "1".repeat(64) },
      { ...valid, id: "bad:artifact", artifactSha256: `sha256:${"2".repeat(64)}` },
      { ...valid, id: "bad:synthetic", syntheticEvidence: true },
      { ...valid, id: "bad:local", executionKind: "local_only" },
      { ...valid, id: "bad:incomplete", reviewedCertificateId: undefined },
    ]) {
      await expect(
        repositories.appendStrategyRevisionV119Revalidation(
          changed as unknown as typeof valid,
        ),
      ).rejects.toThrow(/runtime-v1.19|revalidation|identity|exact|duplicate/iu)
    }

    await repositories.revokeStrategyRevisionV119Revalidation({
      id: "revocation:v1.19",
      revalidationId: valid.id,
      reasonCode: "review-withdrawn",
      evidenceRoot: `sha256:${"9".repeat(64)}`,
    })
    await expect(
      repositories.getStrategyRevisionV119Admission("revision:v1.19"),
    ).resolves.toBeNull()
    await expect(
      repositories.appendStrategyRevisionV119Revalidation({
        ...valid,
        id: "revalidation:replacement",
        executionReceiptRoot: `sha256:${"8".repeat(64)}`,
      }),
    ).rejects.toThrow(/duplicate|unique|revalidation/iu)
  })
})
