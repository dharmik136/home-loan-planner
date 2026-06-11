# Home Loan Prepayment Planner — Design

**Date:** 2026-06-11
**Owner:** Dharmik Shingala
**Status:** Approved design, pre-implementation

## Goal

Model two floating-rate HDFC home loans and answer one core question precisely:
**"If I pay extra in the early years, how many years and how much interest do I save?"**
The tool must respect HDFC's real prepayment rules and recommend which loan to prepay first.

## The two loans (parameters, not hard-coded)

| Loan | Amount | Rate | Tenure | Type |
|---|---|---|---|---|
| Loan A | ₹30,00,000 | 7.5% (was 7.25%) | 15 yr (180 mo) | Floating |
| Loan B | ₹50,00,000 | 7.5% (was 7.25%) | 15 yr (180 mo) | Floating |

Illustrative EMIs at full principal over 15 yr @ 7.5%: Loan A ≈ ₹27,815/mo, Loan B ≈ ₹46,358/mo. Actual EMI / outstanding / start date are user-entered inputs and may differ.

## Verified HDFC + RBI rules (June 2026) — encoded into the model

- **RBI, effective Jan 1, 2026:** zero prepayment/foreclosure charge on floating-rate loans to individuals (non-business), regardless of amount, source of funds, or part vs full. Both loans qualify → **no penalty.**
- **Frequency:** part payment once per calendar month (up to 12×/year).
- **Minimum part payment:** ₹5,000 or 1 EMI, whichever is higher.
- **Maximum part payment:** ₹50 lakh/month or 75% of year-opening principal, whichever is lower.
- **Timing:** allowed only after 1 month of EMI commencement.
- **Source:** from the repayment-tagged bank account (or branch visit).

Sources: HDFC FAQ (homeloans.hdfc.bank.in/checklist/faqs), HDFC prepayment page, RBI 2026 directive (Angel One / Lexology summaries).

## Core modeling decisions

1. **Prepayment effect = tenure reduction** (keep EMI constant, shorten the loan). This minimizes total interest. EMI-reduction is a secondary toggle for comparison, not the default.
2. **Amortization basis:** standard reducing-balance, monthly compounding. EMI = P·r·(1+r)^n / ((1+r)^n − 1), r = annual/12.
3. **Prepayment applied** to closing principal in the month it is made, before next month's interest accrues.
4. **Which loan first:** at equal rates, recommend the loan that yields the greater total-interest reduction per ₹1 prepaid (driven by larger outstanding × longer remaining tenure). The Strategy view computes this, so it stays correct if rates diverge later.

## Phase 1 — Excel workbook (source of truth)

Single `.xlsx`, tabs:

1. **Inputs** — per loan: outstanding principal, annual rate, original tenure, EMI start date, current EMI (auto-calc if blank). Global toggle: tenure-reduction vs EMI-reduction.
2. **Schedule_A** / **Schedule_B** — 180-row month-by-month amortization: month #, date, opening balance, EMI, interest, principal, prepayment, closing balance. Recomputes payoff when prepayments shorten tenure.
3. **Prepayment Plan** — user enters planned extra payments (month/date, amount, target loan). Each row validated against HDFC rules; invalid rows flagged (below min / above max / >1 per calendar month / before month 2).
4. **Windfall Simulator** — enter a one-time lump sum and a target month; outputs interest saved and months saved for that lump sum, and a per-loan comparison so the user sees where the windfall saves most.
5. **Summary / What-if** — baseline vs with-prepayment, per loan and combined: total interest, months saved, new payoff date, **total ₹ interest saved**. The headline answer.
6. **HDFC Rules** — the rules table above, in-sheet, so validation logic is transparent and auditable.

Implementation note: formula-driven where practical; a small generator script (Python + openpyxl) builds the workbook so the schedule logic is testable and regenerable, rather than hand-entered formulas that can silently break.

## Phase 2 — Web UI (later, separate spec)

Reads the same amortization logic. Sliders for "extra ₹X in year Y," live charts (balance curve, interest-saved, payoff date), two-loan comparison, windfall simulator, and the same HDFC rule validation. Imports/exports the Phase 1 Excel. Not built in Phase 1; scoped in its own spec when Phase 1 is validated.

## Out of scope (YAGNI)

- Fixed-rate loan penalty logic (both loans are floating).
- Tax (Section 24/80C) optimization — can be a later add-on.
- Multi-bank rule libraries beyond HDFC — add only if a second bank's loan appears.
- Live rate fetching — rates are user-entered.

## Success criteria

- Given the two loans + a prepayment plan, the workbook reports correct total interest, months saved, and payoff date, matching an independent amortization check to the rupee.
- Any prepayment violating an HDFC rule is flagged with the specific rule.
- The Windfall Simulator correctly identifies which loan a one-time lump sum should target.
