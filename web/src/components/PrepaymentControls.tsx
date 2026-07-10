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
  const schedule = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateMap);
  const row = schedule.rows.find((item) => item.month === monthIndex);
  return row ? row.opening : loan.outstanding;
}

export function PrepaymentControls({ loan, entries, onAdd, onChange, onRemove }: Props) {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);

  return (
    <div className="prepay-block">
      <div className="prepay-head">
        <h4>{loan.name} - extra payments</h4>
        <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>{entries.length} planned</span>
      </div>

      {entries.map((entry) => {
        const verdict = validatePrepayment({
          amount: entry.amount,
          monthIndex: entry.monthIndex,
          emi,
          openingBalance: openingAt(loan, entry.monthIndex),
          ruleset: loan.ruleset,
          customMinPrepay: loan.customMinPrepay,
        });
        const sliderMax = Math.max(1_500_000, loan.outstanding);

        return (
          <div className="entry entry-animated" key={entry.id}>
            <div className="entry-top">
              <span className="entry-amt">{formatINR(entry.amount)}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Seg value={entry.type} onChange={(type) => onChange(entry.id, { type })} />
                <button
                  className="x"
                  type="button"
                  title="Remove"
                  aria-label={`Remove ${loan.name} prepayment`}
                  onClick={() => onRemove(entry.id)}
                >
                  x
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="range"
                aria-label={`${loan.name} prepayment amount`}
                min={0}
                max={sliderMax}
                step={STEP}
                value={Math.min(entry.amount, sliderMax)}
                onChange={(event) => onChange(entry.id, { amount: Number(event.target.value) })}
                style={{ flexGrow: 1 }}
              />
              <input
                type="number"
                aria-label={`${loan.name} prepayment amount exact value`}
                value={entry.amount}
                onChange={(event) => onChange(entry.id, { amount: Math.max(0, Number(event.target.value)) })}
                style={{ width: "95px", fontSize: "0.78rem", padding: "4px", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
              />
            </div>
            <div className="slider-meta">
              <span>Rs 0</span>
              <span>
                {entry.type === "yearly" ? "every year from " : "at "}
                <b>month {entry.monthIndex}</b> - {monthLabel(loan.startYYYYMM, entry.monthIndex)} (yr {yearOfMonth(entry.monthIndex)})
              </span>
              <span>{formatCompactINR(sliderMax)}</span>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="range"
                aria-label={`${loan.name} prepayment month`}
                min={2}
                max={loan.tenureMonths}
                step={1}
                value={entry.monthIndex}
                onChange={(event) => onChange(entry.id, { monthIndex: Number(event.target.value) })}
                style={{ flexGrow: 1 }}
              />
              <input
                type="number"
                aria-label={`${loan.name} prepayment month exact value`}
                min={2}
                max={loan.tenureMonths}
                value={entry.monthIndex}
                onChange={(event) => onChange(entry.id, { monthIndex: Math.max(2, Math.min(loan.tenureMonths, Number(event.target.value))) })}
                style={{ width: "95px", fontSize: "0.78rem", padding: "4px", border: "1px solid var(--line-strong)", borderRadius: "2px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
              />
            </div>

            <div className={`badge ${verdict.ok ? "ok" : "bad"}`}>
              <span className="mk">{verdict.ok ? "OK" : "!"}</span>
              {verdict.message || "Set an amount"}
            </div>
          </div>
        );
      })}

      <button className="add-btn" type="button" onClick={onAdd}>+ Add a prepayment</button>
    </div>
  );
}

function Seg({ value, onChange }: { value: PrepayType; onChange: (type: PrepayType) => void }) {
  return (
    <div className="seg">
      <button type="button" aria-pressed={value === "oneTime"} className={value === "oneTime" ? "active" : ""} onClick={() => onChange("oneTime")}>
        One-time
      </button>
      <button type="button" aria-pressed={value === "yearly"} className={value === "yearly" ? "active" : ""} onClick={() => onChange("yearly")}>
        Every year
      </button>
    </div>
  );
}
