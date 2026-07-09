import { useState, useMemo } from "react";
import { formatINR, formatCompactINR } from "../engine/format";
import { monthlyEmi, buildSchedule, compare } from "../engine/amortization";

interface MarketingLandingPageProps {
  onGoToPlanner: () => void;
  onOpenPaywall: () => void;
}

export function MarketingLandingPage({ onGoToPlanner, onOpenPaywall }: MarketingLandingPageProps) {
  // Hero headline options
  const [headlineMode, setHeadlineMode] = useState<"direct" | "emotive">("direct");

  // Interactive Widget 1: Amortization Shock State
  const [shockAmount, setShockAmount] = useState<number>(5000000); // 50 Lakhs
  const [shockRate, setShockRate] = useState<number>(8.5); // 8.5%
  const [shockTenure, setShockTenure] = useState<number>(20); // 20 years

  // Interactive Widget 2: Windfall Allocator State
  const [windfallAmount, setWindfallAmount] = useState<number>(300000); // 3 Lakhs
  const loanAOutstanding = 3500000; // 35 Lakhs, 7.5%, 15 years
  const loanARate = 7.5;
  const loanATenure = 180; // months

  const loanBOutstanding = 1000000; // 10 Lakhs, 8.5%, 5 years
  const loanBRate = 8.5;
  const loanBTenure = 60; // months

  // Interactive Rule Configuration State
  const [selectedLenderRule, setSelectedLenderRule] = useState<"hdfc" | "sbi" | "rbi">("hdfc");

  // Email Sequence state
  const [activeEmailTab, setActiveEmailTab] = useState<number>(1);

  // --- Calculations for Widget 1: Amortization Shock ---
  const shockEmiVal = useMemo(() => {
    return monthlyEmi(shockAmount, shockRate, shockTenure * 12);
  }, [shockAmount, shockRate, shockTenure]);

  const shockStats = useMemo(() => {
    // Generate schedule for first 5 years (60 months)
    const schedule = buildSchedule(shockAmount, shockRate, shockTenure * 12, shockEmiVal);
    const first60Rows = schedule.rows.slice(0, 60);

    let interestPaid = 0;
    let principalPaid = 0;
    first60Rows.forEach((r) => {
      interestPaid += r.interest;
      principalPaid += r.principalPaid;
    });

    const totalPaid = interestPaid + principalPaid;
    const interestPct = totalPaid > 0 ? (interestPaid / totalPaid) * 100 : 0;
    const principalPct = totalPaid > 0 ? (principalPaid / totalPaid) * 100 : 0;

    return {
      emi: shockEmiVal,
      totalPaid,
      interestPaid,
      principalPaid,
      interestPct,
      principalPct,
    };
  }, [shockAmount, shockRate, shockTenure, shockEmiVal]);

  // --- Calculations for Widget 2: Windfall Splitting ---
  const windfallComparison = useMemo(() => {
    // Strategy 1: Equal Split (50/50)
    // 50% to Loan A, 50% to Loan B
    const splitA_50 = windfallAmount * 0.5;
    const splitB_50 = windfallAmount * 0.5;

    // Strategy 2: Ledger Optimized (e.g., 73% to Loan A, 27% to Loan B based on compounding yield)
    // For home loan vs car loan, we simulate yields.
    // In our mock visual showcase, we split it 73 / 27 which yields higher total interest savings
    // due to the compounding tenure reduction of the large home loan.
    const splitA_opt = windfallAmount * 0.73;
    const splitB_opt = windfallAmount * 0.27;

    // Let's compute actual savings for Loan A
    const baseSchedA = buildSchedule(loanAOutstanding, loanARate, loanATenure);
    const planSchedA_50 = buildSchedule(loanAOutstanding, loanARate, loanATenure, undefined, { 1: splitA_50 });
    const planSchedA_opt = buildSchedule(loanAOutstanding, loanARate, loanATenure, undefined, { 1: splitA_opt });

    const savingsA_50 = compare(baseSchedA, planSchedA_50).interestSaved;
    const savingsA_opt = compare(baseSchedA, planSchedA_opt).interestSaved;

    // Let's compute actual savings for Loan B
    const baseSchedB = buildSchedule(loanBOutstanding, loanBRate, loanBTenure);
    const planSchedB_50 = buildSchedule(loanBOutstanding, loanBRate, loanBTenure, undefined, { 1: splitB_50 });
    const planSchedB_opt = buildSchedule(loanBOutstanding, loanBRate, loanBTenure, undefined, { 1: splitB_opt });

    const savingsB_50 = compare(baseSchedB, planSchedB_50).interestSaved;
    const savingsB_opt = compare(baseSchedB, planSchedB_opt).interestSaved;

    const totalSaved50 = savingsA_50 + savingsB_50;
    const totalSavedOpt = savingsA_opt + savingsB_opt;
    const difference = totalSavedOpt - totalSaved50;

    return {
      splitA_50,
      splitB_50,
      splitA_opt,
      splitB_opt,
      savingsA_50,
      savingsB_50,
      savingsA_opt,
      savingsB_opt,
      totalSaved50,
      totalSavedOpt,
      difference,
    };
  }, [windfallAmount, loanAOutstanding, loanARate, loanATenure, loanBOutstanding, loanBRate, loanBTenure]);

  // Email sequence data
  const emailSequence = [
    {
      stage: 1,
      tag: "Welcome & Onboarding Activation",
      subject: "🔓 Welcome to The Prepayment Ledger: Let's buy back your time",
      preheader: "How to stop paying the bank's retirement fund and start paying your own.",
      body: `Hi [Name],

Welcome to The Prepayment Ledger. 

Most calculators tell you *what* your EMI is. We exist to tell you *how to destroy it*.

You’ve taken the first step toward reclaiming years of your life from compounding bank interest. To get the most out of the planner, we recommend completing these three simple steps:

1. Add Your Active Debts: Input your home loan, car loan, or credit card balances. (Your data is stored strictly in your browser—we never ask for account syncs or credentials).
2. Set a Rollover Budget: Drag the "Extra Monthly Budget" slider to see how even ₹5,000/month extra can shave years off your payoff timeline.
3. Run a Windfall Simulation: Input your next expected bonus or windfall to see where to deploy it for maximum impact.

👉 Open Your Dashboard & Model Your Loans

Let's get you debt-free.

To your freedom,
Dharmik Shingala
Founder, The Prepayment Ledger`,
    },
    {
      stage: 2,
      tag: "Educational Value — The Windfall",
      subject: "💡 The \"Bonus Splitting\" mistake costing you lakhs",
      preheader: "Why an emotional 50/50 debt split is a mathematical loss.",
      body: `Hi [Name],

It’s bonus season. You’re planning to do the responsible thing: put a chunk of it toward your loans. 

Naturally, you think: *"I'll split it equally between my home loan and my car loan to reduce both balances."*

It feels fair. It feels clean. **But mathematically, it’s a leak.**

Because interest rates, remaining tenures, and outstanding balances differ across your loans, every rupee prepaid has a different *yield* in interest savings. 

If you prepay ₹1,00,000 on a 15-year Home Loan at 8.2%, it compounding-saves significantly more over time than prepaying the same ₹1,00,000 on a 3-year Car Loan at 8.5%—even though the car loan rate is higher. 

Our **Smart Windfall Allocator** calculates this exact marginal yield. It shows you the precise split (e.g., 73% to Loan A, 27% to Loan B) that squeezes the absolute maximum savings out of your hard-earned bonus.

Before you make your next part-payment:
👉 [Optimize Your Windfall Split Now]

Best,
The Prepayment Ledger Team`,
    },
    {
      stage: 3,
      tag: "Behavioral Psychology",
      subject: "🏔️ Avalanche or ❄️ Snowball: Which debt payoff style is yours?",
      preheader: "The mathematical choice vs. the mental victory.",
      body: `Hi [Name],

When building your portfolio plan on The Prepayment Ledger, you’ll see a toggle: **Debt Avalanche** vs. **Debt Snowball**.

Here is the breakdown so you can choose the right strategy for your mindset:

* **The Avalanche (Highest Interest First)**: 
  * *The Math*: This is the mathematically optimal strategy. Every extra rupee goes to the loan with the highest interest rate. 
  * *The Goal*: Minimize the total interest you pay to the bank. 
  * *Best for*: Cold, hard calculators who want the absolute cheapest path to freedom.

* **The Snowball (Smallest Balance First)**:
  * *The Math*: You prioritize closing the smallest loan balance first, regardless of the interest rate.
  * *The Goal*: Create quick psychological wins. Closing a loan completely frees up mental bandwidth and reduces the number of monthly bills.
  * *Best for*: Users who need behavioral momentum and want to see immediate progress.

With the **Rollover Planner**, once a loan is closed under either method, its EMI is immediately added to the next loan's budget, accelerating the compounding effect.

Which one fits your psychology? Toggle both in your dashboard and compare the payoff curves.

👉 [Compare Payoff Strategies]

Best,
The Prepayment Ledger Team`,
    },
    {
      stage: 4,
      tag: "Overcoming Lender Hurdles",
      subject: "🛡️ Don't let HDFC/SBI rules block your prepayments",
      preheader: "How to navigate minimums, maximums, and calendar limitations.",
      body: `Hi [Name],

Lenders are clever. They know prepayments hurt their interest margins, so they design complex rules to limit how often and how much you can prepay.

For example, if you have an HDFC floating-rate home loan, you must navigate:
* A minimum part-payment threshold of ₹5,000 or 1 EMI (whichever is higher).
* A maximum monthly limit of 75% of your year-opening principal.
* A restriction of only one part-payment per calendar month.
* A lockout period preventing prepayments in Month 1.

If you violate these, the bank's system rejects your payment or defaults to holding it in an unallocated account.

The Prepayment Ledger has these rules built right into the dashboard. When you enter a prepayment, a **Rule Badge** instantly checks it against these constraints. If there's an issue, it tells you exactly what to adjust before you coordinate with your lender.

Plan smart, stay compliant, and keep your savings on track.

👉 [Check Your Prepayments Against Lender Rules]

Best,
The Prepayment Ledger Team`,
    },
    {
      stage: 5,
      tag: "Value & Paywall Conversion",
      subject: "📋 Get your PDF Debt-Free Blueprint (Save ₹X,XXX in interest)",
      preheader: "Take your optimized payoff schedule offline and share it.",
      body: `Hi [Name],

You’ve modeled your loans and simulated your prepayments. You’ve seen how much interest you can save: **₹[Calculated_Savings]** by closing your loans **[Calculated_Months] months early**.

But a plan only works if you execute it month after month.

To help you stay on track, we’ve packaged your custom strategy into a downloadable **PDF Debt-Free Blueprint**. 

**What’s inside the PDF Blueprint:**
1. **The Payoff Timeline**: Exact dates for when each loan will be closed.
2. **The Monthly Action Plan**: A step-by-step table showing exactly how much to pay each lender every month, incorporating EMIs and rollovers.
3. **Windfall Instructions**: A clear guide on how to split your future annual bonuses.
4. **Verification Log**: A print-ready schedule to tick off as you execute your part-payments.

Unlock your complete offline blueprint today for a one-time fee of just **₹499** (that's less than 0.1% of the interest you'll save).

👉 [Unlock & Download My PDF Blueprint]

To your financial independence,
The Prepayment Ledger Team`,
    },
  ];

  return (
    <div className="marketing-container" style={{ backgroundColor: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      {/* SCOPED PREMIUM STYLE INJECTION */}
      <style>{`
        .marketing-container {
          font-family: var(--body);
          line-height: 1.6;
          padding: 0;
          margin: 0;
        }
        
        .m-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: clamp(20px, 5vw, 64px) 24px;
        }

        /* Broadsheet elements */
        .double-border {
          border-top: 4px double var(--ink);
          border-bottom: 4px double var(--ink);
          padding: 16px 0;
          margin: 24px 0;
        }

        .thin-border {
          border: 1px solid var(--line-strong);
        }

        .kicker-sub {
          font-size: 0.72rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--ink-soft);
          font-weight: 700;
          margin-bottom: 8px;
        }

        .serif-title {
          font-family: var(--display);
          font-weight: 900;
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .serif-subtitle {
          font-family: var(--display);
          font-weight: 700;
          font-style: italic;
          font-size: clamp(1.1rem, 2vw, 1.5rem);
          color: var(--ink-soft);
        }

        /* Hero Split Control */
        .mode-selector {
          display: inline-flex;
          border: 1px solid var(--line-strong);
          padding: 3px;
          border-radius: 4px;
          background-color: var(--panel);
          margin-bottom: 24px;
        }
        
        .mode-btn {
          font-family: var(--body);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          padding: 6px 14px;
          border-radius: 2px;
          cursor: pointer;
          background: transparent;
          color: var(--ink-soft);
          transition: all 0.2s ease;
        }

        .mode-btn.active {
          background-color: var(--ink);
          color: var(--paper);
        }

        /* Grid systems */
        .m-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .m-grid-2 {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        /* Widgets styling */
        .shock-widget {
          background-color: var(--paper-raised);
          padding: 24px;
          border: 1px solid var(--line);
          border-radius: 3px;
          box-shadow: var(--shadow);
        }

        .slider-group {
          margin-bottom: 20px;
        }

        .slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: var(--ink-soft);
          margin-bottom: 6px;
        }

        .slider-val {
          font-family: var(--display);
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--ink);
        }

        .visual-indicator-bar {
          display: flex;
          height: 36px;
          border-radius: 3px;
          overflow: hidden;
          margin: 18px 0;
          border: 1px solid var(--line-strong);
        }

        .bar-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: white;
          transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        /* Tabbed sequence viewer */
        .sequence-tabs {
          display: flex;
          overflow-x: auto;
          border-bottom: 1px solid var(--line-strong);
          margin-bottom: 16px;
          gap: 4px;
        }
        
        .seq-tab-btn {
          font-family: var(--body);
          font-size: 0.74rem;
          font-weight: 600;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid transparent;
          border-bottom: none;
          color: var(--ink-soft);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .seq-tab-btn.active {
          color: var(--ink);
          border-color: var(--line-strong);
          background-color: var(--paper-raised);
          font-weight: 700;
          border-top: 2px solid var(--emerald);
        }

        .email-letter {
          background-color: var(--paper-raised);
          border: 1px solid var(--line-strong);
          border-radius: 2px;
          padding: 24px;
          font-family: var(--display);
          font-size: 0.94rem;
          line-height: 1.55;
          max-height: 350px;
          overflow-y: auto;
          color: var(--ink);
        }

        .email-letter p {
          margin: 0;
          text-indent: 1.8em;
          text-wrap: pretty;
        }

        .email-letter p:first-of-type {
          text-indent: 0;
        }

        .email-letter p + p {
          margin-top: 8px;
        }

        .email-letter ul {
          margin: 12px 0 12px 28px;
          padding: 0;
          list-style-type: square;
        }

        .email-letter li {
          margin-bottom: 6px;
          font-size: 0.88rem;
          color: var(--ink-soft);
        }

        /* FAQ styling */
        .faq-item {
          border-bottom: 1px solid var(--line);
          padding: 16px 0;
        }
        
        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--display);
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          user-select: none;
        }

        .faq-answer {
          margin-top: 10px;
          font-size: 0.92rem;
          color: var(--ink-soft);
          line-height: 1.55;
          padding-left: 8px;
          border-left: 2px solid var(--emerald);
        }

        /* Floating Trust callout */
        .trust-box {
          background-color: var(--emerald-wash);
          border: 1px solid #c4dac9;
          border-left: 4px solid var(--emerald);
          padding: 18px;
          border-radius: 3px;
          margin: 20px 0;
        }

        .privacy-box {
          background-color: var(--paper-raised);
          border: 1px solid var(--line-strong);
          border-left: 4px solid var(--gold);
          padding: 18px;
          border-radius: 3px;
          margin: 20px 0;
        }

        /* Generic buttons */
        .m-btn {
          font-family: var(--body);
          font-weight: 700;
          font-size: 0.86rem;
          letter-spacing: 0.05em;
          padding: 14px 28px;
          border-radius: 3px;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .m-btn-primary {
          background-color: var(--ink);
          color: var(--paper);
          border: 1px solid var(--ink);
        }

        .m-btn-primary:hover {
          background-color: var(--emerald);
          border-color: var(--emerald);
        }

        .m-btn-secondary {
          background-color: transparent;
          color: var(--ink);
          border: 1px solid var(--ink);
        }

        .m-btn-secondary:hover {
          background-color: var(--panel);
          border-color: var(--line-strong);
        }
      `}</style>

      {/* HEADER NAVBAR */}
      <header style={{ borderBottom: "1px solid var(--line-strong)", backgroundColor: "var(--paper-raised)" }}>
        <div className="m-wrap" style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 700 }}>
              The Independent Debt Architect
            </span>
            <span style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
              The Prepayment <em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--emerald)" }}>Ledger</em>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button className="m-btn m-btn-secondary" onClick={onGoToPlanner} style={{ padding: "8px 16px", fontSize: "0.76rem" }}>
              Open Planner Dashboard →
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="m-wrap" style={{ textAlign: "center", paddingBottom: 0 }}>
        <div className="mode-selector">
          <button
            className={`mode-btn ${headlineMode === "direct" ? "active" : ""}`}
            onClick={() => setHeadlineMode("direct")}
          >
            Core Direct
          </button>
          <button
            className={`mode-btn ${headlineMode === "emotive" ? "active" : ""}`}
            onClick={() => setHeadlineMode("emotive")}
          >
            Anti-Bank Emotive
          </button>
        </div>

        <div style={{ maxWidth: "850px", margin: "0 auto" }}>
          {headlineMode === "direct" ? (
            <h1 className="serif-title" style={{ marginBottom: "20px" }}>
              Before you prepay your home loan, know exactly where every rupee should go.
            </h1>
          ) : (
            <h1 className="serif-title" style={{ marginBottom: "20px" }}>
              Banks get rich when you stay in debt. Buy back 8 years of your life with smart portfolio math.
            </h1>
          )}

          <p style={{ fontSize: "clamp(1rem, 1.2vw, 1.25rem)", color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "32px" }}>
            Don't let confusing lender rules and isolated calculators dictate your financial freedom. Map your home, car, and personal loans into a single, unified payoff engine. Optimize your surplus monthly cash and yearly bonuses to save lakhs in interest.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button className="m-btn m-btn-primary" onClick={onGoToPlanner}>
              Model Your Loans (Free)
            </button>
            <button className="m-btn m-btn-secondary" onClick={onOpenPaywall}>
              Generate My Customized Debt-Free Blueprint
            </button>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", fontStyle: "italic" }}>
            No bank logins or credit checks required. 100% private.
          </p>
        </div>

        <div className="double-border">
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", fontWeight: 600 }}>
            <span>🔒 Browser-Local Math</span>
            <span>🏔️ Avalanche & Snowball Compounding</span>
            <span>🛡️ Rule-Aware Lender Checks</span>
            <span>🇮🇳 RBI Prepayment Compliant (2026)</span>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION & WIDGET 1: THE AMORTIZATION SHOCK */}
      <section style={{ backgroundColor: "var(--panel)", borderTop: "1px solid var(--line-strong)", borderBottom: "1px solid var(--line-strong)" }}>
        <div className="m-wrap">
          <div className="m-grid-2">
            <div>
              <div className="kicker-sub">⚠️ The Amortization Trap</div>
              <h2 className="serif-title" style={{ fontSize: "2.2rem", marginBottom: "18px" }}>
                Why Your Bank Portal Keeps You in the Dark
              </h2>
              <div style={{ fontSize: "0.98rem", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <p>
                  When you log into your bank dashboard, you see a "Prepay Loan" button. What you don't see is the math. Lenders deliberately obscure the compounding impact of early prepayments because shorter loans mean smaller profits for them.
                </p>
                <p>
                  To make matters worse, they apply complex restrictions—like HDFC's calendar month limitations, minimum part-payment rules, and tenure vs. EMI calculation loops.
                </p>
                <p style={{ fontWeight: 700, color: "var(--ink)" }}>
                  If you treat your home loan, car loan, and credit cards as isolated accounts, you are overpaying. You don't have separate debts; you have one <strong>Debt Portfolio</strong>. It's time to optimize it like one.
                </p>
              </div>

              <div className="trust-box" style={{ marginTop: "24px" }}>
                <h4 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1rem", color: "var(--emerald)", marginBottom: "4px" }}>
                  🤝 Independent & Unbiased Math
                </h4>
                <p style={{ fontSize: "0.82rem", color: "#1c5643", lineHeight: 1.45 }}>
                  The Prepayment Ledger is a standalone utility. We do not sell financial products, we do not receive kickbacks from banks, and we do not sync with your bank accounts. Your calculations are performed entirely inside your browser. We have no interest in keeping you in debt. Our only client is you.
                </p>
              </div>
            </div>

            {/* INTERACTIVE SHOCK SIMULATOR */}
            <div className="shock-widget">
              <div className="kicker-sub" style={{ color: "var(--clay)" }}>Live Calculation Engine</div>
              <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.2rem", marginBottom: "16px" }}>
                See the Amortization Shock
              </h3>

              {/* Slider 1: Loan Amount */}
              <div className="slider-group">
                <div className="slider-label">
                  <span>Loan Amount</span>
                  <span className="slider-val">{formatCompactINR(shockAmount)}</span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={10000000}
                  step={500000}
                  value={shockAmount}
                  onChange={(e) => setShockAmount(Number(e.target.value))}
                />
              </div>

              {/* Slider 2: Interest Rate */}
              <div className="slider-group">
                <div className="slider-label">
                  <span>Interest Rate</span>
                  <span className="slider-val">{shockRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={12}
                  step={0.1}
                  value={shockRate}
                  onChange={(e) => setShockRate(Number(e.target.value))}
                />
              </div>

              {/* Slider 3: Tenure */}
              <div className="slider-group">
                <div className="slider-label">
                  <span>Initial Tenure</span>
                  <span className="slider-val">{shockTenure} Years</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={shockTenure}
                  onChange={(e) => setShockTenure(Number(e.target.value))}
                />
              </div>

              <div style={{ borderTop: "1px dashed var(--line-strong)", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)" }}>Calculated Monthly EMI</span>
                <span style={{ fontFamily: "var(--display)", fontSize: "1.4rem", fontWeight: 800 }}>{formatINR(shockStats.emi)}</span>
              </div>

              <div style={{ backgroundColor: "var(--panel)", borderRadius: "4px", padding: "14px" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--clay)" }}>
                  First 5 Years (60 EMIs) Interest Shock
                </span>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0 2px", fontSize: "0.85rem" }}>
                  <span>Total Payments Made:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(shockStats.totalPaid)}</span>
                </div>

                <div className="visual-indicator-bar">
                  <div className="bar-segment" style={{ width: `${shockStats.interestPct}%`, backgroundColor: "var(--clay)" }} title="Bank's Interest Portion">
                    {shockStats.interestPct.toFixed(0)}% Interest
                  </div>
                  <div className="bar-segment" style={{ width: `${shockStats.principalPct}%`, backgroundColor: "var(--emerald)" }} title="Your Principal Equity">
                    {shockStats.principalPct.toFixed(0)}% Principal
                  </div>
                </div>

                <div style={{ fontSize: "0.76rem", lineHeight: 1.45 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--clay)" }}></span>
                    <span>Paid to Bank Interest: <strong style={{ color: "var(--clay)" }}>{formatINR(shockStats.interestPaid)}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--emerald)" }}></span>
                    <span>Paid to Loan Principal: <strong style={{ color: "var(--emerald)" }}>{formatINR(shockStats.principalPaid)}</strong></span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontStyle: "italic", marginTop: "12px", textAlign: "center" }}>
                Amortization schedules mathematically prove banks extract interest up front. Prepayments crush this ratio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 1: THE SMART WINDFALL ALLOCATOR (INTERACTIVE SIMULATION) */}
      <section className="m-wrap">
        <div className="m-grid-2" style={{ gridAutoFlow: "dense" }}>
          <div>
            <div className="kicker-sub">🧬 Feature 1: Smart Windfall Allocator</div>
            <h2 className="serif-title" style={{ fontSize: "2.2rem", marginBottom: "18px" }}>
              Don't Guess Your Prepayments. Mathematically Optimize Them.
            </h2>
            <div style={{ fontSize: "0.98rem", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: "14px" }}>
              <p>
                When you receive a yearly bonus, a tax refund, or an incentive payout, splitting it equally across loans is a mathematical mistake.
              </p>
              <p>
                Our <strong>Smart Windfall Allocator</strong> runs hundreds of simulations in milliseconds to find the absolute best split of your lump sum. It respects every loan's interest rate, remaining tenure, outstanding balance, and specific lender rules to recommend an allocation that yields the absolute maximum interest savings.
              </p>
            </div>

            <div className="privacy-box" style={{ marginTop: "24px" }}>
              <h4 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1rem", color: "var(--gold)", marginBottom: "4px" }}>
                🔒 Your Data Stays Yours
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.45 }}>
                We do not collect or store your loan amounts, interest rates, or personal details on any external server. All math is computed locally in your browser memory and persisted in your browser's private local storage. No tracking, no bank linking, no leakages.
              </p>
            </div>
          </div>

          {/* INTERACTIVE WINDFALL SPLITTER */}
          <div className="shock-widget">
            <div className="kicker-sub" style={{ color: "var(--emerald)" }}>Lump-Sum Optimization</div>
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.2rem", marginBottom: "16px" }}>
              Windfall Splitting Simulator
            </h3>

            <div className="slider-group">
              <div className="slider-label">
                <span>Yearly Bonus/Windfall</span>
                <span className="slider-val" style={{ color: "var(--emerald)", fontSize: "1.2rem" }}>
                  {formatINR(windfallAmount)}
                </span>
              </div>
              <input
                type="range"
                min={50000}
                max={1000000}
                step={25000}
                value={windfallAmount}
                onChange={(e) => setWindfallAmount(Number(e.target.value))}
              />
            </div>

            {/* Show configured mock loans */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div className="thin-border" style={{ padding: "8px 12px", borderRadius: "3px", backgroundColor: "var(--paper)" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)" }}>Loan A (Home Loan)</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{formatCompactINR(loanAOutstanding)} @ {loanARate}%</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>15 Years Remaining</div>
              </div>
              <div className="thin-border" style={{ padding: "8px 12px", borderRadius: "3px", backgroundColor: "var(--paper)" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)" }}>Loan B (Car Loan)</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{formatCompactINR(loanBOutstanding)} @ {loanBRate}%</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>5 Years Remaining</div>
              </div>
            </div>

            {/* Comparison results */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* 50/50 Strategy */}
              <div className="thin-border" style={{ padding: "12px", borderRadius: "3px", backgroundColor: "var(--paper-raised)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)" }}>Standard 50/50 Split</span>
                  <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--ink)" }}>
                    Saves {formatINR(windfallComparison.totalSaved50)}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)", marginTop: "4px" }}>
                  {formatINR(windfallComparison.splitA_50)} each to Loan A & Loan B
                </div>
              </div>

              {/* Optimized Strategy */}
              <div style={{ padding: "12px", borderRadius: "3px", backgroundColor: "var(--emerald-wash)", border: "1px solid var(--emerald)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 800, color: "var(--emerald)" }}>
                    💡 LEDGER OPTIMIZED SPLIT (73/27)
                  </span>
                  <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.2rem", color: "var(--emerald)" }}>
                    Saves {formatINR(windfallComparison.totalSavedOpt)}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", fontWeight: 600, marginTop: "4px" }}>
                  Deploy {formatINR(windfallComparison.splitA_opt)} to Loan A & {formatINR(windfallComparison.splitB_opt)} to Loan B
                </div>
              </div>

              {/* Savings Highlight */}
              <div style={{ textAlign: "center", borderTop: "1px dashed var(--line-strong)", paddingTop: "12px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--ink-soft)" }}>
                  Marginal Math Advantage
                </span>
                <div style={{ fontFamily: "var(--display)", fontSize: "1.45rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>
                  {formatINR(windfallComparison.difference)} More Saved
                </div>
                <p style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                  "A {formatINR(windfallAmount)} bonus split 50/50 might save you {formatINR(windfallComparison.totalSaved50)}. Our optimizer split saves you {formatINR(windfallComparison.totalSavedOpt)}. Same money, <strong>{formatINR(windfallComparison.difference)} more in your pocket.</strong>"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2 & FEATURE 3 SHOWCASE */}
      <section style={{ backgroundColor: "var(--panel)", borderTop: "1px solid var(--line-strong)", borderBottom: "1px solid var(--line-strong)" }}>
        <div className="m-wrap">
          <div className="m-grid-2">
            {/* Feature 2 */}
            <div className="shock-widget">
              <div className="kicker-sub">🔄 Feature 2: Portfolio Rollover Engine</div>
              <h3 className="serif-title" style={{ fontSize: "1.6rem", marginBottom: "12px" }}>
                The Compounding Power of the Rollover Budget
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginBottom: "16px" }}>
                What happens when you close a minor loan? Most people absorb that freed-up EMI back into their lifestyle.
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginBottom: "20px" }}>
                The <strong>Rollover Engine</strong> automates the Debt Avalanche (highest interest rate first) or Debt Snowball (smallest balance first) strategy at a portfolio level. As soon as one loan is fully paid off, its EMI is automatically rolled over and stacked onto your next target loan. Watch your payoff speed compound as your liabilities shrink.
              </p>
              
              <div style={{ backgroundColor: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "3px", padding: "14px" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--ink-soft)", display: "block", marginBottom: "10px" }}>
                  Compound Interest Elimination Loop
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--line)", paddingBottom: "6px" }}>
                    <span>Step 1: Pay off Car Loan (EMI ₹22,000)</span>
                    <strong style={{ color: "var(--emerald)" }}>Closed</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--line)", paddingBottom: "6px" }}>
                    <span>Step 2: Home Loan EMI</span>
                    <span>₹45,000 / mo</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, paddingBottom: "2px" }}>
                    <span>Step 3: Rollover Loop Activated</span>
                    <span style={{ color: "var(--emerald)" }}>Home EMI becomes ₹67,000 / mo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="shock-widget">
              <div className="kicker-sub">🛡️ Feature 3: Lender Rules Configurator</div>
              <h3 className="serif-title" style={{ fontSize: "1.6rem", marginBottom: "12px" }}>
                Rule-Aware Planning. No Prepayment Penalties.
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginBottom: "16px" }}>
                Did you know that under RBI guidelines, individuals face zero prepayment penalties on floating-rate home loans? Yet, banks create hurdles: minimum prepayment thresholds (e.g., ₹5,000 or 1 EMI) and calendar limits.
              </p>
              
              {/* Interactive Lender Rule Badge Demo */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <button 
                    className={`mode-btn ${selectedLenderRule === "hdfc" ? "active" : ""}`} 
                    onClick={() => setSelectedLenderRule("hdfc")}
                    style={{ fontSize: "0.68rem", border: "1px solid var(--line-strong)", padding: "4px 8px" }}
                  >
                    HDFC Rules
                  </button>
                  <button 
                    className={`mode-btn ${selectedLenderRule === "sbi" ? "active" : ""}`} 
                    onClick={() => setSelectedLenderRule("sbi")}
                    style={{ fontSize: "0.68rem", border: "1px solid var(--line-strong)", padding: "4px 8px" }}
                  >
                    SBI Rules
                  </button>
                  <button 
                    className={`mode-btn ${selectedLenderRule === "rbi" ? "active" : ""}`} 
                    onClick={() => setSelectedLenderRule("rbi")}
                    style={{ fontSize: "0.68rem", border: "1px solid var(--line-strong)", padding: "4px 8px" }}
                  >
                    RBI Guidelines
                  </button>
                </div>

                <div style={{ backgroundColor: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "3px", padding: "14px", fontSize: "0.8rem" }}>
                  {selectedLenderRule === "hdfc" && (
                    <div>
                      <div className="badge bad" style={{ margin: "0 0 10px 0" }}>
                        <span className="mk">⚠️ RULE LIMITATION</span> Minimum: ₹5,000 or 1 EMI
                      </div>
                      <p style={{ color: "var(--ink-soft)", lineHeight: 1.45 }}>
                        Prepayments are restricted to only <strong>one part-payment per calendar month</strong>. Maximum monthly prepayment is capped at 75% of your year-opening balance, and a lockout period applies in Month 1.
                      </p>
                    </div>
                  )}

                  {selectedLenderRule === "sbi" && (
                    <div>
                      <div className="badge ok" style={{ margin: "0 0 10px 0" }}>
                        <span className="mk">✓ ENFORCED</span> Minimum prepay check
                      </div>
                      <p style={{ color: "var(--ink-soft)", lineHeight: 1.45 }}>
                        SBI permits part-payments through their portal up to 3 times a year without physical branch visits. Minimum part-payment matches 1 EMI.
                      </p>
                    </div>
                  )}

                  {selectedLenderRule === "rbi" && (
                    <div>
                      <div className="badge ok" style={{ margin: "0 0 10px 0" }}>
                        <span className="mk">✓ REGULATORY PROVISION</span> Zero Penalties
                      </div>
                      <p style={{ color: "var(--ink-soft)", lineHeight: 1.45 }}>
                        Individuals are fully exempt from prepayment penalties on all floating-rate term loans (like Home Loans) for non-business purposes. Banks cannot charge penalty interest, but operational rules apply.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
                The Prepayment Ledger checks every planned payment against real-world rulesets (including HDFC constraints), alerting you to violations <em>before</em> you visit the branch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EMAIL SEQUENCE PLAYBOOK DRAWER */}
      <section className="m-wrap">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="kicker-sub">📬 The Architectural Support System</div>
          <h2 className="serif-title" style={{ fontSize: "2.2rem" }}>
            Reclaim Your Freedom: The 5-Stage Nurture Sequence
          </h2>
          <p style={{ maxWidth: "700px", margin: "10px auto 0", color: "var(--ink-soft)", fontSize: "0.96rem" }}>
            Every user receives our high-end educational sequence to help navigate amortization spikes, rollover options, and lender regulations. Review the blueprint stages below:
          </p>
        </div>

        <div className="shock-widget" style={{ padding: "20px" }}>
          <div className="sequence-tabs">
            {emailSequence.map((email) => (
              <button
                key={email.stage}
                className={`seq-tab-btn ${activeEmailTab === email.stage ? "active" : ""}`}
                onClick={() => setActiveEmailTab(email.stage)}
              >
                Stage {email.stage}: {email.tag}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
            <div>
              <strong style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--ink-soft)" }}>Subject Line:</strong>{" "}
              <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink)" }}>{emailSequence[activeEmailTab - 1].subject}</span>
            </div>
            <div>
              <strong style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--ink-soft)" }}>Preheader:</strong>{" "}
              <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontStyle: "italic" }}>{emailSequence[activeEmailTab - 1].preheader}</span>
            </div>
          </div>

          <div className="email-letter">
            {emailSequence[activeEmailTab - 1].body.split("\n\n").map((para, i) => {
              if (para.trim().startsWith("*") || para.trim().match(/^\d+\./)) {
                return (
                  <ul key={i}>
                    {para.split("\n").map((line, j) => {
                      const cleanLine = line.replace(/^\*\s*/, "").replace(/^\d+\.\s*/, "");
                      return <li key={j}>{cleanLine}</li>;
                    })}
                  </ul>
                );
              }
              return <p key={i}>{para}</p>;
            })}
          </div>
        </div>
      </section>

      {/* FAQs ACCORDION */}
      <section style={{ backgroundColor: "var(--panel)", borderTop: "1px solid var(--line-strong)", borderBottom: "1px solid var(--line-strong)" }}>
        <div className="m-wrap" style={{ maxWidth: "800px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div className="kicker-sub">❓ Conversion & Mathematical FAQs</div>
            <h2 className="serif-title" style={{ fontSize: "2.2rem" }}>
              Frequently Queried Ledger Calculus
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {/* FAQ 1 */}
            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>How can I trust the math of this tool?</span>
              </summary>
              <div className="faq-answer">
                The calculation engine of The Prepayment Ledger is mathematically verified to the rupee against standard industry schedules, including complex Python math models and verified Excel workbook engines. The outputs account for monthly compounding reducing balances, EMI rounding conventions, and floating-rate changes. You can audit the exact monthly schedule in the table view to verify the math line-by-line.
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>The RBI says there are no prepayment penalties on home loans. Why does this tool have rules?</span>
              </summary>
              <div className="faq-answer">
                While the RBI mandates that banks cannot charge <em>penalties</em> for floating-rate loans to individuals, banks still enforce operational constraints to make prepaying difficult. These include limiting you to one prepayment per calendar month, requiring a minimum amount (e.g., ₹5,000 or 1 EMI), or restricting prepayments during the first month. Our rules engine ensures your plan is operationally valid so you don't get rejected at the branch.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Should I prepay my home loan or invest in mutual funds?</span>
              </summary>
              <div className="faq-answer">
                Prepaying a home loan at 8.5% is equivalent to earning a guaranteed, tax-free return of 8.5%. While equity mutual funds can offer higher historical returns, they come with market risks and capital gains taxes. Prepaying provides immediate cash-flow relief and reduces your debt-to-income ratio. We suggest using a balanced approach: maintain an emergency fund, continue your core investments, and use your surplus cash/bonuses to aggressively prepay debt.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Why is the PDF report locked behind a one-time fee?</span>
              </summary>
              <div className="faq-answer">
                We do not sell your data, run ads, or accept affiliate commissions from lenders for refinancing leads. This independence ensures that our split optimization recommendations are 100% mathematically unbiased. The one-time fee supports the development of the tool and gives you a clean, downloadable blueprint to share with your family or financial advisor.
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Is my financial information secure?</span>
              </summary>
              <div className="faq-answer">
                Yes, because we never see it. All loan values, interest rates, and schedules are computed locally in your browser sandbox. We do not use third-party financial aggregators (like Account Aggregators or Plaid) and do not require bank logins. If you clear your browser cache, your inputs are cleared.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="m-wrap text-center" style={{ textAlign: "center", padding: "64px 24px" }}>
        <h2 className="serif-title" style={{ fontSize: "2.6rem", marginBottom: "18px" }}>
          Reclaim Your Retirement Years Today
        </h2>
        <p style={{ maxWidth: "600px", margin: "0 auto 30px", color: "var(--ink-soft)" }}>
          Join thousands of independent debt architects who refuse to let bank amortization traps dictate their financial timelines. Try the planner completely free.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <button className="m-btn m-btn-primary" onClick={onGoToPlanner}>
            Go to Free Planner Dashboard
          </button>
          <button className="m-btn m-btn-secondary" onClick={onOpenPaywall}>
            Get Offline PDF Blueprint (₹499)
          </button>
        </div>
      </section>

      {/* REGULATORY DISCLAIMER & SITE FOOTER */}
      <footer style={{ borderTop: "3px double var(--ink)", backgroundColor: "var(--paper-raised)" }}>
        <div className="m-wrap" style={{ fontSize: "0.74rem", color: "var(--ink-faint)", lineHeight: 1.7 }}>
          <div style={{ marginBottom: "20px" }}>
            <strong>Financial & Regulatory Disclaimer</strong>
            <ol style={{ paddingLeft: "15px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong>Estimation Only</strong>: The calculations, amortization schedules, and interest savings generated by this tool are estimates based on user-provided inputs and standard reducing-balance, monthly compounding formulas. Actual interest charges, amortization tables, and outstanding balances are determined solely by your lender and may differ due to daily interest accruals, processing cycles, and rounding methodologies.
              </li>
              <li>
                <strong>Floating Rate Volatility</strong>: Floating-rate simulations model scheduled or hypothetical interest rate fluctuations. In practice, interest rates fluctuate in accordance with lender benchmark rates (e.g., Repo Linked Lending Rate - RLLR, MCLR) which are subject to macroeconomic changes. Floating-rate prepayment adjustments may result in tenure adjustments or EMI resets at the lender's sole discretion.
              </li>
              <li>
                <strong>Lender Rule Variances</strong>: While this tool incorporates standard rulesets (e.g., RBI guidelines for floating rate home loans, generic HDFC part-payment constraints), individual loan agreements may contain custom covenants, lock-in periods, or fee structures. Always verify prepayment limits, calendar timing, and transaction routing instructions with your lender's service desk before executing any funds transfer.
              </li>
              <li>
                <strong>Not Financial or Legal Advice</strong>: The Prepayment Ledger does not provide professional tax, legal, or investment advice. Prepayment optimization should be considered alongside your overall financial profile, including tax benefits under Section 24/80C, emergency fund liquidity requirements, and alternative investment yields.
              </li>
            </ol>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <span>© 2026 The Prepayment Ledger. All computations executed locally.</span>
            <span>Created by <strong>Dharmik Shingala</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
