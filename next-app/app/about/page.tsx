'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  // ContactFeedbackForm state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert('Please fill out all fields.');
      return;
    }
    setSubmitting(true);
    // Simulate contact form submission
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Story Hero Section */}
      <section className="py-16 md:py-20 bg-muted/30 border-b">
        <div className="container px-4 md:px-8 mx-auto text-center space-y-4 max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">THE STORY BEHIND THE LEDGER</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Most people don&apos;t know that banks profit when they stay in debt. When interest rates rise, lenders often quietly extend your loan tenure without notifying you, generating massive additional compound interest. We wanted to build a tool that puts the mathematical control back in the consumer&apos;s hands.
          </p>
        </div>
      </section>

      {/* Transparency Charter Section */}
      <section className="container px-4 md:px-8 mx-auto py-16 border-b max-w-4xl space-y-8">
        <h2 className="text-3xl font-bold text-center">OUR TRANSPARENCY CHARTER</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-2 border-l-4 pl-4 border-primary">
            <h3 className="font-bold text-lg">1. No Bank Sponsorships</h3>
            <p className="text-sm text-muted-foreground">
              We never receive referral commissions or kickbacks for promoting specific bank loans. Our calculations remain completely objective.
            </p>
          </div>
          <div className="space-y-2 border-l-4 pl-4 border-primary">
            <h3 className="font-bold text-lg">2. Mathematical Objectivity</h3>
            <p className="text-sm text-muted-foreground">
              Every formula and calculation rule matches verified actuarial models. You can reproduce every single prepayment ledger cell inside Microsoft Excel.
            </p>
          </div>
          <div className="space-y-2 border-l-4 pl-4 border-primary">
            <h3 className="font-bold text-lg">3. Absolute Data Privacy</h3>
            <p className="text-sm text-muted-foreground">
              We never sell your financial profiles or transaction inputs to credit bureaus, advertisers, or third-party lead generation aggregators.
            </p>
          </div>
        </div>
      </section>

      {/* Contact/Feedback Form Section */}
      <section className="container px-4 md:px-8 mx-auto py-16 max-w-md">
        <div className="border rounded-lg p-6 bg-card shadow-sm space-y-4">
          <h3 className="font-bold text-xl border-b pb-2">GET IN TOUCH / REPORT AN ISSUE</h3>
          
          {success ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded text-xs text-center font-medium" style={{ background: 'var(--emerald-wash)', border: '1px solid var(--emerald)', color: 'var(--emerald)' }}>
              <CheckCircle2 size={16} className="shrink-0" />
              Thank you! Your feedback message has been logged successfully.
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dharma"
                  className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Message / Issue description
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your feedback..."
                  rows={4}
                  className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-md font-bold text-sm border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-10 px-4 disabled:opacity-55"
              >
                {submitting ? 'Submitting...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Public Footer */}
      <footer className="bg-muted py-8 mt-auto border-t">
        <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">The Prepayment Ledger</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 The Prepayment Ledger. Built for financial sovereignty.
          </p>
        </div>
      </footer>
    </div>
  );
}
