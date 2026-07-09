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
  biWeekly?: boolean;
  moratoriumStart?: number;
  moratoriumDuration?: number;
  moratoriumType?: "interestOnly" | "fullHoliday";
  balloonPayments?: BalloonPaymentEntry[];
}

export interface BalloonPaymentEntry {
  id: string;
  yearIndex: number;
  amount: number;
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
  baseEmi = 0,
  biWeekly = false,
  balloonPayments?: BalloonPaymentEntry[]
): Record<number, number> {
  const map: Record<number, number> = {};

  if (extraEmiPerYear && baseEmi > 0) {
    for (let m = 12; m <= tenure; m += 12) {
      map[m] = (map[m] ?? 0) + baseEmi;
    }
  }

  if (biWeekly && baseEmi > 0) {
    for (let m = 6; m <= tenure; m += 6) {
      map[m] = (map[m] ?? 0) + baseEmi / 2;
    }
  }

  if (balloonPayments) {
    for (const bp of balloonPayments) {
      if (bp.amount > 0 && bp.yearIndex > 0) {
        const m = bp.yearIndex * 12;
        if (m <= tenure) {
          map[m] = (map[m] ?? 0) + bp.amount;
        }
      }
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
  const emi = loan.outstanding <= 0 ? 0 : monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const prepayments = loan.outstanding <= 0 ? {} : buildPrepayments(entries, loan.tenureMonths, loan.extraEmiPerYear, emi, loan.biWeekly, loan.balloonPayments);
  const behavior = loan.prepayBehavior ?? "reduceTenure";
  const rateChangesMap = getRateChangesMap(loan);
  
  const emptySchedule: ScheduleResult = { rows: [], totalInterest: 0, totalPaid: 0, monthsToPayoff: 0 };
  const baseline = loan.outstanding <= 0 
    ? emptySchedule 
    : buildSchedule(
        loan.outstanding,
        loan.ratePct,
        loan.tenureMonths,
        emi,
        {},
        "reduceTenure",
        rateChangesMap,
        loan.stepUpPct,
        loan.moratoriumStart,
        loan.moratoriumDuration,
        loan.moratoriumType
      );
  
  const plan = loan.outstanding <= 0 
    ? emptySchedule 
    : buildSchedule(
        loan.outstanding,
        loan.ratePct,
        loan.tenureMonths,
        emi,
        prepayments,
        behavior,
        rateChangesMap,
        loan.stepUpPct,
        loan.moratoriumStart,
        loan.moratoriumDuration,
        loan.moratoriumType
      );

  return { loan, emi, baseline, plan, comparison: compare(baseline, plan) };
}

/** Effect of a single lump sum on a loan, vs its own baseline. */
export function windfallEffect(loan: Loan, amount: number, monthIndex: number): Comparison {
  const emptyComparison = { interestSaved: 0, monthsSaved: 0, baselineInterest: 0, planInterest: 0, baselineMonths: 0, planMonths: 0 };
  if (loan.outstanding <= 0) return emptyComparison;

  const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
  const behavior = loan.prepayBehavior ?? "reduceTenure";
  const rateChangesMap = getRateChangesMap(loan);
  const prepayments = buildPrepayments([], loan.tenureMonths, loan.extraEmiPerYear, emi, loan.biWeekly, loan.balloonPayments);
  prepayments[monthIndex] = (prepayments[monthIndex] ?? 0) + amount;
  
  const baseline = buildSchedule(
    loan.outstanding,
    loan.ratePct,
    loan.tenureMonths,
    emi,
    {},
    "reduceTenure",
    rateChangesMap,
    loan.stepUpPct,
    loan.moratoriumStart,
    loan.moratoriumDuration,
    loan.moratoriumType
  );
  const plan = buildSchedule(
    loan.outstanding,
    loan.ratePct,
    loan.tenureMonths,
    emi,
    prepayments,
    behavior,
    rateChangesMap,
    loan.stepUpPct,
    loan.moratoriumStart,
    loan.moratoriumDuration,
    loan.moratoriumType
  );
  return compare(baseline, plan);
}
