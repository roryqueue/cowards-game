import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { LEAN_AUTHORITY_FALSE, hashLeanValue, reduceLeanExecutions, buildLeanSchedule, LEAN_CURRENT_FORMATION_ROOT, leanRequestRealismRoot } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  LEAN_CORRECTIVE_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V2_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V3_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V4_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V5_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V6_ARTIFACT_PATHS,
  LEAN_ARTIFACT_PATHS,
  LEAN_EXECUTABLE_CLOSURE_PATHS,
  assertLeanStatus,
  assertLeanCorrectiveAdmissionStatus,
  assertLeanCorrectiveFreshEffectsAbsent,
  createLeanCorrectiveChildOwnership,
  validateLeanCorrectiveChildOwnership,
  recoverLeanCorrectiveOrphanInjected,
  LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH,
  checkLeanReadiness,
  checkLeanSourceReview,
  validateLeanAdjudication,
  validateLeanEligibility,
  validateLeanInvocation,
  validateLeanInvocationLineage,
  validateLeanTerminalArtifact,
  createLeanInterruptedTerminal,
  checkLeanManifest,
  checkLeanReviewOutcome,
  parseLeanTrackingSurface,
  renderLeanManifest,
  renderLeanReadinessV3,
  renderLeanSourceReviewV3,
  renderLeanTrackingCarrier,
  checkLeanCorrectiveRecoveryOnlyStructure,
  checkLeanCorrectiveManifestV2,
  checkLeanCorrectiveSourceReviewV2,
  checkLeanCorrectiveReviewOutcomeV2,
  renderLeanCorrectiveManifestV3,
  renderLeanCorrectiveSourceReviewV3,
  renderLeanCorrectiveReadinessV3,
  checkLeanCorrectiveReadinessV3,
  checkLeanCorrectiveReadinessV4,
  deriveLeanCorrectiveFreshEffects,
  renderLeanCorrectiveManifestV4,
  renderLeanCorrectiveReadinessV4,
  renderLeanCorrectiveSourceReviewV4,
  checkLeanCorrectiveReviewOutcomeV5,
  checkLeanCorrectiveReadinessV5,
  deriveLeanCorrectiveFreshEffectsV5,
  renderLeanCorrectiveManifestV5,
  renderLeanCorrectiveReadinessV5,
  renderLeanCorrectiveSourceReviewV5,
  checkLeanCorrectiveReviewOutcomeV6,
  checkLeanCorrectiveManifestV6,
  checkLeanCorrectiveReadinessV6,
  checkLeanCorrectiveSourceOnlyV6,
  deriveLeanCorrectiveFreshEffectsV6,
  renderLeanCorrectiveManifestV6,
  renderLeanCorrectiveReadinessV6,
  renderLeanCorrectiveSourceReviewV6,
  createLeanCorrectiveInterruptionTombstone,
  validateLeanCorrectiveInterruptionTombstone,
  validateLeanDiagnosticCustody,
  LEAN_DIRECT_ARTIFACT_PATHS,
  renderLeanDirectAuthorization,
  validateLeanDirectAuthorization,
  checkLeanDirectSourceOnly,
  LEAN_DIRECT_V2_ARTIFACT_PATHS,
  validateLeanDirectV2ExplicitSourceRef,
  commitTouchesLeanRunnableSource,
  checkLeanDirectContainerSourceOnlyV2,
} from "./check-v1-38-lean-admission.js"
import * as leanAdmissionModule from "./check-v1-38-lean-admission.js"

