# The Prepayment Ledger Design System

This document describes the current product interface in `next-app`. Historical
design explorations remain under `docs/superpowers/`; they are not the source of
truth for production styling.

## Product Character

The interface should feel like a serious financial planning desk: precise,
calm, information-dense, and easy to audit. The public site introduces the
product with editorial typography, while the planner uses a compact operational
layout for repeated analysis.

The product name is **The Prepayment Ledger** on public pages. Inside the app,
the shorter **Loan Planner** label keeps the workspace navigation compact.

## Foundations

- **Primary action:** emerald (`#07835e` light, `#52d6a7` dark).
- **Secondary accent:** indigo for baseline comparisons and neutral actions.
- **Surfaces:** cool white and soft grey in light mode; charcoal and deep green
  black in dark mode.
- **Typography:** Manrope for controls and data, Source Serif 4 for editorial
  headings. Financial values use tabular numerals.
- **Shape:** 6-8px radii for panels and controls. Pills are reserved for compact
  status or metadata labels.
- **Motion:** short state transitions only. Honor `prefers-reduced-motion`.

Production tokens and overrides live in `next-app/app/experience.css`. The
legacy variables in `globals.css` are compatibility aliases for existing
planner components, not a separate visual system.

## Public Experience

The home page opens on the real planning experience, not a marketing splash.
Its first viewport must include:

1. The literal product category: "Home loan payoff planner".
2. A direct route to the portfolio planner and single-loan calculator.
3. The beginning of an interactive payoff model with real amortization output.

Public navigation is minimal and responsive. Claims must match implemented
behavior; do not advertise authentication, checkout, PDF generation, or paid
features until those systems exist.

## Workspace

- Desktop uses a fixed navigation rail and a three-column planner where space
  permits.
- Tablet collapses tools beneath the primary analysis.
- Mobile uses a fixed horizontal icon bar and a single content column.
- Workflow tabs may scroll horizontally, but the document itself must never
  have horizontal overflow.
- Core loan inputs stay visible. Lender rules and advanced settings begin
  collapsed in a disclosure.
- Results lead with interest saved, time saved, remaining interest, and payoff
  date before charts or secondary tools.

## Interaction Rules

- Use Lucide icons for familiar actions and provide labels or tooltips.
- Every input needs an accessible name and visible label.
- Controls have a minimum 44px touch target on compact viewports.
- Focus rings use the primary emerald and remain visible in both themes.
- Do not use alerts as placeholders for unfinished actions. Hide the action or
  state the current limitation plainly.
- Calculations start in the browser. Any Supabase write requires an explicit
  user action and clear disclosure of the data being sent.

## Responsive And Print QA

Before release, verify at 390x844, 768x1024, 1280x800, and 1440x900. Check both
themes, menu and sidebar behavior, live input updates, charts, tables, and zero
page-level horizontal overflow. Print styles hide interactive chrome and render
the report in a legible black-on-white layout.

## Accessibility

- Maintain one clear `h1` per route and logical heading order.
- Preserve semantic landmarks for the public header, workspace navigation,
  main content, complementary tools, and footer.
- Do not rely on color alone for baseline-versus-plan comparisons.
- Keep body and control text readable; compact labels should not drop below
  12px.
- Keyboard and reduced-motion behavior are release requirements, not optional
  polish.
