// Home loan amortization core — reducing-balance, monthly compounding.
// Faithful TypeScript port of src/amortization.py (verified against the Excel
// workbook to the rupee). Tenure-reduction model: prepayments keep the EMI
// constant and shorten the loan.

export interface MonthRow {
  month: number;
  opening: number;
  emi: number;
  interest: number;
  principalPaid: number;
  prepayment: number;
  closing: number;
}

export interface ScheduleResult {
  rows: MonthRow[];
  totalInterest: number;
  totalPaid: number;
  monthsToPayoff: number;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Standard EMI, rounded UP to whole rupees (as Indian banks do). */
export function monthlyEmi(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.ceil(principal / months);
  const factor = Math.pow(1 + r, months);
  return Math.ceil((principal * r * factor) / (factor - 1));
}

/**
 * Month-by-month schedule. `prepayments` maps a 1-based month index to an extra
 * amount applied AFTER that month's EMI, reducing the closing balance.
 */
export function buildSchedule(
  principal: number,
  annualRatePct: number,
  months: number,
  emi?: number,
  prepayments: Record<number, number> = {},
): ScheduleResult {
  const r = annualRatePct / 100 / 12;
  const pay = emi ?? monthlyEmi(principal, annualRatePct, months);

  const rows: MonthRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let balance = principal;
  let m = 0;

  while (balance > 0.005 && m < months) {
    m += 1;
    const opening = balance;
    const interest = opening * r;
    const payment = Math.min(pay, opening + interest); // final EMI may be smaller
    const principalPaid = payment - interest;
    balance = opening - principalPaid;

    const prepay = Math.min(prepayments[m] ?? 0, balance);
    balance -= prepay;

    rows.push({
      month: m,
      opening: round2(opening),
      emi: round2(payment),
      interest: round2(interest),
      principalPaid: round2(principalPaid),
      prepayment: round2(prepay),
      closing: round2(balance),
    });
    totalInterest += interest;
    totalPaid += payment + prepay;
  }

  return { rows, totalInterest, totalPaid, monthsToPayoff: m };
}

export interface Comparison {
  interestSaved: number;
  monthsSaved: number;
  baselineInterest: number;
  planInterest: number;
  baselineMonths: number;
  planMonths: number;
}

export function compare(baseline: ScheduleResult, plan: ScheduleResult): Comparison {
  return {
    interestSaved: Math.round(baseline.totalInterest - plan.totalInterest),
    monthsSaved: baseline.monthsToPayoff - plan.monthsToPayoff,
    baselineInterest: Math.round(baseline.totalInterest),
    planInterest: Math.round(plan.totalInterest),
    baselineMonths: baseline.monthsToPayoff,
    planMonths: plan.monthsToPayoff,
  };
}
