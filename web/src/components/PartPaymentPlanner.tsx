import { useState } from "react";

type BankName = "sbi" | "hdfc" | "icici" | "lic";

export function PartPaymentPlanner() {
  const [bank, setBank] = useState<BankName>("hdfc");

  const bankGuides: Record<BankName, { title: string; timing: string; details: string }> = {
    hdfc: {
      title: "HDFC Home Loan Timing",
      timing: "Prepay before the 5th of the calendar month",
      details: "HDFC computes monthly interest on the outstanding balance. Prepayments credited on or before the 5th are factored into that month's interest computation. If you pay on the 6th, you will only see the interest benefit from the next month."
    },
    sbi: {
      title: "SBI Home Loan Timing (Daily Reducing)",
      timing: "Prepay immediately as soon as cash is available",
      details: "SBI calculates interest on a daily reducing balance. Every single day your principal is lower reduces the daily interest accrual. Prepay the exact day you receive your salary or bonus to maximize savings."
    },
    icici: {
      title: "ICICI Bank Timing",
      timing: "Prepay before the 5th of the month",
      details: "ICICI generally uses a monthly reducing balance method. Credits must reach your loan account by the 5th to affect that month's interest charges."
    },
    lic: {
      title: "LIC Housing Finance Timing",
      timing: "Prepay before the 10th of the month",
      details: "LIC Housing Finance calculates interest on the monthly reducing balance, taking the balance as of the 10th. Ensure prepayments are cleared in their system before this cut-off."
    }
  };

  const guide = bankGuides[bank];

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">📅 / Calendar</span>
        Part-Payment Timing Planner
      </div>
      
      <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "14px", lineHeight: "1.4" }}>
        Lenders calculate interest using specific monthly cutoff dates. Prepaying on the wrong day can cost you a full month of interest savings!
      </p>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>Select Your Lender</label>
        <select
          value={bank}
          onChange={(e) => setBank(e.target.value as BankName)}
          style={{
            width: "100%",
            fontFamily: "var(--body)",
            fontSize: "0.82rem",
            color: "var(--ink)",
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "2px",
            padding: "7px 9px",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="hdfc">HDFC Bank</option>
          <option value="sbi">State Bank of India (SBI)</option>
          <option value="icici">ICICI Bank</option>
          <option value="lic">LIC Housing Finance</option>
        </select>
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "12px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--ink)", marginBottom: "6px" }}>
          🎯 Optimum Window:
        </div>
        <div style={{ fontSize: "0.86rem", color: "#d97706", fontWeight: "700", marginBottom: "8px" }}>
          {guide.timing}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
          {guide.details}
        </div>
      </div>
    </div>
  );
}
