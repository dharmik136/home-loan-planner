import { useState } from "react";
import type { Loan } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  loan: Loan;
  emi: number;
  delay: string;
  onChange: (patch: Partial<Loan>) => void;
  onDelete?: () => void;
}

export function LoanCard({ loan, emi, delay, onChange, onDelete }: Props) {
  return (
    <div className={`panel loan-card ${delay}`} style={{ paddingTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <input
          value={loan.name}
          onChange={(e) => onChange({ name: e.target.value })}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px dashed var(--line-strong)',
            color: 'var(--ink)',
            fontWeight: 'bold',
            fontSize: '1rem',
            fontFamily: 'var(--display)',
            padding: '2px 0',
            width: '80%',
            outline: 'none'
          }}
          placeholder="Loan Name"
        />
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
          onChange={(val) => onChange({ tenureMonths: Math.max(1, Math.round(val)) })}
        />
      </div>

      <div className="field row2">
        <NumericInput
          label="Pre-EMI Interest (Rs)"
          value={loan.preEmiInterest || 0}
          onChange={(val) => onChange({ preEmiInterest: val })}
        />
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Lender Rules</label>
          <select
            value={loan.ruleset || "hdfc"}
            onChange={(e) => onChange({ ruleset: e.target.value as any })}
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

      {/* Floating Rate Simulator */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--line-strong)", marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "0.68rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "8px" }}>
          Floating Rate Simulator
        </label>
        
        {/* List of existing rate changes */}
        {loan.rateChanges && loan.rateChanges.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
            {loan.rateChanges.map((rc) => (
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
        onClick={() => onAdd(month, rate)}
        className="add-btn"
        style={{ padding: "6px 10px", fontSize: "0.74rem", height: "29px", width: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        + Add
      </button>
    </div>
  );
}
