#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { encodeCanonicalJson } from "../packages/spec/src/canonical-json-encode.js"
import { hashCanonicalIdentity } from "../packages/spec/src/canonical-identity-domains.js"
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.js"
import type { JsonValue } from "../packages/spec/src/types.js"
import {
  V138_CURRENT_STOPPED_BRANCH,
  V138_PREDECESSOR_AUTHORITY,
  evaluateV138DownstreamAuthority,
} from "./lib/v1-38-policy-authority.js"
import { buildV138PlanSupersessionManifest } from "./check-v1-38-dependency-revision-boundaries.js"

type Sha256 = `sha256:${string}`
type RecordValue = Record<string, unknown>

const defaultRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artifactPath = ".planning/artifacts/v1.38-pre-search-policy-root.json"
const supersessionPath = ".planning/artifacts/v1.38-phase-262-plan-supersession.json"
const generatorCheckerPath = "scripts/evaluate-v1-38-pre-search-policy.ts"
const testPath = "scripts/evaluate-v1-38-pre-search-policy.test.ts"
const authorityPath = "scripts/lib/v1-38-policy-authority.ts"
const replayTestPath = "packages/replay/src/historical-v1-4.test.ts"
const replayManifestPath = "packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json"
const frozenReplayCommit = "4fab0afc058232f37ba11506b5d04a1d59b2f4e0" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u

const componentSpecifications = Object.freeze([
  {
    id: "study_policy",
    path: ".planning/artifacts/v1.38-pre-search-study-policy.json",
    rootKey: "policyRoot",
    root: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17",
  },
  {
    id: "measurement_policy",
    path: ".planning/artifacts/v1.38-pre-search-measurement-policy.json",
    rootKey: "policyRoot",
    root: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95",
  },
  {
    id: "protocol_policy",
    path: ".planning/artifacts/v1.38-pre-formation-protocol-policy.json",
    rootKey: "protocolPolicyRoot",
    root: "sha256:34cec9aa1efc317cf07a33b6ff6cc31dd9bcc112625b0ff8fc1961fdda823cf3",
  },
  {
    id: "containment_policy",
    path: ".planning/artifacts/v1.38-pre-formation-containment-policy.json",
    rootKey: "artifactSha256",
    root: "sha256:4bdc3e87dc91ed67cc946be448eabd6d2a0bd08e0ec2f73f55b265ce6b9ad504",
  },
  {
    id: "synthetic_custody_mechanics",
    path: ".planning/artifacts/v1.38-synthetic-custody-mechanics.json",
    rootKey: "receiptRoot",
    root: "sha256:5615979933dfcf3aa0a65556084565adeaf5a0cfb7cc590b4126e0a02e295890",
  },
] as const)

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("V138_PRE_SEARCH_POLICY_CANONICAL_INVALID")
  return encoded.bytes
}

