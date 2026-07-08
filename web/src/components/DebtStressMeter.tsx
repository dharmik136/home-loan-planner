import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";
import { monthlyEmi } from "../engine/amortization";

interface Props {
  results: LoanResult[];
}

export function DebtStressMeter({ results }: Props) {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(150_000);

  if (results.length === 0) return null;

  // Calculate sum of current EMIs
  const totalEmi = results.reduce((sum, r) => sum + r.emi, 0);

  // Calculate Debt-to-Income (DTI) ratio
  const dtiPct = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;

  // Visual stress bands
  let stressLabel = "Healthy";
  let stressColor = "var(--emerald)";
  let stressBg = "var(--emerald-wash)";
  
  if (dtiPct > 50) {
    stressLabel = "Critical Debt Stress";
    stressColor = "var(--clay)";
    stressBg = "var(--clay-wash)";
  } else if (dtiPct > 35) {
    stressLabel = "Moderate Debt Load";
    stressColor = "#d97706"; // Amber
    stressBg = "#fef3c7";
  }

  // EMI Buffer (1% and 2% rate increase shock)
  const totalEmiShock1 = results.reduce((sum, r) => {
    if (r.loan.outstanding <= 0) return sum;
    const shockEmi = monthlyEmi(r.loan.outstanding, r.loan.ratePct + 1.0, r.loan.tenureMonths);
    return sum + shockEmi;
  }, 0);

  const totalEmiShock2 = results.reduce((sum, r) => {
    if (r.loan.outstanding <= 0) return sum;
    const shockEmi = monthlyEmi(r.loan.outstanding, r.loan.ratePct + 2.0, r.loan.tenureMonths);
    return sum + shockEmi;
  }, 0);

  const shock1Diff = totalEmiShock1 - totalEmi;
  const shock2Diff = totalEmiShock2 - totalEmi;

  return (
    <div className="panel s8" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🛡️ / Risk Audit</span>
        Debt Stress Gauge & Rate Shock buffer
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Monthly Net Take-Home Income</span>
          <span><b>{formatINR(monthlyIncome)}</b></span>
        </div>
        <input
          type="range"
          min={30_000}
          max={500_000}
          step={5000}
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      {/* DTI Gauge Visual */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
          <span>Debt-To-Income (DTI) Ratio:</span>
          <span style={{ fontWeight: "700", color: stressColor }}>{dtiPct.toFixed(1)}%</span>
        </div>
        {/* Progress Bar */}
        <div style={{ width: "100%", height: "8px", background: "var(--line-strong)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${Math.min(100, dtiPct)}%`, height: "100%", background: stressColor, transition: "width 0.25s, background-color 0.25s" }} />
        </div>
        <div style={{ background: stressBg, color: stressColor, padding: "8px 10px", borderRadius: "3px", fontSize: "0.76rem", fontWeight: "600", marginTop: "8px", textAlign: "center" }}>
          Status: {stressLabel}
        </div>
      </div>

      {/* EMI Buffer / Rate Shock */}
      <div style={{ borderTop: "1px dashed var(--line-strong)", paddingTop: "12px" }}>
        <div style={{ fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "8px" }}>
          ⚠️ Interest Rate Shock Buffer
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <span>If rates rise by 1.0%:</span>
            <span style={{ color: "#d97706" }}><b>+{formatINR(shock1Diff)}</b> / month</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <span>If rates rise by 2.0%:</span>
            <span style={{ color: "var(--clay)" }}><b>+{formatINR(shock2Diff)}</b> / month</span>
          </div>
        </div>

        <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "10px", lineHeight: "1.3" }}>
          💡 Maintain an emergency cash reserve of at least <b>{formatINR(shock2Diff * 6)}</b> (6 months of a 2% rate shock) to cushion against index base rate increases.
        </div>
      </div>
    </div>
  );
}
