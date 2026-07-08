import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";

interface Props {
  results: LoanResult[];
}

interface SIPProjection {
  year: number;
  totalInvested: number;
  portfolioValue: number;
  loanBalance: number;
  netWorth: number;
}

export function NetWorthProjector({ results }: Props) {
  const [monthlySIP, setMonthlySIP] = useState(10_000);
  const [sipCagr, setSipCagr] = useState(12);
  const [currentSavings, setCurrentSavings] = useState(500_000);

  if (results.length === 0) return null;

  const maxTenureYears = Math.ceil(Math.max(...results.map((r) => r.loan.tenureMonths)) / 12);
  const displayYears = Math.min(30, maxTenureYears + 5);

  const projections = useMemo((): SIPProjection[] => {
    const rows: SIPProjection[] = [];
    let portfolio = currentSavings;

    for (let year = 1; year <= displayYears; year++) {
      // SIP grows monthly at sipCagr
      const monthlyReturn = sipCagr / 100 / 12;
      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlySIP;
      }

      // Total loan balance remaining across all loans at this year
      const monthIndex = year * 12;
      const loanBalance = results.reduce((sum, r) => {
        const row = r.plan.rows[Math.min(monthIndex - 1, r.plan.rows.length - 1)];
        return sum + (row ? row.closing : 0);
      }, 0);

      const totalInvested = currentSavings + monthlySIP * 12 * year;
      rows.push({
        year,
        totalInvested: Math.round(totalInvested),
        portfolioValue: Math.round(portfolio),
        loanBalance: Math.round(loanBalance),
        netWorth: Math.round(portfolio - loanBalance),
      });
    }
    return rows;
  }, [results, monthlySIP, sipCagr, currentSavings, displayYears]);

  const debtFreeYear = projections.find((p) => p.loanBalance === 0)?.year ?? maxTenureYears;
  const tenYearNetWorth = projections.find((p) => p.year === Math.min(10, displayYears));
  const finalNetWorth = projections[projections.length - 1];

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">📈 / Net Worth</span>
        Financial Independence Projector
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Monthly SIP</span><span><b>{formatINR(monthlySIP)}</b></span></div>
          <input type="range" min={1_000} max={100_000} step={1_000} value={monthlySIP}
            onChange={(e) => setMonthlySIP(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>SIP CAGR</span><span><b>{sipCagr}%</b></span></div>
          <input type="range" min={6} max={18} step={0.5} value={sipCagr}
            onChange={(e) => setSipCagr(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Current Savings / Portfolio</span><span><b>{formatINR(currentSavings)}</b></span></div>
        <input type="range" min={0} max={10_000_000} step={100_000} value={currentSavings}
          onChange={(e) => setCurrentSavings(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      {/* Milestone cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {tenYearNetWorth && (
          <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "0.66rem", color: "var(--ink-soft)", marginBottom: "3px" }}>10-YEAR NET WORTH</div>
            <div style={{ fontWeight: "800", fontSize: "0.95rem", color: tenYearNetWorth.netWorth > 0 ? "var(--emerald)" : "var(--clay)" }}>
              {formatINR(tenYearNetWorth.netWorth)}
            </div>
          </div>
        )}
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.66rem", color: "var(--ink-soft)", marginBottom: "3px" }}>DEBT-FREE IN</div>
          <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--emerald)" }}>Year {debtFreeYear}</div>
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.66rem", color: "var(--ink-soft)", marginBottom: "3px" }}>PORTFOLIO at Yr {displayYears}</div>
          <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#6366f1" }}>{formatINR(finalNetWorth?.portfolioValue ?? 0)}</div>
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.66rem", color: "var(--ink-soft)", marginBottom: "3px" }}>FINAL NET WORTH</div>
          <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--emerald)" }}>{formatINR(finalNetWorth?.netWorth ?? 0)}</div>
        </div>
      </div>

      {/* Mini timeline table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line-strong)" }}>
              <th style={{ textAlign: "left", padding: "5px 6px", color: "var(--ink-soft)" }}>Year</th>
              <th style={{ textAlign: "right", padding: "5px 6px", color: "var(--ink-soft)" }}>Portfolio</th>
              <th style={{ textAlign: "right", padding: "5px 6px", color: "var(--clay)" }}>Loan Bal.</th>
              <th style={{ textAlign: "right", padding: "5px 6px", color: "var(--emerald)" }}>Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {projections.filter((_, i) => i % 5 === 4 || i === 0 || i === projections.length - 1).map((p) => (
              <tr key={p.year} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "5px 6px", fontWeight: "600" }}>Yr {p.year}</td>
                <td style={{ padding: "5px 6px", textAlign: "right" }}>{formatINR(p.portfolioValue)}</td>
                <td style={{ padding: "5px 6px", textAlign: "right", color: p.loanBalance > 0 ? "var(--clay)" : "var(--emerald)" }}>
                  {p.loanBalance > 0 ? formatINR(p.loanBalance) : "✅ Paid"}
                </td>
                <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: "700", color: p.netWorth > 0 ? "var(--emerald)" : "var(--clay)" }}>
                  {formatINR(p.netWorth)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
