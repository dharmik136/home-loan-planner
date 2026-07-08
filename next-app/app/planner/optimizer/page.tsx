'use client';

import React, { useState, useMemo } from 'react';

export default function WindfallOptimizerPage() {
  const [windfall, setWindfall] = useState(500000);
  const [manualSplit, setManualSplit] = useState(50); // percentage to Loan A (Home Mortgage)

  // Hardcoded active loans in planner portfolio for optimizer simulation
  const loanA = { name: 'Home Mortgage', rate: 8.5, balance: 7500000 };
  const loanB = { name: 'Auto Car Loan', rate: 9.2, balance: 850000 };

  // Calculate optimization results
  const optimizationResults = useMemo(() => {
    // Math logic: Evaluate interest savings from splitting the windfall
    // Loan B has a higher rate (9.2%), so mathematically it is optimal to pay off Loan B first
    // up to its full balance, then apply the rest to Loan A (Home Mortgage)

    let optimalToLoanB = Math.min(windfall, loanB.balance);
    let optimalToLoanA = Math.max(0, windfall - optimalToLoanB);

    // Express as percentages
    const optimalPercentA = Math.round((optimalToLoanA / windfall) * 100);
    const optimalPercentB = Math.round((optimalToLoanB / windfall) * 100);

    // Calculate approximate interest savings (annual savings for simplicity)
    const optimalSavings = (optimalToLoanA * (loanA.rate / 100)) + (optimalToLoanB * (loanB.rate / 100));

    // Manual splitting calculation based on slider
    const manualToLoanA = (windfall * manualSplit) / 100;
    const manualToLoanB = (windfall * (100 - manualSplit)) / 100;
    const manualSavings = (manualToLoanA * (loanA.rate / 100)) + (manualToLoanB * (loanB.rate / 100));

    const extraSavedByOptimal = Math.max(0, optimalSavings - manualSavings);

    return {
      optimalToLoanA,
      optimalToLoanB,
      optimalPercentA,
      optimalPercentB,
      optimalSavings,
      manualToLoanA,
      manualToLoanB,
      manualSavings,
      extraSavedByOptimal,
    };
  }, [windfall, manualSplit]);

  const handleApplySplit = () => {
    alert(`Applied optimal split to Portfolio Plan! \n\n₹${optimizationResults.optimalToLoanA.toLocaleString('en-IN')} allocated to Home Mortgage.\n₹${optimizationResults.optimalToLoanB.toLocaleString('en-IN')} allocated to Auto Car Loan.`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Smart Windfall Split Optimizer</h1>
        <p className="text-muted-foreground text-sm">
          Configure one-time lump-sum windfalls (bonuses, stock sale) to see where they work hardest.
        </p>
      </div>

      {/* Windfall Amount Selector */}
      <div className="border rounded-lg p-6 bg-card shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-foreground">One-Time Windfall Amount (₹)</label>
          <span className="text-xl font-extrabold text-primary">
            ₹{windfall.toLocaleString('en-IN')}
          </span>
        </div>
        <input
          type="range"
          min="50000"
          max="5000000"
          step="50000"
          value={windfall}
          onChange={(e) => setWindfall(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Min: ₹50K</span>
          <span>Max: ₹50L</span>
        </div>
      </div>

      {/* Recommended Optimal Allocation */}
      <div className="border rounded-lg p-6 bg-primary/5 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground">Recommended Optimal Allocation</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-card border rounded p-4">
              <span className="text-lg">🏡</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Home Mortgage ({optimizationResults.optimalPercentA}%)
                </p>
                <p className="font-bold text-base">
                  Allocate ₹{optimizationResults.optimalToLoanA.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-card border rounded p-4">
              <span className="text-lg">🚗</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Auto Car Loan ({optimizationResults.optimalPercentB}%)
                </p>
                <p className="font-bold text-base">
                  Allocate ₹{optimizationResults.optimalToLoanB.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-card border rounded p-6 text-center space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase">Estimated Annual Savings</p>
            <p className="text-3xl font-black text-primary">
              ₹{Math.round(optimizationResults.optimalSavings).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground">
              This layout maximizes compounding reduction by clearing higher-rate debt first.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Split Tester */}
      <div className="border rounded-lg p-6 bg-card shadow-sm space-y-6">
        <h3 className="font-bold text-base">Compare With Your Manual Guess</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>To Home Mortgage: {manualSplit}%</span>
            <span>To Auto Car Loan: {100 - manualSplit}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={manualSplit}
            onChange={(e) => setManualSplit(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-4 border-t text-center">
          <div>
            <span className="text-xs text-muted-foreground">Manual Split Savings</span>
            <p className="text-lg font-bold mt-1 text-foreground">
              ₹{Math.round(optimizationResults.manualSavings).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Optimal Split Savings</span>
            <p className="text-lg font-bold mt-1 text-primary">
              ₹{Math.round(optimizationResults.optimalSavings).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Additional Saved
            </span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{Math.round(optimizationResults.extraSavedByOptimal).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleApplySplit}
          className="inline-flex items-center justify-center rounded-md font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
        >
          Apply Split to My Planner Portfolio
        </button>
      </div>
    </div>
  );
}
