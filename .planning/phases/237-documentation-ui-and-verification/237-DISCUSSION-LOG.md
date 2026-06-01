# Phase 237: Documentation, UI, and Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 237-documentation-ui-and-verification
**Areas discussed:** Language taxonomy, Product/public labels, Provider evidence docs, Verification

---

## Language Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Three-tier taxonomy | TypeScript/Python source-backed artifact-proven; Rust/Zig WASM/WASI artifact-backed; TinyGo spike-only candidate. | Yes |
| Single "artifact-backed" label | Use one label for all languages with artifacts. | |
| Production/candidate mixed labels | Mention TinyGo near production-supported languages. | |

**User's choice:** Approved recommended option.
**Notes:** Taxonomy must help users distinguish provenance from isolation and spike evidence from production support.

---

## Product and Public Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Keep TinyGo spike-only | TinyGo appears only in spike evidence/docs, not selectable production language UI. | Yes |
| Add TinyGo as selectable candidate | Show TinyGo in production language pickers with caveats. | |
| Hide all spike evidence | Keep TinyGo completely out of docs/public evidence. | |

**User's choice:** Approved recommended option.
**Notes:** Avoid implying TinyGo is counted eligible or production-supported.

---

## Provider Evidence Docs

| Option | Description | Selected |
|--------|-------------|----------|
| Explain proof fields and claims | Document hashes/bytes, metadata, validation policy, compatibility, privacy exclusions, fail-closed behavior, and non-claims. | Yes |
| Minimal labels only | Avoid deeper provider evidence docs. | |
| Strong security marketing | Present artifact provenance as sandbox certification. | |

**User's choice:** Approved recommended option.
**Notes:** TypeScript/Python provenance must not be described as WASM isolation.

---

## Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Full v1.33 verification wall | TypeScript/Python proof tests, Rust/Zig regression, TinyGo spike-only checks, privacy scans, monitors, browser review, no web/API/Go Strategy execution. | Yes |
| Docs-only verification | Check only written docs and labels. | |
| Browser-only verification | Skip lower-level provider/monitor checks. | |

**User's choice:** Approved recommended option.
**Notes:** Include replay board realism checks if replay or Match creation changes occurred earlier in the milestone.

## the agent's Discretion

- Choose exact docs/pages/evidence surfaces to update, provided every likely user-visible language status surface is covered.

## Deferred Ideas

- TinyGo production support.
- Permanent language governance.
- Package ecosystem expansion.
- Direct-export or Component Model/WIT ABI migration.
- Production sandbox certification.
