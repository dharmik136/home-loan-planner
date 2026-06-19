# Home Loan Prepayment Planner — Session State / Handoff

**Last updated:** 2026-06-19
**Resume this exact conversation:** `claude --resume 32c3cbb7-0208-48f2-84ba-61401fe15043` (run from `C:\Users\Dharmik Shingala`)
**Or double-click:** `Downloads\Start-HomeLoan.cmd`

> This file is the durable memory of the project. If the chat transcript is ever lost,
> a fresh Claude session can read THIS file and continue without missing context.

---

## What this project is

A planning tool for Dharmik's two HDFC floating-rate home loans that answers:
**"If I prepay extra in the early years, how many years and how much interest do I save,
and which loan should I attack first?"** Plus a windfall (lump-sum) A-vs-B simulator and
the full month-by-month schedule. Respects HDFC's real prepayment rules.

Three artifacts, one shared amortization engine (tenure-reduction, reducing-balance,
EMI rounded UP like banks do):
1. **Excel** — `Home-Loan-Prepayment-Planner.xlsx` (live formulas, openpyxl-generated)
2. **Web app** — single-file `web/dist/index.html` ("The Prepayment Ledger")
3. **Tested cores** — Python (`src/amortization.py`) + TypeScript (`web/src/engine/amortization.ts`)

## Status: both phases SHIPPED ✅

- Phase 1 (Excel) and Phase 2 (web app) complete and verified to the rupee.
- Web app deployed: **https://dharmik136.github.io/home-loan-planner/** (public, GENERIC defaults — no personal data).
- Month-by-month schedule table added to the web app (2026-06-19).
- GitHub account migrated shingaladharmikmotadata → **dharmik136** (2026-06-16); Pages URL is under dharmik136.

## The loans

### Loan A — REAL (from HDFC provisional statement, a/c 704937787)
- **Sanctioned ₹35,00,000 @ 7.25%** variable, **180 months (15 yr)**
- Under-construction flat (Serene Sparkles, Floor-10, South Bopal, Ahmedabad)
- **Pre-EMI interest ₹17,877** (one-time, construction period — a SUNK cost; does NOT change any prepayment saving)
- **Full EMI starts July 2026**, EMI = **₹31,951/month**
- Baseline total interest **₹22,50,921** (₹22,68,798 incl. pre-EMI)

### Loan B — PLACEHOLDER (NOT yet confirmed) ⏳
- Currently modeled as ₹50,00,000 @ 7.5%, 180 months, EMI ₹46,351 — these are GUESSES.
- **NEXT STEP: get Loan B's HDFC provisional statement** and set its real amount/rate/tenure/pre-EMI,
  exactly as was done for Loan A. (User's casual figures proved inaccurate — the statement is ground truth.)

## Verified numbers (engine = Excel = web, to the rupee)
- Loan A EMI ₹31,951; baseline interest ₹22,50,921; payoff 180 months.
- Loan B (placeholder) EMI ₹46,351.
- Example: ₹5L prepaid in year 1 on a 30L/7.5% loan saved ₹7,39,363 + 44 months (illustrative; pre-correction).

## File map
| Path | What |
|---|---|
| `Home-Loan-Prepayment-Planner.xlsx` | Live Excel workbook |
| `src/amortization.py` | Tested Python amortization core |
| `src/build_workbook.py` | Generates the Excel (loan defaults live here) |
| `src/verify_workbook.py` | Recalculates the Excel with `formulas` lib, checks vs core |
| `tests/test_amortization.py` | Python engine tests (10) |
| `web/src/engine/amortization.ts` | TS port of the core |
| `web/src/engine/{planning,rules,format,csv}.ts` | Plan aggregation, HDFC rules, formatting, CSV export |
| `web/src/App.tsx` | App shell + state + localStorage (loan DEFAULTS live here) |
| `web/src/components/*` | LoanCard, PrepaymentControls, SummaryCards, BalanceChart, ScheduleTable, WindfallSimulator, RulesPanel |
| `web/src/*.test.tsx` | 15 tests (engine + jsdom smoke) |
| `web/dist/index.html` | Built single-file app |
| `docs/superpowers/specs/*` | Design specs (Phase 1 + Phase 2) |
| `docs/conversation-archive/` | Raw transcript archive of the build conversation |

## Run / build / test / deploy
```
# Python / Excel
python -m pytest tests/ -q
python src/build_workbook.py        # regenerate xlsx (CLOSE Excel first — it locks the file!)
python src/verify_workbook.py       # recalc + verify

# Web
cd web && npm install
npm test                            # 15 tests
npm run build                       # -> web/dist/index.html (single file)
npm run dev                         # local dev server

# Deploy (public, generic defaults only)
# Pages repo: dharmik136/home-loan-planner. Rebuild a GENERIC-defaults version before pushing
# (current App.tsx defaults carry Loan A's real figures — do NOT publish those).
```

## Key decisions & conventions
- **EMI rounded UP** to whole rupee (banks do this; closes loan within tenure).
- **Tenure-reduction** model (prepay shortens loan, EMI fixed) — maximizes interest saved.
- **Privacy:** the public URL keeps GENERIC placeholder defaults; real numbers live only in the local
  Excel and the user's browser (localStorage). Don't bake real figures into the public deploy.
- **HDFC rules encoded:** no prepayment penalty on floating loans (RBI ban from 1 Jan 2026); once/month;
  min ₹5,000 or 1 EMI; max ₹50L/month or 75% of year-opening principal; not in month 1.
- **Audit-first / honest verification:** caught real bugs (EMI rounding residual, plan-column O-vs-P
  off-by-one, Summary row off-by-one) by recalculating, not assuming.
- The full project repo is **local git only** (private; contains real figures). The Pages repo is separate.

## Open / next steps
1. **Get Loan B's HDFC statement** → set real Loan B figures (Excel + web defaults + verifier + smoke test).
2. (Optional) Show the ₹17,877 pre-EMI in the WEB app too (currently only in the Excel).
3. (Optional) Push the full project to a PRIVATE GitHub repo for off-machine backup.
4. (Optional) Custom domain for the public URL.
