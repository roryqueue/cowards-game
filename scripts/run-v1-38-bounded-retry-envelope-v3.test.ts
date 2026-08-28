import {
  createHash,
} from "node:crypto"
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_PATHS,
  V138_BOUNDED_RETRY_V3_POLICY,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
  appendV138RetryV3JournalRecord,
  checkV138InactiveRetryV3Envelope,
  checkV138ProtectedHistoryV3,
  createV138InactiveRetryV3Envelope,
  deriveV138RetryV3State,
  encodeV138RetryV3CanonicalJson,
  requireV138RetryV3DestinationAbsent,
  requireV138RetryV3ReproductionAbsent,
  type V138RetryV3JournalRecord,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  V138_RETRY_V3_CLOSED_DIRECT_DEFECTS,
  V138_RETRY_V3_PASSED_OBSERVATIONS,
  V138_BOUNDED_RETRY_V3_CUSTODY,
  V138_BOUNDED_RETRY_V3_PATHS as CONTROLLER_PATHS,
  V138_BOUNDED_RETRY_V3_PRODUCTION_MODES,
  acquireV138RetryV3OwnerLease,
  authenticateV138CommittedRegularFile,
  computeV138Plan262101FindingRoot,
  computeV138Plan262101PortableRoot,
  computeV138Plan262101ResultRoot,
  computeV138Plan262101ReviewRoot,
  executeV138BoundedRetryV3Cli,
  parseV138RetryV3RegularBlobTreeEntry,
  runV138BoundedRetryV3Controller,
  validateV138Plan262101ReviewedExecutionClosure,
  type V138BoundedRetryV3ControllerEffects,
} from "./run-v1-38-bounded-retry-envelope-v3.js"
import {
  applyV138RetryV3NativeLifecycle,
  acquireV138RetryV3NativeOwnerLease,
  authenticateV138RetryV3ExecutionClosure,
  publishV138RetryV3NativePair,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const roots: string[] = []

const createGitFixture = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-raw-git-custody-"))
  roots.push(root)
  runV138RetryV3IsolatedGit(root, ["init", "--quiet"])
  runV138RetryV3IsolatedGit(root, ["config", "user.name", "Plan 262 Test"])
  runV138RetryV3IsolatedGit(root, [
    "config",
    "user.email",
    "plan-262-test@example.invalid",
  ])
  return root
}

const commitFixtureFile = (
  root: string,
  repoPath: string,
  bytes: Buffer,
  mode: 0o644 | 0o755 = 0o644,
): string => {
  const target = path.join(root, ...repoPath.split("/"))
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, bytes)
  chmodSync(target, mode)
  runV138RetryV3IsolatedGit(root, ["add", "--", repoPath])
  runV138RetryV3IsolatedGit(root, ["commit", "--quiet", "-m", repoPath])
  return runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
}

const portableClosure = () => ({
  schemaVersion: "v1.38-reviewed-execution-closure-v2" as const,
  sourceCommit: "1".repeat(40),
  sourceTree: "2".repeat(40),
  sourceParent: "3".repeat(40),
  checkoutByteManifestRoot: `sha256:${"4".repeat(64)}` as const,
  installedClosureRoot: `sha256:${"5".repeat(64)}` as const,
  gitExecutable: "/usr/bin/git" as const,
  gitExecutableSha256: `sha256:${"6".repeat(64)}` as const,
  gitIsolationRoot: `sha256:${"7".repeat(64)}` as const,
  nodeSha256: `sha256:${"8".repeat(64)}` as const,
  pnpmDistributionSha256: `sha256:${"9".repeat(64)}` as const,
  nativeSourcesRoot: `sha256:${"a".repeat(64)}` as const,
  pathnameLaunchReplacementResistanceClaimed: false as const,
})

