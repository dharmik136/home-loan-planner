import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  results: LoanResult[];
}


export function InflationAdjustedView({ results }: Props) {
  const [inflationPct, setInflationPct] = useState(6.0);

  if (results.length === 0) return null;

  // Compute real value of each rupee paid over time
  // Real cost = nominal / (1 + inflation)^year
  const totalNominalPaid = results.reduce((s, r) => s + r.plan.totalPaid, 0);
  const totalNominalInterest = results.reduce((s, r) => s + r.plan.totalInterest, 0);

  // Compute inflation-adjusted (real) total paid
  let realTotalPaid = 0;
  results.forEach((r) => {
    r.plan.rows.forEach((row) => {
      const yearIndex = (row.month - 1) / 12;
      const deflator = Math.pow(1 + inflationPct / 100, yearIndex);
      realTotalPaid += (row.emi + row.prepayment) / deflator;
    });
  });

  const inflationBenefit = totalNominalPaid - realTotalPaid;
  const realInterestBurden = Math.max(0, totalNominalInterest - inflationBenefit);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">📉 / Real Cost</span>
        Inflation-Adjusted Loan Cost
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Annual Inflation Assumption</span>
          <span><b>{inflationPct}%</b></span>
        </div>
        <input
          type="range" min={2} max={12} step={0.5} value={inflationPct}
          onChange={(e) => setInflationPct(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "11px 13px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Total Nominal Payments:</span>
          <span><b>{formatINR(Math.round(totalNominalPaid))}</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Inflation-Adjusted (Real) Cost:</span>
          <span style={{ color: "var(--emerald)", fontWeight: "700" }}>{formatINR(Math.round(realTotalPaid))}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", borderTop: "1px dashed var(--line-strong)", paddingTop: "7px" }}>
          <span>Inflation Erosion Benefit:</span>
          <span style={{ color: "var(--emerald)", fontWeight: "700" }}>-{formatINR(Math.round(inflationBenefit))}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Real Interest Burden:</span>
          <span style={{ color: "var(--clay)", fontWeight: "700" }}>{formatINR(Math.round(realInterestBurden))}</span>
        </div>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 As inflation rises, each future EMI rupee is worth less in today's money. A ₹30,000 EMI in Year 10 has the purchasing power of ~{formatINR(Math.round(30_000 / Math.pow(1 + inflationPct / 100, 10)))} today at {inflationPct}% inflation.
      </div>
    </div>
  );
}
