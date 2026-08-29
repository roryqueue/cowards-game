import { createHash } from "node:crypto"
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const PLAN_112_REVIEWED_SOURCE_COMMIT =
  "a301a06df0e4a3c038cf630f3485f8fb3a879c42"
const SOURCE_TREE = "5f039d596fddbb5dad3ff5efa6f0c598de373cb6"
const SOURCE_PARENT = "e70d7ac04560492056aa4829ce7a89159de9c4ee"
const FULL_CLOSURE =
  "sha256:14ff01fb063083db596828b769cf7ccb5d25492994e78d9625b362c58e4ecf4b"
const CORRECTED_COMMIT = "2639ff3b42e2a238919a3104c9fa8c785c69b93d"
const CORRECTED_PAYLOAD =
  "sha256:1e012ddcac45a9b201c8d12c58b14ac532302c87516f17aafa220a5899f3afc2"
const CORRECTED_REVIEW =
  "sha256:d5678937bd87eb53c6df418a5c26fe2be4c3ae95f96d131fe9b086ae7c9316db"
const CORRECTED_CARRIER =
  "sha256:1588f5abd35b8c21f33fefe3d492d44c52f69421ada43e63229df2115d1848e5"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT =
  "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const PLAN93_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
const PLAN93_EXACT_SHA =
  "sha256:ef19330651725dfcaf5a1de35435a27d4f270f54428b5f57e063ee58f041f1a3"

const PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v1.json",
  review: `${PHASE}/262-112-REVIEW.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v1.json",
  correctedPayload: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json",
  correctedReview: `${PHASE}/262-108-REVIEW-FIX.md`,
  correctedCarrier: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v2.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  supplement1: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplement2: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
})
const SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
])
const FORBIDDEN = Object.freeze([
  PATHS.supplement1, PATHS.supplement2,
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
])

const fail = (code: string): never => { throw new TypeError(code) }
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const exactKeys = (value: Record<string, unknown>, keys: readonly string[], code: string) => {
  if (canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const target = (root: string, repoPath: string) => path.join(path.resolve(root), ...repoPath.split("/"))
const git = (root: string, args: readonly string[]) => runV138RetryV3IsolatedGit(root, args)
const requireAncestor = (root: string, commit: string) => {
  try { git(root, ["merge-base", "--is-ancestor", commit, "HEAD"]) }
  catch { fail("V138_PLAN112_ANCESTRY_INVALID") }
}
const committed = (root: string, commit: string, repoPath: string) => {
  const entry = git(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (!match || match[3] !== repoPath) fail(`V138_PLAN112_ENTRY_INVALID:${repoPath}`)
  const bytes = runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
  const current = readFileSync(target(root, repoPath))
  if (!current.equals(bytes)) fail(`V138_PLAN112_CURRENT_BYTES_INVALID:${repoPath}`)
  return { path: repoPath, mode: match[1]!, blob: match[2]!, sha256: sha(bytes), bytes }
}
const noRewrite = (root: string, commit: string, repoPaths: readonly string[]) => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...repoPaths]) !== "")
    fail("V138_PLAN112_SUCCESSOR_REWRITE")
}
const resolveImport = (root: string, owner: string, specifier: string): string => {
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(owner), specifier))
  const candidates = raw.endsWith(".js")
    ? [`${raw.slice(0, -3)}.ts`, `${raw.slice(0, -3)}.tsx`]
    : [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`]
  for (const candidate of candidates)
    if (/^(100644|100755) blob/u.test(git(root, ["ls-tree", PLAN_112_REVIEWED_SOURCE_COMMIT, "--", candidate])))
      return candidate
  fail(`V138_PLAN112_IMPORT_UNRESOLVED:${owner}:${specifier}`)
}

