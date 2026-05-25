# Phase 114 Research: Go Orchestration and Non-Counted Eligibility

**Date:** 2026-05-25
**Status:** Complete

## Findings

- Go already invokes runtime-service envelopes and validates source/ABI metadata, but registry exactness needs hardening around Python adapter metadata.
- TypeScript persistence exhibition creation currently calls `runtimeAllowsCountedPlay`, which rejects Python. A separate non-counted exhibition allowance is needed.
- The web exhibition client filters selectable revisions to `countedPlayEligible`; to expose Python as a normal unranked option it needs a non-counted/experimental mode.
- Ladder code already uses counted eligibility and should continue rejecting Python.

## Risks

- Reusing counted exhibition code without a non-counted flag could accidentally mark Python evidence as counted.
- UI copy must not imply ranked/ladder support.

## Recommended Tests

- Go runtime-service client tests for Python metadata acceptance through schema and no Go execution.
- Persistence competition tests for Python non-counted allowed and counted/ranked rejected.
- Web client smoke/unit tests for Python selectable only in non-counted mode.

