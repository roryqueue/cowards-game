import { describe, expect, it } from "vitest"
import type { Chronicle } from "@cowards/spec"
import {
  createChronicleContentHash,
  normalizeChronicle,
  stableStringify,
} from "./index.js"

const createChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: {
    matchId: "integrity-match",
    seed: "integrity-seed",
    arenaVariantId: "arena",
    arenaVariantVersion: "arena-v1",
    strategyRevisionIds: ["bottom-rev", "top-rev"],
    versions: {
      spec: "spec-v1",
      engine: "engine-v1",
      runtimeJs: "runtime-js-v1",
      chronicle: "chronicle-v1",
      strategyRevision: "strategy-revision-v1",
      arenaVariant: "arena-variant-v1",
    },
  },
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { seed: "integrity-seed", matchId: "integrity-match" },
    },
    {
      type: "MATCH_ENDED",
      sequence: 1,
      context: {},
      privacy: "public",
      payload: { type: "DRAW" },
    },
  ],
  snapshots: [
    {
      kind: "MATCH_START",
      sequence: 0,
      context: {},
      board: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        soldiers: [],
        terrainStones: [],
      },
    },
    {
      kind: "TERMINAL",
      sequence: 1,
      context: {},
      board: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        soldiers: [],
        terrainStones: [],
      },
      outcome: { type: "DRAW" },
    },
  ],
  private: { byPlayerId: { bottom: { note: "private" } } },
  integrity: { algorithm: "sha256", normalizedContentHash: "old-hash" },
  storageMetadata: { createdAt: "2026-05-16T00:00:00Z" },
})

describe("Chronicle integrity", () => {
  it("normalizes replay-relevant content and excludes storage metadata", () => {
    const chronicle = createChronicle()

    expect(normalizeChronicle(chronicle)).toEqual({
      schemaVersion: chronicle.schemaVersion,
      reproducibility: chronicle.reproducibility,
      events: chronicle.events,
      snapshots: chronicle.snapshots,
      private: chronicle.private,
    })
    expect(stableStringify({ b: 1, a: { d: 4, c: 3 } })).toBe(
      '{"a":{"c":3,"d":4},"b":1}',
    )
  })

  it("creates deterministic sha256 hashes independent of storage metadata and existing integrity", () => {
    const chronicle = createChronicle()
    const changedMetadata = {
      ...chronicle,
      integrity: { algorithm: "sha256" as const, normalizedContentHash: "new" },
      storageMetadata: { createdAt: "later" },
    }
    const changedEvent = {
      ...chronicle,
      events: [
        {
          ...chronicle.events[0],
          payload: { seed: "different", matchId: "integrity-match" },
        },
        chronicle.events[1],
      ],
    }

    expect(createChronicleContentHash(chronicle).algorithm).toBe("sha256")
    expect(createChronicleContentHash(chronicle)).toEqual(
      createChronicleContentHash(changedMetadata),
    )
    expect(createChronicleContentHash(chronicle)).not.toEqual(
      createChronicleContentHash(changedEvent),
    )
  })
})
