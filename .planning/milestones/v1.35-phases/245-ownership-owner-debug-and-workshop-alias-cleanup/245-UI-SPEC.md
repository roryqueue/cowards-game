# Phase 245 UI-SPEC: Ownership and Alias Cleanup

**Status:** Verified  
**UI impact:** Narrow Workshop/replay affordance cleanup.

## Contract

- Workshop completed Matches expose only `Open replay` for the local Workshop identity.
- The UI must not render an `Open owner debug` link for `player:workshop-local`.
- Public replay pages continue to show the public replay status chip and public timeline evidence.
- No visible UI copy may imply that local Workshop identity grants account ownership or owner-private replay access.
- Deprecated source aliases return API errors only; no new user-facing page is introduced.

## Verification

- `apps/web/app/workshop/workshop-client.test.tsx` proves `ownerHref` is `null`.
- `apps/web/e2e/workshop-to-replay.spec.ts` now verifies the local Workshop failure sample remains public-only and private markers are absent.
