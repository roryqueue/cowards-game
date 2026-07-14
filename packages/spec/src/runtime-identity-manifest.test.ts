import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { CANONICAL_IDENTITY_DOMAIN_NAMES } from "./canonical-identity-domains.js"
import { parseCanonicalJson } from "./canonical-json-parse.js"
import {
  RuntimeIdentityManifestError,
  hashRuntimeIdentityManifest,
  serializeRuntimeIdentityManifest,
  type RuntimeIdentityManifest,
} from "./runtime-identity-manifest.js"

const digest = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const manifest = (): RuntimeIdentityManifest => ({
  schemaVersion: "runtime-identity-manifest-v1",
  profile: "runtime-identity-v1",
  bindings: CANONICAL_IDENTITY_DOMAIN_NAMES.map((domain) => ({
    domain,
    publicId: `${domain}:public-v1`,
    sha256: digest(domain),
  })),
})

describe("canonical runtime identity manifest", () => {
  it("serializes one exact binding for every closed domain", () => {
    const bytes = serializeRuntimeIdentityManifest(manifest())
    const parsed = parseCanonicalJson(bytes, {
      context: "canonical-manifest",
      operation: "require-canonical",
    })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      const value = parsed.value as unknown as { bindings: readonly unknown[] }
      expect(value.bindings).toHaveLength(15)
    }
  })

  it("normalizes top-level insertion and binding order before hashing", () => {
    const first = manifest()
    const reordered = {
      bindings: [...first.bindings].reverse(),
      profile: first.profile,
      schemaVersion: first.schemaVersion,
    } as RuntimeIdentityManifest
    expect(Buffer.from(serializeRuntimeIdentityManifest(first))).toEqual(
      Buffer.from(serializeRuntimeIdentityManifest(reordered)),
    )
    expect(hashRuntimeIdentityManifest(first)).toBe(hashRuntimeIdentityManifest(reordered))
  })

  it("rejects missing, unknown, duplicate, and extra semantic bindings", () => {
    const valid = manifest()
    expect(() =>
      serializeRuntimeIdentityManifest({ ...valid, bindings: valid.bindings.slice(1) }),
    ).toThrow(RuntimeIdentityManifestError)
    expect(() =>
      serializeRuntimeIdentityManifest({
        ...valid,
        bindings: [
          ...valid.bindings.slice(0, -1),
          { domain: "unknown", publicId: "unknown:public", sha256: "a".repeat(64) },
        ],
      } as RuntimeIdentityManifest),
    ).toThrow(RuntimeIdentityManifestError)
    expect(() =>
      serializeRuntimeIdentityManifest({
        ...valid,
        bindings: [...valid.bindings, valid.bindings[0]!],
      }),
    ).toThrow(RuntimeIdentityManifestError)
    expect(() =>
      serializeRuntimeIdentityManifest({ ...valid, extra: true } as RuntimeIdentityManifest),
    ).toThrow(RuntimeIdentityManifestError)
    expect(() =>
      serializeRuntimeIdentityManifest({
        ...valid,
        bindings: valid.bindings.map((binding, index) =>
          index === 0 ? { ...binding, extra: "private" } : binding,
        ),
      } as RuntimeIdentityManifest),
    ).toThrow(RuntimeIdentityManifestError)
  })

  it("changes identity when one exact binding byte changes", () => {
    const first = manifest()
    const altered: RuntimeIdentityManifest = {
      ...first,
      bindings: first.bindings.map((binding, index) =>
        index === 0 ? { ...binding, sha256: "f".repeat(64) } : binding,
      ),
    }
    expect(hashRuntimeIdentityManifest(first)).not.toBe(hashRuntimeIdentityManifest(altered))
  })

  it("contains no ambient serializer or locale ordering authority", () => {
    for (const name of ["canonical-identity-domains.ts", "runtime-identity-manifest.ts"]) {
      const source = readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), "utf8")
      expect(source).not.toContain("JSON.stringify")
      expect(source).not.toContain("localeCompare")
    }
  })
})
