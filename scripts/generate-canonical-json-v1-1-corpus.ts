#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- this repo-root generator emits spec fixtures.
import { RUNTIME_ABI_V1_17 } from "../packages/spec/src/runtime-abi-v1-17.ts"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export const CANONICAL_JSON_V1_1_INDEX_PATH =
  "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json" as const
export const CANONICAL_JSON_V1_1_RAW_DIRECTORY =
  "packages/spec/src/fixtures/canonical-json-v1-1-raw" as const

type Category =
  | "valid-utf8"
  | "invalid-utf8"
  | "unicode-scalar"
  | "duplicate-key"
  | "key-order"
  | "unicode-normalization"
  | "number"
  | "numeric-grammar"
  | "limit-raw-bytes"
  | "limit-depth"
  | "limit-nodes"
  | "limit-string-bytes"
  | "limit-array-entries"
  | "limit-object-entries"
  | "hostile-allocation"

type Context =
  | "decoded-strategy-payload"
  | "authenticated-outer-envelope"
  | "canonical-manifest"
  | "host-api-value"

type ErrorOwner = "player_violation" | "system_failure"
type LimitName = keyof typeof RUNTIME_ABI_V1_17.canonicalJson.ceilings

interface Limits {
  rawUtf8Bytes: number
  depth: number
  nodes: number
  decodedStringUtf8Bytes: number
  arrayEntries: number
  objectEntries: number
}

interface SuccessExpectation {
  kind: "success"
  canonicalPath: string
  canonicalByteLength: number
  canonicalSha256: string
}

interface ErrorExpectation {
  kind: "error"
  code: string
  path: readonly (string | number)[]
  byteOffset: number
  owner: ErrorOwner
}

export interface CanonicalJsonV11Vector {
  id: string
  category: Category
  context: Context
  operation: "parse-and-canonicalize" | "require-canonical" | "host-encode"
  rawPath: string
  rawByteLength: number
  rawSha256: string
  limits: Limits
  boundary?: { limit: LimitName; offset: -1 | 0 | 1; candidate: number }
  expectation: SuccessExpectation | ErrorExpectation
}

export interface CanonicalJsonV11Corpus {
  schemaVersion: "canonical-json-v1.1-corpus-v1"
  profile: "canonical-json-v1"
  contract: "runtime-abi-v1.17-contract-v1"
  generatedBy: "scripts/generate-canonical-json-v1-1-corpus.ts"
  rawByteDomain: "literal-unparsed-bytes"
  hashAlgorithm: "sha256"
  vectorRootDomain: "cowards-game:canonical-json-v1.1-corpus:v1"
  vectorRootFraming: "unsigned-64-bit-big-endian-length-then-bytes"
  vectorRootSha256: string
  vectorCount: number
  limits: Limits
  vectors: readonly CanonicalJsonV11Vector[]
}

interface VectorDefinition {
  id: string
  category: Category
  context?: Context
  operation?: CanonicalJsonV11Vector["operation"]
  raw: () => Buffer
  canonical?: () => Buffer
  limits?: Partial<Limits>
  boundary?: CanonicalJsonV11Vector["boundary"]
  error?: Omit<ErrorExpectation, "kind">
}

const baseLimits: Limits = {
  ...RUNTIME_ABI_V1_17.canonicalJson.ceilings,
}

const text = (value: string): (() => Buffer) => () => Buffer.from(value, "utf8")
const bytes = (...values: number[]): (() => Buffer) => () => Buffer.from(values)
const sha256 = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

const rawPathFor = (id: string): string =>
  `${CANONICAL_JSON_V1_1_RAW_DIRECTORY}/${id}.raw`
const canonicalPathFor = (id: string): string =>
  `${CANONICAL_JSON_V1_1_RAW_DIRECTORY}/${id}.canonical.raw`

const ownerFor = (context: Context): ErrorOwner =>
  context === "decoded-strategy-payload" ? "player_violation" : "system_failure"

const error = (
  code: string,
  byteOffset: number,
  pathSegments: readonly (string | number)[] = [],
  owner?: ErrorOwner,
): Omit<ErrorExpectation, "kind"> => ({
  code,
  path: pathSegments,
  byteOffset,
  owner: owner ?? "player_violation",
})

