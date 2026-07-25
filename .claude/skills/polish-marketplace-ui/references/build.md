# Building a surface

Read after the router when writing or changing UI code, and when fixing a defect.

## Structure

Vue 3 Composition API, `<script setup lang="ts">`, no Options API.

- **Pages compose, they do not orchestrate.** Route components live in `frontend/src/pages` (not `views`). A page wires children together and passes props; fetching, filter derivation, pagination math, and form submission move into composables under `src/browse` or a sibling module with explicit return types. A page whose template runs past roughly 150 lines has already failed the split test.
- **Props and emits are typed contracts.** `defineProps<Props>()` and `defineEmits<{ ... }>()` with named interfaces. No `any`, no implicit event payloads.
- **Stores hold session-scoped truth only**: the signed-in user, the saved-listing set, the theme. Filter state belongs in the URL, per the spec.
- Prefer `computed` over watchers. Reach for a watcher only for a genuine side effect such as syncing the route.

## CSS

Scoped `<style>` per component, values from `tokens.css`. A raw hex, a px spacing value, or a duration inside a component is a bug unless it is a one-off geometric constant with no token equivalent.

Rules worth stating because they are routinely missed:

- Never remove a focus outline without replacing it. Style `:focus-visible` and keep it visible in both themes.
- Flex and grid children that truncate need `min-width: 0`, otherwise the text overflows instead of ellipsing.
- Interactive elements get `touch-action: manipulation` to kill the tap delay.
- `:root` sets `color-scheme` per theme so form controls, scrollbars, and the caret follow.
- `base.css` already implements the reduced-motion block and the focus ring. Extend those rather than redeclaring them per component.
- Long user-supplied strings (titles, seller names, descriptions) need an overflow decision at every place they render. Decide it, do not discover it in a screenshot.

### Scroll locking, specifically

`BrowsePage.vue` locks the page behind the mobile filter sheet with `document.body.style.overflow = 'hidden'`. That works in Chromium and is the classic thing iOS Safari ignores. `overscroll-behavior: contain` on the sheet stops scroll chaining but does not fix body-scroll-behind-a-fixed-overlay on iOS. A real fix there is a `position: fixed` body lock with scroll-position capture and restore, or preventing `touchmove` on the backdrop. Do not claim an iOS scroll defect fixed on the strength of a Chromium screenshot.

The sheet also needs a focus trap and Escape to close, returning focus to the control that opened it.

## Forms

Auth and the seller listing form carry the same standard.

- Every field gets a real `name` and a correct `autocomplete` value. Email fields get `type="email"`, `inputmode="email"`, `spellcheck="false"`. Numeric fields get `inputmode="numeric"`.
- Labels are real `<label>` elements bound to their control. Placeholder text is not a label.
- The submit button stays enabled until the request actually starts, then enters a pending state that names what is happening. Never disable submit because the form is untouched or client-side invalid; that hides the reason.
- On a failed submit, move focus to the first invalid field and render its error beside it. Field errors come from the API's `fieldErrors` via `api/client.ts`, not from a parallel client-side copy of the same rules.
- Never block paste, on any field.
- Destructive actions confirm first and name the specific thing being deleted.

## Images

The gallery and the upload control are both places where a prototype gives itself away.

- Every `img` gets explicit dimensions or a reserved aspect-ratio box so the grid does not reflow as images load.
- `alt` describes the vehicle, it is not the word "image".
- The gallery supports arrow keys and shows a position counter. The active thumbnail is distinguishable in both themes.
- Upload shows a pending state, previews before submit, and a specific error when the server rejects a file (too large, wrong type) rather than a generic failure.

## Before you call it done

`npm run build` (which chains `vue-tsc --noEmit` and `vite build`) and `npm test` both pass. Add a Vitest case for any new pure function in `format.ts` or `browse/filters.ts`. Then verify the surface in the browser per `audit.md`, and report what you actually exercised.
