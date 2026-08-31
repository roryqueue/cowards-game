import { describe, expect, it, vi } from "vitest"
import path from "node:path"
import { fileURLToPath } from "node:url"
import fs, { chmodSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import childProcess, { execFileSync } from "node:child_process"
import { syncBuiltinESMExports } from "node:module"
import {
  inspectV138Plan143Source, inspectV138Plan143Runtime, checkV138Plan143Absence,
  validateV138Plan143Execution, buildV138Plan143Review, authenticateV138Plan143Batch,
  inspectV138Plan143CurrentSource, inspectV138Plan143ProducerBoundary,
  validateV138Plan143EffectValues, V138_PLAN143_EFFECTS,
  validateV138Plan143PublishedContract,
  inspectV138Plan143Imports,
  inspectV138Plan143Metadata,
  retainV138Plan143RuntimeForReview,
  checkV138Plan143PrivateRuntimeCopyForReview,
} from "./check-v1-38-plan-262-143-live-v13-custody-review-v10.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
describe("Plan143 independently authored custody reviewer", () => {
  it("independently authenticates exact closed Plan142 custody", () => {
    const value = inspectV138Plan143Source(ROOT)
    expect(value.sourceCommit).toBe("61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3")
    expect(value.trackingCommit).toBe("7edcac4f5977ea8f006b1369536414c8006e64bd")
    expect(value.plan110Eligible).toBe(false)
  })
  it("independently discovers and pins every semantic runtime implementation byte", () => {
    const value = inspectV138Plan143Runtime(ROOT)
    expect(value.entries).toHaveLength(3931)
    expect(value.semanticRuntimeRoot).toBe("sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e")
  })
  it("requires descriptor-bound absence of all eleven destinations", () => {
    expect(checkV138Plan143Absence(ROOT)).toBe(true)
  })
  it("never treats fabricated execution or empty batch as evidence", () => {
    expect(() => validateV138Plan143Execution({}, "sha256:" + "0".repeat(64), "sha256:" + "0".repeat(64))).toThrow()
    expect(() => authenticateV138Plan143Batch([], ROOT)).toThrow()
    expect(typeof buildV138Plan143Review).toBe("function")
  })
})

// This fixture implements the frozen Plan144 contract, not a subject validator or
// renderer. Only the raw installed entries are borrowed from discovery.
type Fixture = Record<string, any>
const fixtureCanonical = (input: any): string => {
  const order = (v: any): any => Array.isArray(v) ? v.map(order) : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort((a, b) => a.localeCompare(b)).map(k => [k, order(v[k])])) : v
  return JSON.stringify(order(input)) + "\n"
}
const fixtureSha = (bytes: string | Buffer) => "sha256:" + createHash("sha256").update(bytes).digest("hex")
const fixtureHash = (domain: string, value: any) => fixtureSha(domain + "\0" + fixtureCanonical(value))
const fixtureH = (suffix: string, value: any) => fixtureHash("v138-plan143-v10-" + suffix, value)
const without = (v: Fixture, ...names: string[]) => Object.fromEntries(Object.entries(v).filter(([k]) => !names.includes(k)))
const FAKE_SHA = "sha256:" + "a".repeat(64)
const FIXTURE_PAYLOAD_PATH = ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-payload-v10.json"
const FIXTURE_REVIEW_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-143-REVIEW-v10.md"
const CURRENT_SOURCE = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"
const REVIEWER_SOURCE = "scripts/check-v1-38-plan-262-143-live-v13-custody-review-v10.ts"
const fixtureNative = [
  { path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644", blob: "ca694310a8a99c30d7a4070a415b968d3e341409", sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" },
  { path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644", blob: "99da3517ccb8b919759663daf713b4f20337b8b1", sha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" },
]
const fixtureZero = { downstreamAuthority: "denied", freshAccepted: 0, freshCharged: 0, liveInvoked: false, producerCalls: 0, readinessInvoked: false }
const fixtureCounters = { producerCalls: 0, readinessCalls: 0, liveCalls: 0, freshCharged: 0, freshAccepted: 0 }
const fixtureModes = ["source-only", "prospective-custody", "post-no-effect", "non-pass-value", "bounded-success-value", "exact-reproduction-v17-value"]
const fixtureStatuses = ["source_only_checked", "prospective_custody_checked", "post_run_no_effect_custody_checked", "bounded_non_pass_value_checked", "bounded_success_value_checked", "exact_reproduction_v17_value_checked"]
const fixtureReduced = [fixtureZero, fixtureZero, fixtureZero, { classification: "non_pass", reproductionEligible: false },
  { classification: "bounded_success", reproductionEligible: true }, { acceptedCells: 540, exact: true, requiredAccepted: 540 }]
