import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipProps,
} from "recharts";
import type { LoanResult } from "../engine/planning";
import { formatCompactINR } from "../engine/format";
import { trackEvent } from "../engine/analytics";

interface Props {
  results: LoanResult[];
}

export function PortfolioBalanceChart({ results }: Props) {
  const [hiddenLoans, setHiddenLoans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trackEvent("chart_viewed", { type: "combined" });
  }, []);

  const toggleLoanVisibility = (id: string) => {
    setHiddenLoans((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (results.length === 0) return null;

  // Find max tenure across all baselines
  const maxLen = Math.max(0, ...results.map((r) => r.baseline.rows.length));
  
  const data = [];
  for (let i = 0; i < maxLen; i++) {
    const year = (i + 1) / 12;
    const item: Record<string, any> = {
      year: Number(year.toFixed(2)),
      totalBaseline: 0,
      totalPlan: 0,
    };

    results.forEach((r) => {
      const baseVal = r.baseline.rows[i]?.closing ?? 0;
      const planVal = i < r.plan.rows.length ? r.plan.rows[i].closing : 0;
      
      item[`plan_${r.loan.id}`] = planVal;
      item[`base_${r.loan.id}`] = baseVal;
      
      item.totalBaseline += baseVal;
      item.totalPlan += planVal;
    });

    data.push(item);
  }

  // Pre-defined color palette for up to 6 loans
  const colors = ["#1c7355", "#4a6984", "#b0542f", "#b88a2a", "#2e7075", "#333c4d"];

  return (
    <div className="panel s4" style={{ marginTop: "24px" }}>
      <div className="panel-title">
        <span className="num">Portfolio</span>
        Total Outstanding Debt Over Time
      </div>
      <div className="legend">
        <span><i style={{ border: "2px dashed var(--clay)", background: "none", height: 0, width: 14 }} />Baseline Total Balance</span>
        {results.map((r, idx) => {
          const isHidden = !!hiddenLoans[r.loan.id];
          return (
            <span
              key={r.loan.id}
              onClick={() => toggleLoanVisibility(r.loan.id)}
              style={{
                cursor: "pointer",
                opacity: isHidden ? 0.35 : 1,
                textDecoration: isHidden ? "line-through" : "none",
                userSelect: "none",
                transition: "opacity 0.2s"
              }}
              title="Click to toggle visibility in chart"
            >
              <i style={{ background: colors[idx % colors.length] }} />
              {r.loan.name} (Plan)
            </span>
          );
        })}
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="year" type="number" domain={[0, Math.ceil(maxLen / 12)]}
              tickCount={Math.ceil(maxLen / 12) + 1} stroke="var(--line-strong)"
              tickLine={false} label={{ value: "year", position: "insideBottomRight", offset: -2, fontSize: 11, fill: "var(--ink-faint)" }}
            />
            <YAxis
              stroke="var(--line-strong)" tickLine={false} width={54}
              tickFormatter={(v) => (v >= 1e5 ? (v / 1e5).toFixed(0) + "L" : String(v))}
            />
            <Tooltip content={<PortfolioTip results={results} colors={colors} />} />
            
            {/* Stacked Areas for the Plan */}
            {results.map((r, idx) => (
              <Area
                key={r.loan.id}
                type="monotone"
                dataKey={`plan_${r.loan.id}`}
                stackId="1"
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.4}
                strokeWidth={1.5}
                hide={!!hiddenLoans[r.loan.id]}
              />
            ))}

            {/* Baseline Total Line */}
            <Area
              type="monotone"
              dataKey="totalBaseline"
              stroke="var(--clay)"
              strokeDasharray="5 4"
              strokeWidth={2}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PortfolioTip({ active, payload, label, results, colors }: TooltipProps<number, string> & { results: LoanResult[]; colors: string[] }) {
  if (!active || !payload?.length) return null;

  const totalBaseline = payload.find((p) => p.dataKey === "totalBaseline")?.value ?? 0;
  
  // Calculate total plan balance this month
  let totalPlan = 0;
  const loanPlanBalances = results.map((r, idx) => {
    const val = payload.find((p) => p.dataKey === `plan_${r.loan.id}`)?.value ?? 0;
    totalPlan += Number(val);
    return {
      name: r.loan.name,
      val: Number(val),
      color: colors[idx % colors.length],
    };
  });

  return (
    <div className="tooltip" style={{ maxWidth: "250px" }}>
      <div className="tt-h">Year {Number(label).toFixed(1)}</div>
      <div className="tt-c" style={{ borderBottom: "1px dashed var(--line)", paddingBottom: "5px", marginBottom: "5px" }}>
        Total Baseline: <b>{formatCompactINR(Number(totalBaseline))}</b>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {loanPlanBalances.map((item) => (
          <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "0.72rem" }}>
            <span style={{ color: item.color, fontWeight: "600" }}>{item.name}:</span>
            <span>{formatCompactINR(item.val)}</span>
          </div>
        ))}
      </div>
      <div className="tt-b" style={{ borderTop: "1px dashed var(--line)", paddingTop: "5px", marginTop: "5px" }}>
        Total Plan: <b>{formatCompactINR(totalPlan)}</b>
      </div>
    </div>
  );
}
