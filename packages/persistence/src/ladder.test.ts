import { describe, expect, it } from "vitest"
import { Buffer } from "node:buffer"
import { createHash, createHmac } from "node:crypto"
import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_RUNTIME_ABI_VERSION,
  defaultRuntimeMetadata,
  getCountedEntryEligibilityPublicCopy,
  type CountedEntryEligibilityCategory,
  type StrategyRuntimeAdapterId,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"
import type { Pool } from "pg"
import { readFileSync } from "node:fs"
import {
  LadderInputError,
  assertLadderEligibleRuntime,
  DEFAULT_LADDER_MINIMUM_ENTRIES,
  DEFAULT_LADDER_TARGET_POD_SIZE,
  enterTrialLadderSeason,
  evaluateCountedEntryEligibility,
  scheduleTrialLadderSeason,
  setTrialLadderSeasonStatus,
  trialLadderStatusLabel,
} from "./ladder.js"

const TEST_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.33"

const ARTIFACT_BYTES_FIELD = "bytes" + "Base64"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET = TEST_PROVIDER_VALIDATION_SECRET

const providerProof = (input: {
  providerId: string
  sourceHash: string
  sourceBytes: number
  artifactHash: string
  artifactBytes: number
}): string =>
  `hmac-sha256:${createHmac("sha256", TEST_PROVIDER_VALIDATION_SECRET)
    .update(
      [
        input.providerId,
        "strategy-language-provider-contract-v1.33",
        input.sourceHash,
        String(input.sourceBytes),
        input.artifactHash,
        String(input.artifactBytes),
      ].join("\n"),
    )
    .digest("hex")}`

const artifactRecord = (payload: string) => {
  const artifactPayload = Buffer.from(payload)
  return {
    hash: createHash("sha256").update(artifactPayload).digest("hex"),
    bytes: artifactPayload.byteLength,
    [ARTIFACT_BYTES_FIELD]: artifactPayload.toString("base64"),
  }
}

const runtimeFor = (
  languageId: StrategyRuntimeMetadata["language"]["id"] | "tinygo",
  overrides: Partial<StrategyRuntimeMetadata> = {},
): StrategyRuntimeMetadata => {
  const adapterByLanguage: Record<string, StrategyRuntimeAdapterId> = {
    javascript: "runtime-js-worker-thread",
    typescript: "runtime-js-worker-thread",
    python: "runtime-python-subprocess-experimental",
    rust: "runtime-wasm-wasi-wasmtime-preview1",
    zig: "runtime-wasm-wasi-wasmtime-preview1",
    tinygo: "runtime-wasm-wasi-wasmtime-preview1",
  }
  const base = defaultRuntimeMetadata("typescript")
  return {
    ...base,
    ...overrides,
    abiVersion: overrides.abiVersion ?? STRATEGY_RUNTIME_ABI_VERSION,
    language: {
      id: languageId as StrategyRuntimeMetadata["language"]["id"],
      version:
        languageId === "python"
          ? "3.9"
          : languageId === "rust"
            ? "1.95.0-wasm32-wasip1"
            : languageId === "zig" || languageId === "tinygo"
              ? "0.16.0-wasm32-wasi"
              : "0.1.0",
      ...overrides.language,
    },
    adapter: {
      id: adapterByLanguage[languageId] ?? "runtime-js-worker-thread",
      version:
        languageId === "python"
          ? "0.1.0-experimental"
          : languageId === "rust" || languageId === "zig"
            ? "0.1.0-alpha"
            : "0.1.0",
      ...overrides.adapter,
    },
    package: overrides.package ?? {
      mode: "none",
      entrypoint: "default",
    },
    requiredCapabilities: overrides.requiredCapabilities ?? [],
    limits: overrides.limits ?? base.limits,
  }
}