const valueDefinitions: VectorDefinition[] = [
  { id: "valid-null", category: "valid-utf8", raw: text("null") },
  { id: "valid-true", category: "valid-utf8", raw: text("true") },
  { id: "valid-ascii", category: "valid-utf8", raw: text('"cowards"') },
  { id: "valid-multilingual", category: "valid-utf8", raw: text('"日本語-é"') },
  { id: "valid-u2028-u2029", category: "valid-utf8", raw: text('"before middle after"') },
  { id: "valid-non-bmp-scalar", category: "valid-utf8", raw: text('"😀"') },

  {
    id: "utf8-overlong-slash",
    category: "invalid-utf8",
    raw: bytes(0x22, 0xc0, 0xaf, 0x22),
    error: error("INVALID_UTF8", 1),
  },
  {
    id: "utf8-stray-continuation",
    category: "invalid-utf8",
    raw: bytes(0x22, 0x80, 0x22),
    error: error("INVALID_UTF8", 1),
  },
  {
    id: "utf8-truncated-three-byte",
    category: "invalid-utf8",
    raw: bytes(0x22, 0xe2, 0x82),
    error: error("INVALID_UTF8", 1),
  },
  {
    id: "utf8-above-unicode-maximum",
    category: "invalid-utf8",
    raw: bytes(0x22, 0xf4, 0x90, 0x80, 0x80, 0x22),
    error: error("INVALID_UTF8", 1),
  },
  {
    id: "utf8-encoded-surrogate",
    category: "invalid-utf8",
    raw: bytes(0x22, 0xed, 0xa0, 0x80, 0x22),
    error: error("INVALID_UTF8", 1),
  },
  {
    id: "utf8-invalid-leading-byte",
    category: "invalid-utf8",
    raw: bytes(0x22, 0xff, 0x22),
    error: error("INVALID_UTF8", 1),
  },

  {
    id: "unicode-lone-high-surrogate",
    category: "unicode-scalar",
    raw: text('"\\ud800"'),
    error: error("INVALID_UNICODE_SCALAR", 1),
  },
  {
    id: "unicode-lone-low-surrogate",
    category: "unicode-scalar",
    raw: text('"\\udc00"'),
    error: error("INVALID_UNICODE_SCALAR", 1),
  },
  {
    id: "unicode-surrogate-pair-canonicalizes",
    category: "unicode-scalar",
    raw: text('"\\ud83d\\ude00"'),
    canonical: text('"😀"'),
  },
  {
    id: "unicode-escaped-ascii-canonicalizes",
    category: "unicode-scalar",
    raw: text('"\\u0061"'),
    canonical: text('"a"'),
  },

  {
    id: "duplicate-root-literal",
    category: "duplicate-key",
    raw: text('{"a":1,"a":2}'),
    error: error("DUPLICATE_KEY", 7, ["a"]),
  },
  {
    id: "duplicate-root-escaped-equivalent",
    category: "duplicate-key",
    raw: text('{"a":1,"\\u0061":2}'),
    error: error("DUPLICATE_KEY", 7, ["a"]),
  },
  {
    id: "duplicate-nested-literal",
    category: "duplicate-key",
    raw: text('{"outer":{"x":1,"x":2}}'),
    error: error("DUPLICATE_KEY", 16, ["outer", "x"]),
  },
  {
    id: "duplicate-outer-envelope-system",
    category: "duplicate-key",
    context: "authenticated-outer-envelope",
    raw: text('{"ok":true,"\\u006f\\u006b":false}'),
    error: error("DUPLICATE_KEY", 11, ["ok"], "system_failure"),
  },
  {
    id: "duplicate-decoded-payload-player",
    category: "duplicate-key",
    context: "decoded-strategy-payload",
    raw: text('{"memory":{},"\\u006demory":null}'),
    error: error("DUPLICATE_KEY", 13, ["memory"], "player_violation"),
  },
  {
    id: "duplicate-manifest-system",
    category: "duplicate-key",
    context: "canonical-manifest",
    raw: text('{"sha256":"a","sha256":"b"}'),
    error: error("DUPLICATE_KEY", 14, ["sha256"], "system_failure"),
  },

  {
    id: "order-mixed-ascii",
    category: "key-order",
    raw: text('{"z":1,"A":2,"a":3,"Z":4}'),
    canonical: text('{"A":2,"Z":4,"a":3,"z":1}'),
  },
  {
    id: "order-non-bmp",
    category: "key-order",
    raw: text('{"😀":1,"é":2,"a":3}'),
    canonical: text('{"a":3,"é":2,"😀":1}'),
  },
  {
    id: "order-combining-key",
    category: "key-order",
    raw: text('{"é":1,"é":2}'),
    canonical: text('{"é":2,"é":1}'),
  },
  {
    id: "order-already-canonical",
    category: "key-order",
    raw: text('{"A":1,"a":2,"é":3,"😀":4}'),
  },
  {
    id: "order-locale-compare-trap",
    category: "key-order",
    raw: text('{"ä":1,"z":2,"Z":3}'),
    canonical: text('{"Z":3,"z":2,"ä":1}'),
  },

  { id: "normalization-nfc-preserved", category: "unicode-normalization", raw: text('"é"') },
  { id: "normalization-nfd-preserved", category: "unicode-normalization", raw: text('"é"') },
  {
    id: "normalization-distinct-object-values",
    category: "unicode-normalization",
    raw: text('{"nfc":"é","nfd":"é"}'),
  },

  { id: "number-zero", category: "number", raw: text("0") },
  { id: "number-negative-zero", category: "number", raw: text("-0"), canonical: text("0") },
  { id: "number-max-safe-integer", category: "number", raw: text("9007199254740991") },
  { id: "number-min-safe-integer", category: "number", raw: text("-9007199254740991") },
  {
    id: "number-max-finite-binary64",
    category: "number",
    raw: text("1.7976931348623157e308"),
  },
  {
    id: "number-min-normal-binary64",
    category: "number",
    raw: text("2.2250738585072014e-308"),
  },
  {
    id: "number-min-subnormal-roundtrip",
    category: "number",
    raw: text("4.9406564584124654e-324"),
    canonical: text("5e-324"),
  },
  { id: "number-exponent-minus-seven", category: "number", raw: text("1e-7") },
  {
    id: "number-positive-exponent-threshold",
    category: "number",
    raw: text("1e+7"),
    canonical: text("10000000"),
  },
  {
    id: "number-trailing-zero-canonicalizes",
    category: "number",
    raw: text("1.2300"),
    canonical: text("1.23"),
  },
  {
    id: "number-uppercase-exponent-canonicalizes",
    category: "number",
    raw: text("1E+21"),
    canonical: text("1e21"),
  },
  { id: "number-exact-decimal", category: "number", raw: text("1.25") },

  {
    id: "number-unsafe-positive-integer",
    category: "numeric-grammar",
    raw: text("9007199254740992"),
    error: error("NUMBER_OUT_OF_RANGE", 0),
  },
  {
    id: "number-unsafe-negative-integer",
    category: "numeric-grammar",
    raw: text("-9007199254740992"),
    error: error("NUMBER_OUT_OF_RANGE", 0),
  },
  {
    id: "number-host-nan",
    category: "numeric-grammar",
    context: "host-api-value",
    operation: "host-encode",
    raw: text("NaN"),
    error: error("NON_CANONICAL_NUMBER", 0),
  },
  {
    id: "number-host-positive-infinity",
    category: "numeric-grammar",
    context: "host-api-value",
    operation: "host-encode",
    raw: text("Infinity"),
    error: error("NON_CANONICAL_NUMBER", 0),
  },
  {
    id: "number-host-negative-infinity",
    category: "numeric-grammar",
    context: "host-api-value",
    operation: "host-encode",
    raw: text("-Infinity"),
    error: error("NON_CANONICAL_NUMBER", 0),
  },
  {
    id: "number-leading-zero",
    category: "numeric-grammar",
    raw: text("01"),
    error: error("INVALID_GRAMMAR", 1),
  },
  {
    id: "number-trailing-decimal-point",
    category: "numeric-grammar",
    raw: text("1."),
    error: error("INVALID_GRAMMAR", 1),
  },
  {
    id: "number-leading-plus",
    category: "numeric-grammar",
    raw: text("+1"),
    error: error("INVALID_GRAMMAR", 0),
  },
]

