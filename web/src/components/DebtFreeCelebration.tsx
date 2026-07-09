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
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(16, 185, 129, 0.08))",
        border: "1px solid var(--emerald)",
        borderRadius: "4px",
        padding: "16px",
        marginBottom: "16px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative Sparkles */}
      <div style={{ position: "absolute", right: "10px", top: "10px", fontSize: "2rem", opacity: 0.25, pointerEvents: "none" }}>
        ✨
      </div>
      <div style={{ position: "absolute", left: "10px", bottom: "10px", fontSize: "1.5rem", opacity: 0.15, pointerEvents: "none" }}>
        🚀
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "2.2rem" }}>🎉</span>
        <div>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", fontFamily: "var(--display)", color: "var(--ink)" }}>
            You're buying back your freedom!
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            Prepayments have shaved <b style={{ color: "var(--emerald)" }}>{timeSavedStr}</b> off your debt lifecycle! You'll be 100% debt-free by <b style={{ color: "var(--emerald)" }}>{monthLabel(celebration.startMonth, celebration.payoffMonth)}</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
