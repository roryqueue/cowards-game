# Phase 47: Golden Parity Harness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 47-Golden Parity Harness
**Areas discussed:** Fixture Ownership And Layout, Comparison Semantics, Initial Fixture Slice, Regeneration Policy

---

## Fixture Ownership And Layout

| Option | Description | Selected |
| --- | --- | --- |
| `packages/spec` owns contract fixtures | Put schemas, readers, and canonical fixtures under the contract package. | |
| `packages/test-utils` owns generated behavior fixtures | Keep fixtures near existing scenario generators. | |
| New `packages/golden` package | Dedicated package for fixtures, manifests, validators, and cross-language consumption. | ✓ |
| Repo-level `fixtures/golden` directory | Store language-neutral JSON outside the package graph. | |

**User's choice:** New `packages/golden` package.
**Notes:** Keeps `@cowards/spec` canonical without stuffing it with artifacts.

| Option | Description | Selected |
| --- | --- | --- |
| Human-readable fixture folders by domain | Domain folders with manifests and JSON/CSV artifacts. | ✓ |
| Programmatic fixture registry only | Export fixtures from TypeScript modules. | |
| Single flat manifest with embedded fixture data | One big JSON manifest for all fixtures. | |

**User's choice:** Human-readable fixture folders by domain.
**Notes:** Optimizes for reviewability and future Go/Python reads.

---

## Comparison Semantics

| Option | Description | Selected |
| --- | --- | --- |
| Parsed canonical JSON equality by default | Parse, validate schemas, normalize order where appropriate, compare values. | ✓ |
| Stable hash equality by default | Normalize and hash every fixture. | |
| Raw byte equality by default | Require exact byte-for-byte serialization everywhere. | |

**User's choice:** Parsed canonical JSON equality by default.
**Notes:** Hashes and raw bytes are reserved for explicit contracts.

| Option | Description | Selected |
| --- | --- | --- |
| No additive fields unless schema permits them | Strict schemas always. | |
| Allow additive public fields by default | New public-safe fields can appear without breaking fixtures. | |
| Allow additive fields only in explicitly extensible metadata bags | Core DTOs strict, metadata bags extensible by design. | ✓ |

**User's choice:** Allow additive fields only in explicitly extensible metadata bags.
**Notes:** Balances strict privacy/contract discipline with intentional extension points.

---

## Initial Fixture Slice

| Option | Description | Selected |
| --- | --- | --- |
| Boundary-critical core only | Engine, Chronicle, MatchSet, replay, runtime ABI, privacy. | |
| Core plus v1.6 analytics/export evidence | Core plus analytics summaries, replay deep links, owner exports, evidence bands, ordering. | ✓ |
| Full known product surface | Everything including profiles, ladders, Workshop, auth, governance, pages. | |

**User's choice:** Core plus v1.6 analytics/export evidence.
**Notes:** Protects the most recent analytics milestone while proving the new boundaries.

| Option | Description | Selected |
| --- | --- | --- |
| Privacy and deterministic replay first | Protect public Chronicle, replay, MatchSet, privacy, and engine outcomes first. | ✓ |
| Service/Go spike path first | Prioritize MatchSet/replay service DTOs and Go-friendly JSON path. | |
| Analytics preservation first | Prioritize v1.6 analytics/export/deep-link fixtures first. | |

**User's choice:** Privacy and deterministic replay first.
**Notes:** Replay/privacy are the trunk; analytics/export can trim behind them if needed.

---

## Regeneration Policy

| Option | Description | Selected |
| --- | --- | --- |
| Committed artifacts plus explicit regeneration script | Commit fixtures, regenerate deterministically, review diffs. | ✓ |
| Generated at test time only | Generate every test run, do not commit. | |
| Hand-authored fixtures only | Manually write every fixture. | |

**User's choice:** Committed artifacts plus explicit regeneration script.
**Notes:** Supports cross-language consumption and review discipline.

| Option | Description | Selected |
| --- | --- | --- |
| Normal tests fail on mismatch; update script is explicit | Tests compare against committed fixtures and fail; updates require named script. | ✓ |
| Tests auto-update fixtures when mismatched | Convenient locally but dangerous in CI. | |
| Fixtures are advisory only | Validate shape but do not fail on value differences. | |

**User's choice:** Normal tests fail on mismatch; update script is explicit.
**Notes:** Fixture mismatches are regressions or intentional contract changes requiring review.

## the agent's Discretion

- Exact fixture file names, manifest schema, and domain folder names.
- One regeneration script versus per-domain scripts, provided there is a single obvious update command.

## Deferred Ideas

- Full product-surface fixture suite.
- Compatibility ranges.
- Actual Go/Python test consumption, though files must be ready for it.
