# Fresh Khata Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Domain note:** this is a visual-design-system task, not a logic/algorithm task. There is no meaningful unit test for "is this hex code correct." Each task's verification step is a **build check** (`npm run build` must succeed) plus a **visual check** (Playwright screenshot of the affected route, in both Day and Lamplight mode, compared against the approved mockups in the spec) — this is the TDD-equivalent "run the test, confirm pass/fail" step for this domain, and every task uses it consistently.

**Goal:** Replace the app's two competing visual languages (a broadsheet-ledger theme on planner/calculator pages, a generic blue-SaaS skin on landing/pricing/about/sample-report) with one system — Fresh Khata, a modern Bahi-khata (Indian merchant ledger) — across every route, then deploy it.

**Architecture:** The app already renders almost all broadsheet UI (36 components, 392 call sites) via CSS custom properties (`var(--emerald)`, `var(--paper)`, etc.) defined in two stacked token layers in `globals.css` — a "legacy" layer and a later "UIUX refresh" layer that currently overrides it with an unrelated blue palette (`--color-primary: #1769e0`), which is the actual root cause of the inconsistency: the override layer's blue wins the CSS cascade even on broadsheet pages. Retinting both layers' *values* (not restructuring the layers themselves — out of scope, not this task's problem to solve) re-themes the overwhelming majority of the app for free, because both the raw `var(--emerald)`-style CSS *and* the Tailwind utility classes (`bg-primary`, `text-foreground`, etc., which read the same custom properties via `tailwind.config.js`) key off these same variables. What does **not** cascade automatically — button fill-vs-outline, input box-vs-ruled-line, corner radius, the masthead rule, the milestone stamp, marketing copy — gets explicit, itemized edits.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v3.4 (`tailwind.config.js` uses `module.exports`, not v4's CSS-first config), the `@google/design.md` CLI (cloned locally at `dev/design.md`) for authoring/linting the canonical `DESIGN.md`, Google Fonts (Prata, Lora, Kalam) loaded via `next/font/google`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-14-fresh-khata-design.md` — every color/font/shape value below is copied verbatim from its token tables.
- Red (`cloth-red` / `ember-red`) never signals "bad news" — it is reserved for the masthead rule, primary-action outline buttons, and the milestone stamp only. Interest/cost figures use `cost` (muted iron-brown), never red.
- Tabular (`font-variant-numeric: tabular-nums`) numerals wherever money is displayed — the broadsheet CSS already does this in most places (`.stat .v`, `.entry-amt`); do not regress it.
- Corners: 2–4px everywhere ("cut-paper"), never Tailwind's default 8px+ rounding.
- Dark mode ("Lamplight") must stay warm (maroon-brown/ember/amber) — never cool blue-grey.
- `npm run build` (run from `next-app/`) must pass after every task before moving to the next.
- Out of scope: `web/` (legacy pre-Next.js app), Supabase schema/backend.

---

### Task 1: Author and lint `DESIGN.md`

**Files:**
- Create: `DESIGN.md` (repo root, `C:\Users\Dharmik Shingala\HomeLoan-Planner\DESIGN.md`)

**Interfaces:**
- Produces: the canonical token source every later task's literal values are copied from. No code depends on this file being *parsed* at runtime — it is documentation + a lint/export source, per the spec.

- [ ] **Step 1: Write `DESIGN.md`**

```markdown
---
version: alpha
name: Fresh Khata
description: The Prepayment Ledger's visual identity — a modern Bahi-khata, the red-cloth Indian merchant ledger opened fresh each Diwali as a promise of honest bookkeeping.
colors:
  paper: "#F6EFE1"
  paper-raised: "#FBF3E5"
  ink: "#241C14"
  ink-soft: "#6B5B4A"
  rule: "#CBB99A"
  cloth-red: "#9E2B25"
  saved: "#2F6B4A"
  cost: "#6E5A4D"
  warn: "#A8531F"
  seal-gold: "#B98A2E"
  paper-dark: "#241512"
  paper-raised-dark: "#2E1D17"
  ink-dark: "#F0E4D3"
  ink-soft-dark: "#A99783"
  rule-dark: "#4A3830"
  cloth-red-dark: "#C8543F"
  saved-dark: "#4E9370"
  cost-dark: "#A08D7C"
  warn-dark: "#C97A45"
  seal-gold-dark: "#D9A64E"
typography:
  headline-lg:
    fontFamily: Prata
    fontSize: 2.75rem
    fontWeight: "400"
    lineHeight: 1.1
  headline-md:
    fontFamily: Prata
    fontSize: 1.75rem
    fontWeight: "400"
    lineHeight: 1.15
  headline-sm:
    fontFamily: Prata
    fontSize: 1.25rem
    fontWeight: "400"
    lineHeight: 1.2
  body-md:
    fontFamily: Lora
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: 1.5
  label:
    fontFamily: Lora
    fontSize: 0.75rem
    fontWeight: "600"
    lineHeight: 1.3
    letterSpacing: 0.08em
  numeral:
    fontFamily: Lora
    fontSize: 1rem
    fontWeight: "700"
    lineHeight: 1.3
  stamp:
    fontFamily: Kalam
    fontSize: 1rem
    fontWeight: "700"
rounded:
  sm: 2px
  md: 4px
spacing:
  unit: 8px
  sheet-padding: 24px
  gutter: 32px
