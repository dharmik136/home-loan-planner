import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";

interface EMIRow {
  banks: string;
  rate: number;
  emi: number;
  totalInterest: number;
  totalPaid: number;
}

const BANK_RATES: { bank: string; rate: number }[] = [
  { bank: "SBI", rate: 8.50 },
  { bank: "HDFC", rate: 8.75 },
  { bank: "ICICI", rate: 8.75 },
  { bank: "Kotak", rate: 8.70 },
  { bank: "Axis", rate: 8.75 },
  { bank: "PNB", rate: 8.50 },
  { bank: "BOB", rate: 8.60 },
  { bank: "LIC HFL", rate: 8.50 },
];

function calcEmi(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / months);
  const f = Math.pow(1 + r, months);
  return Math.ceil((principal * r * f) / (f - 1));
}

export function BankEMIComparator() {
  const [principal, setPrincipal] = useState(5_000_000);
  const [tenureYears, setTenureYears] = useState(20);
  const [customRate, setCustomRate] = useState(9.5);

  const tenureMonths = tenureYears * 12;

  const rows: EMIRow[] = useMemo(() => {
    const allRates = [
      ...BANK_RATES,
      { bank: "Custom / Your Rate", rate: customRate },
    ];
    return allRates
      .map(({ bank, rate }) => {
        const emi = calcEmi(principal, rate, tenureMonths);
        const totalPaid = emi * tenureMonths;
        return { banks: bank, rate, emi, totalInterest: totalPaid - principal, totalPaid };
      })
      .sort((a, b) => a.emi - b.emi);
  }, [principal, tenureYears, customRate]);

  const bestEmi = rows[0]?.emi ?? 0;
  const worstEmi = rows[rows.length - 1]?.emi ?? 0;

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🏦 / Compare</span>
        Bank EMI Comparator — Find the cheapest lender
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Loan Amount</span><span><b>{formatINR(principal)}</b></span>
          </div>
          <input type="range" min={500_000} max={20_000_000} step={100_000} value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}>
            <span>Tenure</span><span><b>{tenureYears} yrs</b></span>
          </div>
          <input type="range" min={5} max={30} step={1} value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Your Quoted Rate</span><span><b>{customRate}%</b></span>
        </div>
        <input type="range" min={7} max={15} step={0.05} value={customRate}
          onChange={(e) => setCustomRate(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line-strong)", background: "var(--panel)" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--ink-soft)" }}>Bank</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Rate %</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>EMI ₹</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Total Interest</th>
              <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--ink-soft)" }}>Diff vs Best</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isBest = row.emi === bestEmi;
              const isWorst = row.emi === worstEmi && worstEmi !== bestEmi;
              const isCustom = row.banks.startsWith("Custom");
              return (
                <tr
                  key={row.banks}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    background: isBest ? "var(--emerald-wash)" : isCustom ? "rgba(185,138,46,0.08)" : "transparent",
                  }}
                >
                  <td style={{ padding: "7px 8px", fontWeight: isBest || isCustom ? "700" : "400" }}>
                    {isBest && <span style={{ color: "var(--emerald)", marginRight: "4px" }}>🏆</span>}
                    {row.banks}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right" }}>{row.rate.toFixed(2)}%</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: "700", color: isBest ? "var(--emerald)" : isWorst ? "var(--clay)" : "var(--ink)" }}>
                    {formatINR(row.emi)}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clay)" }}>
                    {formatINR(Math.round(row.totalInterest))}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", color: row.emi === bestEmi ? "var(--emerald)" : "var(--warn)" }}>
                    {row.emi === bestEmi ? "—" : `+${formatINR(row.emi - bestEmi)}/mo`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        Rates shown are indicative for salaried borrowers with CIBIL 750 or higher. Actual rates vary by credit profile and property type.
      </div>
    </div>
  );
}
