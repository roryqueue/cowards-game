# Phase 217: Signed-In Entry Spine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md.

**Date:** 2026-05-31
**Phase:** 217-signed-in-entry-spine
**Areas discussed:** entry route, account-safe data, reuse posture

## Entry Route

| Option | Description | Selected |
| --- | --- | --- |
| `/competitions/[competitionId]/enter` | Signed-in entry spine. | yes |
| Keep `/exhibitions/new` only | No canonical competition entry route. | no |

**User's choice:** Confirmed entry spine route.

## Account-Safe Data

| Option | Description | Selected |
| --- | --- | --- |
| Source-free eligibility dashboard | Show saved revisions and eligibility states without source. | yes |
| Revision editor/source view | Edit or expose source inside entry. | no |

**User's choice:** Confirmed source-free dashboard.

## Reuse Posture

| Option | Description | Selected |
| --- | --- | --- |
| Reuse existing behavior | Wrap/reuse exhibition creation where practical. | yes |
| Replace immediately | Rewrite creation flow from scratch. | no |

**User's choice:** Confirmed reuse where practical.

## the agent's Discretion

- API wrapper versus direct reuse of existing exhibition creation path.

## Deferred Ideas

- Rich registration workflows, payment, organizations, source editing.
