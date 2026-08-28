import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_103_AUTHORITY_KEYS,
  V138_PLAN_262_103_CANDIDATE_DOMAIN,
  V138_PLAN_262_103_CANDIDATE_PATH,
  V138_PLAN_262_103_CANDIDATE_SCHEMA,
  V138_PLAN_262_103_CARRIER_DOMAIN,
  V138_PLAN_262_103_CARRIER_PATH,
  V138_PLAN_262_103_CARRIER_SCHEMA,
  V138_PLAN_262_103_REPORT_PATH,
  V138_PLAN_262_102_SOURCE_PATHS,
  candidateV138Plan262103Preimage,
  carrierV138Plan262103Preimage,
  computeV138Plan262103CandidatePayloadRoot,
  computeV138Plan262103CarrierRoot,
  computeV138Plan262103FindingRoot,
  computeV138Plan262103PortableClosureRoot,
  validateV138Plan262103Candidate,
  validateV138Plan262103Carrier,
} from "./lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.js"
import {
  V138_PLAN_262_103_FORBIDDEN_DESTINATIONS,
  consumeV138Plan262103ReviewNoPublish,
  executeV138Plan262103ConsumerCli,
} from "./run-v1-38-bounded-retry-envelope-v3-review-v6.js"

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const falseAuthority = () =>
  Object.fromEntries(
    V138_PLAN_262_103_AUTHORITY_KEYS.map((key) => [key, false]),
  ) as Record<string, boolean | number>

const candidateFixture = () => {
  const candidate = {
  schemaVersion: V138_PLAN_262_103_CANDIDATE_SCHEMA,
  protocol: "git-object-byte-custody-nonrecursive-v1",
  status: "zero_findings",
  correctedSource: {
    commit: "a".repeat(40),
    tree: "b".repeat(40),
    parent: "c".repeat(40),
    noLaterRewrite: true,
    summaryTrustedAsVerdict: false,
    files: [
      {
        path: V138_PLAN_262_102_SOURCE_PATHS[0],
        mode: "100644",
        blob: "d".repeat(40),
        byteLength: 3,
        sha256: `sha256:${"1".repeat(64)}`,
      },
      {
        path: V138_PLAN_262_102_SOURCE_PATHS[1],
        mode: "100644",
        blob: "e".repeat(40),
        byteLength: 4,
        sha256: `sha256:${"2".repeat(64)}`,
      },
      {
        path: V138_PLAN_262_102_SOURCE_PATHS[2],
        mode: "100644",
        blob: "f".repeat(40),
        byteLength: 5,
        sha256: `sha256:${"3".repeat(64)}`,
      },
    ],
  },
  protectedHistory: {
    plan100: {
      sourceCommit: "a879bfc6cab49abf2e12a5b882a06b7e9fb446cb",
      sourceTree: "e6b89de1c699d35b0e5068e0c064b7badd53ad00",
      sourceParent: "71dc34c79a27ba57e67f8a2a2b7471dedade7a09",
      summarySha256:
        "sha256:858b082ca74c8a77b380fc16d658b17cb8a30de823894161bd541feeb6bb0c2c",
      noLaterRewrite: true,
    },
    plan101: {
      pairCommit: "8c4e74180e36f22e3a44520d2cda145b3aa30671",
      candidateSha256:
        "sha256:891776dee9f6e2b3f87a99d8199512bfa4207f9fe03ab63fd29d04ac1c142ee3",
      reviewSha256:
        "sha256:14e750b89dc8bb30c080bd8fcc9a25fc7fe0d841367b3149c78b517a0d8f7f27",
      summarySha256:
        "sha256:f1a4b96e3c2122e20dffd9fbab2b64ec976315e6655da51433bfb960cdb1f350",
      findingCode: "CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE",
      findingCount: 1,
      findingRoot:
        "sha256:4dfccd91907322bc560584de13570ef5f243ebdeb8a9ce117673befc3dce9953",
      reviewRoot:
        "sha256:68c66d072b65a5d1dd30351b609a3bd6f1a327740da966ef2bc37cf92e2425b4",
      resultRoot:
        "sha256:72bc2402c9678c3a719587b8d3c5862fbd12dd0d6abd42b5758d6cf6ef708ddc",
      status: "blocked",
      plan26292Eligible: false,
      freshCharged: 0,
      freshAccepted: 0,
      reinterpreted: false,
    },
  },
  reviewedExecutionClosure: {
    schemaVersion: "v1.38-reviewed-execution-closure-v2",
    sourceCommit: "a".repeat(40),
    sourceTree: "b".repeat(40),
    sourceParent: "c".repeat(40),
    checkoutByteManifestRoot: `sha256:${"8".repeat(64)}`,
    installedClosureRoot: `sha256:${"9".repeat(64)}`,
    gitExecutable: "/usr/bin/git",
    gitExecutableSha256: `sha256:${"a".repeat(64)}`,
    gitIsolationRoot: `sha256:${"b".repeat(64)}`,
    nodeSha256: `sha256:${"c".repeat(64)}`,
    pnpmDistributionSha256: `sha256:${"d".repeat(64)}`,
    nativeSourcesRoot: `sha256:${"e".repeat(64)}`,
    pathnameLaunchReplacementResistanceClaimed: false,
    reviewedExecutionClosureRoot: `sha256:${"f".repeat(64)}`,
  },
  execution: {
    focusedTestsPassed: 1,
    sourceOnlyPassed: true,
    checkoutBytesMatchedBefore: true,
    checkoutBytesMatchedAfter: true,
    executionClosureMatchedBeforeAfter: true,
    actualConsumerStatus: "passed",
    actualConsumerObservationRoot: `sha256:${"0".repeat(64)}`,
    destinationsUnchanged: true,
    cleanupComplete: true,
    canonicalWrites: 0,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    localSecretAccessed: false,
    identityConsumed: false,
  },
  findings: [],
  findingCount: 0,
  findingRoot: `sha256:${"1".repeat(64)}`,
  sourceReviewPassed: true,
  identityClaims: {
    independentPersonClaimed: false,
    externalIdentityClaimed: false,
    cryptographicReviewerIdentityClaimed: false,
    independentCustodyClaimed: false,
    separatePermissioningClaimed: false,
    maliciousOperatorResistanceClaimed: false,
    hostileSameUidResistanceClaimed: false,
    pathnameLaunchReplacementResistanceClaimed: false,
  },
  authority: {
    ...falseAuthority(),
    plan26292Eligible: true,
    freshCharged: 0,
    freshAccepted: 0,
  },
  reviewRoot: `sha256:${"2".repeat(64)}`,
  candidatePayloadRoot: `sha256:${"0".repeat(64)}`,
  }
  candidate.findingRoot = computeV138Plan262103FindingRoot(candidate.findings)
  candidate.reviewedExecutionClosure.reviewedExecutionClosureRoot =
    computeV138Plan262103PortableClosureRoot(candidate.reviewedExecutionClosure)
  return candidate
}

