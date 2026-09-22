---
phase: 265
status: passed-read-only
source: 967742cb4c3b4b47a170a337735736243301bc52
date: 2026-09-21
issued: false
empirical_authority: false
---

# Actual retained Phase 264 compatibility

Main invoked the current `verifyHistoricalFactoryAssessmentForLeague` once on
the existing store `.strategy-lab/factory-264-fresh-20260914-approved-two` and
assessment artifact
`sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8`.
This is a real read of old evidence, not a fixture, new assessment selection,
calibration rerun, Strategy/Match/model call or renewed allocation.

The command exited **0** and returned:

| Field | Captured value |
|---|---|
| Issued execution authority | `false` |
| Status | `affirmed` |
| Assessment identity | `sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1` |
| Threshold artifact | `sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72` |
| Historical producer implementation | `sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b` |
| Historical assessment implementation | `sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c` |
| Current reader implementation | `sha256:d7e8d58add65717ff8d681782fa01b0105fd899ea8ebac0a1f413529f93a0770` |

Historical producer, historical assessment and current reader identities remain
separate. The old assessment/threshold identities exactly match Phase 264's
recorded result. This does not promote its nine mechanics controls into real
independent producers, establish current competitive strength or satisfy a
Phase 265 empirical requirement.

## Nonmutation check

Before and after, main independently enumerated sorted regular files, rejected
symlinks/nonregular entries, hashed each file's exact bytes, then hashed the
ordered JSON records `[relativePath, byteLength, sha256]` with a newline per row.
Both inventories matched exactly:

- Files: **1,875**.
- Bytes: **164,632,160**.
- File-tree SHA-256: `082271cc3bcb82408a70d7974a67edd1b3369b85e451200000359e201367a156`.

These are the current whole-store counts, including previously retained
assessment/correction artifacts; they are not a reinterpretation of the earlier
1,768-artifact gameplay inventory. No inventory recovery, old selector or
write-capable assessment command ran. No source or HEAD changed during the check.

## Command

```sh
./node_modules/.bin/tsx --eval 'import { createFactoryRepository } from "./packages/strategy-lab/src/factory/repository.ts"; import { verifyHistoricalFactoryAssessmentForLeague } from "./scripts/assess-v1-38-factory-independence.ts"; const r = verifyHistoricalFactoryAssessmentForLeague(createFactoryRepository("/Users/roryquinlan/runtime/cowards-game/.strategy-lab/factory-264-fresh-20260914-approved-two"), "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8"); console.log(JSON.stringify({ issued: r.issued, status: r.status, assessmentRoot: r.assessmentRoot, thresholdArtifactRoot: r.thresholdArtifactRoot, historicalProducerImplementationRoot: r.historicalProducerImplementationRoot, historicalAssessmentImplementationRoot: r.historicalAssessmentImplementationRoot, currentReaderImplementationRoot: r.currentReaderImplementationRoot }, null, 2))'
```

Read-only compatibility is complete. The final source gate and independent
goal verification remain separate; actual league execution still requires
Plan 265-07 Task 2's unapproved allocation and participant decision.
