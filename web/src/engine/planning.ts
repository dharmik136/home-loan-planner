// Turns the user's prepayment entries into the {month: amount} map the
// amortization engine consumes, and bundles baseline-vs-plan results per loan.

import { buildSchedule, compare, monthlyEmi, type ScheduleResult, type Comparison } from "./amortization";

export type LoanId = string;
export type PrepayType = "oneTime" | "yearly";

export interface RateChangeEntry {
  id: string;
  monthIndex: number;
  newRatePct: number;
}

export type LenderRuleset = "hdfc" | "rbi" | "custom" | "none";

export interface Loan {
  id: LoanId;
  name: string;
  outstanding: number;
  ratePct: number;
  tenureMonths: number;
  startYYYYMM: string;
  prepayBehavior?: "reduceTenure" | "reduceEmi";
  preEmiInterest?: number;
  ruleset?: LenderRuleset;
  customMinPrepay?: number;
  rateChanges?: RateChangeEntry[];
  extraEmiPerYear?: boolean;
  stepUpPct?: number;
}

export interface PrepayEntry {
  id: string;
  loanId: LoanId;
  type: PrepayType;
  amount: number;
  monthIndex: number; // oneTime: the month; yearly: first month, then every 12
}

/** Aggregate a loan's entries into a {month: total} prepayment map. */
export function buildPrepayments(
  entries: PrepayEntry[],
  tenure: number,
  extraEmiPerYear = false,
  baseEmi = 0
): Record<number, number> {
  const map: Record<number, number> = {};

  if (extraEmiPerYear && baseEmi > 0) {
    for (let m = 12; m <= tenure; m += 12) {
      map[m] = (map[m] ?? 0) + baseEmi;
    }
  }

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

function getRateChangesMap(loan: Loan): Record<number, number> {
  const map: Record<number, number> = {};
  if (loan.rateChanges) {
    for (const rc of loan.rateChanges) {
      if (rc.newRatePct > 0 && rc.monthIndex > 0) {
        map[rc.monthIndex] = rc.newRatePct;
      }
    }
  }
  return map;
}

export function computeLoan(loan: Loan, entries: PrepayEntry[]): LoanResult {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const prepayments = buildPrepayments(entries, loan.tenureMonths, loan.extraEmiPerYear, emi);
  const behavior = loan.prepayBehavior ?? "reduceTenure";
  const rateChangesMap = getRateChangesMap(loan);
  const baseline = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateChangesMap, loan.stepUpPct);
  const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, prepayments, behavior, rateChangesMap, loan.stepUpPct);
  return { loan, emi, baseline, plan, comparison: compare(baseline, plan) };
}

/** Effect of a single lump sum on a loan, vs its own baseline. */
export function windfallEffect(loan: Loan, amount: number, monthIndex: number): Comparison {
  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const behavior = loan.prepayBehavior ?? "reduceTenure";
  const rateChangesMap = getRateChangesMap(loan);
  const prepayments = buildPrepayments([], loan.tenureMonths, loan.extraEmiPerYear, emi);
  prepayments[monthIndex] = (prepayments[monthIndex] ?? 0) + amount;
  
  const baseline = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, {}, "reduceTenure", rateChangesMap, loan.stepUpPct);
  const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, emi, prepayments, behavior, rateChangesMap, loan.stepUpPct);
  return compare(baseline, plan);
}
