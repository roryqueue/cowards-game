import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
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
