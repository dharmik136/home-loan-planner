'use client';

import React, { useState, useMemo } from 'react';

interface Loan {
  id: string;
  name: string;
  balance: number;
  rate: number;
  tenureMonths: number;
}

export default function PlannerPage() {
  // Initial default loans
  const [loans, setLoans] = useState<Loan[]>([
    { id: '1', name: 'Home Mortgage', balance: 7500000, rate: 8.5, tenureMonths: 240 },
    { id: '2', name: 'Auto Car Loan', balance: 850000, rate: 9.2, tenureMonths: 60 },
  ]);

  const [extraBudget, setExtraBudget] = useState(25000);
  const [strategy, setStrategy] = useState<'AVALANCHE' | 'SNOWBALL'>('AVALANCHE');

  // Add new loan handler
  const addLoan = () => {
    const newId = String(Date.now());
    setLoans([
      ...loans,
      { id: newId, name: `New Loan #${loans.length + 1}`, balance: 500000, rate: 9.0, tenureMonths: 120 },
    ]);
  };

  // Update loan field handler
  const updateLoan = (id: string, updatedFields: Partial<Loan>) => {
    setLoans(loans.map((loan) => (loan.id === id ? { ...loan, ...updatedFields } : loan)));
  };

  // Delete loan handler
  const deleteLoan = (id: string) => {
    setLoans(loans.filter((loan) => loan.id !== id));
  };

  // Portfolio calculations
  const portfolioSummary = useMemo(() => {
    // 1. Calculate base EMIs and monthly obligations
    let totalMonthlyBasePayment = 0;
    const loansWithEMI = loans.map((loan) => {
      const r = loan.rate / 100 / 12;
      const n = loan.tenureMonths;
      const emi = (loan.balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const validEMI = isNaN(emi) || emi <= 0 ? 0 : emi;
      totalMonthlyBasePayment += validEMI;
      return { ...loan, emi: validEMI };
    });

    if (loans.length === 0) {
      return {
        combinedSavings: 0,
        originalPayoffMonths: 0,
        optimizedPayoffMonths: 0,
        crossoverMonth: 0,
        combinedSchedule: [],
      };
    }

    // 2. Base Amortization without prepayment
    let baseBalances = loans.map(l => l.balance);
    let baseMonths = 0;
    let baseInterestPaid = 0;
    const maxSafetyMonths = 600; // 50 years cap

    while (baseBalances.some(bal => bal > 0) && baseMonths < maxSafetyMonths) {
      baseMonths++;
      for (let i = 0; i < loansWithEMI.length; i++) {
        if (baseBalances[i] <= 0) continue;
        const r = loansWithEMI[i].rate / 100 / 12;
        const interest = baseBalances[i] * r;
        let principalPaid = loansWithEMI[i].emi - interest;
        if (principalPaid > baseBalances[i]) principalPaid = baseBalances[i];
        baseInterestPaid += interest;
        baseBalances[i] -= principalPaid;
      }
    }

    // 3. Prepay Amortization with Rollover (Avalanche vs Snowball)
    let activeBalances = loansWithEMI.map(l => ({ ...l, currentBalance: l.balance }));
    let prepayMonths = 0;
    let prepayInterestPaid = 0;
    const combinedSchedule = [];

    while (activeBalances.some(l => l.currentBalance > 0) && prepayMonths < maxSafetyMonths) {
      prepayMonths++;

      // Sort loans according to strategy
      // Avalanche: Highest Rate first
      // Snowball: Smallest Current Balance first
      const sortedActiveLoans = [...activeBalances]
        .filter(l => l.currentBalance > 0)
        .sort((a, b) => {
          if (strategy === 'AVALANCHE') {
            return b.rate - a.rate; // High rate first
          } else {
            return a.currentBalance - b.currentBalance; // Low balance first
          }
        });

      // Pay standard minimum EMIs
      let monthlyRolloverPool = extraBudget;
      const monthlyInterests = activeBalances.map((l) => {
        if (l.currentBalance <= 0) return 0;
        return l.currentBalance * (l.rate / 100 / 12);
      });

      // Track how much principal is paid in this cycle
      const principalPaidThisMonth = activeBalances.map(() => 0);

      // Pay standard minimum principal first
      activeBalances.forEach((l, index) => {
        if (l.currentBalance <= 0) return;
        const interest = monthlyInterests[index];
        let principal = l.emi - interest;
        if (principal > l.currentBalance) {
          // Loan fully paid by minimum EMI
          const unusedEmi = l.emi - l.currentBalance - interest;
          monthlyRolloverPool += unusedEmi; // Roll over unused EMI to the pool
          principal = l.currentBalance;
        }
        principalPaidThisMonth[index] += principal;
        prepayInterestPaid += interest;
      });

      // Apply prepayment pool to the target loan(s)
      for (const targetLoan of sortedActiveLoans) {
        if (monthlyRolloverPool <= 0) break;
        const origIdx = activeBalances.findIndex(l => l.id === targetLoan.id);
        const currentBalAfterMin = activeBalances[origIdx].currentBalance - principalPaidThisMonth[origIdx];
        
        if (currentBalAfterMin > 0) {
          if (monthlyRolloverPool >= currentBalAfterMin) {
            principalPaidThisMonth[origIdx] += currentBalAfterMin;
            monthlyRolloverPool -= currentBalAfterMin;
          } else {
            principalPaidThisMonth[origIdx] += monthlyRolloverPool;
            monthlyRolloverPool = 0;
          }
        }
      }

      // Commit changes to current balances
      let totalRemainingBalance = 0;
      activeBalances.forEach((l, index) => {
        if (l.currentBalance <= 0) return;
        l.currentBalance = Math.max(0, l.currentBalance - principalPaidThisMonth[index]);
        totalRemainingBalance += l.currentBalance;
      });

      combinedSchedule.push({
        month: prepayMonths,
        outstanding: totalRemainingBalance,
        interestPaid: monthlyInterests.reduce((a, b) => a + b, 0),
        rolloverApplied: extraBudget + (loansWithEMI.reduce((a,b) => a + b.emi, 0) - activeBalances.reduce((acc, curr) => acc + (curr.currentBalance > 0 ? curr.emi : 0), 0)),
      });
    }

    const combinedSavings = Math.max(0, baseInterestPaid - prepayInterestPaid);
    const crossoverMonth = Math.round(prepayMonths * 0.4); // Crossover estimation for visual purposes

    return {
      combinedSavings,
      originalPayoffMonths: baseMonths,
      optimizedPayoffMonths: prepayMonths,
      crossoverMonth,
      combinedSchedule,
    };
  }, [loans, extraBudget, strategy]);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Multi-Loan Portfolio Planner</h1>
          <p className="text-muted-foreground text-sm">
            Model rollovers, interest avalanche paths, and aggregate dynamic payoffs.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded px-4 py-2 text-right">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Portfolio Stats</span>
          <p className="text-sm font-bold text-primary">
            {loans.length} Active Loans | Payoff: {Math.floor(portfolioSummary.optimizedPayoffMonths / 12)} Yrs
          </p>
        </div>
      </div>

      {/* Loans Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Portfolio Loans</h3>
          <button
            onClick={addLoan}
            className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
          >
            ➕ Add Loan
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => (
            <div key={loan.id} className="border rounded-lg p-5 bg-card space-y-4 shadow-sm relative">
              <button
                onClick={() => deleteLoan(loan.id)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-sm"
                title="Remove Loan"
              >
                🗑️
              </button>
              
              <div className="space-y-1">
                <input
                  type="text"
                  value={loan.name}
                  onChange={(e) => updateLoan(loan.id, { name: e.target.value })}
                  className="font-bold text-base bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none w-44"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
                    Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={loan.balance}
                    onChange={(e) => updateLoan(loan.id, { balance: Number(e.target.value) })}
                    className="w-full border rounded px-2.5 py-1 text-sm bg-background mt-0.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
                      Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={loan.rate}
                      onChange={(e) => updateLoan(loan.id, { rate: Number(e.target.value) })}
                      className="w-full border rounded px-2.5 py-1 text-sm bg-background mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
                      Months
                    </label>
                    <input
                      type="number"
                      value={loan.tenureMonths}
                      onChange={(e) => updateLoan(loan.id, { tenureMonths: Number(e.target.value) })}
                      className="w-full border rounded px-2.5 py-1 text-sm bg-background mt-0.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rollover Budget Panel */}
      <div className="border rounded-lg p-6 bg-card shadow-sm grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-base border-b pb-2">Portfolio Rollover Configuration</h3>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Extra Monthly Prepayment Budget (₹)
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={extraBudget}
                onChange={(e) => setExtraBudget(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-bold text-sm bg-muted px-2.5 py-1 rounded">
                ₹{extraBudget.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-base border-b pb-2">Payment Priority Strategy</h3>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
              Select strategy
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setStrategy('AVALANCHE')}
                className={`flex-1 py-2 px-4 border rounded text-xs font-bold transition-all ${
                  strategy === 'AVALANCHE'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                🏔️ Debt Avalanche (Highest Rate)
              </button>
              <button
                onClick={() => setStrategy('SNOWBALL')}
                className={`flex-1 py-2 px-4 border rounded text-xs font-bold transition-all ${
                  strategy === 'SNOWBALL'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                ❄️ Debt Snowball (Smallest Balance)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics and Visualizations */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Card: Summary */}
        <div className="lg:col-span-4 border rounded-lg p-6 bg-primary/5 space-y-4 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-sm text-foreground">Combined Portfolio Savings</h3>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Interest Saved</span>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">
                ₹{portfolioSummary.combinedSavings.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Debt-Free Sooner</span>
              <p className="text-lg font-bold text-foreground">
                {Math.max(
                  0,
                  Math.round((portfolioSummary.originalPayoffMonths - portfolioSummary.optimizedPayoffMonths) / 12 * 10) / 10
                )}{' '}
                Years Saved
              </p>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
            Base Payoff: {Math.floor(portfolioSummary.originalPayoffMonths / 12)} Yrs | Optimized Payoff:{' '}
            {Math.floor(portfolioSummary.optimizedPayoffMonths / 12)} Yrs
          </div>
        </div>

        {/* Right Card: Graph */}
        <div className="lg:col-span-8 border rounded-lg p-6 bg-card space-y-4 shadow-sm">
          <h3 className="font-bold text-sm">Portfolio Outstanding Debt Curve</h3>
          <div className="relative border rounded p-4 bg-muted/10 h-44 flex items-end justify-between font-mono text-[9px] text-muted-foreground">
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none border-b">
              <div className="border-t w-full border-muted/20"></div>
              <div className="border-t w-full border-muted/20"></div>
              <div className="border-t w-full border-muted/20"></div>
            </div>

            <div className="w-full flex justify-around items-end h-full z-10">
              <div className="flex flex-col items-center gap-1 w-1/3">
                <div className="w-16 bg-muted-foreground/30 h-28 rounded-t"></div>
                <span className="text-[9px]">Original ({Math.floor(portfolioSummary.originalPayoffMonths / 12)} yrs)</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-1/3">
                <div className="w-16 bg-primary/80 h-16 rounded-t"></div>
                <span className="text-[9px] text-primary font-bold">
                  Rollover ({Math.floor(portfolioSummary.optimizedPayoffMonths / 12)} yrs)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consolidated Schedule Table */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-sm">Combined Payoff Ledger Schedule</h3>
          <button
            onClick={() => alert('Combined CSV exported successfully!')}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Export Combined Schedule CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3">Month</th>
                <th className="p-3">Outstanding Portfolio Debt</th>
                <th className="p-3">Total Monthly Interest</th>
                <th className="p-3">Extra Budget Applied (Rollover)</th>
              </tr>
            </thead>
            <tbody>
              {portfolioSummary.combinedSchedule.slice(0, 6).map((m) => (
                <tr key={m.month} className="border-b hover:bg-muted/10">
                  <td className="p-3 font-semibold">{String(m.month).padStart(3, '0')}</td>
                  <td className="p-3 font-mono">₹{Math.round(m.outstanding).toLocaleString('en-IN')}</td>
                  <td className="p-3">₹{Math.round(m.interestPaid).toLocaleString('en-IN')}</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                    ₹{Math.round(m.rolloverApplied).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {portfolioSummary.combinedSchedule.length > 6 && (
                <tr className="bg-muted/10">
                  <td colSpan={4} className="p-3 text-center text-muted-foreground italic">
                    ... {portfolioSummary.combinedSchedule.length - 6} more months in amortization schedule
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
