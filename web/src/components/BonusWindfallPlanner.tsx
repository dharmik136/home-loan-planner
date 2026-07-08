import { useState } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";

interface Props {
  results: LoanResult[];
  onAddPrepayEntry?: (loanId: string, amount: number, monthIndex: number) => void;
}

const BONUS_TEMPLATES = [
  { label: "Annual Salary Bonus", defaultAmount: 100_000, description: "Year-end performance bonus" },
  { label: "Festival Bonus (Diwali)", defaultAmount: 50_000, description: "Festive season / arrears" },
  { label: "Tax Refund", defaultAmount: 30_000, description: "Income tax refund from ITR" },
  { label: "Stock Vesting (ESOP)", defaultAmount: 200_000, description: "ESOP/RSU vested shares proceeds" },
  { label: "Property Rental Income", defaultAmount: 25_000, description: "Monthly rental income surplus" },
  { label: "Custom Windfall", defaultAmount: 0, description: "Any one-time receipt" },
];

export function BonusWindfallPlanner({ results }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [amount, setAmount] = useState(BONUS_TEMPLATES[0].defaultAmount);
  const [targetLoanId, setTargetLoanId] = useState(() => results[0]?.loan.id ?? "");
  const [applyAtMonth, setApplyAtMonth] = useState(12);

  if (results.length === 0) return null;

  const targetResult = results.find((r) => r.loan.id === targetLoanId) ?? results[0];
  const maxMonth = targetResult.plan.rows.length;

  // Simulate what happens if this windfall is prepaid
  const rowAtMonth = targetResult.plan.rows[applyAtMonth - 1];
  const balanceBeforePrepay = rowAtMonth ? rowAtMonth.closing : 0;
  const effectivePaydown = Math.min(amount, balanceBeforePrepay);

  // Rough interest saved estimate: remaining months * rate saved
  const monthlyRate = targetResult.loan.ratePct / 100 / 12;
  const remainingMonths = maxMonth - applyAtMonth;
  const roughInterestSaved = effectivePaydown * monthlyRate * remainingMonths * 0.55; // ~55% is interest over remaining

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🎯 / Windfall</span>
        Bonus &amp; Windfall Planner
      </div>

      {/* Template selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        {BONUS_TEMPLATES.map((t, i) => (
          <button
            key={i}
            onClick={() => { setSelectedTemplate(i); if (t.defaultAmount > 0) setAmount(t.defaultAmount); }}
            style={{
              fontSize: "0.7rem", padding: "4px 8px", borderRadius: "3px", cursor: "pointer",
              border: `1px solid ${selectedTemplate === i ? "var(--emerald)" : "var(--line-strong)"}`,
              background: selectedTemplate === i ? "var(--emerald-wash)" : "var(--paper)",
              color: selectedTemplate === i ? "var(--emerald)" : "var(--ink-soft)",
              fontWeight: selectedTemplate === i ? "700" : "400",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Windfall Amount</span><span><b>{formatINR(amount)}</b></span></div>
          <input type="range" min={10_000} max={2_000_000} step={10_000} value={amount}
            onChange={(e) => setAmount(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Apply at Month</span><span><b>{applyAtMonth}</b></span></div>
          <input type="range" min={1} max={maxMonth} step={1} value={applyAtMonth}
            onChange={(e) => setApplyAtMonth(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      {results.length > 1 && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>Apply To</label>
          <select value={targetLoanId} onChange={(e) => setTargetLoanId(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--body)", fontSize: "0.82rem", color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "2px", padding: "7px 9px", outline: "none" }}>
            {results.map((r) => <option key={r.loan.id} value={r.loan.id}>{r.loan.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ background: "var(--emerald-wash)", border: "1px solid #c4dac9", borderRadius: "3px", padding: "11px 13px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Balance before prepayment (Month {applyAtMonth}):</span>
          <span><b>{formatINR(Math.round(balanceBeforePrepay))}</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Effective Paydown:</span>
          <span style={{ color: "var(--emerald)", fontWeight: "700" }}>{formatINR(Math.round(effectivePaydown))}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", borderTop: "1px dashed var(--line-strong)", paddingTop: "6px" }}>
          <span>Estimated Interest Saved:</span>
          <span style={{ color: "var(--emerald)", fontWeight: "700" }}>~{formatINR(Math.round(roughInterestSaved))}</span>
        </div>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 To lock this simulation into your plan, add a prepayment of {formatINR(amount)} at Month {applyAtMonth} in the loan's prepayment schedule above.
      </div>
    </div>
  );
}
