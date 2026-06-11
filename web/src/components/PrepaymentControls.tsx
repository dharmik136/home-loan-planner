import type { Loan, PrepayEntry, PrepayType } from "../engine/planning";
import { buildSchedule, monthlyEmi } from "../engine/amortization";
import { validatePrepayment } from "../engine/rules";
import { formatINR, monthLabel, yearOfMonth } from "../engine/format";

const SLIDER_MAX = 1_500_000; // ₹15 lakh
const STEP = 5_000;

interface Props {
  loan: Loan;
  entries: PrepayEntry[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<PrepayEntry>) => void;
  onRemove: (id: string) => void;
}

/** Opening balance at a given month, for the HDFC max rule. */
function openingAt(loan: Loan, monthIndex: number): number {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const s = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi);
  const row = s.rows.find((r) => r.month === monthIndex);
  return row ? row.opening : loan.outstanding;
}

export function PrepaymentControls({ loan, entries, onAdd, onChange, onRemove }: Props) {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);

  return (
    <div className="prepay-block">
      <div className="prepay-head">
        <h4>{loan.name} — extra payments</h4>
        <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>{entries.length} planned</span>
      </div>

      {entries.map((e) => {
        const verdict = validatePrepayment({
          amount: e.amount,
          monthIndex: e.monthIndex,
          emi,
          openingBalance: openingAt(loan, e.monthIndex),
        });
        return (
          <div className="entry" key={e.id}>
            <div className="entry-top">
              <span className="entry-amt">{formatINR(e.amount)}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Seg
                  value={e.type}
                  onChange={(t) => onChange(e.id, { type: t })}
                />
                <button className="x" title="Remove" onClick={() => onRemove(e.id)}>✕</button>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              step={STEP}
              value={Math.min(e.amount, SLIDER_MAX)}
              onChange={(ev) => onChange(e.id, { amount: Number(ev.target.value) })}
            />
            <div className="slider-meta">
              <span>₹0</span>
              <span>
                {e.type === "yearly" ? "every year from " : "at "}
                <b>month {e.monthIndex}</b> · {monthLabel(loan.startYYYYMM, e.monthIndex)} (yr {yearOfMonth(e.monthIndex)})
              </span>
              <span>₹15L</span>
            </div>

            <input
              type="range"
              min={2}
              max={loan.tenureMonths}
              step={1}
              value={e.monthIndex}
              onChange={(ev) => onChange(e.id, { monthIndex: Number(ev.target.value) })}
            />

            <div className={`badge ${verdict.ok ? "ok" : "bad"}`}>
              <span className="mk">{verdict.ok ? "✓" : "✕"}</span>
              {verdict.message || "Set an amount"}
            </div>
          </div>
        );
      })}

      <button className="add-btn" onClick={onAdd}>+ Add a prepayment</button>
    </div>
  );
}

function Seg({ value, onChange }: { value: PrepayType; onChange: (t: PrepayType) => void }) {
  return (
    <div className="seg">
      <button className={value === "oneTime" ? "active" : ""} onClick={() => onChange("oneTime")}>
        One-time
      </button>
      <button className={value === "yearly" ? "active" : ""} onClick={() => onChange("yearly")}>
        Every year
      </button>
    </div>
  );
}
