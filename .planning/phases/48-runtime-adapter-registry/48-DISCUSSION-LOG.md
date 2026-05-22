# Phase 48: Runtime Adapter Registry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 48-Runtime Adapter Registry
**Areas discussed:** Registry Scope And Owner, Existing JS/TS Migration Strategy, Compatibility Key Strictness, Experimental Adapter Policy

---

## Registry Scope And Owner

| Option | Description | Selected |
| --- | --- | --- |
| `@cowards/spec` owns registry data and schemas | Contract package owns language ids, adapter ids, readiness, capabilities, limits, and compatibility metadata. | ✓ |
| `@cowards/runtime-js` owns adapter registry | Keep registry close to current adapter implementation. | |
| New shared runtime contract package | Create another package for runtime registry/ABI metadata. | |

**User's choice:** `@cowards/spec` owns registry data and schemas.
**Notes:** Runtime packages own execution code, not contract-visible registry truth.

| Option | Description | Selected |
| --- | --- | --- |
| Separate language records and adapter records | Languages are distinct from adapters; adapters declare supported languages. | ✓ |
| Single runtime record | One record combines language and adapter. | |
| Adapter records only | Languages are just strings inside adapter records. | |

**User's choice:** Separate language records and adapter records.
**Notes:** Supports future multi-language clarity.

---

## Existing JS/TS Migration Strategy

| Option | Description | Selected |
| --- | --- | --- |
| Add new metadata fields while preserving old runtime field | Keep old shape and add new metadata. | |
| Replace `runtime` immediately | Move revisions to new metadata and remove/rename old field. | ✓ |
| Nest everything under `runtime` | Expand existing object to include all metadata. | |

**User's choice:** Replace old `runtime.name/version` shape with new first-class metadata.
**Notes:** This is deliberate contract cleanup, not additive decoration.

| Option | Description | Selected |
| --- | --- | --- |
| Yes, read legacy and write new | Readers normalize old records, new revisions use only new shape. | ✓ |
| No, hard cutover | Only new metadata accepted after Phase 48. | |
| Temporary dual write | Write both old and new fields during transition. | |

**User's choice:** Read legacy and write new.
**Notes:** Replacement direction with safe migration for stored/demo/archive data.

---

## Compatibility Key Strictness

| Option | Description | Selected |
| --- | --- | --- |
| Only behavior-significant ids and versions | Include behavior-affecting metadata; exclude labels/readiness/docs/display. | ✓ |
| Everything in registry/revision metadata | Include display and descriptive metadata too. | |
| Only existing runtimeVersion/runtimeAdapter fields | Minimal change. | |

**User's choice:** Only behavior-significant ids and versions.
**Notes:** Matches Phase 46 compatibility decisions.

| Option | Description | Selected |
| --- | --- | --- |
| Behavior-affecting limits are part of compatibility | Timeout, memory, caps, package/environment/filesystem/network/shell policies enter key. | ✓ |
| Only adapter version represents limits | Trust adapter id/version to imply limits. | |
| Limits recorded as provenance but not compatibility | Useful for debugging, not equivalence. | |

**User's choice:** Behavior-affecting limits are part of compatibility.
**Notes:** Changing runtime limits can change Strategy behavior and Match outcomes.

---

## Experimental Adapter Policy

| Option | Description | Selected |
| --- | --- | --- |
| Registry-visible but disabled for normal play | Experimental adapters appear in registry/fixtures but require dev/test or explicit path. | ✓ |
| Hidden until production-supported | Experimental adapters exist only in tests/internal code. | |
| Selectable with warning | Users can choose experimental runtimes with warning. | |

**User's choice:** Registry-visible but disabled for normal play.
**Notes:** Makes the spike honest without productizing it.

| Option | Description | Selected |
| --- | --- | --- |
| Dev/test only, not public counted results | Experimental adapter MatchSets are fixtures/dev/test only and non-public/non-counted by default. | ✓ |
| Public but non-counted with clear labels | Experimental results may appear publicly as non-counted. | |
| Allowed if all entrants use same experimental adapter | Allow same-adapter experimental results. | |

**User's choice:** Dev/test only, not public counted results.
**Notes:** Keeps experimental runtime output out of public counted surfaces in v1.7.

## the agent's Discretion

- Exact registry file layout and schema/type names.
- Details of legacy normalization helper.

## Deferred Ideas

- Normal runtime selector.
- Public experimental runtime displays.
- Compatibility ranges.
