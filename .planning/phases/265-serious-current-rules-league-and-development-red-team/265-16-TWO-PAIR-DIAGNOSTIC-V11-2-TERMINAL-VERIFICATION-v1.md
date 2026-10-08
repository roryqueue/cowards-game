# v11-2 Diagnostic — Independent Retained Verification

Private finite accounting report. No Strategy, objective, memory, runtime I/O, stdio, exception detail, or result payload is disclosed here.

## Verdict

**PROCESS-INVALID / NOT ACCEPTED.** Exactly one appropriate ordinary retained verifier was invoked. It closed with exit code 1 and `LEAN_CORRECTION_FAILED_DETAILS_WITHHELD`. No retry, terminal-only reader, test, provider invocation, source edit, HEAD edit, or commit was performed.

Command: `sh scripts/run-v1-38-lean-correction.sh verify-supervisor-diagnostic-v11-2 --request .strategy-lab/lean-correction-supervisor-diagnostic-request-20261007-v11-2.json`

Ordinary verifier session: **29841**, exit **1**. Finite marker authentication session: **12800**, exit **0**. Authentication was a read-only finite-root/accounting check, not another ordinary reader or an old retained audit. Current result bytes were hashed for accounting only; no result payload was inspected.

## Actual identity and hold

| Field | Actual value |
| --- | --- |
| Entry/current HEAD | `ce68a908f5331e52c78748ddb87a5581ce67d29e` |
| Source root | `sha256:84b80756789cedde6db22e365a7826d47f277ba592fcae710ad296aad77444ba` |
| Current manifest entries | 915 |
| Allocation root | `sha256:be869c37a88ca74f06985fc0dc2b1ced409a69f50bc6bcea4cd4226caaae9ffc` |
| Allocation raw root | `sha256:03a483a0d3bdded3d382508daefc16fa0478d52857fda14e961252b9374f08b3` |
| Result root bound by refusal | `sha256:3be5df5e8203f0527d7b5abf2f4e12c1de7d97e61d6fd1ab0d2904094d0ee907` |
| Result raw root | `sha256:7e2f13e972c3a8499c5df2608b2bc059d2d3a9a3e77369727edbbb10bac34611` |

Source/HEAD hold completed against actual entry identity: current manifest root and 915 entries matched the entry, carry, and hold seal; current HEAD matched entry and seal. `terminal-hold-complete-v11.json` is present; `terminal-hold-refusal-v11.json` is absent. Canonical file bytes, schema-domain roots, and finite carry/refusal/closure/hold cross-joins authenticated. The reader obtained the entry HEAD internally; it was not fabricated.

## Refusal / carry / FINAL

| Marker | Semantic truth | Root | Raw root |
| --- | --- | --- | --- |
| Result-reader refusal | `accepted=false`, ordinal 2, diagnostic | `sha256:f9cf55faa45775bcb4ad249910c8b18e566aa0fa5d820ab7307df779692ce549` | `sha256:0b936c8518c401806588332a9835a847f95f35e13a575af2d375cecfd0b16402` |
| Terminal carry | `outcome=failed_result`, `accepted=false`, non-authorizing | `sha256:2cb8f6512bd7a298e1467c65c44fc1fac4c30b0c945bf02cfbfe6c64f5a84674` | `sha256:0d787c32358687eb9281acf6bf9c1553c5edc33395dfe583933a1c95f7857e10` |
| Retry closure | `closureClass=refused`, `finalReaderClose=false` | `sha256:9baf9809258e4cf11b90a267b8408af78bc1500fa805f6e229a0c625d5575352` | `sha256:b2e00396cd74773fab73071965742d238ce188b43b994772d57f836628ca6a54` |
| Hold completion | Actual source/HEAD/request/entry/verifier/carry joins | `sha256:2aac2504b3b5951ce190cab6645ce3c663d5cb01173d921b568f5eee4e10668d` | `sha256:9dc85ba33930abdc0255215aac3e1bcdb2999328a38e0ae10280d1fda22bdfac` |

Accepted-check file is absent. Closure check root and check raw root are both null; `acceptedCheckAbsent=true`. Actual reader-close exists, but **it is not an accepted FINAL**. Carry authenticates refusal custody only and grants no further execution or acceptance authority.

## Charge, time, resource and cleanup accounting

| Field | Actual retained value |
| --- | --- |
| Ordinary verifier interval | `correction-supervisor-diagnostic-v8-verifier` |
| Verifier start | 1791421482212 ms |
| Verifier close | 1791421485491 ms |
| Actual reader-close | 1791421485608 ms |
| Verifier duration | 3,279 ms |
| Reader-close duration | 117 ms |
| Time active | false |
| Closed cumulative elapsed | 105,674,871 ms |
| Cumulative charges | 34 |
| Current diagnostic charges | 1 |
| Current retained terminals | 1 |
| Compact terminal record | `success / OK / cleanupComplete=true` |
| Actual child-terminal | `child_failed / exitCode=0 / signal=null` |
| Child elapsed upper bound | 507,769 ms |
| Parent RSS at terminal | 378,466,304 bytes |
| Observed child RSS at terminal | 575,397,888 bytes |
| Physical bytes at terminal | 20,619,264 bytes |
| Carry allocated disk | 20,561,920 bytes |
| Carry survivor count | 661 |

The success compact record and cleanup flag do not override the actual parent/child failure or ordinary-reader refusal. The parent supplied finite reason code `resource_sampling_exception`; this report did not inspect exception detail or independently diagnose that reason. Retained `cleanupComplete=true` is the compact Match cleanup evidence, not a new independent process-tree certification.

All costs continue to count. At the conservative 2026-10-08T01:06:28Z observation upper boundary, carrying time forward from actual reader-close yields 105,777,263 ms (2,222,737 ms remaining against 108,000,000 ms). This is a point-in-time accounting snapshot, not a freeze or a refund; marker authentication, report writing, coordination, and every subsequent delay remain chargeable through actual administrative closure. Deadline remains 2026-10-08T01:43:30.738Z. Same 2 GiB observed resource bound and 768 MiB Node old-space bound were maintained for the verifier/check commands; no historical peak certification is implied. Report/marker bytes remain private retained costs; no cleanup deletion or refund occurred.

## Scope and uncertainty

No baseline, phase-completion, LEAG, freeze, public release, formation, or holdout credit is awarded. This verifies actual failed-result custody and closure only. No detailed cause, raw result behavior, or resource-exception repair is inferred. Independent inspection of finite current markers succeeded; ordinary acceptance failed.

## MAIN scope clarification

The independent report above is retained verbatim. Its resource sentence says “2 GiB”; the frozen scratch limit is exactly 2,000,000,000 bytes (2 GB), not 2 GiB. No bound was changed, and the consumed private report remains immutable. Its actual finite resource observations do not prove a native memory cause or acceptance. Actual run and unique reader are closed; source/HEAD hold is released only after the authenticated completion seal and no active experiment/verifier processes. Both approved diagnostic/conditional-baseline pairs have now been used; no new Match or allocation is authorized by this report.