const providerEvidenceFor = (
  languageId: "typescript" | "python" | "rust" | "zig",
  input: {
    sourceHash?: string
    sourceBytes?: number
    proof?: string
    artifactSourceHash?: string
    artifactSourceBytes?: number
    artifactFormat?: string
    providerId?: string
  } = {},
) => {
  const sourceHash = input.sourceHash ?? `${languageId}-source-hash`
  const sourceBytes = input.sourceBytes ?? 128
  const artifact = artifactRecord(`${languageId}-artifact`)
  const providerId =
    input.providerId ??
    (languageId === "typescript"
      ? "strategy-language-provider-js-ts"
      : languageId === "python"
        ? "strategy-language-provider-python"
        : languageId === "zig"
          ? "strategy-language-provider-zig-wasi"
          : "strategy-language-provider-rust-wasi")
  const artifactSourceHash = input.artifactSourceHash ?? sourceHash
  const artifactSourceBytes = input.artifactSourceBytes ?? sourceBytes
  const proof =
    input.proof ??
    providerProof({
      providerId,
      sourceHash,
      sourceBytes,
      artifactHash: artifact.hash,
      artifactBytes: artifact.bytes,
    })

  if (languageId === "typescript" || languageId === "python") {
    return {
      sourceArtifact: {
        format:
          input.artifactFormat ??
          (languageId === "typescript"
            ? "transpiled-javascript"
            : "python-source-bundle"),
        ...artifact,
        sourceHash: artifactSourceHash,
        sourceBytes: artifactSourceBytes,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        validationStatus: "valid",
        toolchain: {
          language: languageId,
        },
      },
      providerValidation: {
        providerId,
        contractVersion: "strategy-language-provider-contract-v1.33",
        sourceHash,
        sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
        proof,
      },
    }
  }

  return {
    compiledArtifact: {
      ...artifact,
      sourceHash: artifactSourceHash,
      targetTriple: languageId === "zig" ? "wasm32-wasi" : "wasm32-wasip1",
      wasiProfile: "preview1",
      abiEnvelope: "stdin-stdout-json",
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      validationStatus: "valid",
    },
    providerValidation: {
      providerId,
      contractVersion: "strategy-language-provider-contract-v1.33",
      sourceHash,
      sourceBytes,
      artifactHash: artifact.hash,
      artifactBytes: artifact.bytes,
      proof,
    },
  }
}

type FakeEntryStatus = "active" | "withdrawn" | "invalidated"

const revisionRow = (input: {
  languageId?:
    | "typescript"
    | "python"
    | "rust"
    | "zig"
    | "javascript"
    | "tinygo"
  metadata?: Record<string, unknown>
  validation?: { valid: boolean }
  lockedAt?: string | null
  ownerUserId?: string
  sourceHash?: string
  sourceBytes?: number
  runtime?: unknown
  engineCompatibility?: unknown
}) => {
  const languageId = input.languageId ?? "typescript"
  const sourceHash = input.sourceHash ?? `${languageId}-source-hash`
  const sourceBytes = input.sourceBytes ?? 128
  return {
    strategy_id: `strategy:${languageId}`,
    strategy_name: `${languageId} strategy`,
    strategy_description: null,
    strategy_tags: [],
    source_hash: sourceHash,
    source_bytes: sourceBytes,
    runtime: input.runtime ?? runtimeFor(languageId),
    engine_compatibility: input.engineCompatibility ?? {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
    validation: input.validation ?? { valid: true },
    metadata:
      input.metadata ??
      (languageId === "typescript" ||
      languageId === "python" ||
      languageId === "rust" ||
      languageId === "zig"
        ? providerEvidenceFor(languageId, { sourceHash, sourceBytes })
        : {}),
    owner_user_id: input.ownerUserId ?? "user:owner",
    handle: "owner",
    locked_at:
      input.lockedAt === undefined
        ? "2026-06-16T00:00:00.000Z"
        : input.lockedAt,
  }
}

const createFakePool = (
  input: {
    seasonStatus?: string | null
    revision?: ReturnType<typeof revisionRow> | null
    existingEntryStatus?: FakeEntryStatus | null
    existingEntryStatuses?: Array<FakeEntryStatus | null>
    insertError?: unknown
    insertErrors?: unknown[]
  } = {},
) => {
  const calls: string[] = []
  let ownerEntryQueryIndex = 0
  let insertIndex = 0
  const pool: {
    calls: string[]
    query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }>
    connect?: () => Promise<{
      query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }>
      release: () => void
    }>
  } = {
    calls,
    async query(sql: string, values?: unknown[]) {
      calls.push(sql)
      if (sql.includes("from trial_ladder_seasons")) {
        return {
          rows:
            input.seasonStatus === null
              ? []
              : [{ status: input.seasonStatus ?? "open" }],
        }
      }
      if (
        sql.includes("from trial_ladder_entries") &&
        sql.includes("owner_user_id")
      ) {
        const status = input.existingEntryStatuses
          ? (input.existingEntryStatuses[ownerEntryQueryIndex++] ?? null)
          : (input.existingEntryStatus ?? null)
        return {
          rows: status ? [{ id: "trial-entry:existing", status }] : [],
        }
      }
      if (sql.includes("from strategy_revisions")) {
        return {
          rows:
            input.revision === null ? [] : [input.revision ?? revisionRow({})],
        }
      }
      if (sql.includes("max(entry_index)")) {
        return { rows: [{ entry_index: insertIndex }] }
      }
      if (sql.includes("insert into trial_ladder_entries")) {
        const insertError =
          input.insertErrors?.[insertIndex] ?? input.insertError
        insertIndex += 1
        if (insertError) {
          throw insertError
        }
        return { rows: [] }
      }
      if (sql.includes("update strategy_revisions")) {
        return { rows: [] }
      }
      return { rows: [] }
    },
  }
  pool.connect = async () => ({
    query: pool.query,
    release() {},
  })
  return pool as unknown as Pool & { calls: string[] }
}

