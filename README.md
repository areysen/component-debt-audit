# Component Debt

**A CLI health check for design systems.** `component-debt` scans a component library and scores it against the four pillars that determine whether a design system is actually paying for itself: **token architecture**, **component API consistency**, **accessibility compliance**, and **documentation coverage**.

Built by Andrew Reysen, founder of **Component Debt** — a design system audit consulting practice.

## Why this exists

Design systems accumulate debt the same way codebases do, just more quietly. A button component grows three more hardcoded hex values, a card component invents its own `size` prop instead of reusing the shared one, a modal loses its focus trap during a refactor, nobody updates the Storybook story. None of it breaks the build. All of it compounds.

`component-debt` gives you a fast, objective starting point: point it at a component library and get a scored report instead of a vibe.

## Status

| Pillar | Status |
| --- | --- |
| 1. Token Architecture | ✅ Implemented |
| 2. Component API Consistency | 🚧 Planned |
| 3. Accessibility Compliance (WCAG 2.1 AA) | 🚧 Planned |
| 4. Documentation Coverage | 🚧 Planned |

This is v0.1. Token architecture auditing works end-to-end today. The other three pillars are scaffolded into the report — they show up as "Coming soon" rather than a faked score — and are next on the roadmap. See [Limitations](#limitations-v01) for what v0.1 does and doesn't catch.

## Install

Run it directly with npx — no install step:

```bash
npx component-debt ./src/components
```

Or add it as a dev dependency so it can run in CI:

```bash
npm install --save-dev component-debt
npx component-debt ./src/components --min-score 70
```

**Running from source (before this is published to npm):**

```bash
git clone https://github.com/areysen/component-debt-audit
cd component-debt-audit
npm install
npm run build
node dist/cli.js /path/to/your/components
```

## Usage

```bash
component-debt [target] [options]
```

```
$ component-debt ./src/components

Component Debt Audit Report
Target: src/components
Files scanned: 47

PILLAR SCORES
  Token Architecture            72/100  ▓▓▓▓▓▓▓░░░
  Component API Consistency    —       Coming soon
  Accessibility Compliance     —       Coming soon
  Documentation Coverage       —       Coming soon

OVERALL HEALTH: 72/100 (based on 1/4 pillars)

TOKEN ARCHITECTURE — DETAILS
  Style Files Scanned: 47
  Token Usage Count: 213
  Token Definition Count: 38
  Hardcoded Color Count: 12
  Hardcoded Spacing Count: 31
  Has Token Definition File: true
  Token Definition File: src/tokens/index.json

Top issues (showing 10 of 43):
  src/components/Card/Card.css:14          [high]   Hardcoded color "#3366ff" — consider referencing a design token instead.
  src/components/Modal/Modal.tsx:22        [medium] Hardcoded value "24px" for "padding" — consider a spacing/sizing token.
  ...
```

### Options

| Option | Description | Default |
| --- | --- | --- |
| `[target]` | Path to the component library / design system to audit | `.` |
| `-j, --json` | Output the report as JSON instead of the formatted report | `false` |
| `-o, --out <file>` | Write the report to a file instead of stdout | — |
| `--max-issues <n>` | Max issues shown per pillar in the formatted report | `10` |
| `--min-score <n>` | Exit with code `1` if the overall score is below this threshold | — |
| `--ignore <glob>` | Additional ignore glob pattern (repeatable) | — |
| `--px-threshold <n>` | Ignore hardcoded px values at or below this magnitude (e.g. `1px` borders) | `1` |
| `-V, --version` | Output the version number | |
| `-h, --help` | Display help | |

### CI usage

Fail a pull request when token health drops below a threshold:

```bash
npx component-debt ./src/components --min-score 70
```

## How the Token Architecture score works

The token pillar scans:

- `.css`, `.scss`, `.sass`, and `.less` files directly.
- Styled-components / Emotion tagged template literals — `` styled.div` ` ``, `` styled(Foo)` ` ``, `` css` ` ``, `` createGlobalStyle` ` ``, `` keyframes` ` `` — inside `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, and `.svelte` files.

For each line it checks:

- **`hardcoded-color`** (high severity) — a literal hex (`#fff`, `#3366ff`) or functional color (`rgb(...)`, `hsla(...)`) outside of a CSS custom property *definition*. (Defining `--color-primary: #3366ff;` is the token system doing its job, so definitions are never flagged — only literal colors used in actual rules.)
- **`hardcoded-spacing`** (medium, or low for `border-radius`/`letter-spacing`) — a literal `px` value on a spacing- or sizing-related property (`margin`, `padding`, `gap`, `width`, `font-size`, etc.) that isn't routed through `var(--*)`. Values at or below `--px-threshold` (default `1`) are ignored, since `1px` borders are rarely worth tokenizing.

It also counts `var(--*)` usages (token adoption) and `--name: value;` definitions, and checks for a project-level token source of truth (`tokens.json`, `design-tokens.*`, `theme.*`, `tailwind.config.*`, or a `tokens/` directory).

**Score formula:**

```
weightedHardcoded = (hardcoded colors × 1.5) + hardcoded spacing values
adoptionRatio      = tokenUsages / (tokenUsages + weightedHardcoded)
bonus              = +5 if a token definition file was found
score              = clamp(round(adoptionRatio × 100 + bonus), 0, 100)
```

Colors are weighted higher than spacing because color drift is usually the more expensive thing to unwind later (theming, dark mode, brand refreshes all hinge on it).

If no style-bearing files are found at all, the score is `null` rather than a misleading 100 — there's nothing to audit, not a clean bill of health.

## Programmatic API

```ts
import { runAudit } from 'component-debt';

const report = await runAudit('./src/components', { minScore: 70 });
console.log(report.overallScore);
console.log(report.pillars.find((p) => p.id === 'tokens')?.findings);
```

`runAudit` returns the same `AuditReport` shape used by the CLI's `--json` output.

## Roadmap

- **Component API Consistency** — prop naming conventions, variant pattern consistency, composition analysis across similar components.
- **Accessibility Compliance** — static WCAG 2.1 AA checks: missing ARIA attributes, keyboard handler presence, alt text on images, resolvable color-contrast issues.
- **Documentation Coverage** — Storybook story coverage, prop-table/JSDoc coverage, usage example detection.
- Token analysis for inline `style={{ ... }}` objects and CSS Modules computed values.

## Limitations (v0.1)

- The token audit is regex-based, not a full CSS/JS parser. It's tuned for real-world accuracy, not 100% precision — review findings before treating them as ground truth.
- Inline `style={{ ... }}` objects and CSS-in-JS patterns outside styled-components/Emotion-style tagged templates aren't analyzed yet.
- Three of the four pillars aren't implemented yet (see [Status](#status)) and are intentionally reported as "Coming soon," not given a fabricated score.

## Contributing

Issues and PRs welcome, especially for the Component API, Accessibility, and Documentation pillars. Please include a test fixture with any new rule.

```bash
npm install
npm run test
npm run lint
```

## License

MIT © Andrew Reysen
