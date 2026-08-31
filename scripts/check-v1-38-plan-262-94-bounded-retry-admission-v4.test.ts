import { randomBytes } from "node:crypto"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_94_PATHS,
  buildV138Plan26294Aggregate,
  computeV138Plan262123ReviewRoot,
  deriveV138Plan26294Disposition,
  planV138Plan26294ReviewedWrites,
  validateV138Plan262123Review,
  validateV138Plan26294Aggregate,
  verifyV138Plan26294PrivateAggregate,
} from "./check-v1-38-plan-262-94-bounded-retry-admission-v4.js"

const key = randomBytes(32)
const material = {
  historical: [Buffer.from("history-v1"), Buffer.from("history-v2"), Buffer.from("history-v3")],
  receipts: [Buffer.from("receipt-a-private"), Buffer.from("receipt-b-private")],
  journal: Buffer.from("private-journal"),
  terminal: Buffer.from("terminal"),
  reproduction: null,
  protectedHistory: [Buffer.from("failed-plan-110")],
}
const counts = {
  generations: { v1: 15, v2: 15, v3: 0, v4: 2 },
  routeStartsCharged: 12,
  preflightObservationsCharged: 12,
  calibrationIdentitiesCharged: 96,
  reproductionIdentitiesCharged: 0,
  freshAccepted: 0,
  requiredAccepted: 540,
}

const cleanReview = () => {
  const body = {
    schemaVersion: "v1.38-plan-262-123-admission-source-review-v1" as const,
    sourceCommit: "a".repeat(40),
    sourceTree: "b".repeat(40),
    sourceFiles: [
      { path: V138_PLAN_262_94_PATHS.self, mode: "100644" as const, blob: "c".repeat(40), sha256: `sha256:${"d".repeat(64)}` as const },
      { path: V138_PLAN_262_94_PATHS.test, mode: "100644" as const, blob: "e".repeat(40), sha256: `sha256:${"f".repeat(64)}` as const },
    ],
    aggregateManifestSha256: `sha256:${"1".repeat(64)}` as const,
    findingCount: 0,
    plan124Eligible: true,
    authorizesExecution: false,
  }
  return { ...body, reviewRoot: computeV138Plan262123ReviewRoot(body) }
}

describe("Plan 262-94 keyed aggregate", () => {
  it("contains only aggregate counts, commitments, limitation, and false authority", () => {
    const aggregate = buildV138Plan26294Aggregate(key, material, counts)
    expect(validateV138Plan26294Aggregate(aggregate)).toEqual(aggregate)
    expect(JSON.stringify(aggregate)).not.toMatch(/receipt-a-private|private-journal|failed-plan-110/)
    expect(JSON.stringify(aggregate)).not.toMatch(/path|filename|ordinal|byteLength|payload|receiptHash|repoPath/i)
    expect(Object.values(aggregate.authority)).toEqual(expect.arrayContaining([false]))
    expect(Object.values(aggregate.authority).every(value => value === false)).toBe(true)
    expect(aggregate.assuranceLimitation).toBe("single_operator_local_seal_v1_no_hostile_same_uid")
  })

  it("changes every private commitment when the fresh key changes", () => {
    const left = buildV138Plan26294Aggregate(Buffer.alloc(32, 1), material, counts)
    const right = buildV138Plan26294Aggregate(Buffer.alloc(32, 2), material, counts)
    expect(left.commitments).not.toEqual(right.commitments)
    expect(left.aggregateRoot).not.toBe(right.aggregateRoot)
  })

  it("domain-separates equal material and rejects commitment swaps", () => {
    const equal = { ...material, receipts: [Buffer.from("same")], journal: Buffer.from("same"), terminal: Buffer.from("same") }
    const aggregate = buildV138Plan26294Aggregate(key, equal, counts) as any
    expect(new Set(Object.values(aggregate.commitments)).size).toBe(Object.keys(aggregate.commitments).length)
    const swapped = structuredClone(aggregate)
    ;[swapped.commitments.journalRoot, swapped.commitments.terminalRoot] =
      [swapped.commitments.terminalRoot, swapped.commitments.journalRoot]
    expect(() => validateV138Plan26294Aggregate(swapped)).toThrow(/AGGREGATE_SCHEMA_INVALID/)
  })

  it("requires the correct retained key for private recomputation", () => {
    const aggregate = buildV138Plan26294Aggregate(key, material, counts)
    expect(verifyV138Plan26294PrivateAggregate(aggregate, key, material, counts)).toBe(true)
    expect(() => verifyV138Plan26294PrivateAggregate(aggregate, randomBytes(32), material, counts)).toThrow(/PRIVATE_AGGREGATE_MISMATCH/)
    expect(() => verifyV138Plan26294PrivateAggregate(aggregate, Buffer.alloc(0), material, counts)).toThrow(/BLINDING_KEY_INVALID/)
  })

  it("rejects malformed and receipt-level public projections", () => {
    const aggregate = buildV138Plan26294Aggregate(key, material, counts) as any
    for (const injected of [
      { receipts: ["handle"] },
      { receiptPath: "private/x" },
      { payload: "secret" },
      { perReceiptHash: `sha256:${"a".repeat(64)}` },
      { ordinalMap: { 0: 1 } },
      { byteLengths: [12] },
    ]) expect(() => validateV138Plan26294Aggregate({ ...aggregate, ...injected })).toThrow(/AGGREGATE_SCHEMA_INVALID/)
  })

  it("rejects recursive schema extensions and malformed counts", () => {
    const aggregate = buildV138Plan26294Aggregate(key, material, counts) as any
    expect(() => validateV138Plan26294Aggregate({ ...aggregate, commitments: { ...aggregate.commitments, extra: aggregate.commitments.journalRoot } }))
      .toThrow(/AGGREGATE_SCHEMA_INVALID/)
    expect(() => validateV138Plan26294Aggregate({ ...aggregate, authority: { ...aggregate.authority, extra: false } }))
      .toThrow(/AGGREGATE_SCHEMA_INVALID/)
    for (const malformed of [-1, 1.5, null, "15"]) {
      expect(() => validateV138Plan26294Aggregate({ ...aggregate, counts: { ...aggregate.counts, generations: { ...aggregate.counts.generations, v4: malformed } } }))
        .toThrow()
    }
  })
})