const historicalFixture = () => {
  const repositoryClosureRoot = "sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d"
  const semanticRuntimeRoot = "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e"
  const modes = ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody", "--check-non-pass-value", "--check-bounded-success-value", "--check-exact-reproduction-v17-value"]
  const records = modes.map((mode, ordinal) => {
    const body = { repositoryClosureRoot, semanticRuntimeRoot, nativeIdentities: fixtureNative, mode, ordinal, reducedValue: fixtureReduced[ordinal], producerGuardCount: 0 }
    return { ...body, stableRecordRoot: fixtureHash("v138-plan-262-142-stable-execution-record-v10", body) }
  })
  return { sourceCommit: "61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3", summaryCommit: "53509033a03a7a6661cb519c76c70d437b6d86c3",
    trackingCommit: "7edcac4f5977ea8f006b1369536414c8006e64bd", sourceRoot: "sha256:902fd55d157cba70b4933499c45a8855fc1df6bd373748bd3d7853daf70f22c1",
    semanticRuntimeClosureRoot: semanticRuntimeRoot, repositoryClosureRoot,
    observationsRoot: fixtureHash("v138-plan-262-142-stable-observations-v10", records), plan110Eligible: false }
}
// Repair all enclosing commitments while retaining the attacked field itself.
const sealFixture = (v: Fixture, attacked = "") => {
  const p = v.payload, c = v.carrier, k = p.canonicalCustody, e = p.currentExecution
  const put = (object: Fixture, key: string, value: any, at: string) => { if (attacked !== at + "." + key) object[key] = value }
  for (const name of ["consumerSubject", "reviewerSubject"]) put(p[name], "subjectRoot", fixtureH("subject", without(p[name], "subjectRoot")), "payload." + name)
  put(k, "semanticRuntimeClosureRoot", fixtureH("runtime-closure", k.semanticRuntimeInventory), "payload.canonicalCustody")
  put(k, "nativeIdentityRoot", fixtureH("native-identities", k.nativeIdentities), "payload.canonicalCustody")
  put(k, "canonicalLocalExecutionClosureRoot", fixtureH("canonical-custody", without(k, "canonicalLocalExecutionClosureRoot")), "payload.canonicalCustody")
  put(e, "subjectRoot", p.consumerSubject.subjectRoot, "payload.currentExecution")
  e.observations.forEach((r: Fixture, i: number) => {
    const at = "payload.currentExecution.observations." + i
    for (const [key, value] of Object.entries({ subjectRoot: p.consumerSubject.subjectRoot, repositoryClosureRoot: k.repositoryClosureRoot,
      semanticRuntimeClosureRoot: k.semanticRuntimeClosureRoot, nativeIdentityRoot: k.nativeIdentityRoot })) put(r, key, value, at)
    put(r, "executionRoot", fixtureH("execution", without(r, "executionRoot", "observationRoot")), at)
    put(r, "observationRoot", fixtureH("observation", without(r, "observationRoot")), at)
  })
  put(e, "observationsRoot", fixtureH("observations", e.observations), "payload.currentExecution")
  if (!attacked.startsWith("payload.reproductionProof.normalizedEvidenceRoots")) p.reproductionProof.normalizedEvidenceRoots = [fixtureH("reproduction", e), fixtureH("reproduction", e)]
  put(p, "payloadRoot", fixtureH("payload", without(p, "payloadRoot")), "payload")
  const review = ["# Plan 262-143 live-v14 custody review v10", "", `Payload: ${FIXTURE_PAYLOAD_PATH}`,
    `Payload SHA-256: ${fixtureSha(fixtureCanonical(p))}`, `Payload root: ${p.payloadRoot}`,
    `Consumer subject: ${p.consumerSubject.subjectRoot}`, `Reviewer subject: ${p.reviewerSubject.subjectRoot}`,
    "Findings: 0", "Privacy findings: 0", "Authorizes execution: false", "Downstream authority: denied", "",
    "Limitations: private single-operator snapshot; no continuing absence or hostile-same-UID isolation.", ""].join("\n")
  if (attacked !== "review") v.review = review
  for (const [key, value] of Object.entries({ payloadPath: FIXTURE_PAYLOAD_PATH, payloadSha256: fixtureSha(fixtureCanonical(p)), payloadRoot: p.payloadRoot,
    reviewPath: FIXTURE_REVIEW_PATH, reviewSha256: fixtureSha(v.review), consumerSubjectRoot: p.consumerSubject.subjectRoot,
    reviewerSubjectRoot: p.reviewerSubject.subjectRoot, semanticRuntimeClosureRoot: k.semanticRuntimeClosureRoot, currentObservationsRoot: e.observationsRoot })) put(c, key, value, "carrier")
  put(c, "carrierRoot", fixtureH("carrier", without(c, "carrierRoot")), "carrier")
  return v
}
let fixtureCache: Fixture | undefined
const independentFixture = (): Fixture => {
  if (fixtureCache) return structuredClone(fixtureCache)
  const subject = (plan: string, source: string): Fixture => ({ plan, commit: "a".repeat(40), tree: "b".repeat(40), parent: "c".repeat(40), repositoryClosureRoot: FAKE_SHA,
    files: [source.replace(/\.ts$/, ".test.ts"), source].sort().map(path => ({ path, mode: "100644", blob: "d".repeat(40), sha256: FAKE_SHA })) })
  const consumer = subject("262-144", CURRENT_SOURCE)
  Object.assign(consumer, { commit: "80936682ec7f1d63f2ea5dfdd87c99ccb97966b7", tree: "b375e61bca63af1043b0b597304e88a046c05cc5", parent: "26601a5ec094f9524cacc4c89ad2ae3955ba3b89", repositoryClosureRoot: "sha256:25d8387b7fc87923c584dc85f6bc4f4856f65e2a76086eb2a615e127229335a8" })
  consumer.files = [
    { path: CURRENT_SOURCE.replace(/\.ts$/, ".test.ts"), mode: "100644", blob: "ee2585a5ea555bc8221c825db9a10990cd1b9cc3", sha256: "sha256:2d26e6636868f79a262722736b09fa039252bc0cd3fc246223681a220097820e" },
    { path: CURRENT_SOURCE, mode: "100644", blob: "45bf7bd7cb381a3bf6b6899ddd2dab3562e45f40", sha256: "sha256:8cd920e6c6af34fb09a24d03246bed2ed5f0f658090de1f5a17ad6a166b63807" },
  ]
  const dispositions = [
    ["v3", "262-122", "process_invalid_false_clean_custody"], ["v4", "262-131", "process_invalid_descendant_and_observation_validation"],
    ["v5", "262-133", "process_invalid_authority_carrier_validation"], ["v6", "262-134", "process_invalid_cross_root_cache_and_absolute_path_evidence"],
    ["v7", "262-136", "process_invalid_genuine_to_stable_native_mapping"], ["v8", "262-138", "process_invalid_unauthenticated_executor_metadata_and_effect_gate"],
    ["v9", "262-140", "process_invalid_incomplete_runtime_cross_root_laundering_and_ancestor_symlink_gate"],
  ].map(([version, plan, disposition]) => ({ version, plan, disposition, eligible: false }))
  const common = { consumerVersion: "live-v14", consumerPlan: "262-144", findingCount: 0, privacyFindingCount: 0, plan110Eligible: true,
    authorizesExecution: false, downstreamAuthority: "denied", counters: fixtureCounters, requiredAccepted: 540 }
  const entries = structuredClone(inspectV138Plan143Runtime(ROOT).entries)
  expect(entries).toHaveLength(3931)
  expect(fixtureH("runtime-closure", entries)).toBe("sha256:23c3e69706042753c77e40d1b8ecc42416e2b59e2eb063504ab4c41061a3ceae")
  fixtureCache = sealFixture({ payload: { ...common, schemaVersion: "v1.38-plan-262-143-live-v14-custody-review-payload-v10", consumerSubject: consumer,
    reviewerSubject: subject("262-143", REVIEWER_SOURCE), historical142: historicalFixture(), historicalDispositions: dispositions,
    canonicalCustody: { repositoryClosureRoot: consumer.repositoryClosureRoot, semanticRuntimeInventory: entries, nativeIdentities: fixtureNative,
      metadataPredicate: "private_bound_bare_snapshot_v1", provenancePredicate: "fresh_root_bound_private_transcript_v1" },
    currentExecution: { observations: fixtureModes.map((mode, ordinal) => ({ mode, ordinal, status: fixtureStatuses[ordinal], reducedValue: structuredClone(fixtureReduced[ordinal]) })),
      actualModesPassed: 6, producerGuardCount: 0, guardTransformRoot: "sha256:b95b2684fbb275039a6325a3c816af05d91bd0c7f24ae557f7d0eac71338ffcd" },
    reproductionProof: { processCount: 2, rootCount: 2, equal: true }, findings: [] }, review: "", carrier: { ...common, schemaVersion: "v1.38-plan-262-143-live-v14-custody-review-carrier-v10" } })
  return structuredClone(fixtureCache)
}

