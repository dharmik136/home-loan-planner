import { useState } from "react";
import { formatINR } from "../engine/format";

type LoanType = "home" | "car" | "personal" | "education" | "lap";


const LOAN_CONFIGS: Record<LoanType, { label: string; ltv: number; maxTenure: number; rateHint: string }> = {
  home:       { label: "Home Loan",        ltv: 0.90, maxTenure: 360, rateHint: "8.5–9.5%" },
  car:        { label: "Car Loan",         ltv: 0.85, maxTenure: 84,  rateHint: "9–12%" },
  personal:   { label: "Personal Loan",    ltv: 1.00, maxTenure: 60,  rateHint: "12–24%" },
  education:  { label: "Education Loan",   ltv: 1.00, maxTenure: 120, rateHint: "9–11%" },
  lap:        { label: "Loan Against Prop",ltv: 0.70, maxTenure: 180, rateHint: "10–13%" },
};

function monthlyEmiCalc(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / months);
  const factor = Math.pow(1 + r, months);
  return Math.ceil((principal * r * factor) / (factor - 1));
}

export function LoanEligibilityChecker() {
  const [loanType, setLoanType] = useState<LoanType>("home");
  const [monthlyIncome, setMonthlyIncome] = useState(150_000);
  const [existingEmi, setExistingEmi] = useState(0);
  const [propertyValue, setPropertyValue] = useState(5_000_000);
  const [ratePct, setRatePct] = useState(9.0);
  const [tenureYears, setTenureYears] = useState(20);

  const config = LOAN_CONFIGS[loanType];
  const tenureMonths = tenureYears * 12;

  // Standard banks allow 50% FOIR (Fixed Obligation-to-Income Ratio)
  const maxAllowedEmi = monthlyIncome * 0.50 - existingEmi;
  const maxLoanByIncome = maxAllowedEmi > 0
    ? Math.floor(maxAllowedEmi * (Math.pow(1 + ratePct / 100 / 12, tenureMonths) - 1) /
        (ratePct / 100 / 12 * Math.pow(1 + ratePct / 100 / 12, tenureMonths)) / 1000) * 1000
    : 0;

  const maxLoanByLTV = Math.floor(propertyValue * config.ltv / 1000) * 1000;
  const maxLoan = loanType === "personal" || loanType === "education"
    ? maxLoanByIncome
    : Math.min(maxLoanByIncome, maxLoanByLTV);

  const actualEmi = maxLoan > 0 ? monthlyEmiCalc(maxLoan, ratePct, tenureMonths) : 0;
  const dtiOk = maxAllowedEmi > 0;
  const ltvOk = maxLoan <= maxLoanByLTV;

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🏦 / Eligibility</span>
        Loan Eligibility Checker
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>Loan Type</label>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value as LoanType)}
            style={{ width: "100%", fontFamily: "var(--body)", fontSize: "0.82rem", color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "2px", padding: "7px 9px", outline: "none" }}
          >
            {(Object.entries(LOAN_CONFIGS) as [LoanType, typeof LOAN_CONFIGS[LoanType]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Tenure</span><span><b>{tenureYears} yrs</b></span>
          </div>
          <input type="range" min={1} max={config.maxTenure / 12} value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Net Monthly Income</span><span><b>{formatINR(monthlyIncome)}</b></span>
          </div>
          <input type="range" min={25_000} max={500_000} step={5_000} value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Existing EMIs</span><span><b>{formatINR(existingEmi)}</b></span>
          </div>
          <input type="range" min={0} max={100_000} step={1_000} value={existingEmi}
            onChange={(e) => setExistingEmi(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      {(loanType === "home" || loanType === "car" || loanType === "lap") && (
        <div style={{ marginBottom: "12px" }}>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Property / Asset Value</span><span><b>{formatINR(propertyValue)}</b></span>
          </div>
          <input type="range" min={500_000} max={30_000_000} step={100_000} value={propertyValue}
            onChange={(e) => setPropertyValue(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      )}

      <div style={{ marginBottom: "14px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Interest Rate (typical: {config.rateHint})</span><span><b>{ratePct}%</b></span>
        </div>
        <input type="range" min={6} max={24} step={0.25} value={ratePct}
          onChange={(e) => setRatePct(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      <div style={{ background: maxLoan > 0 ? "var(--emerald-wash)" : "var(--clay-wash)", border: `1px solid ${maxLoan > 0 ? "#c4dac9" : "var(--clay)"}`, borderRadius: "3px", padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.8rem" }}>Max Eligible Loan Amount:</span>
          <span style={{ fontWeight: "800", fontSize: "1.05rem", color: maxLoan > 0 ? "var(--emerald)" : "var(--clay)" }}>{maxLoan > 0 ? formatINR(maxLoan) : "Not Eligible"}</span>
        </div>
        {maxLoan > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <span>Monthly EMI at this amount:</span>
            <span style={{ fontWeight: "700" }}>{formatINR(actualEmi)}</span>
          </div>
        )}
        <div style={{ marginTop: "8px", display: "flex", gap: "10px", fontSize: "0.72rem" }}>
          <span style={{ color: dtiOk ? "var(--emerald)" : "var(--clay)" }}>{dtiOk ? "FOIR OK" : "FOIR exceeded"}</span>
          {(loanType === "home" || loanType === "car" || loanType === "lap") && (
            <span style={{ color: ltvOk ? "var(--emerald)" : "#d97706" }}>{ltvOk ? `LTV OK (${(config.ltv * 100).toFixed(0)}%)` : `LTV cap applied`}</span>
          )}
        </div>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        Based on a 50% FOIR guideline used by many banks. Actual sanction depends on credit score, employer category, and lender policy.
      </div>
    </div>
  );
}