const plan262101Review = () => {
  const reviewedExecutionClosure = portableClosure()
  const reviewReportBytes = Buffer.from("# Plan 262-101 v5 Review\n")
  const body = {
    schemaVersion:
      "v1.38-plan-262-101-git-object-byte-custody-rereview-v5",
    protocol: "git-object-byte-custody-v1",
    status: "zero_findings",
    correctedSource: {
      commit: reviewedExecutionClosure.sourceCommit,
      tree: reviewedExecutionClosure.sourceTree,
      parent: reviewedExecutionClosure.sourceParent,
      noLaterRewrite: true,
      summaryTrustedAsVerdict: false,
      files: [
        {
          path: "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
          mode: "100644",
          blob: "a".repeat(40),
          byteLength: 1,
          sha256: `sha256:${"a".repeat(64)}`,
        },
        {
          path: "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
          mode: "100644",
          blob: "b".repeat(40),
          byteLength: 1,
          sha256: `sha256:${"b".repeat(64)}`,
        },
        {
          path: "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
          mode: "100644",
          blob: "c".repeat(40),
          byteLength: 1,
          sha256: `sha256:${"c".repeat(64)}`,
        },
      ],
    },
    protectedHistory: {
      provisionalPairReinterpreted: false,
      plan98: {
        sourceCommit: "702bfa5216e3b0e15b4816ce28c98dbcdee38517",
        sourceTree: "4a4ea89f5392c250d32a39abde0bcf9b98aa079f",
        sourceParent: "266c977a657c04c32a54b2293d01cf6fab1edf10",
        summarySha256:
          "sha256:0d42f4833cce41f80e66d2343b4427e2b8149942c070a211338ffc0cc04dfe99",
      },
      plan99: {
        provisionalPairCommit: "19a6eb53a2ad2c0188009d095103c42718aa3214",
        artifactSha256:
          "sha256:b52599fcbcf53f3eac8e435f87ad85d6d8cc4512dcfa18fe029d5670127aaa34",
        reviewSha256:
          "sha256:f0fe8877f1b33132b101aaa4e475d06fc462e0ce19af22785e0049daff338b34",
        summarySha256:
          "sha256:0ab477151ea5a272987c7f83567c172ab540ec9c979b84501f1bc7cb45fbd294",
        provisionalFindingCount: 0,
        provisionalFindingRoot:
          "sha256:f42b8afbcf35570b2c5be6bee0e7b06548deb19b4f533260bf16c56d0c7a4b9c",
        provisionalReviewRoot:
          "sha256:9d5a3f650a34e3074c49ceb61072ba361932af20a5a1bf7b8fb61e197d345f4a",
        blockedFindingCode: "GIT_SHOW_BYTES_TRIMMED",
        blockedFindingRoot:
          "sha256:05a090e72cb43224683b190bca9b27ac81fed4cbef2792a9cb39d8d78e233b77",
        blockedReviewRoot:
          "sha256:332855378479e0bceee3f82a4e5445039d476345ab4d1d9b019d5c435a57664b",
        plan26292Eligible: false,
        freshCharged: 0,
        freshAccepted: 0,
      },
    },
    execution: {
      focusedTestsPassed: 0,
      sourceOnlyPassed: true,
      checkoutBytesMatchedBefore: true,
      checkoutBytesMatchedAfter: true,
      executionClosureMatchedBeforeAfter: true,
      actualConsumerStatus: "passed",
      actualConsumerCandidateJsonSha256: `sha256:${"d".repeat(64)}`,
      actualConsumerCandidateReviewSha256: `sha256:${"e".repeat(64)}`,
      destinationsUnchanged: true,
      cleanupComplete: true,
      canonicalWrites: 0,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      localSecretAccessed: false,
      identityConsumed: false,
    },
    reviewedExecutionClosure: {
      ...reviewedExecutionClosure,
      reviewedExecutionClosureRoot:
        computeV138Plan262101PortableRoot(reviewedExecutionClosure),
    },
    findings: [],
    findingCount: 0,
    findingRoot: computeV138Plan262101FindingRoot([]),
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
      plan26292Eligible: true,
      authorizesExecution: false,
      authorizationCreated: false,
      sealV13Created: false,
      retryEnvelopeV3Created: false,
      journalV3Created: false,
      receiptsV3Created: false,
      terminalV3Created: false,
      reproductionV17Created: false,
      dispositionV3Created: false,
      correctionV11Created: false,
      route11ActivationCreated: false,
      readinessV3Created: false,
      lifecycleV3Created: false,
      liveInvoked: false,
      localSecretAccessed: false,
      lifecycleMutated: false,
      freshCharged: 0,
      freshAccepted: 0,
      phase263PlanningAuthorized: false,
      phase263ExecutionAuthorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      activationAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
      archiveAuthorized: false,
      tagAuthorized: false,
    },
    reviewRoot: computeV138Plan262101ReviewRoot(reviewReportBytes),
  }
  return {
    review: { ...body, resultRoot: computeV138Plan262101ResultRoot(body) },
    reviewReportBytes,
  }
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const envelope = () =>
  createV138InactiveRetryV3Envelope({
    sourceRoot: SHA_A,
    reviewRoot: SHA_B,
    sealRoot: SHA_A,
    protectedHistoryRoot:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedHistoryRoot,
    protectedHistoricalIdentities:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedIdentities,
  })

const append = (
  records: readonly V138RetryV3JournalRecord[],
  atMilliseconds: number,
  event: Parameters<typeof appendV138RetryV3JournalRecord>[1],
) =>
  appendV138RetryV3JournalRecord(
    records,
    event,
    atMilliseconds,
    envelope().envelopeRoot,
  )

