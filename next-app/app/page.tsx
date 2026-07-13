'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Homepage() {
  // QuickTeaserCalculator state
  const [principal, setPrincipal] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [extraMonthly, setExtraMonthly] = useState(10000);

  // Simple interest calculation helper
  const calculateSavings = () => {
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    
    // Standard EMI formula
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    if (isNaN(emi) || emi <= 0) return { interestSaved: 0, yearsSaved: 0 };

    // Simulating amortization schedule with and without extra prepayments
    let balanceBase = principal;
    let interestPaidBase = 0;
    for (let m = 0; m < totalMonths; m++) {
      const interest = balanceBase * monthlyRate;
      const principalPaid = emi - interest;
      interestPaidBase += interest;
      balanceBase -= principalPaid;
      if (balanceBase <= 0) break;
    }

    let balancePrepay = principal;
    let interestPaidPrepay = 0;
    let monthsPrepay = 0;
    while (balancePrepay > 0 && monthsPrepay < totalMonths) {
      const interest = balancePrepay * monthlyRate;
      let principalPaid = emi - interest + extraMonthly;
      if (principalPaid > balancePrepay) {
        principalPaid = balancePrepay;
      }
      interestPaidPrepay += interest;
      balancePrepay -= principalPaid;
      monthsPrepay++;
    }

    const interestSaved = Math.max(0, interestPaidBase - interestPaidPrepay);
    const yearsSaved = Math.max(0, (totalMonths - monthsPrepay) / 12);

    return {
      interestSaved: Math.round(interestSaved),
      yearsSaved: Number(yearsSaved.toFixed(1)),
    };
  };

  const { interestSaved, yearsSaved } = calculateSavings();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="container px-4 md:px-8 mx-auto grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              BECOME DEBT-FREE YEARS FASTER.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Don&apos;t let banks compound your mortgage. Track, optimize, and roll over your loans. Break free from the interest trap.
            </p>
            <div className="flex gap-4">
              <Link
                href="/planner"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-11 px-6"
              >
                Try Free Multi-Loan Planner ➔
              </Link>
            </div>
          </div>

          {/* Quick Teaser Calculator Widget */}
          <div className="md:col-span-5 bg-card text-card-foreground border rounded-lg shadow p-6 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Quick Prepayment Simulator</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Remaining Tenure (Years)
                  </label>
                  <input
                    type="number"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Extra Monthly Payment (₹)
                </label>
                <input
                  type="number"
                  value={extraMonthly}
                  onChange={(e) => setExtraMonthly(Number(e.target.value))}
                  className="w-full border-0 border-b-[1.5px] border-border rounded-none px-0.5 py-1.5 text-sm bg-transparent focus:border-b-2 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-muted border border-border rounded p-4 text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase">YOUR RESULTS</p>
              <div className="mt-1 space-y-1">
                <p className="text-lg font-bold" style={{ color: 'var(--emerald)' }}>
                  Interest Saved: ₹{interestSaved.toLocaleString('en-IN')}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Debt-Free Sooner: {yearsSaved} Years Saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-background border-b">
        <div className="container px-4 md:px-8 mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Why Use The Prepayment Ledger?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We provide math-driven debt structures to save you money, completely independent of lender bias.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-lg p-6 space-y-2">
              <div className="text-3xl">⚖️</div>
              <h3 className="font-bold text-lg">Asymmetry Exposed</h3>
              <p className="text-sm text-muted-foreground">
                Banks hide the impact of compounding early payments. We map out the exact interest savings line-by-line.
              </p>
            </div>
            <div className="border rounded-lg p-6 space-y-2">
              <div className="text-3xl">🔄</div>
              <h3 className="font-bold text-lg">Portfolio Rollover</h3>
              <p className="text-sm text-muted-foreground">
                Automatically roll over closed EMIs into your remaining loans to accelerate debt payoff without raising monthly budget.
              </p>
            </div>
            <div className="border rounded-lg p-6 space-y-2">
              <div className="text-3xl">⚡</div>
              <h3 className="font-bold text-lg">Windfall Optimizer</h3>
              <p className="text-sm text-muted-foreground">
                Allocate bonuses, stock sales, or inheritance across multiple loans mathematically to maximize your interest reduction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 bg-muted/20 border-b">
        <div className="container px-4 md:px-8 mx-auto max-w-3xl space-y-8">
          <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group border rounded-lg bg-background p-4" open>
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>Does prepaying home loans attract additional charges?</span>
                <span className="transition group-open:rotate-180">👇</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-2">
                Under RBI rules, individual borrowers with floating-rate home loans do not face prepayment charges. Non-individual borrowers or fixed-rate structures might attract penalties, which our platform flags automatically.
              </p>
            </details>
            <details className="group border rounded-lg bg-background p-4">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>What is the difference between Avalanche & Snowball strategies?</span>
                <span className="transition group-open:rotate-180">👇</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-2">
                The Avalanche method targets loans with the highest interest rates first, saving the most money. The Snowball method targets the smallest loan balances first, providing quick psychological wins as you clear accounts.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 mt-auto border-t">
        <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">The Prepayment Ledger</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/pricing" className="hover:underline">Pricing</Link>
            <Link href="/sample-report" className="hover:underline">Privacy Policy</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 The Prepayment Ledger. Built for financial sovereignty.
          </p>
        </div>
      </footer>
    </div>
  );
}
