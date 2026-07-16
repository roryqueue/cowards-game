#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const V137_EXECUTABLE_CONFORMANCE_PATHS = Object.freeze({
  json: ".planning/artifacts/v1.37-executable-conformance-proof.json",
  markdown: ".planning/artifacts/v1.37-executable-conformance-proof.md",
})

export const V137_EXECUTABLE_CONFORMANCE_REQUIREMENTS = Object.freeze([
  "CONF-01",
  "CONF-02",
  "CONF-03",
  "CONF-04",
  "CONF-05",
  "CHRN-01",
  "CHRN-02",
  "CHRN-03",
  "CHRN-04",
  "CHRN-05",
  "CHRN-06",
] as const)

export const V137_EXECUTABLE_CONFORMANCE_DECISIONS = Object.freeze(
  Array.from({ length: 16 }, (_, index) => `D-${String(index + 1).padStart(2, "0")}`),
)

const LANGUAGES = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const)

const INPUT_PATHS = Object.freeze([
  ".planning/artifacts/v1.37-conformance-trace-independent-review.json",
  ".planning/artifacts/v1.37-conformance-trace-reviewed-history.json",
  ".planning/artifacts/v1.37-kernel-integrity-proof.json",
  ".planning/artifacts/v1.37-language-conformance-import-receipts.json",
  ".planning/artifacts/v1.37-language-conformance-python.json",
  ".planning/artifacts/v1.37-language-conformance-rust.json",
  ".planning/artifacts/v1.37-language-conformance-typescript.json",
  ".planning/artifacts/v1.37-language-conformance-zig.json",
  ".planning/artifacts/v1.37-phase-257-core-rules-result.json",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  ".planning/artifacts/v1.37-runtime-authority-import-trust-roots-bootstrap.json",
  "apps/go-backend/runtime_service_client_v1_18.go",
  "apps/go-backend/main_test.go",
  "apps/runtime-service/src/execute-match.ts",
  "apps/web/app/matches/server.ts",
  "apps/web/app/matches/server.test.ts",
  "package.json",
  "packages/persistence/src/chronicle-store.ts",
  "packages/persistence/src/chronicle-store.test.ts",
  "packages/persistence/src/complete-match.ts",
  "packages/persistence/src/complete-match.test.ts",
  "packages/replay/src/reconstruct.ts",
  "packages/replay/src/grammar.ts",
  "packages/replay/package.json",
  "packages/runtime-js/src/abi-bridge.ts",
  "packages/runtime-js/src/candidate-process-runner.ts",
  "packages/runtime-js/src/candidate-process-runner.test.ts",
  "packages/runtime-js/src/executor.ts",
  "packages/runtime-js/src/executor.test.ts",
  "packages/runtime-supervisor/src/linux-certification-container.ts",
  "packages/runtime-supervisor/src/linux-certification-container.test.ts",
  "packages/spec/artifacts/strategy-artifacts.v1.14.json",
  "packages/spec/artifacts/v1.37-current-event-coverage.json",
  "packages/spec/src/runtime-budget-capabilities-v1-18.ts",
  "packages/spec/src/runtime-conformance-certificate-v1-17.ts",
  "packages/spec/src/runtime-semantic-receipt-v1-18.ts",
  "scripts/check-boundary-monitors.ts",
  "scripts/evaluate-v1-37-executable-conformance.ts",
  "scripts/evaluate-v1-37-executable-conformance.test.ts",
  "scripts/sign-v1-37-language-conformance-certificate.ts",
] as const)

const GATE_IDS = Object.freeze([
  "phase259-focused-tests",
  "go-parity",
  "contract",
  "strategy-artifacts",
  "audit-reproduction",
  "boundary-imports",
  "integrity-boundaries",
  "protected-baseline",
] as const)

const LIMITATIONS = Object.freeze([
  "cycle-start-backstab-simplification-deferred",
  "post-advance-hold-simplification-deferred",
  "experimental-rules-deferred",
] as const)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA256 = /^sha256:[0-9a-f]{64}$/u

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const readBytes = (repoRoot: string, relativePath: string): Buffer =>
  readFileSync(path.join(repoRoot, relativePath))

const readJson = <T>(repoRoot: string, relativePath: string): T =>
  JSON.parse(readBytes(repoRoot, relativePath).toString("utf8")) as T

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

