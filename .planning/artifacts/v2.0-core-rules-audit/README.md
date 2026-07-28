# v2.0 Core-Rules Audit Reproduction Artifacts

Captured: 2026-07-12

Reviewed code snapshot: `38f4a83db9298502c12db44cd66d026878803d20`

These scripts preserve the focused probes and current-rules metagame matrix used by the audit. They intentionally run against workspace packages so they can be rerun after changes.

## Focused rule-gap probes

Run:

```bash
pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts
```

Observed at the reviewed snapshot:

```json
{
  "noAdvanceLastSoldier": {
    "status": "STONE",
    "outcome": null,
    "matchEndedEvents": 0
  },
  "cycleEndBackstabActor": {
    "status": "STONE",
    "slotEnded": false,
    "terminalReason": null
  },
  "excessMalformedOrder": {
    "validOrdersRetained": 0,
    "violationEvents": 1
  },
  "deepValidation": "threw:RangeError",
  "overlappingArenaAccepted": true,
  "legacyBoundaryAccepted": true,
  "successfulPushPusherHistory": "RIGHT"
}
```

The push-history value is evidence of an unresolved prose/implementation ambiguity, not by itself proof that `RIGHT` is the wrong ruling.

## Current-rules metagame matrix

Run:

```bash
pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts
```

Matrix shape:

- 10 Advanced Strategy definitions
- 45 unordered pairings
- 3 configured arenas
- 2 seed parities
- mirrored sides
- 540 total Matches

Key result:

| Strategy | W-L-D | Win rate |
|---|---:|---:|
| `advanced:stonewall-shear` | 62-44-2 | 57.4% |
| `advanced:vanguard-pressure` | 62-44-2 | 57.4% |
| `advanced:rear-guard-sentinel` | 57-51-0 | 52.8% |

The matrix found nine majority-edge non-transitive three-cycles, but neither leading Strategy had a majority-losing matchup. All detected cycles were below the leading pair. Smoke and Open Field produced identical per-Strategy records because both are empty geometries.

On the audit machine, this complete 540-Match in-process matrix took about 11.4 seconds. That is important for future experiments: a staged ruleset comparison is inexpensive at the engine level, even though service-backed and four-language certification remain appropriately expensive final gates.

## Passing suites at the same snapshot

```text
@cowards/engine          8 files, 40 tests passed
@cowards/spec            5 files, 70 tests passed
@cowards/replay         11 files, 126 tests passed
@cowards/runtime-service 4 files, 35 tests passed
```

The focused reproductions demonstrate gaps not covered by those passing suites.
