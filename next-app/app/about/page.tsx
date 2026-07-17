import Link from 'next/link';
import { ArrowUpRight, GitBranch, ShieldCheck } from 'lucide-react';

const principles = [
  ['No lender incentives', 'The planner does not rank or promote loans in exchange for lender commissions.'],
  ['Reproducible calculations', 'The amortization engine is checked against the workbook and automated unit tests.'],
  ['Explicit data boundaries', 'Calculations begin locally; cloud snapshot sharing is a separate, visible action.'],
];

export default function AboutPage() {
  return (
    <main className="truth-page">
      <section className="truth-hero">
        <span className="home-eyebrow"><ShieldCheck size={16} /> Why this exists</span>
        <h1>Clear loan math, without lender bias.</h1>
        <p>
          A small prepayment can change years of interest, but most repayment statements make that
          effect difficult to see. The Prepayment Ledger turns those choices into an auditable plan.
        </p>
      </section>

      <section className="principle-list" aria-label="Project principles">
        {principles.map(([title, detail], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{title}</h2>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="truth-note">
        <GitBranch size={22} />
        <div>
          <strong>Found a problem or have a suggestion?</strong>
          <p>Use the public GitHub issue tracker so the report is recorded and its resolution stays visible.</p>
          <Link href="https://github.com/dharmik136/home-loan-planner/issues" target="_blank" rel="noreferrer">
            Open the issue tracker <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
