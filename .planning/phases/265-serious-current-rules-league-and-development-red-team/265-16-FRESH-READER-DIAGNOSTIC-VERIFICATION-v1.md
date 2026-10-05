---
phase: 265-16-fresh-reader
verified: 2026-10-05T19:18:23Z
route: diagnostic-v4
invocations: 1
invocation_session: 35941
process_status: exit_0
accepted: true
status: retained_valid
evidence_class: limited_exploratory
complete: false
phase_complete: false
source_root: sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca
head: b401aac8203db9eae1304c454f59e238b207afe9
allocation_root: sha256:f2acf55470bfc4c40dd182274980b3431cbdcb3a8afb3676f836d60cb1fef91d
allocation_bytes_root: sha256:a075bbc744e5559c636331f4f42c8bb116c39f690c32ec3cfdbf2cf8357b8e25
request_bytes_root: sha256:c1ee0af53ec9f86601304ffde2a9e947dbb275920de858b09e58d19fdf6c41d0
result_root: sha256:436e5427412ac71882254296459750df526ddf28e1b3e8e1abd0a2afa73449dd
terminal_bytes_root: sha256:9d16912880a98bb6eaf644ca1f9a27483c0cadc034775ef103dae8fcfa9c44ce
check_root: sha256:a323f13fa38805942202d79814c8bd5c3167eb98ab38f35d0e126120eaf4085e
check_bytes_root: sha256:0051fc05ff0eb3c3b42bbc60c505f5b4ba41d166cf91e461e9dd25a37c9b67de
---

# Phase 265-16: Fresh V4 Diagnostic Verification

The unique ordinary retained verifier was invoked exactly once:

```sh
sh scripts/run-v1-38-lean-correction.sh verify-supervisor-diagnostic-v4 --request .strategy-lab/lean-correction-supervisor-diagnostic-request-20261005-v4.json
```

It exited 0 and wrote a closed retained check with `accepted: true`, `status: retained_valid`, and `evidenceClass: limited_exploratory`. The check records one successful current Match and 13 cumulative charges, with cleanup complete. It is explicitly incomplete (`complete: false`, `phaseComplete: false`); holdout and formation remain unopened, no robust pure claim was made, and public/counted/production authorization remains false.

The verified entry retained HEAD `b401aac8203db9eae1304c454f59e238b207afe9` and source root `sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca`. After reader closure, HEAD and the reviewed v4 source manifest remained held and the manifest's tracked source diff was clean. The reader identity was `correction-supervisor-diagnostic-v4-verifier`, started at `1791227773616`, observed at `1791227788134`, and closed at `1791227788248`; the verifier, reader-gap, and reader-close intervals are closed and the ledger is inactive. The child terminal was `child_exited`, exit code 0, no signal; parent and child were absent before the verifier started.

## Safe accounting summary

- Actual terminal elapsed: 225,639 ms. Final cumulative elapsed, including reader closure: 23,073,294 ms of 28,800,000 ms; 5,726,706 ms remain.
- Cumulative charged: 13 of 300; 287 charge slots remain.
- Cumulative retained bytes: 7,081,984 of 12,000,000,000; remaining retained allowance: 11,992,918,016 bytes.
- Reader scratch high-water: 1,118,416,896 of 2,000,000,000 bytes.
- The 36 × 600,000 ms amount (21,600,000 ms) is the sum of per-Match maximum lifetimes, not a measured or proven minimum for a baseline. The runner's admission check reserves one maximum Match plus cleanup (30,000 ms), terminal (30,000 ms), retained check (600,000 ms), and replay (600,000 ms), totaling 1,860,000 ms, in addition to elapsed work already charged. Each subsequent operation remains subject to live cumulative capacity checks. No baseline was invoked in this turn; the remaining elapsed allowance alone does not establish whether a full baseline can finish. MAIN must decide admission from the actual current state and these guards before any baseline preparation or run.

## Raw roots

- Request bytes: `sha256:c1ee0af53ec9f86601304ffde2a9e947dbb275920de858b09e58d19fdf6c41d0`.
- Allocation bytes: `sha256:a075bbc744e5559c636331f4f42c8bb116c39f690c32ec3cfdbf2cf8357b8e25`.
- Entry bytes: `sha256:630d4597392e4b1f92cd60e45bbe1c85cfdbbd39c42b941839ac2ad0913b735d`.
- Terminal bytes: `sha256:9d16912880a98bb6eaf644ca1f9a27483c0cadc034775ef103dae8fcfa9c44ce`.
- Result bytes: `sha256:f80980fce142b7d4041a6860a658e40d4d7638b97ffc7ac489ae0d44c5101409`.
- Supervisor-reason bytes: `sha256:da54b99440c60f46173fb00c920ed634f7962f591ee2a79686807e990d490355`.
- Final time-accounting bytes: `sha256:8389d724f882dc73cdfa951ddbde2095ce96afe4952ed62c54ee48b50b595ce2`.
- Check semantic root: `sha256:a323f13fa38805942202d79814c8bd5c3167eb98ab38f35d0e126120eaf4085e`.
- Check raw bytes: `sha256:0051fc05ff0eb3c3b42bbc60c505f5b4ba41d166cf91e461e9dd25a37c9b67de`.

This reports the accepted one-cell diagnostic retained audit only. It is not a completed baseline, phase acceptance, full scientific claim, or downstream authority. No prior reader was retried, no provider was invoked by this verifier, and no baseline or Match was run during this verification turn.
