import type { LoanResult } from "../engine/planning";
import { formatCompactINR, formatDuration, monthLabel } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function SummaryCards({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="panel s1">
        <div className="panel-title"><span className="num">01 / Outcome</span> No loans configured</div>
        <div style={{ textAlign: "center", padding: "20px", color: "var(--ink-soft)" }}>
          Please add a loan to view prepayment analysis.
        </div>
      </div>
    );
  }

  const interestSaved = results.reduce((sum, r) => sum + r.comparison.interestSaved, 0);
  const planInterest = results.reduce((sum, r) => sum + r.comparison.planInterest, 0);
  const baselineInterest = results.reduce((sum, r) => sum + r.comparison.baselineInterest, 0);
  const totalPreEmi = results.reduce((sum, r) => sum + (r.loan.preEmiInterest || 0), 0);
  const maxMonthsSaved = Math.max(...results.map((r) => r.comparison.monthsSaved), 0);
  const totalPayoffPlan = Math.max(...results.map((r) => r.comparison.planMonths), 0);

  // Which loan to attack first: sort by ratePct desc, then outstanding desc
  const sortedPriority = [...results].sort((x, y) => {
    if (x.loan.ratePct !== y.loan.ratePct) return y.loan.ratePct - x.loan.ratePct;
    return y.loan.outstanding - x.loan.outstanding;
  });
  const firstResult = sortedPriority[0];
  const first = firstResult.loan;
  const reason = results.length > 1 && results.some(r => r.loan.ratePct !== first.ratePct) 
    ? "higher interest rate" 
    : "larger balance saves more per rupee";

  return (
    <div className="panel s1">
      <div className="panel-title"><span className="num">01 / Outcome</span> Your plan vs. paying minimum</div>
      <div className="headline-grid">
        <div className="stat">
          <div className="k">Interest saved</div>
          <div className="v saved">{formatCompactINR(interestSaved)}</div>
          <div className="sub">across all loans</div>
        </div>
        <div className="stat">
          <div className="k">Time cut</div>
          <div className="v saved">{formatDuration(maxMonthsSaved)}</div>
          <div className="sub">off the longest loan</div>
        </div>
        <div className="stat">
          <div className="k">Interest you'll still pay</div>
          <div className="v">{formatCompactINR(planInterest + totalPreEmi)}</div>
          <div className="sub">
            down from {formatCompactINR(baselineInterest + totalPreEmi)}
            {totalPreEmi > 0 && ` (incl. ${formatCompactINR(totalPreEmi)} pre-EMI)`}
          </div>
        </div>
        <div className="stat">
          <div className="k">Debt-free by</div>
          <div className="v">{monthLabel(first.startYYYYMM, totalPayoffPlan)}</div>
          <div className="sub">last loan cleared</div>
        </div>
      </div>
      <div className="recommend">
        <span className="dot" />
        <div>
          Attack <b>{first.name}</b> first — {reason}.
          {interestSaved > 0
            ? ` Your prepayments save ${formatCompactINR(interestSaved)} in interest.`
            : " Add a prepayment to see your savings."}
        </div>
      </div>
    </div>
  );
}
