import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";
import type { LoanResult } from "../engine/planning";

interface Props {
  results: LoanResult[];
}



export function SIPCorpusSimulator({ results }: Props) {
  const [monthlySIP, setMonthlySIP] = useState(5_000);
  const [cagr, setCagr] = useState(12);
  const [years, setYears] = useState(20);

  const months = years * 12;
  const monthlyReturn = cagr / 100 / 12;

  const { corpus, invested } = useMemo(() => {
    let portfolio = 0;
    let totalInvested = 0;
    for (let m = 1; m <= months; m++) {
      portfolio = portfolio * (1 + monthlyReturn) + monthlySIP;
      totalInvested += monthlySIP;
    }
    return { corpus: Math.round(portfolio), invested: Math.round(totalInvested) };
  }, [monthlySIP, monthlyReturn, months]);

  const wealthGain = corpus - invested;
  const totalEmi = results.reduce((s, r) => s + r.emi, 0);
  const combinedMonthlyCommitment = totalEmi + monthlySIP;

  // Corpus milestones
  const milestones = useMemo(() => {
    const targets = [1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000];
    return targets.map((target) => {
      let portfolio = 0;
      let m = 0;
      while (portfolio < target && m < 600) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlySIP;
        m++;
      }
      return { target, months: m <= 600 ? m : null };
    });
  }, [monthlySIP, monthlyReturn]);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">SIP</span>
        SIP Corpus Simulator — What your savings become
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Monthly SIP</span><span><b>{formatINR(monthlySIP)}</b></span></div>
          <input type="range" aria-label="Monthly SIP amount" min={500} max={100_000} step={500} value={monthlySIP}
            onChange={(e) => setMonthlySIP(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Expected CAGR</span><span><b>{cagr}%</b></span></div>
          <input type="range" aria-label="Expected SIP CAGR" min={6} max={20} step={0.5} value={cagr}
            onChange={(e) => setCagr(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Investment Horizon</span><span><b>{years} years</b></span></div>
        <input type="range" aria-label="SIP investment horizon" min={1} max={40} step={1} value={years}
          onChange={(e) => setYears(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      {/* Main result */}
      <div style={{ background: "linear-gradient(135deg, rgba(47, 107, 74, 0.08), rgba(185, 138, 46, 0.06))", border: "1px solid var(--emerald)", borderRadius: "4px", padding: "14px", marginBottom: "12px", textAlign: "center" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Corpus in {years} years</div>
        <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--emerald)", lineHeight: 1 }}>{formatINR(corpus)}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "4px" }}>
          Invested: {formatINR(invested)} · Gains: <span style={{ color: "var(--emerald)" }}>{formatINR(wealthGain)}</span>
        </div>
      </div>

      {/* Milestones */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Corpus Milestones</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {milestones.map((m) => (
            <div key={m.target} style={{
              background: m.months ? "var(--emerald-wash)" : "var(--panel)",
              border: `1px solid ${m.months ? "var(--emerald)" : "var(--line)"}`,
              borderRadius: "3px", padding: "6px 10px", fontSize: "0.72rem", textAlign: "center"
            }}>
              <div style={{ fontWeight: "700" }}>{formatINR(m.target)}</div>
              <div style={{ color: m.months ? "var(--emerald)" : "var(--ink-faint)", fontSize: "0.66rem" }}>
                {m.months ? `~${Math.round(m.months / 12)} yrs` : ">50 yrs"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "9px 11px", fontSize: "0.78rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>Total EMI commitment:</span>
            <span><b>{formatINR(totalEmi)}/month</b></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>EMI + SIP combined:</span>
            <span style={{ fontWeight: "700", color: "var(--clay)" }}><b>{formatINR(combinedMonthlyCommitment)}/month</b></span>
          </div>
        </div>
      )}
    </div>
  );
}
