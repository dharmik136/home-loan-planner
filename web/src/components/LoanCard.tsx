import { useState } from "react";
import type { Loan, LoanResult, LenderRuleset } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  loan: Loan;
  emi: number;
  delay: string;
  onChange: (patch: Partial<Loan>) => void;
  onDelete?: () => void;
  result?: LoanResult;
}

export function LoanCard({ loan, emi, delay, onChange, onDelete, result }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sanitizeName = (val: string) => {
    const stripped = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    return stripped.substring(0, 50);
  };

  const outstandingError = loan.outstanding <= 0 ? "Principal must be greater than 0" : null;
  const rateError = (loan.ratePct < 0 || loan.ratePct > 100) ? "Interest rate must be between 0% and 100%" : null;
  const rateWarning = (loan.ratePct > 30 && loan.ratePct <= 100) ? "Interest rate above 30% looks unusually high. Please verify." : null;
  const tenureError = (loan.tenureMonths <= 0 || loan.tenureMonths > 600) ? "Tenure must be between 1 and 600 months" : null;

  const maxRate = Math.max(loan.ratePct, ...(loan.rateChanges || []).map((rc) => rc.newRatePct));
  const maxMonthlyInterestRate = maxRate / 100 / 12;
  const firstMonthInterest = Math.round(loan.outstanding * (loan.ratePct / 100 / 12));
  const maxMonthlyInterest = Math.round(loan.outstanding * maxMonthlyInterestRate);

  const isEmiTooLow = emi <= maxMonthlyInterest && loan.ratePct > 0;
  const emiError = emi <= 0
    ? "EMI must be greater than 0"
    : (isEmiTooLow
        ? (maxRate > loan.ratePct
            ? `EMI (₹${Math.round(emi).toLocaleString("en-IN")}) is insufficient to cover simulated rate hikes (interest reaches ₹${maxMonthlyInterest.toLocaleString("en-IN")})`
            : `EMI (₹${Math.round(emi).toLocaleString("en-IN")}) must exceed first month interest (₹${firstMonthInterest.toLocaleString("en-IN")})`)
        : null);

  const hasErrors = outstandingError || rateError || rateWarning || tenureError || emiError;

  return (
    <div className={`panel loan-card ${delay}`} style={{ paddingTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <input
          value={loan.name}
          onChange={(e) => onChange({ name: sanitizeName(e.target.value) })}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px dashed var(--line-strong)',
            color: 'var(--ink)',
            fontWeight: 'bold',
            fontSize: '1rem',
            fontFamily: 'var(--display)',
            padding: '2px 0',
            fieldSizing: 'content',
            minWidth: '50px',
            maxWidth: '75%',
            outline: 'none'
          }}
          placeholder="Loan Name"
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-faint)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '2px 4px',
              transition: 'color 0.15s'
            }}
            title={isCollapsed ? "Expand card" : "Collapse card"}
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-faint)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '2px 4px',
                transition: 'color 0.15s'
              }}
              title="Delete loan"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--clay)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isCollapsed && (
        <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "-6px", marginBottom: "8px" }}>
          {formatINR(loan.outstanding)} @ {loan.ratePct}% · {loan.tenureMonths} mos
        </div>
      )}

      {result && result.comparison.monthsSaved > 0 && (
        <div style={{ marginBottom: "14px", marginTop: isCollapsed ? "0" : "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--ink-soft)", marginBottom: "4px" }}>
            <span>Payoff Speedup:</span>
            <span style={{ color: "var(--emerald)", fontWeight: "bold" }}>
              -{result.comparison.monthsSaved} months ({((result.comparison.monthsSaved / result.baseline.monthsToPayoff) * 100).toFixed(0)}% faster)
            </span>
          </div>
          <div style={{ height: "6px", width: "100%", background: "var(--line)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${((result.plan.monthsToPayoff / result.baseline.monthsToPayoff) * 100)}%`, background: "var(--emerald)", height: "100%" }} />
            <div style={{ flexGrow: 1, background: "rgba(16, 185, 129, 0.15)", height: "100%" }} />
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          <NumericInput
            label="Outstanding principal"
            value={loan.outstanding}
            onChange={(val) => onChange({ outstanding: val })}
          />

      <div className="field row2">
        <NumericInput
          label="Interest rate (%)"
          value={loan.ratePct}
          onChange={(val) => onChange({ ratePct: val })}
          isDecimal={true}
        />
        <NumericInput
          label="Tenure (months)"
          value={loan.tenureMonths}
          onChange={(val) => onChange({ tenureMonths: val })}
        />
      </div>

      <div className="field row2">
        <NumericInput
          label="Pre-EMI Interest (Rs)"
          value={loan.preEmiInterest || 0}
          onChange={(val) => onChange({ preEmiInterest: Math.max(0, val) })}
        />
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Lender Rules</label>
          <select
            value={loan.ruleset || "hdfc"}
            onChange={(e) => onChange({ ruleset: e.target.value as LenderRuleset })}
            style={{
              width: "100%",
              fontFamily: "var(--body)",
              fontSize: "0.86rem",
              fontWeight: "600",
              color: "var(--ink)",
              background: "var(--paper)",
              border: "1px solid var(--line-strong)",
              borderRadius: "2px",
              padding: "9px 11px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="hdfc">HDFC Rules</option>
            <option value="rbi">RBI Floating</option>
            <option value="custom">Custom Limits</option>
            <option value="none">No Validation</option>
          </select>
        </div>
      </div>

      {loan.ruleset === "custom" && (
        <NumericInput
          label="Custom Min Prepayment (Rs)"
          value={loan.customMinPrepay || 0}
          onChange={(val) => onChange({ customMinPrepay: val })}
        />
      )}

      <div className="field">
        <label>EMI start month</label>
        <input
          type="month"
          value={loan.startYYYYMM}
          onChange={(e) => onChange({ startYYYYMM: e.target.value || loan.startYYYYMM })}
        />
      </div>
      
      <div className="field" style={{ marginBottom: "16px" }}>
        <label>Prepayment strategy</label>
        <select
          value={loan.prepayBehavior || "reduceTenure"}
          onChange={(e) => onChange({ prepayBehavior: e.target.value as "reduceTenure" | "reduceEmi" })}
          style={{
            width: "100%",
            fontFamily: "var(--body)",
            fontSize: "0.86rem",
            fontWeight: "600",
            color: "var(--ink)",
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "2px",
            padding: "9px 11px",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="reduceTenure">Reduce tenure (constant EMI)</option>
          <option value="reduceEmi">Reduce EMI (constant tenure)</option>
        </select>
        <span style={{ fontSize: "0.68rem", color: "var(--ink-faint)", display: "block", marginTop: "5px", lineHeight: "1.3" }}>
          {loan.prepayBehavior === "reduceEmi"
            ? "Prepayments lower your monthly payment. Loan term stays the same."
            : "Prepayments shorten the loan. Monthly payment stays the same (saves more interest)."}
        </span>
      </div>

      {/* Prepayment Presets */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--line-strong)", marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "0.68rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "8px" }}>
          Prepayment Presets
        </label>
        
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink)", cursor: "pointer", marginBottom: "12px" }}>
          <input
            type="checkbox"
            checked={!!loan.extraEmiPerYear}
            onChange={(e) => onChange({ extraEmiPerYear: e.target.checked })}
            style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "var(--emerald)" }}
          />
          <span>Pay 1 extra EMI every year (13th EMI)</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink)", cursor: "pointer", marginBottom: "12px" }}>
          <input
            type="checkbox"
            checked={!!loan.biWeekly}
            onChange={(e) => onChange({ biWeekly: e.target.checked })}
            style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "var(--emerald)" }}
          />
          <span>Use Bi-Weekly payments (13 EMIs/yr equivalent)</span>
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.62rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-faint)", fontWeight: "600" }}>
            Step-up EMI (increase payment yearly)
          </label>
          <select
            value={loan.stepUpPct || 0}
            onChange={(e) => onChange({ stepUpPct: Number(e.target.value) })}
            style={{
              width: "100%",
              fontFamily: "var(--body)",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "var(--ink)",
              background: "var(--paper)",
              border: "1px solid var(--line-strong)",
              borderRadius: "2px",
              padding: "6px 8px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value={0}>None (Flat EMI)</option>
            <option value={3}>3% increase / year</option>
            <option value={5}>5% increase / year</option>
            <option value={8}>8% increase / year</option>
            <option value={10}>10% increase / year</option>
          </select>
        </div>
      </div>

      {/* Floating Rate Simulator */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--line-strong)", marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "0.68rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "8px" }}>
          Floating Rate Simulator
        </label>
        
        {/* List of existing rate changes */}
        {loan.rateChanges && loan.rateChanges.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
            {[...loan.rateChanges].sort((a, b) => a.monthIndex - b.monthIndex).map((rc) => (
              <div key={rc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", padding: "4px 8px", borderRadius: "2px", fontSize: "0.78rem" }}>
                <span>Month {rc.monthIndex} ➔ <b>{rc.newRatePct}%</b></span>
                <button
                  onClick={() => onChange({ rateChanges: loan.rateChanges?.filter(x => x.id !== rc.id) })}
                  style={{ background: "none", border: "none", color: "var(--clay)", cursor: "pointer", fontSize: "0.8rem" }}
                  title="Delete rate change"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add rate change form */}
        <RateChangeForm
          tenureMonths={loan.tenureMonths}
          baseRate={loan.ratePct}
          onAdd={(monthIndex, newRatePct) => {
            const newList = [...(loan.rateChanges || [])];
            newList.push({ id: `rc-${Date.now()}-${Math.random()}`, monthIndex, newRatePct });
            onChange({ rateChanges: newList.sort((a, b) => a.monthIndex - b.monthIndex) });
          }}
        />
      </div>

      {/* Principal Moratorium Simulator */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--line-strong)", marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "0.68rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "8px" }}>
          Moratorium Option (Sec 8)
        </label>
        
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink)", cursor: "pointer", marginBottom: "8px" }}>
          <input
            type="checkbox"
            checked={loan.moratoriumStart !== undefined}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({
                  moratoriumStart: 12,
                  moratoriumDuration: 6,
                  moratoriumType: "interestOnly"
                });
              } else {
                onChange({
                  moratoriumStart: undefined,
                  moratoriumDuration: undefined,
                  moratoriumType: undefined
                });
              }
            }}
            style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "var(--emerald)" }}
          />
          <span>Simulate Principal Moratorium (Pause Payments)</span>
        </label>

        {loan.moratoriumStart !== undefined && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
            <div>
              <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Start Month</label>
              <input
                type="number"
                min={1}
                max={loan.tenureMonths}
                value={loan.moratoriumStart}
                onChange={(e) => onChange({ moratoriumStart: Math.max(1, Number(e.target.value)) })}
                style={{
                  width: "100%",
                  fontFamily: "var(--body)",
                  fontSize: "0.82rem",
                  color: "var(--ink)",
                  background: "var(--paper)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "2px",
                  padding: "5px 7px",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Duration (months)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={loan.moratoriumDuration}
                onChange={(e) => onChange({ moratoriumDuration: Math.max(1, Number(e.target.value)) })}
                style={{
                  width: "100%",
                  fontFamily: "var(--body)",
                  fontSize: "0.82rem",
                  color: "var(--ink)",
                  background: "var(--paper)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "2px",
                  padding: "5px 7px",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Moratorium Type</label>
              <select
                value={loan.moratoriumType}
                onChange={(e) => onChange({ moratoriumType: e.target.value as "interestOnly" | "fullHoliday" })}
                style={{
                  width: "100%",
                  fontFamily: "var(--body)",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: "var(--ink)",
                  background: "var(--paper)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "2px",
                  padding: "6px 8px",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="interestOnly">Interest-Only Payment (Principal paused)</option>
                <option value="fullHoliday">Full EMI Holiday (Interest compounds)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Balloon Payments Simulator */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--line-strong)", marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "0.68rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "8px" }}>
          Balloon Payments (Sec 9)
        </label>
        
        {/* List of existing balloon payments */}
        {loan.balloonPayments && loan.balloonPayments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
            {[...loan.balloonPayments].sort((a, b) => a.yearIndex - b.yearIndex).map((bp) => (
              <div key={bp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", padding: "4px 8px", borderRadius: "2px", fontSize: "0.78rem" }}>
                <span>Year {bp.yearIndex} Milestone ➔ <b>{formatINR(bp.amount)}</b></span>
                <button
                  onClick={() => onChange({ balloonPayments: loan.balloonPayments?.filter(x => x.id !== bp.id) })}
                  style={{ background: "none", border: "none", color: "var(--clay)", cursor: "pointer", fontSize: "0.8rem" }}
                  title="Delete balloon payment"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add balloon payment form */}
        <BalloonPaymentForm
          maxYears={Math.ceil(loan.tenureMonths / 12)}
          onAdd={(yearIndex, amount) => {
            const newList = [...(loan.balloonPayments || [])];
            newList.push({ id: `bp-${Date.now()}-${Math.random()}`, yearIndex, amount });
            onChange({ balloonPayments: newList.sort((a, b) => a.yearIndex - b.yearIndex) });
          }}
        />
      </div>
      </>)}

      {hasErrors && (
        <div style={{ backgroundColor: "var(--clay-wash)", borderLeft: "3px solid var(--clay)", padding: "8px 12px", borderRadius: "2px", margin: "12px 0", fontSize: "0.78rem", color: "var(--clay)", display: "flex", flexDirection: "column", gap: "4px" }}>
          {outstandingError && <span className="error-principal">• {outstandingError}</span>}
          {rateError && <span className="error-rate">• {rateError}</span>}
          {rateWarning && <span className="warning-rate" style={{ color: "#b45309" }}>• ⚠️ {rateWarning}</span>}
          {tenureError && <span className="error-tenure">• {tenureError}</span>}
          {emiError && <span className="error-emi">• {emiError}</span>}
        </div>
      )}

      <div className="emi-line">
        <span>Monthly EMI</span>
        <b>{formatINR(emi)}</b>
      </div>
    </div>
  );
}

function NumericInput({
  label,
  value,
  onChange,
  isDecimal = false,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  isDecimal?: boolean;
}) {
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const displayValue = editingValue !== null
    ? editingValue
    : (isDecimal ? value.toString() : value.toLocaleString("en-IN"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setEditingValue("");
      return;
    }
    const cleanRegex = isDecimal ? /[^0-9.]/g : /[^0-9]/g;
    const cleaned = raw.replace(cleanRegex, "");
    
    setEditingValue(cleaned);
    
    const parsed = Number(cleaned);
    if (!isNaN(parsed) && cleaned !== "") {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setEditingValue(null);
    if (editingValue === "") {
      onChange(0);
    }
  };

  return (
    <div className="field" style={{ marginBottom: "13px" }}>
      <label>{label}</label>
      <input
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        inputMode={isDecimal ? "decimal" : "numeric"}
      />
    </div>
  );
}

function RateChangeForm({ tenureMonths, baseRate, onAdd }: { tenureMonths: number; baseRate: number; onAdd: (m: number, r: number) => void }) {
  const [month, setMonth] = useState(12);
  const [rate, setRate] = useState(baseRate);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "end" }}>
      <div>
        <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Month</label>
        <input
          type="number"
          min={2}
          max={tenureMonths}
          value={month}
          onChange={(e) => setMonth(Math.max(2, Number(e.target.value)))}
          style={{
            width: "100%",
            fontFamily: "var(--body)",
            fontSize: "0.82rem",
            color: "var(--ink)",
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "2px",
            padding: "5px 7px",
            outline: "none"
          }}
        />
      </div>
      <div>
        <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Rate %</label>
        <input
          type="number"
          step="0.05"
          min={0}
          value={rate}
          onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
          style={{
            width: "100%",
            fontFamily: "var(--body)",
            fontSize: "0.82rem",
            color: "var(--ink)",
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "2px",
            padding: "5px 7px",
            outline: "none"
          }}
        />
      </div>
      <button
        onClick={() => {
          const clampedMonth = Math.max(2, Math.min(tenureMonths, month));
          const clampedRate = Math.max(0, Math.min(100, rate));
          onAdd(clampedMonth, clampedRate);
        }}
        className="add-btn"
        style={{ padding: "6px 10px", fontSize: "0.74rem", height: "29px", width: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        + Add
      </button>
    </div>
  );
}

function BalloonPaymentForm({ maxYears, onAdd }: { maxYears: number; onAdd: (y: number, a: number) => void }) {
  const [year, setYear] = useState(5);
  const [amount, setAmount] = useState(100000);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "end" }}>
      <div>
        <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Year</label>
        <input
          type="number"
          min={1}
          max={maxYears}
          value={year}
          onChange={(e) => setYear(Math.max(1, Number(e.target.value)))}
          style={{
            width: "100%",
            fontFamily: "var(--body)",
            fontSize: "0.82rem",
            color: "var(--ink)",
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "2px",
            padding: "5px 7px",
            outline: "none"
          }}
        />
      </div>
      <div>
        <label style={{ fontSize: "0.6rem", color: "var(--ink-soft)", display: "block", marginBottom: "3px" }}>Amount (₹)</label>
        <input
          type="number"
          step="10000"
          min={1000}
          value={amount}
          onChange={(e) => setAmount(Math.max(1000, Number(e.target.value)))}
          style={{
            width: "100%",
            fontFamily: "var(--body)",
            fontSize: "0.82rem",
            color: "var(--ink)",
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "2px",
            padding: "5px 7px",
            outline: "none"
          }}
        />
      </div>
      <button
        onClick={() => {
          const clampedYear = Math.max(1, Math.min(maxYears, year));
          const clampedAmount = Math.max(1000, amount);
          onAdd(clampedYear, clampedAmount);
        }}
        className="add-btn"
        style={{ padding: "6px 10px", fontSize: "0.74rem", height: "29px", width: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        + Add
      </button>
    </div>
  );
}
