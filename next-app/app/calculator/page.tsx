'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { formatINR, formatCompactINR } from '../../engine/format';
import { Download } from 'lucide-react';
import { Callout } from '../../components/Callout';

// Types definition
interface LoanData {
  principal: number;
  rate: number;
  tenureYears: number;
  monthlyPrepay: number;
  lumpSum: number;
  lumpSumMonth: number;
  ruleset: 'NONE' | 'RBI_FLOATING' | 'HDFC' | 'CUSTOM';
}

export default function CalculatorPage() {
  // Page state
  const [loan, setLoan] = useState<LoanData>({
    principal: 4500000,
    rate: 9.1,
    tenureYears: 15,
    monthlyPrepay: 5000,
    lumpSum: 200000,
    lumpSumMonth: 12,
    ruleset: 'HDFC',
  });

  // Math engines
  const emiAndSchedules = useMemo(() => {
    const r = loan.rate / 100 / 12;
    const n = loan.tenureYears * 12;
    const baseEmi = (loan.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    if (isNaN(baseEmi) || baseEmi <= 0) {
      return {
        baseEmi: 0,
        baselineSchedule: [],
        prepaySchedule: [],
        interestSaved: 0,
        monthsSaved: 0,
        newPayoffDate: '',
        warningMsg: null,
      };
    }

    // 1. Baseline Schedule
    let balBase = loan.principal;
    let interestBaseTotal = 0;
    const baselineSchedule = [];
    
    for (let month = 1; month <= n; month++) {
      const interest = balBase * r;
      let principalPaid = baseEmi - interest;
      if (principalPaid > balBase) {
        principalPaid = balBase;
      }
      interestBaseTotal += interest;
      balBase -= principalPaid;
      
      baselineSchedule.push({
        month,
        emi: baseEmi,
        prepay: 0,
        interest,
        principalPaid,
        outstanding: Math.max(0, balBase),
      });
      if (balBase <= 0) break;
    }

    // 2. Prepay Schedule with lender rules check
    let balPrepay = loan.principal;
    let interestPrepayTotal = 0;
    const prepaySchedule = [];
    let warningMsg: string | null = null;

    // Tracker for annual HDFC 75% limit check
    let annualPrepayTotal = 0;
    const hdfcMaxAnnualLimit = loan.principal * 0.75;

    for (let month = 1; month <= n; month++) {
      if (balPrepay <= 0) break;

      const interest = balPrepay * r;
      let regularPrincipal = baseEmi - interest;
      if (regularPrincipal > balPrepay) regularPrincipal = balPrepay;

      // Add prepayments
      let prepaymentMade = loan.monthlyPrepay;
      if (month === loan.lumpSumMonth) {
        prepaymentMade += loan.lumpSum;
      }

      // Check rulesets
      if (loan.ruleset === 'HDFC') {
        // Track calendar/annual limits
        if (month % 12 === 1) {
          annualPrepayTotal = 0; // Reset every 12 months
        }
        
        if (annualPrepayTotal + prepaymentMade > hdfcMaxAnnualLimit) {
          warningMsg = `HDFC Rule Alert: Prepayment total of ₹${(annualPrepayTotal + prepaymentMade).toLocaleString('en-IN')} exceeds 75% opening principal limit (₹${hdfcMaxAnnualLimit.toLocaleString('en-IN')}) at Month ${month}.`;
          prepaymentMade = Math.max(0, hdfcMaxAnnualLimit - annualPrepayTotal);
        }
        annualPrepayTotal += prepaymentMade;
      } else if (loan.ruleset === 'RBI_FLOATING') {
        warningMsg = `RBI Floating Rate Guidelines: Individual floating rate loans have ZERO prepayment penalty or constraints. Prepay as much as you like!`;
      }

      let totalPrincipalPaid = regularPrincipal + prepaymentMade;
      if (totalPrincipalPaid > balPrepay) {
        prepaymentMade = Math.max(0, balPrepay - regularPrincipal);
        totalPrincipalPaid = balPrepay;
      }

      interestPrepayTotal += interest;
      balPrepay -= totalPrincipalPaid;

      prepaySchedule.push({
        month,
        emi: baseEmi,
        prepay: prepaymentMade,
        interest,
        principalPaid: totalPrincipalPaid,
        outstanding: Math.max(0, balPrepay),
      });
    }

    const interestSaved = Math.max(0, interestBaseTotal - interestPrepayTotal);
    const monthsSaved = Math.max(0, baselineSchedule.length - prepaySchedule.length);

    // Calculate dates
    const dateObj = new Date();
    dateObj.setMonth(dateObj.getMonth() + prepaySchedule.length);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };
    const newPayoffDate = dateObj.toLocaleDateString('en-US', options);

    return {
      baseEmi,
      baselineSchedule,
      prepaySchedule,
      interestSaved,
      monthsSaved,
      newPayoffDate,
      warningMsg,
    };
  }, [loan]);

  // Chart Data preparation
  const { maxLen, chartData } = useMemo(() => {
    const { baselineSchedule, prepaySchedule } = emiAndSchedules;
    const len = baselineSchedule.length;
    const dataList = [];
    for (let i = 0; i < len; i++) {
      const year = (i + 1) / 12;
      dataList.push({
        year: Number(year.toFixed(2)),
        baseline: baselineSchedule[i]?.outstanding ?? 0,
        plan: i < prepaySchedule.length ? prepaySchedule[i].outstanding : 0,
      });
    }
    return { maxLen: len, chartData: dataList };
  }, [emiAndSchedules]);

  // Export to CSV helper
  const handleCSVExport = () => {
    const headers = 'Month,Base EMI,Prepayment Paid,Interest Paid,Outstanding Balance\n';
    const rows = emiAndSchedules.prepaySchedule
      .map(
        (m) =>
          `${m.month},${Math.round(m.emi)},${Math.round(m.prepay)},${Math.round(m.interest)},${Math.round(
            m.outstanding
          )}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'amortization_schedule.csv');
    a.click();
  };

  return (
    <div className="wrap planner-page-container">
      <div className="rule-row">
        <span>Single-loan prepayment simulator</span>
        <span>Conforms to lender regulations</span>
        <span>No signup required</span>
      </div>

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px double var(--line-strong)", paddingBottom: "10px", marginBottom: "15px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontFamily: "var(--display)", fontWeight: "800" }}>
            Single Loan Prepayment Simulator
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "4px 0 0 0", fontSize: "0.85rem" }}>
            Model individual loan prepayments conforming to lender regulations.
          </p>
        </div>
        <button
          onClick={handleCSVExport}
          className="btn"
          style={{ height: "36px", minHeight: "36px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          Export CSV <Download size={15} />
        </button>
      </header>

      {/* Warning Banner */}
      {emiAndSchedules.warningMsg && (
        <Callout variant="warning">
          <span style={{ fontWeight: 600 }}>{emiAndSchedules.warningMsg}</span>
        </Callout>
      )}

      <div className="grid">
        {/* Left Column: Form Controls */}
        <aside className="col-left">
          <div className="panel s2">
            <div className="panel-title">
              <span className="num">01</span>
              Loan details
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="input-group">
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                  Loan Amount (Principal)
                </label>
                <input
                  type="number"
                  value={loan.principal}
                  onChange={(e) => setLoan({ ...loan, principal: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loan.rate}
                    onChange={(e) => setLoan({ ...loan, rate: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    value={loan.tenureYears}
                    onChange={(e) => setLoan({ ...loan, tenureYears: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel s3" style={{ marginTop: "16px" }}>
            <div className="panel-title">
              <span className="num">02</span>
              Prepayment Parameters
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="input-group">
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                  Lender Ruleset
                </label>
                <select
                  value={loan.ruleset}
                  onChange={(e) => setLoan({ ...loan, ruleset: e.target.value as LoanData['ruleset'] })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                >
                  <option value="NONE">No Constraints (Theoretical)</option>
                  <option value="RBI_FLOATING">RBI Floating Rate Rules (No penalty)</option>
                  <option value="HDFC">HDFC Bank rules (75% Annual Cap)</option>
                  <option value="CUSTOM">Custom restrictions</option>
                </select>
              </div>

              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Monthly Prepayment
                  </label>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--emerald)" }}>
                    {formatINR(loan.monthlyPrepay)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={loan.monthlyPrepay}
                    onChange={(e) => setLoan({ ...loan, monthlyPrepay: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px dashed var(--line)", paddingTop: "12px" }}>
                <div className="input-group">
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Lump Sum Prepay
                  </label>
                  <input
                    type="number"
                    value={loan.lumpSum}
                    onChange={(e) => setLoan({ ...loan, lumpSum: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Target Month
                  </label>
                  <input
                    type="number"
                    value={loan.lumpSumMonth}
                    onChange={(e) => setLoan({ ...loan, lumpSumMonth: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Visuals & Metrics */}
        <main className="col-main">
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            <div className="panel s2" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", padding: "15px" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>Interest Saved</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)", marginTop: "6px" }}>
                {formatCompactINR(emiAndSchedules.interestSaved)}
              </div>
            </div>
            <div className="panel s3" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", padding: "15px" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>Time Saved</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)", marginTop: "6px" }}>
                {emiAndSchedules.monthsSaved} Months
              </div>
            </div>
            <div className="panel s4" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", padding: "15px" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>New Payoff Date</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)", marginTop: "6px" }}>
                {emiAndSchedules.newPayoffDate}
              </div>
            </div>
          </div>

          {/* Balance Chart (Recharts!) */}
          <div className="panel s4" style={{ marginBottom: "20px" }}>
            <div className="panel-title">
              <span className="num">03</span>
              Balance Projection
            </div>
            <div className="legend" style={{ display: "flex", gap: "15px", fontSize: "0.75rem", margin: "10px 0" }}>
              <span><i style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--clay)", marginRight: "5px", borderRadius: "2px" }} />Paying minimum (baseline)</span>
              <span><i style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--emerald)", marginRight: "5px", borderRadius: "2px" }} />With your prepayments</span>
            </div>
            <div className="chart-wrap" style={{ height: "260px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[0, Math.ceil(maxLen / 12)]}
                    tickCount={Math.ceil(maxLen / 12) + 1}
                    stroke="var(--line-strong)"
                    tickLine={false}
                    label={{ value: "year", position: "insideBottomRight", offset: -2, fontSize: 11, fill: "var(--ink-faint)" }}
                  />
                  <YAxis
                    stroke="var(--line-strong)"
                    tickLine={false}
                    width={54}
                    tickFormatter={(v) => (v >= 1e5 ? (v / 1e5).toFixed(0) + "L" : String(v))}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="baseline" stroke="var(--clay)" strokeWidth={2} dot={false} strokeDasharray="5 4" />
                  <Line type="monotone" dataKey="plan" stroke="var(--emerald)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="panel s2">
            <div className="panel-title">
              <span className="num">04</span>
              Amortization Schedule Ledger (First 12 Months)
            </div>
            <div className="table-wrap" style={{ overflowX: "auto", marginTop: "10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line-strong)", background: "var(--panel)" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>Month</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Base EMI</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Prepayment</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Interest Paid</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Outstanding Bal</th>
                  </tr>
                </thead>
                <tbody>
                  {emiAndSchedules.prepaySchedule.slice(0, 12).map((m: any) => (
                    <tr key={m.month} style={{ borderBottom: "1px solid var(--line)" }} className="hover:bg-muted/10">
                      <td style={{ padding: "8px" }}>Month {m.month}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{formatINR(m.emi)}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "var(--emerald)", fontWeight: 600 }}>
                        {m.prepay > 0 ? formatINR(m.prepay) : "-"}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{formatINR(m.interest)}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{formatINR(m.outstanding)}</td>
                    </tr>
                  ))}
                  {emiAndSchedules.prepaySchedule.length > 12 && (
                    <tr style={{ background: "var(--panel)" }}>
                      <td colSpan={5} style={{ padding: "10px", textAlign: "center", color: "var(--ink-soft)", fontStyle: "italic" }}>
                        ... and {emiAndSchedules.prepaySchedule.length - 12} more months in amortization schedule. Click Export CSV to download full ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const base = payload.find((p: any) => p.dataKey === "baseline")?.value ?? 0;
  const plan = payload.find((p: any) => p.dataKey === "plan")?.value ?? 0;
  return (
    <div className="tooltip">
      <div className="tt-h">Year {Number(label).toFixed(1)}</div>
      <div className="tt-c">Baseline: {formatCompactINR(base as number)}</div>
      <div className="tt-b">Your plan: {formatCompactINR(plan as number)}</div>
    </div>
  );
}
