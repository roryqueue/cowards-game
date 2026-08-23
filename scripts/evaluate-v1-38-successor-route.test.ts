import { execFileSync, spawn } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { Buffer } from "node:buffer"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, describe, expect, it, vi } from "vitest"
import {
  encodeCanonicalJson,
  hashCanonicalIdentity,
  type JsonValue,
} from "@cowards/spec"
import {
  V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH,
  V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_SCHEMA,
  V138_PLAN_262_47_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_47_CANONICAL_PATHS,
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA,
  V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA,
  V138_PLAN_262_55_REVIEWER_PROTOCOL,
  V138_PLAN_262_57_FRESH_DESTINATIONS,
  V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
  V138_PLAN_262_57_ROUTE_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
  V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA,
  V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS,
  V138_PLAN_262_57_ROUTE_CONTRACT_V9,
  V138_PLAN_262_60_PREDECESSOR_MANIFEST,
  buildV138Plan26247PreExecutionSourceFailureV1,
  checkV138Plan26247PreExecutionSourceFailureV1,
  checkV138Plan26247AuthorizationV6,
  inspectV138SourceIdentityA6,
  inspectV138SourceA9Custody,
  inspectV138PinnedPredecessorManifest,
  inspectV138PrivatePredecessorManifestFreezeForTest,
  inspectV138ProtectedHistoryV9,
  readV138RepositoryFileNoFollow,
  v138Plan26247AuthorizationLiteral,
  writeV138Plan26247PreExecutionSourceFailureV1,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_PLAN_262_47_ROUTE_CONTRACT,
  V138_PLAN_262_57_ROUTE_CONTRACT,
  buildV138Plan26257PreStartObstructionV1,
  checkV138Plan26257PreStartObstructionV1,
  checkV138Plan26257RouteContract,
  checkV138Plan26247RouteContract,
  checkV138Plan26247SyntheticRoute,
  deriveV138CalibrationAttemptMappings,
  enumerateV138CurrentMatrix,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256,
  V138_FROZEN_ROUTE_CAPABLE_SOURCE_OBJECTS,
  V138_HISTORICAL_REVIEWER_V2_SOURCE_OBJECT,
  analyzeV138PolicySourcesWithFrozenRouteAllowlist,
  checkV138ExactMachineStatus,
  collectV138ChangedPolicySources,
} from "./check-v1-38-dependency-revision-boundaries.js"
import { activeV138DetachedOpenatHelperDirectory,
  disposeV138DetachedOpenatHelper, V138_PLAN_262_60_CORRECTION_RUN,
  V138_REVIEW_V3_DELETION_PATHS, V138_REVIEW_V3_ROUTE_MANIFEST,
  V138_REVIEW_V3_SOURCE_PATHS,
  checkV138ReviewV3ClaimsAgainstObservations,
  computeV138ReviewV3Root, readAndValidateV138DetachedReviewV3,
  readV138DetachedFileOpenat,
  validateV138ReviewV3Document } from
  "./lib/v1-38-source-completeness-review-v3.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
