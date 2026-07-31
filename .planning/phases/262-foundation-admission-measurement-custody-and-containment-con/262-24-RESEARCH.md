# Phase 262 Plan 24: Terminal-Aware Checker, Bounded Test, and Child-Protocol Research

**Researched:** 2026-07-31
**Domain:** Post-live custody checking, bounded Vitest execution, privacy-safe subprocess classification, database boundary proof, and immutable successor authority
**Confidence:** HIGH — Plan 262-23 recorded the failures read-only, and the relevant checkers, tests, terminal, package version, and local PostgreSQL topology are committed.

## Executive finding

The route-ordinal-3 evidence is immutable and correctly stopped, but its independent verification exposed three offline proof defects that must be repaired before any successor authority exists:

1. The strict pre-live v3 checker is being reused after live artifacts exist. Its absence assertion correctly protects pre-live authorization, but is the wrong temporal contract for a post-live verifier and emits a misleading Plan-262-15-scoped error.
2. The monolithic foundation selector is not bounded under Vitest 4.1.6. The old `--poolOptions.forks.singleFork=true` syntax is rejected, while supported full-file and focused selectors failed to reach a verdict within their bounds.
3. The boundary chain requires seven PostgreSQL-backed Go proofs. Plan 262-23 had no authority to start a database, so it truthfully blocked rather than weakening those tests.

Static inspection also supports a closed child-failure protocol. The route runner needs a small, pure mapping from a bounded direct-child message to the existing public-safe failure taxonomy. Its subprocess self-test must exchange protocol bytes only: no Strategy source, Match, provider, live RSS observation, raw diagnostic, host path, environment value, or private runtime state.

These are source/test/proof repairs, not a diagnosis of why calibration:v7 stopped. Plan 262-24 must not guess the v7 cause, rewrite v5/v6/v7 evidence, or convert a stopped terminal into gameplay evidence.

## Evidence reviewed

- `262-23-REVIEW.md` and `262-23-SUMMARY.md`
- `262-21-PLAN.md`, `262-22-PLAN.md`, and `262-23-PLAN.md`
- `scripts/lib/v1-38-successor-source-seal.ts`
- `scripts/lib/v1-38-current-matrix-reproduction.ts`
- `scripts/evaluate-v1-38-foundation-contract.test.ts`
- `package.json` (`vitest` 4.1.6 and `boundary:monitors`)
- `compose.yaml` and `scripts/evaluate-v1-37-executable-conformance.ts`
- committed authorization-v3, seal-v3, v7 context/preflight/calibration/terminal, and v8 absence

## Finding 1 — split pre-live and post-live temporal contracts

`regularFile(..., "absent")` currently throws the generic literal `V138_PLAN_262_15_ARTIFACT_MUST_BE_ABSENT`. The pre-live v3 authorization/seal checker must retain strict absence for every route-ordinal-3 destination. That behavior protects single use and must not be relaxed.

Add a terminal-aware post-live alias/checker instead of changing the pre-live checker. It must:

- validate the same authorization-v3 and seal-v3 bytes and A3/B3 custody;
- read terminal-v1 first and select the exact allowed presence row;
- require context:v7, preflight:v7, calibration:v7, their consumption markers, and terminal-v1 on the stopped branch;
- require reproduction:v8 and its marker only for the passed/reproduction terminal rows, and require both absent for `calibration_stopped`;
- retain exact roots, 24 cumulative calibration:v5/v6/v7 charges, cleanup, expiry, no-retry, privacy, runtime, gameplay, and formation-absence checks; and
- use generation/path-scoped errors so a failure names the actual contract and artifact role rather than an unrelated Plan 262-15 label.

The terminal-aware checker is read-only. It is not an authority writer and cannot make stopped evidence admissible.

## Finding 2 — isolate route tests under supported Vitest 4 flags

The required command form is:

`pnpm exec vitest run <bounded-file> --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=<explicit-ms> --bail=1`

Move the route-ordinal-3 and additive route-ordinal-4 contracts into one dedicated bounded test file with a sequential reusable synthetic repository fixture, or into two dedicated bounded files with no shared mutable fixture. Preserve every positive and mutation case; do not replace coverage with smoke assertions. Each test owns explicit setup/cleanup, and the suite must have a stated timeout and fail-fast bound. The original broad file may keep unrelated foundation coverage, but must no longer be the only executable route proof.

The fixture must be synthetic and offline. It may exercise pure handlers and protocol-only child processes, but cannot invoke the live provider, Strategy execution, Match creation, `ps`, `/usr/bin/memory_pressure`, preflight, calibration, or reproduction.

