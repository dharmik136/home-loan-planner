import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipProps,
} from "recharts";
import type { LoanResult } from "../engine/planning";
import { formatCompactINR } from "../engine/format";

interface Props { result: LoanResult; index: number; }

export function BalanceChart({ result, index }: Props) {
  const { baseline, plan, loan } = result;
  const maxLen = baseline.rows.length;
  const data = [];
  for (let i = 0; i < maxLen; i++) {
    const year = (i + 1) / 12;
    data.push({
      year: Number(year.toFixed(2)),
      baseline: baseline.rows[i]?.closing ?? 0,
      plan: i < plan.rows.length ? plan.rows[i].closing : 0,
    });
  }

  return (
    <div className="panel s4">
      <div className="panel-title">
        <span className="num">{String(index + 3).padStart(2, "0")} / Balance</span>
        {loan.name}: how fast the debt falls
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--clay)" }} />Paying minimum (baseline)</span>
        <span><i style={{ background: "var(--emerald)" }} />With your prepayments</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
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
            <Tooltip content={<ChartTip />} />
            <Line type="monotone" dataKey="baseline" stroke="var(--clay)" strokeWidth={2} dot={false} strokeDasharray="5 4" />
            <Line type="monotone" dataKey="plan" stroke="var(--emerald)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const base = payload.find((p) => p.dataKey === "baseline")?.value ?? 0;
  const plan = payload.find((p) => p.dataKey === "plan")?.value ?? 0;
  return (
    <div className="tooltip">
      <div className="tt-h">Year {Number(label).toFixed(1)}</div>
      <div className="tt-c">Baseline: {formatCompactINR(base as number)}</div>
      <div className="tt-b">Your plan: {formatCompactINR(plan as number)}</div>
    </div>
  );
}
