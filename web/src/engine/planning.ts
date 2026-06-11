// Turns the user's prepayment entries into the {month: amount} map the
// amortization engine consumes, and bundles baseline-vs-plan results per loan.

import { buildSchedule, compare, monthlyEmi, type ScheduleResult, type Comparison } from "./amortization";

export type LoanId = "A" | "B";
export type PrepayType = "oneTime" | "yearly";

export interface Loan {
  id: LoanId;
  name: string;
  outstanding: number;
  ratePct: number;
  tenureMonths: number;
  startYYYYMM: string;
}

export interface PrepayEntry {
  id: string;
  loanId: LoanId;
  type: PrepayType;
  amount: number;
  monthIndex: number; // oneTime: the month; yearly: first month, then every 12
}

/** Aggregate a loan's entries into a {month: total} prepayment map. */
export function buildPrepayments(entries: PrepayEntry[], tenure: number): Record<number, number> {
  const map: Record<number, number> = {};
  for (const e of entries) {
    if (e.amount <= 0) continue;
    if (e.type === "oneTime") {
      map[e.monthIndex] = (map[e.monthIndex] ?? 0) + e.amount;
    } else {
      for (let m = e.monthIndex; m <= tenure; m += 12) {
        map[m] = (map[m] ?? 0) + e.amount;
      }
    }
  }
  return map;
}

export interface LoanResult {
  loan: Loan;
  emi: number;
  baseline: ScheduleResult;
  plan: ScheduleResult;
  comparison: Comparison;
}

export function computeLoan(loan: Loan, entries: PrepayEntry[]): LoanResult {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const prepayments = buildPrepayments(entries, loan.tenureMonths);
  const baseline = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi);
  const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, prepayments);
  return { loan, emi, baseline, plan, comparison: compare(baseline, plan) };
}

/** Effect of a single lump sum on a loan, vs its own baseline. */
export function windfallEffect(loan: Loan, amount: number, monthIndex: number): Comparison {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const baseline = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi);
  const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, { [monthIndex]: amount });
  return compare(baseline, plan);
}