const defaultEntryInput = {
  seasonId: "season:trial",
  userId: "user:owner",
  revisionId: "revision:owned",
} as const

const expectEligibilityCategory = async (
  pool: Pool,
  category: CountedEntryEligibilityCategory,
) => {
  await expect(
    evaluateCountedEntryEligibility(pool, defaultEntryInput),
  ).resolves.toMatchObject({
    ok: category === "provider_validated",
    category,
    publicMessage: getCountedEntryEligibilityPublicCopy(category).publicMessage,
    remediation: getCountedEntryEligibilityPublicCopy(category).remediation,
  })
}

const createLifecyclePool = (input: {
  status: "draft" | "open" | "scheduling" | "active" | "completed" | "archived"
  entries?: Array<{ id: string; status: string; snapshot: any }>
  existingRun?:
    | {
        id: string
        created_match_set_ids: string[]
        leftover_entry_ids: string[]
      }
    | undefined
  failPattern?: string | undefined
}) => {
  const calls: string[] = []
  let status = input.status
  const client = {
    async query(sql: string, values?: unknown[]) {
      calls.push(sql)
      if (input.failPattern && sql.includes(input.failPattern)) {
        throw new Error("injected scheduling failure")
      }
      if (
        sql.trim() === "begin" ||
        sql.trim() === "commit" ||
        sql.trim() === "rollback"
      ) {
        return { rows: [] }
      }
      if (sql.includes("select id, status, season_seed")) {
        return {
          rows: [
            {
              id: "season:trial",
              status,
              season_seed: "season-seed",
              minimum_entries: 4,
              target_pod_size: 4,
            },
          ],
        }
      }
      if (sql.includes("from trial_ladder_schedule_runs")) {
        return { rows: input.existingRun ? [input.existingRun] : [] }
      }
      if (sql.includes("select status from trial_ladder_seasons")) {
        return { rows: [{ status }] }
      }
      if (
        sql.includes("update trial_ladder_seasons") &&
        sql.includes("set status")
      ) {
        status = values?.[1] as typeof status
        return { rows: [] }
      }
      if (sql.includes("from trial_ladder_entries")) {
        return { rows: input.entries ?? [] }
      }
      return { rows: [] }
    },
    release() {},
  }
  return {
    calls,
    pool: {
      async connect() {
        return client
      },
      async query(sql: string) {
        calls.push(sql)
        return { rows: [] }
      },
    } as unknown as Pool,
  }
}

