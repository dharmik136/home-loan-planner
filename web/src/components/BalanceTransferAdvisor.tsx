import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";

interface Props {
  results: LoanResult[];
}

function monthlyEmiCalc(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / months);
  const f = Math.pow(1 + r, months);
  return Math.ceil((principal * r * f) / (f - 1));
}

export function BalanceTransferAdvisor({ results }: Props) {
  const [newRate, setNewRate] = useState(8.25);
  const [switchCostPct, setSwitchCostPct] = useState(0.5);

  if (results.length === 0) return null;

  const advice = useMemo(() => {
    return results
      .filter((r) => r.loan.outstanding > 0 && r.loan.tenureMonths > 0)
      .map((r) => {
        const { loan, plan } = r;
        const remainingMonths = plan.rows.length;
        const outstandingNow = plan.rows[0]?.opening ?? loan.outstanding;

        // Current EMI
        const currentEmi = r.emi;
        const currentTotalLeft = currentEmi * remainingMonths;

        // New EMI at lower rate
        const newEmi = monthlyEmiCalc(outstandingNow, newRate, remainingMonths);
        const newTotalLeft = newEmi * remainingMonths;

        // Switch cost (processing fee on outstanding)
        const switchCost = Math.round(outstandingNow * switchCostPct / 100);

        const interestSavingsGross = currentTotalLeft - newTotalLeft;
        const netSavings = interestSavingsGross - switchCost;
        const breakEvenMonths = netSavings > 0
          ? Math.ceil(switchCost / (currentEmi - newEmi))
          : null;
        const worthSwitching = netSavings > 0 && loan.ratePct - newRate >= 0.5;

        return {
          loanName: loan.name,
          currentRate: loan.ratePct,
          currentEmi,
          newEmi,
          switchCost,
          netSavings: Math.round(netSavings),
          breakEvenMonths,
          worthSwitching,
        };
      });
  }, [results, newRate, switchCostPct]);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🔄 / Refinance</span>
        Balance Transfer Advisor — Should you switch lenders?
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>New Lender Rate</span><span><b>{newRate}%</b></span>
          </div>
          <input type="range" min={7} max={14} step={0.05} value={newRate}
            onChange={(e) => setNewRate(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Switch Cost (% of outstanding)</span><span><b>{switchCostPct}%</b></span>
          </div>
          <input type="range" min={0} max={3} step={0.25} value={switchCostPct}
            onChange={(e) => setSwitchCostPct(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {advice.map((a) => (
          <div key={a.loanName} style={{
            background: a.worthSwitching ? "var(--emerald-wash)" : "var(--panel)",
            border: `1px solid ${a.worthSwitching ? "#c4dac9" : "var(--line)"}`,
            borderRadius: "4px", padding: "11px 13px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.84rem" }}>{a.loanName}</span>
              <span style={{
                fontSize: "0.72rem", fontWeight: "700", padding: "2px 8px", borderRadius: "2px",
                background: a.worthSwitching ? "var(--emerald)" : "var(--clay)",
                color: "white"
              }}>
                {a.worthSwitching ? "✅ Switch Recommended" : "❌ Stay Put"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "0.76rem" }}>
              <span>Current Rate: <b>{a.currentRate}%</b></span>
              <span>New Rate: <b style={{ color: "var(--emerald)" }}>{newRate}%</b></span>
              <span>Current EMI: <b>{formatINR(a.currentEmi)}</b></span>
              <span>New EMI: <b style={{ color: "var(--emerald)" }}>{formatINR(a.newEmi)}</b></span>
              <span>Switch Cost: <b style={{ color: "var(--clay)" }}>{formatINR(a.switchCost)}</b></span>
              <span>Net Savings: <b style={{ color: a.netSavings > 0 ? "var(--emerald)" : "var(--clay)" }}>{formatINR(Math.abs(a.netSavings))}{a.netSavings < 0 ? " loss" : ""}</b></span>
            </div>
            {a.breakEvenMonths && a.worthSwitching && (
              <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "6px" }}>
                Break-even in <b>{a.breakEvenMonths} months</b> — after that, every month saves {formatINR(a.currentEmi - a.newEmi)}.
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 RBI mandates floating-rate home loans can be transferred with zero prepayment penalty. Switch when rate difference is ≥0.50% and remaining tenure is ≥5 years.
      </div>
    </div>
  );
}
