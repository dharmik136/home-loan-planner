# 🏡 Home Loan Prepayment Planner & Ledger

[![CI Build & Test Check](https://github.com/dharmik136/home-loan-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/dharmik136/home-loan-planner/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A premium, interactive web application and live Excel workbook to simulate, optimize, and plan prepayments for floating-rate Indian home loans. Designed with a custom physical broadsheet editorial look and backed by a rigorous math core verifying 57 unit tests.

### 🌐 Live Application
You can access the live, fully interactive prepayment calculator dashboard here:
👉 **[dharmik136.github.io/home-loan-planner](https://dharmik136.github.io/home-loan-planner/)**

---

## ⚡ Key Features

*   **Multi-Loan Rollover (Avalanche vs. Snowball)**: Analyze combined repayments on multiple loans. Set strategies (Reduce Tenure vs. Reduce EMI) and dynamically roll savings from paid-off accounts into remaining balances.
*   **Indian Bank Rules Engine (SBI, HDFC, ICICI, LIC, Axis)**: Verifies that custom prepayments conform to exact lender rules (minimum transaction sizes, payment frequencies, daily transaction caps, and the RBI zero-penalty floating loan mandate).
*   **Sec 24b / 80C Tax Savings Deductor**: Computes net yearly income tax savings under the Old Tax Regime (Sec 24b ₹2L cap, Sec 80C ₹1.5L principal cap, standard deductions, surcharge tiers, 4% Cess) with active counterfactual warnings for the New Tax Regime.
*   **Principal Moratorium Option (Sec 8)**: Pause payments at specific intervals using **Interest-Only Payment** or **Full EMI Holiday** modes. Accrues and compounds interest with dynamic tenure extension warnings.
*   **Balloon Payment Calculator (Sec 9)**: Schedule structured larger payments at specific yearly milestones (e.g. vesting ESOPs, annual bonuses) to collapse outstanding balances.
*   **Daily Reducing Balance (SBI MaxGain-Style)**: Computes interest daily based on actual calendar month days (31/30/28) instead of static monthly divisions.
*   **Windfall Allocator**: Automatically calculates the mathematically optimal way to split a bonus or lump sum between two loans to maximize overall lifetime interest savings.
*   **Front-Loaded Interest Shock Visualizer**: Graphs how interest is front-loaded in early tenures and measures interest shock sensitivity to rate hikes.

---

## 📂 Repository Layout

*   `index.html` — The compiled, self-contained single-file production build of the React web app. Serves directly to GitHub Pages.
*   `Home-Loan-Prepayment-Planner.xlsx` — The live Excel workbook counterpart with in-built formula calculations.
*   `web/` — The React & Vite web application source code.
    *   `web/src/engine/` — Pure calculation engines (amortization, tax, rollover, formatters).
    *   `web/src/components/` — Broadsheets theme React components (Moratorium, Tax panel, Windfall, Charts).
    *   `web/e2e-trust-flows.e2e.ts` — Playwright browser E2E test suite.
    *   `web/src/engine/math_trust.test.ts` — Vitest unit tests verifying mathematical correctness.
*   `docs/` — Architecture design specifications, product proposals, and compliance status reports.

---

## 🛠️ Local Development

### 1. Excel Core & Python Workbook Generator
Requires Python 3.10+ and standard dependencies:
```bash
pip install -r requirements.txt
python src/build_workbook.py        # Rebuild the .xlsx spreadsheet
python src/verify_workbook.py       # Recalculate workbook formulas and cross-verify with engine
```

### 2. React Web Dashboard
To run, edit, or test the React web client:
```bash
cd web
npm install

# Start local dev server (default: http://localhost:5173)
npm run dev      

# Run all 57 Vitest unit tests (engine, tax slabs, rollover strategies)
npm test         

# Run Playwright E2E browser tests (responsiveness, inputs, PDF modal)
npx playwright test

# Build production app (inlines CSS/JS into web/dist/index.html and copies to root index.html)
npm run build    
```

### 3. Root Script Shortcuts
For convenience, you can manage both development and test suites from the root directory using:
```bash
npm run web:install    # Install web dashboard dependencies
npm run web:dev        # Start local development server
npm run web:build      # Compile production single-file bundle
npm run web:test       # Run Vitest test suite
npm run web:e2e        # Run Playwright E2E browser tests
npm run next:install   # Install Next.js template dependencies
npm run next:dev       # Start Next.js development server
npm run next:build     # Build Next.js static pages
```

---

## 📜 License

Distributed under the **GNU General Public License v3**. See [LICENSE](LICENSE) for details.
