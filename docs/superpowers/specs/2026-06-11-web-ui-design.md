# Home Loan Prepayment Planner — Web UI (Phase 2) Design

**Date:** 2026-06-11
**Status:** Approved design, pre-implementation
**Builds on:** Phase 1 Excel + tested amortization core.

## Goal

A single-page web dashboard that does what the Excel does — model prepayments on
two floating-rate HDFC loans — but interactively: drag a slider, watch the loan
end years earlier and the interest saved update live.

## Deliverable

**One self-contained `index.html`** (all JS/CSS inlined via `vite-plugin-singlefile`),
double-clickable on Windows, works offline, no install/backend. Source is a normal
React+TypeScript+Vite project; the build emits the single file to `web/dist/`.

## Tech

- React 18 + TypeScript + Vite.
- Recharts for charts.
- Tailwind (or scoped CSS) for styling; polished financial-dashboard look (frontend-design).
- `vite-plugin-singlefile` to inline into one HTML.
- Vitest for engine tests.

## Engine

Port the verified Python core to `web/src/engine/amortization.ts`:
`monthlyEmi`, `buildSchedule(principal, ratePct, months, emi?, prepayments?)`,
`compare(baseline, plan)`. Same model: reducing-balance, monthly compounding,
EMI rounded UP, tenure-reduction (prepay shortens loan, EMI fixed).
Vitest tests mirror the Python tests and pin the same verified numbers:
- EMI: 30L→27,811; 50L→46,351.
- Baseline interest: 30L→20,05,772; payoff 180 months.
- 5L @ month 12 on 30L → interest saved 7,39,363; 44 months saved.
- Early prepay saves more than late; larger balance saves more; prepay capped at balance.

## Components

- `App` — holds state (two loans + prepayment plans + windfall), persists to localStorage,
  recomputes schedules on change.
- `LoanCard` (×2) — outstanding, rate, tenure, start date; EMI shown (auto).
- `PrepaymentControls` (per loan) — slider "extra ₹X at year Y" (max ₹15 lakh, typed entry
  allowed) + recurring "₹X every year" toggle. Each entry shows an HDFC rule badge.
- `RuleBadge` — validates one prepayment against HDFC rules; ✓ OK / ✗ reason.
- `SummaryCards` — interest saved, years+months saved, new payoff date, "prepay first" pick.
- `BalanceChart` — baseline vs plan balance curve per loan.
- `InterestChart` — baseline vs plan total interest.
- `WindfallSimulator` — lump sum + month → Loan A vs B interest/months saved + recommendation.
- `RulesPanel` — verified HDFC + RBI rules reference.
- `csv.ts` — "Download schedule as CSV" of the plan schedule(s).

## Data flow

All client-side. State → engine recomputes baseline + plan per loan → feeds cards/charts.
Defaults match the Excel: Loan A ₹30L, Loan B ₹50L, both 7.5%, 180 months, start Jan 2025.
localStorage persists user edits across reloads. A "Reset to defaults" control restores them.

## HDFC rules encoded (same as Phase 1, verified June 2026)

No prepayment penalty (RBI, floating, from 1 Jan 2026); once per calendar month;
min ₹5,000 or 1 EMI (higher); max ₹50L/month or 75% of year-opening principal (lower);
not in month 1.

## Out of scope (YAGNI)

Excel import/export (CSV download only), backend, auth, multi-bank rules, tax. Hosting
is optional later — the single file already works locally.

## Success criteria

- `npm run build` emits a single `index.html` that opens via file:// and is fully interactive.
- Vitest engine tests pass and match the Phase 1 verified numbers to the rupee.
- Dragging a prepayment slider updates cards + charts live; invalid prepayments flagged.
- Windfall simulator correctly recommends the loan a lump sum should target.