components:
  masthead:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  sheet-card:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.sheet-padding}"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.cloth-red}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-outline-hover:
    backgroundColor: "{colors.cloth-red}"
    textColor: "{colors.paper}"
  input-ruled:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  input-ruled-focus:
    textColor: "{colors.cloth-red}"
  stat-saved:
    textColor: "{colors.saved}"
    typography: "{typography.numeral}"
  stat-cost:
    textColor: "{colors.cost}"
    typography: "{typography.numeral}"
  milestone-stamp:
    backgroundColor: transparent
    textColor: "{colors.cloth-red}"
    typography: "{typography.stamp}"
    rounded: 9999px
---

## Overview

The Bahi-khata — the red-cloth-bound merchant ledger opened fresh every Diwali (Chopda Pujan) as a promise of honest bookkeeping. Every page is ruled, every entry accounted for, every number written by a hand that stands behind it. The interface is a page in that ledger: cream paper, iron-warm ink, ruled columns doing the work that boxes and cards do elsewhere. Ornament is rare and therefore meaningful — reserved for the moments that have earned it: the masthead, the primary action, the day the debt is finally closed.

## Colors

The palette is warm throughout — paper and ink, never a pure black or a screen-cool grey.

- **Paper ({colors.paper}):** fresh, unwritten ledger stock. The page background.
- **Ink ({colors.ink}):** iron-gall ink, never pure black. Primary text.
- **Ink-soft ({colors.ink-soft}):** faded ink — captions, metadata, secondary text.
- **Rule ({colors.rule}):** the printed ruling on ledger paper. Hairline dividers.
- **Cloth-red ({colors.cloth-red}):** the ledger's cloth binding. Reserved for the masthead rule, outline buttons, and links — never for "bad news."
- **Saved ({colors.saved}):** money saved — keeps the universal green convention, tuned to read as a second ink color rather than a SaaS emerald.
- **Cost ({colors.cost}):** interest paid — a muted iron-brown. Explicitly not red.
- **Warn ({colors.warn}):** real form/validation errors — a burnt rust, kept apart from both `cost` and `cloth-red` so red stays sacred for ceremony.
- **Seal-gold ({colors.seal-gold}):** turmeric-gold — section-header rules, the milestone stamp accent.

At night ("Lamplight"), the page becomes `{colors.paper-dark}` — doing the books by lamp, not a cold dashboard — and `cloth-red` brightens to `{colors.cloth-red-dark}` so it reads as glowing ember rather than a dimmed daytime color.

## Typography

