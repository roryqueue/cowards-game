import { describe, expect, it } from "vitest"
import { checkFactoryBoundaries } from "./check-v1-38-factory-boundaries.js"

const base = {
  "packages/strategy-lab/src/factory/packet.ts": "export const packet = 1",
  "packages/strategy-lab/src/factory/contracts.ts": "export const contract = 1",
  "packages/strategy-lab/src/factory/identity.ts": "export const identity = 1",
  "packages/strategy-oracle-tactical/src/emit.ts": 'import { packet } from "@cowards/strategy-lab/factory/packet"; export { packet }',
  "packages/strategy-oracle-teacher/src/emit.ts": "export const teacher = 1",
  "packages/strategy-oracle-model/src/emit.ts": "export const model = 1",
}

describe("private factory dependency boundary", () => {
  it("allows only the narrow packet contract from an oracle", () => {
    expect(checkFactoryBoundaries({ files: base })).toEqual(expect.objectContaining({ ok: true, violations: [] }))
  })

  it.each([
    ["direct oracle sharing", { "packages/strategy-oracle-tactical/src/emit.ts": 'import "@cowards/strategy-oracle-teacher"' }],
    ["transitive planner sharing", { "packages/strategy-oracle-tactical/src/emit.ts": 'import "./bridge.js"', "packages/strategy-oracle-tactical/src/bridge.ts": 'export * from "../../strategy-lab/src/planner/selector.js"' }],
    ["factory leaf reach", { "packages/strategy-lab/src/factory/admission.ts": 'import "@cowards/strategy-oracle-model"' }],
    ["barrel factory reach", { "packages/strategy-oracle-model/src/emit.ts": 'export * from "../../strategy-lab/src/factory/index.js"' }],
    ["computed private loader", { "packages/strategy-oracle-model/src/emit.ts": 'const leaf = "@cowards/strategy-oracle-" + "teacher"; void import(leaf)' }],
    ["unresolved private loader", { "packages/strategy-oracle-model/src/emit.ts": "void import(loader)" }],
    ["hostile execution", { "packages/strategy-oracle-model/src/emit.ts": "eval('candidate')" }],
    ["strategic manifest edge", { "packages/strategy-oracle-tactical/package.json": JSON.stringify({ dependencies: { "@cowards/strategy-oracle-teacher": "workspace:*" } }) }],
    ["strategic package entrypoint", { "packages/strategy-oracle-tactical/package.json": JSON.stringify({ exports: { ".": "./src/selector.ts" } }) }],
    ["production route", { "apps/web/src/bridge.ts": 'export * from "@cowards/strategy-oracle-model"' }],
    ["public artifact", { "apps/web/public/factory.json": '{"privateTrace":"factory"}' }],
  ])("rejects %s", (_name, files) => {
    expect(checkFactoryBoundaries({ files: { ...base, ...files } }).ok).toBe(false)
  })

  it("keeps lexical reassignment and conditional loader possibilities in the shared graph", () => {
    const files = { ...base,
      "packages/strategy-oracle-teacher/src/index.ts": "export const teacher = 1",
      "packages/strategy-oracle-model/src/emit.ts": 'let dep = "@cowards/spec"; dep = "@cowards/strategy-oracle-teacher"; void import(dep)',
    }
    expect(checkFactoryBoundaries({ files }).violations.some(entry => entry.code === "ORACLE_EXTERNAL_ROUTE")).toBe(true)
  })

  it.each([
    ["shared scoring helper", { "packages/strategy-oracle-model/src/emit.ts": 'import "../../strategy-shared/src/scoring.js"', "packages/strategy-shared/src/scoring.ts": "export const score = 1" }],
    ["node vm", { "packages/strategy-oracle-model/src/emit.ts": 'import vm from "node:vm"; vm.runInNewContext(source)' }],
    ["new Function", { "packages/strategy-oracle-model/src/emit.ts": "new Function('candidate')" }],
    ["package prefix spoof", { "packages/strategy-oracle-model/src/emit.ts": 'import "@cowards/spec-evil"' }],
    ["public generated consumer", { "public/generated/consumer.ts": 'export * from "@cowards/strategy-oracle-model"', "packages/strategy-oracle-model/src/index.ts": "export const model = 1" }],
    ["neutral manifest re-export", {
      "packages/strategy-oracle-model/src/emit.ts": 'import "@neutral/package"',
      "packages/neutral/package.json": JSON.stringify({ name: "@neutral/package", exports: { ".": "./src/bridge.ts" } }),
      "packages/neutral/src/bridge.ts": 'export * from "@cowards/strategy-oracle-teacher"',
      "packages/strategy-oracle-teacher/src/index.ts": "export const teacher = 1",
    }],
    ["tsconfig alias re-export", {
      "tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@neutral/*": ["packages/neutral/*"] } } }),
      "packages/strategy-oracle-model/src/emit.ts": 'import "@neutral/bridge"',
      "packages/neutral/bridge.ts": 'export * from "@cowards/strategy-oracle-teacher"',
      "packages/strategy-oracle-teacher/src/index.ts": "export const teacher = 1",
    }],
  ])("rejects review bypass: %s", (_name, files) => {
    expect(checkFactoryBoundaries({ files: { ...base, ...files } }).ok).toBe(false)
  })
})