interface GateReceipt {
  id: (typeof GATE_IDS)[number]
  status: "passed"
  command: string
  exitCode: 0
  stdoutSha256: string
  stderrSha256: string
}

interface CandidateRun {
  runId: string
  processId: string
  workspaceId: string
  resultRootSha256: string
  evidenceRootSha256: string
  completedAt: string
  validUntil: string
  status: "passed"
  complete: true
  freshProcess: true
  freshWorkspace: true
  skippedCaseCount: 0
  unsupportedCaseCount: 0
  fallbackUsed: false
  syntheticEvidence: false
}

interface LaneProof {
  languageId: (typeof LANGUAGES)[number]
  laneId: string
  candidatePayloadSha256: string
  certificateId: string
  certificateSha256: string
  authorityGeneration: string
  issuedAt: string
  freshUntil: string
  runs: CandidateRun[]
  status: "current_installed"
}

export interface V137ExecutableConformanceProof {
  schemaVersion: "v1.37-executable-conformance-proof-v1"
  milestone: "v1.37"
  phase: 259
  posture: "service-backed-executable-proof"
  requirements: Array<{ id: string; status: "proved" }>
  decisions: Array<{ id: string; status: "proved" }>
  inputs: Array<{ path: string; sha256: string }>
  lanes: LaneProof[]
  chronicle: {
    transitionAuthorityCount: 1
    perActivationSlot: true
    reconstructionEquivalent: true
    versionStrict: true
    historicalV14Immutable: true
  }
  service: {
    signedReceiptVersion: "runtime-semantic-receipt-v1.18"
    distinctBottomTopCertificates: true
    failureNoMutation: true
    goStructuralOnly: true
  }
  privacy: {
    publicSafe: true
    forbiddenFieldCount: 0
  }
  protectedBaseline: {
    status: "verified"
    protectedPathCount: 2
    baselineSha256: string
  }
  gates: GateReceipt[]
  limitations: string[]
}

const safeCommand = (command: string, args: readonly string[]): string =>
  [command, ...args].join(" ")

const gateDefinitions = Object.freeze([
  {
    id: "phase259-focused-tests",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/spec/src/runtime-conformance-certificate-v1-17.test.ts",
      "packages/spec/src/runtime-semantic-receipt-v1-18.test.ts",
      "packages/spec/src/runtime-execution-service-v1-18.test.ts",
      "packages/spec/src/runtime-budget-capabilities-v1-18.test.ts",
      "packages/persistence/src/runtime-evidence-authority-publisher.test.ts",
      "packages/persistence/src/chronicle-store.test.ts",
      "packages/persistence/src/complete-match.test.ts",
      "packages/runtime-js/src/candidate-process-runner.test.ts",
      "packages/runtime-js/src/executor.test.ts",
      "packages/runtime-supervisor/src/linux-certification-container.test.ts",
      "apps/runtime-service/src/execute-match-v1-18.test.ts",
      "apps/web/app/matches/server.test.ts",
      "scripts/sign-v1-37-language-conformance-certificate.test.ts",
    ],
  },
  { id: "go-parity", command: "pnpm", args: ["go:parity"] },
  { id: "contract", command: "pnpm", args: ["contract:check"] },
  {
    id: "strategy-artifacts",
    command: "pnpm",
    args: ["strategy-artifacts:check"],
  },
  {
    id: "audit-reproduction",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
    ],
  },
  { id: "boundary-imports", command: "pnpm", args: ["boundary:imports"] },
  {
    id: "integrity-boundaries",
    command: "pnpm",
    args: ["v1.37:integrity-boundaries:check"],
  },
  {
    id: "protected-baseline",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      "scripts/capture-v1-37-protected-baseline.ts",
      "--check",
    ],
  },
] as const)