Headlines and the masthead use **Prata** — a free stand-in for PF Marlet Display (see spec's Open Items: real licensing not yet available in this environment) — for its tapered, quietly elegant capitals. Body text and every number use **Lora**, with tabular figures throughout so ledger columns stay aligned. **Kalam**, a hand-written face, is reserved for exactly one element: the milestone ink-stamp lettering. It never appears anywhere else.

## Layout

The app keeps its wide, multi-panel workspace — this is a tool whose value is comparing several numbers side by side, and narrowing it to a single reading column would be a real regression. Instead the width is expressed as a two-page ledger spread: a visible center gutter rule separates input panels from results panels, echoing the fold of an open ledger rather than a generic dashboard grid.

## Elevation & Depth

Two levels only: the page, and a sheet laid on top of it. Sheets get a soft, warm-brown-tinted shadow — like real paper catching light on a desk — never a cool-grey SaaS shadow, never glass, blur, or glow.

## Shapes

Corners are barely rounded — 2px (`{rounded.sm}`) to 4px (`{rounded.md}`) everywhere, evoking a trimmed paper edge rather than an app bubble. Nothing in this system uses Tailwind's default 8px+ radii.

## Components

- **Masthead:** cream background, a red double-rule bottom border (echoing a ledger page's ruled header band) on every page.
- **Sheet card:** `{colors.paper-raised}` background, `{rounded.md}` corners, the warm elevation shadow.
- **Buttons:** outline-only at rest — `cloth-red` border and text on transparent/paper background, no fill — filling solid `cloth-red` with paper-colored text only on hover. Quieter than a solid CTA, closer to a "sign here" box.
- **Inputs:** no box, no border — a bottom rule only (writing directly on a ledger line), label in small caps above, focus state thickens the rule to `cloth-red`.
- **Milestone stamp:** a circular, slightly rotated red ink stamp in Kalam, replacing badge/confetti-style celebration UI at the one moment it's earned: a loan reaching payoff.

## Do's and Don'ts

- **Do** let ruled lines separate content instead of boxing everything in cards.
- **Do** use tabular numerals wherever money is displayed.
- **Do** keep dark mode warm (Lamplight) — never cold blue-grey.
- **Don't** use red for interest cost, form errors, or any "bad news" — that's `cost` or `warn`.
- **Don't** add glass, blur, glow, or neon anywhere.
- **Don't** let Kalam appear anywhere but the milestone stamp.
- **Don't** round corners past 4px.
- **Don't** fill primary buttons at rest — outline only, fill on hover.
```

- [ ] **Step 2: Lint it**

Run (from repo root):
```bash
npx -p @google/design.md designmd lint DESIGN.md
```
Expected: exit code `0`. `missing-primary`/`missing-typography` warnings should NOT appear (a `primary`-named color isn't defined, but `cloth-red` fills that role intentionally — if the linter's `missing-primary` rule fires, that's an expected/acceptable warning given the spec's own vocabulary choice, not a bug to fix). Any `broken-ref` **error** (e.g. a typo'd `{colors.x}` reference) must be fixed before continuing — this is the one finding this task cannot ship with.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
git add DESIGN.md
git commit -m "Add Fresh Khata DESIGN.md"
```

---

### Task 2: Load Prata, Lora, Kalam via next/font

**Files:**
- Modify: `next-app/app/layout.tsx`
- Modify: `next-app/tailwind.config.js`

**Interfaces:**
- Produces: three CSS variables — `--font-prata`, `--font-lora`, `--font-kalam` — consumed by Task 3/4's `--display`/`--body` token definitions and by Tailwind's `fontFamily` theme extension.

- [ ] **Step 1: Read current `layout.tsx`**

Run: `cat "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app\app\layout.tsx"` and confirm its current font-loading approach (if any) before editing, since this step's exact diff depends on what's already there — do not blindly overwrite unrelated metadata/providers in the file.

- [ ] **Step 2: Add font loaders**

Add near the top of `next-app/app/layout.tsx` (alongside existing imports):

```tsx
import { Prata, Lora, Kalam } from "next/font/google";

const prata = Prata({ subsets: ["latin"], weight: "400", variable: "--font-prata" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-lora" });
const kalam = Kalam({ subsets: ["latin"], weight: "700", variable: "--font-kalam" });
```

Then add all three variable classes to the `<html>` (or `<body>`, whichever already carries `className` in this file) tag, e.g.:

```tsx
<html lang="en" className={`${prata.variable} ${lora.variable} ${kalam.variable}`}>
```

- [ ] **Step 3: Wire the variables into Tailwind's font family theme**

In `next-app/tailwind.config.js`, inside `theme.extend`, add:

```js
fontFamily: {
  display: ["var(--font-prata)", "serif"],
  body: ["var(--font-lora)", "serif"],
  stamp: ["var(--font-kalam)", "cursive"],
},
```

- [ ] **Step 4: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully`, all 9 routes still listed in the route table, no font-loader errors.

- [ ] **Step 5: Commit**

```bash
git add next-app/app/layout.tsx next-app/tailwind.config.js
git commit -m "Load Prata/Lora/Kalam via next/font"
```

---

### Task 3: Rewrite the legacy color/shadow token layer

**Files:**
- Modify: `next-app/app/globals.css:96-133`

**Interfaces:**
- Consumes: nothing new.
- Produces: `--paper`, `--paper-raised`, `--panel`, `--ink`, `--ink-soft`, `--ink-faint`, `--line`, `--line-strong`, `--emerald`/`--emerald-bright`/`--emerald-wash`, `--clay`/`--clay-wash`, `--gold`/`--gold-wash`, `--shadow`, `--display`, `--body` — all 392 existing call sites across 36 components keep using these exact names; only their *values* change, so no component file needs editing for this task.

- [ ] **Step 1: Replace lines 96–133**

Before (current):
```css
:root {
  --paper: #f4f0e6;
  --paper-raised: #fbf8f0;
  --panel: #efe9da;
  --ink: #191d26;
  --ink-soft: #565b66;
  --ink-faint: #8b8576;
  --line: #d7cfbc;
  --line-strong: #b9af98;

  --emerald: #1c7355;       /* money SAVED / kept */
  --emerald-bright: #2ba074;
  --emerald-wash: #e2ede4;
  --clay: #b0542f;          /* interest PAID / cost */
  --clay-wash: #f0e2d6;
  --gold: #b88a2a;
  --gold-wash: #f8f1df;

  --shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 12px 32px -16px rgba(25, 29, 38, 0.08), 0 2px 6px rgba(25, 29, 38, 0.03);
  --display: "Inter", "Segoe UI", system-ui, sans-serif;
  --body: "Inter", "Segoe UI", system-ui, sans-serif;
}

body.dark {
  --paper: #11141c;
  --paper-raised: #181d27;
  --panel: #202634;
  --ink: #f4f0e6;
  --ink-soft: #9c9586;
  --ink-faint: #6c6657;
  --line: #292f3d;
  --line-strong: #3f475a;

  --emerald-wash: #0e241c;
  --clay-wash: #281912;
  --gold-wash: #261e10;
  --shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 12px 32px -16px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15);
}
```

After (Fresh Khata):
```css
:root {
  --paper: #F6EFE1;
  --paper-raised: #FBF3E5;
  --panel: #F0E6D2;
  --ink: #241C14;
  --ink-soft: #6B5B4A;
  --ink-faint: #8A7A67;
  --line: #CBB99A;
  --line-strong: #B8A47F;

  --emerald: #2F6B4A;       /* money SAVED / kept */
  --emerald-bright: #3A8560;
  --emerald-wash: #E4ECE3;
  --clay: #6E5A4D;          /* interest PAID / cost — deliberately NOT red */
  --clay-wash: #EAE1D6;
  --gold: #B98A2E;
  --gold-wash: #F6EDD9;

  --shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 12px 32px -16px rgba(110, 70, 40, 0.28), 0 2px 6px rgba(110, 70, 40, 0.1);
  --display: var(--font-prata), serif;
  --body: var(--font-lora), serif;
}

body.dark {
  --paper: #241512;
  --paper-raised: #2E1D17;
  --panel: #33221B;
  --ink: #F0E4D3;
  --ink-soft: #A99783;
  --ink-faint: #7C6C5A;
  --line: #4A3830;
  --line-strong: #5C4740;

  --emerald: #4E9370;
  --emerald-bright: #5FAE85;
  --emerald-wash: #1C2E24;
  --clay: #A08D7C;
  --clay-wash: #33241C;
  --gold: #D9A64E;
  --gold-wash: #3A2C15;
  --shadow: 0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 12px 32px -16px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.3);
}
```

Note the `emerald`/`clay`/`gold` **names** are kept (renaming 392 call sites is out of scope and adds risk for zero visual benefit) but their **values** now map to Fresh Khata's `saved`/`cost`/`seal-gold` roles — `--emerald` IS the ledger's `saved` green, `--clay` IS `cost` brown, `--gold` IS `seal-gold`. Also note `body.dark` previously had no `--emerald`/`--clay`/`--gold` override (it inherited the light values) — this was a latent bug (dark mode showed light-mode greens/browns that didn't necessarily hold enough contrast against the dark background); Fresh Khata's `body.dark` block now explicitly overrides all three, closing that gap.

- [ ] **Step 2: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully`, no CSS parse errors.

