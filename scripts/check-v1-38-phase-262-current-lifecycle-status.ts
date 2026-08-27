#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`

export const V138_PHASE_262_CURRENT_STATUS_PATH =
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json"

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const CANONICAL_JOURNAL_ROOT =
  "sha256:1cd8fd41f97a7c4938cb53719e31b49cc937fbfdcdcd26a51688e6894d09d8ad"
const MALFORMED_COPIED_JOURNAL_ROOT =
  "sha256:1cd8fd41f97a7c4938cb53719e31b49cc937fbfdcd26a51688e6894d09d8ad"
const PLAN_79_SUMMARY_SHA256 =
  "sha256:d294fa53a36475fbf8d9807044ed9ff55c525bd62a826d238eccb5229bb9a45d"
const CORRECTION_V1_SHA256 =
  "sha256:8d65fb481da4ac3d89296d479a4681f4be420c9c40935135f6ae1859e1b6edee"
const CORRECTION_V2_SHA256 =
  "sha256:94597b4c65d31ea5322cb90262d8e180406f8bfcd1d7f46d3c260f71ccfa2bec"

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
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const json = (root: string, repoPath: string): any =>
  JSON.parse(readFileSync(path.join(root, repoPath), "utf8"))

export const computeV138Phase262CurrentStatusRoot = (
  candidate: any,
): Sha256 => {
  const body = JSON.parse(JSON.stringify(candidate))
  delete body.statusRoot
  return sha256(`v138-phase262-current-lifecycle-status-v1\0${canonical(body)}`)
}

