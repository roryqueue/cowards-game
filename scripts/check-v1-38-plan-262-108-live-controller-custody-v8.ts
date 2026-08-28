import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import {
  V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
  V138_LIVE_V8_PATHS,
  authenticateV138LiveV8ProtectedHistory,
  checkV138LiveV8SyntheticCustodyForReview,
  computeV138LiveV8ReviewCarrierRoot,
  computeV138LiveV8ReviewPayloadRoot,
  computeV138LiveV8SupplementRoot,
  type V138LiveV8Plan93Stop,
  type V138LiveV8ReviewBundle,
  type V138LiveV8Supplement,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v8.js"
import {
  V138_BOUNDED_RETRY_V3_PATHS,
} from "./run-v1-38-bounded-retry-envelope-v3.js"
import {
  checkV138Plan262104CommittedInactivePair,
} from "./run-v1-38-bounded-retry-envelope-v3-review-v7.js"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SOURCE_COMMIT = "a964be04a8a0628d4969d2b38b02a31a51120a83"
const SOURCE_TREE = "20772dc04f7ca2b767cc4cc3ac090b54c149e239"
const SOURCE_PARENT = "b94d48050289707190cfcecffda567fd710c7801"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT =
  "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT =
  "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT =
  "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

export const V138_PLAN_262_108_PATHS = Object.freeze({
  source: "scripts/check-v1-38-plan-262-108-live-controller-custody-v8.ts",
  tests: "scripts/check-v1-38-plan-262-108-live-controller-custody-v8.test.ts",
  payload: V138_LIVE_V8_PATHS.plan108Payload,
  review: V138_LIVE_V8_PATHS.plan108Review,
  carrier: V138_LIVE_V8_PATHS.plan108Carrier,
  supplement: V138_LIVE_V8_PATHS.supplement,
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  forbiddenCanonicalDestinations: Object.freeze([
    V138_LIVE_V8_PATHS.supplement,
    V138_BOUNDED_RETRY_V3_PATHS.journal,
    `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
    V138_BOUNDED_RETRY_V3_PATHS.privateDir,
    V138_BOUNDED_RETRY_V3_PATHS.terminal,
    V138_BOUNDED_RETRY_V3_PATHS.reproduction,
    V138_BOUNDED_RETRY_V3_PATHS.receiptManifest,
    V138_BOUNDED_RETRY_V3_PATHS.disposition,
    V138_BOUNDED_RETRY_V3_PATHS.correction,
    V138_BOUNDED_RETRY_V3_PATHS.activation,
    V138_BOUNDED_RETRY_V3_PATHS.readiness,
    V138_BOUNDED_RETRY_V3_PATHS.lifecycle,
  ]),
})

export const V138_PLAN_262_108_MODES = Object.freeze([
  "--derive-review-no-publish",
  "--write-review",
  "--check-review",
  "--derive-supplement-no-publish",
  "--publish-disposable-supplement",
  "--check-disposable-supplement",
  "--run-synthetic-no-effect",
] as const)

const PLAN_93_STOP: V138LiveV8Plan93Stop = Object.freeze({
  attempt: 1,
  status: "pre_start_integrity_stop",
  stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
  liveEffectBoundaryCrossed: false,
  envelopeConsumed: false,
  routeStarts: 0,
  preflightObservations: 0,
  calibrationCharged: 0,
  reproductionCharged: 0,
  freshAccepted: 0,
  terminalPresent: false,
  complete: false,
})

const safeWorkingBytes = (root: string, repoPath: string): Buffer => {
  if (
    path.isAbsolute(repoPath) ||
    repoPath.split("/").some((part) => !part || part === "." || part === "..")
  )
    fail("V138_PLAN_262_108_PATH_INVALID")
  const target = path.join(root, ...repoPath.split("/"))
  const status = lstatSync(target)
  if (!status.isFile() || status.isSymbolicLink())
    fail(`V138_PLAN_262_108_WORKING_ENTRY_INVALID:${repoPath}`)
  return readFileSync(target)
}

const committedRecord = (
  root: string,
  sourceCommit: string,
  repoPath: string,
): Readonly<{ path: string; mode: "100644" | "100755"; blob: string; sha256: Sha }> => {
  const entry = runV138RetryV3IsolatedGit(root, [
    "ls-tree",
    sourceCommit,
    "--",
    repoPath,
  ])
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath)
    fail(`V138_PLAN_262_108_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const mode = match[1] as "100644" | "100755"
  const blob = match[2]!
  const committed = runV138RetryV3IsolatedGitBytes(root, [
    "cat-file",
    "blob",
    `${sourceCommit}:${repoPath}`,
  ])
  const working = safeWorkingBytes(root, repoPath)
  const status = lstatSync(path.join(root, ...repoPath.split("/")))
  if ((mode === "100755") !== ((status.mode & 0o111) !== 0))
    fail(`V138_PLAN_262_108_WORKING_MODE_INVALID:${repoPath}`)
  if (!working.equals(committed))
    fail(`V138_PLAN_262_108_WORKING_BYTES_INVALID:${repoPath}`)
  if (
    runV138RetryV3IsolatedGit(root, [
      "log",
      "--format=%H",
      `${sourceCommit}..HEAD`,
      "--",
      repoPath,
    ]) !== ""
  )
    fail(`V138_PLAN_262_108_SOURCE_REWRITTEN:${repoPath}`)
  return Object.freeze({ path: repoPath, mode, blob, sha256: sha256(committed) })
}

const resolveCommittedImport = (
  root: string,
  sourceCommit: string,
  ownerPath: string,
  specifier: string,
): string | null => {
  if (!specifier.startsWith(".")) return null
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(ownerPath), specifier))
  const candidates = raw.endsWith(".js")
    ? [`${raw.slice(0, -3)}.ts`, `${raw.slice(0, -3)}.tsx`]
    : [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`]
  for (const candidate of candidates) {
    const entry = runV138RetryV3IsolatedGit(root, ["ls-tree", sourceCommit, "--", candidate])
    if (/^(100644|100755) blob [0-9a-f]{40}\t/u.test(entry)) return candidate
  }
  fail(`V138_PLAN_262_108_RELATIVE_IMPORT_UNRESOLVED:${ownerPath}:${specifier}`)
}

const recursiveDependencyManifest = (
  root: string,
  sourceCommit: string,
  entryPaths: readonly string[],
) => {
  const visited = new Set<string>()
  const queue = entryPaths.filter((repoPath) => repoPath.endsWith(".ts"))
  const records: Array<ReturnType<typeof committedRecord>> = []
  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (visited.has(repoPath)) continue
    visited.add(repoPath)
    const record = committedRecord(root, sourceCommit, repoPath)
    records.push(record)
    const source = runV138RetryV3IsolatedGitBytes(root, [
      "cat-file",
      "blob",
      `${sourceCommit}:${repoPath}`,
    ]).toString("utf8")
    const imports = new Set(
      ts
        .preProcessFile(source, true, true)
        .importedFiles.map(({ fileName }) => fileName)
        .filter((fileName) => fileName.startsWith(".")),
    )
    for (const specifier of [...imports].sort()) {
      const resolved = resolveCommittedImport(root, sourceCommit, repoPath, specifier)
      if (resolved !== null && !visited.has(resolved)) queue.push(resolved)
    }
  }
  records.sort((left, right) => left.path.localeCompare(right.path))
  return Object.freeze({
    paths: Object.freeze(records.map((record) => record.path)),
    count: records.length,
    root: sha256(`v138-plan-262-108-recursive-dependency-v1\0${canonical(records)}`),
  })
}

export const inspectV138Plan262108RawCustody = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  try {
    runV138RetryV3IsolatedGit(root, [
      "merge-base",
      "--is-ancestor",
      SOURCE_COMMIT,
      head,
    ])
  } catch {
    fail("V138_PLAN_262_108_SOURCE_NOT_ANCESTOR")
  }
  const sourceTree = runV138RetryV3IsolatedGit(root, ["rev-parse", `${SOURCE_COMMIT}^{tree}`])
  const sourceParent = runV138RetryV3IsolatedGit(root, ["rev-parse", `${SOURCE_COMMIT}^`])
  if (sourceTree !== SOURCE_TREE || sourceParent !== SOURCE_PARENT)
    fail("V138_PLAN_262_108_SOURCE_IDENTITY_INVALID")
  const rawRecords = V138_LIVE_V8_EXECUTED_SOURCE_PATHS.map((repoPath) =>
    committedRecord(root, SOURCE_COMMIT, repoPath),
  )
  const recursive = recursiveDependencyManifest(
    root,
    SOURCE_COMMIT,
    V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
  )
  const rawByteManifestRoot = sha256(
    `v138-plan-262-108-raw-byte-manifest-v1\0${canonical(rawRecords)}`,
  )
  return Object.freeze({
    sourceCommit: SOURCE_COMMIT,
    sourceTree,
    sourceParent,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    pathCount: rawRecords.length,
    rawByteManifestRoot,
    recursiveDependencyRoot: recursive.root,
    recursiveDependencyCount: recursive.count,
    recursiveDependencyPaths: recursive.paths,
  })
}

export const inspectV138Plan262108Source = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const raw = inspectV138Plan262108RawCustody(root)
  const closure = authenticateV138RetryV3ExecutionClosure(root, {
    sourceCommit: SOURCE_COMMIT,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
  })
  const protectedHistory = authenticateV138LiveV8ProtectedHistory(root)
  const portableBody = {
    sourceCommit: raw.sourceCommit,
    sourceTree: raw.sourceTree,
    sourceParent: raw.sourceParent,
    checkoutPaths: raw.checkoutPaths,
    rawByteManifestRoot: raw.rawByteManifestRoot,
    recursiveDependencyRoot: raw.recursiveDependencyRoot,
    installedClosureRoot: closure.installedClosureRoot,
    nodeSha256: closure.nodeSha256,
    pnpmDistributionSha256: closure.pnpmDistributionSha256,
    nativeSourcesRoot: closure.nativeSourcesRoot,
    pathnameLaunchReplacementResistanceClaimed: false as const,
  }
  const portableClosureRoot = sha256(
    `v138-plan-262-108-portable-closure-v1\0${canonical(portableBody)}`,
  )
  if (portableClosureRoot === closure.executionClosureRoot)
    fail("V138_PLAN_262_108_PORTABLE_FULL_ROOT_ALIAS")
  return Object.freeze({
    ...portableBody,
    pathCount: raw.pathCount,
    recursiveDependencyCount: raw.recursiveDependencyCount,
    recursiveDependencyPaths: raw.recursiveDependencyPaths,
    portableClosureRoot,
    executionClosureRoot: closure.executionClosureRoot,
    gitObjectRoot: closure.gitObjectRoot,
    protectedHistoryRoot: protectedHistory.protectedHistoryRoot,
    expandedProtectedHistoryRoot: protectedHistory.expandedManifestRoot,
  })
}

const stateForPath = (root: string, repoPath: string): string => {
  const target = path.join(root, ...repoPath.split("/"))
  if (!existsSync(target)) return "absent"
  const status = lstatSync(target)
  if (!status.isFile() || status.isSymbolicLink()) return "unsafe-present"
  return `file:${status.mode & 0o777}:${sha256(readFileSync(target))}`
}

export const assertV138Plan262108NoCanonicalEffects = (root: string) => {
  const seal = stateForPath(root, V138_PLAN_262_108_PATHS.seal)
  const envelope = stateForPath(root, V138_PLAN_262_108_PATHS.envelope)
  const forbidden = Object.fromEntries(
    V138_PLAN_262_108_PATHS.forbiddenCanonicalDestinations.map((repoPath) => [
      repoPath,
      stateForPath(root, repoPath),
    ]),
  )
  if (Object.values(forbidden).some((value) => value !== "absent"))
    fail("V138_PLAN_262_108_CANONICAL_EFFECT_PRESENT")
  return Object.freeze({ seal, envelope, forbidden })
}

const reviewSemanticRoot = (body: Record<string, unknown>): Sha =>
  sha256(`v138-plan-262-108-review-semantic-v1\0${canonical(body)}`)

const findingRoot = (codes: readonly string[]): Sha =>
  sha256(`v138-plan-262-108-findings-v1\0${canonical([...codes].sort())}`)

const supplementDerivationRoot = (body: Record<string, unknown>): Sha =>
  sha256(`v138-plan-262-108-supplement-derivation-v1\0${canonical(body)}`)

const renderReview = (
  details: Record<string, any>,
  reviewRoot: Sha,
): string => `---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "108"
review_type: independent_executable_custody
status: ${details.findingCount === 0 ? "zero_findings" : "blocked"}
finding_count: ${details.findingCount}
reviewed_source_commit: ${details.source.sourceCommit}
review_root: ${reviewRoot}
reviewed: 2026-08-28
---

# Phase 262 Plan 108 Independent Executable-Custody Review

## Verdict

${details.findingCount === 0 ? "**ZERO FINDINGS.**" : "**BLOCKED.**"} The exact corrected Plan-107 executable source and recursively imported dependency closure were reviewed from raw committed Git bytes. Finding codes: ${details.findingCodes.length === 0 ? "none" : details.findingCodes.map((code: string) => `\`${code}\``).join(", ")}.

## Source Custody

| Field | Value |
|---|---|
| Source commit | \`${details.source.sourceCommit}\` |
| Source tree | \`${details.source.sourceTree}\` |
| Source parent | \`${details.source.sourceParent}\` |
| Checkout paths | ${details.source.pathCount} |
| Raw-byte manifest root | \`${details.source.rawByteManifestRoot}\` |
| Recursive dependency paths | ${details.source.recursiveDependencyCount} |
| Recursive dependency root | \`${details.source.recursiveDependencyRoot}\` |
| Installed closure root | \`${details.source.installedClosureRoot}\` |
| Native sources root | \`${details.source.nativeSourcesRoot}\` |
| Portable closure root | \`${details.source.portableClosureRoot}\` |
| Full execution closure root | \`${details.source.executionClosureRoot}\` |
| Protected-history root | \`${details.source.protectedHistoryRoot}\` |

The portable and full roots are distinct. Pathname-launch replacement resistance remains explicitly unclaimed.

## Actual Disposable Modes

| Mode | Result |
|---|---|
| Source-only validation | ${details.actualModes.sourceOnlyValidation} |
| Supplement derivation | ${details.actualModes.supplementDerivation} |
| Disposable supplement publication/check | ${details.actualModes.disposableSupplementPublicationCheck} |
| Synthetic no-effect adapter | ${details.actualModes.syntheticNoEffectAdapter} |

Actual modes passed: **${details.actualModesPassed}/4**. Synthetic producer eligibility observations: **${details.syntheticProducerCalls}**. Live invocations: **0**.

## Pair, Accounting, and Authority

- Pair commit: \`${PAIR_COMMIT}\`
- Seal root: \`${SEAL_ROOT}\`
- Envelope root: \`${ENVELOPE_ROOT}\`
- Envelope status: \`sealed_inactive\`
- Assurance: \`single_operator_local_seal_v1\`
- Route starts, preflight observations, calibration identities, reproduction identities, fresh accepted: all zero
- Fresh accepted: \`0/540\`
- Finding root: \`${details.findingRoot}\`
- Supplement derivation root: \`${details.supplementDerivationRoot}\`
- Review root: \`${reviewRoot}\`

Review publication changes no canonical pair byte, counter, capacity, live destination, or authority. Plan 109 eligibility is ${details.findingCount === 0 ? "true only for the committed literal-zero trio" : "false"}.

## Non-Authority

This review authorizes no execution. It creates no supplement, route, capacity, receipt, journal, terminal, reproduction, activation, lifecycle, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, or Phase-263 authority. Downstream authority remains denied.
`

const zeroCounters = Object.freeze({
  routeStartsConsumed: 0 as const,
  preflightObservationsConsumed: 0 as const,
  calibrationIdentitiesCharged: 0 as const,
  reproductionIdentitiesCharged: 0 as const,
  acceptedCells: 0 as const,
})

const buildTrio = (source: ReturnType<typeof inspectV138Plan262108Source>) => {
  const payloadBody = {
    schemaVersion:
      "v1.38-plan-262-108-live-controller-custody-review-payload-v8" as const,
    reviewedSourceCommit: source.sourceCommit,
    reviewedSourceTree: source.sourceTree,
    reviewedSourceParent: source.sourceParent,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: source.executionClosureRoot,
    findingCount: 0 as const,
    reviewStatus: "zero_findings" as const,
    actualModesPassed: 4 as const,
    syntheticProducerCalls: 1 as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    authorizesExecution: false as const,
    downstreamAuthority: "denied" as const,
  }
  const payload = Object.freeze({
    ...payloadBody,
    payloadRoot: computeV138LiveV8ReviewPayloadRoot(payloadBody),
  })
  const details = {
    source,
    findingCodes: [] as string[],
    findingCount: 0,
    findingRoot: findingRoot([]),
    actualModes: {
      sourceOnlyValidation: "passed",
      supplementDerivation: "passed",
      disposableSupplementPublicationCheck: "passed",
      syntheticNoEffectAdapter: "passed",
    },
    actualModesPassed: 4,
    syntheticProducerCalls: 1,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    plan109Eligible: true,
    downstreamAuthority: "denied",
  }
  const semanticBody = {
    schemaVersion: "v1.38-plan-262-108-review-semantic-v1",
    source,
    findingCodes: [],
    findingRoot: details.findingRoot,
    actualModes: details.actualModes,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    counters: zeroCounters,
    assuranceClass: "single_operator_local_seal_v1",
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const reviewRoot = reviewSemanticRoot(semanticBody)
  const supplementDerivation = supplementDerivationRoot({
    schemaVersion: "v1.38-plan-262-108-supplement-derivation-v1",
    sourceCommit: source.sourceCommit,
    executionClosureRoot: source.executionClosureRoot,
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    counters: zeroCounters,
    assuranceClass: "single_operator_local_seal_v1",
    authorizesExecution: false,
    downstreamAuthority: "denied",
  })
  const reviewDetails = {
    ...details,
    supplementDerivationRoot: supplementDerivation,
  }
  const reviewBytes = Buffer.from(renderReview(reviewDetails, reviewRoot))
  const carrierBody = {
    schemaVersion:
      "v1.38-plan-262-108-live-controller-custody-review-carrier-v1" as const,
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    payloadMode: "100644" as const,
    reviewMode: "100644" as const,
    carrierMode: "100644" as const,
    payloadSha256: sha256(Buffer.from(canonical(payload))),
    reviewSha256: sha256(reviewBytes),
    findingCount: 0 as const,
    authorizesExecution: false as const,
    downstreamAuthority: "denied" as const,
  }
  const carrier = Object.freeze({
    ...carrierBody,
    carrierRoot: computeV138LiveV8ReviewCarrierRoot(carrierBody),
  })
  const review: V138LiveV8ReviewBundle["review"] = Object.freeze({
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-v1",
    payloadRoot: payload.payloadRoot,
    findingCount: 0,
    verdict: "zero_findings",
    reviewRoot,
  })
  const supplementBody = {
    schemaVersion:
      "v1.38-successor-source-seal-v13-executable-custody-supplement-v1" as const,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    envelopeStatus: "sealed_inactive" as const,
    counters: zeroCounters,
    assuranceClass: "single_operator_local_seal_v1" as const,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    plan93: PLAN_93_STOP,
    plan107: {
      sourceCommit: source.sourceCommit,
      sourceTree: source.sourceTree,
      sourceParent: source.sourceParent,
      checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
      executionClosureRoot: source.executionClosureRoot,
    },
    plan108: {
      payloadRoot: payload.payloadRoot,
      reviewRoot,
      carrierRoot: carrier.carrierRoot,
      findingCount: 0 as const,
      verdict: "zero_findings" as const,
    },
    supersessionScope: "executable_source_custody_only" as const,
    createsEnvelope: false as const,
    createsCapacity: false as const,
    resetsCounters: false as const,
    authorizesExecution: false as const,
    candidateSearchAuthorized: false as const,
    formationAuthorized: false as const,
    holdoutAuthorized: false as const,
    publicAuthorized: false as const,
    productAuthorized: false as const,
    productionAuthorized: false as const,
    countedPlayAuthorized: false as const,
    gameplayChangeAuthorized: false as const,
    archiveAuthorized: false as const,
    tagAuthorized: false as const,
    phase263Authorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const supplement: V138LiveV8Supplement = Object.freeze({
    ...supplementBody,
    supplementRoot: computeV138LiveV8SupplementRoot(supplementBody),
  })
  return Object.freeze({
    ...details,
    supplementDerivationRoot: supplementDerivation,
    payload,
    review,
    reviewRoot,
    reviewBytes,
    carrier,
    supplement,
  })
}

const writeExclusive = (root: string, repoPath: string, bytes: Buffer): void => {
  const target = path.join(root, ...repoPath.split("/"))
  writeFileSync(target, bytes, { flag: "wx", mode: 0o644 })
}

const writeDisposableTrioAndSupplement = (
  clone: string,
  trio: ReturnType<typeof buildTrio>,
): void => {
  writeExclusive(clone, V138_PLAN_262_108_PATHS.payload, Buffer.from(canonical(trio.payload)))
  writeExclusive(clone, V138_PLAN_262_108_PATHS.review, trio.reviewBytes)
  writeExclusive(clone, V138_PLAN_262_108_PATHS.carrier, Buffer.from(canonical(trio.carrier)))
  writeExclusive(clone, V138_PLAN_262_108_PATHS.supplement, Buffer.from(canonical(trio.supplement)))
  execFileSync(
    "/usr/bin/git",
    [
      "-c",
      "user.name=Plan 262-108 Disposable Reviewer",
      "-c",
      "user.email=plan-262-108@example.invalid",
      "-c",
      "core.hooksPath=/dev/null",
      "add",
      "--",
      V138_PLAN_262_108_PATHS.payload,
      V138_PLAN_262_108_PATHS.review,
      V138_PLAN_262_108_PATHS.carrier,
      V138_PLAN_262_108_PATHS.supplement,
    ],
    { cwd: clone, env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" } },
  )
  execFileSync(
    "/usr/bin/git",
    [
      "-c",
      "user.name=Plan 262-108 Disposable Reviewer",
      "-c",
      "user.email=plan-262-108@example.invalid",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--quiet",
      "-m",
      "test: disposable Plan 262-108 custody",
    ],
    { cwd: clone, env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" } },
  )
}

const exerciseDisposableModes = (
  root: string,
  source: ReturnType<typeof inspectV138Plan262108Source>,
) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-108-review-"))
  const clone = path.join(owner, "repo")
  try {
    execFileSync(
      "/usr/bin/git",
      ["-c", "core.hooksPath=/dev/null", "clone", "--quiet", "--no-local", root, clone],
      {
        env: {
          PATH: "/usr/bin:/bin",
          LANG: "C",
          LC_ALL: "C",
          HOME: owner,
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: "/dev/null",
        },
      },
    )
    inspectV138Plan262108RawCustody(clone)
    const trio = buildTrio(source)
    const effectsBefore = assertV138Plan262108NoCanonicalEffects(clone)
    writeDisposableTrioAndSupplement(clone, trio)
    const publishedChecks = [
      [V138_PLAN_262_108_PATHS.payload, Buffer.from(canonical(trio.payload))],
      [V138_PLAN_262_108_PATHS.review, trio.reviewBytes],
      [V138_PLAN_262_108_PATHS.carrier, Buffer.from(canonical(trio.carrier))],
      [V138_PLAN_262_108_PATHS.supplement, Buffer.from(canonical(trio.supplement))],
    ] as const
    for (const [repoPath, expected] of publishedChecks)
      if (!safeWorkingBytes(clone, repoPath).equals(expected))
        fail(`V138_PLAN_262_108_DISPOSABLE_PUBLICATION_INVALID:${repoPath}`)
    const pair = checkV138Plan262104CommittedInactivePair(root)
    const closure = {
      sourceCommit: source.sourceCommit,
      sourceTree: source.sourceTree,
      sourceParent: source.sourceParent,
      executionClosureRoot: source.executionClosureRoot,
    }
    const synthetic = checkV138LiveV8SyntheticCustodyForReview({
      stop: PLAN_93_STOP,
      pair,
      review: { payload: trio.payload, review: trio.review, carrier: trio.carrier },
      supplement: trio.supplement,
      closure,
    })
    if (
      synthetic.producerWouldInvoke !== true ||
      synthetic.liveInvoked !== false
    )
      fail("V138_PLAN_262_108_DISPOSABLE_MODE_INVALID")
    for (const repoPath of V138_PLAN_262_108_PATHS.forbiddenCanonicalDestinations.slice(1))
      if (existsSync(path.join(clone, repoPath)))
        fail(`V138_PLAN_262_108_DISPOSABLE_EFFECT_PRESENT:${repoPath}`)
    return Object.freeze({
      sourceOnlyValidation: "passed" as const,
      supplementDerivation: "passed" as const,
      disposableSupplementPublicationCheck: "passed" as const,
      syntheticNoEffectAdapter: "passed" as const,
      actualModesPassed: 4 as const,
      syntheticProducerCalls: 1 as const,
      liveInvoked: false as const,
      effectsBefore,
      cleanupComplete: true as const,
      supplementRoot: trio.supplement.supplementRoot,
    })
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

export const deriveV138Plan262108ReviewNoPublish = (root: string) => {
  const canonicalEffects = assertV138Plan262108NoCanonicalEffects(root)
  const source = inspectV138Plan262108Source(root)
  const modes = exerciseDisposableModes(root, source)
  const trio = buildTrio(source)
  if (modes.supplementRoot !== trio.supplement.supplementRoot)
    fail("V138_PLAN_262_108_DISPOSABLE_SUPPLEMENT_ROOT_MISMATCH")
  const after = assertV138Plan262108NoCanonicalEffects(root)
  if (canonical(after) !== canonical(canonicalEffects))
    fail("V138_PLAN_262_108_CANONICAL_STATE_CHANGED")
  return Object.freeze({
    ...trio,
    findingCount: 0 as const,
    findingCodes: Object.freeze([] as string[]),
    findingRoot: findingRoot([]),
    actualModes: Object.freeze({
      sourceOnlyValidation: modes.sourceOnlyValidation,
      supplementDerivation: modes.supplementDerivation,
      disposableSupplementPublicationCheck: modes.disposableSupplementPublicationCheck,
      syntheticNoEffectAdapter: modes.syntheticNoEffectAdapter,
    }),
    actualModesPassed: 4 as const,
    syntheticProducerCalls: 1 as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    plan109Eligible: true as const,
    downstreamAuthority: "denied" as const,
    cleanupComplete: true as const,
  })
}

export const publishV138Plan262108Review = (root: string) => {
  const result = deriveV138Plan262108ReviewNoPublish(root)
  writeExclusive(root, V138_PLAN_262_108_PATHS.payload, Buffer.from(canonical(result.payload)))
  writeExclusive(root, V138_PLAN_262_108_PATHS.review, result.reviewBytes)
  writeExclusive(root, V138_PLAN_262_108_PATHS.carrier, Buffer.from(canonical(result.carrier)))
  return result
}

export const checkV138Plan262108PublishedReview = (root: string) => {
  for (const repoPath of [
    V138_PLAN_262_108_PATHS.payload,
    V138_PLAN_262_108_PATHS.review,
    V138_PLAN_262_108_PATHS.carrier,
  ])
    if (!existsSync(path.join(root, ...repoPath.split("/"))))
      fail(`V138_PLAN_262_108_PUBLISHED_FILE_MISSING:${repoPath}`)
  const expected = deriveV138Plan262108ReviewNoPublish(root)
  const checks = [
    [V138_PLAN_262_108_PATHS.payload, Buffer.from(canonical(expected.payload))],
    [V138_PLAN_262_108_PATHS.review, expected.reviewBytes],
    [V138_PLAN_262_108_PATHS.carrier, Buffer.from(canonical(expected.carrier))],
  ] as const
  for (const [repoPath, bytes] of checks) {
    const actual = safeWorkingBytes(root, repoPath)
    if (!actual.equals(bytes)) fail(`V138_PLAN_262_108_PUBLISHED_BYTES_INVALID:${repoPath}`)
  }
  return expected
}

export interface V138Plan262108CliDependencies {
  repoRoot: string
  writeOutput: (value: string) => void
}

const cliResult = (result: ReturnType<typeof deriveV138Plan262108ReviewNoPublish>) =>
  `${JSON.stringify({
    status: "zero_findings",
    sourceCommit: result.source.sourceCommit,
    executionClosureRoot: result.source.executionClosureRoot,
    recursiveDependencyRoot: result.source.recursiveDependencyRoot,
    findingCount: result.findingCount,
    findingRoot: result.findingRoot,
    payloadRoot: result.payload.payloadRoot,
    reviewRoot: result.reviewRoot,
    carrierRoot: result.carrier.carrierRoot,
    supplementRoot: result.supplement.supplementRoot,
    actualModesPassed: result.actualModesPassed,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    plan109Eligible: result.plan109Eligible,
    downstreamAuthority: "denied",
  })}\n`

export const executeV138Plan262108Cli = async (
  args: readonly string[],
  injected?: Partial<V138Plan262108CliDependencies>,
): Promise<void> => {
  if (args.length !== 1 || !V138_PLAN_262_108_MODES.includes(args[0] as never))
    fail("V138_PLAN_262_108_ARGUMENTS_INVALID")
  const repoRoot = injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const writeOutput = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  const mode = args[0]
  if (mode === "--write-review") {
    writeOutput(cliResult(publishV138Plan262108Review(repoRoot)))
    return
  }
  if (mode === "--check-review") {
    writeOutput(cliResult(checkV138Plan262108PublishedReview(repoRoot)))
    return
  }
  const result = deriveV138Plan262108ReviewNoPublish(repoRoot)
  if (mode === "--derive-supplement-no-publish") {
    writeOutput(`${JSON.stringify({ status: "supplement_derived_not_published", supplementRoot: result.supplement.supplementRoot, liveInvoked: false, downstreamAuthority: "denied" })}\n`)
    return
  }
  if (mode === "--publish-disposable-supplement") {
    writeOutput(`${JSON.stringify({ status: "disposable_supplement_published_and_removed", supplementRoot: result.supplement.supplementRoot, cleanupComplete: true, liveInvoked: false })}\n`)
    return
  }
  if (mode === "--check-disposable-supplement") {
    writeOutput(`${JSON.stringify({ status: "disposable_supplement_checked", actualModesPassed: 4, cleanupComplete: true, liveInvoked: false })}\n`)
    return
  }
  if (mode === "--run-synthetic-no-effect") {
    writeOutput(`${JSON.stringify({ status: "synthetic_no_effect_passed", syntheticProducerCalls: 1, liveInvoked: false, freshCharged: 0, freshAccepted: 0 })}\n`)
    return
  }
  writeOutput(cliResult(result))
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isEntrypoint)
  executeV138Plan262108Cli(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