- [ ] **Step 3: Visual check**

Start `npm run build && npx next start -p 3457`, then in Playwright: navigate to `http://localhost:3457/planner`, screenshot. Confirm: cream page background, warm ink text, green "saved" stats, brown (not red) "cost" stats. Toggle dark mode (click "Toggle Theme"), screenshot again. Confirm: maroon-brown page, parchment text, no leftover light-mode brights.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
git add next-app/app/globals.css
git commit -m "Retint legacy token layer to Fresh Khata Day/Lamplight palette"
```

---

### Task 4: Rewrite the "UIUX refresh" token layer (fixes the blue-vs-broadsheet inconsistency at its root)

**Files:**
- Modify: `next-app/app/globals.css:660-768` (the `:root` primitive/semantic block and its `body.dark` override)

**Interfaces:**
- Consumes: nothing new.
- Produces: same variable names as today (`--color-gray-*`, `--color-blue-*`, `--color-primary`, `--color-background`, `--button-bg`, etc.) — every Tailwind utility class (`bg-primary`, `text-foreground`, `bg-muted`, …) and every marketing-page component keeps working unchanged; only the values move from blue-SaaS to Fresh Khata.

- [ ] **Step 1: Re-read the current exact block**

This block is long (lines 660–768) and this plan was written against a snapshot of it — re-run `sed -n '660,768p' "next-app/app/globals.css"` (or open the file) immediately before editing to confirm line numbers haven't shifted from Tasks 1–3 (they shouldn't have, since those tasks only touched lines 96–133, but verify before pasting a replacement by line range).

- [ ] **Step 2: Replace the primitive + semantic token values**

Within the `:root { ... }` block that defines `--color-gray-50` through `--card-padding`, change exactly these value assignments (keep every variable *name*, keep every non-color variable — `--space-*`, `--duration-fast`, `--button-padding-*` — unchanged):

```css
  --color-gray-50: #F6EFE1;   /* was #f7f9fc — becomes Fresh Khata paper */
  --color-gray-100: #F0E6D2;  /* was #eef2f7 — becomes panel */
  --color-gray-200: #CBB99A;  /* was #dde5ef — becomes rule */
  --color-gray-300: #B8A47F;  /* was #c8d3e0 — becomes rule-strong */
  --color-gray-500: #6B5B4A;  /* was #667085 — becomes ink-soft */
  --color-gray-700: #4A3B2E;  /* was #344054 */
  --color-gray-900: #241C14;  /* was #172033 — becomes ink */
  --color-blue-50: #F0DCD6;   /* was #eaf3ff — a cloth-red-tinted wash, NOT plain paper (plain paper would make .add-btn:hover's background indistinguishable from its resting background — no visible hover feedback) */
  --color-blue-600: #9E2B25;  /* was #1769e0 — becomes cloth-red */
  --color-blue-700: #7F2019;  /* was #1254b3 — darker cloth-red for hover */
  --color-green-50: #E4ECE3;
  --color-green-600: #2F6B4A; /* was #13795b — becomes saved */
  --color-amber-50: #F6EDD9;
  --color-amber-600: #B98A2E; /* was #b76e00 — becomes seal-gold */
  --color-red-50: #F3E2DA;
  --color-red-600: #A8531F;   /* was #c2410c — becomes warn (kept OFF cloth-red on purpose) */

  --radius-sm: 2px;   /* was 4px */
  --radius-md: 4px;   /* was 8px — cut-paper corners */
  --shadow-sm: 0 1px 2px rgba(110, 70, 40, 0.10);   /* was cool-grey rgba(23,32,51,...) */
  --shadow-md: 0 16px 40px -28px rgba(110, 70, 40, 0.35);

  --color-card: #FBF3E5;               /* was #ffffff */
  --color-primary: #9E2B25;            /* was var(--color-blue-600) resolving to old blue */
  --color-primary-hover: #7F2019;
  --color-primary-foreground: #F6EFE1; /* was #ffffff — cream, not white */
  --color-ring: #9E2B25;

  --button-bg: transparent;            /* was var(--color-primary) — outline, not filled */
  --button-fg: var(--color-primary);   /* was var(--color-primary-foreground) */
  --button-hover-bg: var(--color-primary);
```

Leave `--color-success`, `--color-warning`, `--color-error` mapped to `--color-green-600`/`--color-amber-600`/`--color-red-600` as today (they now resolve to Fresh Khata's saved/seal-gold/warn automatically).

- [ ] **Step 3: Fix the `.btn`/`.add-btn` structural rules so the outline decision actually renders**

The `--button-bg: transparent` change above breaks `.btn`'s existing `border-color: var(--button-bg)` rule (a transparent border is invisible). Find this block (originally around line 1355) and replace it:

Before:
```css
.btn {
  border-color: var(--button-bg);
  background: var(--button-bg);
  color: var(--button-fg);
}

