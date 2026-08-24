import { execFileSync, spawnSync } from "node:child_process"
import { chmodSync, closeSync, fsyncSync, linkSync, mkdtempSync, mkdirSync, openSync,
  readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync,
  writeSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { hashCanonicalIdentity } from "@cowards/spec"
import {
  PLAN_60_CONVERGENCE,
  V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS,
  PLAN_60_REVIEW_FIX_SHA256,
  PLAN_60_V9_SHA256,
  R3_PATHS,
  SOURCE_A9,
  SOURCE_A9_TREE,
  SOURCE_BASE9,
  SUMMARY_BLOB,
  SUMMARY_CARRIER,
  SUMMARY_PATH,
  SUMMARY_SHA256,
  canonicalV138ReviewerV3,
  auditLogicalRouteOutput,
  buildV138Plan26261PairAudit,
  assembleExpectedPlan26262Review,
  assertV138Plan26261CandidateCleanliness,
  assertV138Plan26261SummaryPublicationState,
  assertV138Plan26261NoCrashLeak,
  deriveV138Plan26261NoPublish,
  deterministicRouteCustody,
  inspectCommittedR3,
  inspectReviewerConvergence,
  inspectV138Plan26261A9Custody,
  inspectV138Plan26261Lifecycle,
  inspectV138Plan26261Predecessors,
  inspectV138Plan26261ProtectedHistory,
  inspectV138Plan26261RepositoryFile,
  inspectV138Plan26261Receipt,
  inspectV138Plan26261SummaryConvergence,
  installRouteFsObserver,
  inventoryChangedPaths,
  selectCompletedAgentHistory,
  sha256V138ReviewerV3,
  snapshotReadiness,
  normalizedPlan26262ReportContentRoot,
  runV138Plan26261ReviewerCli,
  validatePlan26262ReportManifest,
  validatePlan26262Summary,
  validatePlan26262ReviewAgainstExpected,
  validateV138Plan26261RouteEffects,
  validateV138Plan26261RouteResult,
  validateV138Plan26261FreshRoutePairIsolation,
  validateV138Plan26261PairAudit,
  validateV138Plan26261SemanticEventPair,
  projectV138Plan26261LogicalExecutionResult,
  verifyV138Plan26261LogicalExecutionResult,
  verifyV138Plan26261PhysicalLogicalEventPreimages,
  physicalEventDetailRootV138Plan26261,
  logicalEventDetailRootV138Plan26261,
  verifyV138Plan26261RouteIdentity,
  verifyAndProjectV138Plan26261DerivedRouteRoot,
  verifyAndProjectV138Plan26261PersistedRouteFile,
  observeV138Plan26261RouteDispatch,
  observeV138Plan26261RouteDispatchPair,
} from "./check-v1-38-plan-262-61-source-completeness-review-v3.js"
import {
  V138_REVIEW_V3_CANONICAL_PATH,
  V138_REVIEW_V3_COMMANDS,
  V138_REVIEW_V3_REPORT_PATH,
  V138_REVIEW_V3_ROUTE_MANIFEST,
  V138_REVIEW_V3_SOURCE_PATHS,
  buildV138ReviewV3CommandArgv,
  computeV138ReviewV3Root,
} from "./lib/v1-38-source-completeness-review-v3.js"
import { inspectV138SourceA9Custody } from "./lib/v1-38-successor-source-seal.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const checkerPath = path.join(repoRoot,
  "scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts")
const disposable: string[] = []
const git = (cwd: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}).trim()
const clone = () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-review-v3-"))
  disposable.push(directory)
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", repoRoot, directory],
    { maxBuffer: 64 * 1024 * 1024 })
  return realpathSync(directory)
}
const commitAll = (cwd: string, message: string) => {
  execFileSync("git", ["add", "-A"], { cwd })
  execFileSync("git", ["-c", "user.name=Fixture", "-c",
    "user.email=fixture@example.invalid", "commit", "--quiet", "-m", message], { cwd })
}

const firstExactDifference = (left: unknown, right: unknown,
  location = "$" ): string | null => {
  if (Object.is(left, right)) return null
  if (left === null || right === null || typeof left !== "object" ||
    typeof right !== "object")
    return `${location}: ${JSON.stringify(left)} !== ${JSON.stringify(right)}`
  if (Array.isArray(left) !== Array.isArray(right))
    return `${location}: collection types differ`
  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const keys = [...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])]
    .sort()
  for (const key of keys) {
    if (!(key in leftRecord) || !(key in rightRecord))
      return `${location}.${key}: field presence differs`
    const difference = firstExactDifference(leftRecord[key], rightRecord[key],
      `${location}.${key}`)
    if (difference !== null) return difference
  }
  return null
}
const boundedLeafDifferences = (left: unknown, right: unknown, limit = 32) => {
  const differences: string[] = []
  const visit = (leftValue: unknown, rightValue: unknown, location: string) => {
    if (differences.length >= limit || Object.is(leftValue, rightValue)) return
    if (leftValue === null || rightValue === null || typeof leftValue !== "object" ||
      typeof rightValue !== "object") { differences.push(location); return }
    const leftRecord = leftValue as Record<string, unknown>
    const rightRecord = rightValue as Record<string, unknown>
    for (const key of [...new Set([...Object.keys(leftRecord),
      ...Object.keys(rightRecord)])].sort()) {
      if (differences.length >= limit) break
      if (!(key in leftRecord) || !(key in rightRecord)) differences.push(`${location}.${key}`)
      else visit(leftRecord[key], rightRecord[key], `${location}.${key}`)
    }
  }
  visit(left, right, "$")
  return differences
}
const testIdentityRoot = (domain: "evidenceBundle" | "artifactManifest",
  schemaVersion: string, value: unknown) => `sha256:${hashCanonicalIdentity(domain, [
    Buffer.from(schemaVersion, "utf8"),
    Buffer.from(canonicalV138ReviewerV3(value), "utf8"),
  ])}`
const rerootPairAudit = (value: any) => {
  const audit = structuredClone(value)
  for (const run of audit.runs) {
    for (const commitment of run.physicalCommitments ?? []) {
      const body = { ...commitment }; delete body.commitmentRoot
      commitment.commitmentRoot = testIdentityRoot("evidenceBundle",
        "v1.38-plan-262-61-local-observation-commitment-v1", body)
    }
    for (const evidence of run.projectionEvidenceLedger ?? []) {
      const body = { ...evidence }; delete body.evidenceRoot
      evidence.evidenceRoot = testIdentityRoot("evidenceBundle",
        "v1.38-plan-262-61-projection-evidence-v1", body)
    }
    for (const evidence of run.routeEvidence ?? [])
      evidence.eventEvidenceRoot = testIdentityRoot("evidenceBundle",
        "v1.38-plan-262-61-route-event-evidence-v1", evidence.commandEvents)
    const body = { ...run }; delete body.runAuditRoot
    run.runAuditRoot = testIdentityRoot("evidenceBundle", body.schemaVersion, body)
  }
  audit.logicalProjectionRoot = testIdentityRoot("artifactManifest",
    "v1.38-plan-262-61-logical-projection-manifest-v2",
    audit.logicalProjectionManifest)
  const body = { ...audit }; delete body.pairAuditRoot
  audit.pairAuditRoot = testIdentityRoot("evidenceBundle", body.schemaVersion, body)
  return audit
}
const syncLedgerEvent = (audit: any, runIndex: number, eventIndex: number) => {
  const ledger = audit.runs[runIndex].eventLedger[eventIndex]
  ledger.resultRoot = sha256V138ReviewerV3(ledger.resultPreimage)
  const evidence = audit.runs[runIndex].routeEvidence.find(
    (candidate: any) => candidate.command === ledger.command)
  const projected = evidence.commandEvents.find(
    (candidate: any) => candidate.ordinal === ledger.ordinal)
  if (projected !== undefined) {
    projected.event = ledger.event; projected.location = ledger.location
    projected.changed = ledger.changed; projected.resultRoot = ledger.resultRoot
  }
}
const rerootProjectionMutation = (value: any, runIndex: number,
  labelPrefix: string) => {
  const audit = structuredClone(value)
  const run = audit.runs[runIndex]
  const projection = run.projectionLedger.find((candidate: any) =>
    candidate.label.startsWith(labelPrefix))
  const projectionEvidence = run.projectionEvidenceLedger[projection.ordinal]
  projection.physical = `sha256:${"d".repeat(64)}`
  projection.projected = projection.physical !== projection.logical
  projectionEvidence.physical = projection.physical
  if (projectionEvidence.command !== null) {
    const ledgerIndex = run.eventLedger.findIndex((event: any) =>
      event.command === projectionEvidence.command &&
      event.event === `execute:${event.handler}`)
    const result = JSON.parse(run.eventLedger[ledgerIndex].resultPreimage)
    const tuple = result.projectionTuples.find((candidate: any) =>
      candidate.label === projection.label)
    tuple.physical = projection.physical
    run.eventLedger[ledgerIndex].resultPreimage = canonicalV138ReviewerV3(result)
    syncLedgerEvent(audit, runIndex, ledgerIndex)
  }
  return rerootPairAudit(audit)
}

afterEach(() => {
  while (disposable.length > 0) rmSync(disposable.pop()!, { recursive: true, force: true })
})

