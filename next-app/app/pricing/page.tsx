import Link from 'next/link';
import { ArrowRight, Check, CircleDollarSign, ShieldCheck } from 'lucide-react';

const included = [
  'Multi-loan portfolio planning',
  'Prepayment and rollover scenarios',
  'Month-by-month schedules and charts',
  'CSV and JSON export',
  'Windfall, tax, rate-shock, and transfer tools',
  'Optional Supabase snapshot sharing',
];

export default function PricingPage() {
  return (
    <main className="truth-page">
      <section className="truth-hero">
        <span className="home-eyebrow"><CircleDollarSign size={16} /> Public beta</span>
        <h1>The complete planner is free today.</h1>
        <p>
          There is no checkout, subscription, or paid feature gate in the current release.
          Every planning tool shown in the workspace is available without a purchase.
        </p>
        <Link href="/planner" className="primary-action">Open the planner <ArrowRight size={17} /></Link>
      </section>

      <section className="truth-content" aria-labelledby="included-title">
        <div>
          <span className="home-eyebrow">Current release</span>
          <h2 id="included-title">Everything available now</h2>
          <p>The project is being validated in public before any commercial plan is introduced.</p>
        </div>
        <ul>
          {included.map((feature) => <li key={feature}><Check size={17} /> {feature}</li>)}
        </ul>
      </section>

      <section className="truth-note">
        <ShieldCheck size={22} />
        <div>
          <strong>No payment details are collected.</strong>
          <p>If pricing is introduced later, this page will show the real terms and checkout flow before any paid claim appears elsewhere.</p>
        </div>
      </section>
    </main>
  );
}