.btn:hover {
  background: var(--button-hover-bg);
  border-color: var(--button-hover-bg);
}
```

After:
```css
.btn {
  border-color: var(--color-primary);
  background: var(--button-bg);
  color: var(--button-fg);
}

.btn:hover {
  background: var(--button-hover-bg);
  border-color: var(--button-hover-bg);
  color: var(--color-primary-foreground);
}
```

- [ ] **Step 4: Update `body.dark`'s override block to Lamplight**

Find the `body.dark { ... }` block that follows (originally lines ~746–768) and replace its values:

```css
body.dark {
  --color-background: #241512;
  --color-foreground: #F0E4D3;
  --color-card: #2E1D17;
  --color-card-foreground: #F0E4D3;
  --color-muted: #33221B;
  --color-muted-foreground: #A99783;
  --color-border: #4A3830;
  --color-border-strong: #5C4740;
  --color-primary: #C8543F;
  --color-primary-hover: #DE6A54;
  --color-primary-foreground: #241512;
  --color-success: #4E9370;
  --color-warning: #D9A64E;
  --color-error: #C97A45;
  --color-ring: #C8543F;
  --color-blue-50: #3A241F;  /* an ember-tinted wash, NOT plain dark paper — same hover-visibility reasoning as the light-mode value above */
  --color-green-50: #1C2E24;
  --color-amber-50: #3A2C15;
  --color-red-50: #33241C;
  --ink-faint: #7C6C5A;
  --shadow-md: 0 18px 44px -26px rgba(0, 0, 0, 0.75);
}
```

- [ ] **Step 5: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 6: Visual check**

Serve the build (`npx next start -p 3457`). Screenshot `/` (landing) and `/pricing`. Confirm: no blue anywhere — the hero CTA border/text, the "Most Popular" ribbon, the currency toggle are all cloth-red, not blue. Toggle dark mode, re-screenshot, confirm Lamplight (maroon-brown, ember accents, no blue). Also `page.hover()` an `.add-btn` element in Playwright and screenshot — confirm its background visibly changes (a red-tinted wash), not an invisible same-color-as-rest hover.

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
git add next-app/app/globals.css
git commit -m "Retint UIUX-refresh token layer to Fresh Khata, fix blue/broadsheet clash"
```

---

### Task 5: Convert the 6 real filled-CTA buttons to outline-at-rest

**Files:**
- Modify: `next-app/components/Header.tsx:51`, `:109`
- Modify: `next-app/app/page.tsx:74`
- Modify: `next-app/app/about/page.tsx:120`
- Modify: `next-app/app/sample-report/page.tsx:166`
- Modify: `next-app/app/pricing/page.tsx:110`

**Interfaces:**
- Consumes: `--color-primary` / `--color-primary-foreground` from Task 4 (now cloth-red / cream).
- Produces: nothing new — this task only changes `className` strings, no new exports.

Explicitly **not** touched by this task (these are toggle/selected-state indicators, not primary-action buttons, per the spec's distinction — they pick up cloth-red automatically from Task 4's token change with no structural edit needed): `pricing/page.tsx:50` and `:58` (currency toggle), `pricing/page.tsx:79` ("Most Popular" ribbon), `WorkspaceSidebar.tsx:57` (active nav item).

- [ ] **Step 1: `Header.tsx` — both instances (line 51 and line 109 are byte-identical)**

Before:
```tsx
className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
```

After:
```tsx
className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-9 px-4 py-2"
```

- [ ] **Step 2: `page.tsx:74`**

Before:
```tsx
className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6"
```

After:
```tsx
className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-11 px-6"
```

- [ ] **Step 3: `about/page.tsx:120`**

Before:
```tsx
className="w-full inline-flex items-center justify-center rounded-md font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-55"
```

After:
```tsx
className="w-full inline-flex items-center justify-center rounded-md font-bold text-sm border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-10 px-4 disabled:opacity-55"
```

- [ ] **Step 4: `sample-report/page.tsx:166`**

Before:
```tsx
className="w-full inline-flex items-center justify-center rounded-md font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
```

After:
```tsx
className="w-full inline-flex items-center justify-center rounded-md font-bold text-sm border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-9 px-4"
```

- [ ] **Step 5: `pricing/page.tsx:110`** (inside the template-literal ternary — only the truthy branch changes)

Before:
```tsx
tier.isPopular
  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
  : 'border border-input bg-background hover:bg-accent text-foreground'
```

After:
```tsx
tier.isPopular
  ? 'border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground'
  : 'border border-input bg-background hover:bg-accent text-foreground'
```

- [ ] **Step 6: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 7: Visual check**

Screenshot `/` and `/pricing` again. Confirm the hero CTA, pricing tier CTA, and header's "Sign In"/"Go to Dashboard" buttons are outline (cream/transparent background, cloth-red border+text) at rest, filling solid cloth-red only when hovered (use `page.hover()` in Playwright to confirm the hover state renders).

- [ ] **Step 8: Commit**

```bash
git add next-app/components/Header.tsx next-app/app/page.tsx next-app/app/about/page.tsx next-app/app/sample-report/page.tsx next-app/app/pricing/page.tsx
git commit -m "Convert primary CTA buttons to outline-at-rest per Fresh Khata"
```

