# The Prepayment Ledger: MVP Verdict & Redefined Scope

---

## 1. Executive Summary & Verdict

**MVP Rating:** 7/10 as a product idea. 5.5/10 as an MVP.

The core wedge is valid: **portfolio-level, rule-aware, windfall-optimized debt payoff planning**. That is meaningfully better than a generic EMI calculator.

However, the initial proposal was over-scoped. It included a B2B advisor portal, white-label reports, refinancing lead networks, user accounts/auth, saved portfolios, and a full lender-rule database. This is closer to a **v1 commercial product roadmap** than a Minimum Viable Product.

To validate the product-market fit with minimum engineering effort, the MVP will focus strictly on the core problem: **prepayment decision intelligence** for B2C borrowers.

---

## 2. Key Validation Issues & Course Corrections

### 2.1 Indian Lender Rule Simplification
- **The Issue**: RBI directions prohibit regulated entities from levying prepayment charges on floating-rate loans granted to individuals for non-business purposes. For individual home-loan borrowers, prepayment penalty rules are largely irrelevant.
- **Correction**: Do not build a massive, bank-specific rule database. Keep rule configurations simple, letting users toggle manual overrides (fixed penalty %, max limits, and minimum prepayments).

### 2.2 B2B Scope Deferred
- **The Issue**: B2B advisors (CAs, planners) require full wealth-management systems, CRM, and compliance tools. A debt-only calculator is insufficient as a standalone B2B subscription.
- **Correction**: Exclude B2B features (advisor dashboards, white-labeling, subscription billing) from the MVP. Treat B2B as a **validation lane** by manually onboarding 5–10 advisors and sending them sample PDFs, rather than building advisor portals.

### 2.3 Pricing Strategy Adjustment
- **The Issue**: A ₹999 lifetime unlock is unvalidated. Users might view the optimal split and manually copy it without paying.
- **Correction**: Test pricing intent through A/B models (₹299, ₹499, ₹999) and gate the detailed month-by-month schedule and PDF reports behind the paywall.

---

## 3. Trimmed MVP Feature Scope

The MVP is reduced to **4 core modules**:

```
+--------------------------------------------------------------+
|                        THE MVP SCOPE                         |
+--------------------------------------------------------------+
|                                                              |
| 1. Manual Loan Entry                                         |
|    - Name, outstanding balance, interest rate, EMI, tenure.  |
|                                                              |
| 2. Baseline Amortization Engine                             |
|    - Current payoff date, total interest, schedule view.     |
|                                                              |
| 3. Payoff Optimization (Rollover & Windfall)                |
|    - Avalanche vs. Snowball extra monthly budget.            |
|    - Optimizer split recommendation for windfalls.           |
|                                                              |
| 4. Before/After Visual proof                                 |
|    - Simple summary cards and SVG stacked area chart.        |
|                                                              |
+--------------------------------------------------------------+
```

### 3.1 MVP Exclusions (Strict)
- **NO** B2B advisor portal or white-label tools.
- **NO** Refinancing lead generation.
- **NO** User accounts, database auth, or saved profiles.
- **NO** Bank account integration or real-time sync.
- **NO** Mobile application.

---

## 4. MVP Success Criteria

We will proceed beyond the MVP stage only after meeting the following metrics:
* **Activation**: 30%+ of users complete manual loan entry, and 20%+ run a windfall simulation.
* **Intent**: 10%+ of users click the PDF export or paywall trigger.
* **Conversion**: 2% to 5% paid conversion rate at a test price of ₹499.
* **B2B Validation**: At least 5 independent advisors request repeated manual client reports.

---

## 5. MVP Recommended Positioning

- **Core Headline**: *“Before you prepay your loan, know exactly where every rupee should go.”*
- **Description**: *“Find the best way to use your bonus, surplus income, and prepayments to close loans faster and save maximum interest.”*
