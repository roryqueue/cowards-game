import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { assertV138AbsentNoFollow, authenticateV138ManifestNoFollow, readV138RegularNoFollow, sha256V138Secure, trustedRootV138 } from "./lib/v1-38-secure-workspace-path-v2.js"

type Sha = `sha256:${string}`
type Entry = Readonly<{ path: string; sha256: Sha }>
const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize) : item !== null && typeof item === "object" ? Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)])) : item
  return `${JSON.stringify(normalize(value))}\n`
}
const freeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value) }
  return value
}
const exactKeys = (value: unknown, expected: readonly string[], code: string): void => {
  if (value === null || typeof value !== "object" || canonical(Object.keys(value as object).sort()) !== canonical([...expected].sort())) fail(code)
}
const json = (root: string, repoPath: string): any => JSON.parse(readV138RegularNoFollow(root, repoPath).toString("utf8"))

export const V138_PHASE_262_CORRECTION_V5_PATH = ".planning/artifacts/v1.38-phase-262-review-fix-correction-v5.json"
export const V138_PHASE_262_TRIGGER_REVIEW_V5 = freeze({
  commit: "24d6e90294893e0a66c28237501c2d9a2513acf7",
  blob: "f6c4c110ef0b0bf1114eadb6785a3dcd33136bf5",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:a42c853d0f7f6bb1b789c1901503224d187366ce58576f9224060f65f65cd5d8" as Sha,
})

const PRIOR = freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json", sha256: "sha256:e48e1db20dd15110d1dfe7837a192003a77112eae6a6d65f6aa9c3c9e34f9bc6" as Sha, root: "sha256:2a7e25a324ee1e28e4f7da543634afd29dca87dac12e860fea3c0e6b01650029" as Sha },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v2.json", sha256: "sha256:3765367b73c9fe0a0dcc119ee2db59591c1efc8f4f763bf5ebfc5925ca33cb85" as Sha, root: "sha256:468054b638d95bc39f0a2f0459f9514a295cfd318748d18d78c039a2f239f526" as Sha },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v3.json", sha256: "sha256:6a585d62405388947ba65b0036fd5bef716bbfe7320390367af5eee86d9390f1" as Sha, root: "sha256:f13ccf99c2b5c27b25f298d500b5409d7f6cc590fdacda1998cffd34b2bbd55a" as Sha },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v4.json", sha256: "sha256:9f2fc7b1b3008e877ba7b39a05ac4c90a0cdd86afc57ad18a93fda1b7157f36c" as Sha, root: "sha256:279c37b8acd63c432921242d07276b33f1b8265b1a96cd610284f0785379b3b3" as Sha },
])

