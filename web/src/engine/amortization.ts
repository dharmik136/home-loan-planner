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

export const round2 = (x: number) => Math.round(x * 100) / 100;

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
  stepUpPct: number = 0,
  moraStart?: number,
  moraDuration?: number,
  moraType?: "interestOnly" | "fullHoliday",
): ScheduleResult {
  let currentRate = annualRatePct;
  let r = currentRate / 100 / 12;
  let pay = emi ?? monthlyEmi(principal, currentRate, months);
  let baseEmi = pay;

  const rows: MonthRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let balance = principal;
  let m = 0;

  // Let loop run up to 600 months to allow tenure extension for rate hikes / moratoriums
  while (balance > 0.005 && m < 600) {
    m += 1;
    
    // Apply yearly step-up to base EMI (month 13, 25, 37...)
    if (stepUpPct > 0 && m > 1 && (m - 1) % 12 === 0) {
      baseEmi = baseEmi * (1 + stepUpPct / 100);
      if (prepayBehavior !== "reduceEmi") {
        pay = baseEmi;
      }
    }

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

    // Check if moratorium is active for this month
    const isMora =
      moraStart !== undefined &&
      moraDuration !== undefined &&
      moraType !== undefined &&
      m >= moraStart &&
      m < moraStart + moraDuration;

    // Safe guard: If interest exceeds payment outside moratorium, loan is infinite.
    // Stop at original months limit to prevent infinite loop.
    if (!isMora && interest >= pay && r > 0) {
      if (m >= months) {
        break;
      }
    }

    let payment = 0;
    if (isMora) {
      if (moraType === "interestOnly") {
        payment = interest;
      } else {
        // fullHoliday
        payment = 0;
      }
    } else {
      payment = Math.min(pay, opening + interest);
    }

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

    // If EMI reduction strategy is selected and a prepayment is made (or exiting moratorium), recalculate EMI
    const justExitedMora =
      moraStart !== undefined &&
      moraDuration !== undefined &&
      m === moraStart + moraDuration - 1;

    if (prepayBehavior === "reduceEmi" && (prepay > 0 || justExitedMora) && months - m > 0 && balance > 0.005) {
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
