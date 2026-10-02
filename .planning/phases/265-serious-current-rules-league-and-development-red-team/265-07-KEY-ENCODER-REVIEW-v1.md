---
reviewed: 2026-10-02T03:20:00Z
commit: dbf5daa24b0764f68124af2e475b9aa6135dc8ae
parent: 99a9d4b5aaf45f3889e0efe2430070d6079158b6
files_reviewed: 2
files_reviewed_list:
  - packages/spec/src/canonical-json-encode.ts
  - packages/spec/src/canonical-json-encode.test.ts
findings:
  blocker: 0
  warning: 0
  total: 0
status: clean
---

# Phase 265-07: Canonical JSON Key Encoder Review

**Status:** Clean  
**Scope:** The two-file diff in commit `dbf5daa24b0764f68124af2e475b9aa6135dc8ae`; production encoder raw SHA-256 `20828f3075921956da983740f620993c8d4b48e8101c938fdd684b81eae5de27`, test raw SHA-256 `4069b4535ed04641f27a4af492d0158405811985dd9d26c57d49b1a3344f0345`.

## Review notes

The production change removes the redundant UTF-8 sort-byte encoding and sorts keys by Unicode scalar values. For well-formed Unicode strings, scalar-value order matches lexicographic unsigned UTF-8 byte order. The comparator advances two UTF-16 code units for supplementary scalars and one for BMP scalars; existing `encodeString` validation runs on each key before sorting, so lone surrogates continue to return the same error before the comparator can observe them. Prefix ordering is retained. The emitted key bytes and all non-key encoding paths are unchanged.

The added tests exercise UTF-8/scalar-order boundaries, prefixes, supplementary characters, escaped keys, malformed-key rejection, accessor rejection without invoking getters, and fresh output buffers. Existing tests continue to cover insertion-order independence, canonical corpus output, raw-byte boundaries across ownership contexts, and fixed-token output isolation. The prior baseline's error codes (`INVALID_UNICODE_SCALAR` and `INVALID_GRAMMAR`) are asserted; no production error changes were introduced.

No correctness, security, or maintainability finding was identified in the reviewed diff. This is a source review only: no tests or formatter were run by this reviewer, and no claims are made about full-suite or runtime behavior.

---

_Reviewer: /root/265_v5_packet_review_  
_Depth: scoped adversarial source review_