export const V138_PHASE_262_CORRECTION_V5_EVIDENCE = freeze({
  admission: [
    { path: ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", sha256: "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452" },
    { path: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json", sha256: "sha256:88a99098d3484c8a78526b27f49ad2c2db3f8d36c6e21256482a8f703bb075ea" },
    { path: ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl", sha256: "sha256:ac7f8eb0b0193b469b31c28c33838bb46f36d6061d6e8577f05ccf71f9283546" },
  ] as readonly Entry[],
  review: [
    { path: ".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json", sha256: "sha256:e9069ac45db512d89929d8fd82828180914e20b9feb5ea6f05358ada083d68ec" },
    { path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-85-REVIEW.md", sha256: "sha256:d304fcc6c1cf879a4cefc16c96d157f608f251ab05e597bb29bbbee0d0477cd6" },
    { path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-85-SUMMARY.md", sha256: "sha256:03b89eaa4715ff98b10a4d071510a43c65a9c6bd774e69aa80462397069e5a7a" },
  ] as readonly Entry[],
  source: [
    { path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-84-SUMMARY.md", sha256: "sha256:bf97ccb1aa2175019f5464a116aecbe820db9b9a9d825e9d439ab2ce891a53e9" },
    { path: "scripts/run-v1-38-bounded-retry-envelope-v2.ts", sha256: "sha256:984e9f8750f54bb0003d6746ca69f19b6acc53a187648ddb6a944c6e8bb65793" },
    { path: "scripts/lib/v1-38-bounded-retry-envelope-v2.ts", sha256: "sha256:b153926bd32e7c8fb096385dd60f5987322940ae4ecab9a25da79de5702650d3" },
    { path: "scripts/run-v1-38-bounded-retry-envelope-v2.test.ts", sha256: "sha256:bd88d0ae4a234922a41613f0c346f4772a421705b929caf1d5cad629ca00a222" },
  ] as readonly Entry[],
  remediation: [
    { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts", sha256: "sha256:9734b541a89512aa15cde738795486825137c142f1e48ff79666c3cf616d463a" },
    { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts", sha256: "sha256:299abc430ffa698e758f394683eabdb5c31b648b96b62155ea8ef5dd2b540ad6" },
    { path: "scripts/native/v1-38-successor-transaction-helper-v2.c", sha256: "sha256:77723e9e45876c79dd471e210a1771958259bec0b459a23d6a06c93abe5f74e1" },
    { path: "scripts/lib/v1-38-secure-workspace-path-v2.ts", sha256: "sha256:64c02fa2f7b1561b86d59c5b13b2e9cbddb9cd8f85361a9725c3655a64e4504f" },
    { path: "scripts/lib/v1-38-secure-workspace-path-v2.test.ts", sha256: "sha256:22dac4f95d299b9ffa80463a745922ad3390d80fdea52c79d086add14327f09e" },
    { path: "scripts/native/v1-38-secure-manifest-reader-v3.c", sha256: "sha256:69c352fac98695ae2e7ea36dd670e8c31f58a9753e577e7af49c3daa2d517706" },
  ] as readonly Entry[],
})

const AUTHORITY_KEYS = freeze(["archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized", "formationMaterializationAuthorized", "foundationActivationAuthorized", "gameplayChangeAuthorized", "holdoutOpeningAuthorized", "phase263ExecutionAuthorized", "phase263PlanningAuthorized", "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized"])
const validateDisposition = (value: any): void => {
  exactKeys(value, ["assuranceClass", "assuranceDefects", "assuranceStatus", "authority", "correctionRequired", "correctionRoot", "counters", "dispositionRoot", "evidence", "frozenContract", "independentCustodyClaimed", "integrityPassed", "privacySafe", "reasonCodes", "schemaVersion", "status", "terminalDisposition"], "V138_CORRECTION_V5_DISPOSITION_SCHEMA_INVALID")
  exactKeys(value.authority, AUTHORITY_KEYS, "V138_CORRECTION_V5_AUTHORITY_SCHEMA_INVALID")
  if (AUTHORITY_KEYS.some((key) => value.authority[key] !== false)) fail("V138_CORRECTION_V5_AUTHORITY_TRUE")
  exactKeys(value.counters, ["calibrationIdentitiesCharged", "freshAccepted", "preflightObservationsConsumed", "reproductionIdentitiesCharged", "requiredAccepted", "routeStartsConsumed"], "V138_CORRECTION_V5_COUNTER_SCHEMA_INVALID")
  if (value.schemaVersion !== "v1.38-plan-262-88-admission-disposition-v2" || value.status !== "non_pass" || value.terminalDisposition !== "exhausted" || value.counters.freshAccepted !== 0 || value.counters.requiredAccepted !== 540 || value.integrityPassed !== true || value.correctionRequired !== false || value.correctionRoot !== null || value.independentCustodyClaimed !== false) fail("V138_CORRECTION_V5_DISPOSITION_INVALID")
  if (!Array.isArray(value.assuranceDefects) || value.assuranceDefects.length !== 0 || value.evidence.journalSha256 !== V138_PHASE_262_CORRECTION_V5_EVIDENCE.admission[2]!.sha256 || value.evidence.terminalSha256 !== V138_PHASE_262_CORRECTION_V5_EVIDENCE.admission[1]!.sha256) fail("V138_CORRECTION_V5_EVIDENCE_JOIN_INVALID")
}

const validateHistoricalManifestAtCommit = (root: string, correction: any, commit: string): void => {
  for (const entry of correction.remediation.sourceFiles as Entry[]) {
    const bytes = execFileSync("git", ["show", `${commit}:${entry.path}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
    if (sha256V138Secure(bytes) !== entry.sha256) fail("V138_CORRECTION_V5_HISTORICAL_SOURCE_MISMATCH")
  }
}

type Options = Readonly<{ triggeringReviewBytes?: Buffer; historicalGitRoot?: string }>
export const deriveV138Phase262ReviewFixCorrectionV5 = (rootInput: string, options: Options = {}): any => {
  const root = trustedRootV138(rootInput)
  authenticateV138ManifestNoFollow(root, PRIOR.map(({ path, sha256 }) => ({ path, sha256 })))
  for (const entries of Object.values(V138_PHASE_262_CORRECTION_V5_EVIDENCE)) authenticateV138ManifestNoFollow(root, entries)
  const prior = PRIOR.map(({ path }) => freeze(json(root, path))) as any[]
  prior.forEach((candidate, index) => { if (candidate.correctionRoot !== PRIOR[index]!.root) fail("V138_CORRECTION_V5_PRIOR_ROOT_MISMATCH") })
  const v1Protected = freeze(prior[0].protectedFiles as Entry[]), v1Remediation = freeze(prior[0].remediation.files as Entry[])
  authenticateV138ManifestNoFollow(root, v1Protected); authenticateV138ManifestNoFollow(root, v1Remediation)
  const gitRoot = options.historicalGitRoot ?? root
  validateHistoricalManifestAtCommit(gitRoot, prior[1], "8ae8cba0dfee4c04ed951a478187aed982c445e5")
  validateHistoricalManifestAtCommit(gitRoot, prior[2], "7b56ecdcf6f88a63f79c9e7c46a6c290bb6dabe4")
  const forbidden = freeze(prior[2].forbiddenDestinations as ReadonlyArray<{ path: string; denial: string }>)
  forbidden.forEach(({ path }) => assertV138AbsentNoFollow(root, path))
  const trigger = options.triggeringReviewBytes ?? execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW_V5.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V5.path}`], { cwd: gitRoot })
  if (sha256V138Secure(trigger) !== V138_PHASE_262_TRIGGER_REVIEW_V5.sha256) fail("V138_CORRECTION_V5_TRIGGER_REVIEW_MISMATCH")
  if (options.triggeringReviewBytes === undefined) {
    const blob = execFileSync("git", ["rev-parse", `${V138_PHASE_262_TRIGGER_REVIEW_V5.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V5.path}`], { cwd: gitRoot, encoding: "utf8" }).trim()
    if (blob !== V138_PHASE_262_TRIGGER_REVIEW_V5.blob) fail("V138_CORRECTION_V5_TRIGGER_BLOB_MISMATCH")
  }
  const disposition = json(root, V138_PHASE_262_CORRECTION_V5_EVIDENCE.admission[0]!.path); validateDisposition(disposition)
  const body = freeze({
    schemaVersion: "v1.38-phase-262-review-fix-correction-v5",
    status: "integrity_non_pass",
    supersedesForFutureAuthority: PRIOR[3]!.path,
    priorCorrections: PRIOR,
    triggeringReview: { ...V138_PHASE_262_TRIGGER_REVIEW_V5, immutableCommitQualifiedBlob: true },
    terminalRereview: null,
    reauthenticated: { evidence: V138_PHASE_262_CORRECTION_V5_EVIDENCE, v1Protected, v1Remediation, immutableGitSuccessors: [{ commit: "8ae8cba0dfee4c04ed951a478187aed982c445e5", entries: prior[1].remediation.sourceFiles }, { commit: "7b56ecdcf6f88a63f79c9e7c46a6c290bb6dabe4", entries: prior[2].remediation.sourceFiles }] },
    empiricalOutcome: { terminalDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false, outcomeReinterpreted: false },
    remediation: { sourceOnly: true, liveAuthority: false, independentZeroFindingReviewRequired: true, noLiveExecutionPerformed: true },
    forbiddenDestinations: forbidden,
    authority: Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false])),
  })
  return freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v5\0${canonical(body)}`) })
}

export const checkV138Phase262ReviewFixCorrectionV5 = (rootInput: string, options: Options = {}): true => {
  const root = trustedRootV138(rootInput), bytes = readV138RegularNoFollow(root, V138_PHASE_262_CORRECTION_V5_PATH).toString("utf8"), candidate = JSON.parse(bytes)
  const expected = deriveV138Phase262ReviewFixCorrectionV5(root, options)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V5_MISMATCH")
  return true
}

export const diagnoseV138Phase262MutableAggregateReview = (rootInput: string) => freeze({ path: V138_PHASE_262_TRIGGER_REVIEW_V5.path, observedSha256: sha256V138Secure(readV138RegularNoFollow(trustedRootV138(rootInput), V138_PHASE_262_TRIGGER_REVIEW_V5.path)), authoritative: false })

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV5(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV5(process.cwd()); process.stdout.write("review_fix_correction_v5_valid=true\n") }
  else if (process.argv[2] === "--diagnose-aggregate") process.stdout.write(canonical(diagnoseV138Phase262MutableAggregateReview(process.cwd())))
  else fail("V138_CORRECTION_V5_COMMAND_INVALID")
}
