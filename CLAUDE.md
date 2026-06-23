# Component Debt: project rules

`component-debt` is a CLI that audits design systems for token, API, accessibility, and documentation debt. It is original IP owned by Andrew Reysen and part of his independent consulting practice. These rules apply to every session, local or cloud.

## Prose (applies to code output, README, and docs)

- **No em-dashes.** Use commas, colons, parentheses, or "and". En-dashes only for true numeric ranges (2024–2026). This includes strings the tool prints to users, not just documentation. Grep for the em-dash character before declaring any change done.
- Prefer full forms in formal docs ("cannot" not "can't").
- **Verify before asserting.** Keep README and marketing claims defensible against what the code actually does. Do not overstate coverage. Unimplemented pillars must report "Coming soon", never a fabricated score.

## Accessibility (this is also the product's whole point)

- The author is **red/green colorblind**. Any UI or terminal output must meet **WCAG AA** (4.5:1 normal text, 3:1 large/UI), with contrast ratios **computed mathematically**, not eyeballed.
- **Never convey state by color alone.** Always pair color with text, shape, or length. Current examples to preserve: severity badges carry `[high]`/`[medium]`/`[low]` labels, and score lines carry a numeric value plus a proportional bar, so meaning survives without color.

## Engineering

- TypeScript strict. Keep `npm run build`, `npm run lint`, and `npm test` green before any commit.
- Every new rule ships with a test fixture (see `test/fixtures/`).
- The token audit is regex-based by design; favor real-world accuracy over false precision, and document known gaps in the README Limitations section.
