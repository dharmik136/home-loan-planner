'use client';

import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function PricingPage() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const pricingTiers = [
    {
      name: 'THE LEDGER, FREE',
      price: currency === 'INR' ? '₹0' : '$0',
      period: 'forever',
      features: ['Model 2 Loans', 'Basic Schedules', 'Lender Rule checks', 'Local browser storage sync'],
      ctaText: 'Open a Free Ledger',
      isPopular: false,
    },
    {
      name: 'THE LEDGER, KEPT',
      price: currency === 'INR' ? '₹999' : '$19',
      period: 'one-time purchase',
      features: ['Model Unlimited Loans', 'Avalanche Rollovers', 'Windfall Optimizer', 'Detailed PDF Report Downloads', 'Priority email support'],
      ctaText: 'Keep the Full Ledger',
      isPopular: true,
    },
    {
      name: 'THE ADVISOR\'S LEDGER',
      price: currency === 'INR' ? '₹2,499' : '$49',
      period: 'monthly billing',
      features: ['Unlimited client logs', 'Custom Branded PDFs (White-Label)', 'Advisor Portal Access', 'Client CSV bulk uploads', 'Dedicated accounts support'],
      ctaText: 'Start the Advisor Plan',
      isPopular: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Pricing Hero */}
      <section className="py-12 md:py-16 text-center bg-muted/30 border-b">
        <div className="container px-4 md:px-8 mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight font-display">CHOOSE YOUR LEDGER</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Start with a free ledger, then unlock advanced multi-loan analysis and white-labeled report outputs when you are ready.
          </p>
          <div className="pt-2">
            <span className="text-xs text-muted-foreground font-semibold mr-2">CURRENCY:</span>
            <div className="inline-flex border rounded p-1 bg-background">
              <button
                onClick={() => setCurrency('INR')}
                className={`text-xs px-3 py-1 rounded font-bold transition-all ${
                  currency === 'INR' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`text-xs px-3 py-1 rounded font-bold transition-all ${
                  currency === 'USD' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Cards Container */}
      <section className="container px-4 md:px-8 mx-auto py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`border rounded-lg p-6 flex flex-col justify-between shadow-sm relative transition-all ${
                tier.isPopular ? 'lamplight-tier ring-2 ring-primary scale-105 md:scale-105' : 'bg-card'
              }`}
            >
              {tier.isPopular && (
                <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">/ {tier.period}</span>
                  </div>
                </div>

                <hr />

                <ul className="space-y-2 text-sm text-muted-foreground">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex gap-2 items-start">
                      <Check size={15} strokeWidth={2.5} className="text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => alert(`Redirecting to checkout for ${tier.name}`)}
                  className={`w-full inline-flex items-center justify-center rounded-md font-bold text-sm h-10 px-4 transition-all ${
                    tier.isPopular
                      ? 'border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground'
                      : 'border border-input bg-background hover:bg-accent text-foreground'
                  }`}
                >
                  {tier.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Feature Comparison Table */}
      <section className="container px-4 md:px-8 mx-auto py-8 border-t max-w-4xl">
        <h3 className="font-bold text-xl text-center mb-6">Detailed Feature Comparison</h3>
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b font-bold text-muted-foreground">
                <th className="p-3">Feature</th>
                <th className="p-3">Free Basic</th>
                <th className="p-3">Premium Solo</th>
                <th className="p-3">Professional</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-semibold">Model Limit</td>
                <td className="p-3 text-muted-foreground">2 Loans</td>
                <td className="p-3">Unlimited</td>
                <td className="p-3">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-semibold">CSV Amortization Export</td>
                <td className="p-3 text-muted-foreground">No</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-semibold">White-Label Custom Logo</td>
                <td className="p-3 text-muted-foreground">No</td>
                <td className="p-3 text-muted-foreground">No</td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="container px-4 md:px-8 mx-auto py-12 border-t max-w-2xl">
        <h3 className="font-bold text-xl text-center mb-6">Pricing FAQ</h3>
        <div className="space-y-4">
          <details className="group border rounded-lg bg-card p-4">
            <summary className="font-semibold cursor-pointer list-none flex justify-between items-center text-sm">
              <span>Is there a monthly subscription fee for Premium Solo?</span>
              <ChevronDown size={18} className="transition group-open:rotate-180 shrink-0" />
            </summary>
            <p className="text-xs text-muted-foreground mt-2">
              No. Premium Solo is a one-time lifetime license purchase. You get full access to unlimited loan calculations, optimizers, and PDF downloads forever.
            </p>
          </details>
          <details className="group border rounded-lg bg-card p-4">
            <summary className="font-semibold cursor-pointer list-none flex justify-between items-center text-sm">
              <span>Can I upgrade from Premium to Professional Advisor?</span>
              <ChevronDown size={18} className="transition group-open:rotate-180 shrink-0" />
            </summary>
            <p className="text-xs text-muted-foreground mt-2">
              Yes, you can upgrade at any time from your account settings page. We will prorate any payment you have already made.
            </p>
          </details>
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
