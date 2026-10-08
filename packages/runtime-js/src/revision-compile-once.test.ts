import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultRuntimeMetadata } from "@cowards/spec"
import * as compiler from "./transpile.js"
import * as publicApi from "./index.js"
import { buildStrategyRevision } from "./revision.js"
import { buildTypeScriptSourceArtifact } from "./source-artifact.js"
import { validateStrategySource } from "./validation.js"

const source = `export default { selectActivations() { return { activationOrders: [], strategyMemory: {} } }, soldierBrain() { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} } } }`
afterEach(() => vi.restoreAllMocks())

describe("revision compile-once local contract", () => {
  it.each([
    source,
    source + "\nfetch('https://invalid')",
    "export default { selectActivations() {}, soldierBrain( }",
  ])(
    "reuses one real compile with byte-identical standalone output: %s",
    (text) => {
      const runtime = defaultRuntimeMetadata("typescript")
      const validation = validateStrategySource(text, { runtime })
      const artifact = buildTypeScriptSourceArtifact({
        source: text,
        validation,
        runtime,
      })
      const compile = vi.spyOn(compiler, "transpileStrategySource")
      const revision = buildStrategyRevision({
        source: text,
        metadata: { label: "Pinned" },
      })
      expect(compile).toHaveBeenCalledTimes(1)
      expect(compile).toHaveBeenCalledWith(text)
      expect(revision.validation).toEqual(validation)
      expect(revision.metadata).toEqual(
        artifact === null
          ? { label: "Pinned" }
          : { label: "Pinned", sourceArtifact: artifact },
      )
      if (text === source) {
        expect(revision.id).toBe(
          "strategy-revision:61949bdf6422a0ec756462a7dcb47f92b1386670e75308af1cfff7fa22499be6",
        )
        expect(artifact).toMatchObject({
          hash: "3f3b86b0f3cdac5fd3f18f30c851c67c0656c1aaeafb565f75ff0a240fd725a1",
          bytes: 262,
        })
      }
      expect(Object.isFrozen(revision.validation)).toBe(true)
    },
  )
  it("keeps standalone public calls independent and ignores caller compilation injection", () => {
    const runtime = defaultRuntimeMetadata("typescript"),
      expected = validateStrategySource(source, { runtime })
    const compile = vi.spyOn(compiler, "transpileStrategySource")
    const options = { runtime, transpiled: { ok: true, code: "forged" } }
    expect(validateStrategySource(source, options)).toEqual(expected)
    const artifact = buildTypeScriptSourceArtifact({
      source,
      validation: expected,
      runtime,
      ...{ transpiled: options.transpiled },
    })
    expect(compile).toHaveBeenCalledTimes(2)
    expect(Buffer.from(artifact!.bytesBase64!, "base64").toString()).not.toBe(
      "forged",
    )
    expect(Object.keys(publicApi)).not.toContain(
      "validateStrategySourceWithCompilation",
    )
    expect(Object.keys(publicApi)).not.toContain(
      "buildTypeScriptSourceArtifactFromCompilation",
    )
  })
  it("retains metadata override without extra compilation", () => {
    const runtime = defaultRuntimeMetadata("typescript"),
      validation = validateStrategySource(source, { runtime })
    const artifact = buildTypeScriptSourceArtifact({
      source,
      validation,
      runtime,
    })!
    const compile = vi.spyOn(compiler, "transpileStrategySource")
    expect(
      buildStrategyRevision({ source, metadata: { sourceArtifact: artifact } })
        .metadata.sourceArtifact,
    ).toEqual(artifact)
    expect(compile).toHaveBeenCalledTimes(1)
  })
  it("preserves failed compilation diagnostics and null artifact", () => {
    const compile = vi
      .spyOn(compiler, "transpileStrategySource")
      .mockReturnValue({ ok: false, message: "fixture compiler failure" })
    const runtime = defaultRuntimeMetadata("typescript"),
      expected = validateStrategySource(source, { runtime })
    compile.mockClear()
    const revision = buildStrategyRevision({ source })
    expect(revision.validation).toEqual(expected)
    expect(revision.metadata.sourceArtifact).toBeUndefined()
    expect(compile).toHaveBeenCalledTimes(1)
  })
  it("preserves thrown compiler failures", () => {
    vi.spyOn(compiler, "transpileStrategySource").mockImplementation(() => {
      throw new Error("compiler threw")
    })
    expect(() => buildStrategyRevision({ source })).toThrow("compiler threw")
    expect(() => validateStrategySource(source)).toThrow("compiler threw")
  })
  it("keeps non-TypeScript revision behavior and runtime validation unchanged", () => {
    const runtime = defaultRuntimeMetadata("javascript")
    const expected = validateStrategySource(source, { runtime })
    const compile = vi.spyOn(compiler, "transpileStrategySource")
    const revision = buildStrategyRevision({ source, runtime })
    expect(revision.validation).toEqual(expected)
    expect(revision.metadata.sourceArtifact).toBeUndefined()
    expect(compile).toHaveBeenCalledTimes(1)
  })
  it("cannot inject a compiled result through revision input or skip forbidden checks", () => {
    const hostile = source + "\nprocess.env.SECRET; Math.random()"
    const input = { source: hostile, transpiled: { ok: true, code: "forged" } }
    const revision = buildStrategyRevision(input)
    expect(revision.validation.valid).toBe(false)
    expect(revision.validation.forbiddenPatterns).toContain("process.env")
    expect(revision.validation.forbiddenPatterns).toContain("Math.random")
    expect(
      Buffer.from(
        revision.metadata.sourceArtifact!.bytesBase64!,
        "base64",
      ).toString(),
    ).not.toBe("forged")
  })
})
