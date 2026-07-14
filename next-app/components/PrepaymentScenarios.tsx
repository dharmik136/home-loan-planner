import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";
import { Ruler } from "lucide-react";

interface Props {
  results: LoanResult[];
}

interface ScenarioResult {
  label: string;
  color: string;
  monthlyExtra: number;
  interestSaved: number;
  monthsSaved: number;
  totalPaid: number;
}

export function PrepaymentScenarios({ results }: Props) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(() => results[0]?.loan.id ?? "");

  if (results.length === 0) return null;

  const result = results.find((r) => r.loan.id === selectedLoanId) ?? results[0];
  const { loan, plan } = result;

  const scenarios = useMemo((): ScenarioResult[] => {
    const r = loan.ratePct / 100 / 12;
    const baseEmi = result.emi;
    const principal = loan.outstanding;
    const tenure = loan.tenureMonths;

    const simulate = (extraPerMonth: number) => {
      let balance = principal;
      let totalInterest = 0;
      let months = 0;
      while (balance > 0 && months < 600) {
        const interest = balance * r;
        const principalPaid = baseEmi - interest;
        balance -= principalPaid + extraPerMonth;
        totalInterest += interest;
        months++;
        if (balance <= 0) break;
      }
      return {
        interestSaved: Math.max(0, plan.totalInterest - totalInterest),
        monthsSaved: Math.max(0, plan.monthsToPayoff - months),
        totalPaid: Math.round(baseEmi * months + extraPerMonth * months),
      };
    };

    return [
      { label: "No Prepayment (Baseline)", color: "var(--ink-faint)", monthlyExtra: 0, ...simulate(0), interestSaved: 0, monthsSaved: 0, totalPaid: Math.round(baseEmi * tenure) },
      { label: "+₹2,000 / month", color: "#A8603D", monthlyExtra: 2_000, ...simulate(2_000) },
      { label: "+₹5,000 / month", color: "var(--gold)", monthlyExtra: 5_000, ...simulate(5_000) },
      { label: "+₹10,000 / month", color: "var(--emerald)", monthlyExtra: 10_000, ...simulate(10_000) },
      { label: "+₹20,000 / month", color: "var(--clay)", monthlyExtra: 20_000, ...simulate(20_000) },
    ];
  }, [result, loan]);

  const baselineTotal = scenarios[0].totalPaid;

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Ruler size={13} /> / Scenarios</span>
        Prepayment Scenario Comparison
      </div>

      {results.length > 1 && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>Loan</label>
          <select value={selectedLoanId} onChange={(e) => setSelectedLoanId(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--body)", fontSize: "0.82rem", color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "2px", padding: "7px 9px", outline: "none" }}>
            {results.map((r) => <option key={r.loan.id} value={r.loan.id}>{r.loan.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line-strong)", background: "var(--panel)" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--ink-soft)" }}>Scenario</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Months Saved</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Interest Saved</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>vs Baseline</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--line)", background: i === 0 ? "var(--panel)" : "transparent" }}>
                <td style={{ padding: "7px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: i === 0 ? "400" : "600" }}>{s.label}</span>
                  </div>
                </td>
                <td style={{ padding: "7px 8px", textAlign: "right" }}>
                  {s.monthsSaved > 0 ? <span style={{ color: "var(--emerald)", fontWeight: "700" }}>-{s.monthsSaved} mo</span> : "—"}
                </td>
                <td style={{ padding: "7px 8px", textAlign: "right" }}>
                  {s.interestSaved > 0 ? <span style={{ color: "var(--emerald)", fontWeight: "700" }}>{formatINR(Math.round(s.interestSaved))}</span> : "—"}
                </td>
                <td style={{ padding: "7px 8px", textAlign: "right", color: i === 0 ? "var(--ink-faint)" : "var(--emerald)", fontWeight: "700" }}>
                  {i === 0 ? "Baseline" : `-${formatINR(Math.round(baselineTotal - s.totalPaid))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        Even Rs 2,000 extra per month consistently applied from Month 1 can reduce interest over a 15 to 20 year tenure.
      </div>
    </div>
  );
}