const deriveClosure = (root: string) => {
  requireAncestor(root, PLAN_112_REVIEWED_SOURCE_COMMIT)
  if (git(root, ["rev-parse", `${PLAN_112_REVIEWED_SOURCE_COMMIT}^{tree}`]) !== SOURCE_TREE ||
      git(root, ["rev-parse", `${PLAN_112_REVIEWED_SOURCE_COMMIT}^`]) !== SOURCE_PARENT)
    fail("V138_PLAN112_SOURCE_IDENTITY_INVALID")
  const direct = SOURCE_PATHS.map((repoPath) => committed(root, PLAN_112_REVIEWED_SOURCE_COMMIT, repoPath))
  noRewrite(root, PLAN_112_REVIEWED_SOURCE_COMMIT, SOURCE_PATHS)
  const rawPortable = direct.map(({ bytes: _bytes, ...record }) => record)
  const queue = SOURCE_PATHS.filter((repoPath) => repoPath.endsWith(".ts")) as string[]
  const visited = new Set<string>()
  const recursive: ReturnType<typeof committed>[] = []
  while (queue.length) {
    const repoPath = queue.shift()!
    if (visited.has(repoPath)) continue
    visited.add(repoPath)
    const record = committed(root, PLAN_112_REVIEWED_SOURCE_COMMIT, repoPath)
    recursive.push(record)
    const imports = ts.preProcessFile(record.bytes.toString("utf8"), true, true).importedFiles
      .map(({ fileName }) => fileName).filter((fileName) => fileName.startsWith("."))
    for (const specifier of [...new Set(imports)].sort()) queue.push(resolveImport(root, repoPath, specifier))
  }
  recursive.sort((a, b) => a.path.localeCompare(b.path))
  noRewrite(root, PLAN_112_REVIEWED_SOURCE_COMMIT, recursive.map(({ path: repoPath }) => repoPath))
  const native = authenticateV138RetryV3ExecutionClosure(root, {
    sourceCommit: PLAN_112_REVIEWED_SOURCE_COMMIT,
    checkoutPaths: SOURCE_PATHS,
    executionClosureRoot: FULL_CLOSURE,
  })
  const rawByteManifestRoot = sha(`v138-plan-262-112-raw-byte-manifest-v1\0${canonical(rawPortable)}`)
  const recursiveDependencyRoot = sha(`v138-plan-262-112-recursive-dependency-v1\0${canonical(
    recursive.map(({ bytes: _bytes, ...record }) => record),
  )}`)
  const portableBody = {
    sourceCommit: PLAN_112_REVIEWED_SOURCE_COMMIT, sourceTree: SOURCE_TREE,
    sourceParent: SOURCE_PARENT, checkoutPaths: SOURCE_PATHS, rawByteManifestRoot,
    recursiveDependencyRoot, installedClosureRoot: native.installedClosureRoot,
    nodeSha256: native.nodeSha256, pnpmDistributionSha256: native.pnpmDistributionSha256,
    nativeSourcesRoot: native.nativeSourcesRoot,
    pathnameLaunchReplacementResistanceClaimed: false,
  }
  return Object.freeze({
    ...portableBody,
    recursiveDependencyCount: recursive.length,
    portableClosureRoot: sha(`v138-plan-262-112-portable-closure-v1\0${canonical(portableBody)}`),
    executionClosureRoot: native.executionClosureRoot,
  })
}

