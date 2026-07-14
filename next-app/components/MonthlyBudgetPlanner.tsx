import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";
import { Briefcase } from "lucide-react";

interface Props {
  results: LoanResult[];
}

interface BudgetCategory {
  label: string;
  pct: number;
  color: string;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { label: "EMI / Debt", pct: 0, color: "var(--clay)" },
  { label: "Savings / SIP", pct: 20, color: "var(--emerald)" },
  { label: "Groceries", pct: 15, color: "var(--gold)" },
  { label: "Rent / Utilities", pct: 10, color: "#A8603D" },
  { label: "Transport", pct: 8, color: "#C99A3D" },
  { label: "Healthcare", pct: 5, color: "#B0716A" },
  { label: "Entertainment", pct: 5, color: "#8B5A5A" },
  { label: "Miscellaneous", pct: 0, color: "var(--ink-faint)" },
];

export function MonthlyBudgetPlanner({ results }: Props) {
  const [monthlyIncome, setMonthlyIncome] = useState(150_000);

  if (results.length === 0) return null;

  const totalEmi = results.reduce((s, r) => s + r.emi, 0);

  const categories = useMemo(() => {
    const emiPct = Math.round((totalEmi / monthlyIncome) * 100);
    const remaining = Math.max(0, 100 - emiPct);
    const others = DEFAULT_CATEGORIES.slice(1);
    const othersTotal = others.reduce((s, c) => s + c.pct, 0);
    const scale = othersTotal > 0 ? remaining / othersTotal : 1;

    return [
      { ...DEFAULT_CATEGORIES[0], pct: emiPct },
      ...others.map((c) => ({ ...c, pct: Math.round(c.pct * scale) })),
    ];
  }, [totalEmi, monthlyIncome]);

  const miscPct = Math.max(0, 100 - categories.slice(0, -1).reduce((s, c) => s + c.pct, 0));
  const displayCategories = [...categories.slice(0, -1), { ...categories[categories.length - 1], pct: miscPct }];

  const emiPct = displayCategories[0].pct;
  const healthStatus = emiPct <= 30 ? "Healthy" : emiPct <= 50 ? "Stretched" : "Over-leveraged";
  const healthColor = emiPct <= 30 ? "var(--emerald)" : emiPct <= 50 ? "var(--warn)" : "var(--clay)";

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Briefcase size={13} /> / Budget</span>
        Monthly Budget Planner
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Net Monthly Take-Home</span>
          <span><b>{formatINR(monthlyIncome)}</b></span>
        </div>
        <input type="range" min={30_000} max={500_000} step={5_000} value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      {/* Stacked bar */}
      <div style={{ display: "flex", height: "20px", borderRadius: "3px", overflow: "hidden", marginBottom: "14px" }}>
        {displayCategories.map((c) => (
          <div key={c.label} title={`${c.label}: ${c.pct}%`}
            style={{ width: `${c.pct}%`, background: c.color, transition: "width 0.3s" }} />
        ))}
      </div>

      {/* Category rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {displayCategories.map((c) => (
          <div key={c.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c.color, flexShrink: 0 }} />
              <span>{c.label}</span>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ink-soft)", minWidth: "30px", textAlign: "right" }}>{c.pct}%</span>
              <span style={{ fontWeight: "600", minWidth: "80px", textAlign: "right" }}>{formatINR(Math.round(monthlyIncome * c.pct / 100))}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", padding: "8px 10px", borderRadius: "3px", background: "var(--panel)", border: "1px solid var(--line)", fontSize: "0.78rem", display: "flex", justifyContent: "space-between" }}>
        <span>EMI Burden Status:</span>
        <span style={{ fontWeight: "700", color: healthColor }}>{healthStatus} ({emiPct}% FOIR)</span>
      </div>
    </div>
  );
}
