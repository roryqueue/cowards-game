# Phase 42 Plan: Replay Deep Links

## Goal
Support replay URLs targeted to meaningful moments such as Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.

## Tasks
- Add replay focus options to replay page query parsing and replay DTOs.
- Resolve focus by exact sequence when possible, otherwise by moment type, otherwise fallback to Match start with a visible notice.
- Add replay-client focus banner and selected timeline highlighting.
- Generate analytics replay references with moment query parameters.

## Verification
- Replay unit tests for exact focus, type fallback, and unavailable fallback.
- Public links remain public unless owner debug is explicitly authorized.
