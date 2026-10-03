---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T19:45:46Z
depth: deep
source_commit: 60148fd57bb5765d49e49805f35d2b99f5f7af37
reviewer_agent: /root/review_265_15_import_crash
files_reviewed: 8
files_reviewed_list:
  - packages/strategy-lab/src/factory/repository.ts
  - packages/strategy-lab/src/factory/repository.test.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/v1-38-factory-implementation.ts
  - scripts/check-v1-38-lab-boundaries.ts
  - scripts/run-v1-38-lean-experiment.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Plan 265-15 import/crash source re-review, v4

## Narrative Findings (AI reviewer)

No BLOCKER or WARNING remains in the scoped v3 repair at fixed commit `60148fd57bb5765d49e49805f35d2b99f5f7af37`.

The shared factory `boundedRead` now rejects a named non-file or size above 262,144 bytes before opening, then checks the opened descriptor with `fstat`. It allocates at most 262,145 bytes, reads only that buffer, denies short reads, growth, or post-read size change, and closes the descriptor in `finally` on success and failure. `O_NOFOLLOW` also prevents opening a swapped-in symlink. `readFactoryArtifact` retains its digest check and returns the same byte sequence/API for stable valid files; attempt readers still run their existing canonical and root validations. See `packages/strategy-lab/src/factory/repository.ts:17-38,72-87`.

The lean import's filename preflight runs before `indexFactory`; the index calls this capped reader before its own byte-budget and canonical parse, so an oversized indexed artifact is rejected without a whole-file allocation or historical verifier call. The bounded reassessor's retained artifact reads share that same cap. The ordinary candidate/ledger route still uses its default path and the common reader preserves valid legacy bytes and resulting roots. See `scripts/assess-v1-38-factory-independence.ts:48-87,129`; `scripts/run-v1-38-serious-league.ts:278-300`. The `ce7b849c` repository regression and `60148fd5` targeted tests include valid repository behavior, a 48-pair oversized-artifact denial with a whole-file-read spy, genuine ordinary-three/lean-one verifier call counts, and an incomplete two-attempt denial. The author reports those focused tests and scoped types passed; I did not rerun them.

`leanSourceManifest()` obtains the conservative lab source inventory from `factoryAssessmentImplementationManifest()`. Its loader includes `.ts` files under `packages/strategy-lab`, excludes tests but not `packages/strategy-lab/src/factory/repository.ts`, and hashes the entries. Thus the shared reader fix is inside the request's source identity rather than being an untracked helper. See `scripts/run-v1-38-lean-experiment.ts:40-46`; `scripts/v1-38-factory-implementation.ts:11-16`; `scripts/check-v1-38-lab-boundaries.ts:45-64`.

The separate three failing assertions in the root's broader inert gate were attributed to a v2 test helper that depends on a nonexistent real inventory. Another author owns that test-only repair; this report does not review or modify its changing file and does not count those failures as a production regression. The historical core/cache disk bound remains unestablished and v2 allocation remains deliberately fail-closed; resolving that human accounting choice is separate from this clean code review. No private historical reader, preparation, provider, container, Match, model, or empirical route ran here. This report is not a measured peak-memory proof, capacity receipt, pilot admission, or phase pass.
