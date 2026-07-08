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
 * Supports "reduceTenure" (EMI stays constant, loan tenure shortens)
 * or "reduceEmi" (EMI gets recalculated lower, loan tenure remains the same).
 */
export function buildSchedule(
  principal: number,
  annualRatePct: number,
  months: number,
  emi?: number,
  prepayments: Record<number, number> = {},
  prepayBehavior: "reduceTenure" | "reduceEmi" = "reduceTenure",
  rateChanges: Record<number, number> = {},
): ScheduleResult {
  let currentRate = annualRatePct;
  let r = currentRate / 100 / 12;
  let pay = emi ?? monthlyEmi(principal, currentRate, months);

  const rows: MonthRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let balance = principal;
  let m = 0;

  while (balance > 0.005 && m < months) {
    m += 1;
    
    // Apply rate change if scheduled for this month
    if (rateChanges[m] !== undefined) {
      currentRate = rateChanges[m];
      r = currentRate / 100 / 12;
      // If EMI is custom (recalculated), recalculate it on interest rate change
      if (prepayBehavior === "reduceEmi" && months - m > 0 && balance > 0.005) {
        pay = monthlyEmi(balance, currentRate, months - m);
      }
    }

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

    // If EMI reduction strategy is selected and a prepayment is made, recalculate the EMI for remaining term
    if (prepayBehavior === "reduceEmi" && prepay > 0 && months - m > 0 && balance > 0.005) {
      pay = monthlyEmi(balance, currentRate, months - m);
    }
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