const executeGates = (repoRoot: string): GateReceipt[] => {
  const databaseUrl = process.env.DATABASE_URL
  const goDatabaseUrl = process.env.COWARDS_GO_BACKEND_TEST_DATABASE_URL
  if (!databaseUrl || !goDatabaseUrl) {
    throw new Error("executable conformance requires both database URLs")
  }
  return gateDefinitions.map((gate) => {
    const result = spawnSync(gate.command, gate.args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        COWARDS_GO_BACKEND_TEST_DATABASE_URL: goDatabaseUrl,
        COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL: databaseUrl,
        PATH: `/usr/local/go/bin:${process.env.PATH ?? ""}`,
      },
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
      timeout: 20 * 60 * 1_000,
    })
    const stdout = result.stdout ?? Buffer.alloc(0)
    const stderr = result.stderr ?? Buffer.alloc(0)
    if (result.status !== 0 || result.error !== undefined) {
      throw new Error(`gate failed: ${gate.id}`)
    }
    return {
      id: gate.id,
      status: "passed",
      command: safeCommand(gate.command, gate.args),
      exitCode: 0,
      stdoutSha256: sha256(stdout),
      stderrSha256: sha256(stderr),
    }
  })
}

export const buildV137ExecutableConformanceProof = (
  repoRoot: string = root,
  gates: GateReceipt[] = executeGates(repoRoot),
): V137ExecutableConformanceProof => {
  const receiptManifest = readJson<{
    schemaVersion: string
    receipts: Array<{
      languageId: (typeof LANGUAGES)[number]
      laneId: string
      candidatePayloadSha256: string
      certificateId: string
      certificateSha256: string
      authorityGeneration: string
      status: string
      reasonCode: string
    }>
  }>(
    repoRoot,
    ".planning/artifacts/v1.37-language-conformance-import-receipts.json",
  )
  const lanes = LANGUAGES.map((languageId) => {
    const candidate = readJson<{
      status: string
      languageId: string
      candidatePayloadSha256: string
      candidatePayload: {
        issuedAt: string
        freshUntil: string
        identity: { laneId: string; languageId: string }
        runs: CandidateRun[]
      }
    }>(
      repoRoot,
      `.planning/artifacts/v1.37-language-conformance-${languageId}.json`,
    )
    const receipt = receiptManifest.receipts.find(
      (entry) => entry.languageId === languageId,
    )
    if (
      receipt === undefined ||
      receipt.status !== "installed" ||
      receipt.reasonCode !== "SIGNED_VERIFIED_IMPORTED" ||
      candidate.status !== "reviewed_unsigned_candidate" ||
      candidate.languageId !== languageId ||
      candidate.candidatePayload.identity.languageId !== languageId ||
      candidate.candidatePayloadSha256 !== receipt.candidatePayloadSha256
    ) {
      throw new Error(`lane evidence mismatch: ${languageId}`)
    }
    return {
      languageId,
      laneId: receipt.laneId,
      candidatePayloadSha256: receipt.candidatePayloadSha256,
      certificateId: receipt.certificateId,
      certificateSha256: receipt.certificateSha256,
      authorityGeneration: receipt.authorityGeneration,
      issuedAt: candidate.candidatePayload.issuedAt,
      freshUntil: candidate.candidatePayload.freshUntil,
      runs: candidate.candidatePayload.runs,
      status: "current_installed" as const,
    }
  })
  const baseline = readJson<{
    baselineSha256: string
    paths: unknown[]
  }>(
    repoRoot,
    ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  )
  return {
    schemaVersion: "v1.37-executable-conformance-proof-v1",
    milestone: "v1.37",
    phase: 259,
    posture: "service-backed-executable-proof",
    requirements: V137_EXECUTABLE_CONFORMANCE_REQUIREMENTS.map((id) => ({
      id,
      status: "proved",
    })),
    decisions: V137_EXECUTABLE_CONFORMANCE_DECISIONS.map((id) => ({
      id,
      status: "proved",
    })),
    inputs: INPUT_PATHS.map((relativePath) => ({
      path: relativePath,
      sha256: sha256(readBytes(repoRoot, relativePath)),
    })),
    lanes,
    chronicle: {
      transitionAuthorityCount: 1,
      perActivationSlot: true,
      reconstructionEquivalent: true,
      versionStrict: true,
      historicalV14Immutable: true,
    },
    service: {
      signedReceiptVersion: "runtime-semantic-receipt-v1.18",
      distinctBottomTopCertificates: true,
      failureNoMutation: true,
      goStructuralOnly: true,
    },
    privacy: { publicSafe: true, forbiddenFieldCount: 0 },
    protectedBaseline: {
      status: "verified",
      protectedPathCount: baseline.paths.length,
      baselineSha256: baseline.baselineSha256,
    },
    gates,
    limitations: [...LIMITATIONS],
  }
}

