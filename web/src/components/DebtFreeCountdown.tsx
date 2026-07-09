import { useEffect, useState, useMemo } from "react";
import type { LoanResult } from "../engine/planning";

interface Props {
  results: LoanResult[];
}

export function DebtFreeCountdown({ results }: Props) {
  const targetDate = useMemo(() => {
    if (results.length === 0) return null;
    
    let maxPayoffMonths = 0;
    let earliestStartDateStr = "";

    results.forEach((r) => {
      maxPayoffMonths = Math.max(maxPayoffMonths, r.plan.monthsToPayoff);
      if (!earliestStartDateStr || r.loan.startYYYYMM < earliestStartDateStr) {
        earliestStartDateStr = r.loan.startYYYYMM;
      }
    });

    if (!earliestStartDateStr) return null;

    // Parse startYYYYMM (e.g. "2026-07")
    const [year, month] = earliestStartDateStr.split("-").map(Number);
    // Add payoff months to start date
    const payoffDate = new Date(year, month - 1 + maxPayoffMonths, 1);
    return payoffDate;
  }, [results]);

  const [timeLeft, setTimeLeft] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        clearInterval(interval);
        return;
      }

      // Exact breakdown of remaining years, months, days, hours, mins, secs
      let diff = difference;
      
      const sec = 1000;
      const min = sec * 60;
      const hr = min * 60;
      const day = hr * 24;
      const yearMs = day * 365.25;
      const monthMs = yearMs / 12;

      const yearsLeft = Math.floor(diff / yearMs);
      diff -= yearsLeft * yearMs;

      const monthsLeft = Math.floor(diff / monthMs);
      diff -= monthsLeft * monthMs;

      const daysLeft = Math.floor(diff / day);
      diff -= daysLeft * day;

      const hoursLeft = Math.floor(diff / hr);
      diff -= hoursLeft * hr;

      const minutesLeft = Math.floor(diff / min);
      diff -= minutesLeft * min;

      const secondsLeft = Math.floor(diff / sec);

      setTimeLeft({
        years: yearsLeft,
        months: monthsLeft,
        days: daysLeft,
        hours: hoursLeft,
        minutes: minutesLeft,
        seconds: secondsLeft,
        isOver: false,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  return (
    <div className="panel" style={{ marginTop: "16px", background: "var(--panel)", border: "1px solid var(--line-strong)", borderRadius: "4px", padding: "14px", textAlign: "center" }}>
      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "8px" }}>
        ⌛ Countdown to Absolute Debt Freedom
      </div>

      {timeLeft.isOver ? (
        <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--emerald)" }}>
          🎉 You are 100% Debt-Free! Congratulations!
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          {timeLeft.years > 0 && (
            <div style={{ padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "3px", minWidth: "50px" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ink)" }}>{timeLeft.years}</div>
              <div style={{ fontSize: "0.58rem", color: "var(--ink-soft)" }}>Yrs</div>
            </div>
          )}
          <div style={{ padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "3px", minWidth: "50px" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ink)" }}>{timeLeft.months}</div>
            <div style={{ fontSize: "0.58rem", color: "var(--ink-soft)" }}>Mos</div>
          </div>
          <div style={{ padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "3px", minWidth: "50px" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ink)" }}>{timeLeft.days}</div>
            <div style={{ fontSize: "0.58rem", color: "var(--ink-soft)" }}>Days</div>
          </div>
          <div style={{ padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "3px", minWidth: "45px" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ink)" }}>{timeLeft.hours}</div>
            <div style={{ fontSize: "0.58rem", color: "var(--ink-soft)" }}>Hrs</div>
          </div>
          <div style={{ padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "3px", minWidth: "45px" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ink)" }}>{timeLeft.minutes}</div>
            <div style={{ fontSize: "0.58rem", color: "var(--ink-soft)" }}>Mins</div>
          </div>
          <div style={{ padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "3px", minWidth: "45px" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--emerald)" }}>{timeLeft.seconds}</div>
            <div style={{ fontSize: "0.58rem", color: "var(--ink-soft)" }}>Secs</div>
          </div>
        </div>
      )}
    </div>
  );
}
