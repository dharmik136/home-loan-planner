import type { LoanResult } from "../engine/planning";
import { formatCompactINR, formatDuration, monthLabel } from "../engine/format";

interface Props {
  a: LoanResult;
  b: LoanResult;
}

export function SummaryCards({ a, b }: Props) {
  const interestSaved = a.comparison.interestSaved + b.comparison.interestSaved;
  const planInterest = a.comparison.planInterest + b.comparison.planInterest;
  const maxMonthsSaved = Math.max(a.comparison.monthsSaved, b.comparison.monthsSaved);

  // Which loan to attack first: higher rate, else larger outstanding.
  const first =
    a.loan.ratePct > b.loan.ratePct ? a.loan :
    b.loan.ratePct > a.loan.ratePct ? b.loan :
    a.loan.outstanding >= b.loan.outstanding ? a.loan : b.loan;
  const reason = a.loan.ratePct !== b.loan.ratePct ? "higher interest rate" : "larger balance saves more per rupee";

  const totalPayoffPlan = Math.max(a.comparison.planMonths, b.comparison.planMonths);

  return (
    <div className="panel s1">
      <div className="panel-title"><span className="num">01 / Outcome</span> Your plan vs. paying minimum</div>
      <div className="headline-grid">
        <div className="stat">
          <div className="k">Interest saved</div>
          <div className="v saved">{formatCompactINR(interestSaved)}</div>
          <div className="sub">across both loans</div>
        </div>
        <div className="stat">
          <div className="k">Time cut</div>
          <div className="v saved">{formatDuration(maxMonthsSaved)}</div>
          <div className="sub">off the longer loan</div>
        </div>
        <div className="stat">
          <div className="k">Interest you'll still pay</div>
          <div className="v">{formatCompactINR(planInterest)}</div>
          <div className="sub">down from {formatCompactINR(a.comparison.baselineInterest + b.comparison.baselineInterest)}</div>
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
