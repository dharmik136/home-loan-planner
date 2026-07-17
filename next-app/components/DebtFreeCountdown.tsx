import { CalendarDays } from 'lucide-react';
import type { LoanResult } from '../engine/planning';
import { formatDuration, monthLabel } from '../engine/format';

interface Props {
  results: LoanResult[];
}

export function DebtFreeCountdown({ results }: Props) {
  if (results.length === 0) return null;

  const longestPlanMonths = Math.max(...results.map((result) => result.plan.monthsToPayoff), 0);
  const finalResult = results.reduce((latest, result) => {
    const [latestYear, latestMonth] = latest.loan.startYYYYMM.split('-').map(Number);
    const [year, month] = result.loan.startYYYYMM.split('-').map(Number);
    const latestPayoff = latestYear * 12 + latestMonth + latest.plan.monthsToPayoff;
    const payoff = year * 12 + month + result.plan.monthsToPayoff;
    return payoff > latestPayoff ? result : latest;
  });

  return (
    <div className="payoff-horizon">
      <span className="payoff-horizon-icon" aria-hidden="true"><CalendarDays size={20} /></span>
      <div className="payoff-horizon-copy">
        <span>Estimated payoff horizon</span>
        <strong>{formatDuration(longestPlanMonths)} on your current plan</strong>
      </div>
      <div className="payoff-horizon-date">
        <span>Final loan clears</span>
        <b>{monthLabel(finalResult.loan.startYYYYMM, finalResult.plan.monthsToPayoff)}</b>
      </div>
    </div>
  );
}