const carrierFixture = () => {
  const candidate = candidateFixture()
  candidate.candidatePayloadRoot =
    computeV138Plan262103CandidatePayloadRoot(candidate)
  return {
    schemaVersion: V138_PLAN_262_103_CARRIER_SCHEMA,
    protocol: "git-object-byte-custody-external-carrier-v1",
    status: "zero_findings",
    reviewedSource: candidate.correctedSource,
    candidate: {
      path: V138_PLAN_262_103_CANDIDATE_PATH,
      mode: "100644",
      byteLength: 4096,
      sha256: `sha256:${"3".repeat(64)}`,
      blobOid: "1".repeat(40),
      candidatePayloadRoot: candidate.candidatePayloadRoot,
    },
    review: {
      path: V138_PLAN_262_103_REPORT_PATH,
      mode: "100644",
      byteLength: 1024,
      sha256: candidate.reviewRoot,
      blobOid: "2".repeat(40),
    },
    actualConsumer: {
      status: "passed",
      observationRoot: candidate.execution.actualConsumerObservationRoot,
      executionClosureMatchedBeforeAfter: true,
      destinationsUnchanged: true,
      cleanupComplete: true,
      canonicalWrites: 0,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      localSecretAccessed: false,
      identityConsumed: false,
    },
    protectedHistory: candidate.protectedHistory,
    findings: [],
    findingCount: 0,
    sourceReviewPassed: true,
    authority: candidate.authority,
    carrierRoot: `sha256:${"0".repeat(64)}`,
  }
}

