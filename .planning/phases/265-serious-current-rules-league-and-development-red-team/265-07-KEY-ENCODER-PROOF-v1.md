# Plan265-07 — Unicode key encoder repair proof

After the consumed v5 route and its unique retained verification closed, root
integrated a narrow two-file repair atdbf5daa24b0764f68124af2e475b9aa6135dc8ae.
Implementation70430463/source2f008952. The production encoder raw20828f30 is the
independently reviewed private candidate7f955b5e with only its two import paths
normalized back to local production imports. Tests raw4069b453.

The encoder no longer builds raw UTF-8 sort buffers for every string. It compares
already validated keys by Unicode scalar value, which has the same lexicographic
order as unsigned UTF-8 bytes for well-formed strings. Emitted bytes, string
validation, escaping, errors, limits, traversal and fresh-output ownership remain
unchanged. It adds no Strategy/runtime cache and relaxes no admission stage.

Root's pre-integration bounded proof16509 completed exit0 on final helper
rawbd37a8a2, pinned baseline25019df9 and candidate7f955b5e:

- 41 exact byte/error comparisons, including malformed Unicode, error priorities,
  accessors, cycles and limits.
- 40 successful canonical encoder vectors, with pinned index/raw/canonical bytes
  and hashes, fresh-buffer mutation isolation and subsequent re-encoding.
- 16 selected consumed-v4 rows with exact descriptor/chunk/payload roots and byte
  equality. Allowlist rawea9cd5fa; only those files are read, with pre-read size
  caps and sanitized private-data errors. No provider/Strategy/Match runs.

The custom40-success subset root22d09ec1 is not the official70-vector root.
The official70-vector root is declared in the pinned index, not recomputed by
this helper. The normal whole-corpus tests remain part of focused validation.
Earlier helper rediscovery and pre-read-cap findings were fixed and independently
rereviewed; final private review rawc8e34fc5 is clean for this helper revision.

Root's actual final-main six focused suites pass46/46 in8.44seconds; formatting
and diff-check pass. An initial new test assertion used incorrect error names
and failed; root corrected the assertions to the existing baseline codes
INVALID_UNICODE_SCALAR and INVALID_GRAMMAR. Production errors did not change.
Independent exact final-main two-file review reports zero findings, recorded in
265-07-KEY-ENCODER-REVIEW-v1.md; its reviewer did not run tests.

The earlier bounded synthetic120-key benchmark measured approximately31percent
encoder-component saving over four alternating50-encode rounds. It is not a
whole-Match prediction or empirical competitive result. No new Match follows
from the comparison or source review alone.

Root's unique fixed-source CI gate16883 is active, running the eight exact
Phase265 source-only CI commands with implementation/source/test/CI-byte guards.
No full-gate pass is claimed yet. Its create-only private start marker prevents
duplicate orchestration. Keep main source fixed. A future distinct same-bounds
route still needs fresh packets, independent reviews, a new immutable allocation
and fresh passing same-process capacity. Standing human approval applies;
consumed history is never retried, refunded or promoted. No LEAG, freeze,
formation, holdout, counted, public or production authority is established.
