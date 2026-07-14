import { useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";
import { Siren } from "lucide-react";

interface Props {
  results: LoanResult[];
}

export function InterestShockVisualizer({ results }: Props) {
  const shockData = useMemo(() => {
    return results.map((res) => {
      const { loan, plan } = res;
      const first5Years = plan.rows.slice(0, 60);
      
      const interest5Y = first5Years.reduce((sum, r) => sum + r.interest, 0);
      const principal5Y = first5Years.reduce((sum, r) => sum + r.principalPaid, 0);
      const emi5Y = first5Years.reduce((sum, r) => sum + r.emi, 0);
      
      const ratioInterest = emi5Y > 0 ? (interest5Y / emi5Y) * 100 : 0;
      const ratioPrincipal = emi5Y > 0 ? (principal5Y / emi5Y) * 100 : 0;

      return {
        loanName: loan.name,
        interest5Y,
        principal5Y,
        ratioInterest,
        ratioPrincipal,
        totalInterest: plan.totalInterest,
      };
    });
  }, [results]);

  if (results.length === 0) return null;

  return (
    <div className="panel" style={{ marginTop: "16px", borderLeft: "3px solid var(--clay)" }}>
      <div className="panel-title">
        <span className="num">Rate shock</span>
        The Front-Loaded Interest Trap
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "14px", lineHeight: "1.4" }}>
        Indian home loans compound monthly on a reducing balance. Banks structure EMIs so that they collect the majority of their profit (interest) in the first few years.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {shockData.map((d) => (
          <div key={d.loanName} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "4px", padding: "12px 14px" }}>
            <div style={{ fontWeight: "700", fontSize: "0.86rem", marginBottom: "8px" }}>
              {d.loanName} (First 5 Years)
            </div>

            {/* Split Bar */}
            <div style={{ height: "24px", display: "flex", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ width: `${d.ratioInterest}%`, background: "var(--clay)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.72rem", fontWeight: "700" }}>
                {d.ratioInterest.toFixed(0)}% Interest
              </div>
              <div style={{ width: `${d.ratioPrincipal}%`, background: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.72rem", fontWeight: "700" }}>
                {d.ratioPrincipal.toFixed(0)}% Principal
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.78rem", marginTop: "8px" }}>
              <div>
                <span style={{ color: "var(--ink-soft)" }}>Interest Paid in 5 Yrs:</span><br />
                <b style={{ color: "var(--clay)" }}>{formatINR(Math.round(d.interest5Y))}</b>
              </div>
              <div>
                <span style={{ color: "var(--ink-soft)" }}>Principal Paid in 5 Yrs:</span><br />
                <b style={{ color: "var(--emerald)" }}>{formatINR(Math.round(d.principal5Y))}</b>
              </div>
            </div>

            {d.ratioInterest > 50 && (
              <div style={{ fontSize: "0.74rem", color: "var(--clay)", marginTop: "10px", fontWeight: "500", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <Siren size={14} className="shrink-0" style={{ marginTop: "1px" }} />
                Warning: Over 50% of your payments in the first 5 years goes purely to bank interest, not paying down your home! Prepaying early breaks this trap.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