describe("bounded retry envelope v3 contract", () => {
  it("owns a fresh finite identity namespace and correction-aware history", () => {
    expect(V138_BOUNDED_RETRY_V3_POLICY).toMatchObject({
      schemaVersion: "retry-envelope:v3",
      maximumRouteStarts: 3,
      maximumPreflightObservations: 12,
      envelopeLifetimeMilliseconds: 14_400_000,
      refusalSpacingMilliseconds: 300_000,
      calibrationFailureBackoffMilliseconds: 900_000,
      calibrationAttemptsPerRoute: 8,
      calibrationShardCount: 4,
      samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2_500,
      reproductionCellCount: 540,
      maximumReproductionRuns: 1,
      rulesAuthority: "MATCH_KERNEL",
    })
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.routes).toEqual([
      "route:v3:0",
      "route:v3:1",
      "route:v3:2",
    ])
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations).toHaveLength(24)
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction).toHaveLength(540)
    expect(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY).toMatchObject({
      preResearchBaselineCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0",
      researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15",
      correctionV10Root:
        "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3",
      dispositionV2Root:
        "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f",
      lifecycleV2Root:
        "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6",
    })
  })

  it("protects the exact blocked Plan-90/91 history without treating it as current authority", () => {
    expect(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY).toMatchObject({
      blockedSourceReview: {
        status: "blocked",
        reviewedSourceCommit: "32f53bb743db799810dff820b8b7eb309b6a6629",
        findingRoot:
          "sha256:99ceec74a141e228b2e027c6f0b5d85ddfed8d917ad74e7a493e6d8257f8701a",
        reviewRoot:
          "sha256:08938c5eb520b041e2b74ac07b7906d14e52197e3788ec97ff6f29350bbdf80d",
        historicalResultReinterpreted: false,
        currentSourceReviewEligible: false,
      },
    })
    expect(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedFiles).toEqual(
      expect.arrayContaining([
        [
          ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json",
          "sha256:c4dbbfa56bf903b2cb302c7a86acb87359da3f2ac696dbc2ca783376604a5232",
          "eff3f1fea4719131f7ced617df7b0a1d4c89d4d2",
        ],
        [
          ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-91-REVIEW.md",
          "sha256:fb82e3be073f896a1514ddfc4d16fc84a478342f8375ab6002e7598d72275272",
          "73596b860c06c6a477960fe8936053b1006e1edd",
        ],
        [
          ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-91-SUMMARY.md",
          "sha256:1db0d52a482f3ce954c03da3b59d22549ca6a913290b2d03ce87c80cb045cbf0",
          "2070f4dd0444c28623c4fbc0270b70a654ea92a1",
        ],
        [
          ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-90-SUMMARY.md",
          "sha256:4daded12537692e2e180ee9ccd34b8de54b425398d9a68b9923fcfa8b27988b7",
          "ff882bbadc057c0e0786d9251fb942095155db72",
        ],
      ]),
    )
  })

  it("derives Git and installed execution custody through an isolated exact executable", () => {
    const hostile = mkdtempSync(path.join(tmpdir(), "v138-hostile-git-"))
    roots.push(hostile)
    writeFileSync(path.join(hostile, "git"), "#!/bin/sh\nexit 91\n", {
      mode: 0o700,
    })
    expect(
      runV138RetryV3IsolatedGit(process.cwd(), ["rev-parse", "HEAD"], {
        PATH: hostile,
        GIT_CONFIG_GLOBAL: path.join(hostile, "hostile-gitconfig"),
      }),
    ).toMatch(/^[0-9a-f]{40}$/u)
    const closure = authenticateV138RetryV3ExecutionClosure(process.cwd(), {
      sourceCommit: runV138RetryV3IsolatedGit(process.cwd(), [
        "rev-parse",
        "HEAD",
      ]),
      checkoutPaths: ["package.json", "pnpm-lock.yaml"],
    })
    expect(closure).toMatchObject({
      gitExecutable: "/usr/bin/git",
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/u),
      sourceTree: expect.stringMatching(/^[0-9a-f]{40}$/u),
      checkoutByteManifestRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      installedClosureRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      pathnameLaunchReplacementResistanceClaimed: false,
    })
  })

  it.each([
    ["final newline", Buffer.from("alpha\n")],
    ["no final newline", Buffer.from("alpha")],
    ["empty", Buffer.alloc(0)],
    ["CRLF", Buffer.from("alpha\r\nbeta\r\n")],
    ["invalid UTF-8", Buffer.from([0xff, 0xfe, 0x80, 0xc0])],
    ["embedded NUL", Buffer.from([0x61, 0x00, 0x62, 0x00])],
  ])("preserves exact %s Git blob bytes", (_name, bytes) => {
    const root = createGitFixture()
    const commit = commitFixtureFile(root, "fixture.bin", bytes)
    const authenticated = authenticateV138CommittedRegularFile(
      root,
      commit,
      "fixture.bin",
    )
    expect(authenticated.bytes.equals(bytes)).toBe(true)
    expect(authenticated.byteLength).toBe(bytes.length)
    expect(authenticated.mode).toBe("100644")
    expect(
      runV138RetryV3IsolatedGitBytes(root, [
        "cat-file",
        "blob",
        authenticated.oid,
      ]).equals(bytes),
    ).toBe(true)
  })

  it.each([
    [0o644, "100644"],
    [0o755, "100755"],
  ] as const)("authenticates working mode %o as Git mode %s", (mode, gitMode) => {
    const root = createGitFixture()
    const commit = commitFixtureFile(root, "mode.sh", Buffer.from("exit 0\n"), mode)
    expect(
      authenticateV138CommittedRegularFile(root, commit, "mode.sh"),
    ).toMatchObject({ mode: gitMode })
  })

  it("rejects missing, symlink, tree, byte drift, and mode drift from synthetic repositories", () => {
    const root = createGitFixture()
    const commit = commitFixtureFile(root, "regular.bin", Buffer.from("exact\n"))
    expect(() =>
      authenticateV138CommittedRegularFile(root, commit, "missing.bin"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")

    symlinkSync("regular.bin", path.join(root, "link.bin"))
    runV138RetryV3IsolatedGit(root, ["add", "--", "link.bin"])
    runV138RetryV3IsolatedGit(root, ["commit", "--quiet", "-m", "symlink"])
    const symlinkCommit = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
    expect(() =>
      authenticateV138CommittedRegularFile(root, symlinkCommit, "link.bin"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")

    commitFixtureFile(root, "tree/child.bin", Buffer.from("child\n"))
    const treeCommit = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
    expect(() =>
      authenticateV138CommittedRegularFile(root, treeCommit, "tree"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")

    writeFileSync(path.join(root, "regular.bin"), Buffer.from("drift\n"))
    expect(() =>
      authenticateV138CommittedRegularFile(root, commit, "regular.bin"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")
    writeFileSync(path.join(root, "regular.bin"), Buffer.from("exact\n"))
    chmodSync(path.join(root, "regular.bin"), 0o755)
    expect(() =>
      authenticateV138CommittedRegularFile(root, commit, "regular.bin"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")
  })

  it("rejects a synthetic gitlink before reading a working payload", () => {
    const root = createGitFixture()
    const base = commitFixtureFile(root, "base.bin", Buffer.from("base\n"))
    runV138RetryV3IsolatedGit(root, [
      "update-index",
      "--add",
      "--cacheinfo",
      `160000,${base},gitlink`,
    ])
    const tree = runV138RetryV3IsolatedGit(root, ["write-tree"])
    const gitlinkCommit = runV138RetryV3IsolatedGit(root, [
      "commit-tree",
      tree,
      "-p",
      base,
      "-m",
      "gitlink",
    ])
    expect(() =>
      authenticateV138CommittedRegularFile(root, gitlinkCommit, "gitlink"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")
  })

  it.each([
    ["missing NUL", Buffer.from(`100644 blob ${"a".repeat(40)}\tfile.bin`)],
    [
      "duplicate records",
      Buffer.from(
        `100644 blob ${"a".repeat(40)}\tfile.bin\0` +
          `100644 blob ${"a".repeat(40)}\tfile.bin\0`,
      ),
    ],
    ["malformed metadata", Buffer.from(`100644  blob ${"a".repeat(40)}\tfile.bin\0`)],
    ["wrong path", Buffer.from(`100644 blob ${"a".repeat(40)}\tother.bin\0`)],
    ["wrong OID", Buffer.from("100644 blob not-an-oid\tfile.bin\0")],
    ["symlink mode", Buffer.from(`120000 blob ${"a".repeat(40)}\tfile.bin\0`)],
    ["gitlink mode", Buffer.from(`160000 commit ${"a".repeat(40)}\tfile.bin\0`)],
    ["tree type", Buffer.from(`040000 tree ${"a".repeat(40)}\tfile.bin\0`)],
    [
      "unexpected leading record",
      Buffer.concat([
        Buffer.from([0]),
        Buffer.from(`100644 blob ${"a".repeat(40)}\tfile.bin\0`),
      ]),
    ],
  ])("rejects %s ls-tree metadata", (_name, record) => {
    expect(() =>
      parseV138RetryV3RegularBlobTreeEntry(record, "file.bin"),
    ).toThrow("V138_RETRY_SOURCE_CUSTODY_INVALID")
  })

  it("uses native retained-root custody for pair publication and owner contention", async () => {
    if (process.platform !== "darwin") return
    const root = mkdtempSync(path.join(tmpdir(), "v138-v3-native-custody-"))
    roots.push(root)
    mkdirSync(path.join(root, "pair"))
    await publishV138RetryV3NativePair(root, {
      transactionId: "task-1-native-pair",
      intentPath: "task-1-native-pair.intent",
      members: [
        { target: "pair/left.json", bytes: "left\n" },
        { target: "pair/right.json", bytes: "right\n" },
      ],
    })
    expect(readFileSync(path.join(root, "pair/left.json"), "utf8")).toBe(
      "left\n",
    )
    expect(readFileSync(path.join(root, "pair/right.json"), "utf8")).toBe(
      "right\n",
    )
    const owner = await acquireV138RetryV3NativeOwnerLease(root)
    await expect(acquireV138RetryV3NativeOwnerLease(root)).rejects.toThrow(
      "V138_RETRY_OWNER_LOCK_ACTIVE",
    )
    await owner.release()
    const restarted = await acquireV138RetryV3NativeOwnerLease(root)
    await restarted.release()
  })

  it.each([
    ["maximumRouteStarts", 4],
    ["maximumPreflightObservations", 13],
    ["envelopeLifetimeMilliseconds", 14_400_001],
    ["refusalSpacingMilliseconds", 299_999],
    ["calibrationFailureBackoffMilliseconds", 899_999],
    ["calibrationAttemptsPerRoute", 9],
    ["calibrationShardCount", 5],
    ["samplingMilliseconds", 201],
    ["minimumEffectiveAvailableBasisPoints", 2_499],
    ["reproductionCellCount", 539],
    ["maximumReproductionRuns", 2],
    ["rulesAuthority", "COPIED_KERNEL"],
    ["supervisedRuntimeOnly", false],
    ["assuranceClass", "independent_custody"],
    ["partialAcceptedEvidenceReusable", true],
    ["phase263PlanningAuthorized", true],
    ["candidateSearchAuthorized", true],
    ["formationMaterializationAuthorized", true],
    ["holdoutOpeningAuthorized", true],
    ["publicAuthorized", true],
    ["productAuthorized", true],
    ["productionAuthorized", true],
    ["gameplayChangeAuthorized", true],
  ] as const)("rejects mutation of frozen policy field %s", (field, value) => {
    const mutated = structuredClone(envelope()) as Record<string, unknown>
    ;(mutated.policy as Record<string, unknown>)[field] = value
    expect(() => checkV138InactiveRetryV3Envelope(mutated)).toThrow(
      "V138_RETRY_ENVELOPE_INVALID",
    )
  })

  it.each([
    ["preResearchBaselineCommit", "0".repeat(40)],
    ["researchCommit", "0".repeat(40)],
    ["correctionV10Root", `sha256:${"0".repeat(64)}`],
    ["dispositionV2Root", `sha256:${"0".repeat(64)}`],
    ["lifecycleV2Root", `sha256:${"0".repeat(64)}`],
    ["authorizationScope", "reclaimed_v2_capacity"],
  ] as const)("rejects protected-history %s mutation", (field, value) => {
    const mutated = structuredClone(
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
    ) as Record<string, unknown>
    mutated[field] = value
    expect(() => checkV138ProtectedHistoryV3(mutated)).toThrow(
      "V138_RETRY_V3_PROTECTED_HISTORY_INVALID",
    )
  })

  it("charges durable reservations, enforces exact threshold and spacing, and never reclaims history", () => {
    let records: readonly V138RetryV3JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
    })
    records = append(records, 1_001, {
      kind: "observe_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    expect(() =>
      append(records, 301_000, {
        kind: "reserve_preflight",
        identity: "preflight:v3:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_REFUSAL_SPACING_REQUIRED")
    records = append(records, 301_001, {
      kind: "reserve_preflight",
      identity: "preflight:v3:1",
      owner: "owner-a",
    })
    records = append(records, 301_002, {
      kind: "observe_preflight",
      identity: "preflight:v3:1",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_500,
    })
    records = append(records, 301_003, {
      kind: "reserve_route",
      identity: "route:v3:0",
      owner: "owner-a",
      preflightIdentity: "preflight:v3:1",
    })
    records = append(records, 301_004, {
      kind: "reserve_calibration",
      routeIdentity: "route:v3:0",
      owner: "owner-a",
      identities: V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.slice(0, 8),
    })
    expect(deriveV138RetryV3State(envelope(), records)).toMatchObject({
      preflightObservationsConsumed: 2,
      routeStartsConsumed: 1,
      calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
      disposition: "active",
      downstreamAuthority: false,
    })
    expect(() =>
      append(records, 301_005, {
        kind: "reserve_preflight",
        identity: "preflight:v3:0",
        owner: "owner-b",
      }),
    ).toThrow()
  })

  it("terminalizes the inclusive four-hour boundary and binds canonical roots", () => {
    let records: readonly V138RetryV3JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
    })
    records = append(records, 2_000, {
      kind: "observe_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    const deadline = 2_000 + V138_BOUNDED_RETRY_V3_POLICY.envelopeLifetimeMilliseconds
    expect(() => append(records, deadline - 1, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })).toThrow("V138_RETRY_TIME_WINDOW_ACTIVE")
    records = append(records, deadline, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })
    const state = deriveV138RetryV3State(envelope(), records)
    expect(state).toMatchObject({
      disposition: "exhausted",
      terminalReason: "time_window_expired",
      nextPreflightIdentity: null,
      nextRouteIdentity: null,
    })
    expect(encodeV138RetryV3CanonicalJson(state).endsWith("\n")).toBe(true)
    expect(state.stateRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("requires every reserved canonical destination to remain absent", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-v3-absence-"))
    roots.push(root)
    mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true })
    for (const destination of Object.values(V138_BOUNDED_RETRY_V3_PATHS)) {
      expect(requireV138RetryV3DestinationAbsent(root, destination)).toBe(true)
    }
    expect(requireV138RetryV3ReproductionAbsent(root)).toBe(true)
    writeFileSync(
      path.join(root, V138_BOUNDED_RETRY_V3_PATHS.reproduction),
      "{}\n",
    )
    expect(() => requireV138RetryV3ReproductionAbsent(root)).toThrow(
      "V138_RETRY_REPRODUCTION_ARTIFACT_INVALID",
    )
  })
})

describe("synthetic-only hardened v3 controller", () => {
  it("rejects the immutable Plan-99 provisional v4 pair as current authority", () => {
    const historical = JSON.parse(
      readFileSync(
        path.join(
          process.cwd(),
          ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
        ),
        "utf8",
      ),
    )
    expect(() =>
      validateV138Plan262101ReviewedExecutionClosure(
        historical,
        portableClosure() as never,
        Buffer.from("# historical v4\n"),
      ),
    ).toThrow("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
    expect(historical.authority).toMatchObject({
      freshCharged: 0,
      freshAccepted: 0,
      liveInvoked: false,
      localSecretAccessed: false,
    })
    expect(historical.authority).not.toHaveProperty("canonicalWrites")
    for (const destination of [
      CONTROLLER_PATHS.seal,
      CONTROLLER_PATHS.envelope,
      CONTROLLER_PATHS.journal,
      CONTROLLER_PATHS.terminal,
      CONTROLLER_PATHS.reproduction,
      CONTROLLER_PATHS.receiptManifest,
      CONTROLLER_PATHS.disposition,
      CONTROLLER_PATHS.correction,
      CONTROLLER_PATHS.activation,
      CONTROLLER_PATHS.readiness,
      CONTROLLER_PATHS.lifecycle,
    ]) expect(requireV138RetryV3DestinationAbsent(process.cwd(), destination)).toBe(true)
  })

  it("accepts only the exact Plan-101 v5 review and portable domain", () => {
    const { review, reviewReportBytes } = plan262101Review()
    const current = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    } as const
    expect(
      validateV138Plan262101ReviewedExecutionClosure(
        review,
        current,
        reviewReportBytes,
      ),
    ).toBe(current)
    expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).not.toBe(
      review.reviewedExecutionClosure.installedClosureRoot,
    )
    expect(review.reviewedExecutionClosure).not.toHaveProperty("gitObjectRoot")
    expect(CONTROLLER_PATHS.sourceReview).toBe(
      ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
    )
    expect(CONTROLLER_PATHS.sourceReviewReport).toContain("262-101-REVIEW.md")
    expect(review.protectedHistory).toMatchObject({
      provisionalPairReinterpreted: false,
      plan99: {
        blockedFindingCode: "GIT_SHOW_BYTES_TRIMMED",
        plan26292Eligible: false,
        freshCharged: 0,
        freshAccepted: 0,
      },
    })
  })

  it("keeps Plan-98/99 bytes immutable and all four v5 root domains distinct", () => {
    const { review, reviewReportBytes } = plan262101Review()
    const digest = (repoPath: string) =>
      `sha256:${createHash("sha256")
        .update(readFileSync(path.join(process.cwd(), repoPath)))
        .digest("hex")}`
    expect(
      digest(
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-98-SUMMARY.md",
      ),
    ).toBe(review.protectedHistory.plan98.summarySha256)
    expect(
      digest(
        ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
      ),
    ).toBe(review.protectedHistory.plan99.artifactSha256)
    expect(
      digest(
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-99-REVIEW.md",
      ),
    ).toBe(review.protectedHistory.plan99.reviewSha256)
    expect(
      digest(
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-99-SUMMARY.md",
      ),
    ).toBe(review.protectedHistory.plan99.summarySha256)
    expect(
      new Set([
        review.reviewedExecutionClosure.reviewedExecutionClosureRoot,
        review.resultRoot,
        review.reviewRoot,
        review.findingRoot,
      ]).size,
    ).toBe(4)
    expect(computeV138Plan262101ReviewRoot(reviewReportBytes)).toBe(
      review.reviewRoot,
    )
  })

  it("rejects review-report or result-root drift independently", () => {
    const candidate = plan262101Review()
    const current = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    } as const
    expect(() =>
      validateV138Plan262101ReviewedExecutionClosure(
        candidate.review,
        current,
        Buffer.from("# different review bytes\n"),
      ),
    ).toThrow("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
    const wrongRoot = structuredClone(candidate.review) as any
    wrongRoot.resultRoot = wrongRoot.reviewRoot
    expect(() =>
      validateV138Plan262101ReviewedExecutionClosure(
        wrongRoot,
        current,
        candidate.reviewReportBytes,
      ),
    ).toThrow("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  })

  it.each([
    ["missing closure", (review: any) => delete review.reviewedExecutionClosure],
    ["moved closure", (review: any) => {
      review.executionClosure = review.reviewedExecutionClosure
      delete review.reviewedExecutionClosure
    }],
    ["extra closure member", (review: any) => {
      review.reviewedExecutionClosure.extra = false
    }],
    ["portable git object root", (review: any) => {
      review.reviewedExecutionClosure.gitObjectRoot = `sha256:${"e".repeat(64)}`
    }],
    ["installed root alias", (review: any) => {
      review.reviewedExecutionClosure.reviewedExecutionClosureRoot =
        review.reviewedExecutionClosure.installedClosureRoot
    }],
    ["nonzero finding", (review: any) => {
      review.findingCount = 1
      review.findings = [{ code: "X" }]
    }],
    ["consumed capacity", (review: any) => {
      review.authority.freshCharged = 1
    }],
    ["broader authority", (review: any) => {
      review.authority.phase263PlanningAuthorized = true
    }],
    ["historical reinterpretation", (review: any) => {
      review.protectedHistory.provisionalPairReinterpreted = true
    }],
    ["failed actual consumer", (review: any) => {
      review.execution.actualConsumerStatus = "failed"
    }],
    ["full root published", (review: any) => {
      review.reviewedExecutionClosure.executionClosureRoot =
        `sha256:${"f".repeat(64)}`
    }],
  ])("rejects %s before closure consumption", (_name, mutate) => {
    const candidate = plan262101Review()
    const review = structuredClone(candidate.review) as any
    mutate(review)
    const current = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    } as const
    expect(() =>
      validateV138Plan262101ReviewedExecutionClosure(
        review,
        current,
        candidate.reviewReportBytes,
      ),
    ).toThrow()
  })

  it.each([
    "sourceCommit",
    "sourceTree",
    "sourceParent",
    "checkoutByteManifestRoot",
    "installedClosureRoot",
    "gitExecutable",
    "gitExecutableSha256",
    "gitIsolationRoot",
    "nodeSha256",
    "pnpmDistributionSha256",
    "nativeSourcesRoot",
    "pathnameLaunchReplacementResistanceClaimed",
  ] as const)("rejects independent portable member drift in %s", (field) => {
    const { review, reviewReportBytes } = plan262101Review()
    const current: any = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    }
    current[field] =
      field === "gitExecutable"
        ? "/tmp/git"
        : field === "pathnameLaunchReplacementResistanceClaimed"
          ? true
          : field.startsWith("source")
            ? "0".repeat(40)
            : `sha256:${"0".repeat(64)}`
    expect(() =>
      validateV138Plan262101ReviewedExecutionClosure(
        review,
        current,
        reviewReportBytes,
      ),
    ).toThrow("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_MISMATCH")
  })

  it("excludes local Git object identity from portability but preserves distinct full roots", () => {
    const { review, reviewReportBytes } = plan262101Review()
    const first = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    } as const
    const second = {
      ...first,
      gitObjectRoot: `sha256:${"0".repeat(64)}`,
      executionClosureRoot: `sha256:${"1".repeat(64)}`,
    } as const
    expect(
      validateV138Plan262101ReviewedExecutionClosure(
        review,
        first,
        reviewReportBytes,
      ),
    ).toBe(first)
    expect(
      validateV138Plan262101ReviewedExecutionClosure(
        review,
        second,
        reviewReportBytes,
      ),
    ).toBe(second)
    expect(first.executionClosureRoot).not.toBe(second.executionClosureRoot)
    expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).not.toBe(
      first.executionClosureRoot,
    )
  })

  it.each([
    "--derive-seal-envelope-no-publish",
    "--publish-sealed-inactive-envelope",
    "--check-sealed-inactive-envelope",
    "--run-bounded-live-envelope",
    "--check-live-transition",
    "--check-terminal-envelope",
  ])("requires one unchanged full local root around %s", async (command) => {
    let closureCall = 0
    const closure = () =>
      ({
        executionClosureRoot: closureCall++ === 0 ? SHA_A : SHA_B,
      }) as ReturnType<typeof authenticateV138RetryV3ExecutionClosure>
    await expect(
      executeV138BoundedRetryV3Cli([command], {
        repoRoot: process.cwd(),
        authenticateClosure: closure,
        deriveArtifacts: () =>
          ({
            seal: { sealRoot: SHA_A },
            envelope: { envelopeRoot: SHA_B },
          }) as never,
        publishArtifacts: () => undefined,
        checkPair: () => undefined,
        runLive: async () => undefined,
        checkOutcome: () => ({ downstreamAuthority: "denied" }) as never,
      }),
    ).rejects.toThrow("V138_RETRY_V3_EXECUTION_CLOSURE_CHANGED")
    expect(closureCall).toBe(2)
  })

  it("binds native coherent custody before any future live effect", () => {
    expect(V138_BOUNDED_RETRY_V3_CUSTODY).toMatchObject({
      coherentRequiredLeafAndAbsenceBatch: true,
      exactBoundedLeafReads: true,
      postReadLeafGenerationCheck: true,
      postReadParentGenerationCheck: true,
      retainedRootInodeLock: true,
      gitHooksDisabled: true,
      gitReplacementObjectsDisabled: true,
      installedRuntimeClosureAuthenticated: true,
      executedCheckoutBytesBoundToGitBlobs: true,
      nativePublication: true,
      rulesAuthority: "MATCH_KERNEL",
      liveInvoked: false,
      downstreamAuthority: "denied",
      executionClosureEnforcedBeforeAndAfter: true,
      nativePairLifecyclePublication: true,
    })
    expect(V138_BOUNDED_RETRY_V3_PRODUCTION_MODES).toContain(
      "--check-source-only",
    )
    expect(CONTROLLER_PATHS).toMatchObject({
      sourceSummary: expect.stringContaining("262-98-SUMMARY.md"),
      sourceReview: expect.stringContaining("262-101"),
      seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
      envelope:
        ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
      reproduction:
        ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
      activation:
        ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
    })
    expect(V138_RETRY_V3_CLOSED_DIRECT_DEFECTS).toEqual([
      "AMBIENT_GIT_EXECUTION",
      "CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED",
      "EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED",
      "NATIVE_PUBLICATION_NOT_ENFORCED",
      "PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED",
      "ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE",
    ])
    expect(V138_RETRY_V3_PASSED_OBSERVATIONS).toEqual([
      "crash-cleanup",
      "executed-checkout-bytes",
      "git-isolation",
      "installed-runtime-closure",
      "native-publication",
    ])
  })

  it("contains no ambient Git, pathname lockf, or Node authority publication path", () => {
    const source = readFileSync(
      path.join(process.cwd(), "scripts/run-v1-38-bounded-retry-envelope-v3.ts"),
      "utf8",
    )
    expect(source).not.toContain('execFileSync("git"')
    expect(source).not.toContain('"/usr/bin/lockf"')
    expect(source).not.toMatch(/const publishPair\s*=.*exclusiveWrite/su)
    expect(source).toContain("publishV138RetryV3NativePair")
    expect(source).toContain("applyV138RetryV3NativeLifecycle")
    expect(source).toContain("authenticateV138RetryV3ExecutionClosure")
  })

  it("recovers actual native pair and lifecycle crash boundaries without partial authority", async () => {
    if (process.platform !== "darwin") return
    const root = mkdtempSync(path.join(tmpdir(), "v138-v3-native-recovery-"))
    roots.push(root)
    mkdirSync(path.join(root, "authority"))
    const pair = {
      transactionId: "pair-crash-recovery",
      intentPath: "pair-crash-recovery.intent",
      members: [
        { target: "authority/seal.json", bytes: "seal\n" },
        { target: "authority/envelope.json", bytes: "envelope\n" },
      ],
    } as const
    expect(() => publishV138RetryV3NativePair(root, pair, 1)).toThrow(
      "V138_RETRY_V3_NATIVE_FAILED",
    )
    await publishV138RetryV3NativePair(root, pair)
    expect(readFileSync(path.join(root, "authority/seal.json"), "utf8")).toBe(
      "seal\n",
    )
    writeFileSync(path.join(root, "authority/journal.jsonl"), "before\n")
    const before = `sha256:${createHash("sha256").update("before\n").digest("hex")}` as const
    const lifecycle = {
      transactionId: "life-crash-recovery",
      intentPath: "life-crash-recovery.intent",
      steps: [
        {
          id: "journal",
          target: "authority/journal.jsonl",
          beforeSha256: before,
          afterBytes: "after\n",
        },
      ],
      lifecycle: {
        target: "authority/terminal.json",
        bytes: "terminal\n",
      },
    } as const
    expect(() =>
      applyV138RetryV3NativeLifecycle(root, lifecycle, 1),
    ).toThrow("V138_RETRY_V3_NATIVE_FAILED")
    await applyV138RetryV3NativeLifecycle(root, lifecycle)
    expect(
      readFileSync(path.join(root, "authority/journal.jsonl"), "utf8"),
    ).toBe("after\n")
    expect(
      readFileSync(path.join(root, "authority/terminal.json"), "utf8"),
    ).toBe("terminal\n")
  })

  it.each([1, 2, 3, 4, 5, 100, 101, 300, 301, 302, 303, 304, 305, 306])(
    "recovers native PAIR boundary %i to one complete pair",
    (boundary) => {
      if (process.platform !== "darwin") return
      const root = mkdtempSync(path.join(tmpdir(), `v138-v3-pair-${boundary}-`))
      roots.push(root)
      mkdirSync(path.join(root, "pair"))
      const pair = {
        transactionId: `pair-boundary-${boundary}`,
        intentPath: `pair-boundary-${boundary}.intent`,
        members: [
          { target: `pair/left-${boundary}.json`, bytes: `left-${boundary}\n` },
          { target: `pair/right-${boundary}.json`, bytes: `right-${boundary}\n` },
        ],
      } as const
      expect(() => publishV138RetryV3NativePair(root, pair, boundary)).toThrow(
        "V138_RETRY_V3_NATIVE_FAILED",
      )
      publishV138RetryV3NativePair(root, pair)
      expect(readFileSync(path.join(root, pair.members[0].target), "utf8")).toBe(
        pair.members[0].bytes,
      )
      expect(readFileSync(path.join(root, pair.members[1].target), "utf8")).toBe(
        pair.members[1].bytes,
      )
    },
  )

  it.each([1, 2, 3, 4, 100, 101, 200, 201, 202, 203, 204, 205])(
    "recovers native LIFE boundary %i without journal identity reuse",
    (boundary) => {
      if (process.platform !== "darwin") return
      const root = mkdtempSync(path.join(tmpdir(), `v138-v3-life-${boundary}-`))
      roots.push(root)
      mkdirSync(path.join(root, "life"))
      const beforeBytes = `before-${boundary}\n`
      const target = `life/journal-${boundary}.jsonl`
      writeFileSync(path.join(root, target), beforeBytes)
      const lifecycle = {
        transactionId: `life-boundary-${boundary}`,
        intentPath: `life-boundary-${boundary}.intent`,
        steps: [
          {
            id: `journal-${boundary}`,
            target,
            beforeSha256: `sha256:${createHash("sha256").update(beforeBytes).digest("hex")}` as const,
            afterBytes: `after-${boundary}\n`,
          },
        ],
        lifecycle: {
          target: `life/terminal-${boundary}.json`,
          bytes: `terminal-${boundary}\n`,
        },
      } as const
      expect(() =>
        applyV138RetryV3NativeLifecycle(root, lifecycle, boundary),
      ).toThrow("V138_RETRY_V3_NATIVE_FAILED")
      applyV138RetryV3NativeLifecycle(root, lifecycle)
      expect(readFileSync(path.join(root, target), "utf8")).toBe(
        lifecycle.steps[0].afterBytes,
      )
      expect(
        readFileSync(path.join(root, lifecycle.lifecycle.target), "utf8"),
      ).toBe(lifecycle.lifecycle.bytes)
    },
  )

  it.each([
    ["PATH", "/definitely/hostile"],
    ["GIT_CONFIG_GLOBAL", "/tmp/hostile-global-config"],
    ["GIT_CONFIG_NOSYSTEM", "0"],
    ["GIT_OBJECT_DIRECTORY", "/tmp/hostile-objects"],
    ["GIT_ALTERNATE_OBJECT_DIRECTORIES", "/tmp/hostile-alternates"],
  ])("isolates Git from ambient %s mutation", (key, value) => {
    const expected = runV138RetryV3IsolatedGit(process.cwd(), [
      "rev-parse",
      "HEAD",
    ])
    expect(
      runV138RetryV3IsolatedGit(process.cwd(), ["rev-parse", "HEAD"], {
        ...process.env,
        [key]: value,
      }),
    ).toBe(expected)
  })

  it.each([
    "checkout-file",
    "checkout-symlink",
    "checkout-mode",
    "installed-file",
    "installed-symlink",
    "installed-mode",
    "dependency-resolution",
    "node-binary",
    "pnpm-distribution",
    "vitest-runner",
    "tsx-entrypoint",
  ])("fails closed when reviewed execution root detects %s drift", (family) => {
    const head = runV138RetryV3IsolatedGit(process.cwd(), ["rev-parse", "HEAD"])
    expect(() =>
      authenticateV138RetryV3ExecutionClosure(process.cwd(), {
        sourceCommit: head,
        checkoutPaths: ["package.json", "pnpm-lock.yaml"],
        executionClosureRoot: `sha256:${createHash("sha256").update(family).digest("hex")}`,
      }),
    ).toThrow("V138_RETRY_V3_EXECUTION_CLOSURE_MISMATCH")
  })

  const effects = (input: {
    preflight: readonly number[]
    start?: number
    calibration?: V138BoundedRetryV3ControllerEffects["runCalibration"]
    reproduction?: V138BoundedRetryV3ControllerEffects["runReproduction"]
  }): V138BoundedRetryV3ControllerEffects => {
    let now = input.start ?? 0
    let observation = 0
    return {
      monotonicMilliseconds: () => now++,
      waitUntil: async (target) => {
        now = target
      },
      observePreflight: async () => ({
        available: true,
        effectiveAvailableBasisPoints: input.preflight[observation++] ?? 0,
      }),
      runCalibration:
        input.calibration ??
        (async () => ({ status: "system_failure", completeCleanup: true })),
      runReproduction:
        input.reproduction ??
        (async () => ({
          status: "system_failure",
          acceptedCells: 0,
          completeCleanup: true,
        })),
      appendDurableRecord: () => undefined,
    }
  }

  it("exhausts twelve synthetic refusals with durable unique reservations", async () => {
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: effects({ preflight: Array.from({ length: 12 }, () => 2_499) }),
    })
    expect(result.state).toMatchObject({
      disposition: "exhausted",
      preflightObservationsConsumed: 12,
      routeStartsConsumed: 0,
      acceptedCells: 0,
      downstreamAuthority: false,
    })
    expect(new Set(result.records.map(({ recordRoot }) => recordRoot)).size).toBe(
      result.records.length,
    )
  })

  it("exhausts three admitted clean calibration failures after exact backoff", async () => {
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: effects({ preflight: [2_500, 2_500, 2_500] }),
    })
    expect(result.state).toMatchObject({
      disposition: "exhausted",
      routeStartsConsumed: 3,
      calibrationIdentitiesCharged: 24,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
      completeCleanup: true,
    })
  })

  it("accepts exactly one fresh 540-cell synthetic reproduction but grants no authority", async () => {
    const root = `sha256:${"c".repeat(64)}` as const
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: effects({
        preflight: [2_500],
        calibration: async () => ({
          status: "admitted",
          completeCleanup: true,
          supervisionRoot: root,
        }),
        reproduction: async () => ({
          status: "passed_exact",
          acceptedCells: 540,
          completeCleanup: true,
          reproductionRoot: root,
          artifact: { synthetic: true },
        }),
      }),
    })
    expect(result.state).toMatchObject({
      disposition: "succeeded",
      reproductionIdentitiesCharged: 540,
      acceptedCells: 540,
      completeCleanup: true,
      downstreamAuthority: false,
    })
  })

  it("source-only CLI never derives, publishes, or invokes live work", async () => {
    let forbiddenCalls = 0
    await executeV138BoundedRetryV3Cli(["--check-source-only"], {
      repoRoot: process.cwd(),
      deriveArtifacts: () => {
        forbiddenCalls += 1
        throw new Error("must not derive")
      },
      runLive: async () => {
        forbiddenCalls += 1
      },
      checkOutcome: () => {
        forbiddenCalls += 1
        throw new Error("must not check live outcome")
      },
      authenticateClosure: () =>
        ({ executionClosureRoot: SHA_A }) as ReturnType<
          typeof authenticateV138RetryV3ExecutionClosure
        >,
    })
    expect(forbiddenCalls).toBe(0)
  })

  it("reconciles a durable reservation after crash without rerunning its identity", async () => {
    let records: readonly V138RetryV3JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v3:0",
      owner: "crashed-owner",
    })
    const synthetic = effects({ preflight: [2_500], start: 1_001 })
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "recovery-owner",
      records,
      effects: {
        ...synthetic,
        observePreflight: async () => {
          return { available: true, effectiveAvailableBasisPoints: 2_500 }
        },
      },
    })
    expect(result.records[1]).toMatchObject({
      kind: "observe_preflight",
      identity: "preflight:v3:0",
      effectiveAvailableBasisPoints: 0,
    })
    expect(
      new Set(
        result.records
          .filter(({ kind }) => kind === "reserve_preflight")
          .map(({ identity }) => identity),
      ).size,
    ).toBe(
      result.records.filter(({ kind }) => kind === "reserve_preflight").length,
    )
  })

  it("admits one kernel lock owner and releases ownership after owner death", async () => {
    if (process.platform !== "darwin") return
    const root = mkdtempSync(path.join(tmpdir(), "v138-v3-lock-"))
    roots.push(root)
    const owner = await acquireV138RetryV3OwnerLease(root)
    await expect(acquireV138RetryV3OwnerLease(root)).rejects.toThrow(
      "V138_RETRY_OWNER_LOCK_ACTIVE",
    )
    process.kill(owner.pid, "SIGKILL")
    await owner.waitForExit()
    const restarted = await acquireV138RetryV3OwnerLease(root)
    await restarted.release()
  })
})