describe("Plan 262-103 non-recursive review contract", () => {
  it("pins candidate and carrier paths and distinct root domains", () => {
    expect(V138_PLAN_262_103_CANDIDATE_PATH).not.toBe(
      V138_PLAN_262_103_CARRIER_PATH,
    )
    expect(V138_PLAN_262_103_CANDIDATE_DOMAIN).not.toBe(
      V138_PLAN_262_103_CARRIER_DOMAIN,
    )
  })

  it("matches independent fixed canonical preimage bytes and roots", () => {
    const candidateGolden = {
      nested: { b: "β", a: 'quote"' },
      array: [1, "\n", { z: null, x: true }],
      a: "é",
      candidatePayloadRoot: `sha256:${"0".repeat(64)}`,
    }
    expect(candidateV138Plan262103Preimage(candidateGolden).toString("hex")).toBe(
      "76312e33383a706c616e2d3236322d3130333a6769742d6f626a6563742d627974652d637573746f64793a63616e6469646174652d7061796c6f61643a7636007b2261223a22c3a9222c226172726179223a5b312c225c6e222c7b2278223a747275652c227a223a6e756c6c7d5d2c226e6573746564223a7b2261223a2271756f74655c22222c2262223a22ceb2227d7d0a",
    )
    expect(computeV138Plan262103CandidatePayloadRoot(candidateGolden)).toBe(
      "sha256:3d1da9eeede3aa3fbcb31ae6dae5a80801d3c7ac7739c47780bd5295c4b53be4",
    )

    const carrierGolden = {
      custody: { path: "r", mode: "100644", byteLength: 4 },
      binaryReportSha256: `sha256:${"ab".repeat(32)}`,
      carrierRoot: `sha256:${"0".repeat(64)}`,
    }
    expect(carrierV138Plan262103Preimage(carrierGolden).toString("hex")).toBe(
      "76312e33383a706c616e2d3236322d3130333a6769742d6f626a6563742d627974652d637573746f64793a636172726965723a7631007b2262696e6172795265706f7274536861323536223a227368613235363a61626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162222c22637573746f6479223a7b22627974654c656e677468223a342c226d6f6465223a22313030363434222c2270617468223a2272227d7d0a",
    )
    expect(computeV138Plan262103CarrierRoot(carrierGolden)).toBe(
      "sha256:c9ad4a1fcc004154d5f4e6df9173a128bf04ecfb0e1db09cfa01c4262e0b212d",
    )
    expect(computeV138Plan262103CandidatePayloadRoot(candidateFixture())).not.toBe(
      sha256(Buffer.from(JSON.stringify(candidateFixture()))),
    )
  })

  it("validates a closed acyclic candidate and rejects self-file custody", () => {
    const candidate = candidateFixture()
    candidate.candidatePayloadRoot =
      computeV138Plan262103CandidatePayloadRoot(candidate)
    expect(validateV138Plan262103Candidate(candidate).status).toBe("zero_findings")
    for (const forbidden of [
      "candidateJsonSha256",
      "fileSha256",
      "blobOid",
      "candidateCommit",
      "excludedFields",
    ]) {
      expect(() =>
        validateV138Plan262103Candidate({ ...candidate, [forbidden]: "x" }),
      ).toThrow("V138_PLAN_262_103_CANDIDATE_INVALID")
    }
  })

  it("validates an external carrier and rejects recursive self-custody", () => {
    const carrier = carrierFixture()
    carrier.carrierRoot = computeV138Plan262103CarrierRoot(carrier)
    expect(validateV138Plan262103Carrier(carrier).status).toBe("zero_findings")
    for (const forbidden of [
      "carrierSha256",
      "carrierBlobOid",
      "carrierCommit",
      "excludedFields",
    ]) {
      expect(() =>
        validateV138Plan262103Carrier({ ...carrier, [forbidden]: "x" }),
      ).toThrow("V138_PLAN_262_103_CARRIER_INVALID")
    }
  })

  it("rejects path, mode, root, history, and authority drift", () => {
    const carrier = carrierFixture()
    carrier.carrierRoot = computeV138Plan262103CarrierRoot(carrier)
    const mutations = [
      { ...carrier, carrierRoot: `sha256:${"f".repeat(64)}` },
      { ...carrier, candidate: { ...carrier.candidate, path: "elsewhere.json" } },
      { ...carrier, review: { ...carrier.review, mode: "120000" } },
      {
        ...carrier,
        protectedHistory: {
          ...carrier.protectedHistory,
          plan101: { ...carrier.protectedHistory.plan101, reinterpreted: true },
        },
      },
      {
        ...carrier,
        authority: { ...carrier.authority, candidateSearchAuthorized: true },
      },
    ]
    for (const mutation of mutations)
      expect(() => validateV138Plan262103Carrier(mutation)).toThrow(
        "V138_PLAN_262_103_CARRIER_INVALID",
      )
  })
})