describe("Plan 262-61 independent exact-A9 reviewer-v3", () => {
  it("pins exact final A9 as one four-path V8 layer", () => {
    const custody = inspectV138Plan26261A9Custody(repoRoot)
    expect(custody).toMatchObject({ sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9,
      tree: SOURCE_A9_TREE, parent: SOURCE_BASE9,
      authorRun: "codex-plan-262-60-a9-review-fix-v8" })
    expect(custody.paths).toEqual([...V138_REVIEW_V3_SOURCE_PATHS].sort())
    expect(custody.blobs).toHaveLength(4)
    expect(custody.blobs.every(({ mode, blobOid, sha256, byteLength }) =>
      mode === "100644" && /^[0-9a-f]{40}$/u.test(String(blobOid)) &&
      /^sha256:[0-9a-f]{64}$/u.test(sha256) && byteLength > 0)).toBe(true)
  })

  it("derives the private V3-V7 tips and five following carriers from Git", () => {
    const layers = inspectV138Plan26261Predecessors(repoRoot)
    expect(layers.map(({ tip }) => tip.slice(0, 8)))
      .toEqual(["32eef5c1", "c5a08bd5", "5bf78391", "704eed00", "c60146dc"])
    expect(layers.map(({ carrier }) => carrier.slice(0, 8)))
      .toEqual(["7ce7e1e9", "bff3a3ca", "b1352f7e", "f42afce0", "1f6a8b4c"])
    expect(layers.every(({ tipParent, carrierParent, tip, tipTree, carrierTree,
      tipPaths, carrierPaths, carrierBlobs }) =>
      /^[0-9a-f]{40}$/u.test(tipParent) && carrierParent === tip &&
      /^[0-9a-f]{40}$/u.test(tipTree) && /^[0-9a-f]{40}$/u.test(carrierTree) &&
      tipPaths.length > 0 && carrierPaths.length === carrierBlobs.length)).toBe(true)
  })

  it("derives the unique current-byte summary carrier and later immutable convergence", () => {
    const value = inspectV138Plan26261SummaryConvergence(repoRoot)
    expect(value).toEqual({ carrierCommit: SUMMARY_CARRIER, carrierBlob: SUMMARY_BLOB,
      carrierSha256: SUMMARY_SHA256, carrierByteLength: 12486,
      convergenceCommit: PLAN_60_CONVERGENCE,
      v9Blob: "6611ca2b9087e491a3830816278e81d8aa2e7c35",
      v9Root: PLAN_60_V9_SHA256,
      reviewFixBlob: "c1f687c827a4f61d95a9e6b52bfe5e72f8c7449e",
      reviewFixRoot: PLAN_60_REVIEW_FIX_SHA256 })
  })

  it("derives exactly forty charges, six immutable authorizations, and protected roots", () => {
    const history = inspectV138Plan26261ProtectedHistory(repoRoot)
    expect(history.chargeIds).toHaveLength(40)
    expect(new Set(history.chargeIds).size).toBe(40)
    expect(history.authorizations).toHaveLength(6)
    expect(history.authorizations.every(({ commit, blobOid, sha256, byteLength }) =>
      /^[0-9a-f]{40}$/u.test(commit) && /^[0-9a-f]{40}$/u.test(blobOid) &&
      /^sha256:[0-9a-f]{64}$/u.test(sha256) && byteLength > 0)).toBe(true)
    expect(Object.values(history.protectedRoots).every((value) =>
      /^sha256:[0-9a-f]{64}$/u.test(String(value)))).toBe(true)
  })

  it("rejects replacement committed authorization bytes from immutable history", () => {
    const directory = clone()
    const target = path.join(directory,
      ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json")
    writeFileSync(target, "{}\n")
    commitAll(directory, "replace frozen authorization")
    expect(() => inspectV138Plan26261ProtectedHistory(directory))
      .toThrow("V138_PLAN_262_61_POST_A9_AUTHORIZATION_HISTORY_DRIFT")
  })

  it("rejects mutate-then-restore authorization history after A9", () => {
    const directory = clone()
    const target = path.join(directory,
      ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json")
    const exact = readFileSync(target)
    writeFileSync(target, "{}\n"); commitAll(directory, "mutate authorization")
    writeFileSync(target, exact); commitAll(directory, "restore authorization")
    expect(() => inspectV138Plan26261ProtectedHistory(directory))
      .toThrow("V138_PLAN_262_61_POST_A9_AUTHORIZATION_HISTORY_DRIFT")
  })

  it("derives the exact live 48-plan graph, archive, and lifecycle", () => {
    const lifecycle = inspectV138Plan26261Lifecycle(repoRoot)
    expect(lifecycle).toMatchObject({ totalPlans: 48,
      summaries: 43, incomplete: ["262-48", "262-56", "262-57", "262-61", "262-62"] })
    expect(lifecycle.graph).toHaveLength(48)
    expect(lifecycle.archive)
      .toEqual(["03", "04", "05", "06", "07", "40", "43", "46", "47", "48",
        "50", "55", "58", "59"])
  }, 30_000)

  it("builds full unique argv for every real route command and terminal branch", () => {
    expect(V138_REVIEW_V3_ROUTE_MANIFEST.map(({ command }) => command).sort())
      .toEqual([...V138_REVIEW_V3_COMMANDS].sort())
    const records = V138_REVIEW_V3_ROUTE_MANIFEST.map((entry) => ({ ...entry,
      argv: buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9, "f".repeat(40)) }))
    expect(new Set(records.map(({ command }) => command))).toHaveProperty("size", 10)
    expect(records.every(({ command, handler, destination, argv }) =>
      argv.includes(command) && argv.includes(SOURCE_A9) &&
      typeof handler === "string" && handler.length > 0 &&
      typeof destination === "string" && destination.startsWith(".planning/")))
      .toBe(true)
    expect(records.map(({ terminalDisposition }) => terminalDisposition).join("|"))
      .toContain("reproduction_passed")
  })

  it("executes all production direct-entry branches in an exact-A9 disposable clone", async () => {
    const value = await observeV138Plan26261RouteDispatch(repoRoot)
    expect(value.observations).toHaveLength(10)
    expect(value.observations.every(({ exit, argv, command, handler }) =>
      (exit === 0 || exit === 1) &&
      argv[2] === command && (handler.startsWith("checkV138") ||
        handler.startsWith("writeV138"))))
      .toBe(true)
    expect(value.observations.some(({ exit }) => exit === 0)).toBe(true)
    expect(value.observations.every(({ outputRoot }) =>
      /^sha256:[0-9a-f]{64}$/u.test(outputRoot))).toBe(true)
    expect(value.observations.find(({ command }) =>
      command === "--calibrate-parallel-v11-receipt")).toMatchObject({ exit: 1,
      resultCode: "MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID",
      observedDisposition: "calibration_source_defect",
      outputRoot: "sha256:52f2b53101c192e5e045dba64a85da993375f2dfb8d288ed8879cf93c3b45740" })
    expect(value.observations.every(({ callCount, callTraceRoot, functionRangeRoot }) =>
      callCount > 0 && /^sha256:[0-9a-f]{64}$/u.test(callTraceRoot) &&
      /^sha256:[0-9a-f]{64}$/u.test(functionRangeRoot))).toBe(true)
    const alias = value.observations.find(({ command }) =>
      command === "--write-execution-context-v11-receipt")
    expect(alias).toMatchObject({ handler: "writeV138Plan26257RouteStartV1",
      manifestHandler: "writeV138ExecutionContextV11Receipt",
      aliasAudit: null,
      sourceFinding: "V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS" })
    expect(value.events.some(({ event }) => /:(?:openSync|writeSync|linkSync|renameSync|unlinkSync)/u
      .test(event))).toBe(true)
    const semanticEffect = value.events.find(({ event }) => event.includes(":writeFileSync"))
    const parsedEffect = JSON.parse(semanticEffect.result)
    expect(Object.hasOwn(parsedEffect, "flags")).toBe(true)
    expect(parsedEffect).toEqual(expect.objectContaining({
      sideEffect: expect.any(String),
      outcome: "success", errorCode: null,
      beforeState: expect.objectContaining({ type: expect.any(String) }),
      afterState: expect.objectContaining({ type: expect.any(String) }),
      detailRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u) }))
    expect(value.snapshots).toHaveLength(2)
    expect(value.snapshots.every(({ pathCount }) => pathCount > 100)).toBe(true)
    expect(value.cleanup).toEqual(expect.objectContaining({ complete: true,
      residualPaths: [] }))
    expect(value.syntheticPrerequisitePublication.semanticEvidenceEligible).toBe(false)
    expect(value.postExecutionPublication).toMatchObject({
      semanticEvidenceEligible: false,
      changedPaths: [V138_REVIEW_V3_CANONICAL_PATH, V138_REVIEW_V3_REPORT_PATH] })
    expect(value.logicalPostExecutionPublication).toMatchObject({
      identityKind: "logical_synthetic_publication",
      semanticEvidenceEligible: false,
      publicationIdentityRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      treeRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      reviewBlobRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      reportBlobRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      semanticRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u) })
    expect(value.b9ChangedPaths).toEqual([
      ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
      ".planning/artifacts/v1.38-successor-source-seal-v9.json",
    ])
  }, 600_000)

  it("produces byte-identical semantic evidence in two independent fresh derivations",
    async () => {
      const { left, right } = await observeV138Plan26261RouteDispatchPair(repoRoot)
      const pairAudit = buildV138Plan26261PairAudit(left, right)
      const leftCustody = deterministicRouteCustody(left, pairAudit) as
        Record<string, any>
      const rightCustody = deterministicRouteCustody(right, pairAudit) as
        Record<string, any>
      expect(validateV138Plan26261PairAudit(leftCustody.pairAudit)).toBe(true)
      expect(leftCustody.pairAudit.pairAuditRoot)
        .toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(left.physicalIsolation.detachedInput).toMatchObject({
        independentlyValidated: true, regularFile: true, linkCount: 1, mode: 0o444 })
      expect(right.physicalIsolation.detachedInput).toMatchObject({
        independentlyValidated: true, regularFile: true, linkCount: 1, mode: 0o444 })
      expect(left.physicalIsolation.detachedInput.pathRoot)
        .not.toBe(right.physicalIsolation.detachedInput.pathRoot)
      expect(left.physicalIsolation.detachedInput.identityRoot)
        .not.toBe(right.physicalIsolation.detachedInput.identityRoot)
      expect(left.b9Custody.identityKind).toBe("logical_synthetic_b9")
      expect(right.b9Custody.identityKind).toBe("logical_synthetic_b9")
      expect(left.physicalIsolation.identityKind).toBe("physical_execution_b9")
      expect(right.physicalIsolation.identityKind).toBe("physical_execution_b9")
      expect(left.physicalIsolation.executionSourceB9).not.toBe(left.sourceB9)
      expect(right.physicalIsolation.executionSourceB9).not.toBe(right.sourceB9)
      expect(left.physicalIsolation.physicalToLogicalProjection.map(
        ({ label }: any) => label)).toEqual(
        V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS)
      expect(left.physicalIsolation.physicalToLogicalProjection.map(
        ({ logical }: any) => logical)).toEqual(
        right.physicalIsolation.physicalToLogicalProjection.map(
          ({ logical }: any) => logical))
      for (const [index, projection] of left.physicalIsolation
        .physicalToLogicalProjection.entries()) {
        const repeated = right.physicalIsolation.physicalToLogicalProjection[index]
        expect(projection).toMatchObject({ ordinal: index,
          label: V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS[index],
          physical: expect.any(String), logical: expect.any(String),
          projected: expect.any(Boolean), independentlyValidated: true })
        expect(projection.projected).toBe(projection.physical !== projection.logical)
        if (projection.projected)
          expect(projection.physical).not.toBe(repeated.physical)
        else expect(projection.physical).toBe(repeated.physical)
      }
      expect(left.physicalIsolation.routeClones.map(({ group }: any) => group))
        .toEqual(right.physicalIsolation.routeClones.map(({ group }: any) => group))
      for (const [index, leftClone] of left.physicalIsolation.routeClones.entries()) {
        const rightClone = right.physicalIsolation.routeClones[index]
        expect(leftClone).toMatchObject({ independentlyValidated: true,
          sourceB9: left.physicalIsolation.executionSourceB9,
          logicalSourceB9: left.sourceB9 })
        expect(rightClone).toMatchObject({ independentlyValidated: true,
          sourceB9: right.physicalIsolation.executionSourceB9,
          logicalSourceB9: right.sourceB9 })
        expect(leftClone.pathRoot).not.toBe(rightClone.pathRoot)
        expect(leftClone.identityRoot).not.toBe(rightClone.identityRoot)
      }
      expect(left.physicalIsolation.obstructionInputs).toHaveLength(1)
      expect(right.physicalIsolation.obstructionInputs).toHaveLength(1)
      expect(left.physicalIsolation.obstructionInputs[0]).toMatchObject({
        independentlyValidated: true, byteLength: 3, mode: 0o644 })
      expect(left.physicalIsolation.obstructionInputs[0].pathRoot)
        .not.toBe(right.physicalIsolation.obstructionInputs[0].pathRoot)
      expect(left.physicalIsolation.obstructionInputs[0].identityRoot)
        .not.toBe(right.physicalIsolation.obstructionInputs[0].identityRoot)
      expect(left.logicalInputCustody).toEqual(right.logicalInputCustody)
      expect(validateV138Plan26261SemanticEventPair(left.events, right.events))
        .toBe(true)
      const logicalPublicationDifferences = boundedLeafDifferences(
        leftCustody.logicalPostExecutionPublication,
        rightCustody.logicalPostExecutionPublication)
      expect(logicalPublicationDifferences,
        `logical publication leaf differences (max 32): ${logicalPublicationDifferences.join(",")}`)
        .toEqual([])
      expect(boundedLeafDifferences(left.postExecutionPublication,
        right.postExecutionPublication)).toEqual(expect.arrayContaining([
          "$.commit", "$.tree", "$.reviewBlob", "$.reviewRoot" ]))
      expect(firstExactDifference(leftCustody, rightCustody),
        "first exact custody difference").toBeNull()
      expect(canonicalV138ReviewerV3(leftCustody))
        .toBe(canonicalV138ReviewerV3(rightCustody))
      expect(leftCustody.b9).toEqual(expect.objectContaining({
        commit: left.sourceB9, parent: left.publicationCommit,
        tree: expect.stringMatching(/^[0-9a-f]{40}$/u),
        changedPaths: left.b9ChangedPaths,
        authorizationBlob: expect.stringMatching(/^[0-9a-f]{40}$/u),
        authorizationRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        sealBlob: expect.stringMatching(/^[0-9a-f]{40}$/u),
        sealRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u) }))
      expect(leftCustody.observations).toHaveLength(10)
      expect(leftCustody.observations.every((value: Record<string, unknown>) =>
        /^sha256:[0-9a-f]{64}$/u.test(String(value.outputRoot)) &&
        Number(value.outputByteLength) > 0 && value.callCount === 1 &&
        /^sha256:[0-9a-f]{64}$/u.test(String(value.callTraceRoot)) &&
        /^sha256:[0-9a-f]{64}$/u.test(String(value.functionRangeRoot)) &&
        /^sha256:[0-9a-f]{64}$/u.test(String(value.effectPolicyRoot)))).toBe(true)
      const exactMutationPaths = [
        ["b9", "commit"], ["b9", "parent"], ["b9", "tree"],
        ["b9", "authorizationBlob"], ["b9", "authorizationRoot"],
        ["b9", "sealBlob"], ["b9", "sealRoot"],
        ["prerequisitePublication", "commit"],
        ["prerequisitePublication", "parent"],
        ["prerequisitePublication", "tree"],
        ["prerequisitePublication", "reviewBlob"],
        ["prerequisitePublication", "reviewRoot"],
        ["prerequisitePublication", "reportBlob"],
        ["prerequisitePublication", "reportRoot"],
        ["logicalPostExecutionPublication", "publicationIdentityRoot"],
        ["logicalPostExecutionPublication", "treeRoot"],
        ["logicalPostExecutionPublication", "reviewBlobRoot"],
        ["logicalPostExecutionPublication", "reportBlobRoot"],
        ["logicalPostExecutionPublication", "semanticRoot"],
        ["observations", 0, "outputRoot"],
        ["observations", 0, "outputByteLength"],
        ["observations", 0, "callTraceRoot"],
        ["observations", 0, "functionRangeRoot"],
        ["observations", 0, "callCount"],
        ["logicalInputCustody", "canonicalPath"],
        ["logicalInputCustody", "bytesSha256"],
        ["logicalInputCustody", "byteLength"],
        ["logicalInputCustody", "inputCommit"],
        ["logicalInputCustody", "inputBlob"],
        ["pairAudit", "pairAuditRoot"],
        ["pairAudit", "logicalProjectionRoot"],
        ["pairAudit", "cleanupComplete"],
        ["pairAudit", "runs", 0, "executionSourceB9"],
        ["pairAudit", "runs", 0, "runAuditRoot"],
        ["pairAudit", "runs", 0, "physicalCommitments", 6, "pathComponentRoot"],
        ["pairAudit", "runs", 0, "physicalCommitments", 0,
          "inodeDeviceComponentRoot"],
        ["pairAudit", "runs", 0, "physicalCommitments", 1,
          "inodeDeviceComponentRoot"],
        ["pairAudit", "runs", 0, "physicalCommitments", 5,
          "inodeDeviceComponentRoot"],
        ["pairAudit", "runs", 0, "projectionLedger", 0, "physical"],
        ["pairAudit", "runs", 0, "routeIdentityAudits", 0,
          "physicalRouteIdentityRoot"],
        ["pairAudit", "runs", 0, "routeEvidence", 0, "eventEvidenceRoot"],
        ["pairAudit", "runs", 0, "routeEvidence", 0, "commandEvents", 0,
          "resultRoot"],
        ["pairAudit", "logicalProjectionManifest", 0, "logical"],
      ] as const
      const expectedWrapper = { completeRouteCustody: leftCustody,
        custody: { completeRouteCustody: leftCustody } }
      for (const mutationPath of exactMutationPaths) {
        const candidate = structuredClone(expectedWrapper) as Record<string, any>
        let cursor: any = candidate.completeRouteCustody
        for (const part of mutationPath.slice(0, -1)) cursor = cursor[part]
        const key = mutationPath.at(-1)!
        cursor[key] = typeof cursor[key] === "number" ? cursor[key] + 1 : "0".repeat(40)
        const assertion = expect(() => validatePlan26262ReportManifest(candidate,
          expectedWrapper))
        if (mutationPath[0] === "pairAudit") assertion.toThrow()
        else assertion.toThrow("V138_PLAN_262_62_REVIEW_REPORT_BINDING_INVALID")
      }

      const independentlyRerooted = structuredClone(pairAudit) as any
      independentlyRerooted.runs[0].physicalCommitments[0].pathComponentRoot =
        `sha256:${"e".repeat(64)}`
      const independentlyInvalid = rerootPairAudit(independentlyRerooted)
      expect(independentlyInvalid.pairAuditRoot).not.toBe(pairAudit.pairAuditRoot)
      expect(() => validateV138Plan26261PairAudit(independentlyInvalid)).toThrow(
        "V138_PLAN_262_61_PAIR_AUDIT_COMMITMENT_INVALID")
      for (const commitmentIndex of [0, 1, 2, 3, 4, 5, 6]) {
        for (const component of ["pathComponentRoot",
          "inodeDeviceComponentRoot"] as const) {
          const candidate = structuredClone(pairAudit) as any
          candidate.runs[0].physicalCommitments[commitmentIndex][component] =
            `sha256:${String(commitmentIndex + 1).repeat(64).slice(0, 64)}`
          expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
            .toThrow("V138_PLAN_262_61_PAIR_AUDIT_COMMITMENT_INVALID")
        }
      }
      for (const mutateClaim of [
        (candidate: any) => { candidate.assurance = "independent_custody_v1" },
        (candidate: any) => { candidate.independentCustody = true },
        (candidate: any) => { candidate.rawPhysicalPreimageRetained = true },
        (candidate: any) => { candidate.runs[0].assurance =
          "independent_custody_v1" },
        (candidate: any) => { candidate.runs[0].independentCustody = true },
        (candidate: any) => { candidate.runs[0].rawPhysicalPreimageRetained = true },
      ]) {
        const candidate = structuredClone(pairAudit) as any
        mutateClaim(candidate)
        expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
          .toThrow()
      }
      for (const mutatePublication of [
        (candidate: any) => { candidate.runs[0].logicalPublicationEvidence.commit =
          candidate.runs[0].physicalPublicationEvidence.commit },
        (candidate: any) => { candidate.runs[0].logicalPublicationEvidence.semanticRoot =
          `sha256:${"d".repeat(64)}` },
        (candidate: any) => { delete candidate.runs[0].physicalPublicationEvidence },
        (candidate: any) => { candidate.runs[1].physicalPublicationEvidence =
          structuredClone(candidate.runs[0].physicalPublicationEvidence) },
      ]) {
        const candidate = structuredClone(pairAudit) as any
        mutatePublication(candidate)
        expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
          .toThrow()
      }
      for (const field of ["authorizationRoot", "sealRoot", "executionCommit",
        "executionBlobRoot", "handlerValidationRoot"] as const) {
        const candidate = structuredClone(pairAudit) as any
        candidate.runs[0].physicalCommitments[0][field] = field ===
          "executionCommit" ? "e".repeat(40) : `sha256:${"e".repeat(64)}`
        expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
          .toThrow("V138_PLAN_262_61_PAIR_AUDIT_COMMITMENT_INVALID")
      }
      for (const projectionClass of ["authorization-bytes-root",
        "seal-bytes-root", "execution-b9", "authorization-root", "seal-root",
        "route-obstruction-metadata:", "route-derived-root:",
        "route-persisted-receipt:", "route-reservation-claim:",
        "route-output:"]) {
        expect(() => validateV138Plan26261PairAudit(rerootProjectionMutation(
          pairAudit, 0, projectionClass))).toThrow()
      }
      const forgedResult = structuredClone(pairAudit) as any
      forgedResult.runs[0].eventLedger[0].resultPreimage =
        canonicalV138ReviewerV3({ forged: true })
      syncLedgerEvent(forgedResult, 0, 0)
      expect(() => validateV138Plan26261PairAudit(rerootPairAudit(forgedResult)))
        .toThrow()
      for (const mutateEvent of [
        (candidate: any) => { candidate.runs[0].eventLedger[0]
          .physicalResultPreimage = canonicalV138ReviewerV3({ forged: true });
        candidate.runs[0].eventLedger[0].physicalResultRoot = sha256V138ReviewerV3(
          candidate.runs[0].eventLedger[0].physicalResultPreimage) },
        (candidate: any) => { candidate.runs[0].eventLedger[0].physicalResultRoot =
          `sha256:${"a".repeat(64)}` },
        (candidate: any) => { candidate.runs[0].eventLedger[0].resultRoot =
          `sha256:${"a".repeat(64)}` },
        (candidate: any) => { candidate.runs[0].eventLedger[1].ordinal = 0 },
        (candidate: any) => { candidate.runs[0].eventLedger[1].ordinal += 1 },
        (candidate: any) => { candidate.runs[0].routeEvidence[0]
          .commandEvents.splice(0, 1) },
        (candidate: any) => { candidate.runs[0].routeEvidence[0]
          .eventLocations.push(".planning/artifacts/extra-event.json") },
        (candidate: any) => { candidate.runs[0].routeEvidence[0]
          .eventLocations.splice(0, 1) },
        (candidate: any) => { candidate.runs[0].routeEvidence[0]
          .changedLocations.push(".planning/artifacts/extra-changed.json") },
        (candidate: any) => { candidate.runs[0].routeEvidence[0]
          .commandEvents[0].changed = !candidate.runs[0].routeEvidence[0]
            .commandEvents[0].changed },
      ]) {
        const candidate = structuredClone(pairAudit) as any
        mutateEvent(candidate)
        expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
          .toThrow()
      }
      const substituted = structuredClone(expectedWrapper) as any
      substituted.completeRouteCustody.pairAudit = independentlyInvalid
      substituted.custody.completeRouteCustody.pairAudit = independentlyInvalid
      expect(() => validatePlan26262ReportManifest(substituted, expectedWrapper))
        .toThrow("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")

      for (const omit of ["top", "nested"] as const) {
        const candidate = structuredClone(expectedWrapper) as any
        if (omit === "top") delete candidate.completeRouteCustody.pairAudit
        else delete candidate.custody.completeRouteCustody.pairAudit
        expect(() => validatePlan26262ReportManifest(candidate, expectedWrapper))
          .toThrow("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")
      }
      const nestedMismatch = structuredClone(expectedWrapper) as any
      nestedMismatch.custody.completeRouteCustody.pairAudit = independentlyInvalid
      expect(() => validatePlan26262ReportManifest(nestedMismatch, expectedWrapper))
        .toThrow("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")

      const swapped = structuredClone(pairAudit) as any
      swapped.runs.reverse()
      const rerootedSwap = rerootPairAudit(swapped)
      expect(() => validateV138Plan26261PairAudit(rerootedSwap)).toThrow()
      const extraPrivate = structuredClone(pairAudit) as any
      extraPrivate.runs[0].secretPayload = "/var/folders/private-custody"
      expect(() => validateV138Plan26261PairAudit(rerootPairAudit(extraPrivate)))
        .toThrow()
      for (const mutateCleanup of [
        (candidate: any) => { delete candidate.runs[0].cleanup.mode },
        (candidate: any) => { candidate.runs[0].cleanup.extraRoot =
          `sha256:${"f".repeat(64)}` },
        (candidate: any) => { candidate.runs[1].physicalCommitments[6]
          .pathComponentRoot = candidate.runs[0].physicalCommitments[6]
            .pathComponentRoot },
      ]) {
        const candidate = structuredClone(pairAudit) as any
        mutateCleanup(candidate)
        expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
          .toThrow()
      }
      for (const mutateSemantic of [
        (candidate: any) => { candidate.runs[0].projectionLedger.splice(0, 1) },
        (candidate: any) => { candidate.runs[0].projectionLedger.push(
          structuredClone(candidate.runs[0].projectionLedger[0])) },
        (candidate: any) => { candidate.runs[0].projectionLedger[0].label =
          "route-output:--check-plan-262-57-terminal-v1" },
        (candidate: any) => { candidate.runs[0].routeEvidence[0].unexpected = true },
      ]) {
        const candidate = structuredClone(pairAudit) as any
        mutateSemantic(candidate)
        expect(() => validateV138Plan26261PairAudit(rerootPairAudit(candidate)))
          .toThrow()
      }
      const crossCommandEvent = structuredClone(pairAudit) as any
      const eventEvidence = crossCommandEvent.runs[0].routeEvidence[0]
      eventEvidence.commandEvents[0].location =
        crossCommandEvent.runs[0].routeEvidence[3].destination
      eventEvidence.eventEvidenceRoot = testIdentityRoot("evidenceBundle",
        "v1.38-plan-262-61-route-event-evidence-v1", eventEvidence.commandEvents)
      expect(() => validateV138Plan26261PairAudit(
        rerootPairAudit(crossCommandEvent))).toThrow()
    }, 1_200_000)

  it("rejects shared physical inputs and failed independent validation", () => {
    const route = (suffix: string) => ({ sourceB9: "logical-b9",
      b9Custody: { identityKind: "logical_synthetic_b9" },
      cleanup: { complete: true, residualPaths: [] }, physicalIsolation: {
        identityKind: "physical_execution_b9", executionSourceB9:
          (suffix === "left" ? "a" : "b").repeat(40),
        detachedInput: {
        pathRoot: `path-${suffix}`, identityRoot: `inode-${suffix}`,
        independentlyValidated: true }, routeClones: [{ group: "obstruction",
        pathRoot: `clone-path-${suffix}`, identityRoot: `clone-inode-${suffix}`,
        independentlyValidated: true }], physicalToLogicalProjection:
          V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS.map((label, ordinal) => ({
            ordinal, label, physical: `physical-root-${suffix}-${ordinal}`,
            logical: `logical-root-${ordinal}`, projected: true,
            independentlyValidated: true })), obstructionInputs: [{
              pathRoot: `obstruction-path-${suffix}`,
              identityRoot: `obstruction-inode-${suffix}`,
              bytesSha256: "fixture-root", byteLength: 3, mode: 0o644,
              independentlyValidated: true }], routeIdentityAudits:
          V138_REVIEW_V3_ROUTE_MANIFEST.map(({ command }, ordinal) => ({ command,
            physicalRouteIdentityRoot: `sha256:${String(ordinal).padStart(64,
              suffix === "left" ? "1" : "2")}` })) } })
    const left = route("left")
    const right = route("right")
    expect(validateV138Plan26261FreshRoutePairIsolation(left, right)).toBe(true)
    for (const mutate of [
      (candidate: any) => { candidate.physicalIsolation.detachedInput.pathRoot =
        left.physicalIsolation.detachedInput.pathRoot },
      (candidate: any) => { candidate.physicalIsolation.detachedInput.identityRoot =
        left.physicalIsolation.detachedInput.identityRoot },
      (candidate: any) => { candidate.physicalIsolation.routeClones[0].pathRoot =
        left.physicalIsolation.routeClones[0].pathRoot },
      (candidate: any) => { candidate.physicalIsolation.routeClones[0].identityRoot =
        left.physicalIsolation.routeClones[0].identityRoot },
      (candidate: any) => { candidate.physicalIsolation.detachedInput
        .independentlyValidated = false },
      (candidate: any) => { candidate.physicalIsolation.routeClones[0]
        .independentlyValidated = false },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection[0]
        .physical = left.physicalIsolation.physicalToLogicalProjection[0].physical },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection[0]
        .logical = "different-logical-root" },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection[0]
        .ordinal = 1 },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection
        .splice(0, 1) },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection
        .push(structuredClone(candidate.physicalIsolation.physicalToLogicalProjection[0])) },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection
        .reverse() },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection[0]
        .label = "route-output:relabelled" },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection[0]
        .projected = false },
      (candidate: any) => { candidate.physicalIsolation.physicalToLogicalProjection[0]
        .independentlyValidated = false },
      (candidate: any) => { candidate.physicalIsolation.obstructionInputs[0]
        .pathRoot = left.physicalIsolation.obstructionInputs[0].pathRoot },
      (candidate: any) => { candidate.physicalIsolation.obstructionInputs[0]
        .identityRoot = left.physicalIsolation.obstructionInputs[0].identityRoot },
      (candidate: any) => { candidate.physicalIsolation.obstructionInputs[0]
        .independentlyValidated = false },
      (candidate: any) => { candidate.physicalIsolation.obstructionInputs = [] },
      (candidate: any) => { const index = candidate.physicalIsolation
        .physicalToLogicalProjection.findIndex(({ label }: any) =>
          label.startsWith("route-obstruction-metadata:")); candidate.physicalIsolation
          .physicalToLogicalProjection.splice(index, 1) },
      (candidate: any) => { const entry = candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-obstruction-metadata:")); entry.physical = left
          .physicalIsolation.physicalToLogicalProjection.find(({ label }: any) =>
            label === entry.label).physical },
      (candidate: any) => { const entry = candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-obstruction-metadata:")); entry.label += ":changed" },
      (candidate: any) => { const index = candidate.physicalIsolation
        .physicalToLogicalProjection.findIndex(({ label }: any) =>
          label.startsWith("route-derived-root:")); candidate.physicalIsolation
          .physicalToLogicalProjection.splice(index, 1) },
      (candidate: any) => { const entry = structuredClone(candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-derived-root:"))); candidate.physicalIsolation
          .physicalToLogicalProjection.push(entry) },
      (candidate: any) => { const entry = candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-derived-root:")); entry.label += ":changed" },
      (candidate: any) => { const entry = candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-derived-root:")); entry.physical = left
          .physicalIsolation.physicalToLogicalProjection.find(({ label }: any) =>
            label === entry.label).physical },
      (candidate: any) => { const index = candidate.physicalIsolation
        .physicalToLogicalProjection.findIndex(({ label }: any) =>
          label.startsWith("route-persisted-receipt:")); candidate.physicalIsolation
          .physicalToLogicalProjection.splice(index, 1) },
      (candidate: any) => { const entry = structuredClone(candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-persisted-receipt:"))); candidate.physicalIsolation
          .physicalToLogicalProjection.push(entry) },
      (candidate: any) => { const entry = candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-persisted-receipt:")); entry.label += ":changed" },
      (candidate: any) => { const index = candidate.physicalIsolation
        .physicalToLogicalProjection.findIndex(({ label }: any) =>
          label.startsWith("route-reservation-claim:")); candidate.physicalIsolation
          .physicalToLogicalProjection.splice(index, 1) },
      (candidate: any) => { const entry = structuredClone(candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-reservation-claim:"))); candidate.physicalIsolation
          .physicalToLogicalProjection.push(entry) },
      (candidate: any) => { const entry = candidate.physicalIsolation
        .physicalToLogicalProjection.find(({ label }: any) =>
          label.startsWith("route-reservation-claim:")); entry.physical = left
          .physicalIsolation.physicalToLogicalProjection.find(({ label }: any) =>
            label === entry.label).physical },
      (candidate: any) => { candidate.physicalIsolation.identityKind = "logical" },
      (candidate: any) => { candidate.b9Custody.identityKind = "physical" },
      (candidate: any) => { candidate.cleanup.complete = false },
      (candidate: any) => { candidate.cleanup.residualPaths = ["residual"] },
    ]) {
      const candidate = structuredClone(right)
      mutate(candidate)
      expect(() => validateV138Plan26261FreshRoutePairIsolation(left, candidate))
        .toThrow("V138_PLAN_262_61_FRESH_DERIVATION_ISOLATION_INVALID")
    }
  })

  it("recursively rejects unprojected host volatility in logical route output", () => {
    const entry = { command: "--check-plan-262-57-pre-start-obstruction-v1" }
    const logicalRoot = `sha256:${"a".repeat(64)}`
    expect(auditLogicalRouteOutput(entry, `${JSON.stringify({ obstruction: {
      path: ".planning/artifacts/fixture.json", type: "file",
      metadataRoot: logicalRoot } })}\n`, new Set([logicalRoot]))).toBe(entry.command)
    for (const value of [
      { obstruction: { path: "/private/tmp/shared", type: "file",
        metadataRoot: logicalRoot } },
      { obstruction: { path: ".planning/artifacts/fixture.json", type: "file",
        metadataRoot: `sha256:${"b".repeat(64)}` } },
      { nested: { inode: 42 } }, { nested: { ctimeMs: 1 } },
      { nested: { absolutePath: "/private/tmp/input" } },
      { receiptRoot: `sha256:${"c".repeat(64)}` },
    ]) expect(() => auditLogicalRouteOutput(entry,
      `${JSON.stringify(value)}\n`, new Set([logicalRoot])))
      .toThrow("V138_PLAN_262_61_LOGICAL_OUTPUT_VOLATILITY_INVALID")
  })

  it("recomputes physical and logical detail roots for every retained event class", () => {
    const physicalRoot = `sha256:${"1".repeat(64)}`
    const logicalRoot = `sha256:${"2".repeat(64)}`
    const replacements = new Map([[physicalRoot, logicalRoot]])
    for (const [ordinal, operation] of ["openSync", "writeSync", "writeFileSync",
      "fsyncSync", "closeSync", "linkSync:from", "linkSync:to", "unlinkSync"]
      .entries()) {
      const location = `.planning/artifacts/event-${ordinal}.json`
      const physicalDetail = { ordinal, operation, path: location,
        sideEffect: "content-write", flags: null, outcome: "success",
        errorCode: null, beforeState: { type: "absent" },
        afterState: { type: "file", sha256: physicalRoot, byteLength: 1,
          mode: 0o600 } }
      const physical = { ...physicalDetail,
        detailRoot: physicalEventDetailRootV138Plan26261(physicalDetail) }
      const logicalDetail = JSON.parse(canonicalV138ReviewerV3(physicalDetail)
        .replaceAll(physicalRoot, logicalRoot))
      const logical = { ...logicalDetail,
        detailRoot: logicalEventDetailRootV138Plan26261(logicalDetail) }
      const input = { physicalResultPreimage: canonicalV138ReviewerV3(physical),
        logicalResultPreimage: canonicalV138ReviewerV3(logical), location,
        operation, replacements }
      expect(verifyV138Plan26261PhysicalLogicalEventPreimages(input)).toBe(true)
      for (const mutate of [
        (candidate: any) => { candidate.physical.detailRoot =
          `sha256:${"3".repeat(64)}` },
        (candidate: any) => { candidate.physical.afterState.byteLength += 1 },
        (candidate: any) => { candidate.logical.detailRoot =
          `sha256:${"4".repeat(64)}` },
        (candidate: any) => { candidate.logical.ordinal += 1 },
      ]) {
        const candidate = { physical: structuredClone(physical),
          logical: structuredClone(logical) }
        mutate(candidate)
        expect(() => verifyV138Plan26261PhysicalLogicalEventPreimages({ ...input,
          physicalResultPreimage: canonicalV138ReviewerV3(candidate.physical),
          logicalResultPreimage: canonicalV138ReviewerV3(candidate.logical) }))
          .toThrow("V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID")
      }
    }
  })

  it("roots observer open-write-fsync-close records over exact retained bodies", () => {
    const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-event-root-"))
    disposable.push(fixtureRoot)
    const observer = installRouteFsObserver()
    observer.start(fixtureRoot, "--fixture")
    const fd = openSync(path.join(fixtureRoot, "event.json"), "wx", 0o600)
    writeSync(fd, Buffer.from("{}\n"))
    fsyncSync(fd)
    closeSync(fd)
    const records = observer.stop()
    observer.restore()
    expect(records.map(({ operation }) => operation)).toEqual([
      "openSync", "writeSync", "fsyncSync", "closeSync",
    ])
    for (const { command: _command, detailRoot, ...detail } of records)
      expect(detailRoot).toBe(physicalEventDetailRootV138Plan26261(detail))
  })

  it("keeps logical event equality separate from independent physical evidence", () => {
    const logicalResult = canonicalV138ReviewerV3({ logicalOutputText: "ok\n",
      logicalOutputRoot: `sha256:${"1".repeat(64)}` })
    const left = [{ ordinal: 0, command: "--fixture", handler: "fixture",
      event: "execute:fixture", path: ".planning/artifacts/fixture.json",
      result: logicalResult, physicalResult: canonicalV138ReviewerV3({
        sourceB9: "a".repeat(40), authorizationRoot: `sha256:${"2".repeat(64)}`,
        sealRoot: `sha256:${"3".repeat(64)}`,
        physicalOutputRoot: `sha256:${"4".repeat(64)}` }) }]
    const right = structuredClone(left)
    right[0]!.physicalResult = canonicalV138ReviewerV3({
      sourceB9: "b".repeat(40), authorizationRoot: `sha256:${"5".repeat(64)}`,
      sealRoot: `sha256:${"6".repeat(64)}`,
      physicalOutputRoot: `sha256:${"7".repeat(64)}` })
    expect(validateV138Plan26261SemanticEventPair(left, right)).toBe(true)
    const reused = structuredClone(right)
    reused[0]!.physicalResult = left[0]!.physicalResult
    expect(() => validateV138Plan26261SemanticEventPair(left, reused))
      .toThrow("V138_PLAN_262_61_SEMANTIC_EVENT_PHYSICAL_REUSE")
    const mismatched = structuredClone(right)
    mismatched[0]!.result = canonicalV138ReviewerV3({ logicalOutputText: "bad\n",
      logicalOutputRoot: `sha256:${"8".repeat(64)}` })
    expect(() => validateV138Plan26261SemanticEventPair(left, mismatched))
      .toThrow("V138_PLAN_262_61_SEMANTIC_EVENT_LOGICAL_MISMATCH")
  })

  it("rejects physical derived evidence injected into logical execute events", () => {
    const physicalRoot = `sha256:${"a".repeat(64)}`
    const logicalRoot = `sha256:${"b".repeat(64)}`
    const physical = { exit: 0, resultCode: "success_no_disposition",
      logicalOutputText: "ok\n", logicalOutputRoot: logicalRoot,
      physicalOutputText: "physical\n", physicalOutputRoot: physicalRoot,
      projectionTuples: [{ label: "route-derived-root:--fixture:receiptRoot",
        physical: physicalRoot, logical: logicalRoot }],
      derivedRootEvidence: { domain: "evidenceBundle", rootField: "receiptRoot",
        physicalRecord: { receiptRoot: physicalRoot, childRoot: physicalRoot },
        physicalRoot, logicalSchemaVersion: "logical-v1",
        logicalStructure: { receiptRoot: logicalRoot }, logicalRoot } }
    const replacements = new Map([[physicalRoot, logicalRoot]])
    const logical = projectV138Plan26261LogicalExecutionResult(
      physical, replacements) as any
    expect(Object.keys(logical.derivedRootEvidence).sort()).toEqual([
      "domain", "logicalRecord", "logicalRoot", "logicalSchemaVersion",
      "rootField",
    ])
    expect(verifyV138Plan26261LogicalExecutionResult(
      physical, logical, replacements)).toBe(true)
    for (const mutate of [
      (candidate: any) => { candidate.derivedRootEvidence.physicalRecord = {} },
      (candidate: any) => { candidate.derivedRootEvidence.physicalRoot = physicalRoot },
      (candidate: any) => { candidate.derivedRootEvidence.childRoot = physicalRoot },
      (candidate: any) => { candidate.derivedRootEvidence.unexpected = true },
    ]) {
      const candidate = structuredClone(logical)
      mutate(candidate)
      expect(() => verifyV138Plan26261LogicalExecutionResult(
        physical, candidate, replacements)).toThrow(
          "V138_PLAN_262_61_LOGICAL_EXECUTION_PROJECTION_INVALID")
    }
  })

  it("replays every real-route physical and logical event class", async () => {
    const route = await observeV138Plan26261RouteDispatch(repoRoot)
    const operationEvents = route.events.filter(({ event }: any) =>
      !event.startsWith("execute:"))
    expect(operationEvents).toHaveLength(52)
    expect([...new Set(operationEvents.map(({ event, command }: any) =>
      event.slice(command.length + 1)))].sort()).toEqual([
      "closeSync", "fsyncSync", "linkSync:from", "linkSync:to", "mkdirSync",
      "openSync", "unlinkSync", "writeFileSync", "writeSync",
    ])
    const derivedProjections = route.physicalIsolation.physicalToLogicalProjection
      .filter(({ label }: any) => label.startsWith("route-derived-root:"))
    expect(derivedProjections).toHaveLength(5)
    for (const projection of derivedProjections) {
      const [, command] = projection.label.match(
        /^route-derived-root:(--[^:]+):[^:]+$/u) ?? []
      const event = route.events.find((candidate: any) =>
        candidate.command === command && candidate.event.startsWith("execute:"))
      const physical = JSON.parse(event.physicalResult)
      const logical = JSON.parse(event.result)
      expect(physical.derivedRootEvidence).toMatchObject({
        physicalRoot: projection.physical, logicalRoot: projection.logical })
      expect(physical.projectionTuples).toContainEqual({ label: projection.label,
        physical: projection.physical, logical: projection.logical })
      expect(Object.keys(logical.derivedRootEvidence).sort()).toEqual([
        "domain", "logicalRecord", "logicalRoot", "logicalSchemaVersion",
        "rootField",
      ])
      expect(logical.derivedRootEvidence.logicalRoot).toBe(projection.logical)
    }
  }, 1_200_000)

  it("recomputes physical and logical derived roots before projection", () => {
    const physicalBody = { schemaVersion: "physical-v1", value: 1 }
    const physicalRoot = `sha256:${hashCanonicalIdentity("evidenceBundle", [
      Buffer.from("physical-v1"),
      Buffer.from(canonicalV138ReviewerV3(physicalBody)),
    ])}`
    const physicalRecord = { ...physicalBody, receiptRoot: physicalRoot }
    const logicalStructure = { command: "fixture", logicalValue: 1 }
    const projected = verifyAndProjectV138Plan26261DerivedRouteRoot({
      domain: "evidenceBundle", rootField: "receiptRoot", physicalRecord,
      physicalOutputRoot: physicalRoot, logicalSchemaVersion: "logical-v1",
      logicalStructure })
    expect(projected).toMatchObject({ physicalRoot, physicalRootVerified: true,
      logicalRootRecomputed: true })
    expect(() => verifyAndProjectV138Plan26261DerivedRouteRoot({
      domain: "evidenceBundle", rootField: "receiptRoot", physicalRecord,
      physicalOutputRoot: `sha256:${"0".repeat(64)}`,
      logicalSchemaVersion: "logical-v1", logicalStructure }))
      .toThrow("V138_PLAN_262_61_DERIVED_ROUTE_PHYSICAL_ROOT_INVALID")
    expect(() => verifyAndProjectV138Plan26261DerivedRouteRoot({
      domain: "evidenceBundle", rootField: "receiptRoot", physicalRecord,
      physicalOutputRoot: physicalRoot, logicalSchemaVersion: "logical-v1",
      logicalStructure, expectedLogicalRoot: `sha256:${"0".repeat(64)}` }))
      .toThrow("V138_PLAN_262_61_DERIVED_ROUTE_LOGICAL_ROOT_INVALID")
  })

  it("verifies exact persisted bytes and metadata before logical projection", () => {
    const destination = ".planning/artifacts/fixture.json"
    const receiptRoot = `sha256:${"a".repeat(64)}`
    const physicalRecord = { schemaVersion: "physical-v1", receiptRoot, value: 1 }
    const bytes = Buffer.from(`${canonicalV138ReviewerV3(physicalRecord)}\n`)
    const base = { destination, expectedDestination: destination,
      physicalBytes: bytes, physicalSha256: sha256V138ReviewerV3(bytes),
      physicalByteLength: bytes.byteLength, physicalMode: 0o600,
      expectedKeys: ["receiptRoot", "schemaVersion", "value"],
      embeddedRoots: { receiptRoot },
      logicalRecord: { schemaVersion: "logical-v1", value: 1 } }
    expect(verifyAndProjectV138Plan26261PersistedRouteFile(base)).toMatchObject({
      physicalSha256: sha256V138ReviewerV3(bytes),
      logicalSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      physicalFileVerified: true })
    const mutations: Array<[Record<string, unknown>, string]> = [
      [{ physicalBytes: Buffer.from("not-json") }, "PERSISTED_FILE_PARSE_INVALID"],
      [{ physicalBytes: Buffer.from(
        `{"value":1,"schemaVersion":"physical-v1","receiptRoot":"${receiptRoot}"}\n`) },
      "PERSISTED_FILE_SCHEMA_INVALID"],
      [{ expectedKeys: ["schemaVersion", "receiptRoot"] },
      "PERSISTED_FILE_SCHEMA_INVALID"],
      [{ embeddedRoots: { receiptRoot: `sha256:${"b".repeat(64)}` } },
      "PERSISTED_FILE_EMBEDDED_ROOT_INVALID"],
      [{ physicalSha256: `sha256:${"b".repeat(64)}` },
      "PERSISTED_FILE_METADATA_INVALID"],
      [{ physicalByteLength: bytes.byteLength + 1 },
      "PERSISTED_FILE_METADATA_INVALID"],
      [{ physicalMode: 0o644 }, "PERSISTED_FILE_METADATA_INVALID"],
      [{ destination: ".planning/artifacts/other.json" },
      "PERSISTED_FILE_SCHEMA_INVALID"],
      [{ expectedLogicalSha256: `sha256:${"b".repeat(64)}` },
      "PERSISTED_FILE_LOGICAL_ROOT_INVALID"],
    ]
    for (const [mutation, code] of mutations)
      expect(() => verifyAndProjectV138Plan26261PersistedRouteFile({
        ...base, ...mutation })).toThrow(code)
  })

  it("fails closed when real route handlers expose source findings", async () => {
    const value = await deriveV138Plan26261NoPublish(repoRoot)
    expect(value).toMatchObject({ reviewBlocked: true,
      sourceCompletenessPassed: false, publishesCanonicalReview: false,
      authorizesExecution: false, lifecycle: { totalPlans: 48, summaries: 43 },
      identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
        externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
        independentCustodyClaimed: false } })
    expect(value.findingCount).toBeGreaterThan(0)
    expect(value.reviewDocument).toBeNull()
    expect(value.commands).toHaveLength(10)
    expect(value.forbiddenDestinations).toContain(V138_REVIEW_V3_CANONICAL_PATH)
    expect(value.forbiddenDestinations).toContain(V138_REVIEW_V3_REPORT_PATH)
  }, 600_000)

  it("runs derive-no-publish with bounded output and no canonical write", () => {
    const before = git(repoRoot, ["status", "--porcelain=v1"])
    const result = spawnSync("pnpm", ["exec", "tsx", checkerPath, "--derive-no-publish"],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    expect(result.status, result.stderr).toBe(0)
    expect(result.stderr).toBe("")
    const parsed = JSON.parse(result.stdout)
    expect(parsed.findingCount).toBeGreaterThan(0)
    expect(parsed.sourceCompletenessPassed).toBe(false)
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(512 * 1024)
    expect(git(repoRoot, ["status", "--porcelain=v1"])).toBe(before)
  }, 600_000)

  it.each([
    ["zero", []],
    ["multiple", [
      { agent_id: "a", phase: "262", plan: "61", status: "completed",
        completion_timestamp: "2026-08-23T00:00:00Z" },
      { agent_id: "b", phase: "262", plan: "61", status: "completed",
        completion_timestamp: "2026-08-23T00:01:00Z" },
    ]],
    ["spawned", [{ agent_id: "a", phase: "262", plan: "61", status: "spawned",
      completion_timestamp: "2026-08-23T00:00:00Z" }]],
    ["empty id", [{ agent_id: "", phase: "262", plan: "61", status: "completed",
      completion_timestamp: "2026-08-23T00:00:00Z" }]],
    ["empty completion", [{ agent_id: "a", phase: "262", plan: "61",
      status: "completed", completion_timestamp: "" }]],
  ])("rejects %s Plan-61 author history", (_name, entries) => {
    expect(() => selectCompletedAgentHistory(entries, "262", "61")).toThrow()
  })

  it("selects Plan-61 and Plan-62 authors without segment or description dependence", () => {
    const entries = [
      { agent_id: "r3-author", phase: 262, plan: 61, segment: 999,
        task_description: "ignored", status: "completed",
        completion_timestamp: "2026-08-23T00:00:00Z" },
      { agent_id: "review-author", phase: "262", plan: "62", segment: 0,
        status: "completed", completion_timestamp: "2026-08-23T00:02:00Z" },
    ]
    expect(selectCompletedAgentHistory(entries, "262", "61")).toMatchObject({
      agentId: "r3-author", plan: "61" })
    expect(selectCompletedAgentHistory(entries, "262", "62")).toMatchObject({
      agentId: "review-author", plan: "62" })
  })

  it("rejects post-A9 working-source drift even when Git history remains intact", () => {
    const directory = clone()
    const target = path.join(directory, V138_REVIEW_V3_SOURCE_PATHS[0])
    writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("\n// drift\n")]))
    expect(() => inspectV138Plan26261A9Custody(directory))
      .toThrow("V138_PLAN_262_61_REPOSITORY_DIRTY")
  })

  it("rejects committed post-A9 drift even when visible bytes are restored", () => {
    const directory = clone()
    const repoPath = V138_REVIEW_V3_SOURCE_PATHS[0]
    const target = path.join(directory, repoPath)
    const exact = readFileSync(target)
    writeFileSync(target, Buffer.concat([exact, Buffer.from("\n// committed drift\n")]))
    commitAll(directory, "mutate protected A9 source")
    writeFileSync(target, exact)
    execFileSync("git", ["add", repoPath], { cwd: directory })
    commitAll(directory, "restore protected bytes")
    expect(() => inspectV138Plan26261A9Custody(directory))
      .toThrow("V138_PLAN_262_61_POST_A9_COMMITTED_SOURCE_DRIFT")
  })

  it("rejects a later committed rewrite of the current summary", () => {
    const directory = clone()
    const target = path.join(directory, SUMMARY_PATH)
    writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("\nrewrite\n")]))
    commitAll(directory, "mutate summary")
    expect(() => inspectV138Plan26261SummaryConvergence(directory))
      .toThrow("V138_PLAN_262_61_SUMMARY_BYTES_INVALID")
  })

  it("rejects a lifecycle with an extra active plan after committing its inventory", () => {
    const directory = clone()
    const target = path.join(directory, `${path.dirname(SUMMARY_PATH)}/262-99-PLAN.md`)
    writeFileSync(target, "---\nphase: 262\nplan: 99\n---\n")
    commitAll(directory, "add invalid plan")
    expect(() => inspectV138Plan26261Lifecycle(directory))
      .toThrow("V138_PLAN_262_61_LIFECYCLE_INVALID")
  })

  it("rejects count-preserving lifecycle substitution with a specific graph code", () => {
    const directory = clone()
    const phase = path.dirname(SUMMARY_PATH)
    const oldPlan = path.join(directory, phase, "262-01-PLAN.md")
    const oldSummary = path.join(directory, phase, "262-01-SUMMARY.md")
    const newPlan = path.join(directory, phase, "262-99-PLAN.md")
    const newSummary = path.join(directory, phase, "262-99-SUMMARY.md")
    writeFileSync(newPlan, "---\nphase: 262\nplan: 99\nwave: 1\ndepends_on: []\n---\n")
    writeFileSync(newSummary, "# substituted\n")
    rmSync(oldPlan); rmSync(oldSummary)
    commitAll(directory, "count-preserving plan substitution")
    expect(() => inspectV138Plan26261Lifecycle(directory))
      .toThrow("V138_PLAN_262_61_LIFECYCLE_PATH_INVENTORY_INVALID")
  })

  it("rejects same-frontmatter lifecycle byte replacement and restore", () => {
    const directory = clone()
    const target = path.join(directory, path.dirname(SUMMARY_PATH), "262-01-PLAN.md")
    const exact = readFileSync(target)
    writeFileSync(target, Buffer.concat([exact, Buffer.from("\nreplacement\n")]))
    commitAll(directory, "mutate lifecycle bytes")
    writeFileSync(target, exact); commitAll(directory, "restore lifecycle bytes")
    expect(() => inspectV138Plan26261Lifecycle(directory))
      .toThrow("V138_PLAN_262_61_LIFECYCLE_HISTORY_INVALID")
  }, 30_000)

  it("rejects canonical publication presence without deleting or restoring it", async () => {
    const directory = clone()
    const target = path.join(directory, V138_REVIEW_V3_CANONICAL_PATH)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, "{}\n")
    commitAll(directory, "publish forbidden canonical review")
    await expect(deriveV138Plan26261NoPublish(directory))
      .rejects.toThrow("V138_PLAN_262_61_CANONICAL_DESTINATION_PRESENT")
  }, 30_000)

  it("rejects a noncanonical physical repository root through a symlink", async () => {
    const directory = clone()
    const linkRoot = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-link-"))
    disposable.push(linkRoot)
    const link = path.join(linkRoot, "repo")
    symlinkSync(directory, link)
    await expect(deriveV138Plan26261NoPublish(link))
      .rejects.toThrow("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  })

  it.each([
    ["absolute", ["--check-r3-author-receipt", "--receipt", "/tmp/receipt.json"]],
    ["traversal", ["--check-r3-author-receipt", "--receipt", "../receipt.json"]],
    ["duplicate", ["--check-r3-author-receipt", "--receipt",
      ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json",
      "--receipt", ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json"]],
    ["extra", ["--derive-no-publish", "unexpected"]],
  ])("rejects %s CLI grammar with the exact argument code", (_name, args) => {
    const result = spawnSync("pnpm", ["exec", "tsx", checkerPath, ...args],
      { cwd: repoRoot, encoding: "utf8" })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("V138_PLAN_262_61_ARGUMENTS_INVALID")
  })

  it("rejects symlink and hard-link repository leaves", () => {
    const directory = clone()
    const expected = ".planning/agent-history.json"
    const target = path.join(directory, expected)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, "[]\n")
    const outside = path.join(directory, "outside.json")
    writeFileSync(outside, "[]\n")
    rmSync(target)
    symlinkSync(outside, target)
    expect(() => inspectV138Plan26261RepositoryFile(directory, expected, expected))
      .toThrow("V138_PLAN_262_61_PATH_METADATA_INVALID")
    rmSync(target)
    linkSync(outside, target)
    expect(() => inspectV138Plan26261RepositoryFile(directory, expected, expected))
      .toThrow("V138_PLAN_262_61_PATH_METADATA_INVALID")
  })

  it("rejects executable-bit repository leaves", () => {
    const directory = clone()
    const expected = ".planning/agent-history.json"
    const target = path.join(directory, expected)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, "[]\n"); chmodSync(target, 0o755)
    expect(() => inspectV138Plan26261RepositoryFile(directory, expected, expected))
      .toThrow("V138_PLAN_262_61_PATH_METADATA_INVALID")
  })

  it("binds committed R3 while convergence remains fail-closed before external review", () => {
    const r3 = inspectCommittedR3(repoRoot)
    expect(r3.commit).toMatch(/^[0-9a-f]{40}$/u)
    expect(r3.blobs.map(({ path: repoPath }) => repoPath).sort())
      .toEqual([...R3_PATHS].sort())
    expect(() => inspectReviewerConvergence(repoRoot)).toThrow()
  })

  it("requires immutable schema-bound review, fix, receipt, and real Plan-61 CLI custody",
    async () => {
    const directory = clone()
    const sourceR3 = git(directory, ["rev-parse", "HEAD"])
    const sourceR3Tree = git(directory, ["rev-parse", "HEAD^{tree}"])
    const sourceR3Parent = git(directory, ["show", "-s", "--format=%P", "HEAD"])
    const reviewPath = `${path.dirname(SUMMARY_PATH)}/262-61-CODE-REVIEW-V7.md`
    const review = `---\nphase: 262\nplan: "61"\nreviewed_source_commit: ${sourceR3}\n` +
      `files_reviewed: 2\nfiles_reviewed_list:\n` +
      `  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts\n` +
      `  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts\n` +
      `depth: deep\nfindings:\n  critical: 0\n  warning: 0\n  info: 0\n  total: 0\n` +
      `status: clean\n---\n\n# Clean fixture review\n`
    writeFileSync(path.join(directory, reviewPath), review)
    commitAll(directory, "review(262-61): clean fixture R3")
    const reviewCommit = git(directory, ["rev-parse", "HEAD"])
    const reviewBlob = git(directory, ["rev-parse", `HEAD:${reviewPath}`])
    const reviewRoot = sha256V138ReviewerV3(Buffer.from(review))
    const fixPath = `${path.dirname(SUMMARY_PATH)}/262-61-REVIEW-FIX.md`
    const reportPaths = ["", "-V2", "-V3", "-V4", "-V5", "-V6", "-V7"].map(suffix =>
      `${path.dirname(SUMMARY_PATH)}/262-61-CODE-REVIEW${suffix}.md`)
    const reports = reportPaths.map(repoPath => {
      const commit = git(directory, ["log", "-1", "--format=%H", "--", repoPath])
      const bytes = readFileSync(path.join(directory, repoPath))
      const text = bytes.toString("utf8")
      return { path: repoPath, commit,
        blob: git(directory, ["rev-parse", `${commit}:${repoPath}`]),
        root: sha256V138ReviewerV3(bytes), reviewedSource:
          /^reviewed_source_commit:\s*([0-9a-f]{40})$/mu.exec(text)![1] }
    })
    const manifest = { schemaVersion: "v1.38-plan-262-61-review-fix-convergence-v1",
      sourceR3, sourceR3Tree, sourceR3Parent,
      reports,
      terminalReviewPath: reviewPath, terminalReviewRoot: reviewRoot,
      terminalReviewCommit: reviewCommit, terminalReviewBlob: reviewBlob,
      sourceFixCommits: reports.slice(1).map(({ reviewedSource }) => reviewedSource) }
    writeFileSync(path.join(directory, fixPath), `# Review fix fixture\n\n` +
      `\`\`\`review-convergence-json\n${JSON.stringify(manifest)}\n\`\`\`\n`)
    commitAll(directory, "review(262-61): bind fixture convergence")
    const convergence = inspectReviewerConvergence(directory)
    expect(convergence).toMatchObject({ codeReviewPath: reviewPath,
      codeReviewRoot: reviewRoot, sourceR3: { commit: sourceR3 } })
    const receiptPath =
      ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json"
    const history = { agentId: "fixture-r3-author", phase: "262", plan: "61",
      completionTimestamp: "2026-08-23T23:00:00Z" }
    const receipt = { schemaVersion: "v1.38-plan-262-61-r3-author-tracking-v1",
      r3AuthorAgent: history.agentId, phase: history.phase, plan: history.plan,
      completionTimestamp: history.completionTimestamp,
      historyEntryRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(history)),
      agentHistorySnapshot: [{ agent_id: history.agentId, phase: history.phase,
        plan: history.plan, status: "completed",
        completion_timestamp: history.completionTimestamp }],
      agentHistoryRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3([{
        agent_id: history.agentId, phase: history.phase, plan: history.plan,
        status: "completed", completion_timestamp: history.completionTimestamp }])),
      sourceR3, codeReviewPath: reviewPath, codeReviewRoot: reviewRoot,
      reviewFixRoot: convergence.reviewFixRoot }
    mkdirSync(path.dirname(path.join(directory, receiptPath)), { recursive: true })
    writeFileSync(path.join(directory, receiptPath), `${JSON.stringify(receipt)}\n`)
    commitAll(directory, "docs(262-61): fixture one-path author receipt")
    expect(inspectV138Plan26261Receipt(directory, receiptPath)).toMatchObject({
      receipt: { r3AuthorAgent: history.agentId }, convergence: {
        codeReviewRoot: reviewRoot } })
    const receiptCustody = inspectV138Plan26261Receipt(directory, receiptPath)
    const summaryPath = `${path.dirname(SUMMARY_PATH)}/262-61-SUMMARY.md`
    const summaryManifest = { schemaVersion: "v1.38-plan-262-61-summary-v1",
      r3AuthorAgent: history.agentId,
      completionTimestamp: history.completionTimestamp,
      sourceR3, sourceR3Tree, sourceR3Parent,
      codeReviewPath: reviewPath, codeReviewRoot: reviewRoot,
      reviewFixRoot: convergence.reviewFixRoot, receiptPath,
      receiptCommit: receiptCustody.receiptCommit,
      receiptBlob: receiptCustody.receiptBlob,
      receiptRoot: receiptCustody.receiptRoot,
      independentPersonClaimed: false, reviewerSeparated: false,
      independentCustodyClaimed: false, authorizesPlan26262: false,
      authorizesExecution: false }
    writeFileSync(path.join(directory, summaryPath), "# Plan 262-61 fixture summary\n\n" +
      `\`\`\`plan-262-61-summary-json\n${JSON.stringify(summaryManifest)}\n\`\`\`\n`)
    await expect(runV138Plan26261ReviewerCli(directory,
      ["--check-plan-61-summary-candidate", "--summary", summaryPath,
        "--receipt", receiptPath])).resolves.toBeUndefined()
    commitAll(directory, "docs(262-61): fixture candidate publication")
    await expect(runV138Plan26261ReviewerCli(directory,
      ["--check-plan-61-summary", "--summary", summaryPath,
        "--receipt", receiptPath])).resolves.toBeUndefined()
    writeFileSync(path.join(directory, receiptPath), "{}\n")
    expect(() => inspectV138Plan26261Receipt(directory, receiptPath))
      .toThrow("V138_PLAN_262_61_RECEIPT_NOT_IMMUTABLE")
  }, 60_000)

  it("canonicalization and roots detect nested mutation after recomputation", () => {
    const baseline = { source: SOURCE_A9, nested: { paths: [...R3_PATHS], count: 2 } }
    const mutation = { ...baseline, nested: { ...baseline.nested, count: 3 } }
    expect(canonicalV138ReviewerV3(baseline)).not.toBe(canonicalV138ReviewerV3(mutation))
    expect(sha256V138ReviewerV3(canonicalV138ReviewerV3(baseline)))
      .not.toBe(sha256V138ReviewerV3(canonicalV138ReviewerV3(mutation)))
  })

  it("fails readiness on an ordinary Plan-61 crash-leak directory", () => {
    const leaked = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-exact-a9-"))
    disposable.push(leaked)
    const readiness = snapshotReadiness(repoRoot)
    expect(readiness.tempInventory.map(({ name }) => name))
      .toContain(path.basename(leaked))
    expect(() => assertV138Plan26261NoCrashLeak(readiness))
      .toThrow("V138_PLAN_262_61_MAIN_TEMP_LEAK")
  })

  it("detects added, deleted, reordered, and transient-restored inventory rows", () => {
    const before = [{ path: "a", sha256: "one", ctimeMs: 1 },
      { path: "b", sha256: "two", ctimeMs: 1 }]
    expect(inventoryChangedPaths(before, [...before].reverse())).toEqual([])
    expect(inventoryChangedPaths(before, [{ path: "a", sha256: "one", ctimeMs: 2 },
      { path: "c", sha256: "three", ctimeMs: 1 }])).toEqual(["a", "b", "c"])
  })

  it("attributes fd writes and records completed and failed filesystem outcomes", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-fs-observer-"))
    disposable.push(directory)
    const observer = installRouteFsObserver()
    observer.start(directory, "fd-outcome-fixture")
    try {
      const target = path.join(directory, "transient.json")
      const fd = openSync(target, "wx")
      writeFileSync(fd, "{}\n")
      closeSync(fd)
      unlinkSync(target)
      expect(() => unlinkSync(target)).toThrow()
      const records = observer.stop()
      expect(records.filter(({ path: repoPath }) => repoPath === "transient.json")
        .map(({ operation, outcome }) => [operation, outcome])).toEqual(
          expect.arrayContaining([["openSync", "success"],
            ["writeFileSync", "success"], ["closeSync", "success"],
            ["unlinkSync", "success"], ["unlinkSync", "error"]]))
      expect(records.every(({ detailRoot }) =>
        /^sha256:[0-9a-f]{64}$/u.test(detailRoot))).toBe(true)
    } finally { observer.restore() }
  })

  it("rejects an unknown descriptor instead of fabricating a repository path", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-fs-observer-"))
    disposable.push(directory)
    const observer = installRouteFsObserver()
    observer.start(directory, "unknown-fd-fixture")
    try {
      expect(() => writeFileSync(999_999, "x"))
        .toThrow("V138_PLAN_262_61_ROUTE_FS_DESCRIPTOR_UNKNOWN")
      expect(observer.stop()).toEqual([])
    } finally { observer.restore() }
  })

  it("production effect gate rejects a real protected write-and-restore", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-fs-observer-"))
    disposable.push(directory)
    const protectedPath = path.join(directory, "protected.json")
    writeFileSync(protectedPath, "sealed\n")
    const observer = installRouteFsObserver()
    observer.start(directory, "--check-plan-262-57-pre-execution-readiness-v1")
    try {
      writeFileSync(protectedPath, "mutated\n")
      writeFileSync(protectedPath, "sealed\n")
      const records = observer.stop()
      const entry = V138_REVIEW_V3_ROUTE_MANIFEST[0]
      expect(() => validateV138Plan26261RouteEffects(entry, records))
        .toThrow("V138_PLAN_262_61_ROUTE_FORBIDDEN_TRANSIENT_EFFECT")
    } finally { observer.restore() }
  })

  it("production effect gate rejects a real unexpected transient create-delete", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-fs-observer-"))
    disposable.push(directory)
    const observer = installRouteFsObserver()
    observer.start(directory, "--check-plan-262-57-pre-execution-readiness-v1")
    try {
      const unexpected = path.join(directory, "unexpected.tmp")
      writeFileSync(unexpected, "transient\n", { flag: "wx" })
      unlinkSync(unexpected)
      const records = observer.stop()
      expect(() => validateV138Plan26261RouteEffects(
        V138_REVIEW_V3_ROUTE_MANIFEST[0], records))
        .toThrow("V138_PLAN_262_61_ROUTE_FORBIDDEN_TRANSIENT_EFFECT")
    } finally { observer.restore() }
  })

  it.each(V138_REVIEW_V3_ROUTE_MANIFEST.filter(({ sideEffect }) =>
    sideEffect !== "none"))(
    "production effect gate rejects an empty successful ledger for $command",
    (entry) => {
      expect(() => validateV138Plan26261RouteEffects(entry, [],
        { exit: 0, resultCode: "success_no_disposition" }))
        .toThrow("V138_PLAN_262_61_ROUTE_EFFECT_POLICY_INVALID")
    })

  it("production effect gate binds the exact manifest side-effect class", () => {
    const entry = { ...V138_REVIEW_V3_ROUTE_MANIFEST[3], sideEffect: "none" }
    expect(() => validateV138Plan26261RouteEffects(entry, [],
      { exit: 0, resultCode: "success_no_disposition" }))
      .toThrow("V138_PLAN_262_61_ROUTE_SIDE_EFFECT_CLASS_INVALID")
  })

  it("production effect gate permits only the exact read-only terminal failure", () => {
    const entry = V138_REVIEW_V3_ROUTE_MANIFEST[9]
    expect(validateV138Plan26261RouteEffects(entry, [], { exit: 1,
      resultCode: "MATRIX_PLAN_262_30_TERMINAL_INVALID" }).policy)
      .toMatchObject({ sideEffect: "none", expectedDestinationChange: "unchanged" })
    expect(() => validateV138Plan26261RouteEffects(entry, [], { exit: 1,
      resultCode: "MATRIX_PLAN_262_30_CALIBRATION_INVALID" }))
      .toThrow("V138_PLAN_262_61_ROUTE_EFFECT_RESULT_INVALID")
  })

  it.each([
    `${path.dirname(SUMMARY_PATH)}/262-61-SUMMARY.md`,
    `${path.dirname(SUMMARY_PATH)}/262-62-SUMMARY.md`,
  ])("permits only the exact %s candidate then binds its one-path commit",
    (summaryPath) => {
      const directory = clone()
      const target = path.join(directory, summaryPath)
      writeFileSync(target, "# candidate\n")
      expect(assertV138Plan26261CandidateCleanliness(directory, summaryPath)).toBe(true)
      const extra = path.join(directory, "unexpected-candidate-leak")
      writeFileSync(extra, "leak\n")
      expect(() => assertV138Plan26261CandidateCleanliness(directory, summaryPath))
        .toThrow("V138_PLAN_262_61_REPOSITORY_DIRTY")
      rmSync(extra)
      commitAll(directory, `docs: commit ${path.basename(summaryPath)} candidate`)
      expect(assertV138Plan26261SummaryPublicationState(directory, summaryPath, true))
        .toBe(true)
    })

  it("binds normalized full report content and every custody-wrapper field", () => {
    const report = "# Review\r\n\r\nNarrative.  \r\n\r\n" +
      "```plan-262-62-review-v3-report-json\r\n{\"self\":\"changes\"}\r\n```\r\n"
    expect(normalizedPlan26262ReportContentRoot(report)).toBe(
      normalizedPlan26262ReportContentRoot(report.replace("changes", "different")))
    expect(normalizedPlan26262ReportContentRoot(report)).not.toBe(
      normalizedPlan26262ReportContentRoot(report.replace("Narrative", "Rewritten")))
    const expected = { schemaVersion: "v1", predecessors: ["a"],
      plan60Convergence: { root: "b" }, lifecycle: { root: "c" },
      reviewedR3: { commit: "d" }, terminalReview: { root: "e" },
      reviewFix: { root: "f" }, publications: { b9: "g" },
      normalizedReportContentRoot: normalizedPlan26262ReportContentRoot(report) }
    expect(validatePlan26262ReportManifest(expected, expected)).toBe(true)
    for (const key of Object.keys(expected)) {
      const mutated = { ...expected, [key]: `${key}-mutated` }
      expect(() => validatePlan26262ReportManifest(mutated, expected))
        .toThrow("V138_PLAN_262_62_REVIEW_REPORT_BINDING_INVALID")
    }
  })

  it.each([
    ["missing", { schemaVersion: "v1" }],
    ["extra", { schemaVersion: "v1", authority: false, extra: true }],
    ["nested mismatch", { schemaVersion: "v1", authority: true }],
    ["event reorder", { schemaVersion: "v1", events: [2, 1] }],
    ["timestamp substitution", { schemaVersion: "v1", completedAt: "later" }],
  ])("rejects %s Plan-62 summary mutation", (_name, candidate) => {
    const expected = { schemaVersion: "v1", authority: false,
      events: [1, 2], completedAt: "exact" }
    expect(() => validatePlan26262Summary(candidate, expected))
      .toThrow("V138_PLAN_262_62_SUMMARY_BINDING_INVALID")
  })

  it("enforces bounded canonical per-command route results", () => {
    const route = V138_REVIEW_V3_ROUTE_MANIFEST.find(({ command }) =>
      command === "--write-plan-262-57-route-start-v1")!
    const valid = `${canonicalV138ReviewerV3({ disposition: null,
      receiptRoot: `sha256:${"a".repeat(64)}`,
      schemaVersion: "v1.38-plan-262-57-route-start-v1" })}\n`
    expect(validateV138Plan26261RouteResult(route, 0, valid)).toMatchObject({
      resultCode: "success_no_disposition" })
    expect(() => validateV138Plan26261RouteResult(route, 0, "x".repeat(4097)))
      .toThrow("V138_PLAN_262_61_ROUTE_OUTPUT_BOUNDS_INVALID")
    expect(() => validateV138Plan26261RouteResult(route, 0,
      `${canonicalV138ReviewerV3({ disposition: "wrong",
        receiptRoot: `sha256:${"a".repeat(64)}`,
        schemaVersion: "v1.38-plan-262-57-route-start-v1" })}\n`))
      .toThrow("V138_PLAN_262_61_ROUTE_DISPOSITION_INVALID")
    expect(() => validateV138Plan26261RouteResult(route, 1, "COMPATIBLE_INVALID"))
      .toThrow("V138_PLAN_262_61_ROUTE_RESULT_INVALID")
  })

  it("binds the exact physical and logical identity tuple for all ten routes", () => {
    const expected = { sourceA9: SOURCE_A9,
      logicalSourceB9: "a".repeat(40), physicalSourceB9: "b".repeat(40),
      authorizationRoot: `sha256:${"c".repeat(64)}`,
      sealRoot: `sha256:${"d".repeat(64)}` }
    const logical = { ...expected, physicalSourceB9: expected.logicalSourceB9 }
    const handlers: Record<string, string> = {
      "--check-plan-262-57-pre-execution-readiness-v1":
        "checkV138Plan26257PreExecutionReadinessV1",
      "--resolve-plan-262-57-pre-start-v1":
        "writeV138Plan26257PreStartObstructionV1",
      "--check-plan-262-57-pre-start-obstruction-v1":
        "checkV138Plan26257PreStartObstructionBranch",
      "--write-execution-context-v11-receipt": "writeV138Plan26257RouteStartV1",
      "--write-plan-262-57-route-start-v1": "writeV138Plan26257RouteStartV1",
      "--write-headroom-preflight-v11-receipt":
        "writeV138HostHeadroomPreflightV11Receipt",
      "--calibrate-parallel-v11-receipt": "writeV138ParallelCalibrationV11Receipt",
      "--write-authoritative-v12-receipt": "writeV138AuthoritativeMatrixV12Receipt",
      "--write-plan-262-57-terminal-v1": "writeV138Plan26257TerminalV1",
      "--check-plan-262-57-terminal-v1": "checkV138Plan26257TerminalBranch",
    }
    for (const entry of V138_REVIEW_V3_ROUTE_MANIFEST) {
      const argv = buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9,
        expected.physicalSourceB9)
      const argvValue = (flag: string) => argv[argv.indexOf(flag) + 1]
      const emittedIdentityRecord = JSON.parse(canonicalV138ReviewerV3({
        authorizationRoot: expected.authorizationRoot,
        sealRoot: expected.sealRoot,
        logicalSourceB9: expected.logicalSourceB9,
      })) as Record<string, string>
      const observed = { sourceA9: argvValue("--source-a9")!,
        logicalSourceB9: emittedIdentityRecord.logicalSourceB9!,
        physicalSourceB9: argvValue("--source-b9")!,
        authorizationRoot: emittedIdentityRecord.authorizationRoot!,
        sealRoot: emittedIdentityRecord.sealRoot! }
      const base = { command: entry.command, handler: handlers[entry.command]!,
        manifestHandler: entry.handler,
        handlerSourceRoot: `sha256:${"1".repeat(64)}`,
        dispatcherSourceRoot: `sha256:${"2".repeat(64)}`,
        resultCode: "bounded-result",
        physicalOutputRoot: `sha256:${"3".repeat(64)}`,
        logicalOutputRoot: `sha256:${"4".repeat(64)}`,
        expected, observed, logical }
      expect(verifyV138Plan26261RouteIdentity(base).logicalRouteIdentityRoot)
        .toMatch(/^sha256:[0-9a-f]{64}$/u)
      for (const key of Object.keys(expected) as Array<keyof typeof expected>)
        expect(() => verifyV138Plan26261RouteIdentity({ ...base,
          observed: { ...observed, [key]: key.includes("Root") ?
            `sha256:${"e".repeat(64)}` : "e".repeat(40) } }))
          .toThrow("V138_PLAN_262_61_ROUTE_IDENTITY_INVALID")
    }
  })

  it("rejects well-formed physical identity substitutions in read-only output", () => {
    const expected = { sourceA9: SOURCE_A9, logicalSourceB9: "a".repeat(40),
      physicalSourceB9: "b".repeat(40),
      authorizationRoot: `sha256:${"c".repeat(64)}`,
      sealRoot: `sha256:${"d".repeat(64)}` }
    const readiness = V138_REVIEW_V3_ROUTE_MANIFEST.find(({ command }) =>
      command === "--check-plan-262-57-pre-execution-readiness-v1")!
    const readinessRecord = { schemaVersion:
      "v1.38-plan-262-57-pre-execution-readiness-v1", sourceA9: SOURCE_A9,
    sourceB9: expected.physicalSourceB9,
    authorizationRoot: expected.authorizationRoot, sealRoot: expected.sealRoot,
    absentDestinations: [], routeStarted: false, chargedAttemptCount: 0,
    acceptedCellCount: 0 }
    expect(validateV138Plan26261RouteResult(readiness, 0,
      `${JSON.stringify(readinessRecord)}\n`, expected)).toBeTruthy()
    for (const mutation of [{ sourceB9: "e".repeat(40) },
      { authorizationRoot: `sha256:${"e".repeat(64)}` },
      { sealRoot: `sha256:${"e".repeat(64)}` }])
      expect(() => validateV138Plan26261RouteResult(readiness, 0,
        `${JSON.stringify({ ...readinessRecord, ...mutation })}\n`, expected))
        .toThrow("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
    const obstruction = V138_REVIEW_V3_ROUTE_MANIFEST.find(({ command }) =>
      command === "--check-plan-262-57-pre-start-obstruction-v1")!
    const obstructionRecord = { schemaVersion:
      "v1.38-plan-262-57-pre-start-obstruction-v1",
    obstruction: { path: obstruction.destination, type: "file",
      metadataRoot: `sha256:${"f".repeat(64)}` },
    authorizationRoot: expected.authorizationRoot, sealRoot: expected.sealRoot,
    routeStarted: false, isRouteTerminal: false, chargedAttemptCount: 0,
    acceptedCellCount: 0, authorityExpired: true, noRetry: true,
    satisfiesAdmit03: false, downstreamAuthority: {},
    dispositionRoot: `sha256:${"1".repeat(64)}` }
    for (const mutation of [{ authorizationRoot: `sha256:${"e".repeat(64)}` },
      { sealRoot: `sha256:${"e".repeat(64)}` }])
      expect(() => validateV138Plan26261RouteResult(obstruction, 0,
        `${JSON.stringify({ ...obstructionRecord, ...mutation })}\n`, expected))
        .toThrow("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  })

  it("passes an exact hypothetical review and rejects recomputed evidence mutations", () => {
    const shared = inspectV138SourceA9Custody(repoRoot,
      { sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9 })
    const history = inspectV138Plan26261ProtectedHistory(repoRoot)
    const sourceCustody = { tree: shared.sourceA9Tree, parent: shared.sourceA9Parent,
      authorRun: "codex-plan-262-60-a9-review-fix-v8", paths: shared.sourceA9Paths,
      blobs: shared.sourceA9Blobs, deletionHistory: shared.deletionHistory }
    const protectedHistory = { root: history.protectedHistoryRoot,
      protectedA8: SOURCE_A9, protectedRoots: history.protectedRoots }
    const snapshots = [{ name: "before", inventoryRoot: `sha256:${"1".repeat(64)}`,
      pathCount: 1 }, { name: "after", inventoryRoot: `sha256:${"2".repeat(64)}`,
      pathCount: 2 }]
    const orderedEvents = [{ ordinal: 0, event: "hypothetical:validated",
      path: ".planning/artifacts/example", result: `sha256:${"3".repeat(64)}` }]
    const exact = assembleExpectedPlan26262Review({ sourceCustody, protectedHistory,
      chargeIds: history.chargeIds, priorAuthorizationBytes: history.authorizations,
      snapshots, orderedEvents }) as Record<string, any>
    expect(validatePlan26262ReviewAgainstExpected(exact, exact)).toBe(true)
    const recompute = (mutation: Record<string, unknown>) => {
      const body = { ...exact, ...mutation }; delete body.reviewV3Root
      return { ...body, reviewV3Root: computeV138ReviewV3Root(body) }
    }
    expect(() => validatePlan26262ReviewAgainstExpected(
      recompute({ sourceBase9: "f".repeat(40) }), exact))
      .toThrow("V138_PLAN_262_62_REVIEW_SOURCE_BINDING_INVALID")
    expect(() => validatePlan26262ReviewAgainstExpected(
      recompute({ chargeIds: [...history.chargeIds].reverse() }), exact))
      .toThrow("V138_REVIEW_V3_HISTORY_INVALID")
    expect(() => validatePlan26262ReviewAgainstExpected(
      recompute({ orderedEvents: [{ ...orderedEvents[0], event: "fabricated" }] }), exact))
      .toThrow("V138_PLAN_262_62_REVIEW_EVENT_BINDING_INVALID")
    expect(() => validatePlan26262ReviewAgainstExpected(
      recompute({ snapshots: [...snapshots].reverse() }), exact))
      .toThrow("V138_REVIEW_V3_SNAPSHOT_OBSERVATION_INVALID")
  }, 30_000)
})
