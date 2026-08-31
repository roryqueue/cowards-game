import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { validateV138LiveV14PublishedContractForReview } from "./run-v1-38-bounded-retry-envelope-v3-live-v14.js"

type Json = Record<string, any>
const SOURCE = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"
const REVIEWER = "scripts/check-v1-38-plan-262-143-live-v13-custody-review-v10.ts"
const PAYLOAD = ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-payload-v10.json"
const REVIEW = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-143-REVIEW-v10.md"
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
      observationsRoot: sha("historical142 observations values only"), plan110Eligible: false,
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
})

describe("closed producer boundary", () => {
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
    }
    expect(all.filter(ts.isCallExpression).filter((n) => n.expression.kind === ts.SyntaxKind.ImportKeyword)).toHaveLength(0)
  })
})