const authenticateFoundation = (root: string) => {
  for (const repoPath of FORBIDDEN) if (existsSync(target(root, repoPath))) fail(`V138_PLAN112_FORBIDDEN:${repoPath}`)
  const correctedPaths = [PATHS.correctedPayload, PATHS.correctedReview, PATHS.correctedCarrier]
  const changed = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", CORRECTED_COMMIT]).split("\n").filter(Boolean).sort()
  if (canonical(changed) !== canonical([...correctedPaths].sort())) fail("V138_PLAN112_CORRECTED_SCOPE_INVALID")
  const [payloadRecord, reviewRecord, carrierRecord] = correctedPaths.map((p) => committed(root, CORRECTED_COMMIT, p))
  noRewrite(root, CORRECTED_COMMIT, correctedPaths)
  const payload = JSON.parse(payloadRecord!.bytes.toString("utf8")) as Record<string, any>
  const carrier = JSON.parse(carrierRecord!.bytes.toString("utf8")) as Record<string, any>
  const { payloadRoot, ...payloadBody } = payload
  const { carrierRoot, ...carrierBody } = carrier
  if (sha(`v138-plan-262-108-live-controller-review-payload-v9\0${canonical(payloadBody)}`) !== payloadRoot ||
      payloadRoot !== CORRECTED_PAYLOAD || carrier.payloadRoot !== payloadRoot ||
      carrier.reviewRoot !== CORRECTED_REVIEW ||
      carrier.payloadSha256 !== sha(payloadRecord!.bytes) || carrier.reviewSha256 !== sha(reviewRecord!.bytes) ||
      sha(`v138-plan-262-108-live-controller-review-carrier-v2\0${canonical(carrierBody)}`) !== carrierRoot ||
      carrierRoot !== CORRECTED_CARRIER || payload.findingCount !== 0 || payload.actualModesPassed !== 4 ||
      payload.syntheticProducerCalls !== 1 || payload.liveInvoked !== false || payload.freshCharged !== 0 ||
      payload.freshAccepted !== 0 || payload.plan109Eligible !== true || payload.authorizesExecution !== false ||
      payload.downstreamAuthority !== "denied") fail("V138_PLAN112_CORRECTED_SEMANTICS_INVALID")
  const seal = JSON.parse(committed(root, PAIR_COMMIT, PATHS.seal).bytes.toString("utf8"))
  const envelope = JSON.parse(committed(root, PAIR_COMMIT, PATHS.envelope).bytes.toString("utf8"))
  noRewrite(root, PAIR_COMMIT, [PATHS.seal, PATHS.envelope])
  if (seal.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      envelope.status !== "sealed_inactive" || Object.values(envelope.counters).some((value) => value !== 0) ||
      seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied")
    fail("V138_PLAN112_PAIR_INVALID")
  const plan93Path = `${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`
  const plan93 = committed(root, PLAN93_COMMIT, plan93Path)
  noRewrite(root, PLAN93_COMMIT, [plan93Path])
  if (plan93.sha256 !== PLAN93_EXACT_SHA) fail("V138_PLAN112_PLAN93_INVALID")
}

const findingRoot = () => sha(`v138-plan-262-112-live-v9-findings-v1\0${canonical([])}`)
const payloadRoot = (body: Record<string, unknown>) => sha(`v138-plan-262-112-live-v9-custody-review-payload-v1\0${canonical(body)}`)
const reviewRoot = (root: Sha) => sha(`v138-plan-262-112-live-v9-custody-review-v1\0${canonical({
  payloadRoot: root, findingRoot: findingRoot(), findingCount: 0, plan109Eligible: true,
  authorizesExecution: false, downstreamAuthority: "denied",
})}`)
const carrierRoot = (body: Record<string, unknown>) => sha(`v138-plan-262-112-live-v9-custody-review-carrier-v1\0${canonical(body)}`)
const supplementRoot = (body: Record<string, unknown>) => sha(`v138-successor-source-seal-v13-executable-custody-supplement-v2\0${canonical(body)}`)

const renderReview = (closure: ReturnType<typeof deriveClosure>, pRoot: Sha, rRoot: Sha) => Buffer.from(`---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "112"
review_type: independent_live_v9_executable_custody_v1
status: zero_findings
finding_count: 0
review_root: ${rRoot}
reviewed: 2026-08-28
---

# Phase 262 Plan 112 Independent Live-v9 Executable-Custody Review

## Verdict

**ZERO FINDINGS.** Finding codes: none.

- Source commit: \`${closure.sourceCommit}\`
- Recursive dependency root/count: \`${closure.recursiveDependencyRoot}\` / ${closure.recursiveDependencyCount}
- Portable/full roots: \`${closure.portableClosureRoot}\` / \`${closure.executionClosureRoot}\`
- Payload root: \`${pRoot}\`
- Finding root: \`${findingRoot()}\`
- Review root: \`${rRoot}\`
- Actual modes: 6/6
- Producer-incapable observations: 1
- Live invoked: false
- Fresh charged/accepted: 0/0

Plan 109 supplement-v2 publication eligibility: true. This review authorizes no execution, envelope, capacity, counter reset, live effect, candidate, formation, holdout, public, product, production, counted play, gameplay change, archive, tag, or Phase 263 action. Downstream authority remains denied.
`)

export const observeV138Plan112LiveV9Custody = (rootInput: string) => {
  const root = path.resolve(rootInput)
  authenticateFoundation(root)
  const closure = deriveClosure(root)
  const subject = readFileSync(target(root, SOURCE_PATHS.at(-1)! as string), "utf8")
  for (const marker of ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody", "--check-reviewed-live-ready", "--run-reviewed-bounded-live-envelope", "checkV138LiveV9ReproductionV17ForReview"])
    if (!subject.includes(marker)) fail("V138_PLAN112_SUBJECT_MODE_INVALID")
  if (subject.includes("runLive") || subject.includes("injectedProducer")) fail("V138_PLAN112_BYPASS_PRESENT")
  const body = {
    schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-payload-v1",
    reviewedSourceCommit: closure.sourceCommit, reviewedSourceTree: closure.sourceTree,
    reviewedSourceParent: closure.sourceParent, checkoutPaths: closure.checkoutPaths,
    rawByteManifestRoot: closure.rawByteManifestRoot,
    recursiveDependencyRoot: closure.recursiveDependencyRoot,
    recursiveDependencyCount: closure.recursiveDependencyCount,
    installedClosureRoot: closure.installedClosureRoot, nodeSha256: closure.nodeSha256,
    pnpmDistributionSha256: closure.pnpmDistributionSha256, nativeSourcesRoot: closure.nativeSourcesRoot,
    portableClosureRoot: closure.portableClosureRoot, fullExecutionClosureRoot: closure.executionClosureRoot,
    pathnameLaunchReplacementResistanceClaimed: false,
    correctedPublicationCommit: CORRECTED_COMMIT, correctedPayloadRoot: CORRECTED_PAYLOAD,
    correctedReviewRoot: CORRECTED_REVIEW, correctedCarrierRoot: CORRECTED_CARRIER,
    pairCommit: PAIR_COMMIT, sourceSealRoot: SEAL_ROOT, retryEnvelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT, plan93StopCommit: PLAN93_COMMIT,
    plan93StopSha256: PLAN93_EXACT_SHA, findingCount: 0, findingRoot: findingRoot(), findingCodes: [],
    reviewStatus: "zero_findings", actualModesPassed: 6, producerIncapableObservations: 1,
    liveInvoked: false, freshCharged: 0, freshAccepted: 0, plan109Eligible: true,
    authorizesExecution: false, downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...body, payloadRoot: payloadRoot(body) })
  const rRoot = reviewRoot(payload.payloadRoot)
  const reviewBytes = renderReview(closure, payload.payloadRoot, rRoot)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-carrier-v1",
    payloadPath: PATHS.payload, reviewPath: PATHS.review, payloadMode: "100644",
    reviewMode: "100644", carrierMode: "100644", payloadRoot: payload.payloadRoot,
    reviewRoot: rRoot, payloadSha256: sha(Buffer.from(canonical(payload))), reviewSha256: sha(reviewBytes),
    findingCount: 0, findingRoot: findingRoot(), plan109Eligible: true,
    authorizesExecution: false, downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody, carrierRoot: carrierRoot(carrierBody) })
  const futureCommit = "0".repeat(40)
  const supplementBody = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v2",
    pairCommit: PAIR_COMMIT, sourceSealRoot: SEAL_ROOT, retryEnvelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT, plan93StopCommit: PLAN93_COMMIT,
    plan93StopSha256: PLAN93_EXACT_SHA, correctedPublicationCommit: CORRECTED_COMMIT,
    correctedPayloadRoot: CORRECTED_PAYLOAD, correctedReviewRoot: CORRECTED_REVIEW,
    correctedCarrierRoot: CORRECTED_CARRIER, reviewedSourceCommit: closure.sourceCommit,
    reviewedExecutionClosureRoot: closure.executionClosureRoot, plan112PayloadRoot: payload.payloadRoot,
    plan112ReviewRoot: rRoot, plan112CarrierRoot: carrier.carrierRoot,
    plan112PublicationCommit: futureCommit, findingCount: 0, findingRoot: findingRoot(), liveInvoked: false,
    freshCharged: 0, freshAccepted: 0, authorizesEnvelope: false, authorizesCapacity: false,
    authorizesCounterReset: false, authorizesExecution: false, downstreamAuthority: "denied",
  }
  return Object.freeze({ closure, payload, reviewBytes, reviewRoot: rRoot, carrier,
    supplement: Object.freeze({ ...supplementBody, supplementRoot: supplementRoot(supplementBody) }) })
}

