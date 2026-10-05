import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { gzipSync } from "node:zlib"
import { readFileSync } from "node:fs"
import ts from "typescript"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"

// No empirical helpers or test suites are imported. Real gzip and canonical
// admission operate exclusively on trusted tiny fixtures created below.
const safety = vi.hoisted(() => ({
  deny: () => { throw new Error("REPLAY_VALIDATION_SYNTHETIC_ONLY") },
  directories: new Set<string>(), descriptors: new Set<number>(),
  inflates: [] as number[], order: [] as string[], parsed: [] as string[],
}))
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), spawn: safety.deny, spawnSync: safety.deny, fork: safety.deny, exec: safety.deny, execSync: safety.deny, execFile: safety.deny, execFileSync: safety.deny }))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: safety.deny }))
vi.mock("node:zlib", async original => {
  const zlib = await original<typeof import("node:zlib")>()
  return { ...zlib, gunzipSync: (bytes: Uint8Array, options: { maxOutputLength: number }) => { safety.order.push("inflate"); safety.inflates.push(options.maxOutputLength); return zlib.gunzipSync(bytes, options) } }
})
vi.mock("@cowards/spec", async original => {
  const spec = await original<typeof import("@cowards/spec")>()
  return { ...spec, admitCanonicalJsonBytes: (...args: Parameters<typeof spec.admitCanonicalJsonBytes>) => { safety.parsed.push(Buffer.from(args[0]).toString("utf8")); return spec.admitCanonicalJsonBytes(...args) } }
})
vi.mock("node:fs", async original => {
  const fs = await original<typeof import("node:fs")>()
  const { resolve } = await import("node:path")
  const source = resolve("packages/strategy-lab/src/league/lean-experiment.ts")
  const permit = (path: unknown): void => {
    if (typeof path === "number" && safety.descriptors.has(path)) return
    if (typeof path === "string") {
      const absolute = resolve(path)
      if (absolute === source || [...safety.directories].some(dir => absolute === dir || absolute.startsWith(dir + "/"))) return
    }
    safety.deny()
  }
  return { ...fs,
    readFileSync: ((path: any, ...args: any[]) => { permit(path); return (fs.readFileSync as any)(path, ...args) }) as typeof fs.readFileSync,
    lstatSync: ((path: any, ...args: any[]) => { permit(path); return (fs.lstatSync as any)(path, ...args) }) as typeof fs.lstatSync,
    realpathSync: ((path: any, ...args: any[]) => { permit(path); return (fs.realpathSync as any)(path, ...args) }) as typeof fs.realpathSync,
    readdirSync: ((path: any, ...args: any[]) => { permit(path); return (fs.readdirSync as any)(path, ...args) }) as typeof fs.readdirSync,
    statSync: ((path: any, ...args: any[]) => { permit(path); return (fs.statSync as any)(path, ...args) }) as typeof fs.statSync,
    openSync: ((path: any, ...args: any[]) => { permit(path); const fd = (fs.openSync as any)(path, ...args); safety.descriptors.add(fd); return fd }) as typeof fs.openSync,
    closeSync: (fd: number) => { permit(fd); safety.descriptors.delete(fd); return fs.closeSync(fd) },
    statfsSync: safety.deny,
  }
})

const source = () => readFileSync("packages/strategy-lab/src/league/lean-experiment.ts", "utf8")
const validator = (container: lean.LeanReplayContainer, bytes: Uint8Array, maximumBytes?: number): void => {
  const validate = (lean as unknown as { validateLeanReplay: typeof lean.decodeLeanReplay }).validateLeanReplay
  expect(validate, "additive validation-only seam must exist").toBeTypeOf("function")
  expect(validate(container, bytes, maximumBytes)).toBeUndefined()
}
const rawReplay = (plain: Uint8Array | string, frames: number) => {
  const data = Buffer.from(plain), bytes = gzipSync(data)
  const body = { schemaVersion: "lean-sampled-replay-gzip-v1" as const, privacy: "private_offline" as const, codec: "gzip-node-v1" as const, compressedRoot: lean.leanBytesRoot(bytes), uncompressedRoot: lean.leanBytesRoot(data), compressedBytes: bytes.length, uncompressedBytes: data.length, frames }
  return { bytes, container: { ...body, root: labRoot(body.schemaVersion, body) } }
}
const reroot = (container: lean.LeanReplayContainer, patch: Record<string, unknown>): lean.LeanReplayContainer => {
  const { root: _claimed, ...body } = { ...container, ...patch }
  return { ...body, root: labRoot("lean-sampled-replay-gzip-v1", body) } as lean.LeanReplayContainer
}
const error = (fn: () => unknown): string | undefined => { try { fn(); return undefined } catch (e) { return (e as Error).message } }
const differential = (fixture: ReturnType<typeof rawReplay>, expected?: string, maximumBytes?: number) => {
  const oracle = error(() => lean.decodeLeanReplay(fixture.container, fixture.bytes, maximumBytes))
  expect(oracle).toBe(expected)
  if (oracle) expect(error(() => validator(fixture.container, fixture.bytes, maximumBytes))).toBe(oracle)
  else validator(fixture.container, fixture.bytes, maximumBytes)
}
beforeEach(() => {
  safety.inflates.length = 0; safety.order.length = 0; safety.parsed.length = 0
  // These artificial low values prove guard arithmetic, never host capacity.
  vi.spyOn(process, "memoryUsage").mockImplementation(() => { safety.order.push("guard"); return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 } })
  vi.spyOn(process, "resourceUsage").mockReturnValue({ ...process.resourceUsage(), maxRSS: 0 })
})
afterEach(() => { vi.restoreAllMocks(); expect(safety.descriptors.size).toBe(0) })

