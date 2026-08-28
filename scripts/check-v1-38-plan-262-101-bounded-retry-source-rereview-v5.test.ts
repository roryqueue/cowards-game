import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_101_DOMAINS,
  V138_PLAN_262_101_MUTATIONS,
  V138_PLAN_262_101_REPORT_PATH,
  V138_PLAN_262_101_REVIEW_PATH,
  V138_PLAN_262_101_SOURCE_PATHS,
  checkV138Plan262101PublishedReview,
  computeV138Plan262101FindingRoot,
  computeV138Plan262101PortableRoot,
  computeV138Plan262101ResultRoot,
  computeV138Plan262101ReviewRoot,
  deriveV138Plan262101ReviewNoPublish,
  inspectV138Plan262101CorrectedSource,
  inspectV138Plan262101ProtectedHistory,
  inspectV138Plan262101Source,
  parseV138Plan262101RegularBlobTreeEntry,
  renderV138Plan262101Report,
  snapshotV138Plan262101Destinations,
  validateV138Plan262101Review,
} from "./check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sha = (value: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

describe("Plan 262-101 raw Git object byte-custody re-review v5", () => {
  it("pins the exact schema, protocol domains, paths, and three-file source set", () => {
    expect(V138_PLAN_262_101_REVIEW_PATH).toBe(
      ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
    )
    expect(V138_PLAN_262_101_REPORT_PATH).toMatch(/262-101-REVIEW\.md$/u)
    expect(V138_PLAN_262_101_SOURCE_PATHS).toEqual([
      "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
      "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
      "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
    ])
    expect(V138_PLAN_262_101_DOMAINS).toEqual({
      portable: "v1.38:plan-262-101:git-object-byte-custody:portable:v5",
      result: "v1.38:plan-262-101:git-object-byte-custody:root:v5",
      review: "v1.38:plan-262-101:git-object-byte-custody:review:v5",
      finding: "v1.38:plan-262-101:git-object-byte-custody:finding:v5",
    })
  })

  it("authenticates the exact Plan-100 carrier, raw blobs, modes, and no later rewrite", () => {
    const source = inspectV138Plan262101CorrectedSource(repoRoot)
    expect(source).toMatchObject({
      commit: "a879bfc6cab49abf2e12a5b882a06b7e9fb446cb",
      tree: "e6b89de1c699d35b0e5068e0c064b7badd53ad00",
      parent: "71dc34c79a27ba57e67f8a2a2b7471dedade7a09",
      noLaterRewrite: true,
      summaryTrustedAsVerdict: false,
    })
    expect(source.files).toEqual([
      expect.objectContaining({
        path: V138_PLAN_262_101_SOURCE_PATHS[0],
        mode: "100644",
        blob: "80a5aa8e900d8bcbbeed66363e39d574fe0d3f59",
        byteLength: 20_459,
        sha256: "sha256:8a5ad1808819173d75744306f5003d00e67a0c5e72d6964f23c102ad14f155d7",
      }),
      expect.objectContaining({
        path: V138_PLAN_262_101_SOURCE_PATHS[1],
        mode: "100644",
        blob: "8a6f6dc8e9c6efbb4626eba0dd846cd059881654",
        byteLength: 81_171,
        sha256: "sha256:0ab49ae8d0e1fec3e216b2a45624824cc4d2c592a5a8e3f6c5ec1b625f021091",
      }),
      expect.objectContaining({
        path: V138_PLAN_262_101_SOURCE_PATHS[2],
        mode: "100644",
        blob: "50e479136f1537573cb83d26d03ffa16c4ac08b1",
        byteLength: 49_828,
        sha256: "sha256:8f1be655746a99ab7de75c00bbcdf35e728a6fb136638291ccda5abf1f47f441",
      }),
    ])
  })

  it.each([
    ["final newline", Buffer.from("alpha\n")],
    ["no final newline", Buffer.from("alpha")],
    ["empty", Buffer.alloc(0)],
    ["CRLF", Buffer.from("alpha\r\nbeta\r\n")],
    ["invalid UTF-8", Buffer.from([0xff, 0xfe, 0x80, 0xc0])],
    ["embedded NUL", Buffer.from([0x61, 0, 0x62, 0])],
  ])("parses one regular blob entry without changing %s payload bytes", (_name, bytes) => {
    const oid = "a".repeat(40)
    expect(
      parseV138Plan262101RegularBlobTreeEntry(
        Buffer.from(`100644 blob ${oid}\tfixture.bin\0`),
        "fixture.bin",
      ),
    ).toEqual({ mode: "100644", oid })
    expect(Buffer.from(bytes).equals(bytes)).toBe(true)
  })

  it.each([
    ["missing NUL", Buffer.from(`100644 blob ${"a".repeat(40)}\tfile.bin`)],
    ["duplicate", Buffer.from(`100644 blob ${"a".repeat(40)}\tfile.bin\0`.repeat(2))],
    ["malformed", Buffer.from(`100644  blob ${"a".repeat(40)}\tfile.bin\0`)],
    ["wrong path", Buffer.from(`100644 blob ${"a".repeat(40)}\tother.bin\0`)],
    ["wrong oid", Buffer.from("100644 blob bad\tfile.bin\0")],
    ["symlink", Buffer.from(`120000 blob ${"a".repeat(40)}\tfile.bin\0`)],
    ["gitlink", Buffer.from(`160000 commit ${"a".repeat(40)}\tfile.bin\0`)],
    ["tree", Buffer.from(`040000 tree ${"a".repeat(40)}\tfile.bin\0`)],
  ])("rejects %s tree metadata", (_name, bytes) => {
    expect(() =>
      parseV138Plan262101RegularBlobTreeEntry(bytes, "file.bin"),
    ).toThrow("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  })

  it("detects every declared raw-byte, mode, schema, history, and authority mutation", () => {
    const source = Object.fromEntries(
      V138_PLAN_262_101_SOURCE_PATHS.map((repoPath) => [
        repoPath,
        readFileSync(path.resolve(repoRoot, repoPath), "utf8"),
      ]),
    )
    expect(inspectV138Plan262101Source(source)).toEqual([])
    expect(V138_PLAN_262_101_MUTATIONS.length).toBeGreaterThanOrEqual(24)
    for (const [code, repoPath, token, replacement] of V138_PLAN_262_101_MUTATIONS) {
      const changed = structuredClone(source)
      expect(changed[repoPath].split(token), `${code}:${repoPath}`).toHaveLength(2)
      changed[repoPath] = changed[repoPath].replace(token, replacement)
      expect(inspectV138Plan262101Source(changed), code).toContain(code)
    }
  })

  it("preserves immutable Plan-98/99 provisional and invalidation history", () => {
    expect(inspectV138Plan262101ProtectedHistory(repoRoot)).toMatchObject({
      provisionalPairReinterpreted: false,
      plan98: {
        sourceCommit: "702bfa5216e3b0e15b4816ce28c98dbcdee38517",
      },
      plan99: {
        provisionalPairCommit: "19a6eb53a2ad2c0188009d095103c42718aa3214",
        provisionalFindingCount: 0,
        blockedFindingCode: "GIT_SHOW_BYTES_TRIMMED",
        plan26292Eligible: false,
        freshCharged: 0,
        freshAccepted: 0,
      },
    })
  })

  it("fails closed on the exact-candidate JSON self-reference and exercises the actual blocked consumer", () => {
    const before = snapshotV138Plan262101Destinations(repoRoot)
    const review = deriveV138Plan262101ReviewNoPublish(repoRoot)
    expect(review.status).toBe("blocked")
    expect(review.findingCount).toBe(1)
    expect(review.findings.map((item: { code: string }) => item.code)).toEqual([
      "CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE",
    ])
    expect(review.sourceReviewPassed).toBe(false)
    expect(review.authority.plan26292Eligible).toBe(false)
    expect(review.execution).toMatchObject({
      actualConsumerStatus: "rejected_expected",
      destinationsUnchanged: true,
      cleanupComplete: true,
      canonicalWrites: 0,
      freshCharged: 0,
      freshAccepted: 0,
      liveInvoked: false,
    })
    expect(review.reviewedExecutionClosure).not.toHaveProperty("gitObjectRoot")
    expect(review.reviewedExecutionClosure).not.toHaveProperty("executionClosureRoot")
    expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).not.toBe(
      review.reviewedExecutionClosure.installedClosureRoot,
    )
    expect(snapshotV138Plan262101Destinations(repoRoot)).toEqual(before)
  }, 180_000)

  it("derives and validates all four distinct domains and exhaustive false authority", () => {
    const review = deriveV138Plan262101ReviewNoPublish(repoRoot)
    expect(review.findingRoot).toBe(computeV138Plan262101FindingRoot(review.findings))
    expect(review.reviewRoot).toBe(computeV138Plan262101ReviewRoot(Buffer.from(renderV138Plan262101Report(review))))
    expect(review.resultRoot).toBe(computeV138Plan262101ResultRoot(review))
    const portableBody = { ...review.reviewedExecutionClosure }
    delete portableBody.reviewedExecutionClosureRoot
    expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).toBe(
      computeV138Plan262101PortableRoot(portableBody),
    )
    expect(new Set([
      review.findingRoot,
      review.reviewRoot,
      review.resultRoot,
      review.reviewedExecutionClosure.reviewedExecutionClosureRoot,
    ]).size).toBe(4)
    expect(validateV138Plan262101Review(review, review)).toBe(true)
    for (const [key, value] of Object.entries(review.authority)) {
      if (["freshCharged", "freshAccepted"].includes(key)) expect(value).toBe(0)
      else expect(value, key).toBe(false)
    }
  }, 180_000)

  it("rejects pair/history/root/authority mutation and keeps canonical pair absent pre-publication", () => {
    const review = deriveV138Plan262101ReviewNoPublish(repoRoot)
    for (const mutate of [
      (value: any) => (value.extra = false),
      (value: any) => (value.schemaVersion = "v1.38-wrong"),
      (value: any) => (value.protocol = "wrong"),
      (value: any) => (value.protectedHistory.provisionalPairReinterpreted = true),
      (value: any) => (value.reviewedExecutionClosure.gitObjectRoot = sha("local")),
      (value: any) => (value.authority.plan26292Eligible = true),
      (value: any) => (value.authority.phase263PlanningAuthorized = true),
      (value: any) => (value.execution.freshCharged = 1),
      (value: any) => (value.resultRoot = sha("wrong")),
    ]) {
      const changed = structuredClone(review)
      mutate(changed)
      expect(() => validateV138Plan262101Review(changed, review)).toThrow()
    }
    expect(() => checkV138Plan262101PublishedReview(repoRoot)).toThrow()
  }, 180_000)
})
