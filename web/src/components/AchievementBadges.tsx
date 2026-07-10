import { useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  results: LoanResult[];
}

interface Milestone {
  id: string;
  icon: string;
  label: string;
  detail: string;
  achieved: boolean;
  value?: string;
}

export function AchievementBadges({ results }: Props) {
  if (results.length === 0) return null;

  const badges = useMemo((): Milestone[] => {
    const totalInterestSaved = results.reduce((s, r) => s + r.comparison.interestSaved, 0);
    const totalMonthsSaved = results.reduce((s, r) => s + r.comparison.monthsSaved, 0);
    const totalPrincipal = results.reduce((s, r) => s + r.loan.outstanding, 0);
    const totalLoans = results.length;
    const hasPrepay = results.some((r) => r.plan.rows.some((row) => row.prepayment > 0));
    const allAvoidedInterest = results.every((r) => r.comparison.interestSaved > 0);
    const bigSaver = totalInterestSaved >= 500_000;
    const lakshpati = totalInterestSaved >= 1_000_000;
    const multiLoan = totalLoans >= 2;
    const heavyBorrower = totalPrincipal >= 10_000_000;
    const yearsSaved = totalMonthsSaved >= 12;
    const fiveYearsSaved = totalMonthsSaved >= 60;

    return [
      {
        id: "first_prepay",
        icon: "01",
        label: "First Prepayment",
        detail: "Made your first extra payment",
        achieved: hasPrepay,
      },
      {
        id: "saver_5l",
        icon: "02",
        label: "Rs 5L saved",
        detail: "Saved Rs 5L+ in interest",
        achieved: bigSaver,
        value: bigSaver ? formatINR(Math.round(totalInterestSaved)) : undefined,
      },
      {
        id: "lakhpati",
        icon: "03",
        label: "Rs 10L saved",
        detail: "Saved Rs 10L+ in interest",
        achieved: lakshpati,
        value: lakshpati ? formatINR(Math.round(totalInterestSaved)) : undefined,
      },
      {
        id: "multi_loan",
        icon: "04",
        label: "Multiple loans",
        detail: "Tracking 2+ loans at once",
        achieved: multiLoan,
        value: multiLoan ? `${totalLoans} loans` : undefined,
      },
      {
        id: "big_ticket",
        icon: "05",
        label: "Large portfolio",
        detail: "Portfolio above Rs 1 crore",
        achieved: heavyBorrower,
        value: heavyBorrower ? formatINR(totalPrincipal) : undefined,
      },
      {
        id: "year_saved",
        icon: "06",
        label: "One year saved",
        detail: "Cut loan by 1+ year",
        achieved: yearsSaved,
        value: yearsSaved ? `${(totalMonthsSaved / 12).toFixed(1)} yrs` : undefined,
      },
      {
        id: "five_years_saved",
        icon: "07",
        label: "Five years saved",
        detail: "Cut loan by 5+ years",
        achieved: fiveYearsSaved,
        value: fiveYearsSaved ? `${Math.round(totalMonthsSaved / 12)} yrs` : undefined,
      },
      {
        id: "all_loans_positive",
        icon: "08",
        label: "All loans improving",
        detail: "All loans generate savings",
        achieved: allAvoidedInterest && totalLoans >= 1,
      },
    ];
  }, [results]);

  const earned = badges.filter((b) => b.achieved);
  const locked = badges.filter((b) => !b.achieved);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">Checkpoints</span>
        Plan checkpoints ({earned.length}/{badges.length} active)
      </div>

      {earned.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {earned.map((b) => (
            <div
              key={b.id}
              title={b.detail}
              className="badge-unlocked"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "var(--emerald-wash)", border: "1px solid #c4dac9",
                borderRadius: "8px", padding: "10px 12px", minWidth: "72px", textAlign: "center",
                transition: "transform 0.15s",
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span style={{ fontSize: "1.5rem" }}>{b.icon}</span>
              <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "var(--ink)", marginTop: "4px", lineHeight: "1.2" }}>{b.label}</span>
              {b.value && <span style={{ fontSize: "0.6rem", color: "var(--emerald)", marginTop: "2px" }}>{b.value}</span>}
            </div>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>Locked</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {locked.map((b) => (
              <div
                key={b.id}
                title={b.detail}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "var(--panel)", border: "1px dashed var(--line-strong)",
                  borderRadius: "8px", padding: "10px 12px", minWidth: "72px", textAlign: "center",
                  opacity: 0.45,
                  cursor: "default",
                }}
              >
                <span style={{ fontSize: "1.5rem", filter: "grayscale(1)" }}>{b.icon}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: "600", color: "var(--ink-faint)", marginTop: "4px", lineHeight: "1.2" }}>{b.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