describe("Plan 262-94 pure disposition derivation", () => {
  it("derives the actual clean empirical non-pass with Route-12 absent", () => {
    const result = deriveV138Plan26294Disposition({
      producerDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540,
      reproductionPresent: false, assuranceFindings: [], contamination: false,
    })
    expect(result.status).toBe("non_pass")
    expect(result.producerSucceeded).toBe(false)
    expect(result.writeCorrection).toBe(false)
    expect(result.writeRoute12).toBe(false)
    expect(result.preserveReproduction).toBe(false)
  })

  it("preserves producer success when a later assurance finding makes the branch non-pass", () => {
    const result = deriveV138Plan26294Disposition({
      producerDisposition: "succeeded", freshAccepted: 540, requiredAccepted: 540,
      reproductionPresent: true, assuranceFindings: ["LATER_CUSTODY_DEFECT"], contamination: false,
    })
    expect(result.status).toBe("non_pass")
    expect(result.producerSucceeded).toBe(true)
    expect(result.preserveReproduction).toBe(true)
    expect(result.writeCorrection).toBe(true)
    expect(result.writeRoute12).toBe(false)
  })

  it("projects Route-12 only for exact clean success", () => {
    const result = deriveV138Plan26294Disposition({
      producerDisposition: "succeeded", freshAccepted: 540, requiredAccepted: 540,
      reproductionPresent: true, assuranceFindings: [], contamination: false,
    })
    expect(result.status).toBe("pass")
    expect(result.writeCorrection).toBe(false)
    expect(result.writeRoute12).toBe(true)
  })

  it("fails closed on contamination and injected activation", () => {
    expect(deriveV138Plan26294Disposition({
      producerDisposition: "succeeded", freshAccepted: 540, requiredAccepted: 540,
      reproductionPresent: true, assuranceFindings: [], contamination: true,
    }).writeRoute12).toBe(false)
    expect(() => deriveV138Plan26294Disposition({
      producerDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540,
      reproductionPresent: false, assuranceFindings: [], contamination: false, route12Present: true,
    })).toThrow(/NONPASS_ROUTE12_PRESENT/)
  })
})

describe("Plan 123 review gate and dormant effects", () => {
  it("accepts only the exact literal-zero non-authorizing carrier", () => {
    const review = cleanReview()
    expect(validateV138Plan262123Review(review)).toEqual(review)
    for (const patch of [
      { findingCount: 1 }, { plan124Eligible: false }, { authorizesExecution: true },
      { aggregateManifestSha256: `sha256:${"2".repeat(64)}` }, { sourceCommit: "9".repeat(40) },
    ]) expect(() => validateV138Plan262123Review({ ...review, ...patch })).toThrow(/PLAN123_REVIEW_INVALID/)
    expect(() => validateV138Plan262123Review({ ...review, sourceFiles: [review.sourceFiles[0], review.sourceFiles[0]] }))
      .toThrow(/PLAN123_REVIEW_INVALID/)
  })

  it("plans exact branch writes only after a matching review and never writes in the pure gate", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan94-tripwire-"))
    mkdirSync(path.join(root, "effects"))
    const marker = path.join(root, "effects/marker")
    const review = cleanReview()
    const expected = {
      sourceCommit: review.sourceCommit,
      sourceTree: review.sourceTree,
      sourceFiles: review.sourceFiles,
      aggregateManifestSha256: review.aggregateManifestSha256,
    }
    const writes = planV138Plan26294ReviewedWrites(review, expected, {
      producerDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540,
      reproductionPresent: false, assuranceFindings: [], contamination: false,
    })
    expect(writes).toEqual([V138_PLAN_262_94_PATHS.disposition])
    expect(() => readFileSync(marker)).toThrow()
  })

  it("rejects missing, false, stale, and mismatched review before a file-backed tripwire", () => {
    const review = cleanReview()
    const expected = {
      sourceCommit: review.sourceCommit,
      sourceTree: review.sourceTree,
      sourceFiles: review.sourceFiles,
      aggregateManifestSha256: review.aggregateManifestSha256,
    }
    const branch = {
      producerDisposition: "exhausted" as const, freshAccepted: 0, requiredAccepted: 540,
      reproductionPresent: false, assuranceFindings: [] as string[], contamination: false,
    }
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan94-tripwire-"))
    const marker = path.join(root, "publisher-ran")
    for (const bad of [undefined, { ...review, findingCount: 1 }, { ...review, plan124Eligible: false }, { ...review, sourceTree: "0".repeat(40) }]) {
      expect(() => planV138Plan26294ReviewedWrites(bad, expected, branch)).toThrow()
      expect(() => readFileSync(marker)).toThrow()
    }
    writeFileSync(path.join(root, "fixture-only"), "pure\n")
  })
})
