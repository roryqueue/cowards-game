---
phase: 241
slug: checker-ergonomics-caching-and-boundary-monitors
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-14
---

# Phase 241 - UI Design Contract

Visual and interaction contract for Workshop checker ergonomics, stale-state handling, cache pacing feedback, and boundary monitor evidence.

## Design System

| Property | Value |
|----------|-------|
| Tool | none; no `components.json`, Tailwind, or shadcn detected |
| Preset | not applicable |
| Component library | existing bespoke Workshop panels in `apps/web/app/workshop/workshop-client.tsx` |
| Icon library | none for this phase |
| Font | existing `Inter, ui-sans-serif, system-ui` stack from `apps/web/app/globals.css` |

Implementation must extend current Workshop classes: `workshop-panel`, `workshop-row`, `workshop-chip`, `workshop-muted`, `validation-list`, `validation-row`, `validation-empty`, and `details-grid`. Do not introduce a new visual system.

## Spacing Scale

Declared values for changed checker UI:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Chip row gaps, status metadata gaps |
| sm | 8px | Validation rows, inline controls, compact panel gaps |
| md | 16px | Panel padding, column gaps, Workshop stack gaps |
| lg | 24px | Only for larger section separation if a new checker evidence block needs it |
| xl | 32px | Page-level grid math only; do not add inside checker panel |
| 2xl | 48px | Not used in Phase 241 UI changes |
| 3xl | 64px | Not used in Phase 241 UI changes |

Exceptions: preserve existing `6px` control radius, `8px` panel radius, `24px` chip min-height, `36px` button min-height, `3px` validation left border, and Monaco editor dimensions.

## Typography

Use only existing Workshop text sizes for new/changed checker UI.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Metadata/Chip | 12px | 650 | 1.3 |
| Body | 14px | 400 | 1.45 |
| Panel Heading | 18px | 650 | 1.25 |
| Page Title | 22px | 650 | 1.2 |

Do not scale font size by viewport. Do not add hero/display type. Long hashes, provider ids, and cache identity fragments must wrap with `overflow-wrap: anywhere` inside `details-grid`.

## Color

Use existing CSS variables only.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--app-bg #f4f6f3`, `--surface #ffffff` | Workshop background and panels |
| Secondary (30%) | `--surface-secondary #e8ece6`, `--border #c9d1c5`, `--text-secondary #58635a` | Validation rows, stale context, metadata, borders |
| Accent (10%) | `--accent #256d85`, `--accent-hover #1e5a70` | Primary button, focus ring, active language segment, active list row |
| Success | `--success #2f7d46` | Ready/checked-valid chip only |
| Warning | `--warning #9a6b12` | Stale, checking-with-stale-result, runtime/toolchain unavailable |
| Destructive | `--destructive #b42318` | Invalid source diagnostics and submit/save errors only |

Accent reserved for: primary `Validate source` button when introduced as primary, active language selector, focus-visible outlines, active list row border, and links. Do not use accent for every status chip.

## Interaction Contract

### Checker States

| State | Visible Label | Visual Treatment | Submit/Save Ready | Required Behavior |
|-------|---------------|------------------|-------------------|-------------------|
| `not_checked` | `Not checked` | neutral chip, no diagnostics list | no | Show empty guidance: `Validate source before submitting.` |
| `checking` with no prior result | `Checking...` | neutral chip, `aria-live="polite"` status | no | Keep editor editable; do not clear panel height or show destructive styling. |
| `checking` with prior mismatched result | `Checking...` chip plus `Previous check is stale` line | warning stale banner above preserved diagnostics | no | Keep last diagnostics visible until new current result arrives; no panel flicker. |
| `ready` | `Ready` | success chip and `validation-empty` block | yes, only if cache identity matches current source/sourceFormat | Copy must say provider-grade preflight passed; submit/save still revalidate. |
| `invalid` | `Invalid` | destructive validation rows | no | Show public-safe diagnostic category, constraint, and next action. |
| `stale` | `Stale` | warning chip and preserved previous diagnostics | no | Never pass stale result into `canSubmitRevision`; stale `ready` is display-only. |
| `runtime_service_unavailable` | `Runtime service unavailable` | warning chip, calm unavailable copy | no | Explain service availability, not player fault. |
| `toolchain_unavailable` | `Toolchain unavailable` | warning chip, calm unavailable copy | no | Explain required language toolchain is unavailable or misconfigured. |
| `system_unavailable` | `Checker unavailable` | warning chip unless submission route returns hard error | no | Suggest retry or local services check; do not imply Strategy is unsafe. |

The UI must maintain two derived values: `displayedChecker` for what the Validation panel shows and `currentChecker` for readiness. Only `currentChecker.status === "ready"` with an identity match may enable `Submit revision` or `Save to account`.

### No Flicker Rules

- Editing must not blank the Validation panel. Preserve the last checker envelope and mark it stale when source, source format, provider contract, ABI, validation policy, toolchain key, or artifact identity differs.
- Manual `Validate source` bypasses the debounce delay but still uses the same in-flight coalescing/cache identity.
- While checking, button text may change to `Checking...`, but the button width and panel layout must remain stable.
- `aria-live="polite"` status text must announce state changes once per state transition, not on every keystroke.
- Diagnostics must not jump between empty, loading, and result layouts during ordinary Rust/Zig editing.

### Language Selector

Production Workshop language controls must remain exactly: TypeScript, Python, Rust, Zig. TinyGo must not appear in the selector, validation panel, submit/save panel, entry UI, result UI, replay UI, or public evidence UI. TinyGo may appear only in developer-facing boundary monitor output as a hidden/spike-only assertion.

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Validate source` |
| Checking status | `Checking source...` |
| Ready state | `Ready to submit. Submit and save will revalidate this source.` |
| Stale state | `Previous check is stale. Validate this draft before submitting.` |
| Empty state heading | `No current check` |
| Empty state body | `Validate source before submitting this draft.` |
| Runtime unavailable | `Runtime service is unavailable. Start local services or retry later; this does not mean the Strategy is invalid.` |
| Toolchain unavailable | `{Language} toolchain is unavailable. Configure the provider toolchain and validate again.` |
| System unavailable | `Checker is unavailable. Retry after local services are healthy.` |
| Invalid state | `Resolve validation errors before submitting.` |
| Destructive confirmation | none introduced by Phase 241; preserve existing replace-draft confirmation copy |

Do not display raw compiler diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads.

## Boundary Monitor Evidence UI

Phase 241 may add developer-facing evidence text in tests, logs, or planning artifacts, but not a new production panel. If any Workshop-visible monitor summary is added, it must be a compact `details` block under existing advanced checker details with:

| Field | Display |
|-------|---------|
| Boundary | `runtime-service/provider owned` |
| Cache | `ephemeral preflight cache` |
| Submit/save | `authoritative revalidation required` |
| TinyGo | `hidden from production Workshop` |

This evidence block must not include private diagnostics or runtime payloads.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not applicable |

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