## Finding 3 — closed child failure-code protocol

Define a small discriminated protocol with an exact schema version, finite failure-code enum, bounded UTF-8/JSON bytes, and no extensible diagnostic payload. The pure handler accepts decoded protocol input and returns only the existing public-safe route classification. Unknown keys, unknown codes, duplicate/multiple messages, invalid encoding, oversize data, nonzero exit without an exact terminal message, or stdout/stderr contamination fail closed.

The subprocess self-test launches a dedicated protocol fixture child, exchanges only the closed message, and proves success plus malformed/unknown/oversize/duplicate/nonzero-exit cases. Tests must scan captured bytes against privacy markers and prove the protocol contains no Strategy, Match, observation, source, memory, objective, environment, filesystem, database, or host diagnostic field.

This protocol does not explain the v7 terminal. It only makes future child classification closed, testable, and privacy-safe.

## Finding 4 — database proof is conditional on an isolated disposable boundary

The boundary chain must remain unchanged. When Docker and the required local client/toolchain are available, Plan 262-24 may create a uniquely named disposable PostgreSQL 18 container with its own ephemeral storage and dynamically resolved host port, wait for health, run the exact boundary command with `DATABASE_URL`, `COWARDS_GO_BACKEND_TEST_DATABASE_URL`, and `COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL` scoped to that process, then remove only that owned container.

Do not reuse the repository's durable `postgres-data` volume, print credentials/URLs into public artifacts, or leave the container running. The review records only a safe pass row and command class. If Docker, image, port allocation, or required tooling is unavailable, record the row as `BLOCKED — isolated disposable PostgreSQL unavailable` with the safe failure class. Do not skip, mock, mark green, or weaken any database-backed proof.

## Immutable successor topology

- A4 is a reviewed source commit over an exact `sourceBase4`, exact allowlisted paths, lineage, tree, parents, and source blobs. Review status must be clean with zero findings.
- Fresh authorization-v4 and seal-v4 form direct-child B4. B4 changes exactly those two artifacts and has A4 as sole parent.
- Protected history includes exact A2/B2/A3/B3, all v5/v6/v7 roots and markers, required reproduction absences, terminal-v1, all 24 calibration charges, and byte identities for every prior authorization.
- Route ordinal 4 owns fresh context:v8, preflight:v8, calibration:v8, reproduction:v9, Plan-262-25 markers, and Plan-262-25 terminal-v1.
- The authorization literal is rendered only after A4 review and full derived closure. The operator must paste the complete fresh literal byte-for-byte at a blocking checkpoint.

## Plan implications

1. Plan 262-24 performs offline TDD repair, bounded tests, conditional disposable database proof, deep independent review, exact-literal checkpoint, and direct-child B4 sealing. It performs no live observation.
2. Plan 262-25 alone consumes the route-ordinal-4 authority through one main-only Pattern C path. It writes context:v8 and one preflight:v8; only an admitted preflight permits one fresh 8/4 calibration:v8, and only admitted calibration permits one fresh 540-cell reproduction:v9.
3. Plan 262-26 independently verifies with the terminal-aware checker, bounded route tests, and strict boundary monitors. Only literal `reproduction_passed` with exactly 540 charged and 540 accepted fresh cells can unblock ADMIT-03; every other result blocks with no retry.

## Package legitimacy audit

No package installation is planned. Vitest 4.1.6, Docker/PostgreSQL topology, TypeScript, Go, and all runtime dependencies already exist in the repository/toolchain contract.

## Source coverage audit

| Source | ID | Constraint | Plans | Status |
|---|---|---|---|---|
| GOAL | — | Exact authority plus reproducible current-rules matrix | 24-26 | COVERED |
| REQ | ADMIT-01 | Preserve exact predecessor and successor custody | 24, 26 | COVERED |
| REQ | ADMIT-02 | Bind selected identities and protected history | 24-26 | COVERED |
| REQ | ADMIT-03 | Exact fresh 540/540 reproduction gate | 25-26 | COVERED |
| REQ | ADMIT-04 | Fail closed on drift, malformed proof, or unavailable boundary | 24-26 | COVERED |
| CONTEXT | D-01..D-10 | Immutable evidence, canonical runtime, privacy, and predecessor authority | 24-26 | COVERED |
| CONTEXT | D-11..D-18 | Unchanged gate, accounting, failure, and claim boundaries | 24-26 | COVERED |
| CONTEXT | D-19..D-22 | Custody and pre-formation containment | 24-26 | COVERED |
| CONTEXT | Deferred Ideas | Factory, league, formation, product, and rule work | none | EXCLUDED |