describe("contract", () => {
  it("has an additive void seam and keeps canonical values decoder-equivalent", () => {
    const values = [null, true, false, 0, 12, "escaped\nnewline and λ🙂", [], { a: [1, "é"], z: {} }]
    const fixture = lean.encodeLeanReplay(values)
    expect(lean.decodeLeanReplay(fixture.container, fixture.bytes)).toEqual(values)
    validator(fixture.container, fixture.bytes)
  })
  it.each([["", 0, undefined], ["\n", 1, "LEAN_EXPERIMENT_CANONICAL"], ["1\n\n2\n", 3, "LEAN_EXPERIMENT_CANONICAL"], ["1", 1, "LEAN_EXPERIMENT_REPLAY"], ["1\n", 0, "LEAN_EXPERIMENT_REPLAY"], ["1\n", 2, "LEAN_EXPERIMENT_REPLAY"]] as const)("handles newline/count fixture %j", (plain, count, expected) => differential(rawReplay(plain, count), expected))
  it.each(["schemaVersion", "privacy", "codec", "compressedRoot", "uncompressedRoot", "compressedBytes", "uncompressedBytes", "frames", "root"])("refuses missing %s", key => {
    const fixture = rawReplay("1\n", 1), container = { ...fixture.container } as Record<string, unknown>
    delete container[key]
    differential({ ...fixture, container: container as unknown as lean.LeanReplayContainer }, "LEAN_EXPERIMENT_REPLAY")
  })
  it.each([
    { extra: true }, { schemaVersion: "other" }, { privacy: "public" }, { codec: "plain" },
    { compressedRoot: "bad" }, { uncompressedRoot: "bad" }, { root: "bad" },
    { compressedBytes: -1 }, { uncompressedBytes: 0.5 }, { frames: Number.MAX_SAFE_INTEGER + 1 },
    { compressedBytes: 1 }, { uncompressedBytes: 1 }, { compressedRoot: `sha256:${"0".repeat(64)}` },
    { uncompressedRoot: `sha256:${"0".repeat(64)}` }, { uncompressedBytes: 256_000_001 },
  ])("refuses metadata/hash mutation %j", patch => {
    const fixture = rawReplay("1\n", 1)
    differential({ ...fixture, container: reroot(fixture.container, patch) }, "LEAN_EXPERIMENT_REPLAY")
  })
  it("refuses a well-formed but mismatched envelope root", () => {
    const fixture = rawReplay("1\n", 1)
    differential({ ...fixture, container: { ...fixture.container, root: `sha256:${"0".repeat(64)}` } }, "LEAN_EXPERIMENT_REPLAY")
  })
  it.each([0, 1, 2])("actually parses malformed frame at position %i after fully rehashing", position => {
    for (const malformed of ["{", " 1", '{"z":1,"a":2}', '{"a":1,"a":2}', "9007199254740992", "1e999", "[".repeat(130) + "0" + "]".repeat(130)]) {
      const lines = ["1", "2", "3"]; lines[position] = malformed
      differential(rawReplay(lines.join("\n") + "\n", 3), "LEAN_EXPERIMENT_CANONICAL")
    }
  })
  it.each([[0xff], [0xc3], [0xe2, 0x82], [0xf0, 0x9f, 0x99], [0xc3, 0x28]].map(octets => [octets]))("keeps replacement-round-trip UTF-8 semantics %j", octets => {
    const plain = Buffer.concat([Buffer.from('"'), Buffer.from(octets), Buffer.from('"\n')])
    differential(rawReplay(plain, 1))
  })
  it("checks every multibyte/escaped frame through the existing parser", () => {
    const fixture = rawReplay('"λ🙂"\n"escaped\\nline"\n{"a":1}\n', 3)
    validator(fixture.container, fixture.bytes)
    expect(safety.parsed).toEqual(['"λ🙂"', '"escaped\\nline"', '{"a":1}'])
  })
  it("honors exact-bound/one-over/output-limit and truncated or corrupt gzip", () => {
    const fixture = rawReplay('"12345678"\n', 1)
    differential(fixture, undefined, fixture.container.uncompressedBytes)
    differential(fixture, "LEAN_EXPERIMENT_REPLAY", fixture.container.uncompressedBytes - 1)
    differential(rawReplay("", 0), undefined, 0)
    const bomb = rawReplay('"' + "x".repeat(4096) + '"\n', 1)
    differential({ ...bomb, container: reroot(bomb.container, { uncompressedBytes: 16 }) }, "LEAN_EXPERIMENT_REPLAY_LIMIT", 16)
    for (const bytes of [fixture.bytes.subarray(0, -4), Buffer.from("not gzip")]) {
      differential({ bytes, container: reroot(fixture.container, { compressedBytes: bytes.length, compressedRoot: lean.leanBytesRoot(bytes) }) }, "LEAN_EXPERIMENT_REPLAY_LIMIT")
    }
  })
  it("uses the real 4× guard before gunzip and preserves maxOutputLength", () => {
    const fixture = rawReplay("1\n", 1), guardBase = lean.LEAN_CAPS.scratchBytes - lean.LEAN_EXTERNAL_SCRATCH_RESERVE - fixture.container.uncompressedBytes * 4
    vi.mocked(process.memoryUsage).mockImplementation(() => { safety.order.push("guard"); return { rss: guardBase, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 } })
    validator(fixture.container, fixture.bytes, 7)
    expect(safety.order).toEqual(["guard", "inflate"]); expect(safety.inflates).toEqual([7])
    safety.inflates.length = 0
    vi.mocked(process.memoryUsage).mockReturnValue({ rss: guardBase + 1, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 })
    differential(fixture, "LEAN_EXPERIMENT_BUFFER_CAP", 7)
    expect(safety.inflates).toEqual([])
    vi.mocked(process.memoryUsage).mockReturnValue({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 })
    vi.mocked(process.resourceUsage).mockReturnValue({ ...process.resourceUsage(), maxRSS: Math.ceil((guardBase + 1) / 1024) })
    differential(fixture, "LEAN_EXPERIMENT_BUFFER_CAP", 7)
  })
  it("byte-pins unchanged decoder, fixed caps/policy and replay guards", () => {
    const text = source(), digest = (a: string, b: string) => lean.leanBytesRoot(Buffer.from(text.slice(text.indexOf(a), text.indexOf(b, text.indexOf(a)))))
    const decoderStart = text.indexOf("export const decodeLeanReplay ="), decoderEnd = text.indexOf("\n}\n", decoderStart) + 3
    expect(lean.leanBytesRoot(Buffer.from(text.slice(decoderStart, decoderEnd)))).toBe("sha256:b2115d6b20d40a213e5d62398c905bfd306e88078f5bfa51b5a145fba0f08b2c")
    expect(digest("export const LEAN_CAPS =", "const fail =")).toBe("sha256:5263de232b1da25075e3ccbe016414011b23a93d1d607b7aacdae38366fe8486")
    expect(digest("const REPLAY_MAX =", "/** Conservative JSON-size")).toBe("sha256:a7a80f3082cce78eed4a19b7a01276a82bb49a7170bd114004d2dd2070327792")
  })
  it("region-scoped AST forbids validator full text/line/frame collections", () => {
    const file = ts.createSourceFile("lean.ts", source(), ts.ScriptTarget.Latest, true)
    const statement = file.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === "validateLeanReplay"))
    expect(statement).toBeDefined()
    const violations: string[] = []
    const visit = (node: ts.Node): void => {
      if (ts.isArrayLiteralExpression(node) || ts.isNewExpression(node)) violations.push(node.getText(file))
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        if (["split", "map", "push", "reduce", "filter", "fromEntries"].includes(node.expression.name.text)) violations.push(node.getText(file))
        if (node.expression.name.text === "toString" && node.expression.expression.getText(file) === "plain") violations.push("full-payload UTF-8")
      }
      if (ts.isReturnStatement(node) && node.expression && !node.expression.getText(file).startsWith("fail(")) violations.push("returned materialization")
      ts.forEachChild(node, visit)
    }
    if (statement) visit(statement)
    // Metadata arrays used by exact-key/natural checks are allowed; no
    // collection may occur after inflate, where frame retention matters.
    expect(violations.filter(v => !v.startsWith('["schemaVersion"') && !v.startsWith("[container.") && !v.includes(".every("))).toEqual([])
  })
})

describe("wiring", () => {
  it("denies child process and Worker creation by default", async () => {
    const child = await import("node:child_process"), worker = await import("node:worker_threads")
    for (const method of [child.spawn, child.spawnSync, child.fork, child.exec, child.execSync, child.execFile, child.execFileSync]) expect(() => (method as Function)("denied")).toThrow("SYNTHETIC_ONLY")
    expect(() => new worker.Worker("denied")).toThrow("SYNTHETIC_ONLY")
  })
})
