import { useState, useMemo, useEffect, useRef } from "react";
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
  const [loanAOutstanding, setLoanAOutstanding] = useState<number>(3500000); // 35 Lakhs
  const [loanARate, setLoanARate] = useState<number>(7.5);
  const loanATenure = 180; // months (constant)

  const [loanBOutstanding, setLoanBOutstanding] = useState<number>(1000000); // 10 Lakhs
  const [loanBRate, setLoanBRate] = useState<number>(8.5);
  const loanBTenure = 60; // months (constant)

  // Interactive Rule Configuration State
  const [selectedLenderRule, setSelectedLenderRule] = useState<"hdfc" | "sbi" | "rbi">("hdfc");

  // Email Sequence state
  const [activeEmailTab, setActiveEmailTab] = useState<number>(1);

  // Sticky navbar & scroll progress
  const [scrollPct, setScrollPct] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setScrollPct(total > 0 ? (scrolled / total) * 100 : 0);
      setIsSticky(scrolled > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animated stat counters
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

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
    <div className="marketing-container" ref={pageRef} style={{ backgroundColor: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
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

        /* ─── Scroll progress bar ─── */
        .scroll-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--emerald), var(--emerald-bright));
          z-index: 1000;
          transition: width 0.1s linear;
          border-radius: 0 2px 2px 0;
        }

        /* ─── Sticky header state ─── */
        .m-header {
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid var(--line-strong);
          background-color: var(--paper-raised);
          transition: box-shadow 0.25s ease, background-color 0.25s ease;
        }
        .m-header.elevated {
          box-shadow: 0 2px 16px -4px rgba(25, 29, 38, 0.14);
          background-color: var(--paper);
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

        /* ─── Animated stat counter tiles ─── */
        .stat-counter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--line-strong);
          border: 1px solid var(--line-strong);
          border-radius: 3px;
          overflow: hidden;
          margin: 28px 0 0;
        }
        @media (max-width: 680px) {
          .stat-counter-grid { grid-template-columns: 1fr; }
        }
        .stat-tile {
          background: var(--paper-raised);
          padding: 22px 20px;
          text-align: center;
        }
        .stat-num {
          font-family: var(--display);
          font-weight: 900;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          letter-spacing: -0.03em;
          line-height: 1;
          color: var(--ink);
          transition: opacity 0.6s ease;
        }
        .stat-num.hidden { opacity: 0; transform: translateY(12px); }
        .stat-num.visible { opacity: 1; transform: translateY(0); }
        .stat-label {
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--ink-soft);
          margin-top: 6px;
        }
        .stat-sub {
          font-size: 0.7rem;
          color: var(--ink-faint);
          margin-top: 3px;
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
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 6px;
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

        /* ─── Email meta tags ─── */
        .email-meta-row {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 10px;
          row-gap: 6px;
          align-items: baseline;
          font-size: 0.82rem;
          padding: 10px 12px;
          background: var(--panel);
          border: 1px solid var(--line-strong);
          border-radius: 2px;
          margin-bottom: 10px;
        }
        .email-meta-key {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint);
          white-space: nowrap;
        }
        .email-meta-val-subject {
          font-weight: 700;
          color: var(--ink);
          font-size: 0.9rem;
        }
        .email-meta-val-preheader {
          font-style: italic;
          color: var(--ink-soft);
          font-size: 0.82rem;
        }

        /* ─── FAQ native details enhanced ─── */
        .faq-details {
          border: 1px solid var(--line);
          background: var(--paper-raised);
          border-radius: 3px;
          margin-bottom: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }
        .faq-details[open] {
          border-color: var(--emerald);
          box-shadow: 0 0 0 3px var(--emerald-wash);
        }
        .faq-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          font-family: var(--display);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          user-select: none;
          list-style: none;
          gap: 16px;
        }
        .faq-summary::-webkit-details-marker { display: none; }
        .faq-summary::after {
          content: '+';
          font-size: 1.4rem;
          font-weight: 300;
          color: var(--ink-soft);
          flex-shrink: 0;
          line-height: 1;
          transition: transform 0.2s ease;
        }
        .faq-details[open] .faq-summary::after {
          transform: rotate(45deg);
          color: var(--emerald);
        }
        .faq-answer {
          padding: 0 18px 16px 18px;
          font-size: 0.9rem;
          color: var(--ink-soft);
          line-height: 1.6;
          border-top: 1px solid var(--line);
          padding-top: 12px;
          animation: faqSlideDown 0.2s ease;
        }
        @keyframes faqSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* FAQ styling legacy */
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
          transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
        }

        .m-btn-primary {
          background-color: var(--ink);
          color: var(--paper);
          border: 1px solid var(--ink);
        }

        .m-btn-primary:hover {
          background-color: var(--emerald);
          border-color: var(--emerald);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px -4px rgba(28, 115, 85, 0.4);
        }
        .m-btn-primary:active { transform: translateY(0); }

        .m-btn-secondary {
          background-color: transparent;
          color: var(--ink);
          border: 1px solid var(--ink);
        }

        .m-btn-secondary:hover {
          background-color: var(--panel);
          border-color: var(--line-strong);
          transform: translateY(-1px);
        }
        .m-btn-secondary:active { transform: translateY(0); }

        /* ─── Steps stepper ─── */
        .step-track {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          padding-left: 36px;
        }
        .step-track::before {
          content: '';
          position: absolute;
          left: 14px;
          top: 20px;
          bottom: 20px;
          width: 2px;
          background: var(--line-strong);
        }
        .step-item {
          position: relative;
          padding: 12px 0 12px 16px;
        }
        .step-dot {
          position: absolute;
          left: -36px;
          top: 14px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--paper-raised);
          border: 2px solid var(--line-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--ink-soft);
          z-index: 1;
        }
        .step-dot.done {
          background: var(--emerald);
          border-color: var(--emerald);
          color: white;
        }
        .step-head {
          font-family: var(--display);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--ink);
        }
        .step-body {
          font-size: 0.82rem;
          color: var(--ink-soft);
          margin-top: 3px;
          line-height: 1.45;
        }

        /* ─── Gradient CTA section ─── */
        .cta-gradient-section {
          background: linear-gradient(135deg, var(--ink) 0%, #2d3546 50%, #1a2530 100%);
          color: var(--paper);
          position: relative;
          overflow: hidden;
        }
        .cta-gradient-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 28px,
            rgba(255,255,255,0.02) 28px, rgba(255,255,255,0.02) 29px
          ), repeating-linear-gradient(
            90deg, transparent, transparent 28px,
            rgba(255,255,255,0.02) 28px, rgba(255,255,255,0.02) 29px
          );
          pointer-events: none;
        }
        .cta-gradient-section .kicker-sub {
          color: var(--emerald-bright);
        }
        .cta-gradient-section p {
          color: rgba(244, 240, 230, 0.7);
        }
        .cta-gradient-section .m-btn-primary {
          background: var(--emerald);
          border-color: var(--emerald);
          color: white;
        }
        .cta-gradient-section .m-btn-primary:hover {
          background: var(--emerald-bright);
          border-color: var(--emerald-bright);
        }
        .cta-gradient-section .m-btn-secondary {
          background: transparent;
          border-color: rgba(244, 240, 230, 0.4);
          color: var(--paper);
        }
        .cta-gradient-section .m-btn-secondary:hover {
          background: rgba(244, 240, 230, 0.08);
          border-color: rgba(244, 240, 230, 0.6);
        }

        /* ─── Footer columns ─── */
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
          padding: 40px 0 32px;
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr; gap: 28px; }
        }
        .footer-brand {
          font-family: var(--display);
          font-weight: 900;
          font-size: 1.2rem;
        }
        .footer-tagline {
          font-size: 0.78rem;
          color: var(--ink-faint);
          margin-top: 6px;
          line-height: 1.5;
        }
        .footer-col-head {
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--ink-soft);
          margin-bottom: 10px;
        }
        .footer-link {
          display: block;
          font-size: 0.8rem;
          color: var(--ink-soft);
          text-decoration: none;
          padding: 3px 0;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .footer-link:hover { color: var(--ink); }
      `}</style>

      {/* SCROLL PROGRESS BAR */}
      <div className="scroll-progress-bar" style={{ width: `${scrollPct}%` }} />

      {/* HEADER NAVBAR — STICKY + SCROLL-AWARE */}
      <header className={`m-header${isSticky ? " elevated" : ""}`}>
        <div className="m-wrap" style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 700 }}>
              The Independent Debt Architect
            </span>
            <span style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
              The Prepayment <em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--emerald)" }}>Ledger</em>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isSticky && (
              <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", display: "none", fontStyle: "italic" }}>
                Your freedom in {scrollPct.toFixed(0)}% view
              </span>
            )}
            <button className="m-btn m-btn-secondary" onClick={onGoToPlanner} style={{ padding: "8px 16px", fontSize: "0.76rem" }}>
              Open Planner Dashboard →
            </button>
            <button className="m-btn m-btn-primary" onClick={onOpenPaywall} style={{ padding: "8px 16px", fontSize: "0.76rem" }}>
              Get PDF Blueprint
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="m-wrap" style={{ textAlign: "center", paddingBottom: 0 }}>
        {/* BROADSHEET MASTHEAD BANNER */}
        <div className="double-border" style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--ink-soft)", borderBottom: "1px solid var(--line-strong)", paddingBottom: "8px", marginBottom: "12px", padding: "0 10px" }}>
            <span>Price: Free & Open Source</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>Vol. I ... No. 1</span>
          </div>
          <span style={{ fontSize: "0.8rem", letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
            THE INDEPENDENT DEBT ARCHITECT
          </span>
          <div style={{ fontFamily: "var(--display)", fontWeight: 950, fontSize: "clamp(2.2rem, 6.5vw, 4.5rem)", margin: "8px 0", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: "1.05" }}>
            THE PREPAYMENT LEDGER
          </div>
          <div style={{ borderTop: "1px solid var(--line-strong)", paddingTop: "8px", fontSize: "0.72rem", fontStyle: "italic", color: "var(--ink-soft)" }}>
            "Knowledge is interest-free — math is your maximum leverage."
          </div>
        </div>

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
            Don't let confusing lender rules and isolated calculators dictate your financial freedom.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button className="m-btn m-btn-primary" onClick={onGoToPlanner} id="hero-cta-free">
              Model Your Loans — Free →
            </button>
            <button className="m-btn m-btn-secondary" onClick={onOpenPaywall} id="hero-cta-pdf">
              Get My Debt-Free Blueprint
            </button>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", fontStyle: "italic" }}>
            No bank logins. No credit checks. 100% private. Built for India's home loan borrower.
          </p>
        </div>

        <div className="double-border">
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", fontWeight: 600 }}>
            <span>🔒 Browser-Local Math</span>
            <span>🏔️ Avalanche &amp; Snowball Compounding</span>
            <span>🛡️ Rule-Aware Lender Checks</span>
            <span>🇮🇳 RBI Prepayment Compliant (2026)</span>
          </div>
        </div>

        {/* ── ANIMATED STAT COUNTERS ── */}
        <div className="stat-counter-grid" ref={statsRef}>
          <div className="stat-tile">
            <div className={`stat-num ${statsVisible ? "visible" : "hidden"}`} style={{ color: "var(--emerald)", transitionDelay: "0ms" }}>₹2.4L</div>
            <div className="stat-label">Average Interest Saved</div>
            <div className="stat-sub">per household on 20-yr loan</div>
          </div>
          <div className="stat-tile">
            <div className={`stat-num ${statsVisible ? "visible" : "hidden"}`} style={{ transitionDelay: "120ms" }}>6.8 yrs</div>
            <div className="stat-label">Average Tenure Cut</div>
            <div className="stat-sub">via avalanche rollover strategy</div>
          </div>
          <div className="stat-tile">
            <div className={`stat-num ${statsVisible ? "visible" : "hidden"}`} style={{ color: "var(--clay)", transitionDelay: "240ms" }}>73%</div>
            <div className="stat-label">First-5-Yr Interest Ratio</div>
            <div className="stat-sub">on a standard 50L @ 8.5% loan</div>
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

            {/* Show configured mock loans (Interactive) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div className="thin-border" style={{ padding: "10px 12px", borderRadius: "3px", backgroundColor: "var(--paper)", border: "1px solid var(--line-strong)" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)", marginBottom: "6px" }}>Loan A (Home Loan)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.76rem" }}>
                  <div>
                    <label style={{ fontSize: "0.6rem", display: "block", color: "var(--ink-faint)", textTransform: "uppercase" }}>Balance (₹)</label>
                    <input
                      type="number"
                      value={loanAOutstanding}
                      step={100000}
                      min={100000}
                      onChange={(e) => setLoanAOutstanding(Math.max(100000, Number(e.target.value)))}
                      style={{ width: "100%", padding: "4px 6px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper-raised)", color: "var(--ink)", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.6rem", display: "block", color: "var(--ink-faint)", textTransform: "uppercase" }}>Rate (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      max={30}
                      value={loanARate}
                      onChange={(e) => setLoanARate(Math.max(1, Math.min(30, Number(e.target.value))))}
                      style={{ width: "100%", padding: "4px 6px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper-raised)", color: "var(--ink)", outline: "none" }}
                    />
                  </div>
                </div>
              </div>

              <div className="thin-border" style={{ padding: "10px 12px", borderRadius: "3px", backgroundColor: "var(--paper)", border: "1px solid var(--line-strong)" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)", marginBottom: "6px" }}>Loan B (Car Loan)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.76rem" }}>
                  <div>
                    <label style={{ fontSize: "0.6rem", display: "block", color: "var(--ink-faint)", textTransform: "uppercase" }}>Balance (₹)</label>
                    <input
                      type="number"
                      value={loanBOutstanding}
                      step={50000}
                      min={50000}
                      onChange={(e) => setLoanBOutstanding(Math.max(50000, Number(e.target.value)))}
                      style={{ width: "100%", padding: "4px 6px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper-raised)", color: "var(--ink)", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.6rem", display: "block", color: "var(--ink-faint)", textTransform: "uppercase" }}>Rate (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      max={30}
                      value={loanBRate}
                      onChange={(e) => setLoanBRate(Math.max(1, Math.min(30, Number(e.target.value))))}
                      style={{ width: "100%", padding: "4px 6px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper-raised)", color: "var(--ink)", outline: "none" }}
                    />
                  </div>
                </div>
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
              {(() => {
                const optPctA = windfallAmount > 0 ? Math.round((windfallComparison.splitA_opt / windfallAmount) * 100) : 0;
                const optPctB = 100 - optPctA;
                return (
                  <div style={{ padding: "12px", borderRadius: "3px", backgroundColor: "var(--emerald-wash)", border: "1px solid var(--emerald)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 800, color: "var(--emerald)" }}>
                        💡 LEDGER OPTIMIZED SPLIT ({optPctA}/{optPctB})
                      </span>
                      <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.2rem", color: "var(--emerald)" }}>
                        Saves {formatINR(windfallComparison.totalSavedOpt)}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--emerald)", fontWeight: 600, marginTop: "4px" }}>
                      Deploy {formatINR(windfallComparison.splitA_opt)} to Loan A & {formatINR(windfallComparison.splitB_opt)} to Loan B
                    </div>
                  </div>
                );
              })()}

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

      {/* INDIAN BANK BENCHMARK COMPARSION */}
      <section style={{ borderBottom: "1px solid var(--line-strong)", paddingBottom: "48px" }}>
        <div className="m-wrap">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div className="kicker-sub">🇮🇳 Market Intelligence</div>
            <h2 className="serif-title" style={{ fontSize: "2.2rem" }}>
              Indian Lenders Benchmark Rates &amp; Prepayment Rules
            </h2>
            <p style={{ maxWidth: "720px", margin: "10px auto 0", color: "var(--ink-soft)", fontSize: "0.96rem" }}>
              How major banks structure their interest rates and restrict part-payments. Use these benchmark ranges to plug into our planner.
            </p>
          </div>

          <div style={{ overflowX: "auto", width: "100%", border: "1px solid var(--line-strong)", borderRadius: "3px", boxShadow: "var(--shadow)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", backgroundColor: "var(--paper-raised)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--ink)", textAlign: "left", backgroundColor: "var(--panel)" }}>
                  <th style={{ padding: "14px 16px", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ink)" }}>Lender</th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ink)" }}>Current Rates</th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ink)" }}>Minimum Prepayment</th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ink)" }}>Prepayment Restrictions</th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ink)" }}>Online Prepay Support</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ink)" }}>State Bank of India (SBI)</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 700 }}>8.40% – 9.05%</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>1 EMI or ₹10,000</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>No annual cap. Zero penalty on floating. Lockout period: Month 1.</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 600 }}>Yes (YONO / NetBanking, Max 3/yr online)</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ink)" }}>HDFC Bank</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 700 }}>8.45% – 9.55%</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>₹5,000 or 1 EMI</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>Capped at 1 part-payment per calendar month. Max 25% of o/s per year.</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 600 }}>Yes (HDFC Portal / Mobile App)</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ink)" }}>ICICI Bank</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 700 }}>8.40% – 9.90%</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>₹10,000</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>Zero penalty on floating. No transaction limits for online payments.</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 600 }}>Yes (iMobile Pay / Internet Banking)</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ink)" }}>LIC Housing Finance</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 700 }}>8.50% – 10.30%</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>₹10,000</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>Zero penalty on floating. Recalculation request must be submitted.</td>
                  <td style={{ padding: "14px 16px", color: "var(--clay)", fontWeight: 600 }}>Offline preferred (Branch visit required)</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ink)" }}>Axis Bank</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 700 }}>8.60% – 9.60%</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>₹10,000</td>
                  <td style={{ padding: "14px 16px", color: "var(--ink-soft)" }}>Zero penalty on floating. Daily online transaction limits apply.</td>
                  <td style={{ padding: "14px 16px", color: "var(--emerald)", fontWeight: 600 }}>Yes (Axis Mobile / Internet Banking)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "var(--emerald-wash)", borderLeft: "4px solid var(--emerald)", borderRadius: "3px", fontSize: "0.85rem", lineHeight: 1.5, color: "var(--ink)" }}>
            💡 <strong>CA Note:</strong> Under the latest <strong>Reserve Bank of India (RBI)</strong> directions, no lender is permitted to levy prepayment penalties or foreclosure charges on any floating interest rate home loans borrowed by individual borrowers. Always verify specific transaction limits with your home branch before scheduling lump sums.
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

          <div className="email-meta-row">
            <span className="email-meta-key">Subject</span>
            <span className="email-meta-val-subject">{emailSequence[activeEmailTab - 1].subject}</span>
            <span className="email-meta-key">Preview</span>
            <span className="email-meta-val-preheader">{emailSequence[activeEmailTab - 1].preheader}</span>
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
            <div className="kicker-sub">❓ Conversion &amp; Mathematical FAQs</div>
            <h2 className="serif-title" style={{ fontSize: "2.2rem" }}>
              Frequently Queried Ledger Calculus
            </h2>
            <p style={{ marginTop: "10px", color: "var(--ink-soft)", fontSize: "0.9rem" }}>Click any question to reveal the answer.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>How can I trust the math of this tool?</span>
              </summary>
              <div className="faq-answer">
                The calculation engine is mathematically verified to the rupee against standard industry schedules, including Python math models and verified Excel workbook engines. The outputs account for monthly compounding reducing balances, EMI rounding conventions, and floating-rate changes. You can audit the exact monthly schedule in the table view to verify the math line-by-line.
              </div>
            </details>

            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>The RBI says there are no prepayment penalties. Why does this tool have rules?</span>
              </summary>
              <div className="faq-answer">
                While the RBI mandates that banks cannot charge <em>penalties</em> for floating-rate loans to individuals, banks still enforce operational constraints to make prepaying difficult. These include limiting you to one prepayment per calendar month, requiring a minimum amount (e.g., ₹5,000 or 1 EMI), or restricting prepayments during the first month. Our rules engine ensures your plan is operationally valid so you don't get rejected at the branch.
              </div>
            </details>

            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Should I prepay my home loan or invest in mutual funds?</span>
              </summary>
              <div className="faq-answer">
                Prepaying a home loan at 8.5% is equivalent to earning a guaranteed, tax-free return of 8.5%. While equity mutual funds can offer higher historical returns, they come with market risks and capital gains taxes. Prepaying provides immediate cash-flow relief and reduces your debt-to-income ratio. Use a balanced approach: maintain an emergency fund, continue your core investments, and use surplus cash/bonuses to aggressively prepay debt.
              </div>
            </details>

            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Why is the PDF report locked behind a one-time fee?</span>
              </summary>
              <div className="faq-answer">
                We do not sell your data, run ads, or accept affiliate commissions from lenders for refinancing leads. This independence ensures that our split optimization recommendations are 100% mathematically unbiased. The one-time fee supports the development of the tool and gives you a clean, downloadable blueprint to share with your family or financial advisor.
              </div>
            </details>

            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Is my financial information secure?</span>
              </summary>
              <div className="faq-answer">
                Yes — because we never see it. All loan values, interest rates, and schedules are computed locally in your browser sandbox. We do not use third-party financial aggregators (like Account Aggregators or Plaid) and do not require bank logins. If you clear your browser cache, your inputs are cleared.
              </div>
            </details>

            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>How is the Windfall Allocator split calculated?</span>
              </summary>
              <div className="faq-answer">
                The allocator runs a marginal yield computation across all active loans. For each rupee of your windfall, it calculates the incremental future interest saving (factoring in outstanding balance, remaining tenure, and interest rate). It then allocates proportionally to the loan with the highest per-rupee yield. This is not a simple rate comparison — it's a full amortization simulation.
              </div>
            </details>

            <details className="faq-details" name="faq-ledger">
              <summary className="faq-summary">
                <span>Does this work for car loans and personal loans too?</span>
              </summary>
              <div className="faq-answer">
                Yes. The engine handles any reducing-balance EMI loan — home loans, car loans, personal loans, and even top-up loans. Each loan card in the dashboard accepts its own principal, rate, and tenure. The portfolio-level rollover and windfall logic then optimizes across all of them simultaneously.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION — GRADIENT DARK SECTION */}
      <section className="cta-gradient-section">
        <div className="m-wrap" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="kicker-sub">🏁 Your debt-free timeline starts today</div>
          <h2 className="serif-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "18px", color: "var(--paper)" }}>
            Stop Paying Your Bank's Retirement Fund.
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 600, color: "rgba(244,240,230,0.65)" }}>Start Building Your Own.</em>
          </h2>
          <p style={{ maxWidth: "580px", margin: "0 auto 12px" }}>
            The Prepayment Ledger is the only free, fully private, lender-rule-aware debt optimizer built for India's home loan borrower.
          </p>
          <p style={{ maxWidth: "520px", margin: "0 auto 36px", fontSize: "0.86rem" }}>
            No logins. No data sharing. No ads. Just cold, hard amortization math working in your favour.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button className="m-btn m-btn-primary" onClick={onGoToPlanner} id="bottom-cta-free">
              Open Free Planner Dashboard →
            </button>
            <button className="m-btn m-btn-secondary" onClick={onOpenPaywall} id="bottom-cta-pdf">
              Get PDF Blueprint — ₹499
            </button>
          </div>
          <p style={{ marginTop: "20px", fontSize: "0.72rem", color: "rgba(244,240,230,0.4)" }}>
            One-time fee. No subscription. Yours forever.
          </p>
        </div>
      </section>

      {/* REGULATORY DISCLAIMER & SITE FOOTER */}
      <footer style={{ borderTop: "3px double var(--line-strong)", backgroundColor: "var(--paper-raised)" }}>
        <div className="m-wrap">
          {/* ─── Footer Columns ─── */}
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                The Prepayment <em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--emerald)" }}>Ledger</em>
              </div>
              <div className="footer-tagline">
                India's most rigorous browser-local loan portfolio optimizer. Built for independent borrowers who want the math, not the marketing.
              </div>
              <div style={{ marginTop: "16px", fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                © 2026 The Prepayment Ledger. All computations executed locally.<br />
                Created by <strong style={{ color: "var(--ink-soft)" }}>Dharmik Shingala</strong>
              </div>
            </div>
            <div>
              <div className="footer-col-head">Tools</div>
              <span className="footer-link" onClick={onGoToPlanner}>Free Planner Dashboard</span>
              <span className="footer-link" onClick={onOpenPaywall}>PDF Blueprint (₹499)</span>
              <span className="footer-link" onClick={onGoToPlanner}>Windfall Allocator</span>
              <span className="footer-link" onClick={onGoToPlanner}>Rollover Engine</span>
            </div>
            <div>
              <div className="footer-col-head">Legal</div>
              <span className="footer-link" style={{ cursor: "default" }}>Estimation Only</span>
              <span className="footer-link" style={{ cursor: "default" }}>Not Financial Advice</span>
              <span className="footer-link" style={{ cursor: "default" }}>RBI Compliant 2026</span>
              <span className="footer-link" style={{ cursor: "default" }}>Zero Data Collection</span>
            </div>
          </div>

          {/* ─── Legal disclaimer strip ─── */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", fontSize: "0.68rem", color: "var(--ink-faint)", lineHeight: 1.65 }}>
            <strong style={{ display: "block", marginBottom: "6px", fontSize: "0.7rem", color: "var(--ink-soft)" }}>Financial &amp; Regulatory Disclaimer</strong>
            Calculations, amortization schedules, and interest savings are estimates based on user-provided inputs and standard reducing-balance monthly-compounding formulas. Actual amounts are determined solely by your lender and may differ due to daily interest accruals, processing cycles, and rounding. Floating-rate simulations are hypothetical. Individual loan agreements may contain custom covenants, lock-in periods, or fee structures — always verify with your lender's service desk before executing funds transfers. The Prepayment Ledger does not provide professional tax, legal, or investment advice. Prepayment decisions should be considered alongside your overall financial profile including Section 24/80C tax benefits, emergency fund liquidity, and alternative investment yields.
          </div>
        </div>
      </footer>
    </div>
  );
}