export const deriveV138Phase262CurrentStatus = (root: string): any => {
  const phaseDir = path.join(root, PHASE_DIR)
  const names = readFileSync(path.join(root, ".planning/ROADMAP.md"), "utf8")
  const entries = new Set(
    Array.from(names.matchAll(/262-(\d+)-(?:PLAN|SUMMARY)\.md/gu), (match) =>
      Number(match[1]),
    ),
  )
  // Discovery is filesystem-derived below; this parse is only a malformed-doc guard.
  if (!entries.has(80) || !entries.has(81))
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_ROADMAP_MISSING")

  const files = readFileSync(path.join(root, ".planning/STATE.md"), "utf8")
  if (!files.includes("phase-262"))
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_STATE_MISSING")

  const directoryEntries = readdirSync(phaseDir)
  const planIds = directoryEntries
    .map((name) => /^262-(\d+)-PLAN\.md$/u.exec(name))
    .filter(Boolean)
    .map((match) => Number(match![1]))
    .sort((left, right) => left - right)
  const summaryIds = directoryEntries
    .map((name) => /^262-(\d+)-SUMMARY\.md$/u.exec(name))
    .filter(Boolean)
    .map((match) => Number(match![1]))
    .sort((left, right) => left - right)
  if (planIds.length !== 64 || summaryIds.length !== 64)
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_TOPOLOGY_INVALID")
  if (![80, 81].every((id) => planIds.includes(id) && summaryIds.includes(id)))
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_CLOSEOUT_MISSING")

  const terminal = json(
    root,
    ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  )
  const disposition = json(
    root,
    ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
  )
  const readiness = json(
    root,
    ".planning/artifacts/v1.38-plan-262-81-lifecycle-driver-readiness-v1.json",
  )
  const correctionV2 = json(
    root,
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v2.json",
  )
  const journalLines = readFileSync(
    path.join(
      root,
      ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
    ),
    "utf8",
  )
    .trim()
    .split("\n")
  const journalRoot = JSON.parse(journalLines.at(-1)!).recordRoot
  if (
    terminal.disposition !== "exhausted" ||
    terminal.counters?.routeStartsConsumed !== 3 ||
    terminal.counters?.calibrationIdentitiesCharged !== 24 ||
    terminal.freshAccepted !== 0 ||
    disposition.status !== "non_pass" ||
    disposition.counters?.requiredAccepted !== 540 ||
    readiness.verificationStatus !== "gaps_found" ||
    readiness.lifecycleMutationPerformed !== false ||
    correctionV2.effectiveAssurance?.integrityPassed !== false ||
    correctionV2.effectiveAssurance?.status !== "integrity_non_pass" ||
    journalRoot !== CANONICAL_JOURNAL_ROOT ||
    terminal.journalRoot !== CANONICAL_JOURNAL_ROOT
  )
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_EVIDENCE_INVALID")

  const plan79SummaryPath = `${PHASE_DIR}/262-79-SUMMARY.md`
  const correctionV1Path =
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v1.json"
  const correctionV2Path =
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v2.json"
  if (
    sha256(readFileSync(path.join(root, plan79SummaryPath))) !==
      PLAN_79_SUMMARY_SHA256 ||
    sha256(readFileSync(path.join(root, correctionV1Path))) !==
      CORRECTION_V1_SHA256 ||
    sha256(readFileSync(path.join(root, correctionV2Path))) !==
      CORRECTION_V2_SHA256
  )
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_HISTORY_MUTATED")

  const body = {
    schemaVersion: "v1.38-phase-262-current-lifecycle-status-v1",
    lifecycle: {
      activePlans: 64,
      summaries: 64,
      completedPlans: [80, 81],
      plan81VerificationStatus: "gaps_found",
      lifecycleMutationPerformed: false,
      phase262Status: "incomplete",
    },
    retryOutcome: {
      terminalDisposition: "exhausted",
      routeStartsConsumed: 3,
      calibrationIdentitiesCharged: 24,
      freshAccepted: 0,
      requiredAccepted: 540,
      reproductionV15Present: false,
      canonicalJournalRoot: CANONICAL_JOURNAL_ROOT,
      stateRoot: terminal.stateRoot,
    },
    effectiveIntegrity: {
      status: "integrity_non_pass",
      passed: false,
      correctionPath: correctionV2Path,
      correctionRoot: correctionV2.correctionRoot,
    },
    documentationCorrection: {
      auditFindingLabel: "Plan-79 summary journal root",
      resolution:
        "The immutable Plan-79 summary and canonical evidence carry the 64-hex journal root; the malformed 62-hex value is confined to copied ROADMAP/STATE historical closeout carriers.",
      plan79SummaryPath,
      plan79SummarySha256: PLAN_79_SUMMARY_SHA256,
      plan79SummaryPreserved: true,
      malformedCopiedCarrierRoot: MALFORMED_COPIED_JOURNAL_ROOT,
      canonicalJournalRoot: CANONICAL_JOURNAL_ROOT,
      correctionV1Sha256: CORRECTION_V1_SHA256,
      correctionV2Sha256: CORRECTION_V2_SHA256,
    },
    absent: {
      reproductionV15: true,
      route9Activation: true,
    },
    authority: {
      phase263Through270Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productionAuthorized: false,
      gameplayChangeAuthorized: false,
    },
  }
  if (
    existsSync(
      path.join(
        root,
        ".planning/artifacts/v1.38-current-matrix-reproduction-v15.json",
      ),
    ) ||
    existsSync(
      path.join(
        root,
        ".planning/artifacts/v1.38-foundation-activation-root-route9.json",
      ),
    )
  )
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_ABSENCE_INVALID")
  return Object.freeze({
    ...body,
    statusRoot: computeV138Phase262CurrentStatusRoot(body),
  })
}

export const checkV138Phase262CurrentStatus = (root: string): any => {
  const expected = deriveV138Phase262CurrentStatus(root)
  const artifact = json(root, V138_PHASE_262_CURRENT_STATUS_PATH)
  if (
    canonical(artifact) !== canonical(expected) ||
    artifact.statusRoot !== computeV138Phase262CurrentStatusRoot(artifact)
  )
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_INVALID")
  for (const repoPath of [
    ".planning/PROJECT.md",
    ".planning/ROADMAP.md",
    ".planning/STATE.md",
    ".planning/REQUIREMENTS.md",
  ]) {
    const text = readFileSync(path.join(root, repoPath), "utf8")
    if (!text.includes(V138_PHASE_262_CURRENT_STATUS_PATH))
      throw new TypeError("V138_PHASE_262_CURRENT_STATUS_DOC_JOIN_MISSING")
  }
  return artifact
}

const main = (): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (process.argv[2] !== "--check")
    throw new TypeError("V138_PHASE_262_CURRENT_STATUS_ARGUMENT_INVALID")
  const artifact = checkV138Phase262CurrentStatus(root)
  process.stdout.write(
    `${JSON.stringify({ status: "gaps_found", statusRoot: artifact.statusRoot })}\n`,
  )
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
)
  main()
