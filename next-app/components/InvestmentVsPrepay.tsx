import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatCompactINR, formatINR } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function InvestmentVsPrepay({ results }: Props) {
  const [cagr, setCagr] = useState<number>(12);

  if (results.length === 0) return null;

  // Aggregate total interest saved across all loans
  const totalInterestSaved = results.reduce((sum, r) => sum + r.comparison.interestSaved, 0);

  // Compile total prepayment value
  let totalPrepayAmount = 0;
  let totalInvestmentValue = 0;

  results.forEach((r) => {
    const tenure = r.loan.tenureMonths;
    const rateMap = r.plan.rows;
    
    // Check all prepayment entries in plan
    rateMap.forEach((row) => {
      if (row.prepayment > 0) {
        totalPrepayAmount += row.prepayment;
        // Project this specific prepayment amount growing at cagr until end of original tenure
        const remainingMonths = tenure - row.month;
        if (remainingMonths > 0) {
          const futureVal = row.prepayment * Math.pow(1 + cagr / 100 / 12, remainingMonths);
          totalInvestmentValue += futureVal;
        } else {
          totalInvestmentValue += row.prepayment;
        }
      }
    });
  });

  const netInvestmentGain = Math.max(0, totalInvestmentValue - totalPrepayAmount);
  const difference = netInvestmentGain - totalInterestSaved;
  const prepayWins = difference < 0;

  return (
    <div className="panel s7" style={{ marginTop: "16px", fontVariantNumeric: "tabular-nums" }}>
      <div className="panel-title">
        <span className="num">Opportunity cost</span>
        Prepay Loan vs. Invest in Mutual Funds
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Assumed Investment Return (CAGR)</span>
          <span><b>{cagr}%</b></span>
        </div>
        <input
          type="range"
          aria-label="Assumed investment return CAGR"
          min={6}
          max={18}
          step={0.5}
          value={cagr}
          onChange={(e) => setCagr(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "4px" }}>
            Option A: Prepay
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--emerald)" }}>
            {formatCompactINR(totalInterestSaved)}
          </div>
          <div style={{ fontSize: "0.66rem", color: "var(--ink-faint)", marginTop: "2px" }}>
            Interest Saved
          </div>
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "4px" }}>
            Option B: Invest
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--gold)" }}>
            {formatCompactINR(netInvestmentGain)}
          </div>
          <div style={{ fontSize: "0.66rem", color: "var(--ink-faint)", marginTop: "2px" }}>
            Net CAGR Gains
          </div>
        </div>
      </div>

      <div style={{
        background: prepayWins ? "var(--emerald-wash)" : "var(--gold-wash)",
        border: `1px solid ${prepayWins ? "var(--emerald)" : "var(--gold)"}`,
        borderRadius: "3px",
        padding: "10px 12px",
        fontSize: "0.8rem",
        color: "var(--ink)"
      }}>
        {prepayWins ? (
          <div>
            <b>Prepayment is ahead in this model.</b> It saves <b>{formatINR(Math.round(-difference))}</b> more than investing at {cagr}% CAGR.
          </div>
        ) : (
          <div>
            <b>Investing is ahead in this model.</b> Investing at {cagr}% CAGR earns <b>{formatINR(Math.round(difference))}</b> more than prepaying.
          </div>
        )}
      </div>
    </div>
  );
}
