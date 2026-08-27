#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Sha256 = `sha256:${string}`
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_80_PATHS = Object.freeze({
  plan77Review:
    ".planning/artifacts/v1.38-plan-262-77-bounded-retry-source-review-v1.json",
  plan77Report: `${PHASE_DIR}/262-77-REVIEW.md`,
  plan77Summary: `${PHASE_DIR}/262-77-SUMMARY.md`,
  plan83Review:
    ".planning/artifacts/v1.38-plan-262-83-bounded-retry-source-rereview-v1.json",
  localSeal:
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  historyBinder:
    ".planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json",
  plan74Archive: `${PHASE_DIR}/archived/262-74-HISTORICAL.md`,
  plan74Summary: `${PHASE_DIR}/262-74-SUMMARY.md`,
  seal: ".planning/artifacts/v1.38-successor-source-seal-v11.json",
  envelope: ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v1",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v15.json",
  disposition:
    ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
  activationRoot:
    ".planning/artifacts/v1.38-foundation-activation-root-route9.json",
})

const SOURCE_PATHS = Object.freeze([
  `${PHASE_DIR}/262-82-SUMMARY.md`,
  "scripts/run-v1-38-bounded-retry-envelope.ts",
  "scripts/lib/v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.test.ts",
])
const EXPECTED = Object.freeze({
  plan77JsonSha:
    "sha256:76d0c0eef92fca733078d56f786ab2bb2c462ba87c243951793d504078ed54f8",
  plan77ReportSha:
    "sha256:82de726955d2162dac32b227744efd66f851e7b736f9acaa421d3d514de234b2",
  plan77SummarySha:
    "sha256:e84302fa5c820a4c3e904ebb24b8da3dd37211be643920b19b8ca84d537f36a7",
  plan77Root:
    "sha256:1d58e184fd6283e3d62c7de0c4dc51cad4f8e5447bb70b2fa48d13588aade8f3",
  plan83Root:
    "sha256:9518cfcff11ba64029ff74f6e56e0c0448f82b5d0d63500dedf793f7ce85595c",
  plan74ArchiveSha:
    "sha256:9fc59c094d5423830500c383c1a7613e54a0d2dc6e0ee1a00f4882981f16913d",
  sourceCommit: "e844279f62192c41175fb3e7a08910493c6f24ab",
  sealParent: "ac9f1deb4da71f8a3a297073185c88ff1557151b",
  sealCommit: "4841357d7aa89b7996f9ce299256f1d8d56a6290",
  liveCommit: "b4be9f5f5207c7eb87c6cd0e8f79863d4877cf3b",
  localSealRoot:
    "sha256:4385ac8270b649f0876c7846cfc75bdc3682b8526d3ab517736ff27f01ab4b3b",
  protectedHistoryRoot:
    "sha256:7ce5a4127a23afcad93e689a76ef13a65716d964118e5862b9e1a858a59da093",
})
const EXPECTED_POLICY = Object.freeze({
  schemaVersion: "retry-envelope:v1",
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
  supervisedRuntimeOnly: true,
  assuranceClass: "single_operator_local_seal_v1",
  partialAcceptedEvidenceReusable: false,
  phase263PlanningAuthorized: false,
  candidateSearchAuthorized: false,
  formationMaterializationAuthorized: false,
  holdoutOpeningAuthorized: false,
  publicAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  gameplayChangeAuthorized: false,
})
const GENESIS_ROOT = `sha256:${createHash("sha256")
  .update("v138-bounded-retry-journal-genesis-v1")
  .digest("hex")}` as Sha256

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? (Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, normalize(child)]),
        ) as Json)
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(normalize(value as Json))}\n`
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const lines = (value: string): string[] =>
  value.trim() === "" ? [] : value.trim().split("\n")
const isSha = (value: unknown): value is Sha256 =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const git = (root: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
const requireAncestor = (root: string, ancestor: string): boolean => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, "HEAD"], {
      cwd: root,
      stdio: "ignore",
    })
    return true
  } catch {
    return false
  }
}
const safeType = (
  target: string,
): "absent" | "regular" | "directory" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "absent"
    throw error
  }
}
const readRegular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  if (safeType(target) !== "regular") fail("V138_PLAN_262_80_INPUT_UNSAFE")
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}
const readJson = (root: string, repoPath: string): any => {
  const bytes = readRegular(root, repoPath).toString("utf8")
  return JSON.parse(bytes)
}
const rootWithout = (domain: string, value: any, key: string): Sha256 => {
  const body = clone(value)
  delete body[key]
  return sha256(`${domain}\0${canonical(body)}`)
}

const scanUnsafeKeys = (value: unknown): string[] => {
  const forbidden = new Set([
    "strategySource",
    "strategyMemory",
    "soldierMemory",
    "objectivePayload",
    "rawDiagnostics",
    "commitmentSecret",
    "environment",
    "hostPath",
  ])
  const found = new Set<string>()
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) return item.forEach(visit)
    if (item === null || typeof item !== "object") return
    for (const [key, child] of Object.entries(item)) {
      if (forbidden.has(key)) found.add(key)
      visit(child)
    }
  }
  visit(value)
  return [...found].sort()
}

const inspectGitCustody = (root: string, values: any) => {
  const sourceBytes = SOURCE_PATHS.map((repoPath) => ({
    repoPath,
    sha256: sha256(readRegular(root, repoPath)),
  }))
  const sourceRoot = sha256(canonical(sourceBytes))
  const currentMatchesParent = SOURCE_PATHS.every((repoPath) =>
    execFileSync("git", ["show", `${EXPECTED.sealParent}:${repoPath}`], {
      cwd: root,
    }).equals(readRegular(root, repoPath)),
  )
  const sourceUnrewritten = SOURCE_PATHS.every(
    (repoPath) =>
      lines(
        git(root, [
          "log",
          "--format=%H",
          `${EXPECTED.sealParent}..HEAD`,
          "--",
          repoPath,
        ]),
      ).length === 0,
  )
  const sealMeta = git(root, [
    "show",
    "-s",
    "--format=%H%n%P",
    EXPECTED.sealCommit,
  ]).split("\n")
  const sealPaths = lines(
    git(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      EXPECTED.sealCommit,
    ]),
  ).sort()
  const livePaths = lines(
    git(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      EXPECTED.liveCommit,
    ]),
  ).sort()
  const expectedLive = [
    V138_PLAN_262_80_PATHS.journal,
    V138_PLAN_262_80_PATHS.terminal,
  ]
  for (let ordinal = 0; ordinal < 15; ordinal += 1) {
    expectedLive.push(
      `${V138_PLAN_262_80_PATHS.privateDir}/journal-record-${String(ordinal).padStart(4, "0")}.json`,
    )
  }
  const evidenceUnrewritten = [
    V138_PLAN_262_80_PATHS.journal,
    V138_PLAN_262_80_PATHS.terminal,
    ...expectedLive.slice(2),
  ].every(
    (repoPath) =>
      lines(
        git(root, [
          "log",
          "--format=%H",
          `${EXPECTED.liveCommit}..HEAD`,
          "--",
          repoPath,
        ]),
      ).length === 0,
  )
  const clean =
    git(root, [
      "status",
      "--porcelain",
      "--",
      ...SOURCE_PATHS,
      V138_PLAN_262_80_PATHS.plan77Review,
      V138_PLAN_262_80_PATHS.plan77Report,
      V138_PLAN_262_80_PATHS.plan77Summary,
      V138_PLAN_262_80_PATHS.plan83Review,
      V138_PLAN_262_80_PATHS.localSeal,
      V138_PLAN_262_80_PATHS.historyBinder,
      V138_PLAN_262_80_PATHS.plan74Archive,
      V138_PLAN_262_80_PATHS.seal,
      V138_PLAN_262_80_PATHS.envelope,
      ...expectedLive,
    ]) === ""
  return {
    plan74ArchiveSha256: sha256(
      readRegular(root, V138_PLAN_262_80_PATHS.plan74Archive),
    ),
    plan74SummaryAbsent:
      safeType(path.resolve(root, V138_PLAN_262_80_PATHS.plan74Summary)) ===
      "absent",
    plan77JsonSha256: sha256(
      readRegular(root, V138_PLAN_262_80_PATHS.plan77Review),
    ),
    plan77ReportSha256: sha256(
      readRegular(root, V138_PLAN_262_80_PATHS.plan77Report),
    ),
    plan77SummarySha256: sha256(
      readRegular(root, V138_PLAN_262_80_PATHS.plan77Summary),
    ),
    sourceRoot,
    sourceCurrentMatchesSealedParent: currentMatchesParent,
    sourceUnrewritten,
    sealDirectChild:
      sealMeta[0] === EXPECTED.sealCommit &&
      sealMeta[1] === EXPECTED.sealParent,
    sealPairPathsExact:
      canonical(sealPaths) ===
      canonical(
        [V138_PLAN_262_80_PATHS.envelope, V138_PLAN_262_80_PATHS.seal].sort(),
      ),
    livePathsExact: canonical(livePaths) === canonical(expectedLive.sort()),
    evidenceUnrewritten,
    commitsOnHead: [
      EXPECTED.sourceCommit,
      values.plan83Review.reviewedSource.plan82SummaryCommit,
      values.seal.reviewCommit,
      EXPECTED.sealParent,
      EXPECTED.sealCommit,
      EXPECTED.liveCommit,
    ].every((commit) => requireAncestor(root, commit)),
    clean,
  }
}

export const loadV138Plan26280Evidence = (root: string): any => {
  const plan77Review = readJson(root, V138_PLAN_262_80_PATHS.plan77Review)
  const plan83Review = readJson(root, V138_PLAN_262_80_PATHS.plan83Review)
  const localSeal = readJson(root, V138_PLAN_262_80_PATHS.localSeal)
  const historyBinder = readJson(root, V138_PLAN_262_80_PATHS.historyBinder)
  const seal = readJson(root, V138_PLAN_262_80_PATHS.seal)
  const envelope = readJson(root, V138_PLAN_262_80_PATHS.envelope)
  const journalBytes = readRegular(
    root,
    V138_PLAN_262_80_PATHS.journal,
  ).toString("utf8")
  const journal = lines(journalBytes).map((line) => JSON.parse(line))
  if (journal.map((record) => canonical(record)).join("") !== journalBytes)
    fail("V138_PLAN_262_80_JOURNAL_NONCANONICAL")
  const terminal = readJson(root, V138_PLAN_262_80_PATHS.terminal)
  const reproductionType = safeType(
    path.resolve(root, V138_PLAN_262_80_PATHS.reproduction),
  )
  const reproduction =
    reproductionType === "regular"
      ? readJson(root, V138_PLAN_262_80_PATHS.reproduction)
      : null
  if (reproductionType !== "regular" && reproductionType !== "absent")
    fail("V138_PLAN_262_80_REPRODUCTION_UNSAFE")
  const privateTarget = path.resolve(root, V138_PLAN_262_80_PATHS.privateDir)
  if (safeType(privateTarget) !== "directory")
    fail("V138_PLAN_262_80_PRIVATE_DIR_INVALID")
  const privateNames = readdirSync(privateTarget).sort()
  const privateReceipts = privateNames.map((name) => ({
    name,
    bytes: readRegular(
      root,
      `${V138_PLAN_262_80_PATHS.privateDir}/${name}`,
    ).toString("utf8"),
    mode: statSync(path.join(privateTarget, name)).mode & 0o777,
  }))
  const values = {
    plan77Review,
    plan83Review,
    localSeal,
    historyBinder,
    seal,
    envelope,
  }
  return {
    ...values,
    journal,
    journalSha256: sha256(journalBytes),
    terminal,
    terminalSha256: sha256(readRegular(root, V138_PLAN_262_80_PATHS.terminal)),
    reproduction,
    localSealSha256: sha256(
      readRegular(root, V138_PLAN_262_80_PATHS.localSeal),
    ),
    canonicalEvidence: [
      V138_PLAN_262_80_PATHS.plan77Review,
      V138_PLAN_262_80_PATHS.plan83Review,
      V138_PLAN_262_80_PATHS.seal,
      V138_PLAN_262_80_PATHS.envelope,
      V138_PLAN_262_80_PATHS.terminal,
    ].every((repoPath) => {
      const bytes = readRegular(root, repoPath).toString("utf8")
      return bytes === canonical(JSON.parse(bytes))
    }),
    privateReceipts,
    privateDirMode: statSync(privateTarget).mode & 0o777,
    sourceText: {
      controller: readRegular(root, SOURCE_PATHS[1]).toString("utf8"),
      model: readRegular(root, SOURCE_PATHS[2]).toString("utf8"),
    },
    custody: inspectGitCustody(root, values),
    unsafeProjectionKeys: scanUnsafeKeys({ journal, terminal, reproduction }),
    destinations: {
      disposition: safeType(
        path.resolve(root, V138_PLAN_262_80_PATHS.disposition),
      ),
      activationRoot: safeType(
        path.resolve(root, V138_PLAN_262_80_PATHS.activationRoot),
      ),
    },
  }
}

type Replay = {
  reasonCodes: string[]
  disposition: "active" | "succeeded" | "terminal_failure" | "exhausted"
  terminalReason: "time_window_expired" | null
  journalRoot: Sha256
  stateRoot: Sha256
  counters: {
    preflightObservationsConsumed: number
    routeStartsConsumed: number
    calibrationIdentitiesCharged: number
    reproductionIdentitiesCharged: number
    acceptedCells: number
  }
  completeCleanup: boolean
}

const replayJournal = (envelope: any, records: any[]): Replay => {
  const reasons: string[] = []
  let previousRoot: string = GENESIS_ROOT
  let previousTime = -1
  let firstObservation: number | null = null
  let lastRefusal: number | null = null
  let lastFailure: number | null = null
  const preflightReservations = new Map<string, string>()
  const observations = new Map<string, number>()
  const routes = new Map<string, { owner: string; preflight: string }>()
  const calibrations = new Map<string, string[]>()
  const finishes = new Map<string, any>()
  let reproductionRoute: string | null = null
  let reproductionTerminal: any = null
  let expiryCount = 0
  let terminal = false
  let completeCleanup = true
  const invalid = (): void => {
    if (!reasons.includes("JOURNAL_CHAIN_INVALID"))
      reasons.push("JOURNAL_CHAIN_INVALID")
  }
  records.forEach((record, ordinal) => {
    if (terminal) invalid()
    const { recordRoot, ...body } = record ?? {}
    if (
      record?.schemaVersion !== "v1.38-bounded-retry-journal-record-v1" ||
      record.ordinal !== ordinal ||
      record.envelopeRoot !== envelope.envelopeRoot ||
      record.previousRoot !== previousRoot ||
      !Number.isSafeInteger(record.atMilliseconds) ||
      record.atMilliseconds < previousTime ||
      recordRoot !== sha256(`v138-retry-journal-record-v1\0${canonical(body)}`)
    )
      invalid()
    const ownerValid =
      typeof record?.owner === "string" &&
      record.owner.length > 0 &&
      record.owner.length <= 128
    if (!ownerValid) invalid()
    const now = record?.atMilliseconds
    if (
      record?.kind !== "time_window_expired" &&
      firstObservation !== null &&
      now >= firstObservation + 14_400_000
    )
      invalid()
    switch (record?.kind) {
      case "reserve_preflight": {
        const expected = `preflight:v1:${preflightReservations.size}`
        if (
          record.identity !== expected ||
          preflightReservations.has(record.identity)
        )
          invalid()
        if (lastRefusal !== null && now < lastRefusal + 300_000) invalid()
        if (lastFailure !== null && now < lastFailure + 900_000) invalid()
        preflightReservations.set(record.identity, record.owner)
        break
      }
      case "observe_preflight": {
        if (
          preflightReservations.get(record.identity) !== record.owner ||
          observations.has(record.identity) ||
          !Number.isSafeInteger(record.effectiveAvailableBasisPoints) ||
          record.effectiveAvailableBasisPoints < 0 ||
          record.effectiveAvailableBasisPoints > 10_000
        )
          invalid()
        observations.set(record.identity, record.effectiveAvailableBasisPoints)
        firstObservation ??= now
        if (record.effectiveAvailableBasisPoints < 2_500) lastRefusal = now
        break
      }
      case "reserve_route": {
        const expected = `route:v1:${routes.size}`
        if (
          record.identity !== expected ||
          routes.has(record.identity) ||
          preflightReservations.get(record.preflightIdentity) !==
            record.owner ||
          (observations.get(record.preflightIdentity) ?? -1) < 2_500 ||
          [...routes.values()].some(
            ({ preflight }) => preflight === record.preflightIdentity,
          )
        )
          invalid()
        routes.set(record.identity, {
          owner: record.owner,
          preflight: record.preflightIdentity,
        })
        break
      }
      case "reserve_calibration": {
        const routeOrdinal = Number(
          String(record.routeIdentity).split(":").at(-1),
        )
        const expected = Array.from(
          { length: 8 },
          (_, index) => `calibration:v1:${routeOrdinal}:${index}`,
        )
        if (
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          calibrations.has(record.routeIdentity) ||
          canonical(record.identities) !== canonical(expected)
        )
          invalid()
        calibrations.set(record.routeIdentity, [...(record.identities ?? [])])
        break
      }
      case "finish_calibration": {
        if (
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          !calibrations.has(record.routeIdentity) ||
          finishes.has(record.routeIdentity) ||
          !["admitted", "system_failure"].includes(record.status) ||
          typeof record.completeCleanup !== "boolean" ||
          !isSha(record.supervisionRoot)
        )
          invalid()
        finishes.set(record.routeIdentity, record)
        completeCleanup &&= record.completeCleanup === true
        if (!record.completeCleanup) terminal = true
        if (record.status === "system_failure" && record.completeCleanup)
          lastFailure = now
        if (
          routes.size === 3 &&
          finishes.size === 3 &&
          [...finishes.values()].every(
            (item) => item.status === "system_failure",
          )
        )
          terminal = true
        break
      }
      case "reserve_reproduction": {
        const expected = Array.from(
          { length: 540 },
          (_, index) => `reproduction:v1:${index}`,
        )
        if (
          reproductionRoute !== null ||
          finishes.get(record.routeIdentity)?.status !== "admitted" ||
          !finishes.get(record.routeIdentity)?.completeCleanup ||
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          canonical(record.identities) !== canonical(expected)
        )
          invalid()
        reproductionRoute = record.routeIdentity
        break
      }
      case "finish_reproduction": {
        if (
          reproductionRoute !== record.routeIdentity ||
          reproductionTerminal !== null ||
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          !["passed_exact", "system_failure"].includes(record.status) ||
          !Number.isSafeInteger(record.acceptedCells) ||
          record.acceptedCells < 0 ||
          record.acceptedCells > 540 ||
          !isSha(record.reproductionRoot) ||
          (record.status === "passed_exact" &&
            (record.acceptedCells !== 540 || !record.completeCleanup))
        )
          invalid()
        reproductionTerminal = record
        completeCleanup &&= record.completeCleanup === true
        terminal = true
        break
      }
      case "time_window_expired":
        expiryCount += 1
        if (
          record.reason !== "time_window_expired" ||
          expiryCount !== 1 ||
          firstObservation === null ||
          now < firstObservation + 14_400_000
        )
          invalid()
        terminal = true
        break
      default:
        invalid()
    }
    previousRoot = recordRoot
    previousTime = now
  })
  if (
    preflightReservations.size > 12 ||
    routes.size > 3 ||
    calibrations.size > 3
  )
    reasons.push("BOUNDED_COUNTS_INVALID")
  const calibrationCount = [...calibrations.values()].reduce(
    (sum, values) => sum + values.length,
    0,
  )
  let disposition: Replay["disposition"] = "active"
  if (expiryCount === 1) disposition = "exhausted"
  else if (reproductionTerminal !== null)
    disposition =
      reproductionTerminal.status === "passed_exact" &&
      reproductionTerminal.acceptedCells === 540 &&
      reproductionTerminal.completeCleanup
        ? "succeeded"
        : "terminal_failure"
  else if (!completeCleanup) disposition = "terminal_failure"
  else if (
    routes.size === 3 &&
    finishes.size === 3 &&
    [...finishes.values()].every((item) => item.status === "system_failure")
  )
    disposition = "exhausted"
  else if (
    preflightReservations.size === 12 &&
    observations.size === 12 &&
    [...observations.values()].every((value) => value < 2_500)
  )
    disposition = "exhausted"
  const stateBody = {
    schemaVersion: "v1.38-bounded-retry-derived-state-v1",
    journalRoot: records.at(-1)?.recordRoot ?? GENESIS_ROOT,
    preflightObservationsConsumed: preflightReservations.size,
    routeStartsConsumed: routes.size,
    calibrationIdentitiesCharged: calibrationCount,
    reproductionIdentitiesCharged: reproductionRoute === null ? 0 : 540,
    acceptedCells: disposition === "succeeded" ? 540 : 0,
    remainingPreflightObservations:
      disposition === "active" ? 12 - preflightReservations.size : 0,
    remainingRouteStarts: disposition === "active" ? 3 - routes.size : 0,
    nextPreflightIdentity:
      disposition === "active"
        ? `preflight:v1:${preflightReservations.size}`
        : null,
    nextRouteIdentity:
      disposition === "active" ? `route:v1:${routes.size}` : null,
    protectedHistoricalIdentityCount:
      envelope.protectedHistoricalIdentities?.length,
    firstObservationMilliseconds: firstObservation,
    terminalReason: expiryCount === 1 ? "time_window_expired" : null,
    disposition,
    downstreamAuthority: false,
  }
  return {
    reasonCodes: reasons,
    disposition,
    terminalReason: stateBody.terminalReason,
    journalRoot: stateBody.journalRoot,
    stateRoot: sha256(`v138-retry-derived-state-v1\0${canonical(stateBody)}`),
    counters: {
      preflightObservationsConsumed: stateBody.preflightObservationsConsumed,
      routeStartsConsumed: stateBody.routeStartsConsumed,
      calibrationIdentitiesCharged: stateBody.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged: stateBody.reproductionIdentitiesCharged,
      acceptedCells: stateBody.acceptedCells,
    },
    completeCleanup,
  }
}

const expectedTerminal = (replay: Replay): any => ({
  schemaVersion: "v1.38-current-matrix-retry-terminal-v1",
  terminalReason: replay.terminalReason,
  journalRoot: replay.journalRoot,
  stateRoot: replay.stateRoot,
  disposition: replay.disposition,
  counters: replay.counters,
  freshAccepted: replay.counters.acceptedCells,
  completeCleanup: replay.completeCleanup,
  downstreamAuthority: "denied",
  productionAuthorized: false,
})

const validateReproduction = (value: any): boolean =>
  value?.schemaVersion === "v1.38-current-matrix-reproduction-v15" &&
  value.status === "passed_exact" &&
  value.chargedAttemptCount === 540 &&
  value.acceptedCellCount === 540 &&
  value.completeCleanup === true &&
  value.runtimeRoute === "v1.18/v1.19/MATCH_KERNEL" &&
  value.samplingMilliseconds === 200 &&
  value.partialAcceptedEvidenceReusable === false &&
  isSha(value.executionRoot) &&
  value.receiptRoot ===
    rootWithout("v138-current-matrix-reproduction-v15", value, "receiptRoot") &&
  Object.values(value.privacyProjection ?? {}).every(
    (item) => item === false,
  ) &&
  [
    "phase263PlanningAuthorized",
    "candidateSearchAuthorized",
    "formationMaterializationAuthorized",
    "holdoutOpeningAuthorized",
    "publicAuthorized",
    "productAuthorized",
    "productionAuthorized",
  ].every((key) => value[key] === false)

const falseAuthority = (foundationActivationAuthorized = false) => ({
  foundationActivationAuthorized,
  phase263Authorized: false,
  candidateSearchAuthorized: false,
  formationMaterializationAuthorized: false,
  holdoutOpeningAuthorized: false,
  publicAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  countedPlayAuthorized: false,
  gameplayChangeAuthorized: false,
})

export const evaluateV138Plan26280Evidence = (evidence: any): any => {
  const reasons: string[] = []
  const add = (code: string): void => {
    if (!reasons.includes(code)) reasons.push(code)
  }
  const envelopeRoot = rootWithout(
    "v138-retry-envelope-v1",
    evidence.envelope,
    "envelopeRoot",
  )
  if (!evidence.canonicalEvidence) add("CANONICAL_EVIDENCE_INVALID")
  if (
    canonical(evidence.envelope.policy) !== canonical(EXPECTED_POLICY) ||
    evidence.envelope.schemaVersion !== "retry-envelope:v1" ||
    evidence.envelope.status !== "sealed_inactive" ||
    evidence.envelope.counters?.acceptedCells !== 0
  )
    add("FROZEN_POLICY_INVALID")
  if (evidence.envelope.envelopeRoot !== envelopeRoot)
    add("ENVELOPE_ROOT_INVALID")
  if (
    evidence.seal.sealRoot !==
      rootWithout(
        "v138-successor-source-seal-v11",
        evidence.seal,
        "sealRoot",
      ) ||
    evidence.seal.sourceRoot !== evidence.custody.sourceRoot ||
    evidence.seal.sourceRoot !== evidence.envelope.sourceRoot ||
    evidence.seal.reviewRoot !== evidence.envelope.reviewRoot ||
    evidence.seal.sealRoot !== evidence.envelope.sealRoot ||
    evidence.seal.protectedHistoryRoot !==
      evidence.envelope.protectedHistoryRoot
  )
    add("SEAL_ROOT_INVALID")
  const plan77Root = rootWithout(
    "v138-plan26277-review-v1",
    evidence.plan77Review,
    "reviewRoot",
  )
  if (
    plan77Root !== EXPECTED.plan77Root ||
    evidence.plan77Review.reviewRoot !== EXPECTED.plan77Root ||
    evidence.plan77Review.status !== "blocked" ||
    evidence.plan77Review.findingCount !== 1 ||
    evidence.plan77Review.findings?.[0]?.code !==
      "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED" ||
    evidence.custody.plan77JsonSha256 !== EXPECTED.plan77JsonSha ||
    evidence.custody.plan77ReportSha256 !== EXPECTED.plan77ReportSha ||
    evidence.custody.plan77SummarySha256 !== EXPECTED.plan77SummarySha
  )
    add("PLAN77_HISTORY_INVALID")
  const plan83Root = rootWithout(
    "v138-plan26283-rereview-v1",
    evidence.plan83Review,
    "reviewRoot",
  )
  if (
    plan83Root !== EXPECTED.plan83Root ||
    evidence.plan83Review.reviewRoot !== EXPECTED.plan83Root ||
    evidence.plan83Review.status !== "zero_findings" ||
    evidence.plan83Review.findingCount !== 0 ||
    evidence.plan83Review.sourceReviewPassed !== true ||
    evidence.plan83Review.reviewedSource?.commit !== EXPECTED.sourceCommit ||
    evidence.plan83Review.protectedHistory?.reviewRoot !== EXPECTED.plan77Root
  )
    add("PLAN83_REVIEW_INVALID")
  const binderRoot = rootWithout(
    "v138-route8-post-validation-binder",
    evidence.historyBinder,
    "binderRoot",
  )
  if (
    evidence.custody.plan74ArchiveSha256 !== EXPECTED.plan74ArchiveSha ||
    evidence.custody.plan74SummaryAbsent !== true ||
    evidence.historyBinder.binderRoot !== binderRoot ||
    evidence.historyBinder.binderRoot !== EXPECTED.protectedHistoryRoot ||
    evidence.historyBinder.admit03 !== "blocked" ||
    evidence.historyBinder.downstreamAuthorityDenied !== true
  )
    add("PROTECTED_HISTORY_INVALID")
  if (
    evidence.localSeal.schemaVersion !==
      "v1.38-local-seal-independent-verification-v3" ||
    evidence.localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    evidence.localSeal.satisfiesRevisedSeal01 !== true ||
    evidence.localSeal.findingCount !== 0 ||
    evidence.localSeal.independentCustodyClaimed !== false ||
    evidence.localSeal.verificationRoot !== EXPECTED.localSealRoot ||
    evidence.localSeal.verificationRoot !==
      evidence.seal.localSealVerificationRoot ||
    evidence.historyBinder.localSealSha256 !== evidence.localSealSha256
  )
    add("LOCAL_SEAL_INVALID")
  if (
    !evidence.custody.sourceCurrentMatchesSealedParent ||
    !evidence.custody.sourceUnrewritten ||
    !evidence.custody.sealDirectChild ||
    !evidence.custody.sealPairPathsExact ||
    !evidence.custody.livePathsExact ||
    !evidence.custody.evidenceUnrewritten ||
    !evidence.custody.commitsOnHead ||
    !evidence.custody.clean
  )
    add("GIT_CUSTODY_INVALID")
  const sourceTokens = [
    'rulesAuthority: "MATCH_KERNEL"',
    "samplingMilliseconds: 200",
    "minimumEffectiveAvailableBasisPoints: 2_500",
    "calibrationAttemptsPerRoute: 8",
    "calibrationShardCount: 4",
    "reproductionCellCount: 540",
  ]
  const controllerTokens = [
    "calibrateV138ParallelMatrix",
    "executeV138ParallelMatrix",
    "createV138SubprocessShardRunner",
    'runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"',
    "strategySourceIncluded: false",
    "strategyMemoryIncluded: false",
    "soldierMemoryIncluded: false",
    "objectivePayloadIncluded: false",
    "rawDiagnosticsIncluded: false",
  ]
  if (
    sourceTokens.some((token) => !evidence.sourceText.model.includes(token)) ||
    controllerTokens.some(
      (token) => !evidence.sourceText.controller.includes(token),
    )
  )
    add("RUNTIME_KERNEL_CONTRACT_INVALID")
  if (evidence.unsafeProjectionKeys.length > 0)
    add("PRIVACY_PROJECTION_INVALID")
  if (
    evidence.privateDirMode !== 0o700 ||
    evidence.privateReceipts.length !== evidence.journal.length ||
    evidence.privateReceipts.some(
      (receipt: any, ordinal: number) =>
        receipt.name !==
          `journal-record-${String(ordinal).padStart(4, "0")}.json` ||
        receipt.mode !== 0o600 ||
        receipt.bytes !== canonical(evidence.journal[ordinal]),
    )
  )
    add("PRIVATE_RECEIPT_INVALID")
  const replay = replayJournal(evidence.envelope, evidence.journal)
  replay.reasonCodes.forEach(add)
  if (canonical(evidence.terminal) !== canonical(expectedTerminal(replay))) {
    if (
      evidence.terminal.terminalReason === "time_window_expired" &&
      replay.terminalReason !== "time_window_expired"
    )
      add("EXPIRY_TERMINAL_INVALID")
    add("TERMINAL_COUNTERS_INVALID")
  }
  if (
    evidence.terminal.productionAuthorized !== false ||
    evidence.terminal.downstreamAuthority !== "denied"
  )
    add("AUTHORITY_ESCALATION")
  if (replay.disposition === "exhausted") add("ENVELOPE_EXHAUSTED")
  if (replay.counters.acceptedCells !== 540) add("FRESH_ACCEPTED_NOT_540")
  if (evidence.reproduction === null) {
    if (replay.counters.reproductionIdentitiesCharged !== 0)
      add("REPRODUCTION_EVIDENCE_INVALID")
    add("REPRODUCTION_EVIDENCE_ABSENT")
  } else if (!validateReproduction(evidence.reproduction))
    add("REPRODUCTION_EVIDENCE_INVALID")
  const integrityCodes = reasons.filter(
    (code) =>
      ![
        "ENVELOPE_EXHAUSTED",
        "FRESH_ACCEPTED_NOT_540",
        "REPRODUCTION_EVIDENCE_ABSENT",
      ].includes(code),
  )
  const pass =
    integrityCodes.length === 0 &&
    replay.disposition === "succeeded" &&
    replay.counters.acceptedCells === 540 &&
    replay.counters.reproductionIdentitiesCharged === 540 &&
    evidence.reproduction !== null &&
    validateReproduction(evidence.reproduction)
  const reasonCodes = pass ? [] : reasons.sort()
  const body = {
    schemaVersion: "v1.38-plan-262-80-admission-disposition-v1",
    status: pass ? "pass" : "non_pass",
    terminalDisposition: replay.disposition,
    reasonCodes,
    counters: {
      preflightObservationsConsumed:
        replay.counters.preflightObservationsConsumed,
      routeStartsConsumed: replay.counters.routeStartsConsumed,
      calibrationIdentitiesCharged:
        replay.counters.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged:
        replay.counters.reproductionIdentitiesCharged,
      freshAccepted: replay.counters.acceptedCells,
      requiredAccepted: 540,
    },
    evidence: {
      sourceRoot: evidence.seal.sourceRoot,
      sourceReviewRoot: evidence.plan83Review.reviewRoot,
      protectedPlan77ReviewRoot: evidence.plan77Review.reviewRoot,
      sealRoot: evidence.seal.sealRoot,
      envelopeRoot: evidence.envelope.envelopeRoot,
      protectedHistoryRoot: evidence.envelope.protectedHistoryRoot,
      localSealVerificationRoot: evidence.localSeal.verificationRoot,
      journalRoot: replay.journalRoot,
      journalSha256: evidence.journalSha256,
      stateRoot: replay.stateRoot,
      terminalRoot: sha256(
        `v138-plan26280-terminal-evidence-v1\0${canonical(evidence.terminal)}`,
      ),
      terminalSha256: evidence.terminalSha256,
      reproductionRoot: evidence.reproduction?.receiptRoot ?? null,
      plan74ArchiveSha256: evidence.custody.plan74ArchiveSha256,
    },
    frozenContract: EXPECTED_POLICY,
    integrityPassed: integrityCodes.length === 0,
    privacySafe: evidence.unsafeProjectionKeys.length === 0,
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    authority: falseAuthority(pass),
  }
  return Object.freeze({
    ...body,
    dispositionRoot: sha256(
      `v138-plan26280-admission-disposition-v1\0${canonical(body)}`,
    ),
  })
}

export const deriveV138Plan26280NoPublish = (root: string): any =>
  evaluateV138Plan26280Evidence(loadV138Plan26280Evidence(root))

export const computeV138Plan26280DispositionRoot = (candidate: any): Sha256 =>
  rootWithout(
    "v138-plan26280-admission-disposition-v1",
    candidate,
    "dispositionRoot",
  )

export const validateV138Plan26280Disposition = (
  candidate: any,
  expected: any,
): true => {
  if (
    candidate?.schemaVersion !== "v1.38-plan-262-80-admission-disposition-v1" ||
    candidate.dispositionRoot !==
      computeV138Plan26280DispositionRoot(candidate) ||
    canonical(candidate) !== canonical(expected) ||
    candidate.counters?.requiredAccepted !== 540 ||
    candidate.assuranceClass !== "single_operator_local_seal_v1" ||
    candidate.independentCustodyClaimed !== false ||
    candidate.authority?.phase263Authorized !== false ||
    candidate.authority?.candidateSearchAuthorized !== false ||
    candidate.authority?.formationMaterializationAuthorized !== false ||
    candidate.authority?.holdoutOpeningAuthorized !== false ||
    candidate.authority?.publicAuthorized !== false ||
    candidate.authority?.productAuthorized !== false ||
    candidate.authority?.productionAuthorized !== false ||
    candidate.authority?.countedPlayAuthorized !== false ||
    candidate.authority?.gameplayChangeAuthorized !== false ||
    candidate.authority?.foundationActivationAuthorized !==
      (candidate.status === "pass")
  )
    fail("V138_PLAN_262_80_DISPOSITION_INVALID")
  return true
}

export const computeV138Plan26280ActivationRoot = (disposition: any): any => {
  if (
    disposition.status !== "pass" ||
    disposition.terminalDisposition !== "succeeded" ||
    disposition.integrityPassed !== true ||
    disposition.privacySafe !== true ||
    disposition.reasonCodes?.length !== 0 ||
    disposition.counters?.freshAccepted !== 540 ||
    disposition.counters?.reproductionIdentitiesCharged !== 540 ||
    disposition.authority?.foundationActivationAuthorized !== true ||
    disposition.dispositionRoot !==
      computeV138Plan26280DispositionRoot(disposition)
  )
    fail("V138_PLAN_262_80_ACTIVATION_NOT_AUTHORIZED")
  const body = {
    schemaVersion: "v1.38-foundation-activation-root-route9-v1",
    routeOrdinal: 9,
    dispositionRoot: disposition.dispositionRoot,
    sourceRoot: disposition.evidence.sourceRoot,
    sourceReviewRoot: disposition.evidence.sourceReviewRoot,
    sealRoot: disposition.evidence.sealRoot,
    envelopeRoot: disposition.evidence.envelopeRoot,
    protectedHistoryRoot: disposition.evidence.protectedHistoryRoot,
    localSealVerificationRoot: disposition.evidence.localSealVerificationRoot,
    journalRoot: disposition.evidence.journalRoot,
    stateRoot: disposition.evidence.stateRoot,
    terminalRoot: disposition.evidence.terminalRoot,
    reproductionRoot: disposition.evidence.reproductionRoot,
    freshCharged: 540,
    freshAccepted: 540,
    requiredAccepted: 540,
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    phase263Authorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
    countedPlayAuthorized: false,
    gameplayChangeAuthorized: false,
  }
  return Object.freeze({
    ...body,
    activationRoot: sha256(
      `v138-foundation-activation-root-route9-v1\0${canonical(body)}`,
    ),
  })
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent")
    fail("V138_PLAN_262_80_DESTINATION_PRESENT")
  const fd = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(fd, bytes)
  } finally {
    closeSync(fd)
  }
}

export const publishV138Plan26280Disposition = (root: string): any => {
  const dispositionTarget = path.resolve(
    root,
    V138_PLAN_262_80_PATHS.disposition,
  )
  const activationTarget = path.resolve(
    root,
    V138_PLAN_262_80_PATHS.activationRoot,
  )
  if (safeType(activationTarget) !== "absent")
    fail("V138_PLAN_262_80_ACTIVATION_DESTINATION_PRESENT")
  const disposition = deriveV138Plan26280NoPublish(root)
  exclusiveWrite(dispositionTarget, canonical(disposition))
  if (disposition.status === "pass") {
    try {
      exclusiveWrite(
        activationTarget,
        canonical(computeV138Plan26280ActivationRoot(disposition)),
      )
    } catch (error) {
      unlinkSync(dispositionTarget)
      throw error
    }
  }
  return disposition
}

const checkPublicationLineage = (
  root: string,
  paths: string[],
): string | null => {
  if (git(root, ["status", "--porcelain", "--", ...paths]) !== "") return null
  const commits = lines(
    git(root, ["log", "--format=%H", "--all", "--", ...paths]),
  )
  if (commits.length !== 1) fail("V138_PLAN_262_80_PUBLICATION_LINEAGE_INVALID")
  const changed = lines(
    git(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commits[0]!,
    ]),
  ).sort()
  if (canonical(changed) !== canonical(paths.sort()))
    fail("V138_PLAN_262_80_PUBLICATION_LINEAGE_INVALID")
  for (const repoPath of paths) {
    if (
      !execFileSync("git", ["show", `${commits[0]}:${repoPath}`], {
        cwd: root,
      }).equals(readRegular(root, repoPath)) ||
      lines(
        git(root, [
          "log",
          "--format=%H",
          `${commits[0]}..HEAD`,
          "--",
          repoPath,
        ]),
      ).length !== 0
    )
      fail("V138_PLAN_262_80_PUBLICATION_REWRITE_INVALID")
  }
  return commits[0]!
}

export const checkV138Plan26280Disposition = (
  root: string,
  dispositionPath: string,
  activationPath: string,
): any => {
  if (
    dispositionPath !== V138_PLAN_262_80_PATHS.disposition ||
    activationPath !== V138_PLAN_262_80_PATHS.activationRoot
  )
    fail("V138_PLAN_262_80_PATH_INVALID")
  const candidate = readJson(root, dispositionPath)
  const expected = deriveV138Plan26280NoPublish(root)
  validateV138Plan26280Disposition(candidate, expected)
  const activationType = safeType(path.resolve(root, activationPath))
  const publicationPaths = [dispositionPath]
  if (candidate.status === "pass") {
    if (activationType !== "regular")
      fail("V138_PLAN_262_80_ACTIVATION_MISSING")
    const activation = readJson(root, activationPath)
    if (
      canonical(activation) !==
      canonical(computeV138Plan26280ActivationRoot(candidate))
    )
      fail("V138_PLAN_262_80_ACTIVATION_INVALID")
    publicationPaths.push(activationPath)
  } else if (activationType !== "absent") {
    fail("V138_PLAN_262_80_NONPASS_ACTIVATION_PRESENT")
  }
  return {
    disposition: candidate,
    publicationCommit: checkPublicationLineage(root, publicationPaths),
  }
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-no-publish"])) {
    const disposition = deriveV138Plan26280NoPublish(repoRoot)
    process.stdout.write(
      canonical({
        status: disposition.status,
        terminalDisposition: disposition.terminalDisposition,
        reasonCodes: disposition.reasonCodes,
        freshAccepted: disposition.counters.freshAccepted,
        requiredAccepted: disposition.counters.requiredAccepted,
        dispositionRoot: disposition.dispositionRoot,
        activationCreated: false,
        downstreamAuthority: false,
      }),
    )
    return
  }
  if (canonical(argv) === canonical(["--write-disposition"])) {
    const disposition = publishV138Plan26280Disposition(repoRoot)
    process.stdout.write(
      canonical({
        status: disposition.status,
        terminalDisposition: disposition.terminalDisposition,
        dispositionRoot: disposition.dispositionRoot,
        activationCreated: disposition.status === "pass",
        downstreamAuthority: false,
      }),
    )
    return
  }
  if (
    canonical(argv) ===
    canonical([
      "--check-disposition",
      "--disposition",
      V138_PLAN_262_80_PATHS.disposition,
      "--activation-root",
      V138_PLAN_262_80_PATHS.activationRoot,
    ])
  ) {
    const checked = checkV138Plan26280Disposition(repoRoot, argv[2]!, argv[4]!)
    process.stdout.write(
      canonical({
        status: "verified",
        branch: checked.disposition.status,
        terminalDisposition: checked.disposition.terminalDisposition,
        dispositionRoot: checked.disposition.dispositionRoot,
        activationPresent: checked.disposition.status === "pass",
        publicationCommit: checked.publicationCommit,
        downstreamAuthority: false,
      }),
    )
    return
  }
  fail("V138_PLAN_262_80_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  }
}
