# Auditing a surface

Read after the router when reviewing, polishing, or reproducing a defect.

**A review changes nothing.** Diagnose, evidence, report. Only act when the request was to polish, fix, or resolve a defect. When in doubt, report the fix list and wait.

Exercise the running app first, read code second. A code read tells you what was intended; only a render tells you what shipped.

## Setup

Backend on the embedded-Postgres profile, frontend on Vite, then drive the app through the available Playwright tooling. Never use the in-app preview pane for this project, it returns blank or timed-out captures.

If you cannot get the app running, say the audit is static and name what stayed unverified. Do not describe a screen you did not render.

## The matrix

Every surface, at four widths. Three of them are chosen to sit either side of the layout switch the spec fixes at 1024px, because a breakpoint boundary is where layout actually breaks.

| Width | What it exercises |
|---|---|
| 375 | Single-column grid, filter sheet, tap targets |
| 768 | The awkward middle, multi-column grid with the sidebar still collapsed |
| 1023 and 1024 | The sidebar-to-sheet switch itself |
| 1400 | The intended full composition |

Check the component's own media queries before trusting this table; the codebase currently uses eleven distinct widths, so the surface you are auditing may switch somewhere else. Audit at its real boundaries and note the inconsistency as a finding.

At each width assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. Horizontal scroll on a data grid is a Blocker every time.

Capture both themes, toggling the persisted control (`ThemeToggle.vue`, backed by `stores/theme.ts`) rather than only emulating `prefers-color-scheme`, because the toggle is the path a reviewer clicks. Contrast failures and invisible borders show up in exactly one theme, usually the one nobody checked.

## What to actually look at

- **States, not just the happy path.** Force each surface into skeleton, empty, and error. Filter to something that returns nothing. Stop the backend and reload. A grid that renders beautifully with 24 cars and blankly with zero is unfinished.
- **Layout shift.** Reload with the network throttled and watch whether cards jump when images and data land. Skeleton metrics that do not match the real card show up here and nowhere else.
- **Alignment across a row.** Cards must agree on baseline positions when one title wraps to two lines and another has no image. Find a row where they differ.
- **Numbers.** Prices and mileage aligned, German thousands separators, no unit orphaned onto its own line, no raw enum string such as `PLUG_IN_HYBRID` reaching the screen.
- **Keyboard only.** Tab through. Every interactive element reachable and visibly focused in a sensible order. Gallery arrows work. The filter sheet traps focus, closes on Escape, and returns focus to the button that opened it.
- **Console and network.** No errors, no failed requests, no duplicate requests on mount. A filter change issues one request, not one per changed param.
- **Copy.** No em dashes, no trailing periods on headings, no emoji standing in for an icon, no placeholder text.

## Triage

Classify every finding and attach the evidence that proves it.

| Level | Meaning |
|---|---|
| Blocker | Broken, unreadable, or unusable at a supported width or theme |
| High | Visibly wrong on a surface a reviewer opens first |
| Medium | Real but survivable inconsistency |
| Nit | Taste |

On a **fix** request, act on Blocker and High, plus Medium when the change is small and local. Log Nits. On an explicit **polish** request, Nits are in scope too, since that is what was asked for. On a **review** request, act on nothing.

An audit that turns into an unrequested redesign has failed. So has one that reports twenty nits and misses a Blocker.

## Fixing

Make the smallest causal change. A misaligned card is usually one layout property, not a rewrite of the card. If a fix wants a token that does not exist, add it to `tokens.css` for both themes rather than hardcoding a value in one component. Component and CSS rules for the fix itself live in `build.md`.

After fixing, re-render and re-capture at the width and theme that showed the defect. A fix claimed without a second capture is a fix not verified.

## Reporting

State which surfaces you exercised, at which widths and themes, what you fixed, what you logged, and what you could not check. Captures are the evidence, not the prose. Judgement calls about hierarchy and polish are stated as judgements, never as verified results.
