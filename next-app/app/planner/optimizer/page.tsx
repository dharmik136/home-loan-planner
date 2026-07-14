'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildSchedule, monthlyEmi } from '../../../engine/amortization';
import { Loan, PrepayEntry } from '../../../engine/planning';
import { formatINR, formatCompactINR } from '../../../engine/format';
import { ArrowRight, Lightbulb, Zap } from 'lucide-react';

const STORAGE_KEY = "prepayment-ledger-v1";

const DEFAULT_LOANS: Loan[] = [
  { id: "A", name: "Home Loan (SBI)", outstanding: 4500000, ratePct: 8.25, tenureMonths: 240, startYYYYMM: "2026-07", preEmiInterest: 0, ruleset: "hdfc", rateChanges: [] },
  { id: "B", name: "Auto Car Loan", outstanding: 850000, ratePct: 9.2, tenureMonths: 84, startYYYYMM: "2026-07", preEmiInterest: 0, ruleset: "rbi", rateChanges: [] },
];

function getRateChangesMap(loan: Loan): Record<number, number> {
  const map: Record<number, number> = {};
  if (loan.rateChanges) {
    for (const rc of loan.rateChanges) {
      if (rc.newRatePct > 0 && rc.monthIndex > 0) {
        map[rc.monthIndex] = rc.newRatePct;
      }
    }
  }
  return map;
}

function findOptimalSplit(loans: Loan[], amount: number, monthIndex: number): { split: number[]; interestSaved: number } {
  const n = loans.length;
  if (n === 0) return { split: [], interestSaved: 0 };
  if (n === 1) return { split: [100], interestSaved: 0 };

  // Generate all percentage splits summing to 100
  const step = n === 2 ? 5 : n === 3 ? 10 : 20;
  const splits: number[][] = [];
  
  function helper(temp: number[], sum: number) {
    if (temp.length === n) {
      if (sum === 100) splits.push([...temp]);
      return;
    }
    for (let i = 0; i <= 100 - sum; i += step) {
      temp.push(i);
      helper(temp, sum + i);
      temp.pop();
    }
  }
  helper([], 0);

  const baselines = loans.map((loan) => {
    const emi = loan.outstanding <= 0 ? 0 : monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
    const rateMap = getRateChangesMap(loan);
    return buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateMap);
  });

  let bestSplit: number[] = new Array(n).fill(0);
  bestSplit[0] = 100;
  let maxSaved = -1;

  for (const split of splits) {
    let totalSaved = 0;
    for (let i = 0; i < n; i++) {
      const loan = loans[i];
      const baseline = baselines[i];
      const allocAmt = (amount * split[i]) / 100;
      
      const emi = loan.outstanding <= 0 ? 0 : monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
      const rateMap = getRateChangesMap(loan);
      
      const prepayments = allocAmt > 0 ? { [monthIndex]: allocAmt } : {};
      const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, prepayments, "reduceTenure", rateMap);
      
      totalSaved += (baseline.totalInterest - plan.totalInterest);
    }

    if (totalSaved > maxSaved) {
      maxSaved = totalSaved;
      bestSplit = split;
    }
  }

  return { split: bestSplit, interestSaved: Math.round(maxSaved) };
}

function calculateSplitSavings(loans: Loan[], amount: number, monthIndex: number, splitPercents: number[]): number {
  let totalSaved = 0;
  for (let i = 0; i < loans.length; i++) {
    const loan = loans[i];
    const allocAmt = (amount * (splitPercents[i] ?? 0)) / 100;
    if (allocAmt <= 0) continue;
    
    const emi = loan.outstanding <= 0 ? 0 : monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
    const rateMap = getRateChangesMap(loan);
    const baseline = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateMap);
    
    const prepayments = { [monthIndex]: allocAmt };
    const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, prepayments, "reduceTenure", rateMap);
    
    totalSaved += (baseline.totalInterest - plan.totalInterest);
  }
  return Math.round(totalSaved);
}

