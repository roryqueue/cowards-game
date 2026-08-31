import childProcess, { execFile, execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { syncBuiltinESMExports } from "node:module"
import {
  chmodSync, constants, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync,
  symlinkSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { afterAll, describe, expect, it, vi } from "vitest"
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
const baseline = () => BASE ??= buildV138Plan142ProspectiveV10ForReview(ROOT)

describe("Plan 262-142 semantic runtime custody v10", () => {
  it("content-addresses Node, launcher, complete TypeScript/tsx/esbuild/native trees and loaded transitives", () => {
    baseline()
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
  }, 480_000)

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
    baseline()
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

  it("anchors the actual final lookup through a deterministic transient ancestor ABA", () => {
    const root = owner(); mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
    expect(checkV138Plan142EffectPathsAbsentForReview(root)).toBe(true)
    const build = owner(); const artifacts = path.join(root, ".planning/artifacts")
    const saved = path.join(root, ".planning/saved"); const redirect = path.join(root, "redirect")
    mkdirSync(redirect)
    const source = readFileSync(path.join(ROOT, "scripts/native/v1-38-secure-manifest-reader-v6.c"), "utf8")
    expect(createHash("sha256").update(source).digest("hex"))
      .toBe("fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1")
    // Test-only scheduler around the existing final fstatat. All stat results
    // come from real syscalls; the production reader/bootstrap are unchanged.
    const lookup = "fstatat(dirs[parent].fd, name, &status, AT_SYMLINK_NOFOLLOW)"
    expect(source.split(lookup)).toHaveLength(2)
    const scheduled = source.replace("static void require_absences(void) {", `
static int scheduled_lookup(int descriptor, const char *name, struct stat *status, int flags) {
  static int calls = 0;
  if (++calls != 4 * ${V138_PLAN142_EFFECT_PATHS.length}) return fstatat(descriptor, name, status, flags);
  if (rename(${JSON.stringify(artifacts)}, ${JSON.stringify(saved)}) != 0 ||
      symlink(${JSON.stringify(redirect)}, ${JSON.stringify(artifacts)}) != 0) die("TEST_SWAP_FAILED");
  struct stat link, retained, actual;
  if (lstat(${JSON.stringify(artifacts)}, &link) != 0 || !S_ISLNK(link.st_mode) ||
      fstat(descriptor, &retained) != 0 || stat(${JSON.stringify(saved)}, &actual) != 0 ||
      retained.st_dev != actual.st_dev || retained.st_ino != actual.st_ino) die("TEST_NOT_ANCHORED");
  int result = fstatat(descriptor, name, status, flags), saved_errno = errno;
  if (unlink(${JSON.stringify(artifacts)}) != 0 ||
      rename(${JSON.stringify(saved)}, ${JSON.stringify(artifacts)}) != 0) die("TEST_RESTORE_FAILED");
  fprintf(stderr, "TEST_FINAL_ABA_ANCHORED\\n"); errno = saved_errno; return result;
}
static void require_absences(void) {`).replace(lookup,
      "scheduled_lookup(dirs[parent].fd, name, &status, AT_SYMLINK_NOFOLLOW)")
    const instrumented = path.join(build, "scheduled.c"); const executable = path.join(build, "scheduled")
    writeFileSync(instrumented, scheduled)
    execFileSync("/usr/bin/clang", ["-std=c11", "-Wall", "-Wextra", "-Werror", instrumented, "-o", executable])
    const realSpawn = childProcess.spawnSync
    let scheduledLookups = 0
    const intercepted = vi.spyOn(childProcess, "spawnSync").mockImplementation(((file, args, options) => {
      if (String(file).includes("v138-secure-reader-v6-") && String(file).endsWith("/primary/native")) {
        expect(options?.input).toBe([...V138_PLAN142_EFFECT_PATHS].sort().map((item) => `A\t${item}\n`).join(""))
        const result = realSpawn(executable, args, options)
        expect(String(result.stderr)).toContain("TEST_FINAL_ABA_ANCHORED")
        scheduledLookups += 1
        return result
      }
      return realSpawn(file, args, options)
    }) as typeof spawnSync)
    syncBuiltinESMExports()
    try {
      // At the last lookup the reader resolves through the retained artifacts
      // descriptor, never through the temporary symlink. Safe anchored absence
      // is permitted even though a directory rename occurred during the lookup.
      expect(checkV138Plan142EffectPathsAbsentForReview(root)).toBe(true)
      expect(scheduledLookups).toBe(1)
    } finally { intercepted.mockRestore(); syncBuiltinESMExports() }
    const rootLink = path.join(owner(), "root-link"); symlinkSync(root, rootLink)
    expect(() => checkV138Plan142EffectPathsAbsentForReview(rootLink)).toThrow("V138_PLAN142_EFFECT_COMPONENT_INVALID")
  }, 60_000)

  it("retains metadata, mapping, six-run, privacy, false-authority, and distinct-root determinism", async () => {
    baseline()
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
