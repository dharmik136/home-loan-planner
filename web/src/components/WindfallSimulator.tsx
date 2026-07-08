import { useState } from "react";
import type { Loan } from "../engine/planning";
import { windfallEffect } from "../engine/planning";
import { formatCompactINR, formatDuration, formatINR } from "../engine/format";
import { buildSchedule, monthlyEmi } from "../engine/amortization";

interface Props { loans: Loan[]; }



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

interface SplitAllocation {
  split: number[];
  interestSaved: number;
}

function findOptimalSplit(loans: Loan[], amount: number, monthIndex: number): SplitAllocation | null {
  if (loans.length <= 1) return null;
  const n = loans.length;
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
    const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
    const rateMap = getRateChangesMap(loan);
    return buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateMap);
  });

  let bestSplit: number[] = [];
  let maxSaved = -1;

  for (const split of splits) {
    let totalSaved = 0;
    for (let i = 0; i < n; i++) {
      const loan = loans[i];
      const baseline = baselines[i];
      const allocAmt = (amount * split[i]) / 100;
      
      const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
      const behavior = loan.prepayBehavior ?? "reduceTenure";
      const rateMap = getRateChangesMap(loan);
      
      const prepayments = allocAmt > 0 ? { [monthIndex]: allocAmt } : {};
      const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, prepayments, behavior, rateMap);
      
      totalSaved += (baseline.totalInterest - plan.totalInterest);
    }

    if (totalSaved > maxSaved) {
      maxSaved = totalSaved;
      bestSplit = split;
    }
  }

  return { split: bestSplit, interestSaved: Math.round(maxSaved) };
}

export function WindfallSimulator({ loans }: Props) {
  const [amount, setAmount] = useState(500_000);
  const [month, setMonth] = useState(12);

  if (loans.length === 0) return null;

  const results = loans.map((loan) => ({
    loan,
    effect: windfallEffect(loan, amount, month),
  }));

  const sorted = [...results].sort((a, b) => b.effect.interestSaved - a.effect.interestSaved);
  const maxInterestSaved = sorted[0]?.effect.interestSaved || 0;
  const maxTenure = Math.max(...loans.map((l) => l.tenureMonths), 12);

  const optimalSplit = findOptimalSplit(loans, amount, month);

  // Render the versus or grid layout
  let comparisonElement;
  if (sorted.length === 1) {
    const { loan, effect } = sorted[0];
    comparisonElement = (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
        <div className="wf-side win" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="nm">{loan.name}</div>
          <div className="big">{formatCompactINR(effect.interestSaved)}</div>
          <div className="sm">interest saved · {formatDuration(effect.monthsSaved)} cut</div>
          <div className="crown">★ Project Savings</div>
        </div>
      </div>
    );
  } else if (sorted.length === 2) {
    const left = results[0];
    const right = results[1];
    const leftWins = left.effect.interestSaved >= right.effect.interestSaved;
    
    comparisonElement = (
      <div className="wf-versus">
        <div className={`wf-side ${leftWins ? "win" : ""}`}>
          <div className="nm">{left.loan.name}</div>
          <div className="big">{formatCompactINR(left.effect.interestSaved)}</div>
          <div className="sm">interest saved · {formatDuration(left.effect.monthsSaved)} cut</div>
          <div className="crown">{leftWins ? "★ Best choice" : ""}</div>
        </div>
        <div className="vs">vs</div>
        <div className={`wf-side ${!leftWins ? "win" : ""}`}>
          <div className="nm">{right.loan.name}</div>
          <div className="big">{formatCompactINR(right.effect.interestSaved)}</div>
          <div className="sm">interest saved · {formatDuration(right.effect.monthsSaved)} cut</div>
          <div className="crown">{!leftWins ? "★ Best choice" : ""}</div>
        </div>
      </div>
    );
  } else {
    comparisonElement = (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginTop: '14px'
      }}>
        {sorted.map(({ loan, effect }, idx) => {
          const isBest = effect.interestSaved === maxInterestSaved && maxInterestSaved > 0;
          return (
            <div key={loan.id} className={`wf-side ${isBest ? "win" : ""}`}>
              <div className="nm">{loan.name}</div>
              <div className="big">{formatCompactINR(effect.interestSaved)}</div>
              <div className="sm">interest saved · {formatDuration(effect.monthsSaved)} cut</div>
              <div className="crown">{isBest ? "★ Best choice" : `Rank #${idx + 1}`}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const maxOutstanding = Math.max(0, ...loans.map((loan) => Number(loan.outstanding) || 0));
  const sliderMax = Math.max(1_500_000, maxOutstanding);

  return (
    <div className="panel s5">
      <div className="panel-title"><span className="num">05 / Windfall</span> One lump sum — where does it save more?</div>

      <div className="slider-meta" style={{ marginBottom: 2 }}>
        <span>Lump sum</span><span><b>{formatINR(amount)}</b></span>
      </div>
      <input type="range" min={0} max={sliderMax} step={5000} value={Math.min(amount, sliderMax)} onChange={(e) => setAmount(Number(e.target.value))} />

      <div className="slider-meta" style={{ marginTop: 10, marginBottom: 2 }}>
        <span>Paid in</span><span><b>month {month}</b> (year {Math.floor((month - 1) / 12) + 1})</span>
      </div>
      <input type="range" min={2} max={maxTenure} step={1} value={Math.min(month, maxTenure)} onChange={(e) => setMonth(Number(e.target.value))} />

      {comparisonElement}

      {/* Smart Windfall Allocator Section */}
      {loans.length >= 2 && optimalSplit && (
        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed var(--line-strong)" }}>
          <div style={{ fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "700", marginBottom: "8px" }}>
            🧠 Smart Windfall Allocator (Optimizer)
          </div>
          <div style={{ background: "var(--emerald-wash)", border: "1px solid #c4dac9", borderRadius: "3px", padding: "12px 14px" }}>
            <p style={{ fontSize: "0.86rem", marginBottom: "8px", lineHeight: "1.4", color: "var(--ink)" }}>
              To save the absolute most interest, split your <b>{formatINR(amount)}</b> windfall like this:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {loans.map((loan, idx) => {
                const pct = optimalSplit.split[idx];
                if (pct === 0) return null;
                const allocVal = (amount * pct) / 100;
                return (
                  <div key={loan.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                    <span><b>{loan.name}</b> ({pct}%)</span>
                    <span><b>{formatINR(allocVal)}</b></span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--emerald)", fontWeight: "700", borderTop: "1px dashed #c4dac9", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
              <span>Total Optimized Savings:</span>
              <span>{formatINR(optimalSplit.interestSaved)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