describe("pure predicate independent rehashed contract", () => {
  it("accepts the independently encoded current fixture without granting provenance", () => {
    expect(validateV138Plan143PublishedContract(independentFixture())).toBe(true)
  })
  it("rejects every stored semantic scalar with enclosing commitments repaired", () => {
    const baseline = independentFixture()
    const paths: string[] = []
    const visit = (v: any, prefix: string) => {
      if (prefix === "payload.canonicalCustody.semanticRuntimeInventory" || prefix.startsWith("payload.reviewerSubject.files") ||
        ["payload.reviewerSubject.commit", "payload.reviewerSubject.tree", "payload.reviewerSubject.parent", "payload.reviewerSubject.repositoryClosureRoot"].includes(prefix)) return
      if (v !== null && typeof v === "object") for (const key of Object.keys(v)) visit(v[key], prefix ? prefix + "." + key : key)
      else paths.push(prefix)
    }
    visit(baseline, "")
    expect(paths.length).toBeGreaterThan(180)
    for (const location of paths) {
      const v = structuredClone(baseline), parts = location.split("."), key = parts.pop()!
      const parent = parts.reduce((value, part) => value[part], v)
      const before = parent[key]
      parent[key] = typeof before === "boolean" ? !before : typeof before === "number" ? before + 1 : before === FAKE_SHA ? "sha256:" + "b".repeat(64) : typeof before === "string" && before.startsWith("sha256:") ? FAKE_SHA : "invalid"
      sealFixture(v, location)
      expect(() => validateV138Plan143PublishedContract(v), location).toThrow()
    }
  }, 60000)
  it("rejects nested extension keys independently of repaired enclosing roots", () => {
    const baseline = independentFixture(), paths = ["", "payload", "carrier", "payload.consumerSubject", "payload.reviewerSubject", "payload.consumerSubject.files.0",
      "payload.reviewerSubject.files.0", "payload.historical142", "payload.historicalDispositions.0", "payload.canonicalCustody", "payload.canonicalCustody.semanticRuntimeInventory.0",
      "payload.canonicalCustody.nativeIdentities.0", "payload.currentExecution", "payload.reproductionProof", "payload.counters", "carrier.counters",
      ...Array.from({ length: 6 }, (_, i) => `payload.currentExecution.observations.${i}`),
      ...Array.from({ length: 6 }, (_, i) => `payload.currentExecution.observations.${i}.reducedValue`)]
    for (const location of paths) {
      const v = structuredClone(baseline), parent = location ? location.split(".").reduce((value, part) => value[part], v) : v
      parent.extension = false
      sealFixture(v)
      expect(() => validateV138Plan143PublishedContract(v), location).toThrow()
    }
  })
  it("rejects runtime class, omission, duplication, ordering, and coherent root substitutions", () => {
    const baseline = independentFixture(), entries = baseline.payload.canonicalCustody.semanticRuntimeInventory
    const picks = new Set<number>([0, Math.floor(entries.length / 2), entries.length - 1])
    for (const pattern of [/runtime\/node\//, /launcher\//, /typescript.*lib\/typescript\.js$/, /tsx.*dist\//, /esbuild.*lib\/main\.js$/, /@esbuild.*bin\/esbuild$/, /runtime\/distribution\//]) {
      const index = entries.findIndex((entry: Fixture) => pattern.test(entry.identity)); expect(index, String(pattern)).toBeGreaterThanOrEqual(0); picks.add(index)
    }
    for (const index of picks) for (const [field, value] of Object.entries({ identity: "runtime/../escape", mode: "120000", size: -1, sha256: FAKE_SHA })) {
      const v = structuredClone(baseline); v.payload.canonicalCustody.semanticRuntimeInventory[index][field] = value; sealFixture(v)
      expect(() => validateV138Plan143PublishedContract(v), `${index}:${field}`).toThrow()
    }
    for (const change of [(a: any[]) => a.pop(), (a: any[]) => a.push(a[0]), (a: any[]) => a.reverse(), (a: any[]) => { a[1] = a[0] }]) {
      const v = structuredClone(baseline); change(v.payload.canonicalCustody.semanticRuntimeInventory); sealFixture(v)
      expect(() => validateV138Plan143PublishedContract(v)).toThrow()
    }
  })
  it("rejects non-JSON values without invoking getters or toJSON", () => {
    let called = 0
    const accessor = Object.defineProperty({}, "payload", { enumerable: true, get() { called++; return {} } })
    const cyclic: any = {}; cyclic.self = cyclic
    for (const v of [accessor, cyclic, { toJSON() { called++; return {} } }, { x: undefined }, { x: NaN }, { x: Infinity }, { x: 1n },
      { x: new Date(0) }, { x: new Map() }, { x: new Set() }, { x: Array(2) }, { [Symbol("hidden")]: false }, Object.defineProperty({}, "hidden", { value: 1 })]) {
      expect(() => validateV138Plan143PublishedContract(v)).toThrow()
    }
    expect(called).toBe(0)
  })
  it("rejects omitted and duplicated ordered records, nonempty findings and malformed subject files", () => {
    const baseline = independentFixture()
    for (const change of [
      (v: Fixture) => v.payload.currentExecution.observations.pop(),
      (v: Fixture) => v.payload.currentExecution.observations.push(v.payload.currentExecution.observations[0]),
      (v: Fixture) => v.payload.currentExecution.observations.reverse(),
      (v: Fixture) => { v.payload.currentExecution.observations[1] = v.payload.currentExecution.observations[0] },
      (v: Fixture) => v.payload.historicalDispositions.pop(),
      (v: Fixture) => v.payload.historicalDispositions.reverse(),
      (v: Fixture) => v.payload.findings.push({ severity: "low", code: "still_a_finding" }),
      (v: Fixture) => v.payload.canonicalCustody.nativeIdentities.reverse(),
      (v: Fixture) => v.payload.consumerSubject.files.pop(),
      (v: Fixture) => v.payload.reviewerSubject.files.pop(),
      (v: Fixture) => v.payload.reviewerSubject.files.reverse(),
      (v: Fixture) => { v.payload.reviewerSubject.files[0].path = "../outside.ts" },
      (v: Fixture) => { v.payload.reviewerSubject.files[0].mode = "120000" },
      (v: Fixture) => { v.payload.reviewerSubject.files[0].blob = "abbreviated" },
      (v: Fixture) => { v.payload.reviewerSubject.files[0].sha256 = "invalid" },
      (v: Fixture) => { v.payload.reviewerSubject.commit = "abbreviated" },
      (v: Fixture) => { v.payload.reviewerSubject.tree = "abbreviated" },
      (v: Fixture) => { v.payload.reviewerSubject.parent = "abbreviated" },
      (v: Fixture) => { v.payload.reviewerSubject.repositoryClosureRoot = "unprefixed" },
    ]) {
      const v = structuredClone(baseline); change(v); sealFixture(v)
      expect(() => validateV138Plan143PublishedContract(v)).toThrow()
    }
    for (const value of [[], [FAKE_SHA], [FAKE_SHA, FAKE_SHA, FAKE_SHA]]) {
      const v = structuredClone(baseline); v.payload.reproductionProof.normalizedEvidenceRoots = value
      sealFixture(v, "payload.reproductionProof.normalizedEvidenceRoots")
      expect(() => validateV138Plan143PublishedContract(v)).toThrow()
    }
  })
})

const ownedRoot = (run: (root: string) => void) => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-plan143-independent-test-"))
  try { run(root) } finally { chmodSync(root, 0o700); rmSync(root, { recursive: true, force: true }) }
}
describe("stage predicate independently owned path attacks", () => {
  it("rejects present files, directories and dangling links at every final destination", () => {
    for (const relative of V138_PLAN143_EFFECTS) for (const kind of ["file", "directory", "symlink"]) ownedRoot(root => {
      mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
      const target = path.join(root, relative)
      if (kind === "file") writeFileSync(target, "denied")
      else if (kind === "directory") mkdirSync(target)
      else symlinkSync(path.join(root, "absent-target"), target)
      expect(() => checkV138Plan143Absence(root), `${relative}:${kind}`).toThrow()
    })
  })
  it("requires stable accessible real ancestors and accepts only exact final absence", () => {
    ownedRoot(root => {
      mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
      expect(checkV138Plan143Absence(root)).toBe(true)
    })
    for (const ancestor of [".planning", ".planning/artifacts"]) for (const kind of ["missing", "file", "symlink", "unreadable"]) ownedRoot(root => {
      const target = path.join(root, ancestor)
      mkdirSync(path.dirname(target), { recursive: true })
      if (kind === "file") writeFileSync(target, "not a directory")
      else if (kind === "symlink") {
        const replacement = path.join(root, "other"); mkdirSync(path.join(replacement, "artifacts"), { recursive: true }); symlinkSync(replacement, target)
      } else if (kind === "unreadable") mkdirSync(target, { mode: 0o000 })
      try { expect(() => checkV138Plan143Absence(root), `${ancestor}:${kind}`).toThrow() }
      finally { if (kind === "unreadable") chmodSync(target, 0o700) }
    })
    ownedRoot(root => {
      const real = path.join(root, "real"); mkdirSync(path.join(real, ".planning/artifacts"), { recursive: true })
      const alias = path.join(root, "alias"); symlinkSync(real, alias)
      expect(() => checkV138Plan143Absence(alias)).toThrow()
    })
  })
  it("rejects post outcome extensions, every denied destination and incomplete branches", () => {
    const baseline = { stage: "post", journalPresent: true, privateDirectoryPresent: true, terminalPresent: true, lockPresent: false,
      reproductionPresent: false, downstreamPresent: Array(6).fill(false), outcome: { disposition: "terminal_failure", journalRoot: FAKE_SHA,
        stateRoot: FAKE_SHA, completeCleanup: true, reproductionPresent: false, downstreamAuthority: "denied" } }
    expect(validateV138Plan143EffectValues(baseline)).toBe(true)
    for (const field of ["journalPresent", "privateDirectoryPresent", "terminalPresent"]) expect(() => validateV138Plan143EffectValues({ ...baseline, [field]: false })).toThrow()
    for (let i = 0; i < 6; i++) { const v = structuredClone(baseline); v.downstreamPresent[i] = true; expect(() => validateV138Plan143EffectValues(v)).toThrow() }
    for (const field of Object.keys(baseline.outcome)) {
      const v: any = structuredClone(baseline); v.outcome[field] = null; expect(() => validateV138Plan143EffectValues(v), field).toThrow()
    }
    expect(() => validateV138Plan143EffectValues({ ...baseline, outcome: { ...baseline.outcome, extension: false } })).toThrow()
    expect(() => validateV138Plan143EffectValues({ ...baseline, downstreamPresent: Array(5).fill(false) })).toThrow()
    expect(() => validateV138Plan143EffectValues({ ...baseline, downstreamPresent: Array(7).fill(false) })).toThrow()
  })
})

