import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  createV137KernelIntegrityProof,
  parseV137KernelIntegrityArgs,
  projectV137BrowserPlaywrightReceipt,
  renderV137KernelIntegrityProofJson,
  renderV137KernelIntegrityProofMarkdown,
  resolveV137HistoricalEvidenceFiles,
  runV137KernelIntegrityCli,
  requiredV137DecisionIds,
  requiredV137GateIds,
  requiredV137KernelRequirements,
  validateV137BrowserPlaywrightReceipt,
  validateV137KernelIntegrityProof,
  v137BrowserCommandContract,
  v137BrowserPlaywrightArtifactPath,
  v137KernelIntegrityArtifactPaths,
  type V137BrowserPlaywrightReceipt,
  type V137WorkingCopyReceipt,
} from "./evaluate-v1-37-kernel-integrity.ts"

const digest = "a".repeat(64)
const targetFile = "apps/web/e2e/v1-37-rules-integrity-proof.spec.ts" as const
const targetTitle =
  "result, APIs, and replay share one realistic public-safe terminal receipt"

const rawPlaywrightReport = () => ({
  config: {
    projects: [{ name: "desktop" }, { name: "tablet" }, { name: "mobile" }],
  },
  suites: [
    {
      title: "v1-37-rules-integrity-proof.spec.ts",
      file: targetFile,
      suites: [],
      specs: [
        {
          title: targetTitle,
          file: targetFile,
          tests: [
            {
              expectedStatus: "passed",
              projectName: "desktop",
              results: [
                {
                  status: "passed",
                  duration: 1_001,
                  retry: 0,
                  error: undefined,
                  errors: [],
                  stdout: [],
                  stderr: [],
                  attachments: [],
                },
              ],
            },
            {
              expectedStatus: "passed",
              projectName: "tablet",
              results: [
                {
                  status: "passed",
                  duration: 1_002,
                  retry: 0,
                  error: undefined,
                  errors: [],
                  stdout: [],
                  stderr: [],
                  attachments: [],
                },
              ],
            },
            {
              expectedStatus: "passed",
              projectName: "mobile",
              results: [
                {
                  status: "passed",
                  duration: 1_003,
                  retry: 0,
                  error: undefined,
                  errors: [],
                  stdout: [],
                  stderr: [],
                  attachments: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  errors: [],
  stats: {
    startTime: "2026-07-14T00:00:00.000Z",
    duration: 3_500,
    expected: 3,
    skipped: 0,
    unexpected: 0,
    flaky: 0,
  },
})

const browserReceipt = (): V137BrowserPlaywrightReceipt =>
  projectV137BrowserPlaywrightReceipt(rawPlaywrightReport(), {
    exitCode: 0,
    reportSha256: digest,
  })

const workingCopyReceipt = (): V137WorkingCopyReceipt => ({
  schemaVersion: "v1.37-working-copy-preservation-v1",
  protectedFiles: [
    {
      path: ".planning/config.json",
      beforeBytesSha256: digest,
      afterBytesSha256: digest,
      beforeBinaryDiffSha256: digest,
      afterBinaryDiffSha256: digest,
      preserved: true,
    },
    {
      path: "CowardsGameSpec_Full_Consolidated_v1.md",
      beforeBytesSha256: digest,
      afterBytesSha256: digest,
      beforeBinaryDiffSha256: digest,
      afterBinaryDiffSha256: digest,
      preserved: true,
    },
  ],
  generatedFile: {
    path: "apps/web/next-env.d.ts",
    beforeBytesSha256: digest,
    afterRestoreBytesSha256: digest,
    preserved: true,
  },
})

describe("v1.37 Phase 257 kernel-integrity evaluator", () => {
  it("resolves pinned historical inputs independently of later current-source bytes", () => {
    const historicalBytes = Buffer.from("phase-257 historical evidence")
    const historicalSha256 = createHash("sha256")
      .update(historicalBytes)
      .digest("hex")
    const evidence = [
      {
        id: "historical-lifecycle",
        path: "packages/engine/src/kernel/lifecycle-repairs.test.ts",
        sha256: historicalSha256,
      },
    ]

    expect(
      resolveV137HistoricalEvidenceFiles(evidence, () => historicalBytes),
    ).toEqual(evidence)
    expect(
      createHash("sha256").update("later current-source bytes").digest("hex"),
    ).not.toBe(historicalSha256)
    expect(() =>
      resolveV137HistoricalEvidenceFiles(evidence, () =>
        Buffer.from("wrong historical bytes"),
      ),
    ).toThrow("Phase 257 historical evidence drifted")
  })

  it("parses only explicit fresh-write, receipt-refresh, or pure-check modes", () => {
    expect(parseV137KernelIntegrityArgs(["--write", "--run-browser"])).toEqual({
      mode: "write",
      runBrowser: true,
    })
    expect(parseV137KernelIntegrityArgs(["--check"])).toEqual({
      mode: "check",
      runBrowser: false,
    })
    expect(parseV137KernelIntegrityArgs(["--refresh"])).toEqual({
      mode: "refresh",
      runBrowser: false,
    })
    for (const args of [
      [],
      ["--write"],
      ["--run-browser"],
      ["--refresh", "--run-browser"],
      ["--write", "--check", "--run-browser"],
      ["--check", "--unknown"],
    ]) {
      expect(() => parseV137KernelIntegrityArgs(args)).toThrow()
    }
  })

  it("keeps check pure, refresh browser-inert, and fresh write explicit", () => {
    const checkEvents: string[] = []
    expect(
      runV137KernelIntegrityCli(["--check"], {
        write: () => checkEvents.push("write"),
        refresh: () => checkEvents.push("refresh"),
        check: () => {
          checkEvents.push("check")
          return []
        },
      }),
    ).toBe(0)
    expect(checkEvents).toEqual(["check"])

    const refreshEvents: string[] = []
    expect(
      runV137KernelIntegrityCli(["--refresh"], {
        write: () => refreshEvents.push("write-browser"),
        refresh: () => refreshEvents.push("refresh-receipts"),
        check: () => {
          refreshEvents.push("check")
          return []
        },
      }),
    ).toBe(0)
    expect(refreshEvents).toEqual(["refresh-receipts", "check"])

    const writeEvents: string[] = []
    expect(
      runV137KernelIntegrityCli(["--write", "--run-browser"], {
        write: () => writeEvents.push("write-browser-once"),
        refresh: () => writeEvents.push("refresh"),
        check: () => {
          writeEvents.push("check")
          return []
        },
      }),
    ).toBe(0)
    expect(writeEvents).toEqual(["write-browser-once", "check"])
    expect(v137BrowserCommandContract).toEqual({
      command: "pnpm",
      args: [
        "exec",
        "playwright",
        "test",
        "--config=playwright.config.ts",
        "--workers=1",
        targetFile,
        "--reporter=json",
      ],
      ci: true,
      workers: 1,
      testFile: targetFile,
    })
  })

  it("projects exactly one clean target test from desktop, tablet, and mobile", () => {
    const receipt = browserReceipt()

    expect(receipt.schemaVersion).toBe("v1.37-phase-257-browser-playwright-v1")
    expect(receipt.run).toMatchObject({
      commandId: "phase257-root-playwright-one-worker",
      ci: true,
      workers: 1,
      exitCode: 0,
      reportSha256: digest,
    })
    expect(receipt.tests).toEqual([
      {
        project: "desktop",
        file: targetFile,
        title: targetTitle,
        status: "passed",
        durationMs: 1_001,
      },
      {
        project: "mobile",
        file: targetFile,
        title: targetTitle,
        status: "passed",
        durationMs: 1_003,
      },
      {
        project: "tablet",
        file: targetFile,
        title: targetTitle,
        status: "passed",
        durationMs: 1_002,
      },
    ])
    expect(validateV137BrowserPlaywrightReceipt(receipt)).toEqual([])
  })

  it.each([
    [
      "global error",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        report.errors.push({ message: "failed" } as never),
    ],
    [
      "skipped",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.stats.skipped = 1),
    ],
    [
      "unexpected",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.stats.unexpected = 1),
    ],
    [
      "flaky",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.stats.flaky = 1),
    ],
    [
      "wrong project",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.suites[0]!.specs[0]!.tests[0]!.projectName = "webkit"),
    ],
    [
      "wrong file",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.suites[0]!.specs[0]!.file = "other.spec.ts"),
    ],
    [
      "retry",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.suites[0]!.specs[0]!.tests[0]!.results[0]!.retry = 1),
    ],
    [
      "output",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        report.suites[0]!.specs[0]!.tests[0]!.results[0]!.stdout.push(
          "log" as never,
        ),
    ],
    [
      "attachment",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        report.suites[0]!.specs[0]!.tests[0]!.results[0]!.attachments.push({
          name: "trace",
        } as never),
    ],
    [
      "test error",
      (report: ReturnType<typeof rawPlaywrightReport>) =>
        (report.suites[0]!.specs[0]!.tests[0]!.results[0]!.error = {
          message: "boom",
        } as never),
    ],
    [
      "empty suite",
      (report: ReturnType<typeof rawPlaywrightReport>) => (report.suites = []),
    ],
  ])("rejects Playwright %s evidence", (_label, mutate) => {
    const report = rawPlaywrightReport()
    mutate(report)
    expect(() =>
      projectV137BrowserPlaywrightReceipt(report, {
        exitCode: 0,
        reportSha256: digest,
      }),
    ).toThrow()
  })

  it("rejects nonzero Playwright exit and private or extra receipt fields", () => {
    expect(() =>
      projectV137BrowserPlaywrightReceipt(rawPlaywrightReport(), {
        exitCode: 1,
        reportSha256: digest,
      }),
    ).toThrow(/exit/u)

    const privateReceipt = {
      ...browserReceipt(),
      source: "private Strategy text",
    }
    expect(validateV137BrowserPlaywrightReceipt(privateReceipt)).not.toEqual([])
  })

  it("builds strict exact KERN-01..11 and D-01..16 coverage without live-topology overclaim", () => {
    const proof = createV137KernelIntegrityProof({
      browserReceipt: browserReceipt(),
      browserReceiptSha256: digest,
      workingCopyReceipt: workingCopyReceipt(),
      inputFiles: [
        {
          id: "phase257-core-result",
          path: ".planning/artifacts/v1.37-phase-257-core-rules-result.json",
          sha256: digest,
        },
      ],
      manifestFiles: [
        {
          path: "packages/engine/src/kernel/step.ts",
          sha256: digest,
        },
      ],
    })

    expect(proof.coverage.requirements.map((row) => row.id)).toEqual(
      requiredV137KernelRequirements,
    )
    expect(proof.coverage.decisions.map((row) => row.id)).toEqual(
      requiredV137DecisionIds,
    )
    expect(proof.gates.map((row) => row.id)).toEqual(requiredV137GateIds)
    expect(proof.limitations).toEqual([
      "phase258-canonical-json-not-proved",
      "phase259-four-language-conformance-not-proved",
      "phase261-live-service-topology-not-proved",
      "cycle-start-backstab-simplification-deferred",
      "post-advance-hold-simplification-deferred",
    ])
    expect(validateV137KernelIntegrityProof(proof)).toEqual([])
  })

  it("rejects extra keys, incomplete coverage, stale hashes, and unequal working-copy receipts", () => {
    const proof = createV137KernelIntegrityProof({
      browserReceipt: browserReceipt(),
      browserReceiptSha256: digest,
      workingCopyReceipt: workingCopyReceipt(),
      inputFiles: [
        {
          id: "phase257-core-result",
          path: ".planning/artifacts/v1.37-phase-257-core-rules-result.json",
          sha256: digest,
        },
      ],
      manifestFiles: [
        {
          path: "packages/engine/src/kernel/step.ts",
          sha256: digest,
        },
      ],
    })
    const extra = { ...proof, head: "later-commit" }
    expect(validateV137KernelIntegrityProof(extra)).not.toEqual([])

    const missing = globalThis.structuredClone(proof)
    missing.coverage.requirements.pop()
    expect(validateV137KernelIntegrityProof(missing)).not.toEqual([])

    const badHash = globalThis.structuredClone(proof)
    badHash.inputs.files[0]!.sha256 = "bad"
    expect(validateV137KernelIntegrityProof(badHash)).not.toEqual([])

    const changed = globalThis.structuredClone(proof)
    changed.workingCopy.protectedFiles[0]!.afterBytesSha256 = "b".repeat(64)
    expect(validateV137KernelIntegrityProof(changed)).not.toEqual([])
  })

  it("renders canonical synchronized JSON and public-safe Markdown", () => {
    const proof = createV137KernelIntegrityProof({
      browserReceipt: browserReceipt(),
      browserReceiptSha256: digest,
      workingCopyReceipt: workingCopyReceipt(),
      inputFiles: [
        {
          id: "phase257-core-result",
          path: ".planning/artifacts/v1.37-phase-257-core-rules-result.json",
          sha256: digest,
        },
      ],
      manifestFiles: [
        {
          path: "packages/engine/src/kernel/step.ts",
          sha256: digest,
        },
      ],
    })
    const json = renderV137KernelIntegrityProofJson(proof)
    const markdown = renderV137KernelIntegrityProofMarkdown(proof)

    expect(JSON.parse(json)).toEqual(proof)
    expect(json.endsWith("\n")).toBe(true)
    expect(markdown).toContain("service-contract-backed fixture")
    expect(markdown).toContain("Phase 261")
    expect(markdown).not.toContain("/Users/")
    expect(v137KernelIntegrityArtifactPaths).toEqual({
      json: ".planning/artifacts/v1.37-kernel-integrity-proof.json",
      markdown: ".planning/artifacts/v1.37-kernel-integrity-proof.md",
    })
    expect(v137BrowserPlaywrightArtifactPath).toBe(
      ".planning/artifacts/v1.37-phase-257-browser-playwright.json",
    )
  })
})
