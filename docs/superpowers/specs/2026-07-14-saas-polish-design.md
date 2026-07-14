# Fresh Khata — SaaS-Grade Polish Design

**Status:** Approved. Scope confirmed by user: raise Fresh Khata's execution quality, keep the Bahi-khata identity unchanged.

## Context

Fresh Khata (the Bahi-khata/merchant-ledger identity, see `DESIGN.md`) is built and deployed. This pass studies ten reference `DESIGN.md` systems — Linear, Stripe, Notion, Vercel, Supabase, Figma, Raycast, Sentry, PostHog, Cal.com — to extract craft-level execution lessons and apply them *inside* the existing ledger metaphor. Nothing here replaces a color, a font, or the identity's rules; it raises how consistently and completely those rules are executed.

Every change below cites the pattern that motivated it and why it fits Fresh Khata specifically, per the project's existing "everything must be deliberate" convention.

## Scope

### Stage 1 — mechanical execution gaps (low risk, high leverage)

1. **Negative letter-spacing on Prata display sizes.** Nine of ten studied systems tighten display type (Linear -3.75%, Stripe -2.5%, Notion -2.5%, Vercel -5%, Figma -2%, Sentry, Supabase, Cal.com all similar; only PostHog and Raycast don't). Our masthead/panel-title/stat-value Prata sizes currently carry `letter-spacing: -0.02em` to `-0.015em` in places but not consistently, and some (`.product-intro h1`, `.masthead h1` in the refresh layer) are at `0`. Apply a consistent, gentle negative tracking scale to every Prata display use (serifs need less aggressive tracking than the sans faces in the references, since serifs already carry optical spacing) — roughly -0.01em to -0.02em depending on size.

2. **Explicit disabled + pressed states.** Every studied system documents states beyond hover: disabled and active/pressed at minimum. `.btn`, `.add-btn`, ruled-line inputs, and selects currently define only rest + hover + focus. Add:
   - `:disabled` on `.btn`/`.add-btn`: reduced opacity (0.5), `cursor: not-allowed`, no hover transform/color change.
   - Confirm `:active` (pressed) is defined consistently — `.btn:active` already scales to 0.97; extend the same treatment to `.add-btn:active` and ruled-line inputs' focus-active distinction is already covered by the thickened rule.

3. **Tabular-numerals audit.** Stripe's write-up calls this "the brand's quiet financial-data signal" — more load-bearing for us than for any of the ten studied, since every screen is a money screen. Several components already set `font-variant-numeric: tabular-nums` (`.stat .v`, `.entry-amt`, `.wf-side .big`, `.sched-table`) but others render raw `formatINR()`/`formatCompactINR()` output with no tabular-nums rule: `BankEMIComparator`'s table cells, `InvestmentVsPrepay`'s option cards, `SIPCorpusSimulator`'s corpus/milestone figures, `PortfolioBalanceChart`'s tooltip, `LoanCard`'s EMI-error inline figures. Add `font-variant-numeric: tabular-nums` wherever a money or count figure renders.

4. **A real callout component for validation messages.** PostHog's tip/warning/success/info banner system is a stronger pattern than our current inline-colored-text treatment. `LoanCard`'s `hasErrors` block already has a bordered/tinted treatment (`.callout-warning-pulse`) — but it conflates true errors (red-adjacent `--warn`) and soft warnings (`rateWarning`) in one undifferentiated block. Introduce a small `Callout` component with two variants (`error`, `warning`) that separates "this input is invalid" from "this value looks unusual, please verify" — using `--warn` for true errors and `--gold` for soft warnings, each with its own icon glyph and border-left accent, consistent with the ledger's ink-annotation feel (a marginal note, not a modal alert).

### Stage 2 — signature moves (identity-reinforcing, not generic)

5. **Lamplight featured pricing tier.** Stripe/Vercel/Cal.com/Sentry all invert their featured pricing tier to a dark card. Copying that literally would be generic. Fresh Khata already has a second palette *with a name and a story* — Lamplight, the night mode ("doing the books by lamp, not a cold dashboard"). Give `/pricing`'s "THE LEDGER, KEPT" tier the literal Lamplight palette (`--paper-dark`, `--cloth-red-dark`, `--ink-dark` tokens) as an inline-scoped treatment, regardless of the page's own day/night mode — reading as "the ledger someone's already lit a lamp over, because it's the one worth choosing." This is unique to Fresh Khata; no other system's dark-tier trick carries this meaning.

6. **One scarce hand-inked flourish.** Every studied system has exactly one signature decorative motif, used sparingly (Notion's sticky-note dot, Figma's color block, PostHog's hedgehog). Fresh Khata already has the milestone ink-stamp and the masthead double-rule. Add exactly one more: a small hand-drawn underline flourish beneath the masthead wordmark on the marketing pages, generated via the same roughen-filter SVG toolchain already proven on the `dharmik136` profile README (`~/Downloads/_art-tools`). One instance, one location — consistent with the "ornament is rare and therefore meaningful" rule already in `DESIGN.md`.

### Stage 3 — documentation and completeness

7. **Responsive Behavior section in DESIGN.md.** All ten studied systems document this explicitly (breakpoints, touch-target minimums, collapse strategy) as a section beyond the eight canonical ones — the spec format explicitly allows custom sections. Our app already implements responsive behavior (`@container` breakpoints at 1380px/940px, 44px touch targets globally reset in `globals.css`) but it isn't written down anywhere. Add the section to `DESIGN.md`, and spot-check touch targets at 375px/768px widths to confirm the existing 44px minimum actually holds on every interactive element (some inline-styled buttons in `LoanCard`'s remove/hide controls and `RateChangeForm`/`BalloonPaymentForm`'s "+ Add" buttons use custom heights below 44px, e.g. `height: "29px"` — these need review).

8. **Weight-over-size hierarchy pass.** Figma and PostHog both flag over-reliance on size jumps for emphasis instead of weight. Audit dense areas — `.sched-table th`, `.stat .k`/`.stat .v` pairing, panel-title `.num` micro-labels — and confirm emphasis comes from a deliberate weight step (600/700/800) at a held size where that reads better than another size bump. This is a light touch-up pass, not a redesign.

## Out of scope

- Any change to the color palette, typeface choices, or the Bahi-khata metaphor itself.
- Real PF Marlet Display licensing (parked, per the original Fresh Khata spec's Open Items).
- The Dependabot Tailwind v4 upgrade and the 68 Supabase performance-advisor findings — unrelated, not touched here.

## Verification

Each stage: `npm run build` (type/lint check) + Playwright visual check (Day + Lamplight, desktop + mobile width) on affected routes, then commit. Stages run sequentially with a check after each before moving to the next.