describe("pure predicate metadata and dependency discovery", () => {
  const gitIn = (root: string, args: string[]) => execFileSync("/usr/bin/git", ["-C", root, "-c", "core.hooksPath=/dev/null", ...args], {
    env: { PATH: "/usr/bin:/bin", HOME: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_AUTHOR_NAME: "fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
      GIT_COMMITTER_NAME: "fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" }, stdio: ["ignore", "pipe", "pipe"],
  }).toString().trim()
  const initialized = (root: string) => { gitIn(root, ["init", "--quiet"]); gitIn(root, ["commit", "--quiet", "--allow-empty", "-m", "fixture"]); return gitIn(root, ["rev-parse", "HEAD"]) }
  it("discovers executed static, dynamic literal, require and re-export edges without comments or type-only edges", () => {
    const actual = inspectV138Plan143Imports(`
      import type { T } from './type-only.js';
      import { x } from './executed.js'; import './side-effect.js';
      export { y } from './re-export.js'; export type { U } from './export-type-only.js';
      const p = import('./dynamic-literal.js'); const q = require('./required.js');
      // import './comment.js'
      const string = "import './string.js'";
    `)
    expect(actual).toEqual(["./executed.js", "./side-effect.js", "./re-export.js", "./dynamic-literal.js", "./required.js"])
  })
  it("rejects graft, shallow, alternates and replacement-ref metadata in owned repositories", () => {
    for (const relative of ["info/grafts", "shallow", "objects/info/alternates", "refs/replace/replaced"]) ownedRoot(root => {
      const head = initialized(root)
      expect(inspectV138Plan143Metadata(root)).toMatch(/^sha256:[a-f0-9]{64}$/)
      const target = path.join(root, ".git", relative); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, head + "\n")
      expect(() => inspectV138Plan143Metadata(root), relative).toThrow()
    })
  })
  it("rejects local includes, aliases and external config execution settings", () => {
    for (const [key, value] of [["include.path", "/dev/null"], ["alias.inspect", "!echo forbidden"], ["core.fsmonitor", "forbidden"],
      ["core.hooksPath", "/dev/null"], ["core.sshCommand", "forbidden"], ["url.https://invalid/.insteadOf", "safe"]]) ownedRoot(root => {
      initialized(root); gitIn(root, ["config", key!, value!])
      expect(() => inspectV138Plan143Metadata(root), key).toThrow()
    })
  })
  it("rejects symlinked object-directory and config paths instead of following replacements", () => {
    for (const relative of ["objects", "refs", "HEAD", "config"]) ownedRoot(root => {
      initialized(root)
      const target = path.join(root, ".git", relative), replacement = path.join(root, "replacement")
      cpSync(target, replacement, { recursive: true }); rmSync(target, { recursive: true }); symlinkSync(replacement, target)
      expect(() => inspectV138Plan143Metadata(root), relative).toThrow()
    })
  })
})

