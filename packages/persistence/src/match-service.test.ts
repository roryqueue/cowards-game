import { createHash } from "node:crypto"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import type { Pool } from "pg"
import { describe, expect, it } from "vitest"
import {
  createMatchExecutionEvidencePair,
  createMatchSetIntegrityIdentity,
} from "./integrity-evidence.js"
import {
  REVISION_CONTENT_COLUMNS,
  assertCanUpdateStrategyRevisionContent,
} from "./repositories.js"
import {
  createMatchJobId,
  createMatchService,
  validateCreateMatchInput,
  type CreateMatchInput,
  type CreateMatchRecordInput,
} from "./match-service.js"
import { DEFAULT_MAX_JOB_ATTEMPTS } from "./schema.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const lane = (side: "bottom" | "top"): ExecutableLaneIdentity => ({
  providerId: `fixture:provider:${side}`,
  languageId: side === "bottom" ? "typescript" : "python",
  runtimeId: `fixture:runtime:${side}`,
  runtimeVersion: "1",
  toolchainId: `fixture:toolchain:${side}`,
  toolchainVersion: "1",
  adapterId: `fixture:adapter:${side}`,
  adapterVersion: "1",
  policyId: "fixture:policy",
  policyVersion: "1",
  corpusId: "fixture:corpus",
  corpusVersion: "1",
  artifactId: `fixture:artifact:${side}`,
  artifactSha256: sha256(`artifact:${side}`),
  implementationId: `fixture:implementation:${side}`,
  buildId: `fixture:build:${side}`,
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
})

const entrant = (side: "bottom" | "top"): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `entrant:${side}`,
  strategyRevisionId: `strategy-revision:${side}`,
  laneIdentity: lane(side),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `certificate:containment:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`containment:${side}`),
    registryGeneration: "fixture:generation:1",
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `certificate:conformance:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`conformance:${side}`),
    registryGeneration: "fixture:generation:1",
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2099-08-12T12:00:00.000Z",
    registryGeneration: "fixture:generation:1",
  },
})

const record: CreateMatchRecordInput = {
  id: "match:test:001",
  bottomStrategyRevisionId: "strategy-revision:bottom",
  topStrategyRevisionId: "strategy-revision:top",
  arenaVariantId: "arena:smoke:v1",
  seed: "seed:test:001",
  bottomPlayerId: "player:bottom",
  topPlayerId: "player:top",
  bottomEntrantKey: "entrant:bottom",
  topEntrantKey: "entrant:top",
}

const validInput = (): CreateMatchInput => {
  const identity = createMatchSetIntegrityIdentity({
    compatibility: {
      tupleId: tuple.tupleId,
      tuple: { ...tuple.tuple },
    },
    authorityBundleHash: sha256("fixture:bundle"),
    registryGeneration: "fixture:generation:1",
    expectedEntrants: [entrant("bottom"), entrant("top")].map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants: [entrant("bottom"), entrant("top")],
  })
  return {
    ...record,
    integrityIdentity: {
      matchSetId: "match-set:integrity:test",
      identity,
      evidencePair: createMatchExecutionEvidencePair(identity, {
        bottomEntrantKey: record.bottomEntrantKey,
        topEntrantKey: record.topEntrantKey,
        bottomStrategyRevisionId: record.bottomStrategyRevisionId,
        topStrategyRevisionId: record.topStrategyRevisionId,
      }),
    },
  }
}

const fakePool = () => {
  const calls: Array<{ sql: string; values: readonly unknown[] }> = []
  const client = {
    async query(sql: string, values: readonly unknown[] = []) {
      const normalized = sql.replace(/\s+/gu, " ").trim()
      calls.push({ sql: normalized, values })
      if (normalized.startsWith("select * from strategy_revisions")) {
        return {
          rows: [
            {
              id: values[0],
              strategy_id: null,
              source: "return",
              source_hash: "source-hash",
              source_bytes: 6,
              runtime: {},
              engine_compatibility: {},
              validation: { valid: true },
              metadata: {},
              compiled_artifact: null,
            },
          ],
        }
      }
      if (normalized.startsWith("select config from arena_variants")) {
        return { rows: [{ config: { id: values[0] } }] }
      }
      return { rows: [], rowCount: 1 }
    },
    release() {},
  }
  return {
    pool: { connect: async () => client } as unknown as Pool,
    calls,
  }
}