---

### Task 6: Ruled-line inputs

**Files:**
- Modify: `next-app/app/globals.css:395-405` (the `.field input` / `.field input:focus` rules)

**Interfaces:**
- Consumes: `--ink`, `--paper`, `--line`, `--emerald` (all defined in Task 3) — reuses the `--emerald` variable for the focus rule color since it's the same "accent" role `cloth-red` fills in the new system... **correction:** per the spec, ruled-line focus should be `cloth-red`, not `saved`-green. Since `--emerald` now means "saved" (Task 3), this rule must switch to a color token that means cloth-red. `globals.css` doesn't currently have a bare `--cloth-red` variable in the legacy layer (only `--color-primary` in the refresh layer, which is a different cascade layer/naming scheme) — add one.

- [ ] **Step 1: Add a `--cloth-red` variable to the legacy `:root` block from Task 3**

In `next-app/app/globals.css`, inside the same `:root { ... }` block edited in Task 3, add one line (and its dark-mode override):

```css
:root {
  /* ...existing Task 3 variables... */
  --cloth-red: #9E2B25;
}

body.dark {
  /* ...existing Task 3 variables... */
  --cloth-red: #C8543F;
}
```

- [ ] **Step 2: Replace the `.field input` / `.field input:focus` rules**

Before:
```css
.field input {
  width: 100%; font-family: var(--body); font-size: 0.98rem; font-weight: 600;
  color: var(--ink); background: var(--paper); border: 1px solid var(--line-strong);
  border-radius: 2px; padding: 9px 11px; transition: border-color 0.15s, box-shadow 0.15s;
}
.field input:focus {
  outline: none;
  border-color: var(--emerald);
  box-shadow: 0 0 0 1px var(--emerald), 0 4px 12px -4px rgba(28, 115, 85, 0.12);
  background: var(--paper-raised);
}
```

After:
```css
.field input {
  width: 100%; font-family: var(--body); font-size: 0.98rem; font-weight: 600;
  color: var(--ink); background: transparent; border: none;
  border-bottom: 1.5px solid var(--line); border-radius: 0;
  padding: 9px 2px; transition: border-color 0.15s, border-bottom-width 0.15s;
}
.field input:focus {
  outline: none;
  border-bottom: 2.5px solid var(--cloth-red);
  background: transparent;
}
```