describe("heavy current runtime physical byte attacks", () => {
  it("pure predicate rejects malformed and inaccessible optional peers during capture and retained recheck", () => {
    const originalSymlink = fs.symlinkSync
    let exercised = 0
    const intercepted = vi.spyOn(fs, "symlinkSync").mockImplementation(((target, link, type) => {
      originalSymlink(target, link, type)
      if (!String(link).endsWith("/.runtime-node/pnpm")) return
      const root = path.dirname(path.dirname(String(link)))
      expect(path.basename(root).startsWith("v138-plan143-runtime-smoke-")).toBe(true)
      mkdirSync(path.join(root, "scripts"))
      cpSync(path.join(ROOT, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"), path.join(root, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"))
      const vite = path.join(root, "node_modules/vite")
      const manifest = JSON.parse(readFileSync(path.join(vite, "package.json"), "utf8"))
      expect(manifest.peerDependenciesMeta.sass.optional).toBe(true)
      const optional = path.join(vite, "node_modules/sass")
      expect(() => lstatSync(optional)).toThrow()
      const retained = retainV138Plan143RuntimeForReview(root)
      mkdirSync(optional, { recursive: true })
      const metadata = path.join(optional, "package.json")
      try {
        writeFileSync(metadata, "{invalid-json")
        expect(() => inspectV138Plan143Runtime(root)).toThrow("V138_PLAN143_PACKAGE_RESOLUTION_ERROR")
        expect(() => retained.recheck()).toThrow("V138_PLAN143_PACKAGE_RESOLUTION_ERROR")
        writeFileSync(metadata, JSON.stringify({ name: "sass", version: "0.0.0" }))
        chmodSync(metadata, 0o000)
        if (process.getuid?.() !== 0) {
          expect(() => inspectV138Plan143Runtime(root)).toThrow("V138_PLAN143_PACKAGE_RESOLUTION_ERROR")
          expect(() => retained.recheck()).toThrow("V138_PLAN143_PACKAGE_RESOLUTION_ERROR")
        }
      } finally { chmodSync(metadata, 0o644); rmSync(path.join(vite, "node_modules"), { recursive: true }) }
      expect(() => retained.recheck()).not.toThrow()
      exercised++
    }) as typeof fs.symlinkSync)
    syncBuiltinESMExports()
    try {
      expect(checkV138Plan143PrivateRuntimeCopyForReview(ROOT).resolutionGraphMatched).toBe(true)
      expect(exercised).toBe(1)
    } finally { intercepted.mockRestore(); syncBuiltinESMExports() }
  }, 60000)
  it("pure predicate preserves actual dependency resolution in a physical private runtime copy", () => {
    expect(checkV138Plan143PrivateRuntimeCopyForReview(ROOT)).toEqual({ entries: 3931,
      semanticRuntimeRoot: "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e",
      resolutionGraphMatched: true, producerCalls: 0, readinessCalls: 0, liveCalls: 0 })
  }, 60000)
  it("pure predicate rejects a nested same-version package shadow at its actual resolved root", () => {
    ownedRoot(root => {
      mkdirSync(path.join(root, "apps")); mkdirSync(path.join(root, "scripts"))
      symlinkSync(path.join(ROOT, "node_modules"), path.join(root, "node_modules"))
      const service = path.join(root, "apps/runtime-service")
      cpSync(path.join(ROOT, "apps/runtime-service"), service, { recursive: true })
      cpSync(path.join(ROOT, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"), path.join(root, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"))
      const retained = retainV138Plan143RuntimeForReview(root)
      expect(retained.runtime.entries).toHaveLength(3931)
      const nested = path.join(service, "node_modules/@cowards/spec")
      expect(lstatSync(nested).isSymbolicLink()).toBe(true)
      const originalLink = readlinkSync(nested)
      unlinkSync(nested)
      cpSync(path.join(ROOT, "packages/spec"), nested, {
        recursive: true, filter: source => path.basename(source) !== "node_modules",
      })
      const originalManifest = JSON.parse(readFileSync(path.join(ROOT, "packages/spec/package.json"), "utf8"))
      const copiedManifest = JSON.parse(readFileSync(path.join(nested, "package.json"), "utf8"))
      expect([copiedManifest.name, copiedManifest.version]).toEqual([originalManifest.name, originalManifest.version])
      // A distinct root is itself ambiguous even when bytes initially match.
      expect(() => inspectV138Plan143Runtime(root)).toThrow("V138_PLAN143_PACKAGE_ROOT_COLLISION")
      expect(() => retained.recheck()).toThrow("V138_PLAN143_PACKAGE_ROOT_COLLISION")
      writeFileSync(path.join(nested, "shadow-only.ts"), "export const shadowOnly = true\n")
      expect(() => inspectV138Plan143Runtime(root)).toThrow("V138_PLAN143_PACKAGE_ROOT_COLLISION")
      expect(() => retained.recheck()).toThrow("V138_PLAN143_PACKAGE_ROOT_COLLISION")
      rmSync(nested, { recursive: true }); symlinkSync(originalLink, nested)
      expect(inspectV138Plan143Runtime(root).entries).toHaveLength(3931)
      expect(() => retained.recheck()).not.toThrow()
    })
  }, 60000)
  it("accepts an owned runtime-service copy then rejects bytes, mode, omitted, extra and redirected entries", () => {
    ownedRoot(root => {
      mkdirSync(path.join(root, "apps")); mkdirSync(path.join(root, "scripts"))
      symlinkSync(path.join(ROOT, "node_modules"), path.join(root, "node_modules"))
      cpSync(path.join(ROOT, "apps/runtime-service"), path.join(root, "apps/runtime-service"), { recursive: true })
      cpSync(path.join(ROOT, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"), path.join(root, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"))
      expect(inspectV138Plan143Runtime(root).entries).toHaveLength(3931)
      const target = path.join(root, "apps/runtime-service/src/redaction.ts"), original = readFileSync(target)
      writeFileSync(target, Buffer.concat([original, Buffer.from("\n// independent byte mutation\n")]))
      expect(() => inspectV138Plan143Runtime(root)).toThrow()
      writeFileSync(target, original); chmodSync(target, 0o755)
      expect(() => inspectV138Plan143Runtime(root)).toThrow()
      chmodSync(target, 0o644); rmSync(target)
      expect(() => inspectV138Plan143Runtime(root)).toThrow()
      writeFileSync(target, original)
      const extra = path.join(root, "apps/runtime-service/src/extra-runtime-file.txt"); writeFileSync(extra, "extra")
      expect(() => inspectV138Plan143Runtime(root)).toThrow()
      rmSync(extra); rmSync(target); symlinkSync(path.join(ROOT, "apps/runtime-service/src/redaction.ts"), target)
      expect(() => inspectV138Plan143Runtime(root)).toThrow()
      rmSync(target); mkdirSync(target)
      expect(() => inspectV138Plan143Runtime(root)).toThrow()
      rmSync(target, { recursive: true }); writeFileSync(target, original, { mode: 0o000 })
      try { expect(() => inspectV138Plan143Runtime(root)).toThrow() } finally { chmodSync(target, 0o644) }
      expect(inspectV138Plan143Runtime(root).entries).toHaveLength(3931)
    })
  }, 120000)
})

