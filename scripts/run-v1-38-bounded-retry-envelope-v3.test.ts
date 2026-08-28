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
  computeV138Plan26299ReviewRoot,
  computeV138ReviewedExecutionClosureRoot,
  executeV138BoundedRetryV3Cli,
  parseV138RetryV3RegularBlobTreeEntry,
  runV138BoundedRetryV3Controller,
  validateV138Plan26299ReviewedExecutionClosure,
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

const plan26299Review = () => {
  const reviewedExecutionClosure = portableClosure()
  const body = {
    schemaVersion: "v1.38-plan-262-99-bounded-retry-source-rereview-v4",
    reviewProtocol:
      "fresh-independent-plan-98-portable-closure-rereview-v4",
    status: "zero_findings",
    correctedSource: {
      commit: reviewedExecutionClosure.sourceCommit,
      tree: reviewedExecutionClosure.sourceTree,
      parent: reviewedExecutionClosure.sourceParent,
      noLaterRewrite: true,
      summaryTrustedAsVerdict: false,
      files: [
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
      historicalResultReinterpreted: false,
      plan96: {
        sourceCommit: "1c1f42b7fcd72d19ded89cca3ddd522090475b29",
        sourceTree: "37d10e3dfee8501e59e686802ffe684167585c94",
        sourceParent: "aae9f5dab231f83a0238cf5448f5e1e1d8ad4f28",
        summarySha256:
          "sha256:a3b2f63c542c69f565ca8a56d0bc8ee7e45971c52ff3ee6556e1d4f93d3132d5",
      },
      plan97: {
        schemaVersion:
          "v1.38-plan-262-97-bounded-retry-source-rereview-v3",
        reviewRoot:
          "sha256:2765f8c028a7c0e089b401898d80f12fa425e993f13255423abb052f22adee90",
        findingRoot:
          "sha256:638909ad31b44fc81e01b6f081b2b1c97ad4091413e4c285c83e61d6fbbc152a",
        findingCount: 0,
        sourceReviewPassed: true,
        artifactSha256:
          "sha256:08fd056f3056bb45daf6e82a04eab72bd4ca73bda812512cad8b04960ce2b2e9",
        reviewSha256:
          "sha256:1a7737aaa37ff886ba90e37a73d9643b5e0fdea321a6cb859e475f906562bfe7",
        summarySha256:
          "sha256:fa9dca2adbb113f0c30925ae8548aac935888066e2d9d2df73de793c1b5e5cc1",
      },
    },
    failedAttempt: {
      plan: "262-92",
      stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
      status: "integrity_stop",
      canonicalWrites: 0,
      freshCharged: 0,
      freshAccepted: 0,
      localSecretAccessed: false,
      identityConsumed: false,
    },
    execution: {
      focusedTestsPassed: 0,
      sourceOnlyPassed: true,
      checkoutBytesMatchedBefore: true,
      checkoutBytesMatchedAfter: true,
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
        computeV138ReviewedExecutionClosureRoot(reviewedExecutionClosure),
    },
    findings: [],
    findingCount: 0,
    findingRoot: `sha256:${createHash("sha256")
      .update(`v138-plan26299-findings\0${encodeV138RetryV3CanonicalJson([])}`)
      .digest("hex")}`,
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
  }
  return { ...body, reviewRoot: computeV138Plan26299ReviewRoot(body) }
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
  it("preserves the failed Plan-92 Plan-97 shape mismatch as zero-consumption history", () => {
    const historical = JSON.parse(
      readFileSync(
        path.join(
          process.cwd(),
          ".planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json",
        ),
        "utf8",
      ),
    )
    expect(() =>
      validateV138Plan26299ReviewedExecutionClosure(
        historical,
        portableClosure() as never,
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

  it("accepts only the exact Plan-99 portable reviewed-closure schema and domain", () => {
    const review = plan26299Review()
    const current = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    } as const
    expect(
      validateV138Plan26299ReviewedExecutionClosure(review, current),
    ).toBe(current)
    expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).not.toBe(
      review.reviewedExecutionClosure.installedClosureRoot,
    )
    expect(review.reviewedExecutionClosure).not.toHaveProperty("gitObjectRoot")
    expect(CONTROLLER_PATHS.sourceReview).toBe(
      ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
    )
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
      review.protectedHistory.historicalResultReinterpreted = true
    }],
  ])("rejects %s before closure consumption", (_name, mutate) => {
    const review = structuredClone(plan26299Review()) as any
    mutate(review)
    const current = {
      ...portableClosure(),
      schemaVersion: "v1.38-retry-v3-execution-closure-v1",
      gitObjectRoot: `sha256:${"e".repeat(64)}`,
      executionClosureRoot: `sha256:${"f".repeat(64)}`,
    } as const
    expect(() =>
      validateV138Plan26299ReviewedExecutionClosure(review, current),
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
    const review = plan26299Review()
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
      validateV138Plan26299ReviewedExecutionClosure(review, current),
    ).toThrow("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_MISMATCH")
  })

  it("excludes local Git object identity from portability but preserves distinct full roots", () => {
    const review = plan26299Review()
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
    expect(validateV138Plan26299ReviewedExecutionClosure(review, first)).toBe(first)
    expect(validateV138Plan26299ReviewedExecutionClosure(review, second)).toBe(second)
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
      sourceReview: expect.stringContaining("262-99"),
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
