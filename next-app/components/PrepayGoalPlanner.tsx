import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";
import { Target } from "lucide-react";

interface Props {
  results: LoanResult[];
}

interface PrepayGoalRow {
  targetMonth: number;
  requiredPrepay: number;
  monthsEarlier: number;
  interestSaved: number;
}

export function PrepayGoalPlanner({ results }: Props) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(() => results[0]?.loan.id ?? "");

  if (results.length === 0) return null;

  const result = results.find((r) => r.loan.id === selectedLoanId) ?? results[0];
  const { plan, loan } = result;

  const originalMonths = plan.monthsToPayoff;

  // Binary-search for the prepayment at month 1 needed to pay off in targetMonths
  // We'll show a range of payoff targets
  const goals = useMemo(() => {
    const out: PrepayGoalRow[] = [];
    const steps = [5, 7, 10, 12, 15];

    steps.forEach((yrs) => {
      const tgt = yrs * 12;
      if (tgt >= originalMonths) return;

      // Estimate needed prepayment via bisection
      const r = loan.ratePct / 100 / 12;
      const baseEmi = result.emi;

      // Simple approximation: extra monthly payment to clear in tgt months
      // total_pmt = outstanding * r * (1+r)^tgt / ((1+r)^tgt - 1)
      const factor = Math.pow(1 + r, tgt);
      const requiredTotalPmt = r > 0
        ? Math.ceil(loan.outstanding * r * factor / (factor - 1))
        : Math.ceil(loan.outstanding / tgt);

      const extraPerMonth = Math.max(0, requiredTotalPmt - baseEmi);

      // Estimate interest saved: rough = (originalMonths - tgt) * baseEmi * (r / (1+r))
      const interestSaved = Math.max(0, plan.totalInterest - (requiredTotalPmt * tgt - loan.outstanding));

      out.push({
        targetMonth: tgt,
        requiredPrepay: extraPerMonth,
        monthsEarlier: originalMonths - tgt,
        interestSaved: Math.round(interestSaved),
      });
    });
    return out;
  }, [result, loan, originalMonths]);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Target size={13} /> / Goal</span>
        Prepayment Goal Planner — What to pay to finish by target year
      </div>

      {results.length > 1 && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>Select Loan</label>
          <select value={selectedLoanId} onChange={(e) => setSelectedLoanId(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--body)", fontSize: "0.82rem", color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "2px", padding: "7px 9px", outline: "none" }}>
            {results.map((r) => <option key={r.loan.id} value={r.loan.id}>{r.loan.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: "12px" }}>
        Current payoff: <b>{Math.round(originalMonths / 12)} yrs {originalMonths % 12} months</b> · EMI: <b>{formatINR(result.emi)}</b>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line-strong)" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--ink-soft)" }}>Target</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Extra / Month</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Months Saved</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Interest Saved</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "12px 8px", color: "var(--ink-faint)", textAlign: "center" }}>Loan already within 5-year range — no goal scenarios to show.</td></tr>
            )}
            {goals.map((g) => (
              <tr key={g.targetMonth} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "7px 8px", fontWeight: "600" }}>{g.targetMonth / 12} yrs</td>
                <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--gold)", fontWeight: "700" }}>
                  {g.requiredPrepay > 0 ? `+${formatINR(g.requiredPrepay)}` : "No extra needed"}
                </td>
                <td style={{ padding: "7px 8px", textAlign: "right" }}>{g.monthsEarlier} months</td>
                <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--emerald)", fontWeight: "700" }}>{formatINR(g.interestSaved)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        These figures assume the extra monthly amount is added consistently from Month 1. Irregular prepayments will yield slightly different results.
      </div>
    </div>
  );
}