describe("stage predicate deterministic retained-reader race", () => {
  it("rejects an actual ancestor swap around the final no-follow absence lookup", () => {
    ownedRoot(root => {
      mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
      expect(checkV138Plan143Absence(root)).toBe(true)
      const original = readFileSync(path.join(ROOT, "scripts/native/v1-38-secure-manifest-reader-v6.c"), "utf8")
      expect(fixtureSha(original)).toBe("sha256:fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1")
      const artifacts = path.join(root, ".planning/artifacts"), held = path.join(root, ".planning/held"), redirected = path.join(root, "redirect")
      mkdirSync(redirected)
      const target = "fstatat(dirs[parent].fd, name, &status, AT_SYMLINK_NOFOLLOW)"
      expect(original.split(target).length).toBe(2)
      const injection = `static int reviewer_lookup(int fd,const char *name,struct stat *s,int flags) {
static int done=0;
if(done++)return fstatat(fd,name,s,flags);
if(rename(${JSON.stringify(artifacts)},${JSON.stringify(held)})||symlink(${JSON.stringify(redirected)},${JSON.stringify(artifacts)}))die("TEST_SWAP");
struct stat retained,moved;if(fstat(fd,&retained)||stat(${JSON.stringify(held)},&moved)||retained.st_ino!=moved.st_ino||retained.st_dev!=moved.st_dev)die("TEST_NOT_RETAINED");
int rc=fstatat(fd,name,s,flags),e=errno;
if(unlink(${JSON.stringify(artifacts)})||rename(${JSON.stringify(held)},${JSON.stringify(artifacts)}))die("TEST_RESTORE");
fprintf(stderr,"INDEPENDENT143_SWAP_OBSERVED\\n");errno=e;return rc;
}
static void require_absences(void) {`
      const instrumented = original.replace("static void require_absences(void) {", injection).replace(target, "reviewer_lookup(dirs[parent].fd, name, &status, AT_SYMLINK_NOFOLLOW)")
      const source = path.join(root, "reader-test.c"), executable = path.join(root, "reader-test")
      writeFileSync(source, instrumented)
      execFileSync("/usr/bin/clang", ["-std=c11", "-Wall", "-Wextra", "-Werror", source, "-o", executable])
      const nativeSpawn = childProcess.spawnSync; let swaps = 0
      const interceptor = vi.spyOn(childProcess, "spawnSync").mockImplementation(((file, args, options) => {
        if (String(file).includes("v138-secure-reader-v6-") && String(options?.input).startsWith("A\t")) {
          const result = nativeSpawn(executable, args, options)
          expect(String(result.stderr)).toContain("INDEPENDENT143_SWAP_OBSERVED"); swaps++; return result
        }
        return nativeSpawn(file, args, options)
      }) as typeof childProcess.spawnSync)
      syncBuiltinESMExports()
      try { expect(() => checkV138Plan143Absence(root)).toThrow(); expect(swaps).toBe(1) }
      finally { interceptor.mockRestore(); syncBuiltinESMExports() }
      expect(checkV138Plan143Absence(root)).toBe(true)
    })
  }, 60000)
})

