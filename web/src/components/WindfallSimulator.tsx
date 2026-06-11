import { useState } from "react";
import type { Loan } from "../engine/planning";
import { windfallEffect } from "../engine/planning";
import { formatCompactINR, formatDuration, formatINR } from "../engine/format";

interface Props { loanA: Loan; loanB: Loan; }

const MAX = 1_500_000;

export function WindfallSimulator({ loanA, loanB }: Props) {
  const [amount, setAmount] = useState(500_000);
  const [month, setMonth] = useState(12);

  const a = windfallEffect(loanA, amount, month);
  const b = windfallEffect(loanB, amount, month);
  const aWins = a.interestSaved >= b.interestSaved;

  return (
    <div className="panel s5">
      <div className="panel-title"><span className="num">05 / Windfall</span> One lump sum — where does it save more?</div>

      <div className="slider-meta" style={{ marginBottom: 2 }}>
        <span>Lump sum</span><span><b>{formatINR(amount)}</b></span>
      </div>
      <input type="range" min={0} max={MAX} step={5000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />

      <div className="slider-meta" style={{ marginTop: 10, marginBottom: 2 }}>
        <span>Paid in</span><span><b>month {month}</b> (year {Math.floor((month - 1) / 12) + 1})</span>
      </div>
      <input type="range" min={2} max={Math.max(loanA.tenureMonths, loanB.tenureMonths)} step={1} value={month} onChange={(e) => setMonth(Number(e.target.value))} />

      <div className="wf-versus">
        <div className={`wf-side ${aWins ? "win" : ""}`}>
          <div className="nm">{loanA.name}</div>
          <div className="big">{formatCompactINR(a.interestSaved)}</div>
          <div className="sm">interest saved · {formatDuration(a.monthsSaved)} cut</div>
          <div className="crown">{aWins ? "★ Best choice" : ""}</div>
        </div>
        <div className="vs">vs</div>
        <div className={`wf-side ${!aWins ? "win" : ""}`}>
          <div className="nm">{loanB.name}</div>
          <div className="big">{formatCompactINR(b.interestSaved)}</div>
          <div className="sm">interest saved · {formatDuration(b.monthsSaved)} cut</div>
          <div className="crown">{!aWins ? "★ Best choice" : ""}</div>
        </div>
      </div>
    </div>
  );
}
