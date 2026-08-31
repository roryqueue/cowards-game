import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { validateV138LiveV14PublishedContractForReview, executeV138LiveV14ReviewMode,
  validateV138LiveV14EffectValuesForReview, checkV138LiveV14EffectState,
  inspectV138LiveV14ProducerGuardForReview, checkV138LiveV14RootBoundCustodyForReview,
  buildV138LiveV14GuardedProofForReview } from "./run-v1-38-bounded-retry-envelope-v3-live-v14.js"
import { settleV138LiveV9ProducerOutcomeForReview } from "./run-v1-38-bounded-retry-envelope-v3-live-v9.js"

type Json = Record<string, any>
const SOURCE = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"
const REVIEWER = "scripts/check-v1-38-plan-262-143-live-v13-custody-review-v10.ts"
const PAYLOAD = ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-payload-v10.json"
const REVIEW = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-143-REVIEW-v10.md"
const ROOT = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "")
// Independent fixture canonicalization, root computation and rendering: never call
// the implementation's builders, inventory, observation runner or review helper.
const canonical = (value: unknown): string => {
  const order = (v: any): any => Array.isArray(v) ? v.map(order) : v !== null && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort((left, right) => left.localeCompare(right)).map((key) => [key, order(v[key])])) : v
  return JSON.stringify(order(value)) + "\n"
}
const sha = (value: string): string => "sha256:" + createHash("sha256").update(value).digest("hex")
const h = (suffix: string, value: unknown): string => sha("v138-plan143-v10-" + suffix + "\0" + canonical(value))
const without = (value: Json, ...keys: string[]): Json => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)))
const oid = (label: string): string => createHash("sha1").update(label).digest("hex")
const native = [
  { path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644",
    blob: "ca694310a8a99c30d7a4070a415b968d3e341409", sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" },
  { path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644",
    blob: "99da3517ccb8b919759663daf713b4f20337b8b1", sha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" },
]
const historicalDispositions = [
  ["v3", "262-122", "process_invalid_false_clean_custody"],
  ["v4", "262-131", "process_invalid_descendant_and_observation_validation"],
  ["v5", "262-133", "process_invalid_authority_carrier_validation"],
  ["v6", "262-134", "process_invalid_cross_root_cache_and_absolute_path_evidence"],
  ["v7", "262-136", "process_invalid_genuine_to_stable_native_mapping"],
  ["v8", "262-138", "process_invalid_unauthenticated_executor_metadata_and_effect_gate"],
  ["v9", "262-140", "process_invalid_incomplete_runtime_cross_root_laundering_and_ancestor_symlink_gate"],
].map(([version, plan, disposition]) => ({ version, plan, disposition, eligible: false }))
const modes = [
  ["source-only", "source_only_checked"],
  ["prospective-custody", "prospective_custody_checked"],
  ["post-no-effect", "post_run_no_effect_custody_checked"],
  ["non-pass-value", "bounded_non_pass_value_checked"],
  ["bounded-success-value", "bounded_success_value_checked"],
  ["exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
]
const noEffect = { downstreamAuthority: "denied", freshAccepted: 0, freshCharged: 0,
  liveInvoked: false, producerCalls: 0, readinessInvoked: false }
const reductions = [noEffect, noEffect, noEffect,
  { classification: "non_pass", reproductionEligible: false },
  { classification: "bounded_success", reproductionEligible: true },
  { acceptedCells: 540, exact: true, requiredAccepted: 540 }]
const historicalObservationsRoot = (): string => {
  const historicalModes = ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody",
    "--check-non-pass-value", "--check-bounded-success-value", "--check-exact-reproduction-v17-value"]
  const stable = historicalModes.map((mode, ordinal) => {
    const body = {
      repositoryClosureRoot: "sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d",
      semanticRuntimeRoot: "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e",
      nativeIdentities: native, mode, ordinal, reducedValue: reductions[ordinal], producerGuardCount: 0,
    }
    return { ...body, stableRecordRoot: sha("v138-plan-262-142-stable-execution-record-v10\0" + canonical(body)) }
  })
  return sha("v138-plan-262-142-stable-observations-v10\0" + canonical(stable))
}
function subject(plan: string, source: string): Json {
  const files = [source.replace(/\.ts$/, ".test.ts"), source].sort().map((path) => ({
    path, mode: "100644", blob: oid(path), sha256: sha(path),
  }))
  const body = { plan, commit: oid(plan + "source"), tree: oid(plan + "tree"), parent: oid(plan + "parent"),
    files, repositoryClosureRoot: h("repository-closure", { files, edges: [] }) }
  return { ...body, subjectRoot: h("subject", body) }
}
function renderReview(payload: Json): string {
  return "# Plan 262-143 live-v14 custody review v10\n\nPayload: " + PAYLOAD +
    "\nPayload SHA-256: " + sha(canonical(payload)) + "\nPayload root: " + payload.payloadRoot +
    "\nConsumer subject: " + payload.consumerSubject.subjectRoot + "\nReviewer subject: " + payload.reviewerSubject.subjectRoot +
    "\nFindings: 0\nPrivacy findings: 0\nAuthorizes execution: false\nDownstream authority: denied\n\n" +
    "Limitations: private single-operator snapshot; no continuing absence or hostile-same-UID isolation.\n"
}
// Repair every enclosing digest for semantic mutations, so rejection is not an
// unrelated stale outer-hash failure. Reference-mismatch tests intentionally use
// outerOnly(), which preserves the specifically attacked reference.
function repair(input: Json): Json {
  const p = input.payload
  for (const key of ["consumerSubject", "reviewerSubject"]) p[key].subjectRoot = h("subject", without(p[key], "subjectRoot"))
  const c = p.canonicalCustody
  c.repositoryClosureRoot = p.consumerSubject.repositoryClosureRoot
  c.semanticRuntimeClosureRoot = h("runtime-closure", c.semanticRuntimeInventory)
  c.nativeIdentityRoot = h("native-identities", c.nativeIdentities)
  c.canonicalLocalExecutionClosureRoot = h("canonical-custody", without(c, "canonicalLocalExecutionClosureRoot"))
  const e = p.currentExecution
  e.subjectRoot = p.consumerSubject.subjectRoot
  for (const record of e.observations) {
    record.subjectRoot = e.subjectRoot
    record.repositoryClosureRoot = c.repositoryClosureRoot
    record.semanticRuntimeClosureRoot = c.semanticRuntimeClosureRoot
    record.nativeIdentityRoot = c.nativeIdentityRoot
    record.executionRoot = h("execution", without(record, "executionRoot", "observationRoot"))
    record.observationRoot = h("observation", without(record, "observationRoot"))
  }
  e.observationsRoot = h("observations", e.observations)
  p.reproductionProof.normalizedEvidenceRoots = [h("reproduction", e), h("reproduction", e)]
  return outerOnly(input)
}
function outerOnly(input: Json): Json {
  const p = input.payload
  p.payloadRoot = h("payload", without(p, "payloadRoot"))
  input.review = renderReview(p)
  Object.assign(input.carrier, { payloadSha256: sha(canonical(p)), payloadRoot: p.payloadRoot,
    reviewSha256: sha(input.review), consumerSubjectRoot: p.consumerSubject.subjectRoot,
    reviewerSubjectRoot: p.reviewerSubject.subjectRoot, semanticRuntimeClosureRoot: p.canonicalCustody.semanticRuntimeClosureRoot,
    currentObservationsRoot: p.currentExecution.observationsRoot })
  input.carrier.carrierRoot = h("carrier", without(input.carrier, "carrierRoot"))
  return input
}
function fixture(): Json {
  const payload: Json = {
    schemaVersion: "v1.38-plan-262-143-live-v14-custody-review-payload-v10", consumerVersion: "live-v14", consumerPlan: "262-144",
    consumerSubject: subject("262-144", SOURCE), reviewerSubject: subject("262-143", REVIEWER),
    historical142: {
      sourceCommit: "61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3", summaryCommit: "53509033a03a7a6661cb519c76c70d437b6d86c3",
      trackingCommit: "7edcac4f5977ea8f006b1369536414c8006e64bd",
      sourceRoot: "sha256:902fd55d157cba70b4933499c45a8855fc1df6bd373748bd3d7853daf70f22c1",
      semanticRuntimeClosureRoot: "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e",
      repositoryClosureRoot: "sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d",
      observationsRoot: historicalObservationsRoot(), plan110Eligible: false,
    }, historicalDispositions: structuredClone(historicalDispositions),
    canonicalCustody: { repositoryClosureRoot: "", semanticRuntimeInventory: [
      { identity: "runtime/fixture/node", mode: "100755", size: 123, sha256: sha("synthetic-node") },
      { identity: "runtime/fixture/tsx", mode: "100644", size: 456, sha256: sha("synthetic-tsx") },
    ], semanticRuntimeClosureRoot: "", nativeIdentities: structuredClone(native), nativeIdentityRoot: "",
    canonicalLocalExecutionClosureRoot: "", metadataPredicate: "private_bound_bare_snapshot_v1",
    provenancePredicate: "fresh_root_bound_private_transcript_v1" },
    currentExecution: { subjectRoot: "", observations: modes.map(([mode, status], ordinal) => ({
      subjectRoot: "", mode, ordinal, status, reducedValue: structuredClone(reductions[ordinal]),
      repositoryClosureRoot: "", semanticRuntimeClosureRoot: "", nativeIdentityRoot: "", executionRoot: "", observationRoot: "",
    })), actualModesPassed: 6, observationsRoot: "", guardTransformRoot: h("guard-transform", { sourceSha256: sha("fixture-original-source"),
      producerImport: "runV138V3ProductionLive", producerCall: "runV138V3ProductionLive", transform: "independent-file-counter-v1" }), producerGuardCount: 0 },
    reproductionProof: { processCount: 2, rootCount: 2, normalizedEvidenceRoots: [], equal: true },
    findings: [], findingCount: 0, privacyFindingCount: 0, plan110Eligible: true, authorizesExecution: false,
    downstreamAuthority: "denied", counters: { producerCalls: 0, readinessCalls: 0, liveCalls: 0, freshCharged: 0, freshAccepted: 0 },
    requiredAccepted: 540, payloadRoot: "",
  }
  const carrier = { schemaVersion: "v1.38-plan-262-143-live-v14-custody-review-carrier-v10", consumerVersion: "live-v14",
    consumerPlan: "262-144", payloadPath: PAYLOAD, payloadSha256: "", payloadRoot: "", reviewPath: REVIEW, reviewSha256: "",
    consumerSubjectRoot: "", reviewerSubjectRoot: "", semanticRuntimeClosureRoot: "", currentObservationsRoot: "",
    findingCount: 0, privacyFindingCount: 0, plan110Eligible: true, authorizesExecution: false,
    downstreamAuthority: "denied", counters: structuredClone(payload.counters), requiredAccepted: 540, carrierRoot: "" }
  return repair({ payload, carrier, review: "" })
}
const valueAt = (value: any, path: string[]): any => path.reduce((v, key) => v[key], value)
function objects(value: unknown, path: string[] = []): string[][] {
  if (value === null || typeof value !== "object") return []
  return [...(Array.isArray(value) ? [] : [path]), ...Object.entries(value).flatMap(([key, child]) => objects(child, [...path, key]))]
}

describe("pure predicate", () => {
  it("accepts an independently constructed exact prospective144 fixture only as values", () => {
    const input = fixture(), before = canonical(input)
    expect(validateV138LiveV14PublishedContractForReview(input)).toBe(true)
    expect(canonical(input)).toBe(before)
    expect(validateV138LiveV14PublishedContractForReview(JSON.parse(before))).toBe(true)
  })
  it("rejects every missing stored field and recursively rejects extra fields", () => {
    const baseline = fixture()
    for (const path of objects(baseline)) {
      const extra = structuredClone(baseline)
      valueAt(extra, path).unreviewedExtension = "private diagnostic"
      expect(() => validateV138LiveV14PublishedContractForReview(extra), path.join(".") + " extra").toThrow()
      repair(extra)
      expect(() => validateV138LiveV14PublishedContractForReview(extra), path.join(".") + " rehashed extra").toThrow()
      for (const field of Object.keys(valueAt(baseline, path))) {
        const missing = structuredClone(baseline)
        delete valueAt(missing, path)[field]
        expect(() => validateV138LiveV14PublishedContractForReview(missing), [...path, field].join(".") + " absent").toThrow()
      }
    }
  })
  it("rejects rehashed semantic mutations at their actual predicates", () => {
    const attacks: [string, (p: Json) => void][] = [
      ["wrong consumer", (p) => { p.consumerVersion = "live-v13" }],
      ["wrong plan", (p) => { p.consumerPlan = "262-142" }],
      ["wrong consumer subject", (p) => { p.consumerSubject.plan = "262-142" }],
      ["wrong reviewer subject", (p) => { p.reviewerSubject.plan = "262-144" }],
      ["historical eligibility", (p) => { p.historical142.plan110Eligible = true }],
      ["historical commit", (p) => { p.historical142.sourceCommit = oid("substitution") }],
      ["historical source", (p) => { p.historical142.sourceRoot = sha("substitution") }],
      ["historical runtime", (p) => { p.historical142.semanticRuntimeClosureRoot = sha("substitution") }],
      ["historical archive", (p) => { p.historical142.repositoryClosureRoot = sha("substitution") }],
      ["historical observations", (p) => { p.historical142.observationsRoot = sha("substitution") }],
      ["historical reorder", (p) => { p.historicalDispositions.reverse() }],
      ["historical missing", (p) => { p.historicalDispositions.pop() }],
      ["historical invented publication", (p) => { p.historicalDispositions[3].plan = "262-135" }],
      ["historical false clean", (p) => { p.historicalDispositions[0].disposition = "clean" }],
      ["metadata predicate", (p) => { p.canonicalCustody.metadataPredicate = "copied_json" }],
      ["provenance predicate", (p) => { p.canonicalCustody.provenancePredicate = "caller_verified" }],
      ["runtime empty", (p) => { p.canonicalCustody.semanticRuntimeInventory = [] }],
      ["runtime duplicate", (p) => { p.canonicalCustody.semanticRuntimeInventory.push(p.canonicalCustody.semanticRuntimeInventory[0]) }],
      ["runtime order", (p) => { p.canonicalCustody.semanticRuntimeInventory.reverse() }],
      ["runtime absolute identity", (p) => { p.canonicalCustody.semanticRuntimeInventory[0].identity = "/private/host/node" }],
      ["runtime negative size", (p) => { p.canonicalCustody.semanticRuntimeInventory[0].size = -1 }],
      ["runtime fractional size", (p) => { p.canonicalCustody.semanticRuntimeInventory[0].size = 1.5 }],
      ["runtime unsafe size", (p) => { p.canonicalCustody.semanticRuntimeInventory[0].size = Number.MAX_SAFE_INTEGER + 1 }],
      ["native TS substitution", (p) => { p.canonicalCustody.nativeIdentities[0].path = "scripts/helper.ts" }],
      ["native coherent hash", (p) => { p.canonicalCustody.nativeIdentities[0].sha256 = sha("replacement") }],
      ["native order", (p) => { p.canonicalCustody.nativeIdentities.reverse() }],
      ["native extra", (p) => { p.canonicalCustody.nativeIdentities.push(p.canonicalCustody.nativeIdentities[0]) }],
      ["mode count", (p) => { p.currentExecution.actualModesPassed = 5 }],
      ["producer guard", (p) => { p.currentExecution.producerGuardCount = 1 }],
      ["mode reorder", (p) => { p.currentExecution.observations.reverse() }],
      ["mode missing", (p) => { p.currentExecution.observations.pop() }],
      ["mode duplicate", (p) => { p.currentExecution.observations.push(p.currentExecution.observations[0]) }],
      ["historical owner mode", (p) => { p.currentExecution.observations[0].mode = "--check-source-only" }],
      ["wrong ordinal", (p) => { p.currentExecution.observations[2].ordinal = 3 }],
      ["wrong status", (p) => { p.currentExecution.observations[2].status = "ready" }],
      ["runtime count claim", (p) => { p.currentExecution.observations[0].reducedValue.producerCalls = 1 }],
      ["synthetic actual acceptance", (p) => { p.currentExecution.observations[0].reducedValue.freshAccepted = 540 }],
      ["nonpass classification", (p) => { p.currentExecution.observations[3].reducedValue.classification = "bounded_success" }],
      ["nonpass eligibility", (p) => { p.currentExecution.observations[3].reducedValue.reproductionEligible = true }],
      ["bounded success eligibility", (p) => { p.currentExecution.observations[4].reducedValue.reproductionEligible = false }],
      ["reproduction exactness", (p) => { p.currentExecution.observations[5].reducedValue.exact = false }],
      ["reproduction target", (p) => { p.currentExecution.observations[5].reducedValue.acceptedCells = 539 }],
      ["process count", (p) => { p.reproductionProof.processCount = 1 }],
      ["root count", (p) => { p.reproductionProof.rootCount = 1 }],
      ["proof unequal", (p) => { p.reproductionProof.equal = false }],
      ["findings", (p) => { p.findings = [{ severity: "critical" }] }],
      ["finding count", (p) => { p.findingCount = 1 }],
      ["privacy count", (p) => { p.privacyFindingCount = 1 }],
      ["execution authority", (p) => { p.authorizesExecution = true }],
      ["downstream authority", (p) => { p.downstreamAuthority = "allowed" }],
      ["accepted target", (p) => { p.requiredAccepted = 539 }],
      ["ineligible publication", (p) => { p.plan110Eligible = false }],
    ]
    for (const key of Object.keys(fixture().payload.counters)) attacks.push(["counter " + key, (p) => { p.counters[key] = 1 }])
    for (let i = 0; i < 7; i++) attacks.push(["obsolete v" + (i + 3) + " eligibility", (p) => { p.historicalDispositions[i].eligible = true }])
    for (const who of ["consumerSubject", "reviewerSubject"]) {
      for (const [label, apply] of [
        ["missing source", (s: Json) => { s.files = s.files.filter((v: Json) => v.path.endsWith(".test.ts")) }],
        ["empty files", (s: Json) => { s.files = [] }],
        ["duplicate file", (s: Json) => { s.files.push(s.files[0]) }],
        ["reordered files", (s: Json) => { s.files.reverse() }],
        ["traversal", (s: Json) => { s.files[0].path = "../private.ts" }],
        ["nonregular mode", (s: Json) => { s.files[0].mode = "120000" }],
        ["short commit", (s: Json) => { s.commit = "abcd1234" }],
        ["bad blob", (s: Json) => { s.files[0].blob = "invalid" }],
      ] as [string, (s: Json) => void][]) attacks.push([who + " " + label, (p) => apply(p[who])])
    }
    for (const [label, attack] of attacks) {
      const input = fixture(); attack(input.payload); repair(input)
      expect(() => validateV138LiveV14PublishedContractForReview(input), label).toThrow()
    }
  })
  it("rejects repaired enclosing roots with mismatched references and stale roots", () => {
    for (const path of [
      ["consumerSubject", "subjectRoot"], ["reviewerSubject", "subjectRoot"],
      ["canonicalCustody", "repositoryClosureRoot"], ["canonicalCustody", "semanticRuntimeClosureRoot"],
      ["canonicalCustody", "nativeIdentityRoot"], ["canonicalCustody", "canonicalLocalExecutionClosureRoot"],
      ["currentExecution", "subjectRoot"], ["currentExecution", "observationsRoot"],
      ...["subjectRoot", "repositoryClosureRoot", "semanticRuntimeClosureRoot", "nativeIdentityRoot", "executionRoot", "observationRoot"]
        .map((field) => ["currentExecution", "observations", "0", field]),
      ["reproductionProof", "normalizedEvidenceRoots", "0"],
    ]) {
      const input = fixture(); valueAt(input.payload, path.slice(0, -1))[path.at(-1)!] = sha("coherent substitution")
      outerOnly(input)
      expect(() => validateV138LiveV14PublishedContractForReview(input), path.join(".")).toThrow()
    }
    for (const field of Object.keys(fixture().carrier).filter((field) => field !== "carrierRoot")) {
      const input = fixture(); const old = input.carrier[field]
      input.carrier[field] = typeof old === "boolean" ? !old : typeof old === "number" ? old + 1 : "substituted"
      input.carrier.carrierRoot = h("carrier", without(input.carrier, "carrierRoot"))
      expect(() => validateV138LiveV14PublishedContractForReview(input), "carrier." + field).toThrow()
    }
    const changedReview = fixture(); changedReview.review += "Approved for execution.\n"
    changedReview.carrier.reviewSha256 = sha(changedReview.review)
    changedReview.carrier.carrierRoot = h("carrier", without(changedReview.carrier, "carrierRoot"))
    expect(() => validateV138LiveV14PublishedContractForReview(changedReview)).toThrow()
  })
  it("rejects non-JSON values, cycles, non-finite numbers and oversized collections", () => {
    for (const value of [null, [], true, "fixture", 1, undefined]) expect(() => validateV138LiveV14PublishedContractForReview(value)).toThrow()
    for (const bad of [NaN, Infinity, -Infinity, 0.5, -1]) {
      const input = fixture(); input.payload.counters.liveCalls = bad
      expect(() => validateV138LiveV14PublishedContractForReview(input)).toThrow()
    }
    const cycle = fixture(); cycle.payload.findings.push(cycle)
    expect(() => validateV138LiveV14PublishedContractForReview(cycle)).toThrow()
    const oversized = fixture(); oversized.payload.consumerSubject.files = Array(20001).fill(oversized.payload.consumerSubject.files[0])
    expect(() => validateV138LiveV14PublishedContractForReview(oversized)).toThrow()
  })
  it("distinguishes publication values from effects and never promotes synthetic540 into actual counters", () => {
    const input = fixture()
    expect(input.payload.currentExecution.observations[5].reducedValue.acceptedCells).toBe(540)
    expect(validateV138LiveV14PublishedContractForReview(input)).toBe(true)
    expect(input.payload.counters).toEqual({ producerCalls: 0, readinessCalls: 0, liveCalls: 0, freshCharged: 0, freshAccepted: 0 })
    expect(input.payload.authorizesExecution).toBe(false)
    expect(input.payload.downstreamAuthority).toBe("denied")
    // A JSON-roundtrippable true validation result is not a root-bound capability.
    expect(typeof validateV138LiveV14PublishedContractForReview(input)).toBe("boolean")
  })
  it("rejects non-data descriptors without executing getters or serialization callbacks", () => {
    let callbacks = 0
    const getter = fixture()
    Object.defineProperty(getter.payload, "consumerVersion", { enumerable: true,
      get() { callbacks++; return "live-v14" } })
    expect(() => validateV138LiveV14PublishedContractForReview(getter)).toThrow()
    expect(callbacks).toBe(0)
    const serializer = fixture()
    Object.defineProperty(serializer.payload.counters, "toJSON", { enumerable: false,
      value() { callbacks++; return { producerCalls: 0, readinessCalls: 0, liveCalls: 0, freshCharged: 0, freshAccepted: 0 } } })
    expect(() => validateV138LiveV14PublishedContractForReview(serializer)).toThrow()
    expect(callbacks).toBe(0)
    for (const mutate of [
      (v: Json) => Object.defineProperty(v.payload, "privateHostInfo", { value: "hidden", enumerable: false }),
      (v: Json) => { v.payload[Symbol("hidden")] = "secret" },
      (v: Json) => Object.setPrototypeOf(v.payload.counters, { inherited: "private" }),
      (v: Json) => { v.payload.currentExecution.observations[0].reducedValue.producerCalls = undefined },
      (v: Json) => { v.payload.counters.liveCalls = () => 0 },
      (v: Json) => { v.payload.currentExecution.observations.extra = "extension" },
    ]) {
      const input = fixture(); mutate(input)
      expect(() => validateV138LiveV14PublishedContractForReview(input)).toThrow()
    }
  })
})

describe("closed producer boundary", () => {
  it("recognizes only the exact producer import/call shape for the deterministic file guard", () => {
    const source = readFileSync(path.join(ROOT, SOURCE), "utf8")
    const guard = inspectV138LiveV14ProducerGuardForReview(source)
    expect(guard).toBeDefined()
    for (const text of [
      source.replace("runV138V3ProductionLive }", "runV138V3ProductionLive as aliasedProducer }"),
      source + "\nconst producerAlias = runV138V3ProductionLive;\n",
      source + "\nrunV138V3ProductionLive('not-executed');\n",
      source.replace('from "./run-v1-38-bounded-retry-envelope-v3.js"', 'from "./alternate-producer.js"'),
      source.replace(/await runV138V3ProductionLive\(/, "await (runV138V3ProductionLive as Function)("),
    ]) {
      expect(text).not.toBe(source)
      expect(() => inspectV138LiveV14ProducerGuardForReview(text)).toThrow()
    }
  })
  it("contains exactly one static imported producer call with pre/try/finally-post ordering", () => {
    const text = readFileSync(fileURLToPath(new URL("./run-v1-38-bounded-retry-envelope-v3-live-v14.ts", import.meta.url)), "utf8")
    const source = ts.createSourceFile(SOURCE, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const all: ts.Node[] = []; const visit = (node: ts.Node): void => { all.push(node); ts.forEachChild(node, visit) }; visit(source)
    const producerImports = all.filter(ts.isImportSpecifier).filter((n) => (n.propertyName ?? n.name).text === "runV138V3ProductionLive")
    expect(producerImports).toHaveLength(1)
    const specifier = producerImports[0]!, importedName = specifier.name.text
    expect(specifier.propertyName).toBeUndefined()
    const declaration = specifier.parent.parent.parent as ts.ImportDeclaration
    expect((declaration.moduleSpecifier as ts.StringLiteral).text).toBe("./run-v1-38-bounded-retry-envelope-v3.js")
    const calls = all.filter(ts.isCallExpression).filter((n) => ts.isIdentifier(n.expression) && n.expression.text === importedName)
    expect(calls).toHaveLength(1)
    const call = calls[0]!
    let owner: ts.Node = call
    while (owner.parent && !ts.isFunctionDeclaration(owner)) owner = owner.parent
    expect(ts.isFunctionDeclaration(owner) && owner.name?.text).toBe("runV138ReviewedBoundedLiveEnvelopeV14")
    let tryNode: ts.Node = call
    while (tryNode.parent && !ts.isTryStatement(tryNode)) tryNode = tryNode.parent
    expect(ts.isTryStatement(tryNode)).toBe(true)
    const boundary = tryNode as ts.TryStatement
    expect(boundary.finallyBlock).toBeDefined()
    expect(owner.getText(source).slice(0, call.getStart(source) - owner.getStart(source))).toContain("authenticateV138LiveV14ImmutableCustody")
    expect(owner.getText(source).slice(0, call.getStart(source) - owner.getStart(source))).toMatch(/checkV138LiveV14EffectState\([^;]*["']pre["']/)
    expect(boundary.finallyBlock!.getText(source)).toContain("authenticateV138LiveV14ImmutableCustody")
    expect(boundary.finallyBlock!.getText(source)).toMatch(/checkV138LiveV14EffectState\([^;]*["']post["']/)
    const references = all.filter(ts.isIdentifier).filter((n) => n.text === importedName)
    expect(references).toHaveLength(2) // declaration and the direct call only; no alias/dispatch escape
    for (const node of all.filter(ts.isImportDeclaration)) {
      const module = (node.moduleSpecifier as ts.StringLiteral).text
      expect(module).not.toMatch(/live-v(?:11|12|13)\.js$|plan-262-143/)
      if (/live-v(?:9|10)\.js$/.test(module)) {
        const bindings = node.importClause?.namedBindings
        expect(bindings && ts.isNamedImports(bindings)).toBe(true)
        for (const imported of (bindings as ts.NamedImports).elements) {
          expect((imported.propertyName ?? imported.name).text).toMatch(/^(?:assertV138LiveV10PostRunForReview|checkV138LiveV10PostRunOutputCustodyForReview|checkV138LiveV10ReproductionV17ForReview|computeV138LiveV10ReproductionV17ReceiptRoot|settleV138LiveV9ProducerOutcomeForReview)$/)
        }
      }
      if (/plan-262-142/.test(module)) {
        const bindings = node.importClause?.namedBindings
        expect(bindings && ts.isNamedImports(bindings)).toBe(true)
        expect((bindings as ts.NamedImports).elements.map((v) => (v.propertyName ?? v.name).text))
          .toEqual(["inspectV138Plan142SemanticRuntimeForReview"])
      }
    }
    expect(all.filter(ts.isCallExpression).filter((n) => n.expression.kind === ts.SyntaxKind.ImportKeyword)).toHaveLength(0)
  })
})

describe("actual modes", () => {
  it("runs source-only on actual live-v14 without publication or producer authority", () => {
    const observation = executeV138LiveV14ReviewMode(ROOT, "source-only")
    expect(observation).toMatchObject({ mode: "source-only", status: "source_only_checked", reducedValue: noEffect })
    expect(observation.sourceRoot).toBe(sha(readFileSync(path.join(ROOT, SOURCE), "utf8")))
  })
  it("proves all six actual144 modes in two fresh file-guarded roots and processes", () => {
    const proof = buildV138LiveV14GuardedProofForReview(ROOT)
    expect(proof).toMatchObject({ producerGuardCount: 0, actualModesPassed: 6, rootCount: 2, processCount: 2 })
    expect(proof.runs).toHaveLength(2)
    for (const run of proof.runs) {
      expect(run).toHaveLength(6)
      for (let i = 0; i < 6; i++) {
        expect(run[i]).toMatchObject({ mode: modes[i][0], status: modes[i][1], reducedValue: reductions[i] })
        expect(run[i].sourceRoot).toBe(sha(readFileSync(path.join(ROOT, SOURCE), "utf8")))
      }
    }
    expect(proof.normalizedEvidenceRoots).toHaveLength(2)
    expect(proof.normalizedEvidenceRoots[0]).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(proof.normalizedEvidenceRoots[0]).toBe(proof.normalizedEvidenceRoots[1])
    const publicBytes = canonical(proof)
    expect(publicBytes).not.toMatch(/\/Users\/|\/private\/|\/var\/|\/tmp\/|transcriptNonce|rootDevice|rootInode|rawDiagnostics|strategySource|StrategyMemory|SoldierMemory/)
    expect(publicBytes).not.toContain("3882cd5d3ec7a834e1de88254dd0daf955da12aa")
    expect(() => checkV138LiveV14RootBoundCustodyForReview(ROOT, proof)).toThrow()
  }, 540000)
})

const effects = [
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
]
function privateFixture<T>(work: (root: string) => T): T {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "v138-live14-stage-test-")))
  try {
    chmodSync(root, 0o700)
    mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true, mode: 0o700 })
    return work(root)
  } finally { rmSync(root, { recursive: true, force: true }) }
}
const stageInput = (stage: "pre" | "post", mask: number, outcome: Json | null): Json => ({
  stage, journalPresent: Boolean(mask & 1), privateDirectoryPresent: Boolean(mask & 2),
  terminalPresent: Boolean(mask & 4), lockPresent: Boolean(mask & 8), reproductionPresent: Boolean(mask & 16),
  downstreamPresent: Array(6).fill(false), outcome,
})
const outcomeFixture = (disposition: "exhausted" | "terminal_failure" | "succeeded" | "active"): Json => ({
  disposition, journalRoot: sha("journal"), stateRoot: sha("state"), completeCleanup: true,
  reproductionPresent: disposition === "succeeded", downstreamAuthority: "denied",
})

describe("stage predicate", () => {
  it("exhausts all32 producer presence combinations before and after the boundary", () => {
    const outcomes = [null, outcomeFixture("exhausted"), outcomeFixture("terminal_failure"), outcomeFixture("succeeded"), outcomeFixture("active")]
    for (const stage of ["pre", "post"] as const) for (let mask = 0; mask < 32; mask++) for (const outcome of outcomes) {
      const valid = mask === 0 && outcome === null || stage === "post" && (
        mask === 7 && outcome !== null && ["exhausted", "terminal_failure"].includes(outcome.disposition) ||
        mask === 23 && outcome?.disposition === "succeeded")
      const input = stageInput(stage, mask, outcome)
      if (valid) expect(validateV138LiveV14EffectValuesForReview(input)).toMatchObject({
        status: mask === 0 ? "no_effects" : mask === 23 ? "bounded_success" : "bounded_terminal", downstreamAuthority: "denied",
      })
      else expect(() => validateV138LiveV14EffectValuesForReview(input), `${stage}/${mask}/${outcome?.disposition ?? "none"}`).toThrow()
    }
  })
  it("rejects each downstream presence for every otherwise valid pre/post branch", () => {
    for (const input of [stageInput("pre", 0, null), stageInput("post", 0, null),
      stageInput("post", 7, outcomeFixture("exhausted")), stageInput("post", 23, outcomeFixture("succeeded"))]) {
      for (let index = 0; index < 6; index++) {
        const changed = structuredClone(input); changed.downstreamPresent[index] = true
        expect(() => validateV138LiveV14EffectValuesForReview(changed), `${input.stage}/downstream${index}`).toThrow()
      }
    }
  })
  it("rejects malformed stages, incomplete cleanup, residual lock, outcome mismatch and authority claims", () => {
    for (const [field, bad] of [["stage", "after"], ["journalPresent", 0], ["downstreamPresent", []],
      ["downstreamPresent", Array(7).fill(false)], ["downstreamPresent", [false, false, false, false, false, 0]]]) {
      const input = stageInput("post", 0, null); input[field as string] = bad
      expect(() => validateV138LiveV14EffectValuesForReview(input)).toThrow()
    }
    for (const [field, bad] of [["completeCleanup", false], ["disposition", "active"], ["downstreamAuthority", "allowed"], ["reproductionPresent", false]]) {
      const input = stageInput("post", 23, outcomeFixture("succeeded")); input.outcome[field as string] = bad
      expect(() => validateV138LiveV14EffectValuesForReview(input)).toThrow()
    }
    const unknownDisposition = stageInput("post", 7, outcomeFixture("exhausted"))
    unknownDisposition.outcome.disposition = "unknown_terminal"
    expect(() => validateV138LiveV14EffectValuesForReview(unknownDisposition)).toThrow()
    for (const field of Object.keys(stageInput("pre", 0, null))) {
      const input = stageInput("pre", 0, null); delete input[field]
      expect(() => validateV138LiveV14EffectValuesForReview(input), "missing " + field).toThrow()
    }
    expect(() => validateV138LiveV14EffectValuesForReview({ ...stageInput("pre", 0, null), override: true })).toThrow()
  })
  it("checks actual eleven absences and all forbidden final presences with owned temporary roots", () => {
    privateFixture((root) => {
      expect(checkV138LiveV14EffectState(root, "pre")).toMatchObject({ status: "no_effects", downstreamAuthority: "denied" })
      expect(checkV138LiveV14EffectState(root, "post")).toMatchObject({ status: "no_effects", downstreamAuthority: "denied" })
      for (const name of effects) {
        const destination = path.join(root, name)
        writeFileSync(destination, "{}\n", { flag: "wx", mode: 0o600 })
        try {
          expect(() => checkV138LiveV14EffectState(root, "pre"), name).toThrow()
          expect(() => checkV138LiveV14EffectState(root, "post"), name).toThrow()
        } finally { rmSync(destination) }
      }
      expect(effects.every((name) => !existsSync(path.join(root, name)))).toBe(true)
    })
  }, 60000)
  it("rejects the actual producer receipt manifest destination before and after effects", () => {
    privateFixture((root) => {
      const actualManifest = path.join(root, ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json")
      const obsolete142Path = path.join(root, ".planning/artifacts/v1.38-current-matrix-retry-private-receipt-manifest-v3.json")
      writeFileSync(actualManifest, "{\"syntheticReceiptManifest\":true}\n", { flag: "wx", mode: 0o600 })
      expect(existsSync(obsolete142Path)).toBe(false)
      const before = readFileSync(actualManifest)
      for (const stage of ["pre", "post"] as const) expect(() => checkV138LiveV14EffectState(root, stage)).toThrow()
      expect(readFileSync(actualManifest).equals(before)).toBe(true)
    })
  }, 60000)
  it("rejects every final symlink and invalid directory type without following targets", () => {
    privateFixture((root) => {
      const decoy = path.join(root, "decoy")
      writeFileSync(decoy, "private-decoy-bytes", { flag: "wx", mode: 0o600 })
      for (const name of effects) {
        const destination = path.join(root, name)
        symlinkSync(decoy, destination)
        try {
          for (const stage of ["pre", "post"] as const) expect(() => checkV138LiveV14EffectState(root, stage), `${stage}/${name}/symlink`).toThrow()
          expect(readFileSync(decoy, "utf8")).toBe("private-decoy-bytes")
        } finally { rmSync(destination) }
        mkdirSync(destination, { mode: 0o700 })
        try {
          for (const stage of ["pre", "post"] as const) expect(() => checkV138LiveV14EffectState(root, stage), `${stage}/${name}/directory`).toThrow()
        } finally { rmSync(destination, { recursive: true }) }
      }
    })
  }, 60000)
  it("rejects each symlinked/non-directory ancestor and a symlinked supplied root", () => {
    for (const ancestor of [".planning", ".planning/artifacts"]) for (const kind of ["symlink", "file"] as const) {
      privateFixture((root) => {
        const destination = path.join(root, ancestor)
        rmSync(destination, { recursive: true })
        if (kind === "file") writeFileSync(destination, "not-a-directory", { flag: "wx", mode: 0o600 })
        else {
          const decoy = path.join(root, "ancestor-decoy")
          mkdirSync(path.join(decoy, "artifacts"), { recursive: true, mode: 0o700 })
          symlinkSync(decoy, destination)
        }
        for (const stage of ["pre", "post"] as const) expect(() => checkV138LiveV14EffectState(root, stage), `${stage}/${ancestor}/${kind}`).toThrow()
      })
    }
    privateFixture((root) => {
      const link = path.join(root, "root-link"); symlinkSync(root, link)
      for (const stage of ["pre", "post"] as const) expect(() => checkV138LiveV14EffectState(link, stage)).toThrow()
    })
  }, 60000)
  it("rejects fabricated root provenance and copied publication fixtures before effects", () => {
    privateFixture((first) => privateFixture((second) => {
      const value = fixture()
      expect(validateV138LiveV14PublishedContractForReview(value)).toBe(true)
      for (const root of [first, second]) {
        for (const claimed of [value, JSON.parse(canonical(value)), { root, ...value }])
          expect(() => checkV138LiveV14RootBoundCustodyForReview(root, claimed)).toThrow()
        expect(effects.every((name) => !existsSync(path.join(root, name)))).toBe(true)
      }
    }))
  })
  it("preserves terminal/reproduction bytes through pure post-assurance error settlement", () => {
    privateFixture((root) => {
      const terminal = path.join(root, effects[3]), reproduction = path.join(root, effects[4])
      writeFileSync(terminal, "synthetic-terminal-must-survive\n", { mode: 0o600, flag: "wx" })
      writeFileSync(reproduction, "synthetic-reproduction-must-survive\n", { mode: 0o600, flag: "wx" })
      const before = [readFileSync(terminal), readFileSync(reproduction)]
      const producerError = new Error("synthetic producer failure"), postError = new Error("synthetic post custody failure")
      expect(() => settleV138LiveV9ProducerOutcomeForReview(undefined, undefined)).not.toThrow()
      expect(() => settleV138LiveV9ProducerOutcomeForReview(undefined, postError)).toThrow(postError)
      expect(() => settleV138LiveV9ProducerOutcomeForReview(producerError, undefined)).toThrow(producerError)
      try { settleV138LiveV9ProducerOutcomeForReview(producerError, postError); expect.unreachable() }
      catch (error) {
        expect(error).toBeInstanceOf(AggregateError)
        expect((error as AggregateError).errors).toEqual([producerError, postError])
        expect((error as AggregateError).cause).toBe(producerError)
      }
      expect(readFileSync(terminal).equals(before[0])).toBe(true)
      expect(readFileSync(reproduction).equals(before[1])).toBe(true)
      expect(effects.filter((_, i) => i !== 3 && i !== 4).every((name) => !existsSync(path.join(root, name)))).toBe(true)
    })
  })
})

describe("stage predicate physical terminal fixtures", () => {
  it("accepts a physical exhausted journal and rejects terminal and private receipt tampering without producer execution", async () => {
    const { appendV138RetryV3JournalRecord, deriveV138RetryV3State, checkV138InactiveRetryV3Envelope } =
      await import("./lib/v1-38-bounded-retry-envelope-v3.js")
    const envelopePath = ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json"
    // Read the frozen envelope as data only. All synthetic charges and output
    // files below exist solely inside this disposable fixture, never at ROOT.
    const envelopeBytes = readFileSync(path.join(ROOT, envelopePath))
    const envelope = checkV138InactiveRetryV3Envelope(JSON.parse(envelopeBytes.toString()))
    let records = appendV138RetryV3JournalRecord([], {
      kind: "reserve_preflight", identity: "preflight:v3:0", owner: "synthetic-post-fixture",
    }, 0, envelope.envelopeRoot)
    records = appendV138RetryV3JournalRecord(records, {
      kind: "observe_preflight", identity: "preflight:v3:0", owner: "synthetic-post-fixture",
      effectiveAvailableBasisPoints: 0,
    }, 0, envelope.envelopeRoot)
    records = appendV138RetryV3JournalRecord(records, {
      kind: "time_window_expired", owner: "synthetic-post-fixture", reason: "time_window_expired",
    }, 4 * 60 * 60 * 1000, envelope.envelopeRoot)
    const state = deriveV138RetryV3State(envelope, records)
    expect(state).toMatchObject({ disposition: "exhausted", completeCleanup: true,
      acceptedCells: 0, calibrationIdentitiesCharged: 0, reproductionIdentitiesCharged: 0 })
    // Independent projection from the frozen producer's terminal contract.
    const terminal = {
      schemaVersion: "v1.38-current-matrix-retry-terminal-v3", terminalReason: state.terminalReason,
      journalRoot: state.journalRoot, stateRoot: state.stateRoot, disposition: state.disposition,
      counters: { preflightObservationsConsumed: state.preflightObservationsConsumed,
        routeStartsConsumed: state.routeStartsConsumed, calibrationIdentitiesCharged: state.calibrationIdentitiesCharged,
        reproductionIdentitiesCharged: state.reproductionIdentitiesCharged, acceptedCells: state.acceptedCells },
      freshAccepted: state.acceptedCells, completeCleanup: state.completeCleanup,
      downstreamAuthority: "denied", productionAuthorized: false,
    }
    privateFixture((root) => {
      writeFileSync(path.join(root, envelopePath), envelopeBytes, { flag: "wx", mode: 0o600 })
      const journalPath = path.join(root, effects[0]), privatePath = path.join(root, effects[2])
      const terminalPath = path.join(root, effects[3])
      mkdirSync(privatePath, { mode: 0o700 })
      writeFileSync(journalPath, records.map(canonical).join(""), { flag: "wx", mode: 0o600 })
      writeFileSync(terminalPath, canonical(terminal), { flag: "wx", mode: 0o600 })
      // The actual producer retains this legitimate bootstrap file alongside receipts.
      writeFileSync(path.join(privatePath, "journal-bootstrap.commit"), "committed\n", { flag: "wx", mode: 0o600 })
      const receipts = records.map((record) => {
        const receipt = path.join(privatePath, `journal-record-${String(record.ordinal).padStart(4, "0")}.json`)
        writeFileSync(receipt, canonical(record), { flag: "wx", mode: 0o600 })
        return receipt
      })
      const originalJournal = readFileSync(journalPath)
      expect(checkV138LiveV14EffectState(root, "post")).toMatchObject({ status: "bounded_terminal", downstreamAuthority: "denied" })
      expect(() => checkV138LiveV14EffectState(root, "pre")).toThrow()

      writeFileSync(terminalPath, canonical({ ...terminal, freshAccepted: 540 }))
      const badTerminal = readFileSync(terminalPath)
      expect(() => checkV138LiveV14EffectState(root, "post")).toThrow(/TERMINAL_INVALID/)
      expect(readFileSync(terminalPath).equals(badTerminal)).toBe(true)
      writeFileSync(terminalPath, canonical(terminal))

      writeFileSync(receipts[1]!, canonical({ ...records[1], owner: "tampered-owner" }))
      const badReceipt = readFileSync(receipts[1]!)
      expect(() => checkV138LiveV14EffectState(root, "post")).toThrow(/PRIVATE_RECEIPT/)
      expect(readFileSync(receipts[1]!).equals(badReceipt)).toBe(true)
      writeFileSync(receipts[1]!, canonical(records[1]))
      chmodSync(receipts[1]!, 0o644)
      expect(() => checkV138LiveV14EffectState(root, "post")).toThrow(/PRIVATE_RECEIPT/)
      chmodSync(receipts[1]!, 0o600)

      expect(checkV138LiveV14EffectState(root, "post")).toMatchObject({ status: "bounded_terminal", downstreamAuthority: "denied" })
      expect(readFileSync(journalPath).equals(originalJournal)).toBe(true)
      expect(readFileSync(path.join(ROOT, envelopePath)).equals(envelopeBytes)).toBe(true)
      expect([effects[1], effects[4], ...effects.slice(5)].every((name) => !existsSync(path.join(root, name)))).toBe(true)
    })
  }, 60000)
})
