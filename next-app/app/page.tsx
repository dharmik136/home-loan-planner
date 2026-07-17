'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  ChartNoAxesCombined,
  Check,
  IndianRupee,
  LockKeyhole,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildSchedule, compare, monthlyEmi } from '../engine/amortization';
import { formatCompactINR, formatDuration, formatINR } from '../engine/format';

interface TooltipPayload {
  dataKey?: string;
  value?: number;
  color?: string;
}

function PayoffTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="home-chart-tooltip">
      <strong>Year {label}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey}>
          <i style={{ background: entry.color }} />
          {entry.dataKey === 'baseline' ? 'Minimum EMI' : 'Your plan'}
          <b>{formatCompactINR(Number(entry.value || 0))}</b>
        </span>
      ))}
    </div>
  );
}

function ModelField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="home-model-field">
      <span>{label}</span>
      <div className="home-number-control">
        {prefix && <b>{prefix}</b>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))}
        />
        {suffix && <b>{suffix}</b>}
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} slider`}
      />
    </label>
  );
}

const capabilityRows = [
  ['Portfolio strategy', 'Compare avalanche and snowball rollovers across multiple loans.'],
  ['Prepayment scenarios', 'Model recurring payments, lump sums, step-ups, and windfalls.'],
  ['Indian lending rules', 'Check common floating-rate and lender-specific constraints.'],
  ['Decision tools', 'Stress-test rates, tax savings, balance transfers, and rent vs buy.'],
];

export default function Homepage() {
  const [principal, setPrincipal] = useState(5_000_000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [extraMonthly, setExtraMonthly] = useState(10_000);

  const model = useMemo(() => {
    const months = Math.max(12, tenureYears * 12);
    const emi = monthlyEmi(principal, interestRate, months);
    const baseline = buildSchedule(principal, interestRate, months, emi);
    const plan = buildSchedule(principal, interestRate, months, emi + extraMonthly);
    const comparison = compare(baseline, plan);
    const chartData = baseline.rows
      .filter((row) => row.month === 1 || row.month % 12 === 0 || row.month === baseline.rows.length)
      .map((row) => ({
        year: Math.max(1, Math.ceil(row.month / 12)),
        baseline: row.closing,
        plan: plan.rows[row.month - 1]?.closing ?? 0,
      }));
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + comparison.planMonths);

    return {
      emi,
      planPayment: emi + extraMonthly,
      comparison,
      chartData,
      payoffDate: payoffDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      interestReductionPct: comparison.baselineInterest > 0
        ? Math.round((comparison.interestSaved / comparison.baselineInterest) * 100)
        : 0,
    };
  }, [extraMonthly, interestRate, principal, tenureYears]);

  return (
    <main className="home-page">
      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-intro-copy">
          <span className="home-eyebrow"><BadgeCheck size={15} /> Built for Indian home loans</span>
          <h1 id="home-title">Home loan payoff planner</h1>
          <p>
            See exactly how an extra payment changes your interest, payoff date, and monthly path.
            Then build the complete plan across every loan you carry.
          </p>
          <div className="home-intro-actions">
            <Link href="/planner" className="primary-action">Build my full plan <ArrowRight size={17} /></Link>
            <Link href="/calculator" className="secondary-action">Open single-loan calculator</Link>
          </div>
        </div>
        <div className="home-trust-line" aria-label="Product safeguards">
          <span><LockKeyhole size={16} /> Browser-first calculations</span>
          <span><ChartNoAxesCombined size={16} /> Reducing-balance model</span>
          <span><BadgeCheck size={16} /> No bank login required</span>
        </div>
      </section>

      <section className="home-model" aria-labelledby="quick-model-title">
        <div className="home-model-sidebar">
          <div className="home-section-heading">
            <span><SlidersHorizontal size={17} /> Quick model</span>
            <h2 id="quick-model-title">Adjust your loan</h2>
            <p>Results update as you move each input.</p>
          </div>
          <div className="home-model-fields">
            <ModelField label="Outstanding balance" value={principal} onChange={setPrincipal} min={500_000} max={30_000_000} step={100_000} prefix="₹" />
            <ModelField label="Interest rate" value={interestRate} onChange={setInterestRate} min={5} max={16} step={0.05} suffix="%" />
            <ModelField label="Remaining tenure" value={tenureYears} onChange={setTenureYears} min={3} max={30} step={1} suffix="years" />
            <ModelField label="Extra each month" value={extraMonthly} onChange={setExtraMonthly} min={0} max={100_000} step={1_000} prefix="₹" />
          </div>
          <div className="home-payment-summary">
            <span>Minimum EMI <b>{formatINR(model.emi)}</b></span>
            <span>Planned monthly payment <b>{formatINR(model.planPayment)}</b></span>
          </div>
        </div>

        <div className="home-model-results">
          <div className="home-results-topline">
            <div>
              <span className="home-eyebrow"><Sparkles size={15} /> Your projected outcome</span>
              <h2>{formatCompactINR(model.comparison.interestSaved)} less interest</h2>
              <p>{model.interestReductionPct}% below the minimum-EMI path.</p>
            </div>
            <Link href="/planner" className="result-link">Use these insights <ArrowRight size={16} /></Link>
          </div>

          <div className="home-result-stats">
            <div>
              <TrendingDown size={18} />
              <span>Debt-free sooner</span>
              <strong>{formatDuration(model.comparison.monthsSaved)}</strong>
            </div>
            <div>
              <CalendarCheck2 size={18} />
              <span>New payoff date</span>
              <strong>{model.payoffDate}</strong>
            </div>
            <div>
              <IndianRupee size={18} />
              <span>Interest still payable</span>
              <strong>{formatCompactINR(model.comparison.planInterest)}</strong>
            </div>
          </div>

          <div className="home-chart" aria-label="Outstanding loan balance over time">
            <div className="home-chart-heading">
              <div>
                <strong>Outstanding balance</strong>
                <span>Minimum EMI compared with your plan</span>
              </div>
              <div className="home-chart-legend">
                <span><i className="baseline" /> Minimum EMI</span>
                <span><i className="plan" /> Your plan</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={model.chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--experience-grid)" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tickFormatter={(year) => `Y${year}`} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactINR(Number(value)).replace('₹', '')} width={54} />
                <Tooltip content={<PayoffTooltip />} />
                <Area type="monotone" dataKey="baseline" stroke="var(--experience-baseline)" fill="var(--experience-baseline)" fillOpacity={0.07} strokeWidth={2} />
                <Area type="monotone" dataKey="plan" stroke="var(--experience-primary)" fill="var(--experience-primary)" fillOpacity={0.11} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="home-capabilities" aria-labelledby="capabilities-title">
        <div className="home-capability-intro">
          <span className="home-eyebrow">Beyond a basic EMI calculator</span>
          <h2 id="capabilities-title">One workspace for the decisions around your loan.</h2>
          <p>Start with the payoff curve, then go deeper only when the decision requires it.</p>
          <Link href="/planner" className="text-action">Explore the workspace <ArrowRight size={16} /></Link>
        </div>
        <div className="home-capability-list">
          {capabilityRows.map(([title, detail], index) => (
            <div key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{title}</strong>
              <p>{detail}</p>
              <Check size={18} aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      <section className="home-method" aria-label="Methodology and privacy">
        <div>
          <LockKeyhole size={20} />
          <strong>Private by default</strong>
          <p>Your calculations begin in the browser. Cloud sharing is optional when Supabase is configured.</p>
        </div>
        <div>
          <ChartNoAxesCombined size={20} />
          <strong>Auditable math</strong>
          <p>Schedules use a month-by-month reducing-balance engine with downloadable rows.</p>
        </div>
        <div>
          <BadgeCheck size={20} />
          <strong>Built for decisions</strong>
          <p>Every result compares your plan against the same minimum-EMI baseline.</p>
        </div>
      </section>

      <footer className="home-footer">
        <span>The Prepayment Ledger</span>
        <p>Planning estimates, not financial advice. Confirm current terms with your lender.</p>
        <div><Link href="/about">About</Link><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/sample-report">Report preview</Link></div>
      </footer>
    </main>
  );
}
