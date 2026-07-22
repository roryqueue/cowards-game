# Plan 258-13 Preflight: Exact Evidence Graph and Successor Receipt

**Revalidated:** 2026-07-14  
**Status:** planning correction required before execution  
**Boundary:** additive v1.17 candidate work only; immutable v1.16 verification and production trusted-producer emptiness remain protected

## Finding

The original Plan 258-13 is materially under-scoped in two ways:

1. It names only the local attestation validator and mounted service loader, but the mounted authority is derived through import, persisted certificate rows, publication, and a shallower signed bundle. Exact graph validation therefore must propagate through every one of those consumers.
2. The current `runtime-execution-service-*.v1.17.candidate*` fixtures are per-invocation ABI envelopes, not full Match-service request/response receipts. Reusing that namespace for the successor service golden would conflate two contracts.

No gameplay ruling changes. The correction only closes identity, persistence, receipt, and compatibility boundaries already committed by RABI-05 through RABI-08.

## Existing Successor Primitives

- Fifteen fixed identity domains and ten exact executable pins already exist in `packages/spec/src/runtime-abi-v1-17.ts`.
- `canonical-identity-domains.ts` already provides u64be length framing.
- `runtime-identity-manifest.ts` already enforces one binding per domain in a canonical manifest.

These primitives are the v1.17 authority. The legacy attestation uses decimal-length-plus-NUL framing, ten broad node kinds, old lane identity fields, and reachability-only validation. A reachable cycle is currently accepted because the visited set suppresses it.

## Required Architecture

1. Preserve legacy modules and source bytes. Add explicit sibling v1.17 graph, identity, service, receipt, and Go verifier modules with deny-default dispatch.
2. Rename the Plan-11/12 per-invocation fixtures to `runtime-invocation-{request,response}.v1.17.candidate*`. Reserve `runtime-execution-service-{request,response}.v1.17.candidate*` for the full Match-service receipt golden.
3. Define a versioned edge schema in addition to the fifteen-domain manifest. Recompute every node digest from its exact domain and bytes; compare exact node and edge multisets, cardinality, indegree/outdegree, topological traversal, root constraints, and graph root.
4. Propagate a public-safe exact binding through attestation import, immutable persisted candidate rows, authority publication, signed authority bundle, and mounted loader. The binding includes graph schema/profile, identity-manifest root, evidence-graph root, exact-pin expansion, and a recomputable certificate-record hash.
5. Mint v1.17 receipt claims from canonical JSON and the v1.17 u64be receipt domain. Bind the full service request and compatibility tuple, authority publication/source manifest, both entrant identity/evidence roots, budget profile and monotonic ledger roots, Chronicle/final-state/outcome canonical hashes, and receipt version.
6. Keep trusted production producers empty. Positive tests use only fixture/managed identity and cannot imply counted certification.

## Required Execution Scope

The implementation must cover, directly or through new additive siblings:

- `packages/spec/src/runtime-evidence-attestation*`
- `packages/spec/src/runtime-evidence-authority-bundle*`
- `packages/persistence/src/runtime-evidence-import*`
- `packages/persistence/src/runtime-evidence-authority-publisher*`
- `apps/runtime-service/src/runtime-evidence-authority*`
- an additive persistence migration/schema for the exact v1.17 graph binding
- additive v1.17 runtime-service and semantic-receipt modules
- the sole TypeScript generator, distinct invocation/service fixtures, generated Go tables, and an additive Go v1.17 receipt verifier

Plan 258-14 retains ownership of production-default activation and rollback proof.

## Required RED Matrix

### Graph and pins

- missing or duplicate required domain, public ID, node, or edge;
- reachable extra node, disconnected orphan, root indegree, wrong/reversed edge, duplicate path;
- two-node reachable cycle and longer cycle;
- cross-domain digest alias and two-domain digest swap even after graph hash/signature recomputation;
- wrong canonical bytes and legacy decimal/NUL fabrication;
- floating/missing executable, version, target, flags, sysroot, adapter, containment, or settings pin;
- self/caller-supplied production trust and unregistered managed identity.

### Import, persistence, publication, and mounted authority

- attestation-import cycle;
- shallow bundle missing exact graph profile/root;
- tampered persisted graph or pin expansion;
- certificate-record hash that is not recomputable;
- publisher or loader dropping an exact binding;
- fixture/self-attestation entering production;
- non-empty production trusted-producer set before Phase 259.

### Receipt and TS/Go parity

- canonical claim insertion-order independence;
- exact TS/Go claim bytes, hash, signature, and full response bytes;
- missing graph or budget claim;
- v1.17 claims signed with the v1.16 domain;
- v1.16 receipt relabeled as v1.17;
- service/invocation fixture confusion;
- unknown version deny-default;
- current immutable v1.16 response still verifies;
- generated-only header and sole-writer enforcement.

Stable failure output must never echo attacker IDs or expose source, artifacts, flags, paths, memory, objectives, diagnostics, host details, or signing material.

## Immutable v1.16 Guard Values

| Evidence | Bytes | SHA-256 / signature |
|---|---:|---|
| request artifact | 8,164 | `5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5` |
| response wire | 42,025 | `9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97` |
| receipt signature input | 853 | `cdebdf5892e23604803e1c081cd60388eb312f6d68720c17123c218c17da4fc1` |
| fixture receipt signature | — | `hmac-sha256:deeba5b92e286e2b5ba862fc364fb90ec7c11192100da51a66d1a9c6338ab98b` |

Protected source hashes:

- `packages/spec/src/runtime-execution-service.ts`: `9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc`
- `apps/go-backend/runtime_semantic_receipt.go`: `36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d`
- `apps/go-backend/runtime_service_client.go`: `9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c`
- `apps/go-backend/runtime_service_client_test.go`: `4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185`
- migration 0017: `ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69`

## Safe Execution Split

1. Freeze additive v1.17 graph/identity and receipt types, exact edge schema, fixture namespaces, immutable guards, and RED contracts.
2. After those interfaces freeze, implement in parallel: exact graph validator; persistence/bundle/publication/mounted propagation; successor TS receipt/service plus generator and Go verifier.
3. Integrate generator checks, TS/Go parity, authority end to end, migration proof, privacy scans, and every immutable v1.16 hash guard.

The production pointer flip remains a separate small Plan-14 commit after this candidate proof is green.
