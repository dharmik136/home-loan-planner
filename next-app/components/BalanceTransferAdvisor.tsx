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
  const [newRate, setNewRate] = useState<number>(8.25);
  
  // Fee configuration states
  const [isItemized, setIsItemized] = useState<boolean>(false);
  const [switchCostPct, setSwitchCostPct] = useState<number>(0.5); // flat fee pct
  const [processingFee, setProcessingFee] = useState<number>(10000);
  const [legalStampDuty, setLegalStampDuty] = useState<number>(15000);
  const [valuationFee, setValuationFee] = useState<number>(5000);

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

        // Calculate switch cost
        const switchCost = isItemized
          ? (processingFee + legalStampDuty + valuationFee)
          : Math.round(outstandingNow * switchCostPct / 100);

        const interestSavingsGross = currentTotalLeft - newTotalLeft;
        const netSavings = interestSavingsGross - switchCost;
        
        const monthlySavings = currentEmi - newEmi;
        const breakEvenMonths = netSavings > 0 && monthlySavings > 0
          ? Math.ceil(switchCost / monthlySavings)
          : null;
          
        const worthSwitching = netSavings > 0 && loan.ratePct - newRate >= 0.25;

        return {
          loanName: loan.name,
          currentRate: loan.ratePct,
          currentEmi,
          newEmi,
          monthlySavings,
          switchCost,
          netSavings: Math.round(netSavings),
          breakEvenMonths,
          remainingMonths,
          worthSwitching,
        };
      });
  }, [results, newRate, isItemized, switchCostPct, processingFee, legalStampDuty, valuationFee]);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🔄</span>
        Balance Transfer Evaluator (Sec 5)
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "-4px 0 16px 0", lineHeight: "1.4" }}>
        Determine if refinancing your outstanding home loan with another lender is financially viable by calculating the exact break-even timeline after accounting for processing fees and stamp duty.
      </p>

      {/* Inputs Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "20px", borderBottom: "1px dashed var(--line-strong)", paddingBottom: "16px" }}>
        
        {/* New rate slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: "600", marginBottom: "6px" }}>
            <span style={{ color: "var(--ink-soft)" }}>New Offered Interest Rate</span>
            <span><b style={{ color: "var(--emerald)", fontSize: "0.95rem" }}>{newRate.toFixed(2)}%</b></span>
          </div>
          <input
            type="range"
            min={7}
            max={14}
            step={0.05}
            value={newRate}
            onChange={(e) => setNewRate(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--emerald)" }}
          />
        </div>

        {/* Cost Method Toggler */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--ink-soft)" }}>Switch Cost Model:</span>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="costModel"
                checked={!isItemized}
                onChange={() => setIsItemized(false)}
                style={{ accentColor: "var(--emerald)" }}
              />
              <span>Flat Percentage</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="costModel"
                checked={isItemized}
                onChange={() => setIsItemized(true)}
                style={{ accentColor: "var(--emerald)" }}
              />
              <span>Itemized Charges</span>
            </label>
          </div>

          {!isItemized ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: "600", marginBottom: "4px" }}>
                <span style={{ color: "var(--ink-soft)" }}>Estimated Total Charges</span>
                <span><b>{switchCostPct}% of Outstanding</b></span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.5}
                step={0.05}
                value={switchCostPct}
                onChange={(e) => setSwitchCostPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--emerald)" }}
              />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div>
                <label style={{ fontSize: "0.62rem", display: "block", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "3px" }}>Processing Fee (₹)</label>
                <input
                  type="number"
                  step={1000}
                  value={processingFee}
                  onChange={(e) => setProcessingFee(Math.max(0, Number(e.target.value)))}
                  style={{ width: "100%", padding: "5px 7px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.62rem", display: "block", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "3px" }}>Stamp Duty & Legal (₹)</label>
                <input
                  type="number"
                  step={1000}
                  value={legalStampDuty}
                  onChange={(e) => setLegalStampDuty(Math.max(0, Number(e.target.value)))}
                  style={{ width: "100%", padding: "5px 7px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.62rem", display: "block", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "3px" }}>Valuation Fee (₹)</label>
                <input
                  type="number"
                  step={500}
                  value={valuationFee}
                  onChange={(e) => setValuationFee(Math.max(0, Number(e.target.value)))}
                  style={{ width: "100%", padding: "5px 7px", fontSize: "0.78rem", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Results Advice Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {advice.map((a, index) => {
          const breakEvenPct = a.breakEvenMonths && a.remainingMonths
            ? Math.min(100, Math.round((a.breakEvenMonths / a.remainingMonths) * 100))
            : 0;

          return (
            <div key={`${a.loanName}-${index}`} className="thin-border" style={{
              background: a.worthSwitching ? "var(--emerald-wash)" : "var(--paper-raised)",
              border: `1px solid ${a.worthSwitching ? "var(--emerald)" : "var(--line-strong)"}`,
              borderRadius: "3px", padding: "14px", transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontFamily: "var(--display)", fontWeight: "700", fontSize: "0.95rem" }}>{a.loanName}</span>
                <span style={{
                  fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "800", padding: "3px 8px", borderRadius: "2px",
                  background: a.worthSwitching ? "var(--emerald)" : "var(--clay)",
                  color: "white"
                }}>
                  {a.worthSwitching ? "✓ Switch Recommended" : "Stay Put"}
                </span>
              </div>

              {/* Stats Table */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: "0.78rem", borderBottom: "1px dashed var(--line-strong)", paddingBottom: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Current EMI:</span>
                  <span><b>{formatINR(a.currentEmi)}</b> ({a.currentRate}%)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>New EMI:</span>
                  <span><b style={{ color: "var(--emerald)" }}>{formatINR(a.newEmi)}</b> ({newRate.toFixed(2)}%)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Total Switch Cost:</span>
                  <span><b style={{ color: "var(--clay)" }}>{formatINR(a.switchCost)}</b></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Net Savings:</span>
                  <span><b style={{ color: a.netSavings > 0 ? "var(--emerald)" : "var(--clay)" }}>{formatINR(a.netSavings)}</b></span>
                </div>
              </div>

              {/* Break-Even Progress Visualization */}
              {a.breakEvenMonths && a.worthSwitching ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--ink-soft)", marginBottom: "5px" }}>
                    <span>Break-even: <b>{a.breakEvenMonths} months</b></span>
                    <span>Remaining tenure: <b>{a.remainingMonths} months</b></span>
                  </div>
                  
                  {/* Stacked bar */}
                  <div style={{ height: "14px", width: "100%", borderRadius: "2px", display: "flex", overflow: "hidden", border: "1px solid var(--line-strong)", backgroundColor: "var(--paper)" }}>
                    <div
                      style={{ width: `${breakEvenPct}%`, backgroundColor: "var(--clay-wash)", borderRight: "1px dashed var(--clay)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: "700", color: "var(--clay)" }}
                      title={`Break-even period: ${a.breakEvenMonths} months`}
                    >
                      {breakEvenPct > 15 ? "Paying Fees" : ""}
                    </div>
                    <div
                      style={{ width: `${100 - breakEvenPct}%`, backgroundColor: "var(--emerald-wash)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: "700", color: "var(--emerald)" }}
                      title={`Pure Savings: ${a.remainingMonths - a.breakEvenMonths} months`}
                    >
                      {(100 - breakEvenPct) > 15 ? "Pure Savings" : ""}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "6px" }}>
                    Transfer costs are recovered in <b>{a.breakEvenMonths} months</b>. Every month after that adds <b>{formatINR(a.monthlySavings)}</b> in estimated net cash flow.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "0.72rem", color: "var(--clay)", fontWeight: "600" }}>
                  {a.netSavings <= 0
                    ? "The interest saved does not cover the refinancing charges in this estimate."
                    : `The rate difference is only ${(a.currentRate - newRate).toFixed(2)}%. Balance transfer usually needs a wider gap to justify the operational effort.`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "14px", lineHeight: "1.4", borderTop: "1px solid var(--line-strong)", paddingTop: "8px" }}>
        RBI note: Individual floating-rate home loans generally have no foreclosure penalty in India. Check your loan agreement and current lender process before transferring.
      </div>
    </div>
  );
}
