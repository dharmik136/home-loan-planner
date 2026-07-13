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

Headlines and the masthead use **Prata** — a free stand-in for PF Marlet Display (Adobe Fonts entitlement was unavailable in this environment; see the design spec's Open Items to revisit real licensing) — for its tapered, quietly elegant capitals. Body text and every number use **Lora**, with tabular figures throughout so ledger columns stay aligned. **Kalam**, a hand-written face, is reserved for exactly one element: the milestone ink-stamp lettering. It never appears anywhere else.

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
