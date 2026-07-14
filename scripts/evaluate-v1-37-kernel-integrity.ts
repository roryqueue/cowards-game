#!/usr/bin/env -S pnpm exec tsx

export const v137BrowserPlaywrightArtifactPath =
  ".planning/artifacts/v1.37-phase-257-browser-playwright.json" as const
export const v137KernelIntegrityArtifactPaths = {
  json: ".planning/artifacts/v1.37-kernel-integrity-proof.json",
  markdown: ".planning/artifacts/v1.37-kernel-integrity-proof.md",
} as const

export const requiredV137KernelRequirements = [] as const
export const requiredV137DecisionIds = [] as const
export const requiredV137GateIds = [] as const

export interface V137BrowserPlaywrightReceipt {
  schemaVersion: string
  run: Record<string, unknown>
  tests: Array<Record<string, unknown>>
  [key: string]: unknown
}

export interface V137WorkingCopyReceipt {
  schemaVersion: string
  protectedFiles: Array<{
    path: string
    beforeBytesSha256: string
    afterBytesSha256: string
    beforeBinaryDiffSha256: string
    afterBinaryDiffSha256: string
    preserved: boolean
  }>
  generatedFile: {
    path: string
    beforeBytesSha256: string
    afterRestoreBytesSha256: string
    preserved: boolean
  }
}

export const parseV137KernelIntegrityArgs = (
  _args: readonly string[],
): { mode: "write" | "check"; runBrowser: boolean } => {
  throw new Error("not implemented")
}

export const projectV137BrowserPlaywrightReceipt = (
  _report: unknown,
  _input: { exitCode: number; reportSha256: string },
): V137BrowserPlaywrightReceipt => {
  throw new Error("not implemented")
}

export const validateV137BrowserPlaywrightReceipt = (
  _receipt: unknown,
): string[] => ["not implemented"]

export const createV137KernelIntegrityProof = (
  _input: unknown,
): any => {
  throw new Error("not implemented")
}

export const validateV137KernelIntegrityProof = (
  _proof: unknown,
): string[] => ["not implemented"]

export const renderV137KernelIntegrityProofJson = (proof: unknown): string =>
  `${JSON.stringify(proof, null, 2)}\n`

export const renderV137KernelIntegrityProofMarkdown = (
  _proof: unknown,
): string => "# Not implemented\n"
