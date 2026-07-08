# Home Loan Prepayment Planner — Session State / Handoff

**Last updated:** 2026-07-08
**Conversation ID:** `41815175-e1e6-4da9-be7b-567ac9a534c3`

> This file is the durable memory of the project. If the chat transcript is ever lost,
> a fresh coding agent session can read THIS file and continue without losing context.

---

## What this project is

A planning tool for HDFC and generic floating-rate home loans that answers:
**"If I prepay extra in the early years, how many years and how much interest do I save,
and which loan should I attack first?"** It includes a windfall (lump-sum) allocator, milestone tracker, and the full month-by-month schedule.

The web application has been fully generalized from a hardcoded 2-loan interface into a flexible, dynamic Multi-Loan Prepayment Planner that support any number of loans, customizable rulesets, dynamic strategies, and simulated rate changes.

Three artifacts, one shared amortization engine (tenure-reduction, reducing-balance, EMI rounded UP like banks do):
1. **Excel** — `Home-Loan-Prepayment-Planner.xlsx` (live formulas, openpyxl-generated)
2. **Web app** — single-file `web/dist/index.html` ("The Prepayment Ledger")
3. **Tested cores** — Python (`src/amortization.py`) + TypeScript (`web/src/engine/amortization.ts`)

---

## Status: All Phases SHIPPED ✅

- **Phase 1 (Excel)**: Complete and formula-verified.
- **Phase 2 (Basic Web App)**: Complete and verified.
- **Phase 3 (Generalization & Advanced Features)**: Complete, tested, and validated in a real browser.
  - Multi-loan support (add, remove, rename any number of loans).
  - Dynamic prepayment strategies (Reduce Tenure vs. Reduce EMI).
  - Lender rules configurator (HDFC, RBI floating, custom limits, or none).
  - Floating Rate Simulator (schedule interest rate changes at specific months).
  - Smart Windfall Allocator (suggests mathematically optimal split of a lump sum windfall).
  - Debt Milestones Timeline (Principal-vs-Interest crossover, 50% paid, early payoff boost).
  - Pre-EMI construction phase interest support.
  - Prepayment Presets (13th EMI and Step-up EMI % yearly increase).
  - Custom `NumericInput` resolving backspace zero-state usability issues.
  - Playwright browser E2E test suite.

---

## Verified Numbers (Web vs Excel, to the Rupee)
- Standard loan values (e.g. ₹30L / 7.5% / 180 months) match the companion Excel workbook.
- Default Loan A (₹35L @ 7.25% / 180 months) EMI = ₹31,951.
- Default Loan B (₹50L @ 7.5% / 180 months) EMI = ₹46,351.

---

## File Map

| Path | What |
|---|---|
| `Home-Loan-Prepayment-Planner.xlsx` | Live Excel workbook |
| `src/amortization.py` | Tested Python amortization core |
| `src/build_workbook.py` | Generates the Excel (loan defaults live here) |
| `src/verify_workbook.py` | Recalculates the Excel with `formulas` lib, checks vs core |
| `tests/test_amortization.py` | Python engine tests (10) |
| `web/src/engine/amortization.ts` | TS port of the core (updated for strategy & rate changes) |
| `web/src/engine/{planning,rules,format,csv}.ts` | Plan aggregation, rules validation, formatting, CSV export |
| `web/src/App.tsx` | App shell + state + localStorage + migration |
| `web/src/components/*` | LoanCard, PrepaymentControls, SummaryCards, BalanceChart, ScheduleTable, WindfallSimulator, RulesPanel, DebtMilestones |
| `web/src/App.smoke.test.tsx` | 20 Vitest smoke/unit tests |
| `web/e2e-check.e2e.ts` | Playwright E2E browser test spec |
| `web/playwright.config.ts` | Playwright test runner configuration |
| `web/dist/index.html` | Built single-file app |

---

## Run / Build / Test

```bash
# Python / Excel Amortization
python -m pytest tests/ -q          # test the math core
python src/build_workbook.py        # rebuild the .xlsx (CLOSE Excel first!)
python src/verify_workbook.py       # recalc the .xlsx and verify vs core

# Web UI Development & Tests
cd web
npm install                         # install packages
npm run dev                         # local dev server
npm test                            # run 20 Vitest unit/smoke tests
npm run build                       # compile production bundled index.html
npx playwright test                 # run Playwright E2E browser tests
```

---

## Key Decisions & Conventions
- **EMI rounded UP** to whole rupee (banks do this; closes loan within tenure).
- **ESM Suffix Compatibility**: Playwright E2E test file is named `.e2e.ts` (with custom config `testMatch`) to prevent Vitest from picking it up as a unit test, ensuring compatibility with Vite ESM modules.
- **Dynamic Limits**: Slider caps for prepayments and windfalls scale automatically based onoutstanding balances to fit high-value loan scenarios.
- **Aggregated Analytics**: The prioritized loan recommendations sort by interest rate (descending) and outstanding balance (descending).

---

## Open / Next Steps
1. Push the updated multi-loan dynamic app to the public pages repo for online hosting.
2. (Optional) Generalize `src/build_workbook.py` to support generating worksheets for an arbitrary list of configured loans (matching the web app).
3. (Optional) Set up a custom domain for the public deploy.