describe("match creation contracts", () => {
  it("requires a validator-minted exact tuple and ordered heterogeneous evidence pair", () => {
    const input = validInput()
    expect(() => validateCreateMatchInput(input)).not.toThrow()
    expect(input.integrityIdentity.evidencePair.bottom.laneIdentity.languageId).toBe(
      "typescript",
    )
    expect(input.integrityIdentity.evidencePair.top.laneIdentity.languageId).toBe(
      "python",
    )

    expect(() =>
      validateCreateMatchInput({
        ...input,
        integrityIdentity: {
          ...input.integrityIdentity,
          identity: { ...input.integrityIdentity.identity },
        },
      }),
    ).toThrow(/exact validator/iu)
    expect(() =>
      validateCreateMatchInput({
        ...input,
        bottomEntrantKey: input.topEntrantKey,
      }),
    ).toThrow(/side|swapped|binding/iu)
    expect(() =>
      validateCreateMatchInput({
        ...input,
        integrityIdentity: {
          ...input.integrityIdentity,
          evidencePair: {
            ...input.integrityIdentity.evidencePair,
            bottom: input.integrityIdentity.evidencePair.top,
            top: input.integrityIdentity.evidencePair.bottom,
          },
        },
      }),
    ).toThrow(/ordered|pair|swapped/iu)
  })

  it("rejects stale or disabled evidence before opening a transaction", async () => {
    for (const mutation of [
      (input: CreateMatchInput) => ({
        ...input,
        integrityIdentity: {
          ...input.integrityIdentity,
          evidencePair: {
            ...input.integrityIdentity.evidencePair,
            bottom: {
              ...input.integrityIdentity.evidencePair.bottom,
              schedulingDecision: {
                ...input.integrityIdentity.evidencePair.bottom.schedulingDecision,
                freshUntil: "2020-01-01T00:00:00.000Z",
              },
            },
          },
        },
      }),
      (input: CreateMatchInput) => ({
        ...input,
        integrityIdentity: {
          ...input.integrityIdentity,
          evidencePair: {
            ...input.integrityIdentity.evidencePair,
            top: {
              ...input.integrityIdentity.evidencePair.top,
              schedulingDecision: {
                ...input.integrityIdentity.evidencePair.top.schedulingDecision,
                status: "disabled" as const,
              },
            },
          },
        },
      }),
    ]) {
      const fake = fakePool()
      await expect(createMatchService(fake.pool).createMatch(mutation(validInput()))).rejects.toThrow()
      expect(fake.calls).toEqual([])
    }
  })

  it("writes the identical tuple-linked ordered pair onto Match and job in one transaction", async () => {
    const fake = fakePool()
    const input = validInput()
    await expect(createMatchService(fake.pool).createMatch(input)).resolves.toEqual({
      matchId: input.id,
      jobId: createMatchJobId(input.id),
      status: "pending",
    })

    const matchInsert = fake.calls.find((call) =>
      call.sql.startsWith("insert into matches"),
    )!
    const jobInsert = fake.calls.find((call) =>
      call.sql.startsWith("insert into match_jobs"),
    )!
    expect(matchInsert.values.slice(-6)).toEqual(jobInsert.values.slice(-6))
    expect(matchInsert.values.slice(-6)).toEqual([
      input.integrityIdentity.matchSetId,
      input.bottomEntrantKey,
      input.topEntrantKey,
      input.integrityIdentity.evidencePair.bottom,
      input.integrityIdentity.evidencePair.top,
      input.integrityIdentity.evidencePair.pairHash,
    ])
    expect(fake.calls.at(0)?.sql).toBe("begin")
    expect(fake.calls.at(-1)?.sql).toBe("commit")
  })

  it("rolls back both rows when the queued-job insert fails", async () => {
    const fake = fakePool()
    const client = await fake.pool.connect()
    const baseQuery = client.query.bind(client)
    client.query = (async (sql: string, values?: readonly unknown[]) => {
      if (sql.replace(/\s+/gu, " ").trim().startsWith("insert into match_jobs")) {
        throw new Error("late job failure")
      }
      return baseQuery(sql, values)
    }) as typeof client.query

    await expect(createMatchService(fake.pool).createMatch(validInput())).rejects.toThrow(
      "late job failure",
    )
    expect(fake.calls.at(-1)?.sql).toBe("rollback")
  })

  it("requires seed and explicit locked side assignment inputs", () => {
    const input = validInput()
    expect(() => validateCreateMatchInput(input)).not.toThrow()
    expect(() => validateCreateMatchInput({ ...input, seed: "" })).toThrow(
      "Match seed is required",
    )
  })

  it("uses the fixed Phase 5 retry count for queued jobs", () => {
    expect(DEFAULT_MAX_JOB_ATTEMPTS).toBe(3)
    expect(createMatchJobId("match:test:001")).toBe("match-job:match:test:001")
  })

  it("blocks locked_at StrategyRevision content mutations", () => {
    expect(REVISION_CONTENT_COLUMNS).toContain("source")
    expect(() =>
      assertCanUpdateStrategyRevisionContent({
        lockedAt: new Date(),
        changedColumns: ["metadata"],
      }),
    ).not.toThrow()
    expect(() =>
      assertCanUpdateStrategyRevisionContent({
        lockedAt: new Date(),
        changedColumns: ["source"],
      }),
    ).toThrow("Cannot update locked StrategyRevision content column: source")
  })
})
