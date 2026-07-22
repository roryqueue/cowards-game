---
phase: 261
slug: integrated-service-proof-drift-guards-and-release
status: verified
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: 2026-07-22
---

# Phase 261 — Security

## Audit scope

ASVS L1 verification of the 49 threats declared in Plans 261-01 through 261-13. The checkout has no explicit security configuration, so the defaults are ASVS L1 and `block_on: high`. This audit verifies implemented controls, not the completion of the deliberately deferred archive/tag operation. The focused source/fixture suite covering the listed controls exited successfully on 2026-07-22.

## Trust Boundaries

| Boundary | Data crossing |
|---|---|
| Scenario/collector to restricted evidence | hostile process bytes, paths, digests, and access events |
| Runtime/service/rollback/browser to public proof | receipt identities, failure results, replay data, and privacy-safe projections |
| Public proof to release readiness/archive/tag | canonical bytes, hashes, protected paths, and Git identities |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Evidence | Status |
|---|---|---|---|---|---|---|
| T-261-01A | Spoofing | scenario manifest | high | mitigate | `scripts/lib/v1-37-integrated-proof-manifest.ts:479,492,552` exact-coverage assertion | closed |
| T-261-01B | Tampering | restricted store | critical | mitigate | `scripts/lib/v1-37-restricted-evidence-store.ts:340,391,563` no-symlink, exclusive-write, verify-on-read controls | closed |
| T-261-01C | Information Disclosure | public refs | critical | mitigate | `scripts/check-v1-37-release-boundaries.ts:298,376,387` safe projection and concrete-preimage scan | closed |
| T-261-01D | Repudiation | retention/deletion | high | mitigate | `scripts/lib/v1-37-restricted-evidence-store.ts:432,715,725,761,767` append-only access/delete events | closed |
| T-261-SC | Tampering | package supply chain | low | accept | Accepted-risk log entry AR-261-SC; frozen lockfile, no Phase-261 install command | closed |
| T-261-02A | Spoofing | counted-lane labels | critical | mitigate | `scripts/check-v1-37-release-boundaries.ts:315-407`; strict receipt/privacy join | closed |
| T-261-02B | Tampering | authority ownership | critical | mitigate | `scripts/check-boundary-monitors.ts:2746-2759,2958-3054` runtime-owner/provider checks | closed |
| T-261-02C | Information Disclosure | public release corpus | critical | mitigate | `scripts/check-v1-37-release-boundaries.ts:298,369-387` recursive safe-schema/preimage checking | closed |
| T-261-02D | Denial of Service | default monitor hub | medium | mitigate | `scripts/check-boundary-monitors.ts:5696-5720` pure strict check wired exactly once | closed |
| T-261-03A | Spoofing | topology identity | critical | mitigate | `scripts/run-v1-37-integrated-service-proof.ts:939-1043,1773-1855` validated receipt/control and bound inputs | closed |
| T-261-03B | Tampering | runtime result | critical | mitigate | `apps/runtime-service/src/execute-match.ts:1448-1563`; Chronicle, reconstruction, terminal binding | closed |
| T-261-03C | Information Disclosure | subprocess capture | critical | mitigate | `scripts/lib/v1-37-restricted-evidence-store.ts:697-725`; restricted-first objects and safe refs | closed |
| T-261-03D | Denial of Service | process lifecycle | high | mitigate | `scripts/run-v1-37-integrated-service-proof.ts:1239-1245,1325-1368,1612` bounded timeouts and cleanup | closed |
| T-261-03E | Elevation of Privilege | Strategy execution | critical | mitigate | `scripts/check-boundary-monitors.ts:2746-2759,2985`; runtime-service-only ownership guard | closed |
| T-261-04A | Tampering | audit baseline | critical | mitigate | `scripts/check-v1-37-audit-reproduction.ts`; executable current audit reproduction checker | closed |
| T-261-04B | Repudiation | rollback/correction | high | mitigate | `scripts/run-v1-37-integrated-service-proof.ts:1379-1434`; snapshots and compensation evidence | closed |
| T-261-04C | Spoofing | retry/idempotence | high | mitigate | `scripts/run-v1-37-rollback-proof.ts:30-33`; exact-idempotent retry scenario | closed |
| T-261-04D | Information Disclosure | database/service failures | high | mitigate | `scripts/run-v1-37-rollback-proof.ts:19,141,199-201`; restricted refs rather than raw receipts | closed |
| T-261-05A | Spoofing | public lane/Set labels | high | mitigate | `scripts/run-v1-37-browser-proof.ts` public collector plus `scripts/evaluate-v1-37-integrated-service-proof.ts:88-111` receipt join | closed |
| T-261-05B | Information Disclosure | network/document output | critical | mitigate | `scripts/check-v1-37-release-boundaries.ts:369-387`; public body/rendered value concrete-preimage check | closed |
| T-261-05C | Tampering | replay rendering | high | mitigate | `scripts/run-v1-37-browser-proof.ts` plus integrated proof artifact `browser.board=nonblank-contained-in-bounds-terminal-consistent` | closed |
| T-261-05D | Denial of Service | missing topology | medium | mitigate | `scripts/run-v1-37-integrated-service-proof.ts:1325-1368`; mandatory bounded topology reads fail closed | closed |
| T-261-06A | Spoofing | proof status | critical | mitigate | `scripts/evaluate-v1-37-integrated-service-proof.ts:88-111`; exact closed proof validation | closed |
| T-261-06B | Tampering | canonical artifacts | critical | mitigate | `scripts/evaluate-v1-37-integrated-service-proof.ts:115-130`; canonical render and checked bytes | closed |
| T-261-06C | Information Disclosure | public rollup | critical | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:89-92`; public-safe JSON before Markdown render | closed |
| T-261-06D | Repudiation | retained evidence | high | mitigate | `scripts/lib/v1-37-restricted-evidence-store.ts:738-740`; release presence and opaque ref verification | closed |
| T-261-07A | Spoofing | requirement status | critical | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:55-66`; exact 56-row / 55+1 schema | closed |
| T-261-07B | Tampering | canonical proof | high | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:48,91-92`; input root and byte-exact check | closed |
| T-261-07C | Repudiation | outer release | critical | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:61,66,90`; PROOF-08 only ready/pending, no override | closed |
| T-261-07D | Information Disclosure | proof output | critical | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:89`; recursive public-output safety before rendering | closed |
| T-261-08A | Spoofing | audit status | critical | mitigate | `scripts/generate-v1-37-milestone-audit.ts:120-132`; closed 56/55/1 audit schema | closed |
| T-261-08B | Tampering | audit rendering | high | mitigate | `scripts/generate-v1-37-milestone-audit.ts:146-169`; machine JSON and byte-derived Markdown check | closed |
| T-261-08C | Information Disclosure | audit output | critical | mitigate | `scripts/generate-v1-37-milestone-audit.ts:120-132,146-152`; validated safe projection | closed |
| T-261-09A | Spoofing | Strategy foundation | high | mitigate | `scripts/generate-v1-37-strategy-foundation-handoff.ts:199-228,323-336`; current machine-authority binding | closed |
| T-261-09B | Information Disclosure | handoff | critical | mitigate | `scripts/generate-v1-37-strategy-foundation-handoff.ts:323-336`; closed schema and checked safe hashes | closed |
| T-261-09C | Elevation of Privilege | next milestone | high | mitigate | `scripts/generate-v1-37-strategy-foundation-handoff.ts:228,328,356`; authorization forced false | closed |
| T-261-10A | Spoofing | readiness | critical | mitigate | `scripts/evaluate-v1-37-release-readiness.ts:175-275,303-346`; exact 55+1 and prerequisite hashes | closed |
| T-261-10B | Tampering | future identity | critical | mitigate | `scripts/evaluate-v1-37-release-readiness.ts:125,243-252,374-377`; tag absence/no predicted identity | closed |
| T-261-10C | Information Disclosure | readiness output | high | mitigate | `scripts/evaluate-v1-37-release-readiness.ts:369-377`; safe hashes-only rendered projection | closed |
| T-261-11A | Tampering | tag object | critical | mitigate | `scripts/check-v1-37-release-tag.ts:43-77,91`; archive membership and post-tag checker | closed |
| T-261-11B | Spoofing | release evidence | critical | mitigate | `scripts/check-v1-37-release-tag.test.ts:20-22`; missing/unknown/substituted/forged blob rejection | closed |
| T-261-11C | Denial of Service | boundary hub | medium | mitigate | `scripts/check-boundary-monitors.ts:5696-5720`; one serialized pure invocation | closed |
| T-261-12A | Spoofing | prearchive verification | critical | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:55-66`; executable exact state checker | closed |
| T-261-12B | Tampering | planning state | high | mitigate | `scripts/evaluate-v1-37-prearchive-proof.ts:48,75-87`; input-root and protected-baseline binding | closed |
| T-261-12C | Repudiation | audit findings | high | mitigate | `261-REVIEW.md:1-92`; final clean review, while audit schema requires zero overrides (`scripts/evaluate-v1-37-release-readiness.ts:151,308`) | closed |
| T-261-13A | Tampering | archive commit | critical | mitigate | `scripts/check-v1-37-release-tag.ts:19-77`; allowlisted archive blobs and protected-path rejection | closed |
| T-261-13B | Spoofing | release tag | critical | mitigate | `scripts/check-v1-37-release-tag.test.ts:16-18`; annotated type, target, and exact readiness metadata fixtures | closed |
| T-261-13C | Repudiation | release ordering | critical | mitigate | `scripts/evaluate-v1-37-release-readiness.ts:125,243-252`; tag absent prearchive and ordered post-check design | closed |
| T-261-13D | Elevation of Privilege | next milestone | high | mitigate | `scripts/evaluate-v1-37-release-readiness.ts:151-154,308-311`; Strategy authorization remains false | closed |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---|---|---|---|---|
| AR-261-SC | T-261-SC | The plan accepts the low supply-chain exposure because Phase 261 performs no package installation and uses the existing frozen workspace dependencies. | Phase 261 threat model | 2026-07-19 |

## Threat Flags

No Plan 261 summary contains a `## Threat Flags` entry. No unregistered flag was found.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|---|---:|---:|---:|---|
| 2026-07-22 | 49 | 49 | 0 | gsd-security-auditor |

## Sign-Off

- [x] All declared threats verified by disposition.
- [x] Accepted risk documented.
- [x] `threats_open: 0` justified at ASVS L1.
- [x] No implementation files were modified; no archive commit or tag was created.

**Approval:** verified 2026-07-22