export default function WindfallOptimizerPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [entries, setEntries] = useState<PrepayEntry[]>([]);
  const [windfall, setWindfall] = useState(500000);
  const [month, setMonth] = useState(12);
  
  // Custom manual splits
  const [manualSplitSlider, setManualSplitSlider] = useState(50); // For exactly 2 loans
  const [manualSplits, setManualSplits] = useState<number[]>([]); // For > 2 loans
  const [isUsingCustomLoans, setIsUsingCustomLoans] = useState(false);

  // Load from local storage workspace
  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.loans) && parsed.loans.length > 0) {
            setLoans(parsed.loans);
            setEntries(parsed.entries || []);
            return;
          }
        } catch { /* ignore */ }
      }
      // If none found, load fallback mock setup
      setLoans(DEFAULT_LOANS);
      setIsUsingCustomLoans(true);
    }
  }, []);

  // Sync initial manual splits when loans change
  useEffect(() => {
    if (loans.length > 0) {
      if (loans.length === 2) {
        setManualSplitSlider(50);
      } else {
        const initial = new Array(loans.length).fill(0);
        initial[0] = 100; // default 100% to first loan
        setManualSplits(initial);
      }
    }
  }, [loans]);

  const handleManualSplitChange = (index: number, val: number) => {
    setManualSplits((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Compute optimization
  const optimalSplit = useMemo(() => {
    return findOptimalSplit(loans, windfall, month);
  }, [loans, windfall, month]);

  // Compute manual splits savings
  const manualSplitSavings = useMemo(() => {
    if (loans.length === 0) return 0;
    if (loans.length === 2) {
      return calculateSplitSavings(loans, windfall, month, [manualSplitSlider, 100 - manualSplitSlider]);
    }
    // For general list, validate splits sum to 100
    const sum = manualSplits.reduce((s, v) => s + v, 0);
    if (sum !== 100) return 0; // Invalid split
    return calculateSplitSavings(loans, windfall, month, manualSplits);
  }, [loans, windfall, month, manualSplitSlider, manualSplits]);

  const handleApplySplit = () => {
    if (loans.length === 0) return;
    
    // Save to localStorage
    const savedStateRaw = localStorage.getItem(STORAGE_KEY);
    let workspaceState: { loans: Loan[]; entries: PrepayEntry[] } = { loans: [], entries: [] };
    if (savedStateRaw) {
      try {
        workspaceState = JSON.parse(savedStateRaw);
      } catch { /* ignore */ }
    }
    
    if (!workspaceState.loans || workspaceState.loans.length === 0) {
      workspaceState.loans = loans as any;
    }
    
    const newEntries = [...(workspaceState.entries || [])];
    optimalSplit.split.forEach((pct, idx) => {
      const allocAmt = (windfall * pct) / 100;
      if (allocAmt > 0) {
        newEntries.push({
          id: `pp-opt-${Date.now()}-${idx}-${Math.random()}`,
          loanId: loans[idx].id,
          type: "oneTime",
          amount: allocAmt,
          monthIndex: month,
        });
      }
    });
    
    workspaceState.entries = newEntries as any;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceState));
    
    alert(`Applied optimal split allocations to your active prepayment plan!\nRedirecting you to the Portfolio Planner...`);
    router.push('/planner');
  };

  const handleRestoreDefaultPortfolio = () => {
    setLoans(DEFAULT_LOANS);
    setIsUsingCustomLoans(true);
  };

  const sumOfManualSplits = manualSplits.reduce((s, v) => s + v, 0);
  const maxOutstanding = Math.max(0, ...loans.map((loan) => Number(loan.outstanding) || 0));
  const sliderMax = Math.max(2500000, maxOutstanding);

  return (
    <div className="wrap planner-page-container">
      <div className="rule-row">
        <span>Windfall portfolio split optimizer</span>
        <span>compounding-asymmetry algorithm</span>
        <span>Clear high-cost debt first</span>
      </div>

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px double var(--line-strong)", paddingBottom: "10px", marginBottom: "15px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontFamily: "var(--display)", fontWeight: "800" }}>
            Smart Windfall Split Optimizer
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "4px 0 0 0", fontSize: "0.85rem" }}>
            Configure lump-sum windfalls (bonuses, stock sales) to see where they work hardest across your loans.
          </p>
        </div>
        <Link href="/planner" className="btn ghost" style={{ height: "36px", minHeight: "36px", padding: "0 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          Back to Planner <ArrowRight size={14} />
        </Link>
      </header>

      {isUsingCustomLoans && (
        <div style={{
          background: "var(--gold-wash)",
          border: "1px solid var(--gold)",
          color: "var(--ink)",
          padding: "10px 14px",
          borderRadius: "4px",
          fontSize: "0.8rem",
          fontWeight: 600,
          marginBottom: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Lightbulb size={15} style={{ color: "var(--gold)" }} /> Currently using a Demo Portfolio. Setup your own loans in the main planner.</span>
          <button className="btn" onClick={handleRestoreDefaultPortfolio} style={{ minHeight: "28px", minWidth: "80px", fontSize: "0.7rem", padding: "2px 8px" }}>Reset Demo</button>
        </div>
      )}

      <div className="grid">
        {/* Left Column: Form Controls */}
        <aside className="col-left">
          <div className="panel s2">
            <div className="panel-title">
              <span className="num">01</span>
              Windfall details
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Lump Sum Windfall
                  </label>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--emerald)" }}>
                    {formatINR(windfall)}
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max={sliderMax}
                  step="25000"
                  value={Math.min(windfall, sliderMax)}
                  onChange={(e) => setWindfall(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
                <input
                  type="number"
                  value={windfall}
                  onChange={(e) => setWindfall(Number(e.target.value))}
                  style={{ width: "100%", marginTop: "6px", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                />
              </div>

              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Prepayment Month
                  </label>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Month {month} (Year {Math.floor((month - 1) / 12) + 1})
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  step="1"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          <div className="panel s3" style={{ marginTop: "16px" }}>
            <div className="panel-title">
              <span className="num">02</span>
              Configure Split Guess
            </div>
            
            {loans.length === 2 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>
                  Adjust the slider to check how other split options perform.
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600 }}>
                  <span>{loans[0].name}: {manualSplitSlider}%</span>
                  <span>{loans[1].name}: {100 - manualSplitSlider}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualSplitSlider}
                  onChange={(e) => setManualSplitSlider(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>
                  Specify the percentage split for each loan manually:
                </p>
                {loans.map((loan, idx) => (
                  <div key={loan.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{loan.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={manualSplits[idx] ?? 0}
                        onChange={(e) => handleManualSplitChange(idx, Math.min(100, Math.max(0, Number(e.target.value))))}
                        style={{ width: "60px", padding: "4px 8px", border: "1px solid var(--line)", textAlign: "right" }}
                      />
                      <span style={{ fontSize: "0.8rem" }}>%</span>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed var(--line)", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                  <span>Split Total:</span>
                  <span style={{ fontWeight: 700, color: sumOfManualSplits === 100 ? "var(--emerald)" : "var(--clay)" }}>
                    {sumOfManualSplits}% {sumOfManualSplits !== 100 && "(Must equal 100%)"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Visuals & Metrics */}
        <main className="col-main">
          {/* Optimal Split Allocation Card */}
          <div className="panel s4" style={{ marginBottom: "20px" }}>
            <div className="panel-title">
              <span className="num">03 / Allocation</span>
              Recommended Optimal Split Allocation
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {loans.map((loan, idx) => {
                  const pct = optimalSplit.split[idx] ?? 0;
                  const allocVal = (windfall * pct) / 100;
                  return (
                    <div key={loan.id} style={{
                      background: pct > 0 ? "var(--emerald-wash)" : "var(--panel)",
                      border: pct > 0 ? "1px solid var(--emerald)" : "1px solid var(--line)",
                      borderRadius: "4px",
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{loan.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                          Rate: {loan.ratePct}% · Outstanding: {formatCompactINR(loan.outstanding)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: pct > 0 ? "var(--emerald)" : "var(--ink)" }}>
                          {formatCompactINR(allocVal)}
                        </div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600 }}>{pct}% Split</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>
                  Estimated Compounding Savings
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--emerald)", margin: "8px 0" }}>
                  {formatCompactINR(optimalSplit.interestSaved)}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                  Calculated using exact Reducing-Balance schedules.
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Split Details */}
          <div className="panel s2" style={{ marginBottom: "20px" }}>
            <div className="panel-title">
              <span className="num">04</span>
              Compare Savings
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginTop: "10px" }}>
              <div style={{ background: "var(--paper-raised)", border: "1px dashed var(--line)", borderRadius: "4px", padding: "15px", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>Manual Guess Savings</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "5px" }}>
                  {loans.length !== 2 && sumOfManualSplits !== 100 ? "Invalid Split" : formatCompactINR(manualSplitSavings)}
                </div>
              </div>
              <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "4px", padding: "15px", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>Optimal Plan Savings</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "5px", color: "var(--emerald)" }}>
                  {formatCompactINR(optimalSplit.interestSaved)}
                </div>
              </div>
              <div style={{
                background: "var(--emerald-wash)",
                border: "1px solid var(--emerald)",
                borderRadius: "4px",
                padding: "15px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--emerald)" }}>Additional Savings</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, marginTop: "5px", color: "var(--emerald)" }}>
                  {loans.length !== 2 && sumOfManualSplits !== 100 ? "-" : formatCompactINR(Math.max(0, optimalSplit.interestSaved - manualSplitSavings))}
                </div>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              onClick={handleApplySplit}
              className="btn"
              style={{ padding: "0 24px", height: "44px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Apply Split to My Planner Portfolio <Zap size={15} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
