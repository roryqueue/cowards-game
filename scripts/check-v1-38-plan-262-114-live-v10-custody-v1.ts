import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  deriveV138Plan114IndependentCustody,
  type V138Plan114IndependentCustody,
} from "./lib/v1-38-plan-262-114-independent-custody-v2.js"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
export type V138Plan114Finding = Readonly<{
  code: string
  severity: "critical" | "warning"
  detail: string
}>
export type V138Plan114ModeResult = Readonly<{
  modeNames: readonly string[]
  actualModesPassed: number
  producerCalls: 0
  readinessInvoked: false
  liveInvoked: false
  freshCharged: 0
  freshAccepted: 0
  observations: readonly Readonly<{ mode: string; status: string; root: Sha }>[]
  findings: readonly V138Plan114Finding[]
  observationRoot: Sha
  sourceTree: string
  sourceParent: string
  checkoutManifestRoot: Sha
  recursiveDependencyRoot: Sha
  recursiveDependencyCount: number
  installedClosureRoot: Sha
  pathStableNativeSourcesRoot: Sha
  reviewedClosureRoot: Sha
  linkedLocalExecutionClosureRoot: Sha
  expandedProtectedHistoryRoot: Sha
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const PLAN_114_REVIEWED_SOURCE_COMMIT =
  "ba1f8ddb4d701762d5d443f41edcbb691bb0eda5"
const SOURCE_TREE = "0a35c771e145b9feee43d696dbb1b6ae10c42b9c"
const SOURCE_PARENT = "e0215b7738ab44bdd4a8f536cc53ee71008989f9"
const PLAN_113_EVIDENCE_COMMIT = "675effe681fb1ba4d16ba399104c45df98230d12"
const PLAN_113_FINAL_REVIEW_COMMIT = "28488fd43585f9f6fbfcd80dff2a388e4f754817"
const CORRECTED_PUBLICATION_COMMIT = "2639ff3b42e2a238919a3104c9fa8c785c69b93d"
const PLAN_111_SOURCE_COMMIT = "a301a06df0e4a3c038cf630f3485f8fb3a879c42"
const PLAN_112_V1_PUBLICATION_COMMIT = "29d4cf5c942d63fd767f658ec2506a5764ff19fa"
const PLAN_112_V2_PUBLICATION_COMMIT = "5b5ec60154bb82a3cfa3b25a03f8a2379010c829"
const PLAN_93_STOP_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT = "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const PLAN_93_STOP_SHA256 = "sha256:ef19330651725dfcaf5a1de35435a27d4f270f54428b5f57e063ee58f041f1a3"
const CORRECTED_ROOTS = Object.freeze({
  payload: "sha256:1e012ddcac45a9b201c8d12c58b14ac532302c87516f17aafa220a5899f3afc2",
  review: "sha256:d5678937bd87eb53c6df418a5c26fe2be4c3ae95f96d131fe9b086ae7c9316db",
  carrier: "sha256:1588f5abd35b8c21f33fefe3d492d44c52f69421ada43e63229df2115d1848e5",
})
const PLAN_112_V1_ROOTS = Object.freeze({
  payload: "sha256:abf5255241780c0774991fb3fbb282806475deb80c9d59d35f6669fa61fb3292",
  review: "sha256:7b2cc0f32be4d50ca0b5a7207f08a1c7d6bea9646731d84e07434d082d82b63c",
  carrier: "sha256:21af5983c3e64c01cfb62f6cf2e3404b6d3783914441bdd4c2f51bb490e9111e",
})
const PLAN_112_V2_ROOTS = Object.freeze({
  payload: "sha256:558d329e537dc4673dcaf216ce68faf651dfbbf1ce19536d54cacc3d76b9e194",
  review: "sha256:8aca84cbb80b000dd5cdeb1735367dd7cc51eb858a0ce2960c4ac33e849dc0e9",
  carrier: "sha256:06417e5f8b44a28e88bd20e746fa2319235250d687190ab1fa7a49f485d3a355",
})
const PLAN_112_V2_FINDINGS = Object.freeze([
  "MODE_POST_NO_EFFECT_FAILED",
  "MODE_PROSPECTIVE_CUSTODY_FAILED",
  "MODE_SOURCE_ONLY_FAILED",
])
const ZERO_COUNTERS = Object.freeze({
  acceptedCells: 0,
  calibrationIdentitiesCharged: 0,
  preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0,
  routeStartsConsumed: 0,
})
const SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
] as const)
const PATHS = Object.freeze({
  live: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  payload: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json",
  review: `${PHASE}/262-114-REVIEW.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json",
  supplement1: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplement2: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
  supplement3: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  plan93: `${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
  correctedPayload: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json",
  correctedReview: `${PHASE}/262-108-REVIEW-FIX.md`,
  correctedCarrier: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v2.json",
  v1Payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v1.json",
  v1Review: `${PHASE}/262-112-REVIEW.md`,
  v1Carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v1.json",
  v2Payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v2.json",
  v2Review: `${PHASE}/262-112-REVIEW-FIX.md`,
  v2Carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v2.json",
})
const PRODUCER_OUTPUTS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
])
const DOWNSTREAM_OUTPUTS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
])
const FORBIDDEN = Object.freeze([
  PATHS.supplement1, PATHS.supplement2, PATHS.supplement3,
  ...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS,
])
const PROTECTED_BRANCHES = Object.freeze([
  { plan: 90, lineageCommit: "32f53bb743db799810dff820b8b7eb309b6a6629", paths: [`${PHASE}/262-90-SUMMARY.md`, "scripts/lib/v1-38-bounded-retry-envelope-v3.ts", "scripts/run-v1-38-bounded-retry-envelope-v3.ts", "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts"] },
  { plan: 91, lineageCommit: "d64f048c12440978f449a5e2e655c33f55adc4ce", paths: [`${PHASE}/262-91-SUMMARY.md`, `${PHASE}/262-91-REVIEW.md`, ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json", "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.ts", "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.test.ts"] },
  { plan: 96, lineageCommit: "82ed28eee2377fd31680a20fdf0a6c6ebba9c1a8", paths: [`${PHASE}/262-96-SUMMARY.md`, "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts", "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c"] },
  { plan: 97, lineageCommit: "24d759a9c95499d56d483ff23c1e9bfbe0356f30", paths: [`${PHASE}/262-97-SUMMARY.md`, `${PHASE}/262-97-REVIEW.md`, ".planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json", "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.ts", "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.test.ts"] },
  { plan: 98, lineageCommit: "c3ed45c7a4ec54f456ae21d04095ab898df870db", paths: [`${PHASE}/262-98-SUMMARY.md`] },
  { plan: 99, lineageCommit: "497ba238e789d6f32252bde291ced9438b05a190", paths: [`${PHASE}/262-99-SUMMARY.md`, `${PHASE}/262-99-REVIEW.md`, ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json", "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.ts", "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.test.ts"] },
  { plan: 100, lineageCommit: "1e071bdb087e7360ee27e6558f6e717180d4d4a9", paths: [`${PHASE}/262-100-SUMMARY.md`] },
  { plan: 101, lineageCommit: "72e62d480a38f7c853a9010fd2918a0396118e07", paths: [`${PHASE}/262-101-SUMMARY.md`, `${PHASE}/262-101-REVIEW.md`, ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json", "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts", "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts"] },
  { plan: 102, lineageCommit: "66fa1358daf8005fab4b1b90b2831ccb60d1ca3e", paths: [`${PHASE}/262-102-SUMMARY.md`, "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts", "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts", "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts"] },
  { plan: 103, lineageCommit: "658e3149a25a2af8f0511f5845936f23fe574fc5", paths: [`${PHASE}/262-103-SUMMARY.md`, `${PHASE}/262-103-REVIEW.md`, ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json", ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json", "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.ts", "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.test.ts"] },
  { plan: 104, lineageCommit: "126a72e52d6c83e15cacf31a5ef46753c0fcce37", paths: [`${PHASE}/262-104-SUMMARY.md`, "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts", "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.test.ts"] },
  { plan: 105, lineageCommit: "250c152d3b2c8d7c1e7808985b61626bc3290883", paths: [`${PHASE}/262-105-SUMMARY.md`, `${PHASE}/262-105-REVIEW.md`, ".planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json", "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.ts", "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.test.ts"] },
])

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const target = (root: string, repoPath: string): string => path.join(path.resolve(root), ...repoPath.split("/"))
const git = (root: string, args: readonly string[], allowFailure = false): string =>
  runV138RetryV3IsolatedGit(root, args, allowFailure)
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
const pathPresent = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (pathPresent(root, repoPath)) fail(`V138_PLAN114_FORBIDDEN_PRESENT:${repoPath}`)
}
const assertAncestor = (root: string, commit: string): void => {
  if (git(root, ["merge-base", "--is-ancestor", commit, "HEAD"], true) !== "")
    fail(`V138_PLAN114_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail("V138_PLAN114_SUCCESSOR_REWRITE")
}
const committed = (root: string, commit: string, repoPath: string) => {
  const entry = git(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath) fail(`V138_PLAN114_ENTRY_INVALID:${repoPath}`)
  const bytes = gitBytes(root, commit, repoPath)
  const current = readFileSync(target(root, repoPath))
  if (!current.equals(bytes)) fail(`V138_PLAN114_CURRENT_BYTES_INVALID:${repoPath}`)
  return Object.freeze({ path: repoPath, mode: match[1]!, blob: match[2]!, sha256: sha(bytes), bytes })
}
const jsonAt = (root: string, commit: string, repoPath: string): Json => {
  const bytes = gitBytes(root, commit, repoPath)
  const value = JSON.parse(bytes.toString("utf8")) as Json
  if (!bytes.equals(Buffer.from(canonical(value)))) fail(`V138_PLAN114_NONCANONICAL:${repoPath}`)
  return value
}
const assertExactPublication = (root: string, commit: string, paths: readonly string[]): void => {
  assertAncestor(root, commit)
  const actual = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
    .split("\n").filter(Boolean).sort()
  const expected = paths.map((repoPath) => `A\t${repoPath}`).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN114_PUBLICATION_SCOPE_INVALID")
  for (const repoPath of paths) {
    const entry = git(root, ["ls-tree", commit, "--", repoPath])
    if (!entry.startsWith("100644 blob ")) fail("V138_PLAN114_PUBLICATION_MODE_INVALID")
    if (!readFileSync(target(root, repoPath)).equals(gitBytes(root, commit, repoPath)))
      fail("V138_PLAN114_PUBLICATION_BYTES_INVALID")
  }
  noRewrite(root, commit, paths)
}

const inspectProtectedHistory = (root: string): Sha => {
  const records: string[] = []
  const paths = new Set<string>()
  for (const branch of PROTECTED_BRANCHES) {
    if (git(root, ["merge-base", "--is-ancestor", branch.lineageCommit, PAIR_COMMIT], true) !== "")
      fail("V138_PLAN114_PROTECTED_LINEAGE_INVALID")
    for (const repoPath of branch.paths) {
      const entry = git(root, ["ls-tree", PAIR_COMMIT, "--", repoPath])
      const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
      if (match === null || match[3] !== repoPath) fail("V138_PLAN114_PROTECTED_ENTRY_INVALID")
      paths.add(repoPath)
      records.push(`${branch.plan}\0${branch.lineageCommit}\0${match[1]}\0${repoPath}\0${match[2]}`)
    }
  }
  noRewrite(root, PAIR_COMMIT, [...paths].sort())
  return rooted("v138-plan-262-108-independent-protected-history-v1", records.sort().join("\n"))
}

const foundationCache = new Map<string, Readonly<{
  closure: V138Plan114IndependentCustody
  expandedProtectedHistoryRoot: Sha
}>>()
const authenticateFoundationUncached = (root: string) => {
  for (const commit of [PLAN_114_REVIEWED_SOURCE_COMMIT, PLAN_113_EVIDENCE_COMMIT,
    PLAN_113_FINAL_REVIEW_COMMIT, PLAN_111_SOURCE_COMMIT]) assertAncestor(root, commit)
  if (git(root, ["rev-parse", `${PLAN_114_REVIEWED_SOURCE_COMMIT}^{tree}`]) !== SOURCE_TREE ||
      git(root, ["rev-parse", `${PLAN_114_REVIEWED_SOURCE_COMMIT}^`]) !== SOURCE_PARENT ||
      git(root, ["rev-parse", `${PLAN_113_EVIDENCE_COMMIT}^`]) !== PLAN_114_REVIEWED_SOURCE_COMMIT ||
      git(root, ["rev-parse", `${PLAN_113_FINAL_REVIEW_COMMIT}^`]) !== PLAN_113_EVIDENCE_COMMIT)
    fail("V138_PLAN114_PLAN113_IDENTITY_INVALID")
  const closure = deriveV138Plan114IndependentCustody(root, {
    sourceCommit: PLAN_114_REVIEWED_SOURCE_COMMIT,
    checkoutPaths: SOURCE_PATHS,
  })
  if (closure.sourceTree !== SOURCE_TREE || closure.sourceParent !== SOURCE_PARENT ||
      canonical(closure.checkoutPaths) !== canonical(SOURCE_PATHS) ||
      closure.pathnameLaunchReplacementResistanceClaimed !== false)
    fail("V138_PLAN114_CLOSURE_INVALID")
  const subject = committed(root, PLAN_114_REVIEWED_SOURCE_COMMIT, PATHS.live).bytes.toString("utf8")
  for (const marker of ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody",
    "--check-reviewed-live-ready", "--run-reviewed-bounded-live-envelope",
    "checkV138LiveV10ReproductionV17ForReview"])
    if (!subject.includes(marker)) fail("V138_PLAN114_MODE_SURFACE_INVALID")
  if (subject.includes("injectedProducer") || /runV138ReviewedBoundedLiveEnvelopeV10\s*=\s*async\s*\([^)]*,/u.test(subject))
    fail("V138_PLAN114_PRODUCTION_BYPASS_PRESENT")

  const publications = [
    [CORRECTED_PUBLICATION_COMMIT, [PATHS.correctedPayload, PATHS.correctedReview, PATHS.correctedCarrier], CORRECTED_ROOTS],
    [PLAN_112_V1_PUBLICATION_COMMIT, [PATHS.v1Payload, PATHS.v1Review, PATHS.v1Carrier], PLAN_112_V1_ROOTS],
    [PLAN_112_V2_PUBLICATION_COMMIT, [PATHS.v2Payload, PATHS.v2Review, PATHS.v2Carrier], PLAN_112_V2_ROOTS],
  ] as const
  for (const [commit, paths, roots] of publications) {
    assertExactPublication(root, commit, paths)
    const payload = jsonAt(root, commit, paths[0])
    const carrier = jsonAt(root, commit, paths[2])
    if (payload.payloadRoot !== roots.payload || carrier.reviewRoot !== roots.review ||
        carrier.carrierRoot !== roots.carrier) fail("V138_PLAN114_HISTORY_ROOT_INVALID")
  }
  const v1 = jsonAt(root, PLAN_112_V1_PUBLICATION_COMMIT, PATHS.v1Payload)
  const v2 = jsonAt(root, PLAN_112_V2_PUBLICATION_COMMIT, PATHS.v2Payload)
  if (v1.findingCount !== 0 || v1.plan109Eligible !== true ||
      v2.supersedesPublicationCommit !== PLAN_112_V1_PUBLICATION_COMMIT ||
      v2.findingCount !== 3 || canonical(v2.findingCodes) !== canonical(PLAN_112_V2_FINDINGS) ||
      v2.plan109Eligible !== false || v2.liveInvoked !== false || v2.freshCharged !== 0 ||
      v2.freshAccepted !== 0 || v2.authorizesExecution !== false || v2.downstreamAuthority !== "denied")
    fail("V138_PLAN114_PLAN112_SEMANTICS_INVALID")

  const seal = jsonAt(root, PAIR_COMMIT, PATHS.seal)
  const envelope = jsonAt(root, PAIR_COMMIT, PATHS.envelope)
  noRewrite(root, PAIR_COMMIT, [PATHS.seal, PATHS.envelope])
  const plan93 = committed(root, PLAN_93_STOP_COMMIT, PATHS.plan93)
  noRewrite(root, PLAN_93_STOP_COMMIT, [PATHS.plan93])
  const plan93Text = plan93.bytes.toString("utf8")
  if (seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied" ||
      envelope.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.status !== "sealed_inactive" ||
      canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      ["candidateSearchAuthorized", "formationMaterializationAuthorized", "holdoutOpeningAuthorized",
        "phase263PlanningAuthorized", "publicAuthorized", "productAuthorized", "productionAuthorized",
        "gameplayChangeAuthorized"].some((key) => envelope.policy[key] !== false) ||
      plan93.sha256 !== PLAN_93_STOP_SHA256 ||
      ["status: pre_start_integrity_stop", "Live effect boundary crossed: `false`", "Route starts: `0/3`",
        "Fresh accepted: `0/540`", "Plan 93 is not complete"].some((text) => !plan93Text.includes(text)))
    fail("V138_PLAN114_PAIR_STOP_AUTHORITY_INVALID")
  const expandedProtectedHistoryRoot = inspectProtectedHistory(root)
  return Object.freeze({ closure, expandedProtectedHistoryRoot })
}
const authenticateFoundation = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const cached = foundationCache.get(root)
  if (cached !== undefined) return cached
  const observed = authenticateFoundationUncached(root)
  foundationCache.set(root, observed)
  return observed
}

const sourceAdmission = () => Object.freeze({
  correctedPublicationCommit: CORRECTED_PUBLICATION_COMMIT,
  correctedPayloadRoot: CORRECTED_ROOTS.payload,
  correctedReviewRoot: CORRECTED_ROOTS.review,
  correctedCarrierRoot: CORRECTED_ROOTS.carrier,
  plan112V1PublicationCommit: PLAN_112_V1_PUBLICATION_COMMIT,
  plan112V1PayloadRoot: PLAN_112_V1_ROOTS.payload,
  plan112V1ReviewRoot: PLAN_112_V1_ROOTS.review,
  plan112V1CarrierRoot: PLAN_112_V1_ROOTS.carrier,
  plan112V2PublicationCommit: PLAN_112_V2_PUBLICATION_COMMIT,
  plan112V2PayloadRoot: PLAN_112_V2_ROOTS.payload,
  plan112V2ReviewRoot: PLAN_112_V2_ROOTS.review,
  plan112V2CarrierRoot: PLAN_112_V2_ROOTS.carrier,
})
const payloadRoot = (body: Json): Sha => rooted("v138-plan-262-114-live-v10-custody-review-payload-v1", body)
const reviewRoot = (body: Json): Sha => rooted("v138-plan-262-114-live-v10-custody-review-v1", body)
const carrierRoot = (body: Json): Sha => rooted("v138-plan-262-114-live-v10-custody-review-carrier-v1", body)
const supplementRoot = (body: Json): Sha => rooted("v138-successor-source-seal-v13-executable-custody-supplement-v3", body)

const renderContracts = (input: {
  closure: V138Plan114IndependentCustody
  linkedLocalExecutionClosureRoot: Sha
  findings: readonly V138Plan114Finding[]
  actualModesPassed: number
  plan114PublicationCommit?: string
}) => {
  const findings = [...input.findings].sort((a, b) => `${a.code}\0${a.detail}`.localeCompare(`${b.code}\0${b.detail}`))
  const zero = findings.length === 0
  const source = sourceAdmission()
  const body = {
    schemaVersion: "v1.38-plan-262-114-live-v10-custody-review-payload-v1",
    reviewedSourceCommit: input.closure.sourceCommit,
    reviewedClosureRoot: input.closure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.linkedLocalExecutionClosureRoot,
    correctedPublicationCommit: source.correctedPublicationCommit,
    correctedPayloadRoot: source.correctedPayloadRoot,
    correctedReviewRoot: source.correctedReviewRoot,
    correctedCarrierRoot: source.correctedCarrierRoot,
    plan112V1PublicationCommit: source.plan112V1PublicationCommit,
    plan112V1PayloadRoot: source.plan112V1PayloadRoot,
    plan112V1ReviewRoot: source.plan112V1ReviewRoot,
    plan112V1CarrierRoot: source.plan112V1CarrierRoot,
    plan112V2PublicationCommit: source.plan112V2PublicationCommit,
    plan112V2PayloadRoot: source.plan112V2PayloadRoot,
    plan112V2ReviewRoot: source.plan112V2ReviewRoot,
    plan112V2CarrierRoot: source.plan112V2CarrierRoot,
    plan112V2FindingCount: 3,
    plan112V2FindingCodes: PLAN_112_V2_FINDINGS,
    findingCount: findings.length,
    findingCodes: findings.map(({ code }) => code),
    reviewStatus: zero ? "zero_findings" : "blocked",
    actualModesPassed: input.actualModesPassed,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...body, payloadRoot: payloadRoot(body) })
  const rBody = {
    payloadRoot: payload.payloadRoot,
    reviewedClosureRoot: input.closure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.linkedLocalExecutionClosureRoot,
    findingCount: findings.length,
    actualModesPassed: input.actualModesPassed,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const rRoot = reviewRoot(rBody)
  const reviewBytes = zero
    ? Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "114"\nreview_type: independent_live_v10_executable_custody_v1\nstatus: zero_findings\nfinding_count: 0\nreview_root: ${rRoot}\n---\n\n# Phase 262 Plan 114 Independent Live-v10 Executable-Custody Review\n\n**ZERO FINDINGS.** Six actual non-live modes passed. Portable reviewed closure: \`${input.closure.reviewedClosureRoot}\`. Linked-review local context: \`${input.linkedLocalExecutionClosureRoot}\`. Live invoked: false. Downstream authority: denied.\n`)
    : Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "114"\nreview_type: independent_live_v10_executable_custody_v1\nstatus: blocked\nfinding_count: ${findings.length}\nreview_root: ${rRoot}\n---\n\n# Phase 262 Plan 114 Independent Live-v10 Executable-Custody Review\n\n**BLOCKED.** Finding codes: ${findings.map(({ code }) => code).join(", ")}. Actual non-live modes passed: ${input.actualModesPassed}/6. Live invoked: false. Downstream authority: denied.\n`)
  const cBody = {
    schemaVersion: "v1.38-plan-262-114-live-v10-custody-review-carrier-v1",
    payloadRoot: payload.payloadRoot,
    reviewRoot: rRoot,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadSha256: sha(Buffer.from(canonical(payload))),
    reviewSha256: sha(reviewBytes),
    findingCount: findings.length,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...cBody, carrierRoot: carrierRoot(cBody) })
  let supplement: Json | undefined
  if (input.plan114PublicationCommit !== undefined) {
    const sBody = {
      schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v3",
      supersessionScope: "executable_source_custody_only",
      plan114PublicationCommit: input.plan114PublicationCommit,
      plan114PayloadRoot: payload.payloadRoot,
      plan114ReviewRoot: rRoot,
      plan114CarrierRoot: carrier.carrierRoot,
      reviewedSourceCommit: input.closure.sourceCommit,
      reviewedClosureRoot: input.closure.reviewedClosureRoot,
      reviewedLocalExecutionClosureRoot: input.linkedLocalExecutionClosureRoot,
      correctedPublicationCommit: source.correctedPublicationCommit,
      plan112V1PublicationCommit: source.plan112V1PublicationCommit,
      plan112V2PublicationCommit: source.plan112V2PublicationCommit,
      pairCommit: PAIR_COMMIT,
      sealRoot: SEAL_ROOT,
      envelopeRoot: ENVELOPE_ROOT,
      protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
      counters: ZERO_COUNTERS,
      createsEnvelope: false,
      createsCapacity: false,
      resetsCounters: false,
      authorizesExecution: false,
      phase263PlanningAuthorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      downstreamAuthority: "denied",
    }
    supplement = Object.freeze({ ...sBody, supplementRoot: supplementRoot(sBody) })
  }
  return Object.freeze({ payload, reviewBytes, carrier, reviewRoot: rRoot, supplement,
    findingRoot: rooted("v138-plan-262-114-findings-v1", findings), plan109Eligible: zero && input.actualModesPassed === 6 })
}

const modeObservation = (mode: string, status: string, value: unknown) => Object.freeze({
  mode, status, root: rooted("v138-plan-262-114-mode-observation-v1", value),
})
const reviewedToolchainPath = (): string => `${path.dirname(process.execPath)}:/usr/bin:/bin`
const run = (executable: string, args: readonly string[], cwd: string, isolatedHome: string): string =>
  execFileSync(executable, [...args], {
    cwd, encoding: "utf8", env: { PATH: reviewedToolchainPath(), HOME: isolatedHome, LANG: "C", LC_ALL: "C" },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
const linkDependencies = (sourceRoot: string, linkedRoot: string): void => {
  symlinkSync(path.join(sourceRoot, "node_modules"), path.join(linkedRoot, "node_modules"), "dir")
  for (const workspace of ["apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
    "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
    "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
    "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils"]) {
    const source = path.join(sourceRoot, workspace, "node_modules")
    if (!existsSync(source)) continue
    const destination = path.join(linkedRoot, workspace, "node_modules")
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(source, destination, "dir")
  }
}

export const executeV138Plan114DisposableModes = (repoRootInput: string): V138Plan114ModeResult => {
  const repoRoot = path.resolve(repoRootInput)
  const foundation = authenticateFoundation(repoRoot)
  assertAbsent(repoRoot, FORBIDDEN)
  let disposableBase = "HEAD"
  if ([PATHS.payload, PATHS.review, PATHS.carrier].some((repoPath) => pathPresent(repoRoot, repoPath))) {
    if (![PATHS.payload, PATHS.review, PATHS.carrier].every((repoPath) => pathPresent(repoRoot, repoPath)))
      fail("V138_PLAN114_PARTIAL_PUBLICATION_PRESENT")
    const publications = git(repoRoot, ["log", "--diff-filter=A", "--format=%H", "--", PATHS.payload])
      .split("\n").filter(Boolean)
    if (publications.length !== 1) fail("V138_PLAN114_PUBLICATION_AMBIGUOUS")
    disposableBase = `${publications[0]!}^`
  }
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan114-"))
  const linked = path.join(owner, "repo")
  let worktreeAdded = false
  try {
    run("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", linked, disposableBase], repoRoot, owner)
    worktreeAdded = true
    linkDependencies(repoRoot, linked)
    const tsx = path.join(linked, "node_modules/.bin/tsx")
    const observations: Array<ReturnType<typeof modeObservation>> = []
    const findings: V138Plan114Finding[] = []
    const parseCli = (mode: string, expectedStatus: string, code: string) => {
      const result = spawnSync(tsx, [PATHS.live, mode], {
        cwd: linked, encoding: "utf8",
        env: { PATH: reviewedToolchainPath(), HOME: owner, LANG: "C", LC_ALL: "C" },
        stdio: ["ignore", "pipe", "pipe"],
      })
      if (result.error !== undefined || result.status === null)
        fail(`V138_PLAN114_MODE_PROCESS_INTEGRITY:${mode}`)
      if (result.status !== 0) {
        const detail = result.stderr.trim() || `exit:${String(result.status)}`
        findings.push({ code, severity: "critical", detail })
        observations.push(modeObservation(mode, "failed", { detail }))
        return undefined
      }
      let value: Json
      try { value = JSON.parse(result.stdout.trim()) as Json }
      catch { fail(`V138_PLAN114_MODE_PROCESS_INTEGRITY:${mode}:json`) }
      if (value.status !== expectedStatus || value.liveInvoked !== false || value.freshCharged !== 0 ||
          value.freshAccepted !== 0 || value.downstreamAuthority !== "denied") {
        findings.push({ code, severity: "critical", detail: canonical(value).trim() })
        observations.push(modeObservation(mode, "failed", value))
        return undefined
      }
      observations.push(modeObservation(mode, expectedStatus, value))
      return value
    }
    parseCli("--check-source-only", "source_only_checked", "MODE_SOURCE_ONLY_FAILED")
    const linkedFoundation = authenticateFoundation(linked)
    const linkedClosure = deriveV138Plan114IndependentCustody(linked, {
      sourceCommit: PLAN_114_REVIEWED_SOURCE_COMMIT,
      checkoutPaths: SOURCE_PATHS,
    })
    if (linkedClosure.reviewedClosureRoot !== foundation.closure.reviewedClosureRoot ||
        linkedClosure.localExecutionClosureRoot === foundation.closure.localExecutionClosureRoot)
      fail("V138_PLAN114_LINKED_CLOSURE_INVALID")
    const candidate = renderContracts({
      closure: linkedClosure,
      linkedLocalExecutionClosureRoot: linkedClosure.localExecutionClosureRoot,
      findings: [], actualModesPassed: 6,
    })
    for (const [repoPath, bytes] of [[PATHS.payload, Buffer.from(canonical(candidate.payload))],
      [PATHS.review, candidate.reviewBytes], [PATHS.carrier, Buffer.from(canonical(candidate.carrier))]] as const) {
      mkdirSync(path.dirname(target(linked, repoPath)), { recursive: true })
      writeFileSync(target(linked, repoPath), bytes, { mode: 0o644, flag: "wx" })
    }
    run("/usr/bin/git", ["add", "--", PATHS.payload, PATHS.review, PATHS.carrier], linked, owner)
    run("/usr/bin/git", ["-c", "user.name=Plan 114 Disposable", "-c", "user.email=plan114@example.invalid",
      "commit", "--quiet", "-m", "disposable plan 114 trio"], linked, owner)
    const publicationCommit = run("/usr/bin/git", ["rev-parse", "HEAD"], linked, owner)
    parseCli("--check-prospective-custody", "prospective_custody_checked", "MODE_PROSPECTIVE_CUSTODY_FAILED")
    const withSupplement = renderContracts({
      closure: linkedClosure,
      linkedLocalExecutionClosureRoot: linkedClosure.localExecutionClosureRoot,
      findings: [], actualModesPassed: 6, plan114PublicationCommit: publicationCommit,
    })
    writeFileSync(target(linked, PATHS.supplement3), canonical(withSupplement.supplement), { mode: 0o644, flag: "wx" })
    run("/usr/bin/git", ["add", "--", PATHS.supplement3], linked, owner)
    run("/usr/bin/git", ["-c", "user.name=Plan 114 Disposable", "-c", "user.email=plan114@example.invalid",
      "commit", "--quiet", "-m", "disposable supplement v3"], linked, owner)
    parseCli("--check-post-run-custody", "post_run_custody_checked", "MODE_POST_NO_EFFECT_FAILED")

    const runnerPath = path.join(linked, ".plan114-mode-runner.ts")
    const runValue = (expression: string): Json => {
      writeFileSync(runnerPath,
        `import * as subject from './scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts'; const value=${expression}; process.stdout.write(JSON.stringify(value));`,
        { mode: 0o600 })
      let value: Json
      try { value = JSON.parse(run(tsx, [runnerPath], linked, owner)) as Json }
      catch { fail("V138_PLAN114_VALUE_MODE_PROCESS_INTEGRITY") }
      rmSync(runnerPath, { force: true })
      return value
    }
    const valueMode = (mode: string, expression: string, expectedStatus: string, code: string) => {
      const value = runValue(expression)
      if (value.status !== expectedStatus || value.downstreamAuthority !== "denied")
        findings.push({ code, severity: "critical", detail: canonical(value).trim() })
      observations.push(modeObservation(mode, value.status === expectedStatus ? expectedStatus : "failed", value))
    }
    valueMode("post_non_pass_value",
      "subject.checkV138LiveV10PostRunOutputCustodyForReview({journalPresent:true,privateDirectoryPresent:true,terminalPresent:true,lockPresent:false,reproductionPresent:false,adjudicationOrDownstreamPresent:false,outcome:{disposition:'exhausted',journalRoot:'sha256:'+'1'.repeat(64),stateRoot:'sha256:'+'2'.repeat(64),completeCleanup:true,reproductionPresent:false,downstreamAuthority:'denied'}})",
      "bounded_terminal", "MODE_NON_PASS_FAILED")
    valueMode("post_success_value",
      "subject.checkV138LiveV10PostRunOutputCustodyForReview({journalPresent:true,privateDirectoryPresent:true,terminalPresent:true,lockPresent:false,reproductionPresent:true,adjudicationOrDownstreamPresent:false,outcome:{disposition:'succeeded',journalRoot:'sha256:'+'1'.repeat(64),stateRoot:'sha256:'+'2'.repeat(64),completeCleanup:true,reproductionPresent:true,downstreamAuthority:'denied'}})",
      "bounded_success", "MODE_SUCCESS_FAILED")
    const reproduction = runValue(`(()=>{const body={schemaVersion:'v1.38-current-matrix-reproduction-v17',status:'passed_exact',admittedCalibrationRoot:'sha256:'+'3'.repeat(64),chargedAttemptCount:540,acceptedCellCount:540,completeCleanup:true,executionRoot:'sha256:'+'4'.repeat(64),runtimeRoute:'v1.18/v1.19/MATCH_KERNEL',samplingMilliseconds:200,partialAcceptedEvidenceReusable:false,privacyProjection:{strategySourceIncluded:false,strategyMemoryIncluded:false,soldierMemoryIncluded:false,objectivePayloadIncluded:false,rawDiagnosticsIncluded:false},phase263PlanningAuthorized:false,candidateSearchAuthorized:false,formationMaterializationAuthorized:false,holdoutOpeningAuthorized:false,publicAuthorized:false,productAuthorized:false,productionAuthorized:false};const receiptRoot=subject.computeV138LiveV10ReproductionV17ReceiptRoot(body);const artifact={...body,receiptRoot};const journalRecords=[{kind:'finish_calibration',routeIdentity:'route:v3:0',owner:'owner',status:'admitted',completeCleanup:true,supervisionRoot:body.admittedCalibrationRoot},{kind:'finish_reproduction',routeIdentity:'route:v3:0',owner:'owner',status:'passed_exact',acceptedCells:540,completeCleanup:true,reproductionRoot:receiptRoot,recordRoot:'sha256:'+'5'.repeat(64)}];const value=subject.checkV138LiveV10ReproductionV17ForReview({artifact,journalRecords,outcome:{disposition:'succeeded',journalRoot:'sha256:'+'5'.repeat(64),stateRoot:'sha256:'+'6'.repeat(64),completeCleanup:true,reproductionPresent:true,downstreamAuthority:'denied'}});return {...value,status:'exact_reproduction'}})()`)
    if (reproduction.status !== "exact_reproduction" || reproduction.acceptedCellCount !== 540 ||
        reproduction.downstreamAuthority !== "denied")
      findings.push({ code: "MODE_EXACT_REPRODUCTION_FAILED", severity: "critical", detail: canonical(reproduction).trim() })
    observations.push(modeObservation("exact_reproduction_value", "exact_reproduction", reproduction))
    const modeNames = ["source_only_cli", "prospective_custody_cli", "post_no_effect_cli",
      "post_non_pass_value", "post_success_value", "exact_reproduction_value"] as const
    const normalized = observations.map((item, index) => ({ ...item, mode: modeNames[index]! }))
    if (normalized.length !== 6) fail("V138_PLAN114_MODE_COUNT_INVALID")
    const sorted = [...findings].sort((a, b) => `${a.code}\0${a.detail}`.localeCompare(`${b.code}\0${b.detail}`))
    return Object.freeze({
      modeNames, actualModesPassed: 6 - sorted.length, producerCalls: 0 as const,
      readinessInvoked: false as const, liveInvoked: false as const,
      freshCharged: 0 as const, freshAccepted: 0 as const,
      observations: Object.freeze(normalized), findings: Object.freeze(sorted),
      observationRoot: rooted("v138-plan-262-114-observations-v1", normalized),
      sourceTree: linkedClosure.sourceTree, sourceParent: linkedClosure.sourceParent,
      checkoutManifestRoot: linkedClosure.checkoutManifestRoot,
      recursiveDependencyRoot: linkedClosure.recursiveDependencyRoot,
      recursiveDependencyCount: linkedClosure.recursiveDependencyCount,
      installedClosureRoot: linkedClosure.installedClosureRoot,
      pathStableNativeSourcesRoot: linkedClosure.pathStableNativeSourcesRoot,
      reviewedClosureRoot: linkedClosure.reviewedClosureRoot,
      linkedLocalExecutionClosureRoot: linkedClosure.localExecutionClosureRoot,
      expandedProtectedHistoryRoot: linkedFoundation.expandedProtectedHistoryRoot,
    })
  } finally {
    if (worktreeAdded) {
      try { run("/usr/bin/git", ["worktree", "remove", "--force", linked], repoRoot, owner) }
      catch { /* preserve the primary observation result */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

export const renderV138Plan114EvidenceForReview = (
  repoRootInput: string,
  findings: readonly V138Plan114Finding[],
  modes?: V138Plan114ModeResult,
) => {
  const foundation = authenticateFoundation(path.resolve(repoRootInput))
  if (findings.length === 0 && modes === undefined) fail("V138_PLAN114_ZERO_REQUIRES_EXECUTED_MODES")
  if (findings.length === 0 && (modes!.actualModesPassed !== 6 || modes!.findings.length !== 0 ||
      modes!.readinessInvoked !== false || modes!.liveInvoked !== false))
    fail("V138_PLAN114_ZERO_REQUIRES_SIX_CLEAN_MODES")
  return renderContracts({
    closure: foundation.closure,
    linkedLocalExecutionClosureRoot: modes?.linkedLocalExecutionClosureRoot ?? foundation.closure.localExecutionClosureRoot,
    findings,
    actualModesPassed: modes?.actualModesPassed ?? 0,
  })
}

const locatePublicationCommit = (root: string): string => {
  const commits = git(root, ["log", "--diff-filter=A", "--format=%H", "--", PATHS.payload]).split("\n").filter(Boolean)
  if (commits.length === 0) fail("V138_PLAN114_PUBLICATION_ABSENT")
  if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!)) fail("V138_PLAN114_PUBLICATION_AMBIGUOUS")
  return commits[0]!
}

export const authenticateV138Plan114PublishedReview = (repoRootInput: string) => {
  const root = path.resolve(repoRootInput)
  const foundation = authenticateFoundation(root)
  if (![PATHS.payload, PATHS.review, PATHS.carrier].every((repoPath) => pathPresent(root, repoPath)))
    fail("V138_PLAN114_PUBLICATION_ABSENT")
  const commit = locatePublicationCommit(root)
  assertExactPublication(root, commit, [PATHS.payload, PATHS.review, PATHS.carrier])
  const payload = jsonAt(root, commit, PATHS.payload)
  const carrier = jsonAt(root, commit, PATHS.carrier)
  const reviewBytes = gitBytes(root, commit, PATHS.review)
  const exact = renderContracts({
    closure: foundation.closure,
    linkedLocalExecutionClosureRoot: payload.reviewedLocalExecutionClosureRoot,
    findings: [], actualModesPassed: 6,
  })
  if (canonical(payload) !== canonical(exact.payload) || !reviewBytes.equals(exact.reviewBytes) ||
      canonical(carrier) !== canonical(exact.carrier) || exact.plan109Eligible !== true)
    fail("V138_PLAN114_PUBLICATION_RERENDER_INVALID")
  assertAbsent(root, FORBIDDEN)
  return Object.freeze({
    publicationCommit: commit,
    payloadRoot: payload.payloadRoot,
    reviewRoot: carrier.reviewRoot,
    carrierRoot: carrier.carrierRoot,
    findingCount: 0,
    actualModesPassed: 6,
    plan109Eligible: true,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    downstreamAuthority: "denied" as const,
    forbiddenDestinations: FORBIDDEN,
  })
}

const writeReview = (root: string): void => {
  assertAbsent(root, [PATHS.payload, PATHS.review, PATHS.carrier, ...FORBIDDEN])
  const modes = executeV138Plan114DisposableModes(root)
  const evidence = renderV138Plan114EvidenceForReview(root, modes.findings, modes)
  for (const [repoPath, bytes] of [[PATHS.payload, Buffer.from(canonical(evidence.payload))],
    [PATHS.review, evidence.reviewBytes], [PATHS.carrier, Buffer.from(canonical(evidence.carrier))]] as const)
    writeFileSync(target(root, repoPath), bytes, { mode: 0o644, flag: "wx" })
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN114_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeReview(root); return }
  if (args[0] === "--check-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan114PublishedReview(root))}\n`); return
  }
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan114DisposableModes(root))}\n`); return
  }
  fail("V138_PLAN114_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
