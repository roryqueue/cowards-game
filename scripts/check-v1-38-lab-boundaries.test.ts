import { describe, expect, it } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkLabBoundaries, loadLabBoundaryFiles, validateLabReceipt } from "./check-v1-38-lab-boundaries.js"

const lab = { "packages/strategy-lab/src/index.ts": "export const privateLab = 1" }
describe("one-way lab boundary monitor", () => {
  it("does not read canonical private evidence but still scans copies under public roots", () => {
    const directory = mkdtempSync(join(tmpdir(), "factory-source-inventory-"))
    try {
      mkdirSync(join(directory, ".strategy-lab"))
      mkdirSync(join(directory, "apps/web/public/.strategy-lab"), { recursive: true })
      writeFileSync(join(directory, ".strategy-lab/private.json"), '{"privateTrace":"strategy-lab"}')
      writeFileSync(join(directory, "apps/web/public/.strategy-lab/copied.json"), '{"privateTrace":"strategy-lab"}')
      const files = loadLabBoundaryFiles(directory)
      expect(files).not.toHaveProperty(".strategy-lab/private.json")
      expect(Object.keys(files)).toEqual(["apps/web/public/.strategy-lab/copied.json"])
      expect(checkLabBoundaries({ files }).ok).toBe(false)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it.each([
    'import { privateLab } from "@cowards/strategy-lab"',
    'export * from "@cowards/strategy-lab"',
    'const x = require("@cowards/strategy-lab")',
    'void import("@cowards/strategy-lab")',
    'const target = "@cowards/strategy-lab"; void import(target)',
    'void import("@cowards/strategy-" + "lab")',
    'const target = "@cowards/strategy-lab"; void import(target); function f() { const target = "node:fs"; }',
    'let target = "node:fs"; target = "@cowards/strategy-lab"; void import(target)',
    'let target = "@cowards/strategy-lab"; target = unknownValue; void import(target)',
    'let target = "@cowards/"; target += "strategy-lab"; void import(target)',
  ])("catches production import forms: %s", (source) => {
    expect(checkLabBoundaries({ files: { ...lab, "apps/web/src/index.ts": source } }).ok).toBe(false)
  })
  it("does not resolve a harmless outer binding through a shadowed inner declaration", () => {
    const source = 'const target = "node:fs"; void import(target); function f() { const target = "@cowards/strategy-lab"; }'
    expect(checkLabBoundaries({ files: { ...lab, "apps/web/src/index.ts": source } }).ok).toBe(true)
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
  it("allows TypeScript only in the reviewed factory fingerprint collector", () => {
    expect(checkLabBoundaries({ files: { ...lab, "packages/strategy-lab/src/factory/fingerprint.ts": 'import ts from "typescript"; export { ts }' } }).ok).toBe(true)
  })
  it("allows an unambiguously named local retained-budget capacity check", () => {
    const files = { ...lab,
      "packages/strategy-lab/src/league/budget.ts": "class RetainedBudget { checkCapacity(value: number) { return value } publish(value: number) { return this.checkCapacity(value) } }",
    }
    expect(checkLabBoundaries({ files })).toEqual(expect.objectContaining({ ok: true, violations: [] }))
  })
  it.each([
    "class RetainedBudget { require(value: unknown) { return value } replace(loader: unknown) { this.require = loader as never; return this.require(loader) } }",
    "const module = { require(value: unknown) { return value } }; declare const loader: unknown; module.require(loader)",
    "declare const loader: { require(value: unknown): unknown }; declare const target: unknown; loader.require(target)",
  ])("keeps assigned and non-local require property calls conservative: %s", (source) => {
    const files = { ...lab, "packages/strategy-lab/src/league/loader.ts": source }
    expect(checkLabBoundaries({ files }).violations).toContainEqual({ code: "UNRESOLVED_LAB_EDGE", file: "packages/strategy-lab/src/league/loader.ts" })
  })
  it("recognizes private oracle leaves without treating their contract import as production", () => {
    const files = { ...lab,
      "packages/strategy-oracle-tactical/src/index.ts": 'import type { Packet } from "@cowards/strategy-lab/factory"',
      "packages/strategy-lab/src/factory/index.ts": 'export type { Packet } from "./contracts.js"',
      "packages/strategy-lab/src/factory/contracts.ts": "export interface Packet { sourceRoot: string }",
    }
    expect(checkLabBoundaries({ files }).ok).toBe(true)
  })
  it.each(["tactical", "teacher", "model"])("rejects direct, transitive, and deployment exposure of the %s oracle", (family) => {
    const oracle = `packages/strategy-oracle-${family}/src/index.ts`
    const base = { [oracle]: "export const privateOracle = 1" }
    expect(checkLabBoundaries({ files: { ...base, "apps/web/src/index.ts": `import "@cowards/strategy-oracle-${family}"` } }).ok).toBe(false)
    expect(checkLabBoundaries({ files: { ...base,
      "apps/web/src/index.ts": 'import "../../../scripts/bridge.js"',
      "scripts/bridge.ts": `export * from "../${oracle.replace(/\.ts$/u, ".js")}"`,
    } }).violations.some(v => v.code === "PRODUCTION_REACHES_LAB")).toBe(true)
    expect(checkLabBoundaries({ files: { ...base, "deploy/service.yaml": `include: packages/strategy-oracle-${family}` } }).ok).toBe(false)
    expect(checkLabBoundaries({ files: { ...base, "Dockerfile": "COPY . /app", ".dockerignore": "packages/strategy-lab\n" } }).ok).toBe(false)
    expect(checkLabBoundaries({ files: { ...base, "Dockerfile": "COPY . /app", ".dockerignore": `packages/strategy-lab\npackages/strategy-oracle-${family}\n` } }).ok).toBe(true)
    expect(checkLabBoundaries({ files: { ...base, "Dockerfile": "COPY . /app", ".dockerignore": `packages/strategy-lab\npackages/strategy-oracle-${family}\n!packages/strategy-oracle-${family}/src\n` } }).ok).toBe(false)
  })
  it.each([
    "COPY --chown=1000:1000 . /app",
    "COPY --chmod=755 --link . /app",
    'COPY --chown=1000:1000 ["./", "/app"]',
    "COPY --from=builder . /app",
    "ADD --checksum=sha256:abc . /app",
    "COPY packages /app/packages",
    ["COPY --chown=1000:1000 \\", "      . /app"].join("\n"),
  ])("inspects flagged and broad image copies: %s", (instruction) => {
    const files = { ...lab, "Dockerfile": instruction }
    expect(checkLabBoundaries({ files }).violations.some(v => v.code === "IMAGE_INCLUDES_LAB")).toBe(true)
  })
  it("requires documented literal exclusion policy and does not treat stage sources as context", () => {
    const files = { ...lab, "Dockerfile": "COPY --chown=1000:1000 . /app", ".dockerignore": "packages/strategy-lab\n" }
    expect(checkLabBoundaries({ files }).ok).toBe(true)
    expect(checkLabBoundaries({ files: { ...files, ".dockerignore": "packages/strategy-*\n" } }).ok).toBe(false)
    expect(checkLabBoundaries({ files: { ...files, "Dockerfile": "COPY --from=builder . /app" } }).ok).toBe(false)
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
