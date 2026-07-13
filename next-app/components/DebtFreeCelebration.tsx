import { useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { monthLabel } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function DebtFreeCelebration({ results }: Props) {
  const celebration = useMemo(() => {
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

    return {
      monthsSaved: totalMonthsSaved,
      payoffMonth: finalPayoffMonth,
      startMonth,
    };
  }, [results]);

  if (celebration.monthsSaved <= 0) return null;

  const years = Math.floor(celebration.monthsSaved / 12);
  const remainingMonths = celebration.monthsSaved % 12;
  const timeSavedStr = `${years > 0 ? `${years} Year${years > 1 ? "s" : ""} ` : ""}${remainingMonths > 0 ? `${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}` : ""}`;

  return (
    <div
      className="panel"
      style={{
        background: "var(--emerald-wash)",
        border: "1px solid var(--emerald)",
        padding: "16px",
        marginBottom: "16px",
        position: "relative"
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative", zIndex: 1 }}>
        <span aria-hidden="true" style={{ width: "10px", height: "44px", borderRadius: "999px", background: "var(--emerald)", flex: "none" }} />
        <div>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", fontFamily: "var(--display)", color: "var(--ink)" }}>
            Payoff date improved
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            The current prepayments reduce the payoff timeline by <b style={{ color: "var(--emerald)" }}>{timeSavedStr}</b>.
            Estimated final payoff: <b style={{ color: "var(--emerald)" }}>{monthLabel(celebration.startMonth, celebration.payoffMonth)}</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
