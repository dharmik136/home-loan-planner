'use client';

import React, { useState, useMemo } from 'react';

// Types definition
interface LoanData {
  principal: number;
  rate: number;
  tenureYears: number;
  monthlyPrepay: number;
  lumpSum: number;
  lumpSumMonth: number;
  ruleset: 'NONE' | 'RBI_FLOATING' | 'HDFC' | 'CUSTOM';
}

export default function CalculatorPage() {
  // Page state
  const [loan, setLoan] = useState<LoanData>({
    principal: 4500000,
    rate: 9.1,
    tenureYears: 15,
    monthlyPrepay: 5000,
    lumpSum: 200000,
    lumpSumMonth: 12,
    ruleset: 'HDFC',
  });

  const [ruleWarning, setRuleWarning] = useState<string | null>(null);

  // Math engines
  const emiAndSchedules = useMemo(() => {
    const r = loan.rate / 100 / 12;
    const n = loan.tenureYears * 12;
    const baseEmi = (loan.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    if (isNaN(baseEmi) || baseEmi <= 0) {
      return {
        baseEmi: 0,
        baselineSchedule: [],
        prepaySchedule: [],
        interestSaved: 0,
        monthsSaved: 0,
        newPayoffDate: '',
      };
    }

    // 1. Baseline Schedule
    let balBase = loan.principal;
    let interestBaseTotal = 0;
    const baselineSchedule = [];
    
    for (let month = 1; month <= n; month++) {
      const interest = balBase * r;
      let principalPaid = baseEmi - interest;
      if (principalPaid > balBase) {
        principalPaid = balBase;
      }
      interestBaseTotal += interest;
      balBase -= principalPaid;
      
      baselineSchedule.push({
        month,
        emi: baseEmi,
        prepay: 0,
        interest,
        principalPaid,
        outstanding: Math.max(0, balBase),
      });
      if (balBase <= 0) break;
    }

    // 2. Prepay Schedule with lender rules check
    let balPrepay = loan.principal;
    let interestPrepayTotal = 0;
    const prepaySchedule = [];
    let warningTriggered = false;
    let warningMsg = null;

    // Tracker for annual HDFC 75% limit check
    let annualPrepayTotal = 0;
    const hdfcMaxAnnualLimit = loan.principal * 0.75;

    for (let month = 1; month <= n; month++) {
      if (balPrepay <= 0) break;

      const interest = balPrepay * r;
      let regularPrincipal = baseEmi - interest;
      if (regularPrincipal > balPrepay) regularPrincipal = balPrepay;

      // Add prepayments
      let prepaymentMade = loan.monthlyPrepay;
      if (month === loan.lumpSumMonth) {
        prepaymentMade += loan.lumpSum;
      }

      // Check rulesets
      if (loan.ruleset === 'HDFC') {
        // Track calendar/annual limits
        if (month % 12 === 1) {
          annualPrepayTotal = 0; // Reset every 12 months
        }
        
        if (annualPrepayTotal + prepaymentMade > hdfcMaxAnnualLimit) {
          warningTriggered = true;
          warningMsg = `HDFC Rule Alert: Prepayment total of ₹${(annualPrepayTotal + prepaymentMade).toLocaleString('en-IN')} exceeds 75% opening principal limit (₹${hdfcMaxAnnualLimit.toLocaleString('en-IN')}) at Month ${month}.`;
          prepaymentMade = Math.max(0, hdfcMaxAnnualLimit - annualPrepayTotal);
        }
        annualPrepayTotal += prepaymentMade;
      }

      let totalPrincipalPaid = regularPrincipal + prepaymentMade;
      if (totalPrincipalPaid > balPrepay) {
        prepaymentMade = Math.max(0, balPrepay - regularPrincipal);
        totalPrincipalPaid = balPrepay;
      }

      interestPrepayTotal += interest;
      balPrepay -= totalPrincipalPaid;

      prepaySchedule.push({
        month,
        emi: baseEmi,
        prepay: prepaymentMade,
        interest,
        principalPaid: totalPrincipalPaid,
        outstanding: Math.max(0, balPrepay),
      });
    }

    const interestSaved = Math.max(0, interestBaseTotal - interestPrepayTotal);
    const monthsSaved = Math.max(0, baselineSchedule.length - prepaySchedule.length);

    // Calculate dates
    const dateObj = new Date();
    dateObj.setMonth(dateObj.getMonth() + prepaySchedule.length);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };
    const newPayoffDate = dateObj.toLocaleDateString('en-US', options);

    return {
      baseEmi,
      baselineSchedule,
      prepaySchedule,
      interestSaved,
      monthsSaved,
      newPayoffDate,
      warningMsg,
    };
  }, [loan]);

  // Export to CSV helper
  const handleCSVExport = () => {
    const headers = 'Month,Base EMI,Prepayment Paid,Interest Paid,Outstanding Balance\n';
    const rows = emiAndSchedules.prepaySchedule
      .map(
        (m) =>
          `${m.month},${Math.round(m.emi)},${Math.round(m.prepay)},${Math.round(m.interest)},${Math.round(
            m.outstanding
          )}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'amortization_schedule.csv');
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Single Loan Prepayment Simulator</h1>
          <p className="text-muted-foreground text-sm">
            Model individual loan prepayments conforming to lender regulations.
          </p>
        </div>
        <button
          onClick={handleCSVExport}
          className="inline-flex items-center justify-center rounded-md text-xs font-semibold border bg-background hover:bg-accent h-8 px-3"
        >
          Export Amortization CSV 📥
        </button>
      </div>

      {/* Rules warning Banner */}
      {emiAndSchedules.warningMsg && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-md text-xs font-medium">
          ⚠️ {emiAndSchedules.warningMsg}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border rounded-lg p-6 bg-card space-y-4 shadow-sm">
            <h3 className="font-bold text-base border-b pb-2">Loan Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={loan.principal}
                  onChange={(e) => setLoan({ ...loan, principal: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loan.rate}
                    onChange={(e) => setLoan({ ...loan, rate: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    value={loan.tenureYears}
                    onChange={(e) => setLoan({ ...loan, tenureYears: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card space-y-4 shadow-sm">
            <h3 className="font-bold text-base border-b pb-2">Prepayment Parameters</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Lender Ruleset
                </label>
                <select
                  value={loan.ruleset}
                  onChange={(e) => setLoan({ ...loan, ruleset: e.target.value as LoanData['ruleset'] })}
                  className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                >
                  <option value="NONE">No Constraints (Theoretical)</option>
                  <option value="RBI_FLOATING">RBI Floating Rate Rules</option>
                  <option value="HDFC">HDFC Bank rules (75% Cap)</option>
                  <option value="CUSTOM">Custom restrictions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Scheduled Monthly Prepayment (₹)
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={loan.monthlyPrepay}
                    onChange={(e) => setLoan({ ...loan, monthlyPrepay: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={loan.monthlyPrepay}
                    onChange={(e) => setLoan({ ...loan, monthlyPrepay: Number(e.target.value) })}
                    className="w-24 border rounded px-2 py-1 text-sm bg-background text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Lump Sum Prepay (₹)
                  </label>
                  <input
                    type="number"
                    value={loan.lumpSum}
                    onChange={(e) => setLoan({ ...loan, lumpSum: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Target Month
                  </label>
                  <input
                    type="number"
                    value={loan.lumpSumMonth}
                    onChange={(e) => setLoan({ ...loan, lumpSumMonth: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visuals & Metrics */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-primary/5 text-center shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Interest Saved</p>
              <p className="text-lg md:text-xl font-bold text-primary mt-1">
                ₹{emiAndSchedules.interestSaved.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-primary/5 text-center shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Months Saved</p>
              <p className="text-lg md:text-xl font-bold text-primary mt-1">
                {emiAndSchedules.monthsSaved} Months
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-primary/5 text-center shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">New Payoff Date</p>
              <p className="text-lg md:text-xl font-bold text-primary mt-1 truncate">
                {emiAndSchedules.newPayoffDate}
              </p>
            </div>
          </div>

          {/* Simple ASCII Amortization Curve Chart Mock */}
          <div className="border rounded-lg p-6 bg-card space-y-4 shadow-sm">
            <h3 className="font-bold text-sm">Outstanding Balance Projection</h3>
            <div className="relative border rounded p-4 bg-muted/10 h-48 flex items-end justify-between font-mono text-[9px] text-muted-foreground">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none border-b">
                <div className="border-t w-full border-muted/20"></div>
                <div className="border-t w-full border-muted/20"></div>
                <div className="border-t w-full border-muted/20"></div>
              </div>

              {/* Bar charts or charts mock */}
              <div className="w-full flex justify-around items-end h-full z-10">
                <div className="flex flex-col items-center gap-1 w-1/3">
                  <div className="w-12 bg-muted-foreground/30 h-32 rounded-t"></div>
                  <span className="text-[10px]">Baseline ({loan.tenureYears * 12} mo)</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/3">
                  <div className="w-12 bg-primary/80 h-20 rounded-t"></div>
                  <span className="text-[10px] text-primary font-bold">
                    Prepay ({emiAndSchedules.prepaySchedule.length} mo)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table container */}
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm">Detail Ledger Schedule (First 6 Months)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3">Month</th>
                    <th className="p-3">Base EMI</th>
                    <th className="p-3">Prepayment Paid</th>
                    <th className="p-3">Interest Paid</th>
                    <th className="p-3">Outstanding Bal</th>
                  </tr>
                </thead>
                <tbody>
                  {emiAndSchedules.prepaySchedule.slice(0, 6).map((m) => (
                    <tr key={m.month} className="border-b hover:bg-muted/10">
                      <td className="p-3 font-semibold">{String(m.month).padStart(3, '0')}</td>
                      <td className="p-3">₹{Math.round(m.emi).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {m.prepay > 0 ? `₹${Math.round(m.prepay).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3">₹{Math.round(m.interest).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono">₹{Math.round(m.outstanding).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {emiAndSchedules.prepaySchedule.length > 6 && (
                    <tr className="bg-muted/10">
                      <td colSpan={5} className="p-3 text-center text-muted-foreground italic">
                        ... {emiAndSchedules.prepaySchedule.length - 6} more months in amortization schedule
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
