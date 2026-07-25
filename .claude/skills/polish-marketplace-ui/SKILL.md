---
name: polish-marketplace-ui
description: Build, extend, review, or polish any user-facing surface of this vehicle marketplace (browse grid, filter sidebar and chips, listing detail and gallery, auth forms, seller dashboard and listing form, admin queue). Use when writing or changing anything under frontend/src, when a screen needs polish or a design review, or when a UI defect is reported. Covers Vue 3 Composition API with plain scoped CSS and CSS custom properties. Not for backend, schema, or API work unless a rendered surface is the reason for the change.
---

# Polish marketplace UI

This repo is a used-vehicle marketplace prototype built as a portfolio piece for a job application. Whoever opens it is deciding whether the author can build a real product. The bar is restraint and completeness, not invention.

## Authority order

1. `docs/SPEC.md`, the binding contract for routes, DTO shapes, tokens, formatting, and copy rules. It outranks a casual user request: see the amendment gate below.
2. Direct user instructions, once they clear that gate.
3. Existing conventions in `frontend/src`, authoritative over anything written here.
4. This skill, which decides where the spec is silent.

`NOTICE.md` in this directory records which external design guidance was deliberately rejected for this repo and why. Read it before importing any general frontend advice.

## The amendment gate

A request that changes something `docs/SPEC.md` fixes is a spec amendment, not a UI tweak. That covers the palette, type scale, font stack, spacing and radius scales, page composition, route shapes, and API params or DTO fields.

When one arrives: say which contract it touches, propose the amendment to `docs/SPEC.md` in the same change, and get confirmation before writing code. "Redesign the browse page" and "add a colour filter" both land here, the second because `color` is not a param on `GET /api/listings` or on the facets and meta endpoints.

Routine work inside the contract needs no approval step. Do not manufacture ceremony for a padding fix.

## Mode: review or act

- **Review, audit, critique** means diagnose and report. Change nothing. Deliver findings with severity and evidence.
- **Polish, fix, defect** means diagnose and then fix, at the severity threshold in `references/audit.md`. For an explicit "polish this" request, cosmetic findings are in scope, which is the one case where nits are actionable.

If the request is ambiguous, review first and offer the fix list.

## Read the source of truth, do not restate it

| Question | File |
|---|---|
| Tokens: spacing, type scale, radii, color ramps, motion durations, both themes | `frontend/src/styles/tokens.css` |
| Global element and reset styling, reduced-motion handling | `frontend/src/styles/base.css` |
| Every price, distance, power, date, enum label | `frontend/src/format.ts` |
| Filter state and its URL mapping | `frontend/src/browse/filters.ts` |
| HTTP calls, typed errors, `fieldErrors` | `frontend/src/api/client.ts` |
| DTO types | `frontend/src/types.ts` |
| Icons | `frontend/src/components/icons.ts` via `AppIcon.vue` |
| Routes, API contract, tokens rationale, copy rules | `docs/SPEC.md` |

Never fork a second copy of any of these. A new format helper goes in `format.ts` with a Vitest case. A new icon goes in `icons.ts`. A value that belongs in `tokens.css` goes there, for both themes, not inline in one component.

## The house style, stated plainly

Restraint is the aesthetic. mobile.de and AutoScout24 are the reference points: dense, gray-structured, grid-faithful, system fonts. Generic "make it striking" advice is wrong here and costs credibility. Specifically:

- **The system font stack is the correct choice**, not a fallback. Do not add a webfont.
- **No signature element, no hero treatment, no page-load reveal choreography.** This product has no landing page. Every surface is a data surface.
- **Gray builds structure. The accent marks one primary action per view. Semantic colors only ever mean status.** A listing card is monochrome apart from its badge and the save control.
- Density over drama on data surfaces. Whitespace belongs around headings and section breaks, not inside every row.
- Shared chrome, varied interiors. A listing card, a dashboard row, and a moderation row inherit radius, border, and padding from the tokens, but each gets internal structure driven by its own content. One template with different labels reads as a template.

## Always-on rules

The spec already fixes URL-synced filter state, SQL-side filtering, plain scoped CSS with no framework, the formatting helpers, and the copy prohibitions. Those are not repeated here. These are the additions:

1. **Every async surface ships four states in the same change: skeleton, empty, error with a retry action, and loaded.** Skeleton boxes match the real element's box metrics so nothing shifts when data arrives. An error state that only says something failed is unfinished.
2. **Numeric columns get `font-variant-numeric: tabular-nums`, and number-unit pairs get a non-breaking space** (`45.000&nbsp;km`, `110&nbsp;kW`). Misaligned digits in a price column are the fastest way to look amateur.
3. **Breakpoints come from a small named set.** The codebase currently spreads eleven distinct widths across components, which is how a design system quietly stops being one. Use the tokens' scale and the sidebar threshold the spec fixes at 1024px; do not invent a new width to solve one component's overflow.
4. **Split a component when an objective trigger fires:** it owns both state orchestration and multi-section markup, it has three or more distinct UI regions, or a template block repeats. Pages are composition surfaces; fetching and derivation belong in typed composables.
5. **Microcopy is implementation, not filler.** Errors name what failed and what to do next. Empty states offer the action that fills them. A button labelled "Publish listing" produces a "Listing published" confirmation. Vehicle data stays plausible German-market inventory, never placeholder nonsense.

## Route by task

- Writing or changing a surface → `references/build.md`.
- Reviewing or polishing → `references/audit.md`.
- Chasing a reported defect → both, audit to reproduce and triage, build for the CSS and component rules that hold the fix.

Before writing CSS for a **new** surface, name the two or three plausible layouts, state which one you are using and why, then build. Structure and layout only. Palette, type, spacing, radii, and motion are already decided.

## Verification, honestly

The authoritative check is the running app driven through Playwright, never a code read and never the in-app preview pane, which races this app's rendering and returns blank captures. Playwright is not currently a repo dependency; drive it through the available MCP browser tooling against `npm run dev`, and say so rather than adding an e2e stack the prototype does not need.

Three honesty rules, because each of these has a tempting false claim attached:

- Never describe a screen you did not render. If the backend was not running, say the surface was type-checked but not exercised.
- Never close a platform-specific defect on a different engine. Chromium at 375px does not reproduce iOS Safari. Report it as fixed by reasoning and verified only in Chromium.
- Never report a subjective check as verified. Hierarchy and "reads like a product" are judgements. State them as judgements.