describe("trial ladder contracts", () => {
  it("enforces monotonic Season lifecycle changes and closes entry once", async () => {
    const lifecycle = createLifecyclePool({ status: "open" })

    await setTrialLadderSeasonStatus(lifecycle.pool, {
      seasonId: "season:trial",
      status: "scheduling",
      reason: "Freeze entries.",
    })

    const update = lifecycle.calls.find(
      (sql) =>
        sql.includes("update trial_ladder_seasons") &&
        sql.includes("set status"),
    )
    expect(update).toContain("closed_at")
    expect(lifecycle.calls).toContain("commit")
  })

  it("rolls back illegal backward Season transitions", async () => {
    const lifecycle = createLifecyclePool({ status: "active" })

    await expect(
      setTrialLadderSeasonStatus(lifecycle.pool, {
        seasonId: "season:trial",
        status: "open",
        reason: "Reopen.",
      }),
    ).rejects.toThrow("cannot move from active to open")
    expect(lifecycle.calls).toContain("rollback")
    expect(
      lifecycle.calls.some((sql) =>
        sql.includes("insert into competition_audit_events"),
      ),
    ).toBe(false)
  })

  it("completes a frozen below-minimum Season with insufficient evidence", async () => {
    const entries = ["entry:a", "entry:b"].map((id) => ({
      id,
      status: "active",
      snapshot: { sourceHash: `${id}:hash` },
    }))
    const lifecycle = createLifecyclePool({ status: "open", entries })

    await expect(
      scheduleTrialLadderSeason(lifecycle.pool, {
        seasonId: "season:trial",
      }),
    ).resolves.toMatchObject({
      createdMatchSetIds: [],
      leftoverEntryIds: ["entry:a", "entry:b"],
    })
    const schedulingUpdate = lifecycle.calls.findIndex(
      (sql) =>
        sql.includes("update trial_ladder_seasons") &&
        sql.includes("set status"),
    )
    const entryRead = lifecycle.calls.findIndex((sql) =>
      sql.includes("from trial_ladder_entries"),
    )
    expect(schedulingUpdate).toBeGreaterThan(-1)
    expect(schedulingUpdate).toBeLessThan(entryRead)
    expect(
      lifecycle.calls.some(
        (sql) =>
          sql.includes("'no_op'") && sql.includes("trial_ladder_schedule_runs"),
      ),
    ).toBe(true)
    expect(lifecycle.calls).toContain("commit")
  })

  it("returns an existing Season run without creating duplicate MatchSets", async () => {
    const lifecycle = createLifecyclePool({
      status: "active",
      existingRun: {
        id: "trial-schedule:existing",
        created_match_set_ids: ["match-set:existing"],
        leftover_entry_ids: [],
      },
    })

    await expect(
      scheduleTrialLadderSeason(lifecycle.pool, {
        seasonId: "season:trial",
      }),
    ).resolves.toEqual({
      scheduleRunId: "trial-schedule:existing",
      createdMatchSetIds: ["match-set:existing"],
      leftoverEntryIds: [],
    })
    expect(
      lifecycle.calls.some((sql) => sql.includes("insert into match_sets")),
    ).toBe(false)
  })

  it("rolls back the Season run when scheduling persistence fails", async () => {
    const entries = ["entry:a", "entry:b"].map((id) => ({
      id,
      status: "active",
      snapshot: { sourceHash: `${id}:hash` },
    }))
    const lifecycle = createLifecyclePool({
      status: "open",
      entries,
      failPattern: "insert into trial_ladder_schedule_runs",
    })

    await expect(
      scheduleTrialLadderSeason(lifecycle.pool, {
        seasonId: "season:trial",
      }),
    ).rejects.toThrow("injected scheduling failure")
    expect(lifecycle.calls).toContain("rollback")
  })

  it("uses resettable beta lifecycle labels without permanent rating language", () => {
    expect(trialLadderStatusLabel("draft")).toBe("Preparing")
    expect(trialLadderStatusLabel("open")).toBe("Open for entries")
    expect(trialLadderStatusLabel("scheduling")).toBe("Scheduling matches")
    expect(trialLadderStatusLabel("active")).toBe("Matches running")
    expect(trialLadderStatusLabel("completed")).toBe("Complete")
    expect(trialLadderStatusLabel("archived")).toBe("Archived")
  })

  it("defaults to four-entry deterministic pods", () => {
    expect(DEFAULT_LADDER_MINIMUM_ENTRIES).toBe(4)
    expect(DEFAULT_LADDER_TARGET_POD_SIZE).toBe(4)
  })

  it.each(["typescript", "python", "rust", "zig"] as const)(
    "quarantines provider-proof-valid %s entries without exact lane evidence",
    async (languageId) => {
      const pool = createFakePool({ revision: revisionRow({ languageId }) })
      await expectEligibilityCategory(pool, "runtime_service_unavailable")
      expect(
        pool.calls.some(
          (sql) =>
            sql.includes("insert into trial_ladder_entries") ||
            sql.includes("update strategy_revisions"),
        ),
      ).toBe(false)
    },
  )

  it.each([
    [
      "closed season",
      createFakePool({ seasonStatus: "active" }),
      "season_not_open",
    ],
    [
      "missing proof",
      createFakePool({ revision: revisionRow({ metadata: {} }) }),
      "runtime_service_unavailable",
    ],
    [
      "mismatched proof",
      createFakePool({
        revision: revisionRow({
          metadata: providerEvidenceFor("typescript", {
            proof: "hmac-sha256:not-valid",
          }),
        }),
      }),
      "runtime_service_unavailable",
    ],
    [
      "stale proof",
      createFakePool({
        revision: revisionRow({
          metadata: providerEvidenceFor("typescript", {
            artifactSourceHash: "stale-source-hash",
          }),
        }),
      }),
      "runtime_service_unavailable",
    ],
    [
      "unsupported JavaScript counted trial entry",
      createFakePool({ revision: revisionRow({ languageId: "javascript" }) }),
      "unsupported_source_format",
    ],
    [
      "hidden TinyGo provider",
      createFakePool({ revision: revisionRow({ languageId: "tinygo" }) }),
      "hidden_unsupported_provider",
    ],
    [
      "unsupported source format",
      createFakePool({
        revision: revisionRow({
          metadata: providerEvidenceFor("typescript", {
            artifactFormat: "legacy-javascript-source",
          }),
        }),
      }),
      "runtime_service_unavailable",
    ],
    [
      "incompatible runtime metadata",
      createFakePool({
        revision: revisionRow({
          runtime: runtimeFor("python", {
            adapter: {
              id: "runtime-js-worker-thread",
              version: "0.1.0",
            },
          }),
          metadata: providerEvidenceFor("python"),
        }),
      }),
      "incompatible_runtime_metadata",
    ],
    [
      "incompatible engine metadata",
      createFakePool({
        revision: revisionRow({
          engineCompatibility: {
            spec: "stale-spec",
            engine: "stale-engine",
          },
        }),
      }),
      "runtime_service_unavailable",
    ],
    [
      "invalid revision",
      createFakePool({
        revision: revisionRow({ validation: { valid: false } }),
      }),
      "invalid_strategy_revision",
    ],
    [
      "mutable draft",
      createFakePool({ revision: revisionRow({ lockedAt: null }) }),
      "mutable_draft",
    ],
    ["owner mismatch", createFakePool({ revision: null }), "owner_mismatch"],
    [
      "runtime lane unavailable",
      createFakePool({
        revision: revisionRow({
          runtime: runtimeFor("typescript", {
            adapter: {
              id: "runtime-js-container-subprocess",
              version: "0.1.0",
            },
          }),
        }),
      }),
      "runtime_service_unavailable",
    ],
    [
      "package mode other than none",
      createFakePool({
        revision: revisionRow({
          runtime: runtimeFor("typescript", {
            package: {
              mode: "declared",
              entrypoint: "default",
            },
          }),
        }),
      }),
      "package_policy_violation",
    ],
    [
      "required capabilities",
      createFakePool({
        revision: revisionRow({
          runtime: runtimeFor("typescript", {
            requiredCapabilities: ["filesystem.read"],
          }),
        }),
      }),
      "capability_policy_violation",
    ],
    [
      "duplicate active owner entry",
      createFakePool({ existingEntryStatus: "active" }),
      "already_entered_season",
    ],
    [
      "withdrawn replacement attempt",
      createFakePool({ existingEntryStatus: "withdrawn" }),
      "replacement_blocked",
    ],
    [
      "invalidated historical replacement attempt",
      createFakePool({ existingEntryStatus: "invalidated" }),
      "replacement_blocked",
    ],
  ] satisfies Array<[string, Pool, CountedEntryEligibilityCategory]>)(
    "returns %s as %s",
    async (_name, pool, category) => {
      await expectEligibilityCategory(pool, category)
    },
  )

  it("throws category-bearing public errors from counted entry mutation", async () => {
    const pool = createFakePool({ existingEntryStatus: "active" })
    await expect(
      enterTrialLadderSeason(pool, {
        seasonId: "season:trial",
        userId: "user:owner",
        revisionId: "revision:owned",
      }),
    ).rejects.toMatchObject({
      name: "LadderInputError",
      category: "already_entered_season",
      publicMessage: getCountedEntryEligibilityPublicCopy(
        "already_entered_season",
      ).publicMessage,
      remediation: getCountedEntryEligibilityPublicCopy(
        "already_entered_season",
      ).remediation,
    })
    expect(
      pool.calls.some((sql) =>
        sql.includes("insert into trial_ladder_entries"),
      ),
    ).toBe(false)
  })

  it("does not reach owner uniqueness mutation while the lane is quarantined", async () => {
    const pool = createFakePool({ existingEntryStatuses: [null, "withdrawn"] })
    await expect(
      enterTrialLadderSeason(pool, defaultEntryInput),
    ).rejects.toMatchObject({
      category: "runtime_service_unavailable",
      publicMessage: getCountedEntryEligibilityPublicCopy(
        "runtime_service_unavailable",
      ).publicMessage,
    })
    expect(
      pool.calls.some((sql) =>
        sql.includes("insert into trial_ladder_entries"),
      ),
    ).toBe(false)
  })

  it("does not reach entry-index mutation while the lane is quarantined", async () => {
    const pool = createFakePool()
    await expect(
      enterTrialLadderSeason(pool, defaultEntryInput),
    ).rejects.toMatchObject({
      category: "runtime_service_unavailable",
    })
    expect(
      pool.calls.filter((sql) =>
        sql.includes("insert into trial_ladder_entries"),
      ),
    ).toHaveLength(0)
  })

  it("keeps the migration full owner/Season uniqueness policy", () => {
    const migrationSource = readFileSync(
      new URL(
        "../migrations/0004_competition_trust_beta.sql",
        import.meta.url,
      ),
      "utf8",
    )
    expect(migrationSource).toContain("unique(season_id, owner_user_id)")
    expect(migrationSource).not.toMatch(
      /unique\s*\([^)]*owner_user_id[^)]*\)\s*where/i,
    )
  })

  it("keeps public Season reads scoped and mutation-free", () => {
    const ladderSource = readFileSync(
      new URL("./ladder.ts", import.meta.url),
      "utf8",
    )
    const publicRead = ladderSource.slice(
      ladderSource.indexOf("export const buildTrialLadderSeasonDto"),
    )
    expect(publicRead).toContain("where ms.ladder_season_id = $1")
    expect(publicRead).not.toContain("refreshMatchSetStatus")
    expect(publicRead).not.toMatch(/update\s+match_sets/i)
  })

  it("delegates runtime compatibility wrapper failures to public categories", () => {
    try {
      assertLadderEligibleRuntime(runtimeFor("javascript"))
      throw new Error("expected wrapper to reject JavaScript")
    } catch (error) {
      expect(error).toBeInstanceOf(LadderInputError)
      expect(error).toMatchObject({
        category: "unsupported_source_format",
        publicMessage: getCountedEntryEligibilityPublicCopy(
          "unsupported_source_format",
        ).publicMessage,
      })
    }
  })
})
