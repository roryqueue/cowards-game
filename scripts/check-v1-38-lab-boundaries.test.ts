import { describe, expect, it } from "vitest"
import { checkLabBoundaries, validateLabReceipt } from "./check-v1-38-lab-boundaries.js"

const lab = { "packages/strategy-lab/src/index.ts": "export const privateLab = 1" }
describe("one-way lab boundary monitor", () => {
  it.each([
    'import { privateLab } from "@cowards/strategy-lab"',
    'export * from "@cowards/strategy-lab"',
    'const x = require("@cowards/strategy-lab")',
    'void import("@cowards/strategy-lab")',
    'const target = "@cowards/strategy-lab"; void import(target)',
    'void import("@cowards/strategy-" + "lab")',
  ])("catches production import forms: %s", (source) => {
    expect(checkLabBoundaries({ files: { ...lab, "apps/web/src/index.ts": source } }).ok).toBe(false)
  })
  it("resolves aliases and transitive reexports rather than just direct text", () => {
    const files = { ...lab,
      "tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@hidden/*": ["scripts/*"] } } }),
      "apps/web/src/index.ts": 'import "@hidden/middle"',
      "scripts/middle.ts": 'export * from "../packages/strategy-lab/src/index.js"',
    }
    expect(checkLabBoundaries({ files }).violations.some((v) => v.code === "PRODUCTION_REACHES_LAB")).toBe(true)
  })
  it.each(["apps/web/src/index", "packages/persistence/src/index", "packages/unknown/src/index"])("rejects core reverse edges to %s", (target) => {
    expect(checkLabBoundaries({ files: { ...lab, "packages/strategy-lab/src/core.ts": `import "../../../${target}.js"`, [`${target}.ts`]: "export {}" } }).ok).toBe(false)
  })
  it("allows core canonical dependencies and trusted offline Node APIs", () => {
    expect(checkLabBoundaries({ files: { ...lab, "packages/strategy-lab/src/core.ts": 'import "@cowards/spec"; import "node:crypto"', "packages/spec/src/index.ts": "export {}" } }).ok).toBe(true)
    expect(checkLabBoundaries({ files: { ...lab, "packages/strategy-lab/src/core.ts": 'import "node:vm"' } }).ok).toBe(false)
  })
  it.each([
    ["apps/go-backend/main.go", 'import "cowards/strategy-lab"'],
    ["packages/spec/artifacts/generated.json", '{"privateTrace":"lab-artifacts"}'],
    ["Dockerfile", "COPY packages/strategy-lab /app/lab"],
    ["Dockerfile", "COPY . /app"],
    ["deploy/service.yaml", "volumes: [./lab-artifacts:/public]"],
    ["apps/web/public/receipt.json", '{"strategyMemory":{}}'],
  ])("catches image, Go, generated and public exposure in %s", (path, source) => {
    expect(checkLabBoundaries({ files: { ...lab, [path]: source } }).ok).toBe(false)
  })
  it("rejects unresolved potentially lab-directed paths", () => {
    expect(checkLabBoundaries({ files: { "apps/web/src/a.ts": 'import "@private-lab/missing"' } }).ok).toBe(false)
  })
  it("allowlists receipt fields without accepting raw diagnostics or private payloads", () => {
    const receipt = { schemaVersion: "lab-receipt-v1", status: "not_run", counts: { allocated: 24, completed: 0, failed: 0, unused: 24 }, protocolRoot: `sha256:${"a".repeat(64)}`, semanticRoot: null, operationalRoot: null }
    expect(validateLabReceipt(receipt)).toEqual(receipt)
    for (const field of ["source", "strategyMemory", "objective", "privateTrace", "error", "hostPath"]) expect(() => validateLabReceipt({ ...receipt, [field]: "private" })).toThrow()
    expect(() => validateLabReceipt({ ...receipt, counts: { ...receipt.counts, completed: 1 } })).toThrow()
  })
  it("checks the actual repository without adding production imports", () => {
    expect(checkLabBoundaries()).toEqual(expect.objectContaining({ ok: true, violations: [] }))
  }, 30000)
})
