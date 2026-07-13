import { useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { monthLabel } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function MilestoneStamp({ results }: Props) {
  const milestone = useMemo(() => {
    let totalMonthsSaved = 0;
    let finalPayoffMonth = 0;
    let startMonth = "";

    results.forEach((r) => {
      totalMonthsSaved = Math.max(totalMonthsSaved, r.comparison.monthsSaved);
      finalPayoffMonth = Math.max(finalPayoffMonth, r.plan.monthsToPayoff);
      if (!startMonth || r.loan.startYYYYMM < startMonth) {
        startMonth = r.loan.startYYYYMM;
      }
    });

    return { monthsSaved: totalMonthsSaved, payoffMonth: finalPayoffMonth, startMonth };
  }, [results]);

  if (milestone.monthsSaved <= 0) return null;

  const years = Math.floor(milestone.monthsSaved / 12);
  const remainingMonths = milestone.monthsSaved % 12;
  const timeSavedStr = `${years > 0 ? `${years} Year${years > 1 ? "s" : ""} ` : ""}${remainingMonths > 0 ? `${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}` : ""}`;

  return (
    <div
      className="panel"
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        padding: "16px",
        marginBottom: "16px",
        display: "flex",
        gap: "20px",
        alignItems: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "72px",
          height: "72px",
          minWidth: "72px",
          borderRadius: "50%",
          border: "2.5px solid var(--cloth-red)",
          color: "var(--cloth-red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-11deg)",
          fontFamily: "var(--font-kalam), cursive",
          fontWeight: 700,
          fontSize: "0.85rem",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        AHEAD<br />OF PLAN
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 400, fontFamily: "var(--display)", color: "var(--ink)" }}>
          Payoff date improved
        </h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
          The current prepayments reduce the payoff timeline by <b style={{ color: "var(--cloth-red)" }}>{timeSavedStr}</b>.
          Estimated final payoff: <b style={{ color: "var(--cloth-red)" }}>{monthLabel(milestone.startMonth, milestone.payoffMonth)}</b>.
        </p>
      </div>
    </div>
  );
}
