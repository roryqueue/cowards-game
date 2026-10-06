---
phase: 265
plan: 16
kind: source_only_existing_plan_repair
status: revised_for_check
requirements: [LEAG-02]
---

# Narrow source-only handshake repair

## Research and scope

The closed GSD diagnosis `.planning/debug/v7-first-exchange-cleanup.md` confirms a live producer/consumer contradiction in consumed source15a2adbd: host startupBinding hashes version7 payloads using the version5 domain, while generated brokerV7 requires version7. This check precedes Worker construction. Broker rejection predicts the finite stream failure and subsequent unsuccessful stream close; actual cleanup subresults and broker exit are not separately observed. No timing/resource/rules amendment is indicated.

The user's standing autonomous implementation request covers correction of a confirmed source defect. This plan grants source/test work ONLY, not any new empirical route. The precise approved v7 one+conditionalone envelope ended at diagnostic refusal.29 charges, every cost/file and all consumed records/readers remain immutable; baseline denied. Do not revive the v7 request, allocation, result, authority or ordinary reader.

## One serial TDD task

Ownership: `scripts/lib/v1-38-lean-container-match-session.ts` and a connected isolated regression test, preferably `scripts/run-v1-38-lean-host-stage-v7.test.ts` or the existing startup-session fixture. No unrelated source edits, policy/constants/version/allocation changes or cleanup semantics change.

1. RED: exercise the real session startup-frame producer with issued v5/v6/v7 authorities. Keep its production injection guard intact: DO NOT pass transport/streamFactory options under authority. Instead use the existing startup-v5 fixture's test-only module interception of node:child_process.spawnSync and node:worker_threads.Worker (fake shared-buffer worker postMessage); real defaultTransport/defaultStreamFactory and startup frame code execute, no OS/native worker is created. Extend the existing v7 fixture's deny-by-default mocks narrowly or add an explicitly raw-rooted isolated fixture using that pattern. Synthetic fixture metadata/sealed cold seams are mocked transparently. Assert the emitted requestRoot equals the exact version-domain hash expected by that generated broker for the same payload and ordinal. Explicitly demonstrate v7 fails before the fix and v5/v6 remain correct. Assert the broker branch selected for each authority is the same version; include rejection of a wrong-version root. Do not merely inspect source text or test a new unused helper. No native Docker/Worker/subprocess/Strategy execution; synthetic payloads only. Also retain a negative assertion that authority plus injected transport/streamFactory still rejects.
2. GREEN: align the single host version selection with the active version7 descriptor while leaving v5/v6 bytes/domains and all startup/guest/host/Match/cleanup bounds unchanged. Prefer a minimal producer correction, no redesign.
3. Regression/source integration: run focused connected handshake tests, existing v7 source tests and strict strategy-lab type check. Full live manifest must change for the source delta; no old source root is relabeled. Retain exact RED/GREEN evidence and atomic source commit(s), no empirical credit. Stop on unsafe native dependency or new semantics uncertainty.

## Gates and truths

Independent plan check first; executor performs only this task. Then independent source review/fix, scoped validation and source verification. Truths: genuine v7 host frame matches generated v7 broker digest domain; v5/v6 behavior remains unchanged; bounds/cleanup/authority/privacy remain unchanged; regression hits real producer call; no live run/read/refund/recredit or requirement completion claim. No UI scope. Existing consumed source remains recoverable at its immutable commit.

Every current cost continues `41943494 + nowMs - 1791290048578` under prospective57600000ms/15GB300; no reset or excluded processing gaps. Repair readiness is not permission for a new allocation/Match. Any next empirical envelope still needs a genuinely new prospective human decision, not a repeat literal for the consumed one.
