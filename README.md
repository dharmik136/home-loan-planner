# Home Loan Prepayment Planner

A live Excel tool to plan prepayments on two floating-rate HDFC home loans
(₹30L + ₹50L, 7.5%, 15-year), built on a tested amortization engine.

**Open `Home-Loan-Prepayment-Planner.xlsx`** and start on the README tab.

## What it answers
- If I prepay extra in the early years, how many years and how much interest do I save?
- I have a one-time lump sum — which loan should it go on?
- Does my planned prepayment break any HDFC rule?

## Layout
- `Home-Loan-Prepayment-Planner.xlsx` — the live workbook (edit yellow cells; results recalc).
- `src/amortization.py` — tested reducing-balance amortization core (tenure-reduction model).
- `src/build_workbook.py` — regenerates the workbook from the core's logic.
- `src/verify_workbook.py` — recalculates the workbook with the `formulas` engine and
  checks every key figure against the tested core (catches formula bugs).
- `tests/` — unit tests for the amortization core.
- `docs/superpowers/specs/` — the design spec.

## Regenerate / verify
```
pip install openpyxl formulas pytest
python -m pytest tests/ -q          # test the math core
python src/build_workbook.py        # rebuild the .xlsx
python src/verify_workbook.py       # recalc the .xlsx and verify vs core
```

## HDFC + RBI prepayment rules encoded (verified June 2026)
- Floating-rate loans: **no prepayment penalty** (RBI ban from 1 Jan 2026).
- Once per calendar month; min ₹5,000 or 1 EMI (higher); max ₹50L/month or 75% of
  year-opening principal (lower); not in month 1.

## Web UI (Phase 2 — built)
An interactive single-page dashboard ("The Prepayment Ledger") on the same engine:
sliders, live balance charts, windfall A-vs-B simulator, HDFC rule badges, CSV export.

**To use it:** double-click **`web/dist/index.html`** — it opens in your browser, works
offline, and saves your numbers in the browser. (Internet only makes the fonts prettier.)

**To develop it:**
```
cd web
npm install
npm run dev      # live dev server
npm test         # 14 tests: engine (matches Excel to the rupee) + UI smoke tests
npm run build    # regenerates the single-file web/dist/index.html
```
The web amortization engine (`web/src/engine/amortization.ts`) is a port of the Python
core and is tested against the same verified numbers.