describe("heavy current runtime six modes", () => {
  let result: any
  it("measures actual live-v14 twice with equal normalized roots and all real counters zero", () => {
    result = buildV138Plan143Review(ROOT)
    expect(validateV138Plan143PublishedContract(result)).toBe(true)
    expect(result.payload.currentExecution.observations.map((r: Fixture) => r.mode)).toEqual(fixtureModes)
    expect(result.payload.currentExecution.actualModesPassed).toBe(6)
    expect(result.payload.currentExecution.producerGuardCount).toBe(0)
    expect(result.payload.reproductionProof).toMatchObject({ processCount: 2, rootCount: 2, equal: true })
    expect(new Set(result.payload.reproductionProof.normalizedEvidenceRoots).size).toBe(1)
    expect(result.payload.counters).toEqual(fixtureCounters)
    expect(result.carrier.counters).toEqual(fixtureCounters)
    expect(checkV138Plan143Absence(ROOT)).toBe(true)
  }, 540000)
  it("authenticates the fresh result but rejects stored copies and an unrelated root", () => {
    expect(result).toBeDefined()
    expect(authenticateV138Plan143Batch([result], ROOT)).toEqual([{ accepted: true }])
    expect(authenticateV138Plan143Batch([structuredClone(result)], ROOT)).toEqual([{ accepted: false }])
    ownedRoot(other => {
      mkdirSync(path.join(other, ".planning/artifacts"), { recursive: true })
      expect(authenticateV138Plan143Batch([result], other).every(value => value.accepted === false)).toBe(true)
    })
    expect(checkV138Plan143Absence(ROOT)).toBe(true)
  }, 120000)
})