const temporary: string[] = []
afterEach(() => temporary.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

describe("lean admission custody", () => {
  it("reserves the complete fresh v11 diagnostic and operational family", () => {
    const module = leanAdmissionModule as unknown as Record<string, unknown>
    expect(module.LEAN_DIRECT_V11_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v10.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v11.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v11.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v11.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v11.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v11.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v11.json",
    })
    expect(module.LEAN_DIRECT_WORKER_LIFECYCLE_DIAGNOSTIC_V2_PATH).toBe(".planning/artifacts/v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v2.json")
    const historical = [LEAN_DIRECT_ARTIFACT_PATHS, LEAN_DIRECT_V2_ARTIFACT_PATHS, module.LEAN_DIRECT_V3_ARTIFACT_PATHS, module.LEAN_DIRECT_V4_ARTIFACT_PATHS, module.LEAN_DIRECT_V5_ARTIFACT_PATHS, module.LEAN_DIRECT_V6_ARTIFACT_PATHS, module.LEAN_DIRECT_V7_ARTIFACT_PATHS, module.LEAN_DIRECT_V8_ARTIFACT_PATHS, module.LEAN_DIRECT_V9_ARTIFACT_PATHS, module.LEAN_DIRECT_V10_ARTIFACT_PATHS].flatMap((paths) => Object.values(paths as Record<string, string>))
    const fresh = Object.values(module.LEAN_DIRECT_V11_ARTIFACT_PATHS as Record<string, string>)
    expect(new Set([...historical, ...fresh, module.LEAN_DIRECT_WORKER_LIFECYCLE_DIAGNOSTIC_PATH as string, module.LEAN_DIRECT_WORKER_LIFECYCLE_DIAGNOSTIC_V2_PATH as string]).size).toBe(historical.length + fresh.length + 2)
    for (const key of [
      "checkLeanDirectWorkerLifecycleSourceOnlyV11", "writeLeanDirectWorkerLifecycleDiagnosticV2", "checkLeanDirectWorkerLifecycleDiagnosticV2",
      "validateLeanContainerPreflightArtifactV10", "writeLeanContainerPreflightArtifactV10", "renderLeanDirectAuthorizationV11",
      "validateLeanDirectAuthorizationV11", "writeLeanDirectAuthorizationV11", "checkLeanDirectValidityReviewV11",
      "checkLeanDirectReviewDispositionV11", "loadAndCheckLeanDirectReviewedReadyV11", "createLeanDirectInvocationV11",
      "createLeanDirectTerminalArtifactV11", "checkLeanDirectPostRunV11", "checkLeanDirectAdjudicationV11",
      "checkLeanDirectFinalTrackingV11",
    ]) expect(module[key]).toBeTypeOf("function")
  })

  it("validates diagnostic-v2 as attempt three with aggregate-only zero-effect evidence", () => {
    const module = leanAdmissionModule as unknown as {
      validateLeanWorkerLifecycleDiagnosticV2: (repoRoot: string, value: unknown) => unknown
    }
    const prior = JSON.parse(readFileSync(".planning/artifacts/v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v1.json", "utf8")) as Record<string, unknown>
    expect(prior.stage).toBe("docker_unavailable")
    expect(hashLeanValue(prior)).toBe("sha256:e849dd83d14888f2361ec830bf139ef2cddd7f67fd615aad1bfcd1fe4e2587a4")
    expect(() => module.validateLeanWorkerLifecycleDiagnosticV2(process.cwd(), { ...prior, schemaVersion: "v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v2", attemptOrdinal: 2 })).toThrow()
    expect(() => module.validateLeanWorkerLifecycleDiagnosticV2(process.cwd(), { ...prior, schemaVersion: "v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v2", attemptOrdinal: 3, attemptLimit: 11 })).toThrow()
    expect(() => module.validateLeanWorkerLifecycleDiagnosticV2(process.cwd(), { ...prior, schemaVersion: "v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v2", attemptOrdinal: 3, preflightInvocations: 1 })).toThrow()
    expect(() => module.validateLeanWorkerLifecycleDiagnosticV2(process.cwd(), { ...prior, schemaVersion: "v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v2", attemptOrdinal: 3, matchInvocations: 1 })).toThrow()
    expect(() => module.validateLeanWorkerLifecycleDiagnosticV2(process.cwd(), { ...prior, schemaVersion: "v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v2", attemptOrdinal: 3, stderr: "private" })).toThrow()
  })

  it("admits only the exact Docker absent-object byte tuples", () => {
    const exactAbsent = (leanAdmissionModule as unknown as {
      exactDockerAbsentDiagnostic: (
        status: number | null,
        signal: NodeJS.Signals | null,
        error: Error | undefined,
        stdout: string,
        stderr: string,
        name: string,
      ) => boolean
    }).exactDockerAbsentDiagnostic
    const name = "cg-v138-lifecycle-requested"
    const call = (
      status: number | null,
      signal: NodeJS.Signals | null,
      error: Error | undefined,
      stdout: string,
      stderr: string,
      requestedName = name,
    ) => exactAbsent(status, signal, error, stdout, stderr, requestedName)

    expect(call(1, null, undefined, "[]\n", `Error: No such object: ${name}\n`)).toBe(true)
    expect(call(1, null, undefined, "", `Error: No such object: ${name}\n`)).toBe(true)
    expect(call(1, null, undefined, "\n", `error: no such object: ${name}\n`)).toBe(true)
    expect(call(1, null, undefined, "[]\n", `error: no such object: ${name}\n`)).toBe(true)

    const nearMisses: ReadonlyArray<readonly [number | null, NodeJS.Signals | null, Error | undefined, string, string, string?]> = [
      [1, null, undefined, "", ""],
      [1, null, undefined, "[]", `Error: No such object: ${name}\n`],
      [1, null, undefined, "[]\n\n", `Error: No such object: ${name}\n`],
      [1, null, undefined, " []\n", `Error: No such object: ${name}\n`],
      [1, null, undefined, "[]\n ", `Error: No such object: ${name}\n`],
      [1, null, undefined, "\ufffd[]\n", `Error: No such object: ${name}\n`],
      [1, null, undefined, "[]\n", `error: no such object: ${name}`],
      [1, null, undefined, "[]\n", `error: no such object: ${name}\nextra`],
      [1, null, undefined, "[]\n", `error: no such object: another-container\n`],
      [1, null, undefined, "[]", `error: no such object: ${name}\n`],
      [1, null, undefined, "[]\n\n", `error: no such object: ${name}\n`],
      [1, null, undefined, " []\n", `error: no such object: ${name}\n`],
      [1, null, undefined, "\ufffd[]\n", `error: no such object: ${name}\n`],
      [1, null, undefined, "[]\n", `Error: No such object: ${name}`],
      [1, null, undefined, "[]\n", `Error: No such object: ${name}\nextra`],
      [1, null, undefined, "[]\n", ` Error: No such object: ${name}\n`],
      [1, null, undefined, "[]\n", `Error: No such object: another-container\n`],
      [0, null, undefined, "[]\n", `Error: No such object: ${name}\n`],
      [1, "SIGTERM", undefined, "[]\n", `Error: No such object: ${name}\n`],
      [1, null, new Error("spawn failed"), "[]\n", `Error: No such object: ${name}\n`],
      [1, null, undefined, "[]\n", "Cannot connect to the Docker daemon\n"],
      [1, null, undefined, "[]\n", "permission denied\n"],
      [0, null, undefined, "[]\n", `error: no such object: ${name}\n`],
      [1, "SIGTERM", undefined, "[]\n", `error: no such object: ${name}\n`],
      [1, null, new Error("spawn failed"), "[]\n", `error: no such object: ${name}\n`],
      [null, "SIGTERM", undefined, "", "timeout"],
    ]
    for (const args of nearMisses) expect(call(...args)).toBe(false)
  })

  it("routes diagnostic pre-create and post-remove absence through one exact predicate", () => {
    const source = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    const writer = source.match(/export const writeLeanDirectWorkerLifecycleDiagnosticV1[\s\S]*?\n\}\nexport const checkLeanDirectWorkerLifecycleDiagnosticV1/u)?.[0] ?? ""
    expect(writer.match(/exactDockerAbsentDiagnostic\(/gu)).toHaveLength(2)
    expect(writer).toContain("absent.error")
  })

  it("reserves the fresh collision-free v10 lifecycle trust and effect family", () => {
    const module = leanAdmissionModule as unknown as Record<string, unknown>
    expect(module.LEAN_DIRECT_V10_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v9.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v10.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v10.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v10.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v10.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v10.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v10.json",
    })
    expect(module.LEAN_DIRECT_WORKER_LIFECYCLE_DIAGNOSTIC_PATH).toBe(".planning/artifacts/v1.38-lean-runner-direct-worker-lifecycle-diagnostic-v1.json")
    const historical = [LEAN_DIRECT_ARTIFACT_PATHS, LEAN_DIRECT_V2_ARTIFACT_PATHS, module.LEAN_DIRECT_V3_ARTIFACT_PATHS, module.LEAN_DIRECT_V4_ARTIFACT_PATHS, module.LEAN_DIRECT_V5_ARTIFACT_PATHS, module.LEAN_DIRECT_V6_ARTIFACT_PATHS, module.LEAN_DIRECT_V7_ARTIFACT_PATHS, module.LEAN_DIRECT_V8_ARTIFACT_PATHS, module.LEAN_DIRECT_V9_ARTIFACT_PATHS].flatMap((paths) => Object.values(paths as Record<string, string>))
    const fresh = Object.values(module.LEAN_DIRECT_V10_ARTIFACT_PATHS as Record<string, string>)
    expect(new Set([...historical, ...fresh, module.LEAN_DIRECT_WORKER_LIFECYCLE_DIAGNOSTIC_PATH as string]).size).toBe(historical.length + fresh.length + 1)
    for (const key of ["checkLeanDirectWorkerLifecycleSourceOnlyV10", "writeLeanDirectWorkerLifecycleDiagnosticV1", "checkLeanDirectWorkerLifecycleDiagnosticV1", "validateLeanContainerPreflightArtifactV9", "writeLeanContainerPreflightArtifactV9", "renderLeanDirectAuthorizationV10", "checkLeanDirectValidityReviewV10", "checkLeanDirectReviewDispositionV10", "loadAndCheckLeanDirectReviewedReadyV10", "createLeanDirectInvocationV10", "createLeanDirectTerminalArtifactV10", "checkLeanDirectPostRunV10", "checkLeanDirectAdjudicationV10"]) expect(module[key]).toBeTypeOf("function")
  })

  it("binds v10 source custody to completion port-close and natural-exit reconciliation", () => {
    const source = readFileSync("scripts/lib/v1-38-lean-container-match-session.ts", "utf8")
    const broker = source.match(/export const LEAN_CONTAINER_BROKER_SOURCE = `[\s\S]*?\n`\n\nconst STREAM_WORKER_SOURCE/u)?.[0] ?? ""
    for (const token of ['kind:"completion"', 'port.on("close"', 'worker.on("exit"', "await reconcile()", "env: {}", "execArgv: []", "resourceLimits:"]) expect(broker).toContain(token)
    expect(broker).not.toContain("receiveMessageOnPort")
    expect(broker).not.toContain("node:child_process")
    expect(broker).not.toContain("spawnSync")
    expect(broker).not.toContain("fallback")
  })

  it("reserves the fresh collision-free v9 guest-worker trust and effect family", () => {
    const module = leanAdmissionModule as unknown as Record<string, unknown>
    expect(module.LEAN_DIRECT_V9_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v8.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v9.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v9.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v9.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v9.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v9.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v9.json",
    })
    const historical = [LEAN_DIRECT_ARTIFACT_PATHS, LEAN_DIRECT_V2_ARTIFACT_PATHS, module.LEAN_DIRECT_V3_ARTIFACT_PATHS, module.LEAN_DIRECT_V4_ARTIFACT_PATHS, module.LEAN_DIRECT_V5_ARTIFACT_PATHS, module.LEAN_DIRECT_V6_ARTIFACT_PATHS, module.LEAN_DIRECT_V7_ARTIFACT_PATHS, module.LEAN_DIRECT_V8_ARTIFACT_PATHS].flatMap((paths) => Object.values(paths as Record<string, string>))
    const fresh = Object.values(module.LEAN_DIRECT_V9_ARTIFACT_PATHS as Record<string, string>)
    expect(new Set([...historical, ...fresh]).size).toBe(historical.length + fresh.length)
    for (const key of ["checkLeanDirectGuestWorkerSourceOnlyV9", "validateLeanContainerPreflightArtifactV8", "writeLeanContainerPreflightArtifactV8", "renderLeanDirectAuthorizationV9", "checkLeanDirectValidityReviewV9", "checkLeanDirectReviewDispositionV9", "loadAndCheckLeanDirectReviewedReadyV9", "createLeanDirectInvocationV9", "createLeanDirectTerminalArtifactV9"]) expect(module[key]).toBeTypeOf("function")
  })

  it("binds v9 source custody to fresh bounded Workers without a broker child process or fallback", () => {
    const source = readFileSync("scripts/lib/v1-38-lean-container-match-session.ts", "utf8")
    const broker = source.match(/export const LEAN_CONTAINER_BROKER_SOURCE = `[\s\S]*?\n`\n\nconst STREAM_WORKER_SOURCE/u)?.[0] ?? ""
    for (const token of ['from "node:worker_threads"', "new Worker(", "env: {}", "execArgv: []", "resourceLimits:", "await terminate(worker", "queue=queue.then", "requestId:q.requestId"]) expect(broker).toContain(token)
    expect(broker).not.toContain("node:child_process")
    expect(broker).not.toContain("spawnSync")
    expect(broker).not.toContain("fallback")
  })

  it("reserves the fresh collision-free v8 exact-absence trust and effect family", () => {
    const module = leanAdmissionModule as unknown as Record<string, unknown>
    expect(module.LEAN_DIRECT_V8_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v7.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v8.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v8.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v8.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v8.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v8.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v8.json",
    })
    const priorPaths = [
      LEAN_DIRECT_ARTIFACT_PATHS,
      LEAN_DIRECT_V2_ARTIFACT_PATHS,
      module.LEAN_DIRECT_V3_ARTIFACT_PATHS,
      module.LEAN_DIRECT_V4_ARTIFACT_PATHS,
      module.LEAN_DIRECT_V5_ARTIFACT_PATHS,
      module.LEAN_DIRECT_V6_ARTIFACT_PATHS,
      module.LEAN_DIRECT_V7_ARTIFACT_PATHS,
    ].flatMap((paths) => Object.values(paths as Record<string, string>))
    const freshPaths = Object.values(module.LEAN_DIRECT_V8_ARTIFACT_PATHS as Record<string, string>)
    expect(new Set([...priorPaths, ...freshPaths]).size).toBe(priorPaths.length + freshPaths.length)
    for (const key of [
      "checkLeanDirectExactAbsenceSourceOnlyV8", "validateLeanContainerPreflightArtifactV7",
      "writeLeanContainerPreflightArtifactV7", "renderLeanDirectAuthorizationV8",
      "checkLeanDirectValidityReviewV8", "checkLeanDirectReviewDispositionV8",
      "loadAndCheckLeanDirectReviewedReadyV8", "createLeanDirectInvocationV8",
      "createLeanDirectTerminalArtifactV8",
    ]) expect(module[key]).toBeTypeOf("function")
  })

  it("keeps the v8 absence predicate byte-exact instead of normalized", () => {
    const source = readFileSync("scripts/lib/v1-38-lean-container-match-session.ts", "utf8")
    const predicate = source.match(/const exactAbsent[\s\S]*?\n\)/u)?.[0] ?? ""
    expect(predicate).toContain("result.stdout.byteLength === 0")
    expect(predicate).toContain("Error: No such object:")
    expect(predicate).toContain('result.stdout.equals(Buffer.from("\\n", "utf8"))')
    expect(predicate).toContain("error: no such object:")
    expect(predicate).not.toMatch(/\.trim\(|toLowerCase|toUpperCase|\s\+/u)
  })

  it("reserves the fresh collision-free v7 trust and effect family", () => {
    const module = leanAdmissionModule as unknown as Record<string, unknown>
    expect(module.LEAN_DIRECT_V7_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v6.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v7.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v7.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v7.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v7.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v7.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v7.json",
    })
    for (const key of [
      "checkLeanDirectPreflightReferenceSourceOnlyV7", "validateLeanContainerPreflightArtifactV6",
      "writeLeanContainerPreflightArtifactV6", "renderLeanDirectAuthorizationV7",
      "checkLeanDirectValidityReviewV7", "checkLeanDirectReviewDispositionV7",
      "loadAndCheckLeanDirectReviewedReadyV7", "createLeanDirectInvocationV7",
      "createLeanDirectTerminalArtifactV7",
    ]) expect(module[key]).toBeTypeOf("function")
  })

  it("persists only closed privacy-safe preflight diagnostic reason codes", () => {
    const module = leanAdmissionModule as unknown as {
      classifyLeanContainerPreflightFailure: (error: unknown) => string
      validateLeanContainerPreflightOutcomeV4: (value: unknown) => unknown
    }
    const cases = [
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_DOCKER_UNAVAILABLE"), "docker_unavailable"],
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_IMAGE_INSPECT_INVALID"), "image_inspect_invalid"],
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_ADAPTER_DRIFT"), "adapter_drift"],
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_ARTIFACT_MISSING"), "fixture_artifact_missing"],
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_PROBE_FAILED"), "probe_failed"],
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_LIFECYCLE_FAILED"), "cleanup_incomplete"],
      [new TypeError("LEAN_CONTAINER_PREFLIGHT_INFEASIBLE"), "evaluation_refused"],
      [Object.assign(new Error("private path /Users/example and stderr bytes"), { stack: "private frame" }), "unexpected_failure"],
    ] as const
    for (const [error, reasonCode] of cases) {
      expect(module.classifyLeanContainerPreflightFailure(error)).toBe(reasonCode)
      expect(module.validateLeanContainerPreflightOutcomeV4({ status: "non_pass", reasonCode })).toEqual({ status: "non_pass", reasonCode })
    }
    expect(() => module.validateLeanContainerPreflightOutcomeV4({ status: "non_pass", reasonCode: "private frame" })).toThrow()
    expect(() => module.validateLeanContainerPreflightOutcomeV4({ status: "non_pass", reasonCode: "unexpected_failure", stderr: "private" })).toThrow()
  })

  it("authenticates the additive exact 29-path Plan185 closure correction", () => {
    const module = leanAdmissionModule as unknown as {
      checkLeanPlan185ClosureCorrection: (repoRoot: string, summaryOverride?: string) => void
    }
    const correction = [
      "ae4fd480197393d1c7d27dbc43878d3b31e36b25", "29-path",
      "sha256:007eb34c12041eb535f0ff4b5999e8b894fa105fff421fb64dd5045822ac93ae",
      "sha256:1e187745221a31d67d1d284b3e4abb0cc83d231b85b89910b99c3e31244c30fa",
      "stale superseded",
    ].join("\n")
    expect(() => module.checkLeanPlan185ClosureCorrection(process.cwd(), correction)).not.toThrow()
  })

  it("reserves the fresh collision-free v6 persistent-stream trust and effect family", () => {
    const module = leanAdmissionModule as unknown as Record<string, unknown>
    expect(module.LEAN_DIRECT_V6_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v5.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v6.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v6.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v6.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v6.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v6.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v6.json",
    })
    for (const key of ["checkLeanDirectContainerStreamSourceOnlyV6", "validateLeanContainerPreflightArtifactV5", "renderLeanDirectAuthorizationV6", "checkLeanDirectValidityReviewV6", "checkLeanDirectReviewDispositionV6", "loadAndCheckLeanDirectReviewedReadyV6", "createLeanDirectInvocationV6", "createLeanDirectTerminalArtifactV6"] as const) expect(module[key]).toBeTypeOf("function")
  })

  it("reserves the fresh collision-free v5 trust and effect family", () => {
    const module = leanAdmissionModule as unknown as {
      LEAN_DIRECT_V5_ARTIFACT_PATHS: Record<string, string>
      checkLeanDirectContainerSourceOnlyV5: unknown
      validateLeanContainerPreflightArtifactV4: unknown
      renderLeanDirectAuthorizationV5: unknown
      checkLeanDirectValidityReviewV5: unknown
      checkLeanDirectReviewDispositionV5: unknown
      loadAndCheckLeanDirectReviewedReadyV5: unknown
      createLeanDirectInvocationV5: unknown
      createLeanDirectTerminalArtifactV5: unknown
    }
    expect(module.LEAN_DIRECT_V5_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v4.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v5.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v5.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v5.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v5.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v5.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v5.json",
    })
    for (const key of ["checkLeanDirectContainerSourceOnlyV5", "validateLeanContainerPreflightArtifactV4", "renderLeanDirectAuthorizationV5", "checkLeanDirectValidityReviewV5", "checkLeanDirectReviewDispositionV5", "loadAndCheckLeanDirectReviewedReadyV5", "createLeanDirectInvocationV5", "createLeanDirectTerminalArtifactV5"] as const) expect(module[key]).toBeTypeOf("function")
  })

  it("reserves a collision-free v4 trust and effect family", async () => {
    const module = await import("./check-v1-38-lean-admission.js") as unknown as {
      LEAN_DIRECT_V4_ARTIFACT_PATHS: Record<string, string>
      checkLeanDirectContainerSourceOnlyV4: unknown
      validateLeanContainerPreflightArtifactV3: unknown
      renderLeanDirectAuthorizationV4: unknown
      checkLeanDirectValidityReviewV4: unknown
      checkLeanDirectReviewDispositionV4: unknown
      loadAndCheckLeanDirectReviewedReadyV4: unknown
    }
    expect(module.LEAN_DIRECT_V4_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v3.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v4.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v4.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v4.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v4.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v4.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v4.json",
    })
    const prior = Object.values({ ...LEAN_DIRECT_ARTIFACT_PATHS, ...LEAN_DIRECT_V2_ARTIFACT_PATHS })
    expect(new Set([...prior, ...Object.values(module.LEAN_DIRECT_V4_ARTIFACT_PATHS)]).size).toBe(prior.length + Object.values(module.LEAN_DIRECT_V4_ARTIFACT_PATHS).length)
    expect(module.checkLeanDirectContainerSourceOnlyV4).toBeTypeOf("function")
    expect(module.validateLeanContainerPreflightArtifactV3).toBeTypeOf("function")
    expect(module.renderLeanDirectAuthorizationV4).toBeTypeOf("function")
    expect(module.checkLeanDirectValidityReviewV4).toBeTypeOf("function")
    expect(module.checkLeanDirectReviewDispositionV4).toBeTypeOf("function")
    expect(module.loadAndCheckLeanDirectReviewedReadyV4).toBeTypeOf("function")
  })

  it("defines an additive collision-free v3 direct trust path", () => {
    const module = leanAdmissionModule as unknown as {
      LEAN_DIRECT_V3_ARTIFACT_PATHS: Record<string, string>
      checkLeanDirectContainerSourceOnlyV3: unknown
      validateLeanContainerPreflightArtifactV2: unknown
      validateLeanContainerPreflightOutcomeV2: (value: unknown) => unknown
      validateLeanDirectAuthorizationV3: unknown
      checkLeanDirectValidityReviewV3: unknown
      loadAndCheckLeanDirectReviewedReadyV3: unknown
    }
    expect(module.LEAN_DIRECT_V3_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v2.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v3.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v3.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v3.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v3.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v3.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v3.json",
    })
    expect(module.checkLeanDirectContainerSourceOnlyV3).toBeTypeOf("function")
    expect(module.validateLeanContainerPreflightArtifactV2).toBeTypeOf("function")
    expect(module.validateLeanContainerPreflightOutcomeV2({ status: "non_pass", reasonCode: "container_preflight_refused" })).toEqual({ status: "non_pass", reasonCode: "container_preflight_refused" })
    expect(() => module.validateLeanContainerPreflightOutcomeV2({ status: "non_pass", reasonCode: "raw_runtime_error" })).toThrow(/PREFLIGHT_OUTCOME_INVALID/u)
    expect(() => module.validateLeanContainerPreflightOutcomeV2({ status: "non_pass", reasonCode: "container_preflight_refused", stderr: "private" })).toThrow(/PREFLIGHT_OUTCOME_INVALID/u)
    expect(module.validateLeanDirectAuthorizationV3).toBeTypeOf("function")
    expect(module.checkLeanDirectValidityReviewV3).toBeTypeOf("function")
    expect(module.loadAndCheckLeanDirectReviewedReadyV3).toBeTypeOf("function")

    const historical = Object.values({ ...LEAN_DIRECT_ARTIFACT_PATHS, ...LEAN_DIRECT_V2_ARTIFACT_PATHS })
    expect(new Set([...historical, ...Object.values(module.LEAN_DIRECT_V3_ARTIFACT_PATHS)]).size)
      .toBe(historical.length + Object.values(module.LEAN_DIRECT_V3_ARTIFACT_PATHS).length)
  })

  it("defines an additive v2 container trust path and preserves denied v1 bytes", () => {
    expect(LEAN_DIRECT_V2_ARTIFACT_PATHS).toEqual({
      preflight: ".planning/artifacts/v1.38-lean-runner-container-preflight-v1.json",
      authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v2.json",
      review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v2.json",
      invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v2.json",
      terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v2.json",
      adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v2.json",
      eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v2.json",
    })
    expect(hashLeanValue(JSON.parse(readFileSync(LEAN_DIRECT_ARTIFACT_PATHS.authorization, "utf8")))).toBe("sha256:3c546e446e8f5fb9f062676d88ebf18b58ccf2070c6d9faa636fe8312634c04c")
    expect(hashLeanValue(JSON.parse(readFileSync(LEAN_DIRECT_ARTIFACT_PATHS.review, "utf8")))).toBe("sha256:8c0b81a777ec5b5513a4afbf582906f7d19a12e8102b1e1688d12e39f453d073")
  })

  it("requires an explicit commit oid and rejects HEAD or documentation-only commits", () => {
    expect(() => validateLeanDirectV2ExplicitSourceRef(undefined)).toThrow(/EXPLICIT_SOURCE/u)
    expect(() => validateLeanDirectV2ExplicitSourceRef("HEAD")).toThrow(/EXPLICIT_SOURCE/u)
    expect(validateLeanDirectV2ExplicitSourceRef("a".repeat(40))).toBe("a".repeat(40))
    expect(commitTouchesLeanRunnableSource(["scripts/run-v1-38-lean-runner-feasibility.ts"])).toBe(true)
    expect(commitTouchesLeanRunnableSource([".planning/phases/262-example/262-177-SUMMARY.md"])).toBe(false)
  })

  it("keeps the blocked v2 review as history and every other v2 effect absent", () => {
    expect(checkLeanDirectContainerSourceOnlyV2).toBeTypeOf("function")
    expect(hashLeanValue(JSON.parse(readFileSync(LEAN_DIRECT_V2_ARTIFACT_PATHS.review, "utf8"))))
      .toBe("sha256:ffcee7e51426ceb898a2210ece0d42241c02214adcd289368fd288a5f124f173")
    for (const artifactPath of Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V2_ARTIFACT_PATHS.review)) {
      expect(() => readFileSync(artifactPath, "utf8")).toThrow()
    }
  })

  const passingTerminal = () => reduceLeanExecutions(buildLeanSchedule().map((cell) => ({
    ...cell,
    classification: "success" as const,
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: true,
    integrityValid: true,
    requestRealismRoot: leanRequestRealismRoot(cell),
    currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT,
    outcomeRoot: hashLeanValue({ cell: cell.baseCellId, kind: "outcome" }),
    finalStateRoot: hashLeanValue({ cell: cell.baseCellId, kind: "state" }),
    transitionEventRoot: hashLeanValue({ cell: cell.baseCellId, kind: "events" }),
    runtimeAccountingRoot: hashLeanValue({ cell: cell.baseCellId, kind: "accounting" }),
  })))
  it("renders an exact D-34L.1 direct authorization with five preserved findings", () => {
    const authorization = JSON.parse(readFileSync(LEAN_DIRECT_ARTIFACT_PATHS.authorization, "utf8")) as ReturnType<typeof renderLeanDirectAuthorization>
    expect(authorization.schemaVersion).toBe("v1.38-lean-runner-direct-authorization-v1")
    expect(authorization.plan172Review.root).toBe("sha256:54a33fb359f4aa0851da82cd9d8ff6f6aa04d1d905b8467e36b096c21432113c")
    expect(authorization.plan172Review.findings).toHaveLength(5)
    expect(authorization.plan172Review.findings.every(({ disposition }) => disposition === "certification_only_nonblocking_under_D_34L_1")).toBe(true)
    expect(authorization.invocations).toEqual({ allowed: 1, consumed: 0, recoveryAuthorized: false, partialReuseAuthorized: false, relaunchAuthorized: false })
    expect(Object.values(authorization.freshEffects).every((present) => present === false)).toBe(true)
    expect(() => validateLeanDirectAuthorization(process.cwd(), authorization)).not.toThrow()
    expect(() => validateLeanDirectAuthorization(process.cwd(), { ...authorization, deadlineMilliseconds: 899_999 })).toThrow(/LEAN_DIRECT_AUTHORIZATION/u)
    expect(() => validateLeanDirectAuthorization(process.cwd(), { ...authorization, extra: true })).toThrow(/LEAN_DIRECT_AUTHORIZATION/u)
  }, 30_000)

  it("keeps all direct destinations absent during source-only closure", () => {
    expect(Object.keys(LEAN_DIRECT_ARTIFACT_PATHS)).toEqual(["authorization", "review", "invocation", "terminal", "adjudication", "eligibility"])
    expect(() => checkLeanDirectSourceOnly(process.cwd())).toThrow(/LEAN_DIRECT_DESTINATION_EXISTS/u)
  })
  it("permits only authenticated successor lock residue", () => {
    expect(() => assertLeanStatus(`?? .v138-successor-${"a".repeat(64)}.lock\n`)).not.toThrow()
    expect(() => assertLeanStatus(" M scripts/example.ts\n")).toThrow(/LEAN_WORKTREE_DIRTY/u)
    expect(() => assertLeanStatus("?? unexpected.txt\n")).toThrow(/LEAN_WORKTREE_DIRTY/u)
  })

  it("fails corrective admission on tracked drift and permits only stage-exact operational residue", () => {
    const lock = `.v138-successor-${"a".repeat(64)}.lock`
    expect(() => assertLeanCorrectiveAdmissionStatus(`?? ${lock}\n`, [])).not.toThrow()
    expect(() => assertLeanCorrectiveAdmissionStatus(
      `?? ${lock}\n?? .planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json\n`,
      [".planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json"],
    )).not.toThrow()
    expect(() => assertLeanCorrectiveAdmissionStatus(" M scripts/run-v1-38-lean-runner-feasibility.ts\n", [])).toThrow(/LEAN_WORKTREE_DIRTY/u)
    expect(() => assertLeanCorrectiveAdmissionStatus("?? .planning/artifacts/v1.38-lean-runner-corrective-terminal-v2.json\n", [])).toThrow(/LEAN_WORKTREE_DIRTY/u)
  })

  it("rejects either pre-existing fresh corrective effect before launch", () => {
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(false, false)).not.toThrow()
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(true, false)).toThrow(/LEAN_CORRECTIVE_INVOCATION_EXISTS/u)
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(false, true)).toThrow(/LEAN_CORRECTIVE_TERMINAL_EXISTS/u)
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(true, true)).toThrow()
  })

  it("renders and checks exact committed source without effects", () => {
    const repoRoot = process.cwd()
    const sourceCommit = process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD"
    const manifest = renderLeanManifest(repoRoot, sourceCommit)
    expect(manifest.authority.phase263PlanningAuthorized).toBe(false)
    expect(manifest.formationMaterialized).toBe(false)
    expect(() => checkLeanManifest(repoRoot, manifest)).not.toThrow()
    expect(() => checkLeanManifest(repoRoot, { ...manifest, scheduleRoot: `sha256:${"0".repeat(64)}` })).toThrow()
    expect(() => checkLeanManifest(repoRoot, {
      ...manifest,
      source: {
        ...manifest.source,
        executableBlobs: { ...manifest.source.executableBlobs, "packages/spec/src": "0".repeat(40) },
      },
    })).toThrow(/LEAN_SOURCE_BLOB_DRIFT/u)
  }, 30_000)

  it("does not create invocation, terminal, readiness, or adjudication artifacts", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "lean-check-")); temporary.push(dir)
    expect(() => renderLeanManifest(dir, "HEAD")).toThrow()
  })

  it("uses the one canonical Plan 150-152 path map and full minimum closure", () => {
    expect(LEAN_ARTIFACT_PATHS.terminal).toBe(".planning/artifacts/v1.38-lean-runner-terminal.json")
    expect(LEAN_ARTIFACT_PATHS.sourceReview).toBe(".planning/artifacts/v1.38-lean-runner-source-review-v3.json")
    expect(LEAN_ARTIFACT_PATHS.readiness).toBe(".planning/artifacts/v1.38-lean-runner-readiness-v3.json")
    expect(LEAN_ARTIFACT_PATHS.adjudication).toBe(".planning/artifacts/v1.38-lean-runner-adjudication-v1.json")
    expect(LEAN_ARTIFACT_PATHS.eligibility).toBe(".planning/artifacts/v1.38-phase-262-lean-eligibility-v1.json")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("apps/runtime-service/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/engine/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/spec/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/persistence/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("pnpm-lock.yaml")
  })

  it("binds corrective destinations without reviving first-attempt paths", () => {
    expect(LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation).toBe(".planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json")
    expect(LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal).toBe(".planning/artifacts/v1.38-lean-runner-corrective-terminal-v2.json")
    expect(Object.values(LEAN_CORRECTIVE_ARTIFACT_PATHS)).not.toContain(LEAN_ARTIFACT_PATHS.invocation)
    expect(Object.values(LEAN_CORRECTIVE_ARTIFACT_PATHS)).not.toContain(LEAN_ARTIFACT_PATHS.terminal)
  })

  it("keeps failed v1/v2/v3/v4 trust paths historical and admits only fresh v5", () => {
    expect(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest).toMatch(/manifest-v2\.json$/u)
    expect(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.readiness).toMatch(/readiness-v2\.json$/u)
    expect(LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest).toMatch(/manifest-v3\.json$/u)
    expect(LEAN_CORRECTIVE_ARTIFACT_PATHS.manifest).toBe(LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.manifest)
    const manifestV2 = checkLeanCorrectiveManifestV2(process.cwd(), JSON.parse(readFileSync(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest, "utf8")))
    const reviewV2 = JSON.parse(readFileSync(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview, "utf8"))
    expect(checkLeanCorrectiveSourceReviewV2(manifestV2, reviewV2).findingCount).toBe(2)
    expect(checkLeanCorrectiveReviewOutcomeV2(manifestV2, reviewV2, undefined)).toBeUndefined()
    expect(() => checkLeanCorrectiveReviewOutcomeV2(manifestV2, reviewV2, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v2" })).toThrow(/NONZERO_REVIEW/u)

    const manifestV3 = renderLeanCorrectiveManifestV3(process.cwd(), "HEAD")
    const reviewV3 = renderLeanCorrectiveSourceReviewV3(manifestV3, [])
    const readinessV3 = renderLeanCorrectiveReadinessV3(manifestV3, reviewV3)
    expect(checkLeanCorrectiveReadinessV3(manifestV3, reviewV3, readinessV3)).toEqual(readinessV3)
    expect(() => checkLeanCorrectiveReadinessV3(manifestV3, reviewV2, readinessV3)).toThrow()
    expect(() => checkLeanCorrectiveReadinessV3(manifestV3, { ...reviewV3, findingCount: 1 }, readinessV3)).toThrow()
  }, 30_000)

  it("rejects mutation of every v2 predecessor contract leaf", () => {
    const original = JSON.parse(readFileSync(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest, "utf8")) as Record<string, unknown>
    const leaves: Array<readonly (string | number)[]> = []
    const collect = (value: unknown, trail: readonly (string | number)[]): void => {
      if (value !== null && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) collect(child, [...trail, Array.isArray(value) ? Number(key) : key])
      } else leaves.push(trail)
    }
    collect(original, [])
    expect(leaves.length).toBeGreaterThan(50)
    for (const trail of leaves) {
      const mutated = structuredClone(original) as Record<string, unknown>
      let owner: Record<string | number, unknown> = mutated
      for (const key of trail.slice(0, -1)) owner = owner[key] as Record<string | number, unknown>
      const key = trail.at(-1)!
      const current = owner[key]
      owner[key] = typeof current === "boolean" ? !current : typeof current === "number" ? current + 1 : `${String(current)}-mutated`
      expect(() => checkLeanCorrectiveManifestV2(process.cwd(), mutated), trail.join(".")).toThrow()
    }
  }, 60_000)

  it("binds Plan 165 summary and derives v4 effect presence from disk", () => {
    const manifest = renderLeanCorrectiveManifestV4(process.cwd(), "HEAD")
    expect(manifest.plan165Summary).toEqual({
      commit: "18251a883e77b3a7b0845074faae4d8365ab84d5",
      blob: "96fecf67546c3c5b9eaa0a72901fbe3f6978b3c4",
      contentRoot: "sha256:4407a2284cfd1086bb67b7de497424156983a6dedec9684f288069e1ea8788c4",
    })
    expect(Object.values(manifest.freshCorrectiveEffects)).toEqual([false, false, false, false, false, false])
    const review = renderLeanCorrectiveSourceReviewV4(manifest, [])
    const readiness = renderLeanCorrectiveReadinessV4(manifest, review)
    expect(checkLeanCorrectiveReadinessV4(manifest, review, readiness)).toEqual(readiness)
    expect(LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.readiness).toMatch(/readiness-v4\.json$/u)

    const dir = mkdtempSync(path.join(tmpdir(), "lean-effects-")); temporary.push(dir)
    expect(deriveLeanCorrectiveFreshEffects(dir)).toEqual({
      readinessV4Present: false, invocationV2Present: false, terminalV2Present: false,
      adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
    })
    const target = path.resolve(dir, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)
    const parent = path.dirname(target)
    mkdirSync(parent, { recursive: true })
    writeFileSync(target, "{}\n")
    expect(deriveLeanCorrectiveFreshEffects(dir).invocationV2Present).toBe(true)
  }, 30_000)

  it("prepares only the additive v5 review-outcome trust contract", () => {
    const manifest = renderLeanCorrectiveManifestV5(process.cwd(), "HEAD")
    expect(manifest.schemaVersion).toBe("v1.38-lean-runner-corrective-source-manifest-v5")
    expect(manifest.predecessorRoots.failedManifestV4Root).toBe(hashLeanValue(JSON.parse(readFileSync(LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.manifest, "utf8"))))
    expect(manifest.predecessorRoots.failedReviewV4Root).toBe(hashLeanValue(JSON.parse(readFileSync(LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.sourceReview, "utf8"))))
    expect(Object.values(manifest.freshCorrectiveEffects)).toEqual([false, false, false, false, false, false])
    expect(deriveLeanCorrectiveFreshEffectsV5(process.cwd()).readinessV5Present).toBe(false)

    const passingReview = renderLeanCorrectiveSourceReviewV5(manifest, [])
    const readiness = renderLeanCorrectiveReadinessV5(manifest, passingReview)
    expect(checkLeanCorrectiveReadinessV5(manifest, passingReview, readiness)).toEqual(readiness)
    expect(checkLeanCorrectiveReviewOutcomeV5(manifest, passingReview, readiness)).toEqual(readiness)
    expect(() => checkLeanCorrectiveReviewOutcomeV5(manifest, passingReview, undefined)).toThrow(/READINESS_REQUIRED/u)

    const failedReview = renderLeanCorrectiveSourceReviewV5(manifest, [{ id: "CR-test", severity: "critical", status: "open", summary: "synthetic" }])
    expect(checkLeanCorrectiveReviewOutcomeV5(manifest, failedReview, undefined)).toBeUndefined()
    expect(() => checkLeanCorrectiveReviewOutcomeV5(manifest, failedReview, readiness)).toThrow(/READINESS_FORBIDDEN/u)
    expect(LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.readiness).toMatch(/readiness-v5\.json$/u)
  }, 30_000)

  it("accepts only epistemically limited diagnostic custody", () => {
    const custody = JSON.parse(readFileSync(".planning/artifacts/v1.38-lean-runner-diagnostic-custody-v1.json", "utf8"))
    expect(validateLeanDiagnosticCustody(custody)).toEqual(custody)
    for (const mutation of [
      { rawEvidencePresent: true }, { independentlyVerifiable: true }, { persisted: true },
      { liveInvocation: true }, { charged: true }, { evidenceAdmissible: true },
      { outcomes: [] },
    ]) expect(() => validateLeanDiagnosticCustody({ ...custody, ...mutation })).toThrow(/LEAN_DIAGNOSTIC_CUSTODY/u)
  })

  it.skip("historical recovery proof remains preserved but is outside the active D-34L.1 graph", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker)).not.toThrow()
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(
      source.replace(
        "cleanup: async () => { await leanAdmissionRecovery.recoverLeanCorrectiveOrphan(repoRoot) }",
        "cleanup: async () => { fork(); await leanAdmissionRecovery.recoverLeanCorrectiveOrphan(repoRoot) }",
      ),
      checker,
    )).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { buildLeanSchedule();",
    ))).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    const transitiveChecker = checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "const unsafeRecoveryHop = (): void => { buildLeanSchedule() }\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { unsafeRecoveryHop();",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, transitiveChecker)).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    const computedCallback = source.replace(
      "cleanup: async () => { await leanAdmissionRecovery.recoverLeanCorrectiveOrphan(repoRoot) }",
      "cleanup: async () => { const recover = leanAdmissionRecovery.recoverLeanCorrectiveOrphan; await recover(repoRoot) }",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(computedCallback, checker)).toThrow(/LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL/u)

    const importedChecker = checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "import { firstHop as importedFirstHop } from './recovery-hop.js'\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { importedFirstHop();",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, importedChecker, {
      "./recovery-hop.js": "export { secondHop as firstHop } from './recovery-second.js'",
      "./recovery-second.js": "import * as lean from './lib/v1-38-lean-runner-feasibility.js'; export const secondHop = () => { const callback = () => lean.buildLeanSchedule(); callback() }",
      "./lib/v1-38-lean-runner-feasibility.js": readFileSync("scripts/lib/v1-38-lean-runner-feasibility.ts", "utf8"),
    })).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, importedChecker, {})).toThrow(/LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL/u)
  })

  it.skip("historical recovery rejects the exact CR-168-01 function-declaration bypass", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8").replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "function unsafeRecoveryHop(): void { buildLeanSchedule() }\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { unsafeRecoveryHop();",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker)).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
  })

  it.skip("historical recovery traverses declaration, expression, arrow, alias, import, and re-export call shapes", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    const inject = (declarations: string, call: string): string => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      `${declarations}\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { ${call};`,
    )
    for (const [declaration, call] of [
      ["function safeHop(): void { String('safe') }", "safeHop()"],
      ["const safeHop = value => { String(value) }", "safeHop(repoRoot)"],
      ["let safeHop = function (): void { String('safe') }", "safeHop()"],
      ["const actualHop = (): void => { String('safe') }; const safeHop = actualHop", "safeHop()"],
    ] as const) expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, inject(declaration, call))).not.toThrow()

    const imported = inject("import defaultHop, { namedHop as aliasHop } from './safe-hop.js'", "defaultHop(); aliasHop()")
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, imported, {
      "./safe-hop.js": "export default function (): void { String('safe') }; export { safeHop as namedHop } from './safe-second.js'",
      "./safe-second.js": "export const safeHop = function (): void { String('safe') }",
    })).not.toThrow()

    const unsafeImported = inject("import defaultHop from './unsafe-hop.js'", "defaultHop()")
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, unsafeImported, {
      "./unsafe-hop.js": "export { unsafeHop as default } from './unsafe-second.js'",
      "./unsafe-second.js": "export function unsafeHop(): void { buildLeanSchedule() }",
    })).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
  })

  it.skip("historical recovery fails closed for unresolved and unsupported reachable call shapes", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    const mutate = (declaration: string, call = "unsafeHop()"): string => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      `${declaration}\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { ${call};`,
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate("", "unknownBare()"))).toThrow(/UNRESOLVED_CALL/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate("function unsafeHop(): void { unknownLater() }"))).toThrow(/UNRESOLVED_CALL/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate("function unsafeHop(): void { danger.launch() }"))).toThrow(/UNRESOLVED_CALL/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate("function unsafeHop(): void { new Worker() }"))).toThrow(/NEW_EXPRESSION/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate("import { unsafeHop } from 'external-package'"))).toThrow(/EXTERNAL_CALL/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate("function unsafeHop(: void { String('bad') }"))).toThrow(/PARSE_ERROR/u)
  })

  it.skip("historical recovery follows callbacks and enforces exact process capabilities", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    for (const [before, after] of [
      ["cleanup: async () => { await leanAdmissionRecovery.recoverLeanCorrectiveOrphan(repoRoot) }", "cleanup: async () => { buildLeanSchedule(); await leanAdmissionRecovery.recoverLeanCorrectiveOrphan(repoRoot) }"],
      ["terminalizeInvalid: async () => { leanAdmissionRecovery.terminalizeLeanCorrectiveInterruption(repoRoot) }", "terminalizeInvalid: async () => { buildLeanSchedule(); leanAdmissionRecovery.terminalizeLeanCorrectiveInterruption(repoRoot) }"],
      ["postcheck: async () => { leanAdmissionRecovery.checkLeanCorrectiveRecoveryTerminal(repoRoot) }", "postcheck: async () => { buildLeanSchedule(); leanAdmissionRecovery.checkLeanCorrectiveRecoveryTerminal(repoRoot) }"],
    ] as const) expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source.replace(before, after), checker)).toThrow(/LAUNCH_CAPABILITY/u)

    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker.replace(
      'execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" })',
      'execFileSync("sh", ["-p", String(pid), "-o", "command="], { encoding: "utf8" })',
    ))).toThrow(/EXEC_POLICY/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker.replace(
      "process.kill(-processGroupId, signal)",
      'process.kill(-processGroupId, "SIGUSR1")',
    ))).toThrow(/SIGNAL_POLICY/u)
  })

  it("CR-170-01 binds the separately committed Plan 169 summary in corrective v6 lineage", () => {
    const manifest = renderLeanCorrectiveManifestV6(process.cwd(), "HEAD")
    expect(manifest.plan169Summary).toEqual({
      commit: "c33111d565cd7ebfb824270d67a71f71e536539a",
      blob: "8b4bab02e1e3262e32d0c5efcde9c58f509073ef",
      contentRoot: "sha256:b24af58afb224715eb2e40bedef0150f761e1b7b04687c9346e256e77b79a65b",
    })
    expect(manifest.predecessorRoots.failedManifestV5Root).toBe(hashLeanValue(JSON.parse(readFileSync(LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.manifest, "utf8"))))
    expect(manifest.predecessorRoots.failedReviewV5Root).toBe(hashLeanValue(JSON.parse(readFileSync(LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.sourceReview, "utf8"))))
    expect(Object.values(manifest.freshCorrectiveEffects)).toEqual([false, false, false, false, false, false])
    expect(Object.values(deriveLeanCorrectiveFreshEffectsV6(process.cwd()))).toEqual([false, false, false, false, false, false])
    const review = renderLeanCorrectiveSourceReviewV6(manifest, [])
    const readiness = renderLeanCorrectiveReadinessV6(manifest, review)
    expect(checkLeanCorrectiveReadinessV6(manifest, review, readiness)).toEqual(readiness)
    expect(checkLeanCorrectiveReviewOutcomeV6(manifest, review, readiness)).toEqual(readiness)
    expect(() => checkLeanCorrectiveReviewOutcomeV6(manifest, review, undefined)).toThrow(/READINESS_REQUIRED/u)
    expect(() => checkLeanCorrectiveManifestV6(process.cwd(), { ...manifest, plan169Summary: { ...manifest.plan169Summary, blob: "0".repeat(40) } })).toThrow(/MANIFEST_V6_DRIFT/u)
    expect(() => checkLeanCorrectiveManifestV6(process.cwd(), { ...manifest, predecessorRoots: { ...manifest.predecessorRoots, failedReviewV5Root: `sha256:${"0".repeat(64)}` } })).toThrow(/MANIFEST_V6_DRIFT/u)
    expect(() => checkLeanCorrectiveSourceOnlyV6(process.cwd())).toThrow(/LEAN_CORRECTIVE_V6_DESTINATION_EXISTS/u)
  }, 30_000)

  it.skip.each([
    ["destructive git vector through a local alias", (checker: string) => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      'export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { const args = ["clean", "-fdx"]; git(repoRoot, args);',
    )],
    ["alternate process signal through parameters", (checker: string) => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      'function unsafeSignal(processGroupId: number, signal: "SIGUSR1"): void { process.kill(-processGroupId, signal) }\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { unsafeSignal(4312, "SIGUSR1");',
    )],
    ["noncanonical unlink target", (checker: string) => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      'export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { unlinkSync(path.resolve(repoRoot, "package.json"));',
    )],
    ["extra process-list argument", (checker: string) => checker.replace(
      'execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" })',
      'execFileSync("ps", ["-p", String(pid), "-o", "command=", "-ww"], { encoding: "utf8" })',
    )],
    ["wrong process-list options", (checker: string) => checker.replace(
      'execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" })',
      'execFileSync("ps", ["-p", String(pid), "-o", "command="], { shell: true })',
    )],
    ["wrong exec arity through an argument alias", (checker: string) => checker.replace(
      "const git = (repoRoot: string, args: readonly string[]): string => execFileSync(\"git\", args, { cwd: repoRoot, encoding: \"utf8\", stdio: [\"ignore\", \"pipe\", \"pipe\"] }).trim()",
      'const git = (repoRoot: string, args: readonly string[]): string => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }, "extra").trim()',
    )],
  ])("CR-170-02 rejects %s", (_name, mutate) => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate(checker))).toThrow(/LEAN_CORRECTIVE_RECOVERY_(?:EXEC|SIGNAL|CAPABILITY)_POLICY/u)
  })

  it.skip.each([
    ["local map method", (checker: string) => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      'export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { const local = { map: () => buildLeanSchedule() }; local.map();',
    )],
    ["shadowed JSON.parse", (checker: string) => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      'export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { const JSON = { parse: () => buildLeanSchedule() }; JSON.parse();',
    )],
    ["shadowed TypeError", (checker: string) => checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      'export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { const TypeError = function (): void { buildLeanSchedule() }; new TypeError();',
    )],
    ["readFileSync from an unaudited module", (checker: string) => checker.replace(
      'import { closeSync, constants, existsSync, fsyncSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs"',
      'import { closeSync, constants, existsSync, fsyncSync, openSync, unlinkSync, writeSync } from "node:fs"\nimport { readFileSync } from "not-node-fs"',
    )],
  ])("CR-170-03 rejects %s", (_name, mutate) => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, mutate(checker))).toThrow()
  })

  it.skip.each([
    ["function before alias", "function colliding(): void { String('safe') }\nconst colliding = safeHop", "colliding()"],
    ["alias before function", "const colliding = safeHop\nfunction colliding(): void { String('safe') }", "colliding()"],
    ["function before import", "function colliding(): void { String('safe') }\nimport { readFileSync as colliding } from 'node:fs'", "colliding('x')"],
    ["import before function", "import { readFileSync as colliding } from 'node:fs'\nfunction colliding(): void { String('safe') }", "colliding('x')"],
    ["function before re-export", "function colliding(): void { String('safe') }\nexport { safeHop as colliding } from './safe-hop.js'", "colliding()"],
    ["re-export before function", "export { safeHop as colliding } from './safe-hop.js'\nfunction colliding(): void { String('safe') }", "colliding()"],
    ["namespace before function", "import * as colliding from './safe-hop.js'\nfunction colliding(): void { String('safe') }", "colliding()"],
    ["function before namespace", "function colliding(): void { String('safe') }\nimport * as colliding from './safe-hop.js'", "colliding()"],
    ["lexical duplicate", "function outer(): void { const colliding = (): void => { String('safe') }; const colliding = (): void => { buildLeanSchedule() }; colliding() }", "outer()"],
    ["rebound after declaration", "let colliding = (): void => { String('safe') }; colliding = (): void => { buildLeanSchedule() }", "colliding()"],
  ])("WR-170-01 rejects %s regardless of registration priority", (_name, declarations, call) => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8").replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      `${declarations}\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { ${call};`,
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker, {
      "./safe-hop.js": "export const safeHop = (): void => { String('safe') }",
    })).toThrow(/LEAN_CORRECTIVE_RECOVERY_(?:AMBIGUOUS_BINDING|REBINDING)/u)
  })

  it("uses a schedule-free exact interruption tombstone", () => {
    const invocation = {
      schemaVersion: "v1.38-lean-runner-corrective-invocation-v2", sourceCommit: "a".repeat(40),
      manifestRoot: "sha256:" + "1".repeat(64), sourceReviewRoot: "sha256:" + "2".repeat(64),
      readinessRoot: "sha256:" + "3".repeat(64), firstInvocationRoot: "sha256:" + "4".repeat(64),
      firstTerminalRoot: "sha256:" + "5".repeat(64), diagnosticCustodyRoot: "sha256:" + "6".repeat(64),
      childCapabilityRoot: "sha256:" + "7".repeat(64), claimClass: "fixture_feasibility_only",
      correctiveInvocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE,
    } as const
    const tombstone = createLeanCorrectiveInterruptionTombstone(invocation)
    expect(validateLeanCorrectiveInterruptionTombstone(tombstone, invocation)).toEqual(tombstone)
    expect(JSON.stringify(tombstone)).not.toMatch(/cellId|schedule|evidence/u)
    expect(() => validateLeanCorrectiveInterruptionTombstone({ ...tombstone, chargedMatches: 1 }, invocation)).toThrow()
  })

  it("strictly binds corrective child ownership to invocation, process group, selector, and token", () => {
    const ownership = createLeanCorrectiveChildOwnership(
      "sha256:" + "1".repeat(64),
      4312,
      4312,
      "b".repeat(64),
    )
    expect(LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH).toBe(".v138-lean-corrective-child-ownership.json")
    expect(validateLeanCorrectiveChildOwnership(ownership)).toEqual(ownership)
    for (const mutation of [
      { childPid: 0 },
      { processGroupId: 4313 },
      { selector: "--run-reviewed-corrective-gate" },
      { token: "short" },
      { commandArguments: ["--execute-reviewed-cell"] },
    ]) expect(() => validateLeanCorrectiveChildOwnership({ ...ownership, ...mutation })).toThrow(/LEAN_CORRECTIVE_CHILD_OWNERSHIP/u)
  })

  it("terminates only an authenticated active orphan and proves exit", async () => {
    const ownership = createLeanCorrectiveChildOwnership(
      "sha256:" + "1".repeat(64), 4312, 4312, "b".repeat(64),
    )
    const signals: string[] = []
    let alive = true
    await recoverLeanCorrectiveOrphanInjected(ownership, {
      expectedInvocationRoot: ownership.invocationRoot,
      commandForPid: () => `node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell ${ownership.token}`,
      processGroupForPid: () => ownership.processGroupId,
      signalProcessGroup: (_group, signal) => { signals.push(signal); alive = false },
      processIsAlive: () => alive,
      wait: async () => undefined,
    })
    expect(signals).toEqual(["SIGTERM"])

    await expect(recoverLeanCorrectiveOrphanInjected(ownership, {
      expectedInvocationRoot: "sha256:" + "2".repeat(64),
      commandForPid: () => `node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell ${ownership.token}`,
      processGroupForPid: () => ownership.processGroupId,
      signalProcessGroup: (_group, signal) => { signals.push(signal) },
      processIsAlive: () => true,
      wait: async () => undefined,
    })).rejects.toThrow(/LEAN_CORRECTIVE_CHILD_IDENTITY/u)
    expect(signals).toEqual(["SIGTERM"])

    for (const command of ["", `node other.ts --execute-reviewed-cell ${ownership.token}`, "node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell wrong"]) {
      const rejectedSignals: string[] = []
      await expect(recoverLeanCorrectiveOrphanInjected(ownership, {
        expectedInvocationRoot: ownership.invocationRoot,
        commandForPid: () => command,
        processGroupForPid: () => ownership.processGroupId,
        signalProcessGroup: (_group, signal) => { rejectedSignals.push(signal) },
        processIsAlive: () => true,
        wait: async () => undefined,
      })).rejects.toThrow(/LEAN_CORRECTIVE_CHILD_(?:STALE|IDENTITY)/u)
      expect(rejectedSignals).toEqual([])
    }

    const groupSignals: string[] = []
    await expect(recoverLeanCorrectiveOrphanInjected(ownership, {
      expectedInvocationRoot: ownership.invocationRoot,
      commandForPid: () => `node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell ${ownership.token}`,
      processGroupForPid: () => ownership.processGroupId + 1,
      signalProcessGroup: (_group, signal) => { groupSignals.push(signal) },
      processIsAlive: () => true,
      wait: async () => undefined,
    })).rejects.toThrow(/LEAN_CORRECTIVE_CHILD_IDENTITY/u)
    expect(groupSignals).toEqual([])
  })

  it("requires literal-zero non-authorizing review before readiness", () => {
    const manifest = renderLeanManifest(process.cwd(), process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD")
    const review = renderLeanSourceReviewV3(manifest, [])
    expect(() => checkLeanSourceReview(manifest, review)).not.toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1 })).toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, extra: true })).toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1, findings: [{ diagnostics: "private" }] })).toThrow(/LEAN_PRIVATE_DATA/u)
    const readiness = renderLeanReadinessV3(manifest, review)
    expect(() => checkLeanReadiness(manifest, review, readiness)).not.toThrow()
    expect(() => checkLeanReadiness(manifest, review, { ...readiness, extra: true })).toThrow()
    expect(checkLeanReviewOutcome(manifest, review, readiness)).toEqual(readiness)
    const blocked = renderLeanSourceReviewV3(manifest, [{ id: "B1", severity: "critical", status: "open", summary: "still open" }])
    expect(checkLeanReviewOutcome(manifest, blocked, undefined)).toBeUndefined()
    expect(() => checkLeanReviewOutcome(manifest, blocked, readiness)).toThrow(/LEAN_READINESS_FOR_NONZERO_REVIEW/u)
    expect(() => renderLeanSourceReviewV3(manifest, [
      { id: "", severity: "warning", status: "open", summary: "empty identifier" },
    ])).toThrow(/LEAN_SOURCE_REVIEW_INVALID/u)
    expect(() => renderLeanSourceReviewV3(manifest, [
      { id: "CR-DUPLICATE", severity: "critical", status: "open", summary: "first" },
      { id: "CR-DUPLICATE", severity: "warning", status: "open", summary: "second" },
    ])).toThrow(/LEAN_SOURCE_REVIEW_INVALID/u)
  })

  it("authenticates the immutable Plan 150 v1 review bytes", () => {
    const checkHistorical = (leanAdmissionModule as unknown as {
      checkHistoricalLeanSourceReviewBytes: (bytes: Buffer) => void
    }).checkHistoricalLeanSourceReviewBytes
    expect(() => checkHistorical(Buffer.from("mutated historical review", "utf8"))).toThrow(/LEAN_HISTORICAL_SOURCE_REVIEW_DRIFT/u)
  })

  it("authenticates immutable Plan 154 v2 review bytes", () => {
    const checkHistoricalV2 = (leanAdmissionModule as unknown as {
      checkHistoricalLeanSourceReviewV2Bytes: (bytes: Buffer) => void
    }).checkHistoricalLeanSourceReviewV2Bytes
    expect(() => checkHistoricalV2(Buffer.from("mutated v2 review", "utf8"))).toThrow(/LEAN_HISTORICAL_SOURCE_REVIEW_V2_DRIFT/u)
  })

  it("selects one structural current branch and ignores historical prose", () => {
    const authority = Object.fromEntries(Object.keys(LEAN_AUTHORITY_FALSE).map((key) => [key, key === "phase263PlanningAuthorized" || key === "phase263ExecutionAuthorized"]))
    const eligibility = {
      schemaVersion: "v1.38-phase-262-lean-eligibility-v1",
      adjudicationRoot: "sha256:" + "a".repeat(64),
      admit03: "satisfied_under_revised_contract",
      phase262Complete: true,
      phase263PlanningEligible: true,
      phase263ExecutionEligible: true,
      authority,
    } as const
    const requirement = "- [x] **ADMIT-03**: satisfied_under_revised_contract; historical prose says blocked."
    expect(parseLeanTrackingSurface(".planning/REQUIREMENTS.md", requirement)).toEqual({ admit03: "satisfied_under_revised_contract" })
    expect(() => parseLeanTrackingSurface(".planning/REQUIREMENTS.md", `${requirement}\n${requirement}`)).toThrow(/LEAN_TRACKING_AMBIGUOUS/u)
    for (const trackingPath of [".planning/ROADMAP.md", ".planning/STATE.md", ".planning/v1.38-CURRENT-STATUS.md", ".planning/v1.38-v1.38-MILESTONE-AUDIT.md"] as const) {
      const carrier = renderLeanTrackingCarrier(trackingPath, eligibility)
      expect(parseLeanTrackingSurface(trackingPath, `Historical ADMIT-03 blocked.\n${carrier}`)).toEqual(expect.objectContaining({
        admit03: "satisfied_under_revised_contract", phase262Complete: true,
      }))
      expect(() => parseLeanTrackingSurface(trackingPath, `${carrier}\n${carrier}`)).toThrow(/LEAN_TRACKING_AMBIGUOUS/u)
      expect(() => parseLeanTrackingSurface(trackingPath, carrier.replace('"phase262Complete":true', '"phase262Complete":false'))).toThrow()
    }
  })

  it("strictly links invocation, terminal, adjudication, and eligibility roots", () => {
    const lineage = {
      sourceCommit: "a".repeat(40), manifestRoot: "sha256:" + "1".repeat(64),
      sourceReviewRoot: "sha256:" + "2".repeat(64), readinessRoot: "sha256:" + "3".repeat(64),
      childCapabilityRoot: "sha256:" + "4".repeat(64),
    } as const
    const invocation = validateLeanInvocation({
      schemaVersion: "v1.38-lean-runner-invocation-v1", ...lineage,
      claimClass: "fixture_feasibility_only", liveInvocationOrdinal: 1,
      authority: Object.fromEntries(Object.keys(LEAN_AUTHORITY_FALSE).map((key) => [key, false])),
    })
    const terminal = validateLeanTerminalArtifact({
      schemaVersion: "v1.38-lean-runner-terminal-v1",
      sourceCommit: lineage.sourceCommit,
      manifestRoot: lineage.manifestRoot,
      sourceReviewRoot: lineage.sourceReviewRoot,
      readinessRoot: lineage.readinessRoot,
      childCapabilityRoot: lineage.childCapabilityRoot,
      invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only",
      terminal: createLeanInterruptedTerminal(), authority: LEAN_AUTHORITY_FALSE,
    }, invocation)
    const adjudication = validateLeanAdjudication({
      schemaVersion: "v1.38-lean-runner-adjudication-v1",
      terminalRoot: hashLeanValue(terminal), reviewedResult: "invalid",
      findingCount: 0, findings: [], admitsEligibility: false,
      authority: LEAN_AUTHORITY_FALSE,
    }, terminal)
    expect(() => validateLeanEligibility({
      schemaVersion: "v1.38-phase-262-lean-eligibility-v1",
      adjudicationRoot: hashLeanValue(adjudication), admit03: "blocked",
      phase262Complete: false, phase263PlanningEligible: false,
      phase263ExecutionEligible: false, authority: LEAN_AUTHORITY_FALSE,
    }, adjudication)).not.toThrow()
  })

  it("rejects every invocation root that does not join the reviewed readiness chain", () => {
    const manifest = renderLeanManifest(process.cwd(), process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD")
    const review = checkLeanSourceReview(manifest, {
      schemaVersion: "v1.38-lean-runner-source-review-v3",
      sourceCommit: manifest.source.commit,
      manifestRoot: hashLeanValue(manifest),
      findingCount: 0,
      findings: [],
      admitsExecution: false,
      authority: LEAN_AUTHORITY_FALSE,
    })
    const readiness = checkLeanReadiness(manifest, review, {
      schemaVersion: "v1.38-lean-runner-readiness-v3",
      sourceCommit: manifest.source.commit,
      manifestRoot: hashLeanValue(manifest),
      sourceReviewRoot: hashLeanValue(review),
      findingCount: 0,
      plan151Eligible: true,
      liveInvocationLimit: 1,
      liveInvocationsConsumed: 0,
      correctiveRerunAuthorized: false,
      authority: LEAN_AUTHORITY_FALSE,
    })
    const invocation = {
      schemaVersion: "v1.38-lean-runner-invocation-v1",
      sourceCommit: readiness.sourceCommit,
      manifestRoot: readiness.manifestRoot,
      sourceReviewRoot: readiness.sourceReviewRoot,
      readinessRoot: hashLeanValue(readiness),
      childCapabilityRoot: "sha256:" + "4".repeat(64),
      claimClass: "fixture_feasibility_only",
      liveInvocationOrdinal: 1,
      authority: LEAN_AUTHORITY_FALSE,
    } as const
    expect(validateLeanInvocationLineage(readiness, invocation)).toEqual(invocation)
    for (const key of ["sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot"] as const) {
      const forged = { ...invocation, [key]: key === "sourceCommit" ? "f".repeat(40) : "sha256:" + "f".repeat(64) }
      expect(() => validateLeanInvocationLineage(readiness, forged)).toThrow(/LEAN_INVOCATION_LINEAGE_MISMATCH/u)
    }
  })

  it("does not allow a claimed pass to escalate eligibility when evidence rederives non-pass", () => {
    const lineage = {
      sourceCommit: "a".repeat(40), manifestRoot: "sha256:" + "1".repeat(64),
      sourceReviewRoot: "sha256:" + "2".repeat(64), readinessRoot: "sha256:" + "3".repeat(64),
      childCapabilityRoot: "sha256:" + "4".repeat(64),
    } as const
    const invocation = validateLeanInvocation({
      schemaVersion: "v1.38-lean-runner-invocation-v1", ...lineage,
      claimClass: "fixture_feasibility_only", liveInvocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE,
    })
    const derived = passingTerminal()
    const forged = { ...derived, result: "pass", evidence: derived.evidence.map((cell, index) => index === 0 ? {
      ...cell, classification: "system_failure", outcomeRoot: undefined, finalStateRoot: undefined,
      transitionEventRoot: undefined, runtimeAccountingRoot: undefined,
    } : cell) }
    expect(() => validateLeanTerminalArtifact({
      schemaVersion: "v1.38-lean-runner-terminal-v1", ...lineage,
      invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only",
      terminal: forged, authority: LEAN_AUTHORITY_FALSE,
    }, invocation)).toThrow()
  })
})
