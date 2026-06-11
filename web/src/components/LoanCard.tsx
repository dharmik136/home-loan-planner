import type { Loan } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  loan: Loan;
  emi: number;
  delay: string;
  onChange: (patch: Partial<Loan>) => void;
}

export function LoanCard({ loan, emi, delay, onChange }: Props) {
  const num = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;
  return (
    <div className={`panel loan-card ${delay}`}>
      <span className="tag">{loan.name}</span>
      <div className="field">
        <label>Outstanding principal</label>
        <input
          value={loan.outstanding.toLocaleString("en-IN")}
          onChange={(e) => onChange({ outstanding: num(e.target.value) })}
          inputMode="numeric"
        />
      </div>
      <div className="field row2">
        <div>
          <label>Interest rate (%)</label>
          <input
            value={loan.ratePct}
            onChange={(e) => onChange({ ratePct: num(e.target.value) })}
            inputMode="decimal"
          />
        </div>
        <div>
          <label>Tenure (months)</label>
          <input
            value={loan.tenureMonths}
            onChange={(e) => onChange({ tenureMonths: Math.max(1, Math.round(num(e.target.value))) })}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="field">
        <label>EMI start month</label>
        <input
          type="month"
          value={loan.startYYYYMM}
          onChange={(e) => onChange({ startYYYYMM: e.target.value || loan.startYYYYMM })}
        />
      </div>
      <div className="emi-line">
        <span>Monthly EMI</span>
        <b>{formatINR(emi)}</b>
      </div>
    </div>
  );
}
