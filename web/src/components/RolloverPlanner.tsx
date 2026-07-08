import { useState } from "react";
import { type Loan } from "../engine/planning";
import { computeRollover } from "../engine/rollover";
import { monthlyEmi } from "../engine/amortization";
import { formatINR, formatCompactINR, monthLabel } from "../engine/format";
import { downloadCSV } from "../engine/csv";

interface Props {
  loans: Loan[];
}

export function RolloverPlanner({ loans }: Props) {
  const [extraBudget, setExtraBudget] = useState(10000);
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [showSchedule, setShowSchedule] = useState(false);

  const res = computeRollover(loans, extraBudget, strategy);

  const totalBaseEmi = loans.reduce((sum, l) => {
    // Standard EMI approximation for UI max reference
    const r = l.ratePct / 100 / 12;
    if (r === 0) return sum + Math.ceil(l.outstanding / l.tenureMonths);
    const factor = Math.pow(1 + r, l.tenureMonths);
    return sum + Math.ceil((l.outstanding * r * factor) / (factor - 1));
  }, 0);

  const maxSliderBudget = Math.max(100000, totalBaseEmi);

  const handleExportCSV = () => {
    if (res.rows.length === 0) return;
    
    // Generate headers
    const headers = [
      "Month",
      "Calendar Date",
      "Opening Balance",
      "Base EMI Paid",
      "Extra Rollover Prepayment",
      "Interest Paid",
      "Principal Paid",
      "Closing Balance",
    ];

    // Add individual loan balance headers
    loans.forEach((loan) => {
      headers.push(`${loan.name} Balance`);
    });

    // Map rows
    const csvData = res.rows.map((r) => {
      const dateStr = monthLabel(loans[0]?.startYYYYMM || "2026-07", r.month);
      const row = [
        r.month,
        dateStr,
        r.opening,
        r.emi,
        r.prepayment,
        r.interest,
        round2(r.emi + r.prepayment - r.interest), // principal paid
        r.closing,
      ];
      loans.forEach((loan) => {
        row.push(r.balances[loan.id] ?? 0);
      });
      return row;
    });

    downloadCSV(headers, csvData, `combined_debt_rollover_${strategy}.csv`);
  };

  return (
    <div className="panel s6" style={{ marginTop: "24px" }}>
      <div className="panel-title">
        <span className="num">06 / Portfolio Rollover Planner</span> 
        Rollover freed EMIs to eliminate all debt fast
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div className="slider-meta" style={{ marginBottom: 4 }}>
              <span>Extra Monthly Prepayment Budget</span>
              <span><b>{formatINR(extraBudget)}</b>/mo</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxSliderBudget}
              step={1000}
              value={extraBudget}
              onChange={(e) => setExtraBudget(Number(e.target.value))}
            />
            <span style={{ fontSize: "0.68rem", color: "var(--ink-faint)", display: "block", marginTop: "3px" }}>
              Total monthly commitment: <b>{formatINR(totalBaseEmi + extraBudget)}</b> (EMIs + extra budget)
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.66rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "6px" }}>
              Rollover Strategy
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={`add-btn ${strategy === "avalanche" ? "" : "secondary"}`}
                onClick={() => setStrategy("avalanche")}
                style={{ flex: 1, padding: "8px", fontSize: "0.8rem", height: "auto" }}
              >
                🗻 Avalanche (Highest Rate First)
              </button>
              <button
                className={`add-btn ${strategy === "snowball" ? "" : "secondary"}`}
                onClick={() => setStrategy("snowball")}
                style={{ flex: 1, padding: "8px", fontSize: "0.8rem", height: "auto" }}
              >
                ❄️ Snowball (Lowest Balance First)
              </button>
            </div>
            <span style={{ fontSize: "0.66rem", color: "var(--ink-faint)", display: "block", marginTop: "5px", lineHeight: "1.3" }}>
              {strategy === "avalanche"
                ? "Prioritizes interest rate. Mathematically reduces total interest payout to the absolute minimum."
                : "Prioritizes outstanding balance. Closes smaller loans first to free up EMIs and build momentum."}
            </span>
          </div>
        </div>

        {/* Results Overview Column */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "3px", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "700", marginBottom: "10px" }}>
              Rollover Plan Highlights
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "0.66rem", color: "var(--ink-faint)" }}>Total Interest Saved</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--emerald)", fontFamily: "var(--display)" }}>
                  {formatCompactINR(res.totalInterestSaved)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.66rem", color: "var(--ink-faint)" }}>Time Saved</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--ink)", fontFamily: "var(--display)" }}>
                  {res.monthsSaved > 0
                    ? `${Math.floor(res.monthsSaved / 12)}y ${res.monthsSaved % 12}m`
                    : "0 months"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.78rem", borderTop: "1px dashed var(--line)", paddingTop: "10px" }}>
              • Debt-Free Date: <b>{monthLabel(loans[0]?.startYYYYMM || "2026-07", res.monthsToPayoff)}</b> (Month {res.monthsToPayoff})<br/>
              • Baseline Debt-Free: <b>{monthLabel(loans[0]?.startYYYYMM || "2026-07", res.baselineMonthsToPayoff)}</b> (Month {res.baselineMonthsToPayoff})
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="add-btn secondary"
              style={{ flex: 1, fontSize: "0.76rem", padding: "6px 12px", height: "30px" }}
            >
              {showSchedule ? "Hide Schedule" : "View Schedule"}
            </button>
            <button
              onClick={handleExportCSV}
              className="add-btn"
              style={{ flex: 1, fontSize: "0.76rem", padding: "6px 12px", height: "30px" }}
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Payoff Timeline list */}
      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "700", marginBottom: "8px" }}>
          🏁 Payoff Sequence & Freed EMIs
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {loans.map((loan) => {
            const payoffM = res.payoffMonths[loan.id];
            const dateStr = monthLabel(loan.startYYYYMM, payoffM);
            const baseEmiStr = formatINR(monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths));
            return (
              <div
                key={loan.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--panel)",
                  borderLeft: "4px solid var(--emerald)",
                  padding: "8px 12px",
                  borderRadius: "2px",
                  fontSize: "0.82rem"
                }}
              >
                <div>
                  <span style={{ fontWeight: "600" }}>{loan.name}</span>
                  <span style={{ color: "var(--ink-faint)", marginLeft: "8px", fontSize: "0.72rem" }}>
                    (EMI: {baseEmiStr})
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: "bold", color: "var(--emerald)" }}>Paid off: Month {payoffM}</span>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                    {dateStr} · frees up {baseEmiStr}/mo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month-by-month rollover schedule */}
      {showSchedule && res.rows.length > 0 && (
        <div style={{ marginTop: "20px", overflowX: "auto", borderTop: "1px dashed var(--line-strong)", paddingTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: "bold", color: "var(--ink)" }}>Combined Payoff Schedule</span>
          </div>
          <table className="schedule-table" style={{ width: "100%", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Opening Balance</th>
                <th style={{ textAlign: "right" }}>EMI Paid</th>
                <th style={{ textAlign: "right" }}>Extra Prepay</th>
                <th style={{ textAlign: "right" }}>Interest Paid</th>
                <th style={{ textAlign: "right" }}>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {res.rows.slice(0, 120).map((r) => {
                const dateStr = monthLabel(loans[0]?.startYYYYMM || "2026-07", r.month);
                return (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{dateStr}</td>
                    <td style={{ textAlign: "right" }}>{formatINR(r.opening)}</td>
                    <td style={{ textAlign: "right" }}>{formatINR(r.emi)}</td>
                    <td style={{ textAlign: "right" }}>{formatINR(r.prepayment)}</td>
                    <td style={{ textAlign: "right" }}>{formatINR(r.interest)}</td>
                    <td style={{ textAlign: "right" }}>{formatINR(r.closing)}</td>
                  </tr>
                );
              })}
              {res.rows.length > 120 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-faint)", fontStyle: "italic", padding: "8px" }}>
                    Showing first 120 months. Export CSV to view full {res.rows.length} month payoff ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}