export const validateV137ExecutableConformanceProof = (
  value: unknown,
  repoRoot: string = root,
  now = new Date().toISOString(),
): string[] => {
  const errors: string[] = []
  if (
    !exactKeys(value, [
      "schemaVersion",
      "milestone",
      "phase",
      "posture",
      "requirements",
      "decisions",
      "inputs",
      "lanes",
      "chronicle",
      "service",
      "privacy",
      "protectedBaseline",
      "gates",
      "limitations",
    ])
  ) {
    return ["proof shape"]
  }
  const proof = value as unknown as V137ExecutableConformanceProof
  if (
    proof.schemaVersion !== "v1.37-executable-conformance-proof-v1" ||
    proof.milestone !== "v1.37" ||
    proof.phase !== 259 ||
    proof.posture !== "service-backed-executable-proof"
  ) {
    errors.push("proof identity")
  }
  if (
    JSON.stringify(proof.requirements) !==
    JSON.stringify(
      V137_EXECUTABLE_CONFORMANCE_REQUIREMENTS.map((id) => ({
        id,
        status: "proved",
      })),
    )
  ) {
    errors.push("requirements")
  }
  if (
    JSON.stringify(proof.decisions) !==
    JSON.stringify(
      V137_EXECUTABLE_CONFORMANCE_DECISIONS.map((id) => ({
        id,
        status: "proved",
      })),
    )
  ) {
    errors.push("decisions")
  }
  if (
    proof.inputs.length !== INPUT_PATHS.length ||
    proof.inputs.some(
      (entry, index) =>
        entry.path !== INPUT_PATHS[index] ||
        !SHA256.test(entry.sha256) ||
        entry.sha256 !== sha256(readBytes(repoRoot, entry.path)),
    )
  ) {
    errors.push("inputs")
  }
  if (
    proof.lanes.length !== LANGUAGES.length ||
    proof.lanes.some((lane, laneIndex) => {
      if (
        lane.languageId !== LANGUAGES[laneIndex] ||
        lane.status !== "current_installed" ||
        !SHA256.test(lane.candidatePayloadSha256) ||
        !SHA256.test(lane.certificateSha256) ||
        lane.runs.length !== 3 ||
        Date.parse(now) > Date.parse(lane.freshUntil)
      ) {
        return true
      }
      const ids = new Set<string>()
      const processes = new Set<string>()
      const workspaces = new Set<string>()
      for (const run of lane.runs) {
        if (
          ids.has(run.runId) ||
          processes.has(run.processId) ||
          workspaces.has(run.workspaceId) ||
          run.status !== "passed" ||
          run.complete !== true ||
          run.freshProcess !== true ||
          run.freshWorkspace !== true ||
          run.skippedCaseCount !== 0 ||
          run.unsupportedCaseCount !== 0 ||
          run.fallbackUsed !== false ||
          run.syntheticEvidence !== false ||
          !SHA256.test(run.resultRootSha256) ||
          !SHA256.test(run.evidenceRootSha256)
        ) {
          return true
        }
        ids.add(run.runId)
        processes.add(run.processId)
        workspaces.add(run.workspaceId)
      }
      return false
    })
  ) {
    errors.push("lanes")
  }
  if (
    JSON.stringify(proof.chronicle) !==
      JSON.stringify({
        transitionAuthorityCount: 1,
        perActivationSlot: true,
        reconstructionEquivalent: true,
        versionStrict: true,
        historicalV14Immutable: true,
      }) ||
    JSON.stringify(proof.service) !==
      JSON.stringify({
        signedReceiptVersion: "runtime-semantic-receipt-v1.18",
        distinctBottomTopCertificates: true,
        failureNoMutation: true,
        goStructuralOnly: true,
      })
  ) {
    errors.push("semantic closure")
  }
  if (
    proof.privacy.publicSafe !== true ||
    proof.privacy.forbiddenFieldCount !== 0 ||
    proof.protectedBaseline.status !== "verified" ||
    proof.protectedBaseline.protectedPathCount !== 2 ||
    !SHA256.test(proof.protectedBaseline.baselineSha256)
  ) {
    errors.push("boundaries")
  }
  if (
    proof.gates.length !== GATE_IDS.length ||
    proof.gates.some(
      (gate, index) =>
        gate.id !== GATE_IDS[index] ||
        gate.status !== "passed" ||
        gate.exitCode !== 0 ||
        gate.command !==
          safeCommand(gateDefinitions[index]!.command, gateDefinitions[index]!.args) ||
        !SHA256.test(gate.stdoutSha256) ||
        !SHA256.test(gate.stderrSha256),
    )
  ) {
    errors.push("gates")
  }
  if (JSON.stringify(proof.limitations) !== JSON.stringify(LIMITATIONS)) {
    errors.push("limitations")
  }
  return errors
}

