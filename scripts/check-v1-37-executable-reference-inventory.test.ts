import { describe, expect, it } from "vitest"
import {
  analyzeV137ExecutableReferences,
  checkV137ExecutableReferenceInventory,
  type V137ReferenceMode,
} from "./check-v1-37-executable-reference-inventory.js"

const analyze = (
  source: string,
  mode: V137ReferenceMode = "baseline",
  repoPath = "packages/unknown/src/alternate.ts",
) =>
  analyzeV137ExecutableReferences({ [repoPath]: source }, mode, {
    enforceBaseline: false,
  })

describe("v1.37 executable reference ownership inventory", () => {
  it("freezes the exact post-compatibility repository baseline", () => {
    const result = checkV137ExecutableReferenceInventory("baseline")
    expect(result.findings).toEqual([])
    expect(result.references.length).toBeGreaterThan(40)
    expect(
      new Set(result.references.map((reference) => reference.owner)),
    ).toEqual(
      new Set([
        "257-10",
        "257-13",
        "257-14",
        "257-15",
        "257-16",
        "257-18",
        "257-19",
      ]),
    )
  })

  it.each([
    [
      'import { buildChronicleFromMatch as builder } from "@cowards/replay"; builder()',
      "import",
    ],
    ["const value = buildChronicleFromMatch(input)", "call"],
    [
      "const deps: { buildChronicleFromMatch: (value: unknown) => unknown } = input",
      "property",
    ],
    ["type Result = ReturnType<typeof buildChronicleFromMatch>", "type"],
    ["const deps = { buildChronicleFromMatch }", "property"],
    ["export const resolveActivation = () => undefined", "definition"],
  ])("owns exact executable syntax `%s` as %s", (source, role) => {
    const result = analyze(source)
    expect(result.references).toEqual(
      expect.arrayContaining([expect.objectContaining({ role })]),
    )
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNOWNED_EXECUTABLE_REFERENCE" }),
      ]),
    )
  })

  it("classifies comments, prose strings, and negative guard literals separately", () => {
    const result = analyze(`
      // buildChronicleFromMatch is retired here.
      const message = "resolveActivation must not remain"
      const buildChronicleFromMatchResult = () => undefined
      const resolveActivationCycle = () => undefined
    `)
    expect(result.references).toEqual([])
    expect(result.nonExecutableMentions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "buildChronicleFromMatch",
          kind: "comment",
        }),
        expect.objectContaining({
          symbol: "resolveActivation",
          kind: "string",
        }),
      ]),
    )

    const monitor = analyzeV137ExecutableReferences(
      {
        "scripts/check-v1-37-integrity-boundaries.ts":
          'const guard = "buildChronicleFromMatch resolveActivation"',
      },
      "baseline",
      { enforceBaseline: false },
    )
    expect(monitor.references).toEqual([])
    expect(monitor.findings).toEqual([])

    const documentation = analyzeV137ExecutableReferences(
      {
        "packages/replay/README.md":
          "The buildChronicleFromMatch compatibility path is retiring.",
      },
      "baseline",
      { enforceBaseline: false },
    )
    expect(documentation.references).toEqual([])
    expect(documentation.nonExecutableMentions).toEqual([
      expect.objectContaining({
        symbol: "buildChronicleFromMatch",
        kind: "documentation",
      }),
    ])
  })

  it("rejects a moved exact reference even when its owner has a similar file", () => {
    const result = analyze(
      "export const buildChronicleFromMatch = () => undefined",
      "baseline",
      "packages/replay/src/build-copy.ts",
    )
    expect(result.findings).toEqual([
      expect.objectContaining({ code: "UNOWNED_EXECUTABLE_REFERENCE" }),
    ])
  })

  it("makes builder migration modes monotonically stricter", () => {
    const sources = {
      "packages/golden/src/parity.test.ts": "buildChronicleFromMatch(input)",
      "packages/replay/src/validate.test.ts": "buildChronicleFromMatch(input)",
      "packages/replay/src/determinism.test.ts":
        "buildChronicleFromMatch(input)",
      "apps/runtime-service/src/counted-safety.test.ts":
        "buildChronicleFromMatch(input)",
      "packages/persistence/src/complete-match.test.ts":
        "buildChronicleFromMatch(input)",
      "packages/replay/src/build.ts":
        "export const buildChronicleFromMatch = () => undefined",
    }
    const expectedMinimumFindings: ReadonlyArray<
      readonly [V137ReferenceMode, number]
    > = [
      ["recorder-migrated", 1],
      ["replay-core-ready", 2],
      ["replay-fixtures-ready", 3],
      ["runtime-service-ready", 4],
      ["persistence-ready", 5],
    ]
    let previous = 0
    for (const [mode, expected] of expectedMinimumFindings) {
      const findings = analyzeV137ExecutableReferences(sources, mode, {
        enforceBaseline: false,
      }).findings.filter(
        (finding) => finding.code === "MIGRATION_STAGE_INCOMPLETE",
      )
      expect(findings).toHaveLength(expected)
      expect(findings.length).toBeGreaterThan(previous)
      previous = findings.length
    }
  })

  it("keeps the Activation caller gate independent from unfinished builder groups", () => {
    const result = analyzeV137ExecutableReferences(
      {
        "packages/replay/src/validate.test.ts":
          "buildChronicleFromMatch(input)",
        "packages/engine/src/activation.ts":
          "export const resolveActivation = () => undefined",
      },
      "activation-callers-ready",
      { enforceBaseline: false },
    )
    expect(result.findings).toEqual([])

    const bypass = analyzeV137ExecutableReferences(
      {
        "packages/engine/src/activation.test.ts": "resolveActivation(input)",
        "packages/engine/src/activation.ts":
          "export const resolveActivation = () => undefined",
      },
      "activation-callers-ready",
      { enforceBaseline: false },
    )
    expect(bypass.findings).toEqual([
      expect.objectContaining({ code: "MIGRATION_STAGE_INCOMPLETE" }),
    ])
  })

  it("allows only the two retained definitions at activation-ready and none at current", () => {
    const definitions = {
      "packages/replay/src/build.ts":
        "export const buildChronicleFromMatch = () => undefined",
      "packages/engine/src/activation.ts":
        "export const resolveActivation = () => undefined",
    }
    expect(
      analyzeV137ExecutableReferences(definitions, "activation-ready", {
        enforceBaseline: false,
      }).findings,
    ).toEqual([])
    expect(
      analyzeV137ExecutableReferences(definitions, "current", {
        enforceBaseline: false,
      }).findings,
    ).toEqual([expect.objectContaining({ code: "MIGRATION_STAGE_INCOMPLETE" })])
    expect(
      analyzeV137ExecutableReferences({}, "current", {
        enforceBaseline: false,
      }).findings,
    ).toEqual([])
  })
})