const boundaryDefinition = (
  limit: LimitName,
  offset: -1 | 0 | 1,
): VectorDefinition => {
  const candidate = baseLimits[limit] + offset
  const ordinal = offset === -1 ? "00-n-minus-1" : offset === 0 ? "01-n" : "02-n-plus-1"
  const category = {
    rawUtf8Bytes: "limit-raw-bytes",
    depth: "limit-depth",
    nodes: "limit-nodes",
    decodedStringUtf8Bytes: "limit-string-bytes",
    arrayEntries: "limit-array-entries",
    objectEntries: "limit-object-entries",
  }[limit] as Category
  let raw: () => Buffer
  let canonical: (() => Buffer) | undefined
  let limits: Partial<Limits> | undefined
  let failureOffset = 0
  switch (limit) {
    case "rawUtf8Bytes":
      raw = () => Buffer.from(`"${"x".repeat(candidate - 2)}"`)
      limits = { decodedStringUtf8Bytes: baseLimits.rawUtf8Bytes }
      failureOffset = baseLimits.rawUtf8Bytes
      break
    case "depth":
      raw = () => Buffer.from(`${"[".repeat(candidate)}null${"]".repeat(candidate)}`)
      failureOffset = baseLimits.depth
      break
    case "nodes":
      raw = () => Buffer.from(`[${Array(candidate - 1).fill("null").join(",")}]`)
      limits = { arrayEntries: baseLimits.nodes }
      failureOffset = 1 + baseLimits.nodes * 5 - 5
      break
    case "decodedStringUtf8Bytes":
      raw = () => Buffer.from(`"${"x".repeat(candidate)}"`)
      failureOffset = 1 + baseLimits.decodedStringUtf8Bytes
      break
    case "arrayEntries":
      raw = () => Buffer.from(`[${Array(candidate).fill("null").join(",")}]`)
      failureOffset = 1 + baseLimits.arrayEntries * 5
      break
    case "objectEntries":
      raw = () => {
        const keys = Array.from({ length: candidate }, (_, index) => `k${index}`)
        return Buffer.from(`{${keys.map((key) => `"${key}":null`).join(",")}}`)
      }
      canonical = () => {
        const keys = Array.from({ length: candidate }, (_, index) => `k${index}`).sort()
        return Buffer.from(`{${keys.map((key) => `"${key}":null`).join(",")}}`)
      }
      failureOffset = -1
      break
  }
  const definition: VectorDefinition = {
    id: `boundary-${limit}-${ordinal}`,
    category,
    context: "canonical-manifest",
    raw,
    ...(canonical ? { canonical } : {}),
    limits,
    boundary: { limit, offset, candidate },
  }
  if (offset === 1) {
    const codes: Record<LimitName, string> = {
      rawUtf8Bytes: "MAX_RAW_UTF8_BYTES_EXCEEDED",
      depth: "MAX_DEPTH_EXCEEDED",
      nodes: "MAX_NODES_EXCEEDED",
      decodedStringUtf8Bytes: "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED",
      arrayEntries: "MAX_ARRAY_ENTRIES_EXCEEDED",
      objectEntries: "MAX_OBJECT_ENTRIES_EXCEEDED",
    }
    definition.error = error(codes[limit], failureOffset, [], "system_failure")
  }
  return definition
}

