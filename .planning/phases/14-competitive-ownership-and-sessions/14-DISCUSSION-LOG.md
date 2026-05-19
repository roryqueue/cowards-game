# Phase 14: Competitive Ownership and Sessions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 14-Competitive Ownership and Sessions
**Areas discussed:** Account creation, session shape, Workshop migration boundary, public identity fields, password policy, session expiry, anonymous Workshop boundary, local-to-account conversion, private source access

---

## Account Creation

| Option | Description | Selected |
| --- | --- | --- |
| Open signup | Anyone can create username/password accounts locally; simplest real competitive flow with no invite machinery. | ✓ |
| Seeded users | Only predefined/dev-seeded users exist; fastest to build, but less like real player ownership. | |
| Invite codes | Alpha accounts require a code; useful later, but adds policy and UX surface now. | |

**User's choice:** Open signup.
**Notes:** Keep auth small and real enough for competitive ownership.

---

## Session Shape

| Option | Description | Selected |
| --- | --- | --- |
| Server-side cookie sessions | Store sessions server-side and send an HTTP-only cookie. | ✓ |
| Signed stateless token cookie | Store session claims in a signed token/cookie. | |
| Short-lived local alpha session | Minimal session shortcut for alpha. | |

**User's choice:** Server-side cookie sessions.
**Notes:** Chosen for revocation, sign-out, and straightforward ownership checks.

---

## Workshop Migration Boundary

| Option | Description | Selected |
| --- | --- | --- |
| Competitive-only migration | Keep local Workshop for anonymous drafting/testing, require sign-in for competitive persistence and entry. | ✓ |
| Full Workshop migration | Require sign-in for all persisted Workshop revisions/source/test MatchSets. | |
| Dual-save mode | Anonymous Workshop and signed-in Workshop save in parallel modes. | |

**User's choice:** Competitive-only migration.
**Notes:** Avoids turning Phase 14 into a full Workshop rewrite.

---

## Public Identity Fields

| Option | Description | Selected |
| --- | --- | --- |
| Handle public, display name optional | Stable unique handle is the public reference; display name supports it. | ✓ |
| Display name public only | Friendlier but non-unique and weaker for disputes. | |
| Generated public player label | Avoids naming policy but feels less real. | |

**User's choice:** Handle public, display name optional.
**Notes:** Handles become the durable public competition identity.

---

## Password Policy

| Option | Description | Selected |
| --- | --- | --- |
| Simple strong password, no recovery | Minimum strength, hashed at rest, no password reset in alpha. | ✓ |
| Dev-friendly weak policy | Minimal constraints for local testing. | |
| Add manual reset hook | Admin/dev-only reset mechanism. | |

**User's choice:** Simple strong password, no recovery.
**Notes:** Alpha limitation should be explicit.

---

## Session Expiry

| Option | Description | Selected |
| --- | --- | --- |
| Long-lived alpha session | Keep users signed in for roughly 30 days unless they sign out. | ✓ |
| Browser-session only | Session ends with browser session. | |
| Short expiry | Expire after a few hours. | |

**User's choice:** Long-lived alpha session.
**Notes:** Smooth iterative Strategy work matters for alpha.

---

## Anonymous Workshop Boundary

| Option | Description | Selected |
| --- | --- | --- |
| Anonymous can draft/test, competitive requires sign-in | Keep v1.1 Workshop flow, gate only competition. | ✓ |
| Anonymous can draft only | Persisted revisions and tests require sign-in. | |
| Sign-in required for all persistence | Most coherent but broader UX disruption. | |

**User's choice:** Anonymous can draft/test, competitive requires sign-in.
**Notes:** Competitive entry requires sign-in and User-owned revision.

---

## Local-to-Account Conversion

| Option | Description | Selected |
| --- | --- | --- |
| Explicit save to account action | Signed-in user explicitly saves/submits a revision into their account. | ✓ |
| Auto-claim on sign-in | Local Workshop revisions become account-owned automatically. | |
| No conversion path in v1.2 | User must create account-owned revisions separately. | |

**User's choice:** Explicit save to account action.
**Notes:** Avoids surprise ownership migration and shared-browser ambiguity.

---

## Private Source Access

| Option | Description | Selected |
| --- | --- | --- |
| Owner-only source, never public | Owner can view source while signed in; public results show only provenance. | ✓ |
| Owner source plus private debug bundle | Richer private result evidence now. | |
| No source viewing from competitive surfaces | Source remains account/Workshop-only. | |

**User's choice:** Owner-only source, never public.
**Notes:** Richer owner-debug result presentation can be handled by Phase 17.

## the agent's Discretion

- Exact password minimums.
- Choice of hashing/session libraries.
- Exact session table schema and route organization.

## Deferred Ideas

- Invite codes.
- Full Workshop sign-in requirement.
- Email verification/password reset/OAuth/passkeys/account recovery.
