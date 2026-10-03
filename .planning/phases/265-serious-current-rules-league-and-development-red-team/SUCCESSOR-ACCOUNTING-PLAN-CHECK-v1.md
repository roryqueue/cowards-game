# Successor accounting plan check

Status: **PASS**

Scope checked: `265-15-SUCCESSOR-ACCOUNTING-AMENDMENT-v1.md`, the existing Task B contract in `265-15-IMPORT-CRASH-REPAIR-PLAN-v1.md`, terminal metadata in `265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v2.md`, and the relevant lean accounting identities/readers.

## Findings

- The successor route uses disjoint v3 store, temp, canonical allocation and v4 request identities; consumed v1/v2 artifacts remain immutable. The plan directs strict version-based path selection, not arbitrary caller paths.
- The predecessor binding enumerates the closed v2 allocation, request, entry, terminal, time journal, empty charge journal, HEAD/source and independent terminal report bytes. It requires authenticating the terminal linkage and closed journal, and rejecting missing, changed, duplicate or understated lineage. The bounded terminal note supports the stated values: 757,571 ms, zero charges, no result, `SIGTERM`, cumulative 1,323,030 ms.
- The carry-forward preserves unknown historical peak usage as unknown. It counts surviving v1/v2 files and owned writable paths once, and uses the larger conservative terminal physical snapshot when it exceeds current survivors, with the distinction recorded. This avoids treating current size as a historical peak or double-counting the snapshot and its constituent files.
- It keeps the existing 15 GB total and 12/2/1 GB partitions, 28,800,000 ms, 300 Matches, and runtime limits unchanged; prior elapsed time and future parent-terminal/verifier time remain charged. No reset, retry, refund or synthesized legacy close is authorized.
- The plan requires tests for version routing, tampered predecessor/report/approval/blocks, complete carry-forward, no double count and no cap reset, while explicitly preserving v1/v2 reader semantics. Scope remains metadata-only for known bounded records; it disallows repeat full historical factory replay and any real prepare/provider/Match during source work.

No blocker found in this bounded plan check. No full scan, tests, preparation, provider/Match execution, source edits, or STATE edits were performed.
