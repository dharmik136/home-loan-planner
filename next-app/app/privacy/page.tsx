import Link from 'next/link';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="truth-page">
      <section className="truth-hero">
        <span className="home-eyebrow"><LockKeyhole size={16} /> Privacy</span>
        <h1>What stays local, and what can be shared.</h1>
        <p>This notice describes the data behavior of the current public beta.</p>
      </section>

      <section className="policy-copy">
        <article>
          <h2>Calculations</h2>
          <p>Loan inputs and calculations run in your browser. The planner also uses browser storage so your working state can survive a refresh.</p>
        </article>
        <article>
          <h2>Snapshot sharing</h2>
          <p>Saving a cloud snapshot is optional. When Supabase is configured, that action sends the email you enter, newsletter preference, calculated savings, loan inputs, and prepayment entries to the project database.</p>
        </article>
        <article>
          <h2>Local fallback</h2>
          <p>If cloud storage is unavailable, the app stores a local record with the email removed. Exporting JSON or CSV creates a file directly in your browser.</p>
        </article>
        <article>
          <h2>Removal requests</h2>
          <p>The current beta does not yet provide a self-service deletion screen. Request removal through the public issue tracker without posting your financial data; the maintainer can arrange a private verification channel.</p>
          <Link href="https://github.com/dharmik136/home-loan-planner/issues" target="_blank" rel="noreferrer">
            Open the issue tracker <ArrowUpRight size={15} />
          </Link>
        </article>
      </section>
    </main>
  );
}
