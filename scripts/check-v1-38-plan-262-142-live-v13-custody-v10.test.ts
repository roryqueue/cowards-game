import { execFile, execFileSync } from "node:child_process"
import {
  chmodSync, constants, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync,
  symlinkSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  authenticateV138Plan142ProspectiveV10BatchForReview,
  buildV138Plan142ProspectiveV10ForReview,
  checkV138Plan142EffectPathsAbsentForReview,
  checkV138Plan142SourceOnlyForReview,
  inspectV138Plan142SemanticRuntimeForReview,
  V138_PLAN142_EFFECT_PATHS,
} from "./check-v1-38-plan-262-142-live-v13-custody-v10.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OWNERS: string[] = []
const owner = (): string => { const value = mkdtempSync(path.join(tmpdir(), "v138-plan142-test-")); OWNERS.push(value); return value }
afterAll(() => { for (const value of OWNERS) rmSync(value, { recursive: true, force: true }) })

const copyRuntime = (destination: string): void => {
  const modules = path.join(destination, "node_modules")
  mkdirSync(path.join(modules, ".bin"), { recursive: true })
  cpSync(path.join(ROOT, "node_modules/.bin/tsx"), path.join(modules, ".bin/tsx"))
  const packages = new Map<string, string>()
  for (const { identity } of inspectV138Plan142SemanticRuntimeForReview(ROOT).entries) {
    const match = /^runtime\/package\/(.+)@([^/]+)\/package\.json$/u.exec(identity)
    if (match !== null) packages.set(match[1]!, match[2]!)
  }
  const pnpm = path.join(ROOT, "node_modules/.pnpm"); const folders = readdirSync(pnpm)
  for (const [name, version] of packages) {
    const prefix = `${name.replace("/", "+")}@${version}`
    const folder = folders.find((item) => item === prefix || item.startsWith(`${prefix}_`))
    if (folder === undefined && !name.startsWith("@cowards/")) throw new Error(`TEST_RUNTIME_PACKAGE_MISSING:${name}`)
    const source = folder === undefined ? path.join(ROOT, name === "@cowards/runtime-service" ? "apps" : "packages", name.slice("@cowards/".length))
      : path.join(pnpm, folder, "node_modules", name)
    const destinationPackage = path.join(modules, name)
    mkdirSync(path.dirname(destinationPackage), { recursive: true })
    cpSync(source, destinationPackage, { recursive: true, mode: constants.COPYFILE_FICLONE,
      filter: (candidate) => candidate !== path.join(source, "node_modules") })
  }
}
const cloneRepository = (runtime = true): string => {
  const destination = path.join(owner(), "checkout")
  execFileSync("git", ["clone", "--quiet", "--no-local", ROOT, destination])
  if (runtime) copyRuntime(destination)
  return destination
}
const scanPrivacy = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  expect(serialized).not.toContain(ROOT); expect(serialized).not.toContain(tmpdir())
  expect(serialized).not.toMatch(/file:\/\//u); expect(serialized).not.toMatch(/[A-Za-z]:[\\/]/u)
  expect(serialized).not.toMatch(/"\/(?:Users|home|private|tmp|var)\//u)
}
const freshProcess = async (root: string): Promise<string> => (await promisify(execFile)(process.execPath,
  ["--import", "tsx", path.join(ROOT, "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"), "--emit-prospective", root],
  { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })).stdout

let BASE: Awaited<ReturnType<typeof buildV138Plan142ProspectiveV10ForReview>>
beforeAll(async () => { BASE = await buildV138Plan142ProspectiveV10ForReview(ROOT) }, 480_000)

describe("Plan 262-142 semantic runtime custody v10", () => {
  it("content-addresses Node, launcher, complete TypeScript/tsx/esbuild/native trees and loaded transitives", () => {
    const runtime = inspectV138Plan142SemanticRuntimeForReview(ROOT)
    expect(runtime.entries.length).toBeGreaterThan(190)
    expect(runtime.entries.map((entry) => entry.identity)).toEqual(
      [...runtime.entries.map((entry) => entry.identity)].sort())
    expect(new Set(runtime.entries.map((entry) => entry.identity)).size).toBe(runtime.entries.length)
    for (const entry of runtime.entries) {
      expect(entry.identity).not.toMatch(/^\//u); expect(entry.identity).not.toContain("..")
      expect(entry.sha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(["100644", "100755"]).toContain(entry.mode)
    }
    const identities = runtime.entries.map((entry) => entry.identity)
    expect(identities).toContain("runtime/node/executable")
    expect(identities).toContain("runtime/launcher/tsx")
    expect(identities.some((value) => /typescript@[^/]+\/lib\/typescript\.js$/u.test(value))).toBe(true)
    expect(identities.some((value) => /tsx@[^/]+\/dist\/cli\.mjs$/u.test(value))).toBe(true)
    expect(identities.some((value) => /tsx@[^/]+\/dist\/.*\.(?:cjs|mjs)$/u.test(value))).toBe(true)
    expect(identities.some((value) => /esbuild@[^/]+\/lib\/main\.js$/u.test(value))).toBe(true)
    expect(identities.some((value) => /@esbuild\/[^@]+@[^/]+\/bin\/esbuild$/u.test(value))).toBe(true)
    expect(runtime.semanticRuntimeRoot).toBe(BASE.payload.semanticRuntime.semanticRuntimeRoot)
    scanPrivacy(runtime); scanPrivacy(BASE)
  })

  it("rejects runtime omission, symlink, non-regular entry, and coherent dependency substitution", () => {
    const attacks: Array<(root: string) => void> = [
      (root) => writeFileSync(path.join(root, "node_modules/typescript/lib/typescript.js"), "module.exports={}", { flag: "w" }),
      (root) => writeFileSync(path.join(root, "node_modules/tsx/dist/cli.mjs"), "process.exit(0)", { flag: "w" }),
      (root) => writeFileSync(path.join(root, "node_modules/esbuild/lib/main.js"), "module.exports={}", { flag: "w" }),
      (root) => { const file = path.join(root, "node_modules/tsx/dist/cli.mjs"); rmSync(file); symlinkSync("cli.cjs", file) },
      (root) => { const file = path.join(root, "node_modules/typescript/lib/typescript.js"); rmSync(file); mkdirSync(file) },
      (root) => rmSync(path.join(root, "node_modules/esbuild/lib/main.js")),
      (root) => writeFileSync(path.join(root, "node_modules/tsx/dist/extra.mjs"), "export {}"),
      (root) => { const dir = path.join(root, "node_modules/tsx/dist")
        const chunk = readdirSync(dir).find((name) => name.startsWith("register-") && name.endsWith(".mjs"))!
        writeFileSync(path.join(dir, chunk), "export {}") },
      (root) => writeFileSync(path.join(root, `node_modules/@esbuild/${process.platform}-${process.arch}/bin/esbuild`), "not-esbuild"),
      (root) => chmodSync(path.join(root, "node_modules/typescript/lib/typescript.js"), 0o000),
      (root) => writeFileSync(path.join(root, "node_modules/@cowards/spec/src/index.ts"), "export {}"),
      (root) => writeFileSync(path.join(root, "node_modules/vitest/package.json"), '{"name":"vitest","version":"0.0.0"}'),
    ]
    for (const attack of attacks) {
      const root = cloneRepository(); attack(root)
      expect(() => inspectV138Plan142SemanticRuntimeForReview(root)).toThrow()
    }
  }, 480_000)

  it("binds every transcript to the exact authenticated supplied root and rejects mixed batches", () => {
    expect(authenticateV138Plan142ProspectiveV10BatchForReview([BASE], ROOT)).toEqual([{ accepted: true }])
    const empty = owner(); const copied = structuredClone(BASE)
    expect(authenticateV138Plan142ProspectiveV10BatchForReview([BASE, copied], empty)
      .every((item) => !item.accepted)).toBe(true)
    const other = cloneRepository()
    expect(authenticateV138Plan142ProspectiveV10BatchForReview([BASE], other)[0]).toMatchObject({ accepted: false })
    const local = buildV138Plan142ProspectiveV10ForReview(other)
    expect(authenticateV138Plan142ProspectiveV10BatchForReview([local, BASE], other))
      .toEqual([{ accepted: true }, expect.objectContaining({ accepted: false })])
    const source = path.join(other, "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts")
    const original = readFileSync(source)
    writeFileSync(source, Buffer.concat([original, Buffer.from("\n// source drift\n")]))
    expect(authenticateV138Plan142ProspectiveV10BatchForReview([local], other)[0]).toMatchObject({ accepted: false })
    writeFileSync(source, original)
    execFileSync("git", ["-C", other, "config", "core.ignorecase", "false"])
    expect(authenticateV138Plan142ProspectiveV10BatchForReview([local], other)[0]).toMatchObject({ accepted: false })
  }, 480_000)

  it("walks every component of all eleven effect paths without following links", () => {
    expect(V138_PLAN142_EFFECT_PATHS).toHaveLength(11)
    for (const repoPath of V138_PLAN142_EFFECT_PATHS) {
      const components = repoPath.split("/")
      for (let index = 0; index < components.length; index += 1) {
        for (const kind of ["symlink", "file"] as const) {
          const root = owner(); const parent = path.join(root, ...components.slice(0, index))
          mkdirSync(parent, { recursive: true }); const attacked = path.join(parent, components[index]!)
          if (kind === "symlink") symlinkSync(path.join(root, "redirect"), attacked)
          else writeFileSync(attacked, "occupied")
          expect(() => checkV138Plan142EffectPathsAbsentForReview(root)).toThrow(/V138_PLAN142_/u)
        }
      }
    }
    const inaccessible = owner(); const ancestor = path.join(inaccessible, ".planning")
    mkdirSync(ancestor); chmodSync(ancestor, 0o000)
    try { expect(() => checkV138Plan142EffectPathsAbsentForReview(inaccessible)).toThrow(/V138_PLAN142_/u) }
    finally { chmodSync(ancestor, 0o700) }
  })

  it("rejects component replacement races and accepts only unchanged final ENOENT", async () => {
    const root = owner(); mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
    expect(checkV138Plan142EffectPathsAbsentForReview(root)).toBe(true)
    const artifacts = path.join(root, ".planning/artifacts"); const replacement = path.join(root, ".replacement")
    mkdirSync(replacement)
    const attacker = execFile("/bin/sh", ["-c", "while :; do mv \"$1\" \"$1.old\" 2>/dev/null || true; mv \"$2\" \"$1\" 2>/dev/null || true; mv \"$1.old\" \"$2\" 2>/dev/null || true; done", "_", artifacts, replacement])
    let rejected = false
    try {
      for (let attempt = 0; attempt < 200 && !rejected; attempt += 1) {
        try { checkV138Plan142EffectPathsAbsentForReview(root) } catch { rejected = true }
      }
    } finally { attacker.kill() }
    expect(rejected).toBe(true)
  })

  it("retains metadata, mapping, six-run, privacy, false-authority, and distinct-root determinism", async () => {
    expect(BASE.payload.observations).toHaveLength(6)
    expect(new Set(BASE.payload.observations.map((item) => item.stableRecordRoot)).size).toBe(6)
    expect(BASE.payload.plan143Eligible).toBe(true); expect(BASE.payload.plan110Eligible).toBe(false)
    expect(BASE.payload.authorizesExecution).toBe(false); expect(BASE.payload.downstreamAuthority).toBe("denied")
    const mutations = [
      (value: any) => value.payload.observations.reverse(),
      (value: any) => value.payload.nativeIdentities.reverse(),
      (value: any) => value.payload.semanticRuntime.entries.reverse(),
      (value: any) => value.payload.semanticRuntime.entries.pop(),
      (value: any) => value.payload.semanticRuntime.entries.push(value.payload.semanticRuntime.entries[0]),
      (value: any) => { value.payload.observations[0].producerGuardCount = 1 },
      (value: any) => { value.payload.plan110Eligible = true },
    ].map((mutate) => { const value = structuredClone(BASE); mutate(value); return value })
    expect(authenticateV138Plan142ProspectiveV10BatchForReview(mutations, ROOT).every((item) => !item.accepted)).toBe(true)
    const [leftRoot, rightRoot] = [cloneRepository(), cloneRepository()]
    const [left, right] = await Promise.all([freshProcess(leftRoot), freshProcess(rightRoot)])
    expect(right).toBe(left); scanPrivacy(JSON.parse(left))
    const sourceOnly = checkV138Plan142SourceOnlyForReview(ROOT)
    expect(sourceOnly).toMatchObject({ sourceOnly: true, plan143Eligible: false,
      plan110Eligible: false, producerCalls: 0, readinessInvoked: false, liveInvoked: false,
      freshCharged: 0, freshAccepted: 0, authorizesExecution: false,
      downstreamAuthority: "denied" })
  }, 480_000)
})
