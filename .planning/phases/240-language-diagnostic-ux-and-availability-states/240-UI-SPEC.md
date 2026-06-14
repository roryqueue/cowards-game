---
phase: 240
slug: language-diagnostic-ux-and-availability-states
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-14
---

# Phase 240 — UI Design Contract

> Visual and interaction contract for Workshop language diagnostics and availability states. Sources: `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `240-CONTEXT.md`, `240-RESEARCH.md`, and current Workshop UI files.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none; use existing hand-authored Workshop CSS |
| Preset | not applicable |
| Component library | none |
| Icon library | none for this phase |
| Font | Inter, ui-sans-serif, system-ui |

Implementation must extend existing `workshop-*`, `validation-*`, `details-grid`, and CSS variable patterns in `apps/web/app/globals.css`. Do not introduce Tailwind, shadcn, cards-inside-cards, hero styling, or a new component library.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline metadata gaps, chip rows, location/code sublines |
| sm | 8px | Diagnostic row padding, list gaps, compact status blocks |
| md | 16px | Workshop panel padding, column gaps, panel stack gaps |
| lg | 24px | Reserved for larger grouped diagnostic summaries only |
| xl | 32px | Existing desktop shell offset only; do not add new Phase 240 usage |
| 2xl | 48px | Not used in this phase |
| 3xl | 64px | Not used in this phase |

Exceptions: mobile buttons keep the existing `44px` minimum touch target; desktop buttons keep the existing `36px` minimum height.

---

## Typography

Use only these sizes and weights in Phase 240 additions.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.45 |
| Label / meta | 12px | 600 | 1.3 |
| Diagnostic code / chip | 12px | 650 | 1.3 |
| Heading | 18px | 700 | 1.25 |

Long codes, provider ids, hashes, references, and safe line/column text must use existing monospace treatment from `.details-grid` only when in advanced/public metadata. Body copy must wrap naturally; identifiers must use `overflow-wrap: anywhere` or existing ellipsis patterns so no text overflows on mobile.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f4f6f3`, `#ffffff` | Page background and Workshop panels |
| Secondary (30%) | `#e8ece6`, `#c9d1c5` | Diagnostic row backgrounds, empty/unavailable blocks, borders |
| Accent (10%) | `#256d85` | Active list row border, primary button, focus outline, links |
| Destructive | `#b42318` | Invalid source diagnostics only; not for unavailable states |

Accent reserved for: `Validate source`, `Submit revision`, active selected rows, focus outline, Workshop links. Use `#2f7d46` for ready/success, `#9a6b12` for warnings/unavailable/toolchain/runtime-service states, and `#b42318` only when normalized public diagnostics say the draft is invalid or unsafe to submit.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Validate source |
| Empty state heading | No validation issues |
| Empty state body | This draft passes the public checker. Submit a revision or launch a Workshop test to inspect runtime behavior. |
| Error state | Checking could not complete. The Strategy has not been judged invalid; review the next step below and retry validation. |
| Destructive confirmation | none in Phase 240; existing replace-draft confirmation is unchanged |

Unavailable copy templates:

| State | Public heading | Public body / next step |
|-------|----------------|-------------------------|
| `runtime_service_unavailable` | Checker unavailable | Checking could not reach the runtime-service. This does not mean the Strategy is invalid. Start or retry the runtime-service, then validate again. |
| `toolchain_unavailable` | Toolchain unavailable | Checking could not run the selected language toolchain. This does not mean the Strategy is invalid. Configure the Python, Rust WASI, or Zig WASI checker toolchain, then retry. |
| `system_unavailable` | Checker temporarily unavailable | Checking could not complete because the checker system is unavailable. Retry later or check service status. |
| `timeout_or_limit` | Checker limit reached | Checking stopped before completion. Reduce the draft size or retry after the checker is available. |

Language-specific diagnostic rows must use short public-safe messages, then optional `Constraint:`, `Next:`, `Reference:`, and safe `Line/column:` fields. Do not display raw compiler/runtime text, source snippets, artifact bytes, host paths, package paths, env names/values, tokens, DB details, StrategyMemory, SoldierMemory, objective payloads, provider proof internals, or raw `forbiddenPatterns`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not applicable |

No registry blocks or generated UI components are allowed for this phase.

---

## Workshop State Contract

| Checker status | Visual treatment | Submit/save behavior | React responsibility |
|----------------|------------------|----------------------|----------------------|
| `not_checked` | Neutral `workshop-chip`; no issue rows | disabled; prompt to validate source | display only |
| `checking` | Neutral live status; keep current layout stable | disabled while checking | display only |
| `ready` | Success chip and `validation-empty` block | enabled if response permits submit/save | display only |
| `invalid` | Destructive diagnostic rows by severity | disabled until source is fixed | display only |
| `stale` | Warning chip/copy; keep previous safe metadata visible | disabled until revalidated | display only |
| `runtime_service_unavailable` | Warning/unavailable block, not destructive | disabled; retry/start service guidance | display only |
| `toolchain_unavailable` | Warning/unavailable block, not destructive | disabled; configure toolchain guidance | display only |
| `system_unavailable` | Warning/unavailable block, not destructive | disabled; retry/status guidance | display only |

React components must render normalized public checker fields only. Category, actionability, redaction, provider/runtime failure classification, and availability semantics must live in shared checker utilities/schema outside React.

---

## Public Diagnostic Inventory

Python rows must distinguish: policy/capability, forbidden import, package/dependency, syntax/build, provenance, runtime-service unavailable, timeout/limit, invalid output/schema.

Rust rows must distinguish: compile, artifact/provenance, forbidden WASI/import, runtime-service, toolchain unavailable, timeout/limit, invalid output/schema.

Zig rows must distinguish: compile, artifact/provenance, forbidden WASI/import, no-std/helper misuse, runtime-service, toolchain unavailable, timeout/limit, invalid output/schema.

Each row must include a stable public diagnostic code in `data-diagnostic-code`, a public category/actionability label if present, and public-safe guidance. Safe structured line/column may be shown only when provided as structured public fields; never parse raw diagnostics to recover locations.

---

## Responsive Contract

At desktop, keep the existing three-column Workshop layout and place diagnostics in the existing center validation panel. At `max-width: 1179px`, preserve the current center-first order. At `max-width: 759px`, validation remains order `4`, buttons span full width, rows wrap, and no diagnostic code/message may overflow its panel.

Use `min-width: 0`, `overflow-wrap: anywhere`, and existing ellipsis patterns for hashes, provider ids, references, and codes. Do not add fixed-width diagnostic columns or inline tables inside diagnostic rows.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