Also update the general `input:not([type="checkbox"]):not([type="radio"]):not([type="range"])` focus rule (found earlier in the file, around line 70-79 in the file's opening section) that sets `border-color: var(--emerald) !important; box-shadow: ...` on every text/email/number/month input site-wide — apply the same "no box, bottom rule only, cloth-red on focus" treatment there for consistency (that rule currently governs inputs outside `.field` wrappers, e.g. on marketing pages).

- [ ] **Step 3: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Visual check**

Screenshot `/planner` — every loan-input field (Outstanding Principal, Interest Rate, Tenure, etc.) should show no box/border, just a bottom rule, with the rule turning cloth-red and thickening when a field is focused (use `page.locator(...).focus()` in Playwright to trigger and confirm the focus state).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
git add next-app/app/globals.css
git commit -m "Convert form inputs to ruled-line style"
```

---

### Task 7: Masthead double-rule + Header wordmark

**Files:**
- Modify: `next-app/app/globals.css` (`.masthead` rule, originally lines 161–171)
- Modify: `next-app/components/Header.tsx:13, 18`

**Interfaces:**
- Consumes: `--cloth-red` (Task 6), `--display` (Prata, Task 3).

- [ ] **Step 1: Update the broadsheet `.masthead` rule's border**

Before (line 162):
```css
  border-bottom: 3px double var(--ink);
```

After:
```css
  border-bottom: 4px double var(--cloth-red);
```

- [ ] **Step 2: Give `Header.tsx`'s bottom border the same double-rule and set the wordmark in Prata**

Before:
```tsx
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
```

After:
```tsx
    <header className="sticky top-0 z-50 w-full border-b-4 border-double border-primary bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
```

Before (line 18):
```tsx
            <span className="text-primary">The Prepayment Ledger</span>
```

After:
```tsx
            <span className="text-primary font-display">The Prepayment Ledger</span>
```

(`font-display` resolves to Prata via the `fontFamily.display` extension added in Task 2.)

- [ ] **Step 3: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```

- [ ] **Step 4: Visual check**

Screenshot every route's top nav bar. Confirm: cream background, a visible double red rule along the bottom edge, "The Prepayment Ledger" wordmark rendering in Prata (visually distinct serif, not the default sans).

- [ ] **Step 5: Commit**

```bash
git add next-app/app/globals.css next-app/components/Header.tsx
git commit -m "Add masthead double-rule and Prata wordmark"
```

---

### Task 8: Milestone ink-stamp component

**Files:**
- Create: `next-app/components/MilestoneStamp.tsx`
- Modify: `next-app/app/planner/page.tsx:385` (swap `<DebtFreeCelebration results={results} />` for the new component)

**Interfaces:**
- Consumes: `LoanResult[]` from `../engine/planning` (same type `DebtFreeCelebration` already consumes — reuse its exact computation, don't reinvent it).
- Produces: `MilestoneStamp({ results }: { results: LoanResult[] }): JSX.Element | null` — same signature as the component it replaces, so the single call site in `planner/page.tsx` only needs its import and JSX tag renamed, no prop changes.

**Scope note:** `AchievementBadges.tsx` and `DebtMilestones.tsx` are a different UI pattern (an ongoing progress-badge list, not a one-time celebration) and are left as-is structurally — they already re-theme automatically from Task 3's token change (both use `var(--emerald)` etc. per the codebase's existing pattern). Only `DebtFreeCelebration`, the literal "debt-free" moment, gets the ink-stamp treatment.

- [ ] **Step 1: Create `MilestoneStamp.tsx`**

```tsx
import { useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { monthLabel } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function MilestoneStamp({ results }: Props) {
  const milestone = useMemo(() => {
    let totalMonthsSaved = 0;
    let finalPayoffMonth = 0;
    let startMonth = "";

    results.forEach((r) => {
      totalMonthsSaved = Math.max(totalMonthsSaved, r.comparison.monthsSaved);
      finalPayoffMonth = Math.max(finalPayoffMonth, r.plan.monthsToPayoff);
      if (!startMonth || r.loan.startYYYYMM < startMonth) {
        startMonth = r.loan.startYYYYMM;
      }
    });

    return { monthsSaved: totalMonthsSaved, payoffMonth: finalPayoffMonth, startMonth };
  }, [results]);

  if (milestone.monthsSaved <= 0) return null;

  const years = Math.floor(milestone.monthsSaved / 12);
  const remainingMonths = milestone.monthsSaved % 12;
  const timeSavedStr = `${years > 0 ? `${years} Year${years > 1 ? "s" : ""} ` : ""}${remainingMonths > 0 ? `${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}` : ""}`;

  return (
    <div
      className="panel"
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        padding: "16px",
        marginBottom: "16px",
        display: "flex",
        gap: "20px",
        alignItems: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "72px",
          height: "72px",
          minWidth: "72px",
          borderRadius: "50%",
          border: "2.5px solid var(--cloth-red)",
          color: "var(--cloth-red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-11deg)",
          fontFamily: "var(--font-kalam), cursive",
          fontWeight: 700,
          fontSize: "0.85rem",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        AHEAD<br />OF PLAN
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 400, fontFamily: "var(--display)", color: "var(--ink)" }}>
          Payoff date improved
        </h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
          The current prepayments reduce the payoff timeline by <b style={{ color: "var(--cloth-red)" }}>{timeSavedStr}</b>.
          Estimated final payoff: <b style={{ color: "var(--cloth-red)" }}>{monthLabel(milestone.startMonth, milestone.payoffMonth)}</b>.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Swap the call site**

In `next-app/app/planner/page.tsx`, replace the import (line 30):

Before:
```tsx
import { DebtFreeCelebration } from "../../components/DebtFreeCelebration";
```

After:
```tsx
import { MilestoneStamp } from "../../components/MilestoneStamp";
```

And the JSX (line 385):

Before:
```tsx
          {loans.length >= 1 && <DebtFreeCelebration results={results} />}
```

After:
```tsx
          {loans.length >= 1 && <MilestoneStamp results={results} />}
```

- [ ] **Step 3: Delete the old component**

```bash
rm "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app\components\DebtFreeCelebration.tsx"
```

(Confirm first with `grep -r "DebtFreeCelebration" next-app/` that `planner/page.tsx` was the only call site — it was, per the earlier repo-wide grep in this session.)

- [ ] **Step 4: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully` — no "module not found" for the deleted file.

- [ ] **Step 5: Visual check**

On `/planner`, with at least one loan configured and a prepayment entered that improves the payoff date, screenshot the milestone area. Confirm: a rotated red circular stamp in Kalam appears instead of the old plain green info panel, red is used only on the stamp/its accent text (not on the "cost" figures elsewhere on the page).

- [ ] **Step 6: Commit**

```bash
git add next-app/components/MilestoneStamp.tsx next-app/app/planner/page.tsx
git rm next-app/components/DebtFreeCelebration.tsx
git commit -m "Replace DebtFreeCelebration badge with ceremonial ink-stamp milestone"
```

---

### Task 9: Copy voice pass on marketing pages

**Files:**
- Modify: `next-app/app/page.tsx:65-70`
- Modify: `next-app/app/pricing/page.tsx:10-31` (tier names/CTA text only)

**Interfaces:** none — text content only, no signatures change.

**Scope note:** `about/page.tsx`'s existing headlines ("THE STORY BEHIND THE LEDGER", "OUR TRANSPARENCY CHARTER") already sit comfortably inside the ledger register — left unchanged. `sample-report/page.tsx`'s heading is just the product name — left unchanged.

- [ ] **Step 1: Rewrite the landing hero (`page.tsx:65-70`)**

Before:
```tsx
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              BECOME DEBT-FREE YEARS FASTER.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Don&apos;t let banks compound your mortgage. Track, optimize, and roll over your loans. Break free from the interest trap.
            </p>
```

After:
```tsx
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display">
              EVERY RUPEE OF YOUR LOAN, ACCOUNTED FOR.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              No compounding left unexamined, no prepayment left unweighed. Open a ledger for your mortgage and see, in ink, exactly when it closes.
            </p>
```

- [ ] **Step 2: Rewrite the hero CTA label (`page.tsx:76`)**

Before:
```tsx
                Try Free Multi-Loan Planner ➔
```

After:
```tsx
                Open the Ledger ➔
```

- [ ] **Step 3: Light pass on pricing tier names/CTAs (`pricing/page.tsx:10-31`)**

Before (the three tier definitions' `name`/`ctaText` fields):
```tsx
      name: 'FREE BASIC',
      ...
      ctaText: 'Get Started',
      ...
      name: 'PREMIUM SOLO',
      ...
      ctaText: 'Buy Premium Now',
      ...
      name: 'PROFESSIONAL SaaS',
      ...
      ctaText: 'Try Advisor Plan Free',
```

After:
```tsx
      name: 'THE LEDGER, FREE',
      ...
      ctaText: 'Open a Free Ledger',
      ...
      name: 'THE LEDGER, KEPT',
      ...
      ctaText: 'Keep the Full Ledger',
      ...
      name: 'THE ADVISOR\'S LEDGER',
      ...
      ctaText: 'Start the Advisor Plan',
```

- [ ] **Step 4: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```

- [ ] **Step 5: Visual check**

Screenshot `/` and `/pricing`. Read the copy aloud — confirm nothing reads as leftover generic-SaaS phrasing ("Become debt-free years faster", "Try Free...") and that numbers/claims are unchanged from before (only the voice changed, not the facts).

- [ ] **Step 6: Commit**

```bash
git add next-app/app/page.tsx next-app/app/pricing/page.tsx
git commit -m "Rewrite marketing copy into the ledger voice"
```

---

### Task 10: Two-page ledger spread — visible center gutter rule

**Files:**
- Modify: `next-app/app/globals.css:307` (the `.col-left` rule)

**Interfaces:** none — pure CSS, no component changes.

The planner's `.grid` (globals.css:301-306) already lays out three columns — `.col-left` (370px, loan setup/inputs — "what you enter"), `.col-mid` (1fr, results/charts — "what the ledger tells you"), `.col-right` (400px, tools sidebar). Per the spec, the fold between entries and results should read as a visible ledger-page gutter, not a generic dashboard gap.

- [ ] **Step 1: Add a ruled gutter to `.col-left`**

Before:
```css
.col-left { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
```

After:
```css
.col-left {
  display: flex; flex-direction: column; gap: 16px; min-width: 0;
  border-right: 1px solid var(--line);
  padding-right: 20px;
}
```

(`.grid`'s existing `gap: 20px` already provides the spacing either side of this new rule — no gap value change needed.)

- [ ] **Step 2: Suppress the gutter rule at the two-column and single-column breakpoints**

The `@container workspace (max-width: 1380px)` and `(max-width: 940px)` blocks (globals.css:311-330ish) reflow `.col-left` alongside `.col-right` differently — a vertical rule that made sense in the 3-column desktop layout can look like a stray line once columns stack. Add, inside the `@container workspace (max-width: 940px) { ... }` block (the single-column breakpoint):

```css
  .col-left {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid var(--line);
    padding-bottom: 16px;
  }
```

- [ ] **Step 3: Build check**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```

- [ ] **Step 4: Visual check**

Screenshot `/planner` at desktop width (≥1380px viewport) — confirm a visible thin rule separates the loan-setup column from the results column, reading as a page fold. Resize the Playwright viewport to ~800px width and re-screenshot — confirm the vertical rule is gone and replaced by a horizontal one between the stacked sections (no orphaned vertical line in the narrow layout).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
git add next-app/app/globals.css
git commit -m "Add ledger-spread gutter rule between entries and results columns"
```

---

### Task 11: Final build, deploy, and end-to-end visual verification

**Files:** none created/modified — this task is verification and deployment only.

- [ ] **Step 1: Full local build**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npm run build
```
Expected: `✓ Compiled successfully`, all 9 routes present in the route table (`/`, `/_not-found`, `/about`, `/api/amortize`, `/calculator`, `/planner`, `/planner/optimizer`, `/pricing`, `/sample-report`).

- [ ] **Step 2: Re-lint `DESIGN.md`**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
npx -p @google/design.md designmd lint DESIGN.md
```
Expected: exit code `0`, same acceptable-warning profile as Task 1 Step 2 (no new `broken-ref` errors introduced by any later edit).

- [ ] **Step 3: Local visual sweep, Day mode**

Serve (`npx next start -p 3457` from `next-app/`) and Playwright-screenshot every route: `/`, `/about`, `/calculator`, `/planner`, `/planner/optimizer`, `/pricing`, `/sample-report`. Confirm across all of them: cream paper background, Prata headlines, Lora body/numerals, cloth-red masthead double-rule, outline (not filled) primary buttons, ruled-line inputs, no blue, no cost/error figure in red.

- [ ] **Step 4: Local visual sweep, Lamplight mode**

Toggle dark mode and repeat the same 7-route screenshot sweep. Confirm: warm maroon-brown/ember/amber throughout, no cold blue-grey dashboard look.

- [ ] **Step 5: Deploy to the existing Vercel production project**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner\next-app"
npx vercel deploy --prod --yes --scope shish111
```
Expected: a `Deployment ... ready.` message with a `https://home-loan-planner-*.vercel.app` URL, `target: production`.

- [ ] **Step 6: Live verification**

Playwright-navigate to `https://home-loan-planner-neon.vercel.app/` and `/planner` (the stable production aliases). Screenshot both, in both Day and Lamplight. Confirm the live site matches the local visual sweep from Steps 3–4 — no stale cache, no build/deploy drift.

- [ ] **Step 7: Final commit (if anything was left uncommitted) and status summary**

```bash
cd "C:\Users\Dharmik Shingala\HomeLoan-Planner"
git status --short
```
Expected: clean (nothing to commit — every prior task already committed its own changes). If anything unexpected shows up, investigate before considering this plan complete.
