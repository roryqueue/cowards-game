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
  it("admits the exact reviewed numeric AST analyzer, not arbitrary factory TypeScript consumers", () => {
    expect(checkFactoryBoundaries({files:{...base,"packages/strategy-lab/src/factory/numeric-calibration.ts":'import ts from "typescript"; ts.createSourceFile("data.ts", text, 9);'}}).ok).toBe(true)
    expect(checkFactoryBoundaries({files:{...base,"packages/strategy-lab/src/factory/unknown.ts":'import ts from "typescript";'}}).ok).toBe(false)
  })
  it.each(["scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-lean-experiment-authority.ts"])("admits the existing static planner emitter transitively from %s without opening other loaders", origin => {
    const emitter = "packages/strategy-lab/src/planner/emit.ts"
    const files = { ...base,
      [origin]: 'import "@cowards/strategy-lab"',
      "packages/strategy-lab/src/index.ts": 'export * from "./planner/emit.js"',
      [emitter]: 'import * as ts from "typescript"; export const parse = ts.createSourceFile;',
    }
    expect(checkFactoryBoundaries({ files })).toEqual(expect.objectContaining({ ok: true, violations: [] }))
    for (const denied of ['import "./missing.js"', 'import "node:child_process"', 'void import(loader)']) {
      expect(checkFactoryBoundaries({ files: { ...files, [emitter]: `${files[emitter]} ${denied}` } }).violations)
        .toContainEqual({ code: "PRIVATE_TRANSITIVE_UNRESOLVED", file: origin })
    }
    expect(checkFactoryBoundaries({ files: { ...files, [emitter]: `${files[emitter]} eval(source)` } }).violations)
      .toContainEqual({ code: "PRIVATE_TRANSITIVE_HOSTILE_EXECUTION", file: origin })
    expect(checkFactoryBoundaries({ files: { ...files,
      [origin]: 'import "./unreviewed.js"',
      [origin.replace(/[^/]+$/u, "unreviewed.ts")]: 'import ts from "typescript"',
    } }).violations).toContainEqual({ code: "PRIVATE_TRANSITIVE_UNRESOLVED", file: origin })
  })
  it("allows only the narrow packet contract from an oracle", () => {
    expect(checkFactoryBoundaries({ files: base })).toEqual(expect.objectContaining({ ok: true, violations: [] }))
  })
  it("keeps the lean CLI and gzip codec private with path-specific builtin allowances", () => {
    const codec = "packages/strategy-lab/src/league/lean-experiment.ts"
    expect(checkFactoryBoundaries({ files: { ...base, [codec]: 'import "node:zlib"', "scripts/run-v1-38-lean-experiment.ts": 'import "node:child_process"', "scripts/lib/v1-38-lean-experiment-authority.ts": "export {}" } }).ok).toBe(true)
    expect(checkFactoryBoundaries({ files: { ...base, "packages/engine/src/codec.ts": 'import "node:zlib"' } }).ok).toBe(false)
    expect(checkFactoryBoundaries({ files: { ...base, "packages/strategy-oracle-model/src/emit.ts": 'import "node:zlib"' } }).ok).toBe(false)
    expect(checkFactoryBoundaries({ files: { ...base, "scripts/lib/v1-38-lean-container-match-session.ts": 'import "node:child_process"' } }).ok).toBe(true)
    expect(checkFactoryBoundaries({ files: { ...base, "scripts/lib/v1-38-lean-experiment-authority.ts": 'import "node:child_process"' } }).violations).toContainEqual(expect.objectContaining({ code: "UNRESOLVED_PRIVATE_LOADER", file: "scripts/lib/v1-38-lean-experiment-authority.ts" }))
    const transitiveUnreviewed = { ...base,
      "scripts/run-v1-38-lean-experiment.ts": 'import "./lean-unreviewed-helper.js"',
      "scripts/lean-unreviewed-helper.ts": 'import "node:child_process"',
    }
    expect(checkFactoryBoundaries({ files: transitiveUnreviewed }).violations).toContainEqual(expect.objectContaining({ code: "PRIVATE_TRANSITIVE_UNRESOLVED", file: "scripts/run-v1-38-lean-experiment.ts" }))
    expect(checkFactoryBoundaries({ files: { ...base, "scripts/lib/v1-38-lean-experiment-authority.ts": 'import "node:zlib"' } }).violations).toContainEqual(expect.objectContaining({ code: "PRIVATE_TRANSITIVE_UNRESOLVED", file: "scripts/lib/v1-38-lean-experiment-authority.ts" }))
    expect(checkFactoryBoundaries({ files: { ...base, [codec]: 'import "node:child_process"' } }).violations).toContainEqual(expect.objectContaining({ code: "UNRESOLVED_PRIVATE_LOADER", file: codec }))
    const publicRoute = { ...base, [codec]: "export const codec = 1", "scripts/run-v1-38-lean-experiment.ts": 'import "../packages/strategy-lab/src/league/lean-experiment.js"', "apps/web/src/page.ts": 'import "../../../scripts/run-v1-38-lean-experiment.js"' }
    expect(checkFactoryBoundaries({ files: publicRoute }).violations.some(v => v.code === "PUBLIC_REACHES_PRIVATE_FACTORY")).toBe(true)
  })

  it("retains exact allowed oracle manifest dependencies without opening package barrels", () => {
    const files = { ...base, "packages/strategy-oracle-model/package.json": JSON.stringify({ dependencies: { "@cowards/strategy-lab": "workspace:*", "@cowards/engine": "workspace:*" } }) }
    expect(checkFactoryBoundaries({ files })).toEqual(expect.objectContaining({ ok: true, violations: [] }))
  })

  it("permits only a declared static third-party dependency inside the audited core closure", () => {
    const files = { ...base,
      "packages/strategy-oracle-model/src/emit.ts": 'import "@cowards/spec"',
      "packages/spec/src/index.ts": 'import "zod"; export const schema = 1',
      "packages/spec/package.json": JSON.stringify({ name: "@cowards/spec", dependencies: { zod: "3.0.0" } }),
    }
    expect(checkFactoryBoundaries({ files })).toEqual(expect.objectContaining({ ok: true, violations: [] }))
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
    ["unknown manifest dependency", { "packages/strategy-oracle-tactical/package.json": JSON.stringify({ dependencies: { "@neutral/package": "workspace:*" } }) }],
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
    ["direct child process", { "packages/strategy-oracle-model/src/emit.ts": 'import { spawn } from "node:child_process"' }],
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

  it.each([
    ["factory transitive hostile core execution", {
      "packages/strategy-lab/src/factory/admission.ts": 'import "@cowards/engine"',
      "packages/engine/src/index.ts": "export const rule = new Function(source)",
    }],
    ["new scorer re-exported by a core barrel", {
      "packages/strategy-oracle-model/src/index.ts": 'import "@cowards/engine"',
      "packages/engine/src/index.ts": 'export * from "./strategy-selector.js"',
      "packages/engine/src/strategy-selector.ts": "export const score = 1",
    }],
    ["shared scorer reachable through an allowed manifest dependency", {
      "packages/strategy-oracle-tactical/package.json": JSON.stringify({ name: "@cowards/strategy-oracle-tactical", dependencies: { "@cowards/spec": "workspace:*" } }),
      "packages/spec/package.json": JSON.stringify({ name: "@cowards/spec", dependencies: { "@cowards/strategy-shared": "workspace:*" }, exports: "./src/index.ts" }),
      "packages/spec/src/index.ts": "export const schema = 1",
      "packages/strategy-shared/package.json": JSON.stringify({ name: "@cowards/strategy-shared", exports: "./src/index.ts" }),
      "packages/strategy-shared/src/index.ts": "export const score = 1",
    }],
    ["transitive dynamic core loader", { "packages/strategy-oracle-model/src/index.ts": 'import "@cowards/engine"', "packages/engine/src/index.ts": "export const rule = import(selectModule())" }],
    ["transitive new Function", { "packages/strategy-oracle-model/src/index.ts": 'import "@cowards/engine"', "packages/engine/src/index.ts": "export const rule = new Function(source)" }],
    ["unaudited direct core scorer", { "packages/strategy-oracle-model/src/index.ts": 'import "../../engine/src/strategy-selector.js"', "packages/engine/src/strategy-selector.ts": "export const score = 1" }],
  ])("rejects transitive core bypass: %s", (_name, files) => {
    expect(checkFactoryBoundaries({ files: { ...base, ...files } }).ok).toBe(false)
  })
})
