import { describe, expect, it } from "vitest"
import {
  buildV137ExecutableConformanceProof,
  renderV137ExecutableConformanceMarkdown,
  validateV137ExecutableConformanceProof,
} from "./evaluate-v1-37-executable-conformance.js"

const passingGates = () =>
  [
    "phase259-focused-tests",
    "go-parity",
    "contract",
    "strategy-artifacts",
    "audit-reproduction",
    "boundary-imports",
    "integrity-boundaries",
    "protected-baseline",
  ].map((id) => ({
    id,
    status: "passed" as const,
    command: "",
    exitCode: 0 as const,
    stdoutSha256: `sha256:${"1".repeat(64)}`,
    stderrSha256: `sha256:${"2".repeat(64)}`,
  }))

describe("v1.37 executable conformance proof", () => {
  it("builds one strict four-lane, twelve-run, D-01..D-16 proof", () => {
    const proof = buildV137ExecutableConformanceProof(
      process.cwd(),
      passingGates().map((gate, index) => ({
        ...gate,
        command: [
          "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/spec/src/runtime-conformance-certificate-v1-17.test.ts packages/spec/src/runtime-semantic-receipt-v1-18.test.ts packages/spec/src/runtime-execution-service-v1-18.test.ts packages/spec/src/runtime-budget-capabilities-v1-18.test.ts packages/persistence/src/runtime-evidence-authority-publisher.test.ts packages/persistence/src/complete-match.test.ts apps/runtime-service/src/execute-match-v1-18.test.ts scripts/sign-v1-37-language-conformance-certificate.test.ts",
          "pnpm go:parity",
          "pnpm contract:check",
          "pnpm strategy-artifacts:check",
          "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
          "pnpm boundary:imports",
          "pnpm v1.37:integrity-boundaries:check",
          "pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check",
        ][index]!,
      })),
    )
    expect(validateV137ExecutableConformanceProof(proof)).toEqual([])
    expect(proof.lanes).toHaveLength(4)
    expect(proof.lanes.flatMap(({ runs }) => runs)).toHaveLength(12)
    expect(proof.decisions.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 16 },
        (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
      ),
    )
    expect(renderV137ExecutableConformanceMarkdown(proof)).toContain(
      "Installed certificates: 4/4",
    )
  })

  it.each([
    ["extra top-level field", (proof: Record<string, unknown>) => {
      proof.extra = true
    }],
    ["missing requirement", (proof: Record<string, unknown>) => {
      ;(proof.requirements as unknown[]).pop()
    }],
    ["missing lane", (proof: Record<string, unknown>) => {
      ;(proof.lanes as unknown[]).pop()
    }],
    ["partial run", (proof: Record<string, unknown>) => {
      ;((proof.lanes as Array<{ runs: unknown[] }>)[0]!.runs).pop()
    }],
    ["false gate", (proof: Record<string, unknown>) => {
      ;(proof.gates as Array<{ status: string }>)[0]!.status = "failed"
    }],
    ["private count", (proof: Record<string, unknown>) => {
      ;(proof.privacy as { forbiddenFieldCount: number }).forbiddenFieldCount = 1
    }],
    ["unapproved limitation", (proof: Record<string, unknown>) => {
      ;(proof.limitations as string[]).push("cycle-cap-4")
    }],
  ] as const)("rejects %s", (_name, mutate) => {
    const proof = buildV137ExecutableConformanceProof(
      process.cwd(),
      passingGates().map((gate, index) => ({
        ...gate,
        command: [
          "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/spec/src/runtime-conformance-certificate-v1-17.test.ts packages/spec/src/runtime-semantic-receipt-v1-18.test.ts packages/spec/src/runtime-execution-service-v1-18.test.ts packages/spec/src/runtime-budget-capabilities-v1-18.test.ts packages/persistence/src/runtime-evidence-authority-publisher.test.ts packages/persistence/src/complete-match.test.ts apps/runtime-service/src/execute-match-v1-18.test.ts scripts/sign-v1-37-language-conformance-certificate.test.ts",
          "pnpm go:parity",
          "pnpm contract:check",
          "pnpm strategy-artifacts:check",
          "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
          "pnpm boundary:imports",
          "pnpm v1.37:integrity-boundaries:check",
          "pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check",
        ][index]!,
      })),
    ) as unknown as Record<string, unknown>
    mutate(proof)
    expect(validateV137ExecutableConformanceProof(proof)).not.toEqual([])
  })
})