const boundaryDefinitions = (
  Object.keys(baseLimits) as LimitName[]
).flatMap((limit) => [-1, 0, 1].map((offset) => boundaryDefinition(limit, offset as -1 | 0 | 1)))

const hostileDefinitions: VectorDefinition[] = [
  {
    id: "hostile-depth-3000",
    category: "hostile-allocation",
    context: "canonical-manifest",
    raw: () => Buffer.from(`${"[".repeat(3_000)}null${"]".repeat(3_000)}`),
    error: error("MAX_DEPTH_EXCEEDED", 64, [], "system_failure"),
  },
  {
    id: "hostile-array-100000",
    category: "hostile-allocation",
    context: "decoded-strategy-payload",
    raw: () => Buffer.from(`[${Array(100_000).fill("null").join(",")}]`),
    error: error(
      "MAX_ARRAY_ENTRIES_EXCEEDED",
      1 + baseLimits.arrayEntries * 5,
      [],
      "player_violation",
    ),
  },
]

const definitions = [...valueDefinitions, ...boundaryDefinitions, ...hostileDefinitions].sort(
  (left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
)

const frame = (value: Uint8Array): Buffer => {
  const length = Buffer.alloc(8)
  length.writeBigUInt64BE(BigInt(value.byteLength))
  return Buffer.concat([length, Buffer.from(value)])
}

const vectorRoot = (): string => {
  const hash = createHash("sha256")
  hash.update(frame(Buffer.from("cowards-game:canonical-json-v1.1-corpus:v1")))
  for (const definition of definitions) {
    hash.update(frame(Buffer.from(definition.id)))
    hash.update(frame(definition.raw()))
  }
  return hash.digest("hex")
}

let cachedCorpus: CanonicalJsonV11Corpus | undefined

export const generateCanonicalJsonV11Corpus = (): CanonicalJsonV11Corpus => {
  if (cachedCorpus) return cachedCorpus
  const vectors = definitions.map((definition): CanonicalJsonV11Vector => {
    const raw = definition.raw()
    const context = definition.context ?? "decoded-strategy-payload"
    const limits = { ...baseLimits, ...definition.limits }
    let expectation: SuccessExpectation | ErrorExpectation
    if (definition.error) {
      let byteOffset = definition.error.byteOffset
      if (
        byteOffset === -1 &&
        definition.boundary?.limit === "objectEntries"
      ) {
        byteOffset = raw.indexOf(
          Buffer.from(`"k${baseLimits.objectEntries}"`),
        )
      }
      expectation = {
        kind: "error",
        ...definition.error,
        byteOffset,
        owner: definition.error.owner ?? ownerFor(context),
      }
    } else {
      const canonical = definition.canonical?.() ?? raw
      const canonicalPath = canonical.equals(raw)
        ? rawPathFor(definition.id)
        : canonicalPathFor(definition.id)
      expectation = {
        kind: "success",
        canonicalPath,
        canonicalByteLength: canonical.byteLength,
        canonicalSha256: sha256(canonical),
      }
    }
    return {
      id: definition.id,
      category: definition.category,
      context,
      operation: definition.operation ?? "parse-and-canonicalize",
      rawPath: rawPathFor(definition.id),
      rawByteLength: raw.byteLength,
      rawSha256: sha256(raw),
      limits,
      ...(definition.boundary ? { boundary: definition.boundary } : {}),
      expectation,
    }
  })
  cachedCorpus = {
    schemaVersion: "canonical-json-v1.1-corpus-v1",
    profile: "canonical-json-v1",
    contract: "runtime-abi-v1.17-contract-v1",
    generatedBy: "scripts/generate-canonical-json-v1-1-corpus.ts",
    rawByteDomain: "literal-unparsed-bytes",
    hashAlgorithm: "sha256",
    vectorRootDomain: "cowards-game:canonical-json-v1.1-corpus:v1",
    vectorRootFraming: "unsigned-64-bit-big-endian-length-then-bytes",
    vectorRootSha256: vectorRoot(),
    vectorCount: vectors.length,
    limits: baseLimits,
    vectors,
  }
  return cachedCorpus
}

export const renderCanonicalJsonV11Index = (
  corpus: CanonicalJsonV11Corpus,
): string => `${JSON.stringify(corpus, null, 2)}\n`

const expectedFiles = (): Map<string, Buffer> => {
  const corpus = generateCanonicalJsonV11Corpus()
  const files = new Map<string, Buffer>([
    [CANONICAL_JSON_V1_1_INDEX_PATH, Buffer.from(renderCanonicalJsonV11Index(corpus))],
  ])
  for (const definition of definitions) {
    const raw = definition.raw()
    files.set(rawPathFor(definition.id), raw)
    if (!definition.error) {
      const canonical = definition.canonical?.() ?? raw
      if (!canonical.equals(raw)) files.set(canonicalPathFor(definition.id), canonical)
    }
  }
  return files
}

export const writeCanonicalJsonV11Corpus = (
  root: string = repoRoot,
): CanonicalJsonV11Corpus => {
  for (const [relativePath, contents] of expectedFiles()) {
    const absolutePath = path.join(root, relativePath)
    mkdirSync(path.dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, contents)
  }
  return generateCanonicalJsonV11Corpus()
}

export const checkCanonicalJsonV11Corpus = (root: string = repoRoot): string[] => {
  const errors: string[] = []
  const expected = expectedFiles()
  for (const [relativePath, contents] of expected) {
    const absolutePath = path.join(root, relativePath)
    if (!existsSync(absolutePath)) errors.push(`${relativePath} is missing`)
    else if (!readFileSync(absolutePath).equals(contents)) {
      errors.push(`${relativePath} is stale`)
    }
  }
  const rawDirectory = path.join(root, CANONICAL_JSON_V1_1_RAW_DIRECTORY)
  if (existsSync(rawDirectory)) {
    for (const filename of readdirSync(rawDirectory)) {
      const relativePath = `${CANONICAL_JSON_V1_1_RAW_DIRECTORY}/${filename}`
      if (!expected.has(relativePath)) errors.push(`${relativePath} is unexpected`)
    }
  }
  return errors
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) writeCanonicalJsonV11Corpus()
  if (args.has("--check")) {
    const errors = checkCanonicalJsonV11Corpus()
    if (errors.length > 0) {
      console.error(errors.join("\n"))
      process.exitCode = 1
      return
    }
    const corpus = generateCanonicalJsonV11Corpus()
    console.log(
      `canonical JSON v1.1 corpus current: ${corpus.vectorCount} vectors root=${corpus.vectorRootSha256}`,
    )
    return
  }
  if (!args.has("--write")) {
    console.log(renderCanonicalJsonV11Index(generateCanonicalJsonV11Corpus()))
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main()
