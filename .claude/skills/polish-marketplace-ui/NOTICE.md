# Provenance

`polish-marketplace-ui` was synthesized on 2026-07-25 for this repository. Its content is original wording. External agent skills were read as research material to decide which principles were worth encoding here. No files, scripts, datasets, or configuration were copied or vendored from any of them, so no upstream license terms attach to this skill.

## Sources reviewed

| Source | License | What informed this skill |
|---|---|---|
| [OneRedOak/claude-code-workflows](https://github.com/OneRedOak/claude-code-workflows) design-review | MIT | Live-environment-first auditing, the fixed viewport matrix, severity triage with screenshot evidence |
| [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | MIT | Form input semantics, tabular numerals and non-breaking units, focus and overscroll rules (restated as plain CSS) |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) frontend-ui-engineering | MIT | Filter and sort state belonging in the URL, shipping all four async states together |
| [vuejs-ai/skills](https://github.com/vuejs-ai/skills) vue-best-practices | MIT | Objective component-split triggers, views as composition surfaces |
| [anthropics/skills](https://github.com/anthropics/skills) frontend-design | Apache-2.0 | Naming layout options before building, copy treated as design material |
| [joshuadavidthomas/agent-skills](https://github.com/joshuadavidthomas/agent-skills) frontend-design-principles | MIT | Gray builds structure with color reserved for status and action, shared chrome with varied interiors, the squint test |
| [ConardLi/garden-skills](https://github.com/ConardLi/garden-skills) web-design-engineer | MIT | Placeholder honesty, no emoji as icons |
| [microsoft/skills](https://github.com/microsoft/skills) frontend-design-review | MIT | Reviewed and largely rejected: its design-system workflow depends on Figma Dev Mode and Storybook, neither of which exists here |

## Deliberate rejections

Recorded so they are not reconsidered by default.

- **"Take a real aesthetic risk", avoid system fonts, favour dramatic shadows and grid-breaking.** Calibrated for portfolio artifacts and marketing pages. This prototype is judged against mobile.de and AutoScout24, which are restrained, dense, and system-font. Boldness here reads as a student project.
- **Marketing-page heuristics** (hero thesis, signature element, staggered reveals). There is no landing page in this product.
- **Tailwind, shadcn, React Query, and React container patterns.** Absent from this stack. Rules borrowed from those sources were translated to plain scoped CSS and Vue before being encoded.
- **Figma and Storybook verification steps.** Neither tool exists here, so following them could only produce unverifiable claims.
- **List virtualization.** The grid is paginated by design, and virtualization would break the full-page screenshots that are the only verification channel.
- **Runtime fetching of a third-party guidelines document before each review.** Makes behavior depend on a live external file.
- **Blanket stop-and-await-approval checkpoints on routine work, and cross-project design journals.** Ceremony on a padding fix is waste. The one approval this skill does keep is narrow and specific: a change to what `docs/SPEC.md` fixes is a spec amendment and needs confirmation.

## Review history

Validated against seven adversarial scenarios by an independent agent on 2026-07-25. That pass corrected a wrong directory name (`views` for `pages`), the conflation of review with fix, a missing amendment gate, defect routing that withheld the fix rules, an unverifiable squint test, a viewport matrix that missed the repo's real layout switch, and an iOS scroll-lock remedy that would have been claimed fixed on the wrong engine. Roughly a quarter of the original text duplicated `docs/SPEC.md` and was cut.
