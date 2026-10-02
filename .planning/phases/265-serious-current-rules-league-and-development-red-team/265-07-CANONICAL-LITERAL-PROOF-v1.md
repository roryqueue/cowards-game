# Plan265-07 — bounded fixed-literal encoder comparison

Scope: source-only pre-integration comparison; no Strategy, Match, provider,
model, kernel, capacity observation or evidence-repository publication.
Main remains unchanged through active unique v4 retained verification26421.

Candidate is the exact two-file diff e28f29a0..248fc27b in the isolated
phase266-context worktree. It only replaces repeated TextEncoder allocations
for JSON punctuation, null and boolean literals with module-private fixed
arrays. Final assembly copies every chunk into a fresh output. Caller data,
numbers, keys, strings, limits, traversal, errors and hostile-object checks
retain their ordinary path. This is not Strategy/runtime caching.

Source raw hashes:

- baseline encoder: `sha256:ca460abfd36829b3a65b1ba916b730860a8d51081d1b8767a0452dbe2d097864`
- candidate encoder: `sha256:25019df901dabc1ef7c0a364bbf5cb030f3c5b6863f397b8000c175dc49040f0`
- candidate test: `sha256:4d3cdf98bf8a44b700c0ea070d0797672852258f39a624220a4a1fbdfcf92488`
- private comparison helper: `sha256:085ca5edf8573126418e8dd497597106fb646e71d94cbb15a14e683b4ae40551`

Root's one comparison14115 passed. It selected the first16 sorted small
runtime-invocation descriptors in consumed v4, reopening each descriptor,
chunk-node and payload with exact raw SHA-256 checks. Both encoders reproduced
all16 existing payload bytes exactly. This component comparison is not the
ordinary full retained verifier or empirical authentication.

Six alternating-order rounds,320 encodes per variant per round:

| Round | Baseline ms | Candidate ms |
| --- | ---: | ---: |
| 1 | 901.549215 | 561.677538 |
| 2 | 709.791540 | 576.094286 |
| 3 | 792.861167 | 566.539182 |
| 4 | 751.685202 | 532.020487 |
| 5 | 733.841540 | 525.285417 |
| 6 | 705.663245 | 497.254141 |

The read-only retained verifier was active, so timing includes host contention.
Approximately29percent total encoder-component saving is not a whole-Match
timing prediction, capacity pass, or license to extend120seconds.

Root's isolated focused gate61511 passed9/9tests in3.15seconds, including40
successful corpus byte/hash vectors, fresh-output mutation isolation, exact
raw-byte boundaries/ownership and existing hostile/cyclic/value tests.
Independent `/root/265_canonical_literal_review` reviewed the exact diff and
reported zero actionable findings; its isolated draft artifact states that
tests/build/integration/empirical closure were not reviewed.

Still required: finish unique retained verification; integrate only these
reviewed source/test bytes; independently review that exact final main source
commit; run full applicable source gates. Only then prepare a distinct fresh
allocation and fresh same-process capacity route under standing approval.
No consumed route is retried, no limit or gate is relaxed, and no LEAG/freeze,
formation, holdout, public, counted or production authority follows.
