import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.ts"
import {
  generateFinalTypeScriptSurfaceLabels,
  validateFinalTypeScriptSurfaceLabels,
  checkFinalTypeScriptSurfaceLabelArtifacts,
  renderFinalTypeScriptSurfaceLabelsJson,
  renderFinalTypeScriptSurfaceLabelsMarkdown,
} from "./generate-typescript-surface-labels.ts"

const inventory = JSON.parse(
  readFileSync(".planning/artifacts/v1.16-typescript-backend-inventory.json", "utf8"),
) as { surfaces: Array<{ path: string; role: string }> }

describe("final v1.16 TypeScript surface labels", () => {
  it("emits exactly one final label row for every inventory surface", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    expect(labels.schemaVersion).toBe("v1.16-final-typescript-surface-labels")
    expect(labels.sourceInventorySurfaceCount).toBe(inventory.surfaces.length)
    expect(labels.surfaces).toHaveLength(inventory.surfaces.length)
    expect(new Set(labels.surfaces.map((surface) => surface.path)).size).toBe(
      inventory.surfaces.length,
    )
    expect(labels.surfaces.map((surface) => surface.path).sort()).toEqual(
      inventory.surfaces.map((surface) => surface.path).sort(),
    )

    const markdown = readFileSync(
      ".planning/artifacts/v1.16-final-typescript-surface-labels.md",
      "utf8",
    )
    for (const surface of inventory.surfaces) {
      expect(markdown).toContain(`| ${surface.path} |`)
    }
  })

  it("includes monitor-ready metadata on every final row", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    for (const surface of labels.surfaces) {
      expect(surface).toMatchObject({
        owner: expect.any(String),
        reason: expect.any(String),
        risk: expect.any(String),
        privacyClass: expect.any(String),
        gate: expect.any(String),
        futureMigration: expect.any(String),
        monitorStatus: expect.any(String),
        selectedNormal: expect.any(Boolean),
        taxonomyRole: expect.any(String),
        surfaceLabel: expect.any(String),
      })
      expect(surface.owner).not.toBe("")
      expect(surface.reason).not.toBe("")
      expect(surface.risk).not.toBe("")
      expect(surface.privacyClass).not.toBe("")
      expect(surface.gate).not.toBe("")
      expect(surface.monitorStatus).not.toBe("")
    }
  })

  it("labels Workshop flows with the final deferred capability labels", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    const workshopLabels = new Set(
      labels.surfaces
        .filter((surface) => surface.path.includes("workshop"))
        .map((surface) => surface.surfaceLabel),
    )
    expect([...workshopLabels]).toEqual(
      expect.arrayContaining([
        "deferred-workshop-validation",
        "deferred-workshop-private-source",
        "deferred-workshop-test-launch",
        "deferred-workshop-analytics-rerun",
        "deferred-workshop-profile-save",
        "deferred-workshop-export",
        "deferred-workshop-runtime-support",
        "deferred-workshop-ui",
      ]),
    )
  })

  it("labels ladder, governance, owner-debug, test, fixture, parity, rollback, runtime, and frontend groups", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    const surfaceLabels = new Set(labels.surfaces.map((surface) => surface.surfaceLabel))
    for (const expected of [
      "deferred-ladder-mutation",
      "deferred-governance-admin-mutation",
      "private-owner-debug-replay",
      "test-support-route",
      "fixture-only",
      "parity-reference",
      "rollback-only",
      "runtime-service-execution-boundary",
      "runtime-adapter-execution-boundary",
      "frontend-go-adapter",
    ]) {
      expect(surfaceLabels.has(expected)).toBe(true)
    }
  })

  it("labels representative deferred product surfaces by their actual capability instead of a generic or unrelated group", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    const labelsByPath = new Map(
      labels.surfaces.map((surface) => [surface.path, surface]),
    )

    const expected = [
      [
        "apps/web/app/api/workshop/validate/route.ts",
        "deferred-workshop-validation",
        "Workshop",
      ],
      [
        "apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts",
        "deferred-workshop-private-source",
        "Workshop",
      ],
      [
        "apps/web/app/api/workshop/tests/route.ts",
        "deferred-workshop-test-launch",
        "Workshop",
      ],
      [
        "apps/web/app/api/workshop/analytics/profiles/route.ts",
        "deferred-workshop-profile-save",
        "Workshop",
      ],
      [
        "apps/web/app/api/workshop/analytics/export/route.ts",
        "deferred-workshop-export",
        "Workshop",
      ],
      [
        "packages/persistence/src/workshop.ts",
        "deferred-workshop-runtime-support",
        "Workshop",
      ],
      [
        "packages/persistence/src/workshop-analytics.ts",
        "deferred-workshop-runtime-support",
        "Workshop",
      ],
      [
        "apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts",
        "deferred-ladder-mutation",
        "ladder",
      ],
      [
        "apps/web/app/api/ladder/seasons/[seasonId]/schedule/route.ts",
        "deferred-ladder-mutation",
        "ladder",
      ],
      [
        "packages/persistence/src/ladder.ts",
        "deferred-ladder-mutation",
        "ladder",
      ],
      [
        "apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts",
        "deferred-governance-admin-mutation",
        "governance-admin",
      ],
      [
        "packages/persistence/src/governance.ts",
        "deferred-governance-admin-mutation",
        "governance-admin",
      ],
    ] as const

    const mismatches = expected.flatMap(([path, surfaceLabel, capabilityGroup]) => {
      const actual = labelsByPath.get(path)
      const actualSummary = {
        taxonomyRole: actual?.taxonomyRole,
        surfaceLabel: actual?.surfaceLabel,
        capabilityGroup: actual?.capabilityGroup,
        selectedNormal: actual?.selectedNormal,
        normalBackendAuthority: actual?.normalBackendAuthority,
      }
      const expectedSummary = {
        taxonomyRole: "deferred",
        surfaceLabel,
        capabilityGroup,
        selectedNormal: false,
        normalBackendAuthority: false,
      }
      return JSON.stringify(actualSummary) === JSON.stringify(expectedSummary)
        ? []
        : [{ path, expected: expectedSummary, actual: actualSummary }]
    })

    expect(mismatches).toEqual([])
  })

  it("keeps shareable label fields and markdown public-output safe", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    for (const surface of labels.surfaces) {
      expect(() =>
        assertPublicOutputLeakSafe(
          {
            surfaceLabel: surface.surfaceLabel,
            capabilityGroup: surface.capabilityGroup,
            taxonomyRole: surface.taxonomyRole,
            publicOutputPrivacy: surface.publicOutputPrivacy,
            owner: surface.owner,
            reason: surface.reason,
            risk: surface.risk,
            privacyClass: surface.privacyClass,
            gate: surface.gate,
            futureMigration: surface.futureMigration,
            monitorStatus: surface.monitorStatus,
            selectedNormalJustification: surface.selectedNormalJustification,
          },
          `${surface.path} shareable label fields`,
        ),
      ).not.toThrow()
    }

    const markdown = renderFinalTypeScriptSurfaceLabelsMarkdown(labels)
    expect(() => assertPublicOutputLeakSafe(markdown, "final label markdown")).not.toThrow()
    for (const forbidden of [
      "DATABASE_URL",
      "postgres://",
      "Bearer ",
      "PRIVATE_",
      "stack trace",
    ]) {
      expect(markdown).not.toContain(forbidden)
    }
  })

  it("rejects normal backend labels, missing gates, missing future migration, unsafe public examples, and stale artifacts", () => {
    const labels = generateFinalTypeScriptSurfaceLabels()
    expect(validateFinalTypeScriptSurfaceLabels(labels)).toEqual([])
    expect(
      validateFinalTypeScriptSurfaceLabels({
        ...labels,
        surfaces: labels.surfaces.map((surface, index) =>
          index === 0
            ? { ...surface, taxonomyRole: "normal-typescript-backend" }
            : surface,
        ),
      }),
    ).toContainEqual(expect.stringMatching(/normal TypeScript backend/))
    expect(
      validateFinalTypeScriptSurfaceLabels({
        ...labels,
        surfaces: labels.surfaces.map((surface) =>
          surface.taxonomyRole === "deferred"
            ? { ...surface, gate: "", futureMigration: "" }
            : surface,
        ),
      }),
    ).toContainEqual(expect.stringMatching(/missing gate/))
    expect(
      validateFinalTypeScriptSurfaceLabels({
        ...labels,
        surfaces: labels.surfaces.map((surface, index) =>
          index === 0
            ? {
                ...surface,
                publicOutputExample: { strategyMemory: "PRIVATE_MEMORY" },
              }
            : surface,
        ),
      }),
    ).toContainEqual(expect.stringMatching(/public output leak/))

    expect(checkFinalTypeScriptSurfaceLabelArtifacts()).toEqual([])
    expect(readFileSync(".planning/artifacts/v1.16-final-typescript-surface-labels.json", "utf8")).toBe(
      renderFinalTypeScriptSurfaceLabelsJson(labels),
    )
    expect(readFileSync(".planning/artifacts/v1.16-final-typescript-surface-labels.md", "utf8")).toBe(
      renderFinalTypeScriptSurfaceLabelsMarkdown(labels),
    )
  })
})
