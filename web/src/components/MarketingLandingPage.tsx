import { useMemo, useState } from "react";
import { buildSchedule, compare, monthlyEmi } from "../engine/amortization";
import { formatCompactINR, formatDuration, formatINR } from "../engine/format";

interface MarketingLandingPageProps {
  onGoToPlanner: () => void;
  onOpenPaywall: () => void;
}

const WORKFLOW = [
  { label: "Enter loans", detail: "Add balances, rates, tenures, start month, and lender rules." },
  { label: "Add payments", detail: "Test one-time, recurring, step-up, or extra EMI plans." },
  { label: "Compare outcome", detail: "Review saved interest, payoff date, and monthly schedule." },
  { label: "Save or export", detail: "Download CSV/JSON or save a snapshot for later follow-up." },
];

const CHECKS = [
  "Rate shock and balance-transfer break-even",
  "Section 24 and 80C tax deduction estimates",
  "Rent vs buy, stamp duty, and eligibility calculators",
  "Local storage first, optional Supabase lead capture",
];

export function MarketingLandingPage({ onGoToPlanner, onOpenPaywall }: MarketingLandingPageProps) {
  const [principal, setPrincipal] = useState(5_000_000);
  const [rate, setRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [prepayAmount, setPrepayAmount] = useState(300_000);
  const [prepayMonth, setPrepayMonth] = useState(18);
  const effectivePrepayMonth = Math.min(prepayMonth, tenureYears * 12);

  const model = useMemo(() => {
    const tenureMonths = tenureYears * 12;
    const emi = monthlyEmi(principal, rate, tenureMonths);
    const baseline = buildSchedule(principal, rate, tenureMonths, emi);
    const plan = buildSchedule(principal, rate, tenureMonths, emi, { [effectivePrepayMonth]: prepayAmount });
    const comparison = compare(baseline, plan);
    const firstYear = plan.rows.slice(0, 12);
    const firstYearInterest = firstYear.reduce((sum, row) => sum + row.interest, 0);
    const firstYearPrincipal = firstYear.reduce((sum, row) => sum + row.principalPaid, 0);
    const firstYearTotal = Math.max(firstYearInterest + firstYearPrincipal, 1);

    return {
      emi,
      comparison,
      planInterest: Math.round(plan.totalInterest),
      baselineInterest: Math.round(baseline.totalInterest),
      firstYearInterestPct: Math.round((firstYearInterest / firstYearTotal) * 100),
      firstYearPrincipalPct: Math.round((firstYearPrincipal / firstYearTotal) * 100),
    };
  }, [effectivePrepayMonth, prepayAmount, principal, rate, tenureYears]);

  return (
    <div className="product-page">
      <header className="product-topbar">
        <button type="button" className="brand-mark" onClick={onGoToPlanner}>
          <span>LP</span>
          <strong>Loan Plan Workspace</strong>
        </button>
        <nav aria-label="Product actions">
          <button type="button" className="btn ghost" onClick={onOpenPaywall}>Save snapshot</button>
          <button type="button" id="hero-cta-free" className="btn" onClick={onGoToPlanner}>Open planner</button>
        </nav>
      </header>

      <main>
        <section className="product-workbench" aria-labelledby="workspace-title">
          <div className="product-intro">
            <span className="product-eyebrow">Browser-based home loan planning</span>
            <h1 id="workspace-title">Model a payoff plan. Before you prepay.</h1>
            <p>
              Compare EMI-only repayment with extra payments, rate changes, taxes, and lender rules.
              The planner works from your inputs and does not require a bank login.
            </p>
          </div>

          <div className="loan-model-grid">
            <div className="planner-controls" aria-label="Quick loan model controls">
              <label>
                <span>Outstanding balance</span>
                <strong>{formatINR(principal)}</strong>
                <input
                  type="range"
                  min={1_000_000}
                  max={15_000_000}
                  step={100_000}
                  value={principal}
                  onChange={(event) => setPrincipal(Number(event.target.value))}
                />
              </label>

              <label>
                <span>Interest rate</span>
                <strong>{rate.toFixed(2)}% p.a.</strong>
                <input
                  type="range"
                  min={6}
                  max={14}
                  step={0.05}
                  value={rate}
                  onChange={(event) => setRate(Number(event.target.value))}
                />
              </label>

              <label>
                <span>Remaining tenure</span>
                <strong>{tenureYears} years</strong>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(event) => setTenureYears(Number(event.target.value))}
                />
              </label>

              <label>
                <span>Lump-sum payment</span>
                <strong>{formatINR(prepayAmount)}</strong>
                <input
                  type="range"
                  min={0}
                  max={1_500_000}
                  step={25_000}
                  value={prepayAmount}
                  onChange={(event) => setPrepayAmount(Number(event.target.value))}
                />
              </label>

              <label>
                <span>Payment month</span>
                <strong>Month {effectivePrepayMonth}</strong>
                <input
                  type="range"
                  min={2}
                  max={Math.max(tenureYears * 12, 2)}
                  step={1}
                  value={effectivePrepayMonth}
                  onChange={(event) => setPrepayMonth(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="result-console" aria-label="Quick model result">
              <div className="console-head">
                <span>Quick result</span>
                <b>Reducing-balance model</b>
              </div>
              <div className="console-metrics">
                <div>
                  <span>Monthly EMI</span>
                  <strong>{formatINR(model.emi)}</strong>
                </div>
                <div>
                  <span>Interest saved</span>
                  <strong>{formatCompactINR(Math.max(model.comparison.interestSaved, 0))}</strong>
                </div>
                <div>
                  <span>Time saved</span>
                  <strong>{formatDuration(Math.max(model.comparison.monthsSaved, 0))}</strong>
                </div>
              </div>

              <div className="payoff-bars" aria-label="First year EMI split">
                <div className="bar-row">
                  <span>Interest</span>
                  <div><i style={{ width: `${model.firstYearInterestPct}%` }} /></div>
                  <b>{model.firstYearInterestPct}%</b>
                </div>
                <div className="bar-row principal">
                  <span>Principal</span>
                  <div><i style={{ width: `${model.firstYearPrincipalPct}%` }} /></div>
                  <b>{model.firstYearPrincipalPct}%</b>
                </div>
              </div>

              <p className="console-note">
                Baseline interest {formatCompactINR(model.baselineInterest)}. Planned interest {formatCompactINR(model.planInterest)}.
              </p>
            </div>
          </div>
        </section>

        <section className="product-section workflow-strip" aria-labelledby="workflow-title">
          <div>
            <span className="product-eyebrow">Workflow</span>
            <h2 id="workflow-title">A short path from inputs to an exportable plan.</h2>
          </div>
          <div className="workflow-cards">
            {WORKFLOW.map((item, index) => (
              <article key={item.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="product-section check-grid" aria-labelledby="checks-title">
          <div>
            <span className="product-eyebrow">Coverage</span>
            <h2 id="checks-title">Built for practical loan decisions.</h2>
            <p>
              Use the full planner when the quick model is not enough. It supports multiple loans,
              prepayment rules, payoff schedules, CSV export, and saved plan records.
            </p>
          </div>
          <ul>
            {CHECKS.map((check) => <li key={check}>{check}</li>)}
          </ul>
        </section>

        <section className="product-section privacy-panel" aria-labelledby="privacy-title">
          <div>
            <span className="product-eyebrow">Privacy</span>
            <h2 id="privacy-title">The planner starts locally.</h2>
            <p>
              Calculations run in the browser. Saving a snapshot stores a local record by default and
              can sync to Supabase only when the project environment is configured.
            </p>
          </div>
          <button type="button" className="btn" onClick={onGoToPlanner}>Start planning</button>
        </section>
      </main>
    </div>
  );
}