const rootIdentity = (value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("artifactManifest", [
    Buffer.from("cowards-game:v1.38:pre-search-policy-root:v1", "utf8"),
    canonicalBytes(value),
  ])}`

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: RecordValue, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

const asRecord = (value: unknown, code: string): RecordValue => {
  if (!isRecord(value)) throw new TypeError(code)
  return value
}

const readJsonBytes = (repoRoot: string, relativePath: string): { bytes: Buffer; value: RecordValue } => {
  const bytes = readFileSync(path.join(repoRoot, relativePath))
  return { bytes, value: asRecord(JSON.parse(bytes.toString("utf8")), "V138_PRE_SEARCH_POLICY_COMPONENT_INVALID") }
}

export interface V138PreSearchPolicyComponent {
  readonly id: (typeof componentSpecifications)[number]["id"]
  readonly path: (typeof componentSpecifications)[number]["path"]
  readonly root: Sha256
  readonly artifactSha256: Sha256
}

export interface V138PreSearchPolicySourceBindings {
  readonly generatorCheckerPath: typeof generatorCheckerPath
  readonly generatorCheckerSha256: Sha256
  readonly testPath: typeof testPath
  readonly testSha256: Sha256
  readonly authorityPath: typeof authorityPath
  readonly authoritySha256: Sha256
  readonly selectedPredecessorAdmissionRoot: typeof V138_PREDECESSOR_AUTHORITY.admissionRoot
  readonly supersessionPath: typeof supersessionPath
  readonly supersessionArtifactSha256: Sha256
  readonly supersessionManifestRoot: Sha256
  readonly replayTestPath: typeof replayTestPath
  readonly replayTestSha256: Sha256
  readonly replayManifestPath: typeof replayManifestPath
  readonly replayManifestSha256: Sha256
  readonly frozenReplayCommit: typeof frozenReplayCommit
}

export interface V138PreSearchPolicyRoot {
  readonly schemaVersion: "v1.38-pre-search-policy-root-v1"
  readonly rootKind: "pre_search_policy_root"
  readonly identityDomain: "cowards-game:v1.38:pre-search-policy-root:v1"
  readonly policyStatus: "ready"
  readonly matrixAdmissionStatus: "blocked"
  readonly custodyStatus: "unavailable"
  readonly downstreamAuthority: "denied"
  readonly phaseStatus: Readonly<{ execution: "in_progress"; verification: "gaps_found" }>
  readonly requirementReadiness: Readonly<{
    meas01Through10: "ready"
    deci02: "ready"
    admit03: "blocked"
    seal01: "unavailable"
  }>
  readonly denials: Readonly<{
    satisfiesAdmit03: false
    satisfiesSeal01: false
    candidateSearchAuthorized: false
    phase263Authorized: false
    formationMaterializationAuthorized: false
    productionAuthorized: false
  }>
  readonly components: readonly V138PreSearchPolicyComponent[]
  readonly predecessor: Readonly<{
    archiveCommit: typeof V138_PREDECESSOR_AUTHORITY.archiveCommit
    selectedTupleId: typeof V138_PREDECESSOR_AUTHORITY.selectedTupleId
    admissionRoot: typeof V138_PREDECESSOR_AUTHORITY.admissionRoot
    joinStatus: "passed_exact"
    matrixAdmissionStatus: "blocked"
    routeOrdinal: 5
    routeTerminal: "calibration_stopped"
    freshCharged: 0
    freshAccepted: 0
    authorityExpired: true
    noRetry: true
  }>
  readonly sourceBindings: V138PreSearchPolicySourceBindings
  readonly tooling_dependency: "frozen_replay_commit_unreachable"
  readonly policyRoot: Sha256
}

const denialKeys = Object.freeze([
  "satisfiesAdmit03",
  "satisfiesSeal01",
  "candidateSearchAuthorized",
  "phase263Authorized",
  "formationMaterializationAuthorized",
  "productionAuthorized",
] as const)

const componentKeys = Object.freeze(["id", "path", "root", "artifactSha256"] as const)
const sourceBindingKeys = Object.freeze([
  "generatorCheckerPath",
  "generatorCheckerSha256",
  "testPath",
  "testSha256",
  "authorityPath",
  "authoritySha256",
  "selectedPredecessorAdmissionRoot",
  "supersessionPath",
  "supersessionArtifactSha256",
  "supersessionManifestRoot",
  "replayTestPath",
  "replayTestSha256",
  "replayManifestPath",
  "replayManifestSha256",
  "frozenReplayCommit",
] as const)
const rootKeys = Object.freeze([
  "schemaVersion",
  "rootKind",
  "identityDomain",
  "policyStatus",
  "matrixAdmissionStatus",
  "custodyStatus",
  "downstreamAuthority",
  "phaseStatus",
  "requirementReadiness",
  "denials",
  "components",
  "predecessor",
  "sourceBindings",
  "tooling_dependency",
  "policyRoot",
] as const)

const assertAllFalseAuthority = (value: unknown): void => {
  const authority = asRecord(value, "V138_PRE_SEARCH_POLICY_COMPONENT_AUTHORITY_INVALID")
  for (const [key, entry] of Object.entries(authority)) {
    if ((key.endsWith("Authorized") || key.startsWith("satisfies")) && entry !== false) {
      throw new TypeError("V138_PRE_SEARCH_POLICY_COMPONENT_AUTHORITY_INVALID")
    }
  }
}

const validateComponents = (value: unknown): readonly V138PreSearchPolicyComponent[] => {
  if (!Array.isArray(value) || value.length !== componentSpecifications.length) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_COMPONENTS_INVALID")
  }
  value.forEach((entry, index) => {
    const record = asRecord(entry, "V138_PRE_SEARCH_POLICY_COMPONENTS_INVALID")
    const expected = componentSpecifications[index]!
    if (!exactKeys(record, componentKeys) || record.id !== expected.id || record.path !== expected.path ||
      typeof record.root !== "string" || !SHA256.test(record.root) ||
      typeof record.artifactSha256 !== "string" || !SHA256.test(record.artifactSha256)) {
      throw new TypeError("V138_PRE_SEARCH_POLICY_COMPONENTS_INVALID")
    }
  })
  return value as unknown as readonly V138PreSearchPolicyComponent[]
}

const validateSourceBindings = (value: unknown): V138PreSearchPolicySourceBindings => {
  const bindings = asRecord(value, "V138_PRE_SEARCH_POLICY_SOURCE_BINDINGS_INVALID")
  if (!exactKeys(bindings, sourceBindingKeys) ||
    bindings.generatorCheckerPath !== generatorCheckerPath || bindings.testPath !== testPath ||
    bindings.authorityPath !== authorityPath || bindings.supersessionPath !== supersessionPath ||
    bindings.selectedPredecessorAdmissionRoot !== V138_PREDECESSOR_AUTHORITY.admissionRoot ||
    bindings.replayTestPath !== replayTestPath || bindings.replayManifestPath !== replayManifestPath ||
    bindings.frozenReplayCommit !== frozenReplayCommit ||
    [bindings.generatorCheckerSha256, bindings.testSha256, bindings.authoritySha256,
      bindings.supersessionArtifactSha256, bindings.supersessionManifestRoot,
      bindings.replayTestSha256, bindings.replayManifestSha256]
      .some((entry) => typeof entry !== "string" || !SHA256.test(entry))) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_SOURCE_BINDINGS_INVALID")
  }
  return bindings as unknown as V138PreSearchPolicySourceBindings
}

export const validateV138PreSearchSupersession = (input: unknown): Sha256 => {
  const value = asRecord(input, "V138_PRE_SEARCH_POLICY_SUPERSESSION_INVALID")
  const expected = buildV138PlanSupersessionManifest()
  if (value.schemaVersion !== expected.schemaVersion ||
    Buffer.from(canonicalBytes(value)).compare(Buffer.from(canonicalBytes(expected))) !== 0) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_SUPERSESSION_INVALID")
  }
  return expected.manifestRoot
}

export interface V138PreSearchPolicyBuildInput {
  readonly components: readonly V138PreSearchPolicyComponent[]
  readonly sourceBindings: V138PreSearchPolicySourceBindings
  readonly tooling_dependency: "frozen_replay_commit_unreachable"
}

export const buildV138PreSearchPolicyRoot = (input: V138PreSearchPolicyBuildInput): V138PreSearchPolicyRoot => {
  if (!isRecord(input) || !exactKeys(input, ["components", "sourceBindings", "tooling_dependency"])) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_INPUT_INVALID")
  }
  const components = validateComponents(input.components)
  const sourceBindings = validateSourceBindings(input.sourceBindings)
  if (input.tooling_dependency !== "frozen_replay_commit_unreachable") {
    throw new TypeError("V138_PRE_SEARCH_POLICY_INPUT_INVALID")
  }
  const downstreamAuthority = evaluateV138DownstreamAuthority({
    policyStatus: "ready",
    matrixAdmissionStatus: "blocked",
    custodyStatus: "unavailable",
    containmentPassed: true,
    identitiesJoined: true,
  })
  if (downstreamAuthority !== "denied") throw new TypeError("V138_PRE_SEARCH_POLICY_AUTHORITY_INVALID")

  const frame = {
    schemaVersion: "v1.38-pre-search-policy-root-v1" as const,
    rootKind: "pre_search_policy_root" as const,
    identityDomain: "cowards-game:v1.38:pre-search-policy-root:v1" as const,
    policyStatus: "ready" as const,
    matrixAdmissionStatus: "blocked" as const,
    custodyStatus: "unavailable" as const,
    downstreamAuthority: "denied" as const,
    phaseStatus: Object.freeze({ execution: "in_progress" as const, verification: "gaps_found" as const }),
    requirementReadiness: Object.freeze({
      meas01Through10: "ready" as const,
      deci02: "ready" as const,
      admit03: "blocked" as const,
      seal01: "unavailable" as const,
    }),
    denials: Object.freeze({
      satisfiesAdmit03: false as const,
      satisfiesSeal01: false as const,
      candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      productionAuthorized: false as const,
    }),
    components: Object.freeze(components.map((entry) => Object.freeze({ ...entry }))),
    predecessor: Object.freeze({
      archiveCommit: V138_PREDECESSOR_AUTHORITY.archiveCommit,
      selectedTupleId: V138_PREDECESSOR_AUTHORITY.selectedTupleId,
      admissionRoot: V138_PREDECESSOR_AUTHORITY.admissionRoot,
      joinStatus: V138_PREDECESSOR_AUTHORITY.joinStatus,
      matrixAdmissionStatus: "blocked" as const,
      routeOrdinal: V138_CURRENT_STOPPED_BRANCH.routeOrdinal,
      routeTerminal: V138_CURRENT_STOPPED_BRANCH.disposition,
      freshCharged: V138_CURRENT_STOPPED_BRANCH.freshCharged,
      freshAccepted: V138_CURRENT_STOPPED_BRANCH.freshAccepted,
      authorityExpired: V138_CURRENT_STOPPED_BRANCH.authorityExpired,
      noRetry: V138_CURRENT_STOPPED_BRANCH.noRetry,
    }),
    sourceBindings: Object.freeze({ ...sourceBindings }),
    tooling_dependency: input.tooling_dependency,
  }
  const result = Object.freeze({ ...frame, policyRoot: rootIdentity(frame) })
  assertPublicOutputLeakSafe(result, "v1.38 pre-search policy root")
  return result
}

const validateComponentArtifact = (
  specification: (typeof componentSpecifications)[number],
  value: RecordValue,
): void => {
  const authority = value.authority
  if (authority !== undefined) assertAllFalseAuthority(authority)
  if (specification.id === "study_policy" &&
    (value.schemaVersion !== "v1.38-pre-search-study-policy-v1" || value.policyStatus !== "ready" ||
      value.policyKind !== "pre_search_study_policy" || value.policyRoot !== specification.root)) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_STUDY_INVALID")
  }
  if (specification.id === "measurement_policy" &&
    (value.schemaVersion !== "v1.38-pre-search-measurement-policy-v1" || value.policyStatus !== "ready" ||
      value.policyKind !== "pre_search_measurement_policy" || value.policyRoot !== specification.root ||
      value.studyPolicyRoot !== componentSpecifications[0].root)) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_MEASUREMENT_INVALID")
  }
  if (specification.id === "protocol_policy" &&
    (value.schemaVersion !== "v1.38-pre-formation-protocol-policy-v1" || value.policyStatus !== "ready" ||
      value.protocolOnly !== true || value.materialization !== "forbidden_before_phase_267")) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_PROTOCOL_INVALID")
  }
  if (specification.id === "containment_policy" &&
    (value.schemaVersion !== "v1.38-pre-formation-containment-policy-v1" || value.status !== "passed_absence" ||
      value.findingCount !== 0 || value.protocolPolicyRoot !== componentSpecifications[2].root ||
      sha256(`${Buffer.from(canonicalBytes(value)).toString("utf8")}\n`) !== specification.root)) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_CONTAINMENT_INVALID")
  }
  if (specification.id === "synthetic_custody_mechanics" &&
    (value.schemaVersion !== "v1.38-synthetic-custody-mechanics-v1" || value.mechanicsStatus !== "passed" ||
      value.custodyStatus !== "unavailable" || value.satisfiesSeal01 !== false ||
      value.receiptRoot !== specification.root)) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_CUSTODY_INVALID")
  }
  const admission = value.admission
  if (admission !== undefined) {
    const record = asRecord(admission, "V138_PRE_SEARCH_POLICY_ADMISSION_INVALID")
    if (record.admit03 !== "blocked" || record.matrixAdmissionStatus !== "blocked") {
      throw new TypeError("V138_PRE_SEARCH_POLICY_ADMISSION_INVALID")
    }
  }
  const custody = value.custody
  if (custody !== undefined) {
    const record = asRecord(custody, "V138_PRE_SEARCH_POLICY_CUSTODY_INVALID")
    if (record.custodyClaimed !== false || record.seal01 !== "unmet") {
      throw new TypeError("V138_PRE_SEARCH_POLICY_CUSTODY_INVALID")
    }
  }
}

export const generateV138PreSearchPolicyRoot = (repoRoot = defaultRepoRoot): V138PreSearchPolicyRoot => {
  const components = componentSpecifications.map((specification) => {
    const { bytes, value } = readJsonBytes(repoRoot, specification.path)
    validateComponentArtifact(specification, value)
    return Object.freeze({
      id: specification.id,
      path: specification.path,
      root: specification.root as Sha256,
      artifactSha256: sha256(bytes),
    })
  })
  const supersession = readJsonBytes(repoRoot, supersessionPath)
  const supersessionManifestRoot = validateV138PreSearchSupersession(supersession.value)
  const tooling = asRecord(supersession.value.toolingDependency, "V138_PRE_SEARCH_POLICY_TOOLING_INVALID")
  const replayTestBytes = readFileSync(path.join(repoRoot, replayTestPath))
  const replayManifestBytes = readFileSync(path.join(repoRoot, replayManifestPath))
  const replayManifest = asRecord(JSON.parse(replayManifestBytes.toString("utf8")), "V138_PRE_SEARCH_POLICY_TOOLING_INVALID")
  const frozenSources = asRecord(replayManifest.frozenSources, "V138_PRE_SEARCH_POLICY_TOOLING_INVALID")
  const replayCommitProbe = spawnSync("git", ["cat-file", "-e", `${frozenReplayCommit}^{commit}`], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
  if (tooling.tooling_dependency !== "frozen_replay_commit_unreachable" ||
    tooling.frozenCommit !== frozenReplayCommit || tooling.substitutionAllowed !== false ||
    tooling.replayManifestMutationAllowed !== false || frozenSources.commit !== frozenReplayCommit ||
    !replayTestBytes.toString("utf8").includes(`const expectedFrozenSourceCommit =\n  "${frozenReplayCommit}" as const`) ||
    replayCommitProbe.status === 0) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_TOOLING_INVALID")
  }
  return buildV138PreSearchPolicyRoot({
    components,
    sourceBindings: {
      generatorCheckerPath,
      generatorCheckerSha256: sha256(readFileSync(path.join(repoRoot, generatorCheckerPath))),
      testPath,
      testSha256: sha256(readFileSync(path.join(repoRoot, testPath))),
      authorityPath,
      authoritySha256: sha256(readFileSync(path.join(repoRoot, authorityPath))),
      selectedPredecessorAdmissionRoot: V138_PREDECESSOR_AUTHORITY.admissionRoot,
      supersessionPath,
      supersessionArtifactSha256: sha256(supersession.bytes),
      supersessionManifestRoot,
      replayTestPath,
      replayTestSha256: sha256(replayTestBytes),
      replayManifestPath,
      replayManifestSha256: sha256(replayManifestBytes),
      frozenReplayCommit,
    },
    tooling_dependency: "frozen_replay_commit_unreachable",
  })
}

export const validateV138PreSearchPolicyRoot = (input: unknown): V138PreSearchPolicyRoot => {
  const value = asRecord(input, "V138_PRE_SEARCH_POLICY_ROOT_INVALID")
  if (!exactKeys(value, rootKeys) || value.schemaVersion !== "v1.38-pre-search-policy-root-v1" ||
    value.rootKind !== "pre_search_policy_root" || value.identityDomain !== "cowards-game:v1.38:pre-search-policy-root:v1" ||
    value.policyStatus !== "ready" || value.matrixAdmissionStatus !== "blocked" || value.custodyStatus !== "unavailable" ||
    value.downstreamAuthority !== "denied" || value.tooling_dependency !== "frozen_replay_commit_unreachable") {
    throw new TypeError("V138_PRE_SEARCH_POLICY_ROOT_INVALID")
  }
  const denials = asRecord(value.denials, "V138_PRE_SEARCH_POLICY_DENIALS_INVALID")
  if (!exactKeys(denials, denialKeys) || denialKeys.some((key) => denials[key] !== false)) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_DENIALS_INVALID")
  }
  const phaseStatus = asRecord(value.phaseStatus, "V138_PRE_SEARCH_POLICY_STATUS_INVALID")
  const readiness = asRecord(value.requirementReadiness, "V138_PRE_SEARCH_POLICY_STATUS_INVALID")
  const predecessor = asRecord(value.predecessor, "V138_PRE_SEARCH_POLICY_PREDECESSOR_INVALID")
  if (!exactKeys(phaseStatus, ["execution", "verification"]) || phaseStatus.execution !== "in_progress" ||
    phaseStatus.verification !== "gaps_found" ||
    !exactKeys(readiness, ["meas01Through10", "deci02", "admit03", "seal01"]) ||
    readiness.meas01Through10 !== "ready" || readiness.deci02 !== "ready" || readiness.admit03 !== "blocked" ||
    readiness.seal01 !== "unavailable" || predecessor.routeTerminal !== "calibration_stopped" ||
    predecessor.matrixAdmissionStatus !== "blocked" || predecessor.freshCharged !== 0 || predecessor.freshAccepted !== 0 ||
    predecessor.authorityExpired !== true || predecessor.noRetry !== true ||
    predecessor.admissionRoot !== V138_PREDECESSOR_AUTHORITY.admissionRoot) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_STATUS_INVALID")
  }
  const components = validateComponents(value.components)
  const sourceBindings = validateSourceBindings(value.sourceBindings)
  const { policyRoot: _policyRoot, ...frame } = value
  if (typeof value.policyRoot !== "string" || value.policyRoot !== rootIdentity(frame)) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_ROOT_MISMATCH")
  }
  assertPublicOutputLeakSafe(value, "v1.38 pre-search policy root")
  return value as unknown as V138PreSearchPolicyRoot
}

export const renderV138PreSearchPolicyRoot = (root = generateV138PreSearchPolicyRoot()): string =>
  `${Buffer.from(canonicalBytes(validateV138PreSearchPolicyRoot(root))).toString("utf8")}\n`

export const writeV138PreSearchPolicyRoot = (repoRoot = defaultRepoRoot): V138PreSearchPolicyRoot => {
  const result = generateV138PreSearchPolicyRoot(repoRoot)
  const target = path.join(repoRoot, artifactPath)
  const temporary = `${target}.tmp-${process.pid}`
  if (existsSync(temporary)) throw new TypeError("V138_PRE_SEARCH_POLICY_TEMP_EXISTS")
  try {
    writeFileSync(temporary, renderV138PreSearchPolicyRoot(result), { flag: "wx", mode: 0o644 })
    renameSync(temporary, target)
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary)
    throw error
  }
  return result
}

export const checkV138PreSearchPolicyRoot = (repoRoot = defaultRepoRoot): V138PreSearchPolicyRoot => {
  const target = path.join(repoRoot, artifactPath)
  if (!existsSync(target)) throw new TypeError("V138_PRE_SEARCH_POLICY_ARTIFACT_MISSING")
  const expected = generateV138PreSearchPolicyRoot(repoRoot)
  const actualBytes = readFileSync(target, "utf8")
  const actual = validateV138PreSearchPolicyRoot(JSON.parse(actualBytes))
  if (actualBytes !== renderV138PreSearchPolicyRoot(expected) || actual.policyRoot !== expected.policyRoot) {
    throw new TypeError("V138_PRE_SEARCH_POLICY_ARTIFACT_EDITED")
  }
  return actual
}

const publicSummary = (result: V138PreSearchPolicyRoot) => Object.freeze({
  rootKind: result.rootKind,
  policyRoot: result.policyRoot,
  policyStatus: result.policyStatus,
  matrixAdmissionStatus: result.matrixAdmissionStatus,
  custodyStatus: result.custodyStatus,
  downstreamAuthority: result.downstreamAuthority,
  phaseStatus: result.phaseStatus,
  denials: result.denials,
  tooling_dependency: result.tooling_dependency,
})

const isDirectExecution = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  try {
    const args = process.argv.slice(2)
    const result = args.length === 1 && args[0] === "--write"
      ? writeV138PreSearchPolicyRoot(defaultRepoRoot)
      : args.length === 1 && args[0] === "--check"
        ? checkV138PreSearchPolicyRoot(defaultRepoRoot)
        : (() => { throw new TypeError("V138_PRE_SEARCH_POLICY_MODE_INVALID") })()
    process.stdout.write(`${JSON.stringify(publicSummary(result))}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V138_PRE_SEARCH_POLICY_FAILED"}\n`)
    process.exitCode = 1
  }
}
