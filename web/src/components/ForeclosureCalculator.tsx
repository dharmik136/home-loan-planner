import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function ForeclosureCalculator({ results }: Props) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(() => results[0]?.loan.id ?? "");
  const [atMonth, setAtMonth] = useState<number>(12);
  const [penaltyPct, setPenaltyPct] = useState<number>(2);

  if (results.length === 0) return null;

  const result = results.find((r) => r.loan.id === selectedLoanId) ?? results[0];
  const { plan } = result;

  const maxMonth = plan.rows.length;
  const clampedMonth = Math.min(atMonth, maxMonth);

  // Find closing balance at the selected month
  const rowAtMonth = plan.rows[clampedMonth - 1];
  const outstandingAtMonth = rowAtMonth ? rowAtMonth.closing : 0;

  // Penalty on outstanding principal
  const penaltyAmount = Math.round((outstandingAtMonth * penaltyPct) / 100);
  const totalForeclosureCost = outstandingAtMonth + penaltyAmount;

  // Interest already paid up to this month
  const interestPaidSoFar = plan.rows
    .slice(0, clampedMonth)
    .reduce((sum, r) => sum + r.interest, 0);

  // Interest saved vs original plan
  const interestRemaining = plan.totalInterest - interestPaidSoFar;

  return (
    <div className="panel s9" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🔐 / Close Early</span>
        Foreclosure Cost Calculator
      </div>

      {results.length > 1 && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>Select Loan</label>
          <select
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--body)", fontSize: "0.82rem", color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "2px", padding: "7px 9px", outline: "none" }}
          >
            {results.map((r) => (
              <option key={r.loan.id} value={r.loan.id}>{r.loan.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Close at Month</span>
            <span><b>{clampedMonth}</b></span>
          </div>
          <input
            type="range" min={1} max={maxMonth} step={1}
            value={clampedMonth}
            onChange={(e) => setAtMonth(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Penalty Rate</span>
            <span><b>{penaltyPct}%</b></span>
          </div>
          <input
            type="range" min={0} max={5} step={0.25}
            value={penaltyPct}
            onChange={(e) => setPenaltyPct(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "11px 13px", display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Outstanding Principal:</span>
          <span><b>{formatINR(Math.round(outstandingAtMonth))}</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Foreclosure Penalty ({penaltyPct}%):</span>
          <span style={{ color: "var(--clay)" }}><b>{formatINR(penaltyAmount)}</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: "700", borderTop: "1px dashed var(--line-strong)", paddingTop: "7px" }}>
          <span>Total Foreclosure Cost:</span>
          <span>{formatINR(totalForeclosureCost)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--emerald)" }}>
          <span>Interest Saved by Closing:</span>
          <span><b>{formatINR(Math.round(interestRemaining))}</b></span>
        </div>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 RBI mandates <b>zero foreclosure penalty for floating-rate loans</b> from scheduled commercial banks. Penalty applies only on fixed-rate or NBFC loans.
      </div>
    </div>
  );
}