describe("Plan 262-103 actual final consumer", () => {
  it("keeps source-only execution frozen, zero-consumption, and non-authorizing", async () => {
    const writes: string[] = []
    const output: string[] = []
    await executeV138Plan262103ConsumerCli(["--check-source-only"], {
      repoRoot: "/synthetic",
      assertSourceOnly: () => undefined,
      writeOutput: (value) => output.push(value),
      writeEvidence: (target) => writes.push(target),
    })
    expect(writes).toEqual([])
    expect(JSON.parse(output.join("").trim())).toMatchObject({
      status: "passed",
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  })

  it("returns a typed ineligible stop for a valid blocked review", () => {
    const candidate = candidateFixture()
    candidate.status = "blocked" as "zero_findings"
    candidate.findings = [
      {
        code: "SYNTHETIC_FINDING",
        severity: "critical",
        evidenceRoot: `sha256:${"a".repeat(64)}`,
      },
    ]
    candidate.findingCount = 1
    candidate.findingRoot = computeV138Plan262103FindingRoot(candidate.findings)
    candidate.sourceReviewPassed = false
    candidate.execution.actualConsumerStatus = "blocked_review"
    candidate.authority.plan26292Eligible = false
    candidate.candidatePayloadRoot =
      computeV138Plan262103CandidatePayloadRoot(candidate)
    const carrier = carrierFixture()
    carrier.status = "blocked" as "zero_findings"
    carrier.findings = candidate.findings
    carrier.findingCount = 1
    carrier.sourceReviewPassed = false
    carrier.authority.plan26292Eligible = false
    carrier.actualConsumer.status = "blocked_review"
    carrier.candidate.candidatePayloadRoot = candidate.candidatePayloadRoot
    carrier.carrierRoot = computeV138Plan262103CarrierRoot(carrier)

    expect(
      consumeV138Plan262103ReviewNoPublish({
        candidate,
        carrier,
        reportBytes: Buffer.from("blocked review\n"),
        authenticateCustody: () => undefined,
        deriveFrozenArtifacts: () => {
          throw new Error("derivation must not run")
        },
      }),
    ).toEqual({
      kind: "ineligible_review",
      status: "blocked",
      findingCount: 1,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  })

  it("derives only in memory for a literal zero carrier", () => {
    const candidate = candidateFixture()
    candidate.candidatePayloadRoot =
      computeV138Plan262103CandidatePayloadRoot(candidate)
    const carrier = carrierFixture()
    carrier.candidate.candidatePayloadRoot = candidate.candidatePayloadRoot
    carrier.carrierRoot = computeV138Plan262103CarrierRoot(carrier)
    const result = consumeV138Plan262103ReviewNoPublish({
      candidate,
      carrier,
      reportBytes: Buffer.from("review\n"),
      authenticateCustody: () => undefined,
      deriveFrozenArtifacts: () => ({
        sealRoot: `sha256:${"b".repeat(64)}`,
        envelopeRoot: `sha256:${"c".repeat(64)}`,
      }),
    })
    expect(result).toMatchObject({
      kind: "eligible",
      status: "sealed_inactive_not_published",
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  })

  it("lists every canonical review, seal, live, lifecycle, and downstream destination", () => {
    expect(V138_PLAN_262_103_FORBIDDEN_DESTINATIONS).toContain(
      V138_PLAN_262_103_CANDIDATE_PATH,
    )
    expect(V138_PLAN_262_103_FORBIDDEN_DESTINATIONS).toContain(
      V138_PLAN_262_103_CARRIER_PATH,
    )
    expect(V138_PLAN_262_103_FORBIDDEN_DESTINATIONS).toContain(
      ".planning/artifacts/v1.38-successor-source-seal-v13.json",
    )
    expect(V138_PLAN_262_103_FORBIDDEN_DESTINATIONS).toContain(
      ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
    )
  })

  it("does not create canonical files while validating synthetic inputs", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan-102-source-only-"))
    try {
      const sentinel = path.join(root, "sentinel")
      writeFileSync(sentinel, "unchanged")
      await executeV138Plan262103ConsumerCli(["--check-source-only"], {
        repoRoot: root,
        assertSourceOnly: () => undefined,
        writeOutput: () => undefined,
      })
      expect(readFileSync(sentinel, "utf8")).toBe("unchanged")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