afterAll(() => disposeV138DetachedOpenatHelper())
const canonicalReviewBytes = (value: unknown) => {
  const encoded = encodeCanonicalJson(value as JsonValue,
    { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("TEST_CANONICAL_INVALID")
  return Buffer.concat([Buffer.from(encoded.bytes), Buffer.from("\n")])
}

const reviewV3Fixture = (): Record<string, any> => {
  const oid = "a".repeat(40)
  const otherOid = "b".repeat(40)
  const digest = `sha256:${"1".repeat(64)}`
  const paths = [...V138_REVIEW_V3_SOURCE_PATHS]
  const body: Record<string, any> = {
    schemaVersion: "v1.38-plan-262-62-source-completeness-review-v3",
    sourceBase9: oid, sourceA9: otherOid,
    sourceCustody: { tree: oid, parent: oid,
      authorRun: V138_PLAN_262_60_CORRECTION_RUN, paths,
      blobs: paths.map((item) => ({ path: item, mode: "100644",
        blobOid: oid, sha256: digest, byteLength: 1 })),
      deletionHistory: V138_REVIEW_V3_DELETION_PATHS.map(item => ({ path: item,
        deletionCommit: oid, deletionParent: otherOid, deletionTree: oid,
        authorRun: "codex-plan-262-60-a9-v1", priorBlobOid: otherOid,
        priorSha256: digest, priorByteLength: 1 })) },
    routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST,
    protectedHistory: { root: digest, protectedA8: otherOid,
      protectedRoots: Object.fromEntries(Array.from({ length: 8 }, (_, index) =>
        [`root-${index}`, digest])) },
    chargeIds: [5, 6, 7, 8, 9].flatMap((version) =>
      Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`)),
    priorAuthorizationBytes: Array.from({ length: 6 }, (_, index) => ({
      path: `authorization-${index}.json`, commit: oid, blobOid: oid,
      sha256: digest, byteLength: 1 })),
    snapshots: [{ name: "before", inventoryRoot: digest, pathCount: 0 },
      { name: "after", inventoryRoot: digest, pathCount: 0 }],
    orderedEvents: [{ ordinal: 0, event: "validated", path: "detached-review",
      result: "pass" }], cleanup: { complete: true, residualPaths: [] },
    publication: { changedPaths: [
        ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md",
      ] },
    verdict: { findingCount: 0, sourceCompletenessPassed: true,
      authorizesExecution: false },
    identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
      externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false, proceduralContext: "fresh procedure" },
  }
  return { ...body, reviewV3Root: computeV138ReviewV3Root(body) }
}

it("strictly validates review-v3 nested structure and recomputed roots", () => {
  const value = reviewV3Fixture()
  expect(validateV138ReviewV3Document(value)).toEqual(value)
  const forged = structuredClone(value)
  forged.routeManifest[0].handler = "fabricated"
  const { reviewV3Root: _discarded, ...body } = forged
  forged.reviewV3Root = computeV138ReviewV3Root(body)
  expect(() => validateV138ReviewV3Document(forged))
    .toThrow("V138_REVIEW_V3_ROUTE_MANIFEST_INVALID")

  for (const mutate of [
    (candidate: Record<string, any>) => { candidate.sourceCustody.blobs[1] =
      structuredClone(candidate.sourceCustody.blobs[0]) },
    (candidate: Record<string, any>) => { candidate.routeManifest[1] =
      structuredClone(candidate.routeManifest[0]) },
  ]) {
    const candidate = structuredClone(value)
    mutate(candidate)
    const { reviewV3Root: _oldRoot, ...candidateBody } = candidate
    candidate.reviewV3Root = computeV138ReviewV3Root(candidateBody)
    expect(() => validateV138ReviewV3Document(candidate)).toThrow()
  }
})

it("rejects review-v3 claims that differ from independently supplied observations", () => {
  const value = reviewV3Fixture()
  const observations = {
    document: value, routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST,
    sourceCustody: value.sourceCustody,
    publication: value.publication, protectedHistory: value.protectedHistory,
    priorAuthorizationBytes: value.priorAuthorizationBytes,
    snapshots: value.snapshots,
  }
  expect(checkV138ReviewV3ClaimsAgainstObservations(observations)).toEqual(value)
  expect(() => checkV138ReviewV3ClaimsAgainstObservations({ ...observations,
    protectedHistory: { ...value.protectedHistory,
      root: `sha256:${"9".repeat(64)}` } }))
    .toThrow("V138_REVIEW_V3_HISTORY_OBSERVATION_INVALID")

  for (const mutate of [
    (candidate: Record<string, any>) => {
      candidate.routeManifest[0].prerequisite = "fabricated"
    },
    (candidate: Record<string, any>) => {
      candidate.routeManifest[0].destination = "fabricated"
    },
    (candidate: Record<string, any>) => {
      candidate.routeManifest[0].sideEffect = "fabricated"
    },
  ]) {
    const candidate = structuredClone(value)
    mutate(candidate)
    const { reviewV3Root: _old, ...body } = candidate
    candidate.reviewV3Root = computeV138ReviewV3Root(body)
    expect(() => checkV138ReviewV3ClaimsAgainstObservations({ ...observations,
      document: candidate })).toThrow()
  }
})

it("rejects detached review ancestor swaps through pinned openat custody", () => {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "v138-openat-swap-"))
  const fixtureRoot = realpathSync(temporaryRoot)
  const original = path.join(fixtureRoot, "ancestor")
  const alternate = path.join(fixtureRoot, "alternate")
  const held = path.join(fixtureRoot, "ancestor-held")
  const basename =
    "v1.38-plan-262-62-source-completeness-review-v3.json"
  mkdirSync(original); mkdirSync(alternate)
  const review = reviewV3Fixture()
  const target = path.join(original, basename)
  writeFileSync(target, canonicalReviewBytes(review)); chmodSync(target, 0o444)
  writeFileSync(path.join(alternate, basename), canonicalReviewBytes(review))
  expect(readV138DetachedFileOpenat(target).bytes.length).toBeGreaterThan(0)
  const child = spawn(process.execPath, ["-e",
    "const fs=require('node:fs');setTimeout(()=>{fs.renameSync(process.argv[1],process.argv[2]);fs.symlinkSync(process.argv[3],process.argv[1]);},40)",
    original, held, alternate], { stdio: "ignore" })
  try {
    expect(() => readAndValidateV138DetachedReviewV3({ repoRoot,
      absolutePath: target, expectedSourceA9: String(review.sourceA9),
      testDelayMilliseconds: 250 }))
      .toThrow("V138_REVIEW_V3_DETACHED_ANCESTOR_MUTATED")
  } finally {
    child.kill(); rmSync(temporaryRoot, { recursive: true, force: true })
  }
})

it("aborts when a pinned detached review leaf is truncated", () => {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "v138-openat-truncate-"))
  const fixtureRoot = realpathSync(temporaryRoot)
  const target = path.join(fixtureRoot,
    "v1.38-plan-262-62-source-completeness-review-v3.json")
  const review = reviewV3Fixture()
  writeFileSync(target, canonicalReviewBytes(review)); chmodSync(target, 0o444)
  expect(readV138DetachedFileOpenat(target).bytes.length).toBeGreaterThan(0)
  const child = spawn(process.execPath, ["-e",
    "const fs=require('node:fs');setTimeout(()=>{fs.chmodSync(process.argv[1],0o644);fs.truncateSync(process.argv[1],0);fs.chmodSync(process.argv[1],0o444);},40)",
    target], { stdio: "ignore" })
  try {
    expect(() => readAndValidateV138DetachedReviewV3({ repoRoot,
      absolutePath: target, expectedSourceA9: String(review.sourceA9),
      testDelayMilliseconds: 250 }))
      .toThrow("V138_REVIEW_V3_DETACHED_TRUNCATED")
  } finally {
    child.kill()
    try { chmodSync(target, 0o644) } catch {}
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
})

it("disposes native openat helpers and leaves no compile-failure temp paths", () => {
  disposeV138DetachedOpenatHelper()
  const helperPaths = () => readdirSync(tmpdir())
    .filter(entry => entry.startsWith("v138-openat-")).sort()
  const before = helperPaths()
  const originalCompiler = process.env.CC
  process.env.CC = path.join(tmpdir(), "missing-v138-compiler")
  try {
    expect(() => readV138DetachedFileOpenat(fileURLToPath(import.meta.url))).toThrow()
  } finally {
    if (originalCompiler === undefined) delete process.env.CC
    else process.env.CC = originalCompiler
    disposeV138DetachedOpenatHelper()
  }
  expect(activeV138DetachedOpenatHelperDirectory()).toBeNull()
  expect(helperPaths()).toEqual(before)
})

it("removes only helper-owned signal listeners and keeps disposal idempotent", () => {
  disposeV138DetachedOpenatHelper()
  const fixtureRoot = realpathSync(mkdtempSync(
    path.join(tmpdir(), "v138-signal-cleanup-")))
  const fixturePath = path.join(fixtureRoot, "detached-input")
  writeFileSync(fixturePath, "signal cleanup fixture\n")
  chmodSync(fixturePath, 0o444)
  const signal = "SIGTERM" as const
  let unrelatedCalls = 0
  const unrelated = () => { unrelatedCalls += 1 }
  process.on(signal, unrelated)
  const hostListeners = process.listeners(signal)
  const kill = vi.spyOn(process, "kill").mockImplementation((() => true) as
    typeof process.kill)
  try {
    expect(readV138DetachedFileOpenat(fixturePath).bytes)
      .not.toHaveLength(0)
    const directory = activeV138DetachedOpenatHelperDirectory()
    expect(directory).not.toBeNull()
    expect(process.listeners(signal)).toContain(unrelated)
    expect(process.listeners(signal)).toHaveLength(hostListeners.length + 1)
    process.emit(signal, signal)
    expect(unrelatedCalls).toBe(1)
    expect(process.listeners(signal)).toContain(unrelated)
    expect(process.listeners(signal)).toEqual(hostListeners)
    expect(activeV138DetachedOpenatHelperDirectory()).toBeNull()
    expect(directory === null || existsSync(directory)).toBe(false)
    expect(kill).toHaveBeenCalledWith(process.pid, signal)
    disposeV138DetachedOpenatHelper()
    disposeV138DetachedOpenatHelper()
    expect(process.listeners(signal)).toContain(unrelated)
  } finally {
    kill.mockRestore()
    process.off(signal, unrelated)
    disposeV138DetachedOpenatHelper()
    try { chmodSync(fixturePath, 0o644) } catch {}
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

it("derives the corrected A9 sole parent and rejects mutable protected history", () => {
  const run = execFileSync("git", ["log", "--first-parent", "--reverse",
    "--format=%H", `--grep=Plan-262-60-Author-Run: ${V138_PLAN_262_60_CORRECTION_RUN}`],
  { cwd: repoRoot, encoding: "utf8" }).trim().split("\n").filter(Boolean)
  expect(run.length).toBeGreaterThan(0)
  const sourceA9 = run.at(-1)!
  const sourceBase9 = execFileSync("git", ["show", "-s", "--format=%P", run[0]!],
    { cwd: repoRoot, encoding: "utf8" }).trim()
  const custody = inspectV138SourceA9Custody(repoRoot,
    { sourceBase9, sourceA9 })
  expect(custody.sourceA9Parent).toBe(execFileSync("git",
    ["show", "-s", "--format=%P", sourceA9], { cwd: repoRoot,
      encoding: "utf8" }).trim())
  expect(inspectV138ProtectedHistoryV9(repoRoot, sourceA9))
    .toMatchObject({ sourceFailureCommit:
      "bc0f95141d475d1d56ecf9d8ce67880f29385ea1",
    sourceFailureBlobOid: "f5efc47d0e65cebee250431cded02c3fa41906c0" })

  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-protected-history-v9-"))
  execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, fixtureRoot])
  try {
    const failurePath = path.join(fixtureRoot,
      ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json")
    const failure = JSON.parse(readFileSync(failurePath, "utf8"))
    failure.protectedRoots.formationAbsenceRoot = `sha256:${"9".repeat(64)}`
    writeFileSync(failurePath, `${JSON.stringify(failure)}\n`)
    expect(() => inspectV138ProtectedHistoryV9(fixtureRoot, sourceA9))
      .toThrow("V138_PLAN_262_56_AUTHORIZATION_V9_PROTECTED_HISTORY_INVALID")
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}, 15_000)

it("rejects an unrelated correction lineage before accepting deletion custody", () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-a9-alternate-lineage-"))
  execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, fixtureRoot])
  const git = (...args: string[]) => execFileSync("git", args,
    { cwd: fixtureRoot, encoding: "utf8" }).trim()
  try {
    git("config", "user.name", "Alternate lineage fixture")
    git("config", "user.email", "alternate-lineage@example.invalid")
    git("checkout", "--orphan", "alternate-custody")
    git("add", "-A")
    git("commit", "-m", "test: unrelated custody base")
    const sourceBase9 = git("rev-parse", "HEAD")
    for (const repoPath of V138_REVIEW_V3_SOURCE_PATHS) {
      const target = path.join(fixtureRoot, repoPath)
      writeFileSync(target, `${readFileSync(target, "utf8")}\n`)
    }
    git("add", ...V138_REVIEW_V3_SOURCE_PATHS)
    git("commit", "-m", `test: unrelated correction\n\nPlan-262-60-Author-Run: ${V138_PLAN_262_60_CORRECTION_RUN}`)
    const sourceA9 = git("rev-parse", "HEAD")
    expect(() => inspectV138SourceA9Custody(fixtureRoot,
      { sourceBase9, sourceA9 }))
      .toThrow("V138_PLAN_262_56_AUTHORIZATION_V9_PRIOR_CUSTODY_INVALID")
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

it("rejects a copied V3 trailer followed by forged carriers and correction copies", () => {
  const revision = (run: string) => execFileSync("git", ["log", "--first-parent",
    "--format=%H", "--grep", `Plan-262-60-Author-Run: ${run}`, "-1"],
  { cwd: repoRoot, encoding: "utf8" }).trim()
  const v3Tip = revision("codex-plan-262-60-a9-review-fix-v3")
  const corrections = ["codex-plan-262-60-a9-review-fix-v4",
    "codex-plan-262-60-a9-review-fix-v5",
    "codex-plan-262-60-a9-review-fix-v6",
    "codex-plan-262-60-a9-review-fix-v7", V138_PLAN_262_60_CORRECTION_RUN]
    .map(revision)
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-layer-full-attack-"))
  const git = (...args: string[]) => execFileSync("git", args,
    { cwd: fixtureRoot, encoding: "utf8" }).trim()
  execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, fixtureRoot])
  try {
    git("config", "user.name", "Layer full attack fixture")
    git("config", "user.email", "layer-full-attack@example.invalid")
    git("checkout", "--detach", v3Tip)
    const forgedPath = "scripts/lib/v1-38-current-matrix-reproduction.ts"
    writeFileSync(path.join(fixtureRoot, forgedPath),
      `${readFileSync(path.join(fixtureRoot, forgedPath), "utf8")}\n`)
    git("add", forgedPath)
    git("commit", "-m", "test: copied V3 trailer", "-m",
      "Plan-262-60-Author-Run: codex-plan-262-60-a9-review-fix-v3")
    const gapPaths = [...V138_PLAN_262_60_PREDECESSOR_MANIFEST.carriers]
      .map(() => [
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-REVIEW-FIX.md",
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-SUMMARY.md",
      ] as const)
    let sourceBase9 = ""
    let sourceA9 = ""
    for (let index = 0; index < corrections.length; index += 1) {
      for (const repoPath of gapPaths[index]!) {
        const target = path.join(fixtureRoot, repoPath)
        writeFileSync(target, `${readFileSync(target, "utf8")}\n`)
      }
      git("add", ...gapPaths[index]!)
      git("commit", "-m", `docs: forged carrier ${index + 1}`)
      sourceBase9 = git("rev-parse", "HEAD")
      git("cherry-pick", corrections[index]!)
      sourceA9 = git("rev-parse", "HEAD")
    }
    expect(() => inspectV138SourceA9Custody(fixtureRoot,
      { sourceBase9, sourceA9 }))
      .toThrow("V138_PLAN_262_56_AUTHORIZATION_V9_PRIOR_CUSTODY_INVALID")
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

it("accepts only the exact pinned predecessor chain and carrier objects", () => {
  const sourceBase9 = V138_PLAN_262_60_PREDECESSOR_MANIFEST.carriers.at(-1)![0]
  const result = inspectV138PinnedPredecessorManifest(repoRoot, sourceBase9)
  expect(result.priorCorrectionLayers.map(layer => layer.sourceA9)).toEqual(
    V138_PLAN_262_60_PREDECESSOR_MANIFEST.layers.map(layer => layer.sourceA9))
  expect(result.layerGaps.map(gap => gap.nextBase)).toEqual(
    V138_PLAN_262_60_PREDECESSOR_MANIFEST.carriers.map(carrier => carrier[0]))
})

it("rejects mutations of every predecessor manifest identity field", () => {
  const sourceBase9 = V138_PLAN_262_60_PREDECESSOR_MANIFEST.carriers.at(-1)![0]
  const mutations: Array<(manifest: any) => void> = [
    value => { value.layers[0].authorRun += "-forged" },
    value => { value.layers[0].sourceBase9 = "0".repeat(40) },
    value => { value.layers[0].sourceA9 = "0".repeat(40) },
    value => { value.layers[0].commits[0][0] = "0".repeat(40) },
    value => { value.layers[0].commits[0][1] = "0".repeat(40) },
    value => { value.layers[0].commits[0][2] = "0".repeat(40) },
    value => { value.layers[0].commits[0][3][0] = "package.json" },
    value => { value.layers[0].blobs[0][0] = "package.json" },
    value => { value.layers[0].blobs[0][1] = "100755" },
    value => { value.layers[0].blobs[0][2] = "0".repeat(40) },
    value => { value.layers[0].blobs[0][3] = `sha256:${"0".repeat(64)}` },
    value => { value.layers[0].blobs[0][4] += 1 },
    value => { value.carriers[0][0] = "0".repeat(40) },
    value => { value.carriers[0][1] = "0".repeat(40) },
    value => { value.carriers[0][2] = "0".repeat(40) },
    value => { value.carriers[0][3][0][0] = "0".repeat(40) },
    value => { value.carriers[0][3][0][1] = `sha256:${"0".repeat(64)}` },
    value => { value.carriers[0][3][0][2] += 1 },
  ]
  for (const mutate of mutations) {
    const candidate = JSON.parse(JSON.stringify(
      V138_PLAN_262_60_PREDECESSOR_MANIFEST))
    mutate(candidate)
    expect(() => inspectV138PinnedPredecessorManifest(repoRoot, sourceBase9,
      candidate)).toThrow()
  }
}, 30_000)

it("deep-freezes every exported manifest category without exposing production", () => {
  const projection: any = V138_PLAN_262_60_PREDECESSOR_MANIFEST
  const sourceBase9 = projection.carriers.at(-1)[0]
  const before = inspectV138PinnedPredecessorManifest(repoRoot, sourceBase9)
  const assertDeepFrozen = (value: unknown): void => {
    if (value === null || typeof value !== "object") return
    expect(Object.isFrozen(value)).toBe(true)
    for (const nested of Object.values(value)) assertDeepFrozen(nested)
  }
  assertDeepFrozen(projection)
  const attempts = [
    () => { projection.layers = [] },
    () => { projection.layers.push({}) },
    () => { projection.layers[0].authorRun = "forged" },
    () => { projection.layers[0].commits.push([]) },
    () => { projection.layers[0].commits[0][0] = "0".repeat(40) },
    () => { projection.layers[0].commits[0][3].push("package.json") },
    () => { projection.layers[0].blobs.push([]) },
    () => { projection.layers[0].blobs[0][0] = "package.json" },
    () => { projection.carriers.push([]) },
    () => { projection.carriers[0][0] = "0".repeat(40) },
    () => { projection.carriers[0][3].push([]) },
    () => { projection.carriers[0][3][0][0] = "0".repeat(40) },
  ]
  for (const attempt of attempts) expect(attempt).toThrow(TypeError)
  expect(inspectV138PinnedPredecessorManifest(repoRoot, sourceBase9)).toEqual(before)
}, 15_000)

it("recurses through pre-frozen containers in the private production anchor", () => {
  const sourceBase9 = V138_PLAN_262_60_PREDECESSOR_MANIFEST.carriers.at(-1)![0]
  const before = inspectV138PinnedPredecessorManifest(repoRoot, sourceBase9)
  const privateFreeze = inspectV138PrivatePredecessorManifestFreezeForTest()
  expect(Object.isFrozen(privateFreeze)).toBe(true)
  expect(privateFreeze).toEqual({
    root: true, layers: true, layerRecords: true, commitArrays: true,
    commitTuples: true, pathArrays: true, blobArrays: true, blobTuples: true,
    carriers: true, carrierTuples: true, carrierBlobArrays: true,
    carrierBlobTuples: true,
  })
  expect(inspectV138PinnedPredecessorManifest(repoRoot, sourceBase9)).toEqual(before)
}, 15_000)

const sha256Zero = `sha256:${"0".repeat(64)}`
const mutableClone = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
const recomputeDispositionRoot = (value: Record<string, any>): string => {
  const { dispositionRoot: _discarded, ...body } = value
  const encoded = encodeCanonicalJson(body as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("TEST_CANONICAL_INVALID")
  return `sha256:${hashCanonicalIdentity("evidenceBundle", [
    Buffer.from(body.schemaVersion as string, "utf8"),
    encoded.bytes,
  ])}`
}

describe("v1.38 Plan 262-47 fresh successor route", () => {
  it("records the sealed source-incomplete branch without inventing route history", () => {
    const artifactPath = path.resolve(repoRoot,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH)
    const before = readFileSync(artifactPath)
    const disposition = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)
    expect(disposition).toMatchObject({
      schemaVersion: V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_SCHEMA,
      reason: "sealed_source_incomplete",
      sourceA6: "600c7770867e6090147914dc090780f5b63930ec",
      sourceB6: "e2166736c2a1a3f1decbb1d6b3722f87945a47ea",
      routeStarted: false,
      isRouteTerminal: false,
      chargedAttemptCount: 0,
      acceptedCellCount: 0,
      authorityExpired: true,
      noRetry: true,
      satisfiesAdmit03: false,
      candidateSearchAuthorized: false,
      phase263Authorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      activationAuthorized: false,
      productionAuthorized: false,
    })
    expect(disposition.absentDestinations)
      .toEqual(V138_PLAN_262_47_FRESH_DESTINATIONS)
    expect(disposition.historicalChargedPublicAttemptIds).toHaveLength(40)
    expect(disposition.sourceReview.establishesCliSourceCompleteness).toBe(false)
    expect(disposition.sourceReview.historicalBytesPreserved).toBe(true)
    expect(disposition.sourceCustody.sourceB6ChangedPaths).toEqual([
      V138_PLAN_262_47_CANONICAL_PATHS.authorization,
      V138_PLAN_262_47_CANONICAL_PATHS.seal,
    ])
    expect(disposition.sourceCustody.sourceB6Blobs).toHaveLength(2)
    expect(checkV138Plan26247PreExecutionSourceFailureV1(repoRoot,
      disposition)).toEqual(disposition)
    expect(readFileSync(artifactPath)).toEqual(before)
    expect(JSON.stringify(disposition)).not.toMatch(
      /StrategyMemory|SoldierMemory|objectivePayload|rawDiagnostic|stack|DATABASE_URL/u,
    )
  }, 120_000)

  it("fails closed when any disposition identity, absence, count, or authority changes", () => {
    const disposition = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)
    const mutations: unknown[] = [
      { ...disposition, reason: "route_failed" },
      { ...disposition, sourceA6: "0".repeat(40) },
      { ...disposition, sourceB6: "0".repeat(40) },
      { ...disposition, authorizationRoot: `sha256:${"0".repeat(64)}` },
      { ...disposition, sealRoot: `sha256:${"0".repeat(64)}` },
      { ...disposition, absentDestinations: disposition.absentDestinations.slice(1) },
      { ...disposition, chargedAttemptCount: 1 },
      { ...disposition, acceptedCellCount: 1 },
      { ...disposition, routeStarted: true },
      { ...disposition, isRouteTerminal: true },
      { ...disposition, authorityExpired: false },
      { ...disposition, noRetry: false },
      { ...disposition, satisfiesAdmit03: true },
      { ...disposition, candidateSearchAuthorized: true },
      { ...disposition, phase263Authorized: true },
      { ...disposition, formationMaterializationAuthorized: true },
      { ...disposition, holdoutOpeningAuthorized: true },
      { ...disposition, publicAuthorized: true },
      { ...disposition, activationAuthorized: true },
      { ...disposition, productionAuthorized: true },
    ]
    const nestedMutations: Array<(value: Record<string, any>) => void> = [
      (value) => { value.sourceCustody.sourceA6Tree = "0".repeat(40) },
      (value) => { value.sourceCustody.sourceA6Parents = [] },
      (value) => { value.sourceCustody.sourceA6Blobs[0].sha256 = sha256Zero },
      (value) => { value.sourceCustody.sourceB6Tree = "0".repeat(40) },
      (value) => { value.sourceCustody.sourceB6Parent = "0".repeat(40) },
      (value) => { value.sourceCustody.sourceB6ChangedPaths = [] },
      (value) => { value.sourceCustody.sourceB6Blobs[0].blobOid = "0".repeat(40) },
      (value) => { value.authorizationBytesSha256 = sha256Zero },
      (value) => { value.sealBytesSha256 = sha256Zero },
      (value) => { value.sourceReview.path = "forged-review.md" },
      (value) => { value.sourceReview.sha256 = sha256Zero },
      (value) => { value.sourceReview.historicalVerdict = "PASS" },
      (value) => { value.sourceReview.historicalBytesPreserved = false },
      (value) => { value.sourceReview.establishesCliSourceCompleteness = true },
      ...Object.keys(disposition.protectedRoots).map((key) =>
        (value: Record<string, any>) => { value.protectedRoots[key] = sha256Zero }),
      (value) => { value.historicalChargedPublicAttemptIds[0] = "forged" },
      (value) => { value.historicalChargedPublicAttemptIds[1] =
        value.historicalChargedPublicAttemptIds[0] },
      (value) => { value.historicalChargedPublicAttemptIds.pop() },
      (value) => { value.historicalChargedAttemptCount = 39 },
      (value) => { value.freshAttemptLedgerRoot = sha256Zero },
      (value) => { value.freshAcceptedCellLedgerRoot = sha256Zero },
      (value) => { value.requiredAcceptedCellCount = 539 },
      (value) => { value.seal01Status = "passed" },
      (value) => { value.assuranceClass = "independent_custody" },
      (value) => { value.independentCustodyClaimed = true },
      (value) => { value.dispositionRoot = sha256Zero },
      (value) => { value.unexpectedAuthority = true },
      (value) => { delete value.protectedRoots },
      (value) => {
        value.sourceReview.sha256 = sha256Zero
        value.dispositionRoot = recomputeDispositionRoot(value)
      },
    ]
    for (const mutate of nestedMutations) {
      const mutation = mutableClone(disposition)
      mutate(mutation)
      mutations.push(mutation)
    }
    for (const mutation of mutations) {
      expect(() => checkV138Plan26247PreExecutionSourceFailureV1(repoRoot,
        mutation)).toThrow("V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_INVALID")
    }
  }, 120_000)

  it("checks canonical serialized bytes through the CLI and never overwrites the artifact", () => {
    const artifactPath = path.resolve(repoRoot,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH)
    const before = readFileSync(artifactPath)
    const disposition = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)
    const encoded = encodeCanonicalJson(disposition as JsonValue, {
      context: "canonical-manifest",
    })
    if (!encoded.ok) throw new TypeError("TEST_CANONICAL_INVALID")
    expect(before).toEqual(Buffer.concat([Buffer.from(encoded.bytes),
      Buffer.from("\n", "utf8")]))
    const output = execFileSync("pnpm", ["exec", "tsx",
      "scripts/lib/v1-38-successor-source-seal.ts",
      "--check-plan-262-47-pre-execution-source-failure-v1"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120_000,
    })
    expect(JSON.parse(output)).toMatchObject({
      dispositionRoot: disposition.dispositionRoot,
      reason: "sealed_source_incomplete",
    })
    expect(() => writeV138Plan26247PreExecutionSourceFailureV1(repoRoot,
      artifactPath)).toThrow()
    expect(readFileSync(artifactPath)).toEqual(before)
  }, 120_000)

  it("rejects symlinked evidence ancestors and leafs with exact reasons", () => {
    const fixtureRoot = mkdtempSync(path.join(tmpdir(),
      "v138-repository-path-containment-"))
    const outsideRoot = mkdtempSync(path.join(tmpdir(),
      "v138-repository-path-outside-"))
    const expectAncestorRejected = (
      ancestor: string,
      target: string,
      expectation: "required" | "absent",
    ) => {
      const repository = path.join(fixtureRoot, ancestor.replaceAll("/", "-"))
      mkdirSync(repository)
      const components = ancestor.split("/")
      const symlinkName = components.pop()!
      const realParent = path.join(repository, ...components)
      mkdirSync(realParent, { recursive: true })
      const outside = path.join(outsideRoot, ancestor.replaceAll("/", "-"))
      mkdirSync(outside, { recursive: true })
      symlinkSync(outside, path.join(realParent, symlinkName), "dir")
      expect(() => readV138RepositoryFileNoFollow(repository,
        path.join(repository, target), expectation))
        .toThrow("V138_CANONICAL_PARENT_CHAIN_INVALID")
    }
    try {
      expectAncestorRejected(".planning",
        ".planning/artifacts/evidence.json", "absent")
      expectAncestorRejected(".planning/artifacts",
        ".planning/artifacts/evidence.json", "absent")
      expectAncestorRejected(".planning/phases",
        ".planning/phases/262-foundation/evidence.md", "absent")
      expectAncestorRejected(".planning/phases/262-foundation",
        ".planning/phases/262-foundation/evidence.md", "absent")
      expectAncestorRejected("scripts", "scripts/lib/source.ts", "required")
      expectAncestorRejected("scripts/lib", "scripts/lib/source.ts", "required")

      const leafRepository = path.join(fixtureRoot, "leaf")
      const leafOutside = path.join(outsideRoot, "leaf-evidence.json")
      mkdirSync(path.join(leafRepository, ".planning", "artifacts"),
        { recursive: true })
      writeFileSync(leafOutside, "{}\n")
      symlinkSync(leafOutside, path.join(leafRepository, ".planning",
        "artifacts", "evidence.json"), "file")
      expect(() => readV138RepositoryFileNoFollow(leafRepository,
        path.join(leafRepository, ".planning", "artifacts", "evidence.json"),
        "required")).toThrow("V138_PLAN_262_15_ARTIFACT_TYPE_INVALID")
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true })
      rmSync(outsideRoot, { recursive: true, force: true })
    }
  })

  it("rejects stale, duplicate, and contradictory structured status blocks", () => {
    const marker = "phase-262-test-status"
    const expected = { next_action: "262-54", completed_plans: 41 }
    const exact = `stale prose says 262-53 and 40\n<!-- ${marker}: ${JSON.stringify(
      expected)} -->\n`
    expect(checkV138ExactMachineStatus(exact, marker, expected)).toEqual(expected)
    expect(() => checkV138ExactMachineStatus(
      `${exact}<!-- ${marker}: ${JSON.stringify(expected)} -->\n`, marker,
      expected)).toThrow("V138_MACHINE_STATUS_MARKER_COUNT_INVALID")
    expect(() => checkV138ExactMachineStatus(
      `<!-- ${marker}: {"next_action":"262-53","next_action":"262-54","completed_plans":41} -->\n`,
      marker, expected)).toThrow("V138_MACHINE_STATUS_VALUE_INVALID")
    expect(() => checkV138ExactMachineStatus(
      `unscoped ${JSON.stringify(expected)}\n<!-- ${marker}: {"next_action":"262-53","completed_plans":40} -->\n`,
      marker, expected)).toThrow("V138_MACHINE_STATUS_VALUE_INVALID")
  })

  it("denies drift and scans future authority or live work in both route-capable modules", () => {
    const frozenSources = Object.fromEntries(
      Object.keys(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256).map((repoPath) => [
        repoPath,
        execFileSync("git", ["cat-file", "blob",
          V138_FROZEN_ROUTE_CAPABLE_SOURCE_OBJECTS[repoPath]!.blobOid], {
          cwd: repoRoot, encoding: "utf8" }),
      ]),
    )
    expect(analyzeV138PolicySourcesWithFrozenRouteAllowlist(frozenSources))
      .toEqual([])
    for (const repoPath of Object.keys(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)) {
      const source = frozenSources[repoPath]!
      const findings = analyzeV138PolicySourcesWithFrozenRouteAllowlist({
        ...frozenSources,
        [repoPath]: `${source}\nexport const writeFutureAuthorityRoute = () => {
          executeV138ParallelMatrix()
        }\n`,
      })
      expect(findings.map((finding) => finding.code)).toEqual(
        expect.arrayContaining([
          "ROUTE_CAPABLE_SOURCE_DRIFT",
          "AUTHORITY_WRITER",
          "LIVE_WORK_COMMAND",
        ]),
      )
    }
  }, 15_000)

  it("requires the frozen route-capable inventory through deletion, rename, and inventory tamper", () => {
    expect(Object.isFrozen(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)).toBe(true)
    expect(Object.keys(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)).toEqual([
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
      "scripts/lib/v1-38-successor-source-seal.ts",
      "scripts/check-v1-38-plan-262-55-source-completeness-review.ts",
    ])
    expect(execFileSync("git", ["cat-file", "blob",
      V138_HISTORICAL_REVIEWER_V2_SOURCE_OBJECT.blobOid], { cwd: repoRoot }))
      .toHaveLength(34_992)

    const canonicalCollection = collectV138ChangedPolicySources(repoRoot)
    expect(canonicalCollection.findings).toEqual([])
    for (const repoPath of Object.keys(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)) {
      expect(canonicalCollection.sources).toHaveProperty(repoPath)
      const tamperedInventory = { ...canonicalCollection.sources }
      delete tamperedInventory[repoPath]
      expect(analyzeV138PolicySourcesWithFrozenRouteAllowlist(tamperedInventory))
        .toContainEqual({
          code: "ROUTE_CAPABLE_SOURCE_DRIFT",
          path: repoPath,
          line: 1,
          detail:
            "V138_ROUTE_CAPABLE_SOURCE_INVENTORY_REQUIRED: required frozen route-capable source is absent from the policy source inventory.",
        })
    }

    const fixtureParent = mkdtempSync(path.join(tmpdir(),
      "v138-route-capable-inventory-"))
    const fixtureRoot = path.join(fixtureParent, "repository")
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot,
      fixtureRoot], { timeout: 120_000 })
    try {
      for (const repoPath of Object.keys(
        V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)) {
        const target = path.join(fixtureRoot, repoPath)
        const renamed = `${target}.renamed`
        const expectCollectionFailure = (reason: string) => {
          expect(collectV138ChangedPolicySources(fixtureRoot).findings)
            .toContainEqual({
              code: "ROUTE_CAPABLE_SOURCE_DRIFT",
              path: repoPath,
              line: 1,
              detail: `${reason}: required frozen route-capable source could not be read as its canonical regular file.`,
            })
        }

        unlinkSync(target)
        expectCollectionFailure("V138_PLAN_262_15_ARTIFACT_REQUIRED")
        execFileSync("git", ["checkout", "--", repoPath], {
          cwd: fixtureRoot,
        })

        renameSync(target, renamed)
        expectCollectionFailure("V138_PLAN_262_15_ARTIFACT_REQUIRED")
        renameSync(renamed, target)

        unlinkSync(target)
        mkdirSync(target)
        expectCollectionFailure("V138_PLAN_262_15_ARTIFACT_TYPE_INVALID")
        rmSync(target, { recursive: true })
        execFileSync("git", ["checkout", "--", repoPath], {
          cwd: fixtureRoot,
        })

        unlinkSync(target)
        symlinkSync(path.join(fixtureRoot,
          "scripts/lib/v1-38-darwin-headroom.ts"), target, "file")
        expectCollectionFailure("V138_PLAN_262_15_ARTIFACT_TYPE_INVALID")
        unlinkSync(target)
        execFileSync("git", ["checkout", "--", repoPath], {
          cwd: fixtureRoot,
        })
      }
    } finally {
      rmSync(fixtureParent, { recursive: true, force: true })
    }
  }, 120_000)

  it("freezes isolated v6/v10/v11 schemas and exclusive destinations", () => {
    expect(V138_PLAN_262_47_AUTHORIZATION_SCHEMA)
      .toBe("v1.38-plan-262-47-authorization-v6")
    expect(V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA)
      .toBe("v1.38-successor-source-seal-v6")
    expect(V138_PLAN_262_47_ROUTE_CONTRACT).toMatchObject({
      routeOrdinal: 6,
      executionContextSchema: "v1.38-current-matrix-execution-context-v10",
      preflightSchema: "v1.38-current-matrix-headroom-preflight-v10",
      calibrationSchema: "v1.38-current-matrix-calibration-v10",
      reproductionSchema: "v1.38-current-matrix-reproduction-v11",
      resourceSampleMilliseconds: 200,
      requiredHostHeadroomBasisPoints: 2500,
      calibrationAttemptCount: 8,
      calibrationShardCount: 4,
      reproductionCellCount: 540,
      noRetry: true,
    })
    expect(new Set(V138_PLAN_262_47_FRESH_DESTINATIONS).size).toBe(8)
    expect(V138_PLAN_262_47_FRESH_DESTINATIONS.every((repoPath) =>
      !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
    expect(existsSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.authorization))).toBe(true)
    expect(existsSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.seal))).toBe(true)
    expect(checkV138Plan26247RouteContract(
      V138_PLAN_262_47_ROUTE_CONTRACT)).toBe(V138_PLAN_262_47_ROUTE_CONTRACT)
    expect(() => checkV138Plan26247RouteContract({
      ...V138_PLAN_262_47_ROUTE_CONTRACT,
      authorizationSchema: "v1.38-plan-262-29-authorization-v5",
    })).toThrow("MATRIX_PLAN_262_47_ROUTE_CONTRACT_INVALID")
  })

  it("derives full commit, tree, and parent identity through Git", () => {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot, encoding: "utf8",
    }).trim()
    const identity = inspectV138SourceIdentityA6(repoRoot, commit)
    expect(identity.reviewedSourceCommit).toBe(commit)
    expect(identity.reviewedSourceCommit).toMatch(/^[0-9a-f]{40}$/u)
    expect(identity.reviewedSourceTree).toMatch(/^[0-9a-f]{40}$/u)
    expect(identity.reviewedSourceParents).toHaveLength(1)
    expect(() => inspectV138SourceIdentityA6(repoRoot, commit.slice(0, 12)))
      .toThrow("V138_PLAN_262_47_SOURCE_IDENTITY_INVALID")
  })

  it("renders without persisting or invoking any route writer", () => {
    const commit = "600c7770867e6090147914dc090780f5b63930ec"
    const literal = v138Plan26247AuthorizationLiteral(repoRoot, commit)
    expect(literal).toContain(`reviewed source commit ${commit}`)
    expect(literal).toContain("route ordinal 6")
    expect(literal).toContain("execution-context:v10")
    expect(literal).toContain("reproduction:v11 540-cell run")
    expect(literal).toContain("single_operator_local_seal_v1")
    expect(literal).toContain("200 ms sampling")
    expect(literal).toContain("inclusive 2,500-basis-point")
    expect(literal).toContain("eight-attempt/four-shard")
    expect(V138_PLAN_262_47_FRESH_DESTINATIONS.every((repoPath) =>
      !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
  }, 30_000)

  it("rejects old authority and identity mutations after root recomputation", () => {
    const authority = JSON.parse(readFileSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.authorization), "utf8"))
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, authority))
      .toThrow("V138_PLAN_262_47_REVIEWED_SOURCE_BLOB_INVALID")
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, {
      ...authority,
      schemaVersion: "v1.38-plan-262-29-authorization-v5",
    })).toThrow("V138_PLAN_262_47_AUTHORIZATION_SCHEMA_INVALID")
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, {
      ...authority,
      reviewedSourceTree: "0".repeat(40),
    })).toThrow("V138_PLAN_262_47_AUTHORIZATION_INVALID")
  })

  it("accepts only admitted 8/4 calibration followed by exact clean 540 cells", () => {
    const calibration = Object.freeze({ admitted: true,
      chargedAttemptIds: Object.freeze(Array.from({ length: 8 }, (_, index) =>
        `calibration:v10:${index}`)), shardCount: 4, completeCleanup: true,
      systemFailureCount: 0 })
    const cells = Object.freeze(Array.from({ length: 540 }, (_, index) =>
      Object.freeze({ cellId: `cell:${index.toString().padStart(3, "0")}`,
        accepted: true, systemFailure: false, legalityViolation: false,
        privacyViolation: false, formationPresent: false })))
    expect(checkV138Plan26247SyntheticRoute({ calibration, cells }))
      .toMatchObject({ disposition: "reproduction_passed", acceptedCellCount: 540 })
    expect(() => checkV138Plan26247SyntheticRoute({ calibration,
      cells: cells.slice(0, 539) })).toThrow("MATRIX_PLAN_262_47_REPRODUCTION_INVALID")
    expect(() => checkV138Plan26247SyntheticRoute({ calibration: {
      ...calibration, chargedAttemptIds: calibration.chargedAttemptIds.slice(0, 7),
    }, cells })).toThrow("MATRIX_PLAN_262_47_CALIBRATION_INVALID")
    expect(() => checkV138Plan26247SyntheticRoute({ calibration, cells: [
      ...cells.slice(0, 539), { ...cells[539]!, privacyViolation: true },
    ] })).toThrow("MATRIX_PLAN_262_47_REPRODUCTION_INVALID")
  })
})

describe("v1.38 Plan 262-57 offline route-7 source contract", () => {
  it("keeps historical v7 route metadata read-only beside distinct v8 authority", () => {
    expect(V138_PLAN_262_55_REVIEWER_PROTOCOL)
      .toBe("single_operator_procedural_source_review_v1")
    expect(checkV138Plan26257RouteContract()).toBe(
      V138_PLAN_262_57_ROUTE_CONTRACT)
    expect(V138_PLAN_262_57_ROUTE_CONTRACT_V9).toMatchObject({ routeOrdinal: 7,
      authorizationSchema: V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA,
      sealSchema: V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA,
      executionContextSchema: "v1.38-current-matrix-execution-context-v11",
      preflightSchema: "v1.38-current-matrix-headroom-preflight-v11",
      calibrationSchema: "v1.38-current-matrix-calibration-v11",
      reproductionSchema: "v1.38-current-matrix-reproduction-v12",
      reproductionCellCount: 540, noRetry: true })
    expect(V138_PLAN_262_57_FRESH_DESTINATIONS).toEqual([
      ...V138_PLAN_262_57_ROUTE_DESTINATIONS,
      V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
    ])
    expect(new Set(V138_PLAN_262_57_FRESH_DESTINATIONS).size)
      .toBe(V138_PLAN_262_57_FRESH_DESTINATIONS.length)
    expect(V138_PLAN_262_57_ROUTE_CONTRACT.canonicalDestinations)
      .toEqual(V138_PLAN_262_57_ROUTE_DESTINATIONS)
    expect(V138_PLAN_262_56_AUTHORIZATION_SCHEMA)
      .toBe("v1.38-plan-262-56-authorization-v7")
    expect(V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA)
      .toBe("v1.38-successor-source-seal-v7")
    expect(V138_PLAN_262_56_AUTHORIZATION_SCHEMA)
      .not.toBe(V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA)
    expect(V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA)
      .not.toBe(V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA)
    expect(V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS).toEqual([
      ".planning/artifacts/v1.38-plan-262-56-authorization-v7.json",
      ".planning/artifacts/v1.38-successor-source-seal-v7.json",
      ".planning/artifacts/v1.38-plan-262-56-authorization-v8.json",
      ".planning/artifacts/v1.38-successor-source-seal-v8.json",
    ])
  })

  it("represents initial obstruction outside the terminal path", () => {
    const root = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    const disposition = buildV138Plan26257PreStartObstructionV1({
      path: V138_PLAN_262_57_ROUTE_DESTINATIONS[0]!, type: "file",
      metadataRoot: root, authorizationRoot: root, sealRoot: root })
    expect(checkV138Plan26257PreStartObstructionV1(disposition))
      .toEqual(disposition)
    expect(disposition).toMatchObject({ routeStarted: false,
      isRouteTerminal: false, chargedAttemptCount: 0, acceptedCellCount: 0,
      authorityExpired: true, satisfiesAdmit03: false })
    expect(() => checkV138Plan26257PreStartObstructionV1({ ...disposition,
      routeStarted: true })).toThrow(
        "MATRIX_PLAN_262_57_PRE_START_OBSTRUCTION_INVALID")
  })

  it("models the post-start fresh-destination failure as a closed terminal", () => {
    expect(V138_PLAN_262_57_ROUTE_CONTRACT.terminalDispositions)
      .toContain("fresh_destination_failed")
    expect(new Set(V138_PLAN_262_57_ROUTE_CONTRACT.terminalDispositions).size)
      .toBe(V138_PLAN_262_57_ROUTE_CONTRACT.terminalDispositions.length)
  })

  it("charges route-7 calibration attempts only in the v11 namespace", () => {
    const charged = deriveV138CalibrationAttemptMappings(
      enumerateV138CurrentMatrix(repoRoot), "v11")
      .map(({ executionAttemptId }) => executionAttemptId)
    expect(charged).toHaveLength(8)
    expect(charged.every((attemptId) =>
      attemptId.startsWith("calibration:v11:"))).toBe(true)
    expect(charged.some((attemptId) => attemptId.includes(":v9:"))).toBe(false)
  })
})