describe("current subject and closed producer boundary", () => {
  it("pins closed144 separately from retained142", () => {
    const current = inspectV138Plan143CurrentSource(ROOT)
    expect(current.consumerSubject.commit).toBe("80936682ec7f1d63f2ea5dfdd87c99ccb97966b7")
    expect(current.consumerSubject.repositoryClosureRoot).toBe("sha256:25d8387b7fc87923c584dc85f6bc4f4856f65e2a76086eb2a615e127229335a8")
    expect(current.historical142.sourceCommit).toBe("61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3")
    expect(current.plan110Eligible).toBe(false)
  })
  it("derives the unchanged exact producer guard without importing subject code", () => {
    const source = readFileSync(path.join(ROOT, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"), "utf8")
    const guard = inspectV138Plan143ProducerBoundary(source)
    expect(guard.guardTransformRoot).toBe("sha256:b95b2684fbb275039a6325a3c816af05d91bd0c7f24ae557f7d0eac71338ffcd")
    expect(guard.transformedSourceSha256).toBe("sha256:dec762cd839e482ddfd1cdf89de304857e4117d14f09851109d6ee30c20bb154")
    expect(() => inspectV138Plan143ProducerBoundary(source + "\nrunV138V3ProductionLive('bad')")).toThrow()
    expect(() => inspectV138Plan143ProducerBoundary(source.replace("await runV138V3ProductionLive(root", "await Reflect.apply(runV138V3ProductionLive, null, [root"))).toThrow()
  })
})

describe("pure predicate and stage predicate", () => {
  const empty = () => ({ stage: "pre", journalPresent: false, privateDirectoryPresent: false,
    terminalPresent: false, lockPresent: false, reproductionPresent: false, downstreamPresent: Array(6).fill(false), outcome: null })
  it("uses the actual eleven destinations and six denied downstream paths", () => {
    expect(V138_PLAN143_EFFECTS).toHaveLength(11)
    expect(V138_PLAN143_EFFECTS[5]).toBe(".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json")
    expect(validateV138Plan143EffectValues(empty())).toBe(true)
    for (const field of ["journalPresent", "privateDirectoryPresent", "terminalPresent", "lockPresent", "reproductionPresent"]) {
      expect(() => validateV138Plan143EffectValues({ ...empty(), [field]: true })).toThrow()
    }
    for (let i = 0; i < 6; i++) {
      const v = empty(); v.downstreamPresent[i] = true
      expect(() => validateV138Plan143EffectValues(v)).toThrow()
    }
  })
  it("permits only complete branch-valid post values without invoking a producer", () => {
    const v = { ...empty(), stage: "post", journalPresent: true, privateDirectoryPresent: true, terminalPresent: true,
      outcome: { disposition: "exhausted", journalRoot: "sha256:" + "1".repeat(64), stateRoot: "sha256:" + "2".repeat(64),
        completeCleanup: true, reproductionPresent: false, downstreamAuthority: "denied" } }
    expect(validateV138Plan143EffectValues(v)).toBe(true)
    for (const changes of [{ lockPresent: true }, { terminalPresent: false }, { reproductionPresent: true },
      { outcome: { ...v.outcome, completeCleanup: false } }, { outcome: { ...v.outcome, disposition: "active" } }]) {
      expect(() => validateV138Plan143EffectValues({ ...v, ...changes })).toThrow()
    }
    const success = { ...v, reproductionPresent: true, outcome: { ...v.outcome, disposition: "succeeded", reproductionPresent: true } }
    expect(validateV138Plan143EffectValues(success)).toBe(true)
    expect(() => validateV138Plan143EffectValues({ ...success, reproductionPresent: false })).toThrow()
  })
  it("rejects fabricated publications and accessor-bearing input before any effects", () => {
    expect(() => validateV138Plan143PublishedContract({})).toThrow()
    let touched = false
    const input = Object.defineProperty({}, "payload", { enumerable: true, get() { touched = true; return {} } })
    expect(() => validateV138Plan143PublishedContract(input)).toThrow()
    expect(touched).toBe(false)
  })
})