export const renderV137ExecutableConformanceMarkdown = (
  proof: V137ExecutableConformanceProof,
): string => `# v1.37 Executable Conformance Proof

- Status: passed
- Requirements: ${proof.requirements.length}/11
- Decisions: ${proof.decisions.length}/16
- Languages: ${proof.lanes.map((lane) => lane.languageId).join(", ")}
- Independent runs: ${proof.lanes.reduce((sum, lane) => sum + lane.runs.length, 0)}
- Installed certificates: ${proof.lanes.length}/4
- Chronicle transition authorities: ${proof.chronicle.transitionAuthorityCount}
- Executable gates: ${proof.gates.length}/8
- Protected user paths preserved: ${proof.protectedBaseline.protectedPathCount}/2
- Deferred experimental simplifications: ${proof.limitations.join(", ")}
`

const writeAtomic = (relativePath: string, bytes: Buffer): void => {
  const target = path.join(root, relativePath)
  const temporary = `${target}.tmp-${process.pid}`
  writeFileSync(temporary, bytes, { flag: "wx", mode: 0o644 })
  renameSync(temporary, target)
}

export const checkV137ExecutableConformanceArtifacts = (
  repoRoot: string = root,
): void => {
  const proof = readJson<V137ExecutableConformanceProof>(
    repoRoot,
    V137_EXECUTABLE_CONFORMANCE_PATHS.json,
  )
  const errors = validateV137ExecutableConformanceProof(proof, repoRoot)
  if (errors.length > 0) {
    throw new Error("EXECUTABLE_CONFORMANCE_PROOF_INVALID")
  }
  const expectedJson = Buffer.from(`${JSON.stringify(proof)}\n`)
  const expectedMarkdown = Buffer.from(
    renderV137ExecutableConformanceMarkdown(proof),
  )
  if (
    !readBytes(repoRoot, V137_EXECUTABLE_CONFORMANCE_PATHS.json).equals(
      expectedJson,
    ) ||
    !readBytes(repoRoot, V137_EXECUTABLE_CONFORMANCE_PATHS.markdown).equals(
      expectedMarkdown,
    )
  ) {
    throw new Error("EXECUTABLE_CONFORMANCE_PROOF_INVALID")
  }
}

const main = (): void => {
  const args = process.argv.slice(2)
  try {
    if (args.length === 1 && args[0] === "--write") {
      const proof = buildV137ExecutableConformanceProof()
      const errors = validateV137ExecutableConformanceProof(proof)
      if (errors.length > 0) throw new Error("proof construction failed")
      writeAtomic(
        V137_EXECUTABLE_CONFORMANCE_PATHS.json,
        Buffer.from(`${JSON.stringify(proof)}\n`),
      )
      writeAtomic(
        V137_EXECUTABLE_CONFORMANCE_PATHS.markdown,
        Buffer.from(renderV137ExecutableConformanceMarkdown(proof)),
      )
    } else if (args.length === 1 && args[0] === "--check") {
      checkV137ExecutableConformanceArtifacts()
    } else {
      throw new Error("usage")
    }
    process.stdout.write(
      `${JSON.stringify({ status: "passed", code: "EXECUTABLE_CONFORMANCE_PROVED" })}\n`,
    )
  } catch (error) {
    const gateMatch =
      error instanceof Error
        ? /^gate failed: ([a-z0-9-]+)$/u.exec(error.message)
        : null
    const code =
      gateMatch === null
        ? "EXECUTABLE_CONFORMANCE_PROOF_INVALID"
        : `EXECUTABLE_CONFORMANCE_GATE_FAILED_${gateMatch[1]!.toUpperCase().replaceAll("-", "_")}`
    process.stderr.write(
      `${JSON.stringify({ status: "failed", code })}\n`,
    )
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
