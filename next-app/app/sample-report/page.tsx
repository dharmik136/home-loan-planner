'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Download } from 'lucide-react';

export default function SampleReportPage() {
  const [clientName, setClientName] = useState('Mr. & Mrs. Sharma');
  const [advisorName, setAdvisorName] = useState('Acme Wealth Management');
  const [themeColor, setThemeColor] = useState('#2563eb'); // blue default

  return (
    <div className="flex flex-col min-h-screen">
      {/* Control Banner */}
      <section className="bg-muted/40 border-b py-4">
        <div className="container px-4 md:px-8 mx-auto grid md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Advisor Branding</label>
            <input
              type="text"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              className="w-full border rounded px-2.5 py-1 text-xs bg-background mt-1"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full border rounded px-2.5 py-1 text-xs bg-background mt-1"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Mockup Theme Color</label>
            <div className="flex gap-2 mt-1">
              {['#2563eb', '#16a34a', '#dc2626', '#7c3aed'].map((c) => (
                <button
                  key={c}
                  onClick={() => setThemeColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    themeColor === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="container px-4 md:px-8 mx-auto py-8 grid lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Web PDF Viewer Mockup */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border rounded-lg shadow-lg bg-white text-black p-8 md:p-12 space-y-8 font-serif min-h-[700px] flex flex-col justify-between">
            {/* Cover Page Header Section */}
            <div className="border-b-4 pb-6 flex justify-between items-start" style={{ borderColor: themeColor }}>
              <div>
                <p className="text-xs uppercase font-sans font-bold tracking-widest text-muted-foreground">
                  Personal Debt Payoff Report
                </p>
                <h2 className="text-2xl md:text-3xl font-bold font-sans mt-1">
                  The Prepayment Ledger
                </h2>
              </div>
              <div className="text-right font-sans">
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: themeColor }}>
                  PREMIUM REPORT
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">Prepared by: {advisorName}</p>
              </div>
            </div>

            {/* Cover Info Section */}
            <div className="space-y-6 flex-1 py-8">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-sans">PREPARED FOR</p>
                <h3 className="text-xl md:text-2xl font-bold font-sans text-slate-800">{clientName}</h3>
                <p className="text-xs text-muted-foreground font-sans">Date: {new Date().toLocaleDateString()}</p>
              </div>

              {/* Executive Summary Block */}
              <div className="border rounded p-6 bg-slate-50 space-y-4 font-sans text-slate-800">
                <h4 className="font-bold border-b pb-1.5 text-sm uppercase tracking-wider text-slate-600">
                  Executive Summary
                </h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Acme Wealth Management has structured a comprehensive multi-loan rollover prepayment program.
                  By prioritizing high-interest debt avalanche structures and allocating systematic prepayments,
                  the portfolio payoff timeline is optimized dramatically.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div className="border-l-4 pl-3" style={{ borderLeftColor: themeColor }}>
                    <p className="text-[10px] text-muted-foreground uppercase">Combined Interest Saved</p>
                    <p className="text-base font-bold">₹14,20,110</p>
                  </div>
                  <div className="border-l-4 pl-3" style={{ borderLeftColor: themeColor }}>
                    <p className="text-[10px] text-muted-foreground uppercase">Debt-Free Sooner</p>
                    <p className="text-base font-bold">5 Yrs, 2 Mos</p>
                  </div>
                  <div className="border-l-4 pl-3 hidden md:block" style={{ borderLeftColor: themeColor }}>
                    <p className="text-[10px] text-muted-foreground uppercase">Rollover Strategy</p>
                    <p className="text-base font-bold">Avalanche</p>
                  </div>
                </div>
              </div>

              {/* Portfolio Snapshot Section */}
              <div className="space-y-3 font-sans">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                  Debt Balance Snapshot
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs border-b pb-1.5">
                    <span>Home Mortgage (8.5% Rate)</span>
                    <span className="font-mono">₹48,12,000</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b pb-1.5">
                    <span>Auto Car Loan (9.2% Rate)</span>
                    <span className="font-mono">₹6,40,000</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold border-b pb-1.5">
                    <span>Total Outstanding Portfolio Balance</span>
                    <span className="font-mono">₹54,52,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Report Footer info */}
            <div className="border-t pt-4 flex justify-between items-center text-[10px] text-muted-foreground font-sans">
              <span>Independent financial analysis by The Prepayment Ledger</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        </div>

        {/* Right Column: Features Pitch Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border rounded-lg p-6 bg-card space-y-4 shadow-sm">
            <h3 className="font-bold text-lg border-b pb-2">Why Advisors Use These Reports</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: 'var(--emerald)' }} />
                <span><strong>Build Instant Authority:</strong> Deliver beautifully styled PDFs under your own brand name.</span>
              </li>
              <li className="flex gap-2">
                <Check size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: 'var(--emerald)' }} />
                <span><strong>Explain Jargon Visually:</strong> Break down complex compounding structures in easy-to-read ledgers.</span>
              </li>
              <li className="flex gap-2">
                <Check size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: 'var(--emerald)' }} />
                <span><strong>Clear Interest Comparisons:</strong> Show clients exactly how much money they save on interest.</span>
              </li>
              <li className="flex gap-2">
                <Check size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: 'var(--emerald)' }} />
                <span><strong>Actionable Guides:</strong> Create printable calendar schedules for monthly prepayment transactions.</span>
              </li>
            </ul>
            <div className="pt-4 border-t space-y-3">
              <button
                onClick={() => alert('PDF report generating stream initialized. Check downloads.')}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md font-bold text-sm border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-9 px-4"
              >
                Download Sample PDF Document <Download size={14} />
              </button>
              <Link
                href="/pricing"
                className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-accent-foreground font-semibold text-xs h-9 px-4"
              >
                Sign up for White-Label Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

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
