# Phase 265 Plan 07 — Draft v4 review (superseded, do not compile)

Draft v4 review outcome: reject the six tactical/teacher jobs; accept the five model jobs for this v4-only review. Do not compile or use v4. The sole reason for rejection is an unintended prompt-provenance change in every tactical and teacher request. This report preserves the review history; it does not supersede the v3 review or authorize any execution. Parent was notified before completing this report.

- Draft: `.strategy-lab/phase265-request-drafts-v4-20260922.json`
- Exact SHA-256: `753458b10315ad8a30b1cc9c19e7711dbd879c8f42d2d25327b0c643bc88e75c`
- Reviewer: `/root/265_draft_reviewer`
- Comparison: v3 → v4. All 11 jobs and top-level keys remain. For the five model jobs, only `authoring.sourceMessage` and its corresponding `authoring.promptRoot` changed. However, each of the six tactical/teacher jobs also changed its provider `promptRoot`, without corresponding prompt bytes in the draft and contrary to the stated model-only change. Since these roots are producer provenance, they cannot be accepted as incidental or equivalent without the exact corresponding bytes.

The five model prompt roots were recomputed from their updated `sourceMessage` bytes and match; their context roots still recompute from the disclosed dependency roots. The model prompt now states the canonical awareness-grid `{ cells: [...] }` shape and exact four initiative-field names. The source/build dependency artifact and the remaining job information boundaries, provider model, splits, and teacher limits were rechecked. No execution or packet artifact was produced.

Per-job comparison review times use actual UTC clock brackets. Clock output is second-resolution; durations conservatively add one second to the observed timestamp delta.

| Job | Disposition | Review | Reason |
|---|---|---:|---|
| `phase265-01-tactical` | rejected | 2,000 ms | Tactical provider `promptRoot` changed from v3 without matching prompt bytes or an authorized tactical prompt change. |
| `phase265-02-teacher` | rejected | 2,000 ms | Teacher provider `promptRoot` changed from v3 without matching prompt bytes or an authorized teacher prompt change. |
| `phase265-03-model` | accepted | 2,000 ms | Intended model prompt change; new prompt root matches exact bytes; schedule/context and boundary remain valid. |
| `phase265-04-tactical` | rejected | 3,000 ms | Tactical provider `promptRoot` changed from v3 without matching prompt bytes or an authorized tactical prompt change. |
| `phase265-05-model` | accepted | 2,000 ms | Intended model prompt change; new prompt root matches exact bytes; schedule/context and boundary remain valid. |
| `phase265-06-model` | accepted | 2,000 ms | Intended model prompt change; new prompt root matches exact bytes; schedule/context and boundary remain valid. |
| `phase265-07-tactical` | rejected | 2,000 ms | Tactical provider `promptRoot` changed from v3 without matching prompt bytes or an authorized tactical prompt change. |
| `phase265-08-teacher` | rejected | 2,000 ms | Teacher provider `promptRoot` changed from v3 without matching prompt bytes or an authorized teacher prompt change. |
| `phase265-09-model` | accepted | 3,000 ms | Intended model prompt change; new prompt root matches exact bytes; schedule/context and boundary remain valid. |
| `phase265-10-teacher` | rejected | 2,000 ms | Teacher provider `promptRoot` changed from v3 without matching prompt bytes or an authorized teacher prompt change. |
| `phase265-11-model` | accepted | 2,000 ms | Intended model prompt change; new prompt root matches exact bytes; schedule/context and boundary remain valid. |

```json
{
  "draftSha256": "753458b10315ad8a30b1cc9c19e7711dbd879c8f42d2d25327b0c643bc88e75c",
  "reviewerAgentId": "/root/265_draft_reviewer",
  "jobs": [
    {"id":"phase265-01-tactical","disposition":"rejected","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:04 UTC","endUtc":"2026-09-23 03:31:05 UTC","reason":"Tactical provider promptRoot changed from v3 without matching prompt bytes or authorized prompt change."},
    {"id":"phase265-02-teacher","disposition":"rejected","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:05 UTC","endUtc":"2026-09-23 03:31:06 UTC","reason":"Teacher provider promptRoot changed from v3 without matching prompt bytes or authorized prompt change."},
    {"id":"phase265-03-model","disposition":"accepted","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:06 UTC","endUtc":"2026-09-23 03:31:07 UTC","reason":"Intended model prompt update; exact prompt-root recomputation, schedule, context and boundaries checked."},
    {"id":"phase265-04-tactical","disposition":"rejected","reviewMilliseconds":3000,"startUtc":"2026-09-23 03:31:07 UTC","endUtc":"2026-09-23 03:31:09 UTC","reason":"Tactical provider promptRoot changed from v3 without matching prompt bytes or authorized prompt change."},
    {"id":"phase265-05-model","disposition":"accepted","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:09 UTC","endUtc":"2026-09-23 03:31:10 UTC","reason":"Intended model prompt update; exact prompt-root recomputation, schedule, context and boundaries checked."},
    {"id":"phase265-06-model","disposition":"accepted","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:10 UTC","endUtc":"2026-09-23 03:31:11 UTC","reason":"Intended model prompt update; exact prompt-root recomputation, schedule, context and boundaries checked."},
    {"id":"phase265-07-tactical","disposition":"rejected","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:11 UTC","endUtc":"2026-09-23 03:31:12 UTC","reason":"Tactical provider promptRoot changed from v3 without matching prompt bytes or authorized prompt change."},
    {"id":"phase265-08-teacher","disposition":"rejected","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:12 UTC","endUtc":"2026-09-23 03:31:13 UTC","reason":"Teacher provider promptRoot changed from v3 without matching prompt bytes or authorized prompt change."},
    {"id":"phase265-09-model","disposition":"accepted","reviewMilliseconds":3000,"startUtc":"2026-09-23 03:31:13 UTC","endUtc":"2026-09-23 03:31:15 UTC","reason":"Intended model prompt update; exact prompt-root recomputation, schedule, context and boundaries checked."},
    {"id":"phase265-10-teacher","disposition":"rejected","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:15 UTC","endUtc":"2026-09-23 03:31:16 UTC","reason":"Teacher provider promptRoot changed from v3 without matching prompt bytes or authorized prompt change."},
    {"id":"phase265-11-model","disposition":"accepted","reviewMilliseconds":2000,"startUtc":"2026-09-23 03:31:16 UTC","endUtc":"2026-09-23 03:31:17 UTC","reason":"Intended model prompt update; exact prompt-root recomputation, schedule, context and boundaries checked."}
  ]
}
```