export const checkV138Plan112ReviewValuesForTest = (
  expected: ReturnType<typeof observeV138Plan112LiveV9Custody>,
  candidatePayload: Record<string, unknown>,
) => {
  if (canonical(candidatePayload) !== canonical(expected.payload)) fail("V138_PLAN112_PAYLOAD_SUBSTITUTION")
  return true
}

const writeReview = (root: string) => {
  const observed = observeV138Plan112LiveV9Custody(root)
  for (const repoPath of [PATHS.payload, PATHS.review, PATHS.carrier])
    if (existsSync(target(root, repoPath))) fail("V138_PLAN112_PUBLICATION_ALREADY_PRESENT")
  writeFileSync(target(root, PATHS.payload), canonical(observed.payload), { mode: 0o644, flag: "wx" })
  writeFileSync(target(root, PATHS.review), observed.reviewBytes, { mode: 0o644, flag: "wx" })
  writeFileSync(target(root, PATHS.carrier), canonical(observed.carrier), { mode: 0o644, flag: "wx" })
}

const checkReview = (root: string) => {
  const paths = [PATHS.payload, PATHS.review, PATHS.carrier]
  const commits = paths.map((repoPath) => git(root, ["log", "--diff-filter=A", "--format=%H", "--", repoPath]).split("\n").filter(Boolean))
  if (commits.some((items) => items.length !== 1) || new Set(commits.map((items) => items[0])).size !== 1)
    fail("V138_PLAN112_PUBLICATION_COMMIT_INVALID")
  const publication = commits[0]![0]!
  const changed = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", publication]).split("\n").filter(Boolean).sort()
  if (canonical(changed) !== canonical([...paths].sort())) fail("V138_PLAN112_PUBLICATION_SCOPE_INVALID")
  const records = paths.map((repoPath) => committed(root, publication, repoPath))
  if (records.some(({ mode }) => mode !== "100644")) fail("V138_PLAN112_PUBLICATION_MODE_INVALID")
  noRewrite(root, publication, paths)
  const expected = observeV138Plan112LiveV9Custody(root)
  if (!records[0]!.bytes.equals(Buffer.from(canonical(expected.payload))) ||
      !records[1]!.bytes.equals(expected.reviewBytes) ||
      !records[2]!.bytes.equals(Buffer.from(canonical(expected.carrier))))
    fail("V138_PLAN112_PUBLICATION_BYTES_INVALID")
  return { publicationCommit: publication, payloadRoot: expected.payload.payloadRoot,
    reviewRoot: expected.reviewRoot, carrierRoot: expected.carrier.carrierRoot }
}

const execute = (args: readonly string[]) => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN112_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeReview(root); return }
  if (args[0] === "--check-review") { process.stdout.write(`${JSON.stringify(checkReview(root))}\n`); return }
  fail("V138_PLAN112_ARGUMENTS_INVALID")
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
