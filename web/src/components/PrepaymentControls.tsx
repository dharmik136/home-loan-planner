import type { Loan, PrepayEntry, PrepayType } from "../engine/planning";
import { buildSchedule, monthlyEmi } from "../engine/amortization";
import { validatePrepayment } from "../engine/rules";
import { formatCompactINR, formatINR, monthLabel, yearOfMonth } from "../engine/format";

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
  const rateMap: Record<number, number> = {};
  if (loan.rateChanges) {
    for (const rc of loan.rateChanges) {
      if (rc.newRatePct > 0 && rc.monthIndex > 0) {
        rateMap[rc.monthIndex] = rc.newRatePct;
      }
    }
  }
  const s = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateMap);
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
          ruleset: loan.ruleset,
          customMinPrepay: loan.customMinPrepay,
        });
        const sliderMax = Math.max(1_500_000, loan.outstanding);
        return (
          <div className="entry entry-animated" key={e.id}>
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

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="range"
                min={0}
                max={sliderMax}
                step={STEP}
                value={Math.min(e.amount, sliderMax)}
                onChange={(ev) => onChange(e.id, { amount: Number(ev.target.value) })}
                style={{ flexGrow: 1 }}
              />
              <input
                type="number"
                value={e.amount}
                onChange={(ev) => onChange(e.id, { amount: Math.max(0, Number(ev.target.value)) })}
                style={{ width: "95px", fontSize: "0.78rem", padding: "4px", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
              />
            </div>
            <div className="slider-meta">
              <span>₹0</span>
              <span>
                {e.type === "yearly" ? "every year from " : "at "}
                <b>month {e.monthIndex}</b> · {monthLabel(loan.startYYYYMM, e.monthIndex)} (yr {yearOfMonth(e.monthIndex)})
              </span>
              <span>{formatCompactINR(sliderMax)}</span>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="range"
                min={2}
                max={loan.tenureMonths}
                step={1}
                value={e.monthIndex}
                onChange={(ev) => onChange(e.id, { monthIndex: Number(ev.target.value) })}
                style={{ flexGrow: 1 }}
              />
              <input
                type="number"
                min={2}
                max={loan.tenureMonths}
                value={e.monthIndex}
                onChange={(ev) => onChange(e.id, { monthIndex: Math.max(2, Math.min(loan.tenureMonths, Number(ev.target.value))) })}
                style={{ width: "95px", fontSize: "0.78rem", padding: "4px", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
              />
            </div>

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
