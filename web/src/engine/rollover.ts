/*
 * Home Loan Prepayment Planner
 * Copyright (C) 2026 Dharmik Shingala
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { monthlyEmi, round2 } from "./amortization";
import { type Loan } from "./planning";

export interface RolloverMonthRow {
  month: number;
  opening: number;
  emi: number;
  interest: number;
  prepayment: number;
  closing: number;
  balances: Record<string, number>; // outstanding balance of each loan this month
}

export interface RolloverResult {
  payoffMonths: Record<string, number>; // loanId -> month index it was fully paid off
  rows: RolloverMonthRow[];
  totalInterestPaid: number;
  totalPaid: number;
  baselineTotalInterest: number;
  totalInterestSaved: number;
  monthsToPayoff: number;
  baselineMonthsToPayoff: number;
  monthsSaved: number;
}

/** Compute full portfolio rollover amortization schedule using Avalanche or Snowball strategy. */
export function computeRollover(
  loans: Loan[],
  extraBudget: number,
  strategy: "avalanche" | "snowball"
): RolloverResult {
  if (loans.length === 0) {
    return {
      payoffMonths: {},
      rows: [],
      totalInterestPaid: 0,
      totalPaid: 0,
      baselineTotalInterest: 0,
      totalInterestSaved: 0,
      monthsToPayoff: 0,
      baselineMonthsToPayoff: 0,
      monthsSaved: 0,
    };
  }

  // 1. Calculate baseline total interest (no extra budget, no rollover)
  let baselineTotalInterest = 0;
  let baselineMonthsToPayoff = 0;
  
  const loanBaselines = loans.map((loan) => {
    const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
    const rateMap: Record<number, number> = {};
    if (loan.rateChanges) {
      for (const rc of loan.rateChanges) {
        if (rc.newRatePct > 0 && rc.monthIndex > 0) {
          rateMap[rc.monthIndex] = rc.newRatePct;
        }
      }
    }
    // We compute baseline with its own step-ups if any
    let currentRate = loan.ratePct;
    let r = currentRate / 100 / 12;
    let pay = emi;
    let baseEmi = pay;
    let balance = loan.outstanding;
    let m = 0;
    let interestSum = 0;

    while (balance > 0.005 && m < loan.tenureMonths) {
      m += 1;
      if (loan.stepUpPct && loan.stepUpPct > 0 && m > 1 && (m - 1) % 12 === 0) {
        baseEmi = baseEmi * (1 + loan.stepUpPct / 100);
        pay = baseEmi;
      }
      if (rateMap[m] !== undefined) {
        currentRate = rateMap[m];
        r = currentRate / 100 / 12;
      }
      const interest = balance * r;
      const payment = Math.min(pay, balance + interest);
      balance = balance + interest - payment;
      interestSum += interest;

      if (loan.biWeekly && m % 6 === 0) {
        const extraBiWeekly = Math.min(baseEmi / 2, balance);
        balance -= extraBiWeekly;
      }
    }
    return { interestSum, months: m };
  });

  baselineTotalInterest = loanBaselines.reduce((sum, x) => sum + x.interestSum, 0);
  baselineMonthsToPayoff = Math.max(0, ...loanBaselines.map((x) => x.months));

  // 2. Initialize plan active states
  interface LoanState {
    loan: Loan;
    balance: number;
    currentRate: number;
    baseEmi: number;
    tenureMonths: number;
    rateMap: Record<number, number>;
  }

  const states: LoanState[] = loans.map((loan) => {
    const emi = monthlyEmi(loan.outstanding, loan.ratePct, loan.tenureMonths);
    const rateMap: Record<number, number> = {};
    if (loan.rateChanges) {
      for (const rc of loan.rateChanges) {
        if (rc.newRatePct > 0 && rc.monthIndex > 0) {
          rateMap[rc.monthIndex] = rc.newRatePct;
        }
      }
    }
    return {
      loan,
      balance: loan.outstanding,
      currentRate: loan.ratePct,
      baseEmi: emi,
      tenureMonths: loan.tenureMonths,
      rateMap,
    };
  });

  const payoffMonths: Record<string, number> = {};
  const rows: RolloverMonthRow[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let m = 0;

  // Maximum runtime safety: 600 months (50 years)
  const maxSimMonths = Math.max(360, ...loans.map((l) => l.tenureMonths)) * 2;

  while (states.some((s) => s.balance > 0.005) && m < maxSimMonths) {
    m += 1;

    // A. Apply rate changes & step-ups for this month
    let totalTargetPayment = extraBudget;
    for (const s of states) {
      if (s.balance <= 0.005) continue;

      // Rate changes
      if (s.rateMap[m] !== undefined) {
        s.currentRate = s.rateMap[m];
      }

      // Step-ups
      if (s.loan.stepUpPct && s.loan.stepUpPct > 0 && m > 1 && (m - 1) % 12 === 0) {
        s.baseEmi = s.baseEmi * (1 + s.loan.stepUpPct / 100);
      }

      totalTargetPayment += s.baseEmi;
    }

    // B. Pay base interest and EMI first
    let monthOpeningSum = 0;
    let monthEmiPaidSum = 0;
    let monthInterestPaidSum = 0;
    let monthPrepaymentPaidSum = 0;
    const monthBalances: Record<string, number> = {};

    // First pass: Deduct standard EMIs and interest
    for (const s of states) {
      if (s.balance <= 0.005) {
        monthBalances[s.loan.id] = 0;
        continue;
      }
      monthOpeningSum += s.balance;

      const r = s.currentRate / 100 / 12;
      const interest = s.balance * r;
      const payment = Math.min(s.baseEmi, s.balance + interest);
      
      s.balance = s.balance + interest - payment;
      
      monthEmiPaidSum += payment;
      monthInterestPaidSum += interest;
      totalInterestPaid += interest;
      totalPaid += payment;

      // Track if paid off by standard EMI
      if (s.balance <= 0.005) {
        s.balance = 0;
        if (payoffMonths[s.loan.id] === undefined) {
          payoffMonths[s.loan.id] = m;
        }
      }
    }

    // C. Pay 13th EMI (if toggled)
    for (const s of states) {
      if (s.balance <= 0.005) continue;
      if (s.loan.extraEmiPerYear && m % 12 === 0) {
        const extraPrepay = Math.min(s.baseEmi, s.balance);
        s.balance -= extraPrepay;
        monthPrepaymentPaidSum += extraPrepay;
        totalPaid += extraPrepay;

        if (s.balance <= 0.005) {
          s.balance = 0;
          if (payoffMonths[s.loan.id] === undefined) {
            payoffMonths[s.loan.id] = m;
          }
        }
      }

      if (s.loan.biWeekly && m % 6 === 0) {
        const extraPrepay = Math.min(s.baseEmi / 2, s.balance);
        s.balance -= extraPrepay;
        monthPrepaymentPaidSum += extraPrepay;
        totalPaid += extraPrepay;

        if (s.balance <= 0.005) {
          s.balance = 0;
          if (payoffMonths[s.loan.id] === undefined) {
            payoffMonths[s.loan.id] = m;
          }
        }
      }
    }

    // D. Allocate general Rollover/Extra budget
    // Rollover budget is the target total budget minus standard EMIs we actually paid
    let availableRollover = totalTargetPayment - monthEmiPaidSum;
    
    if (availableRollover > 0.005 && states.some((s) => s.balance > 0.005)) {
      // Sort active states
      const activeStates = states.filter((s) => s.balance > 0.005);
      
      if (strategy === "avalanche") {
        // Avalanche: highest rate first, then highest balance
        activeStates.sort((a, b) => {
          if (b.currentRate !== a.currentRate) {
            return b.currentRate - a.currentRate;
          }
          return b.balance - a.balance;
        });
      } else {
        // Snowball: lowest balance first, then highest rate
        activeStates.sort((a, b) => {
          if (a.balance !== b.balance) {
            return a.balance - b.balance;
          }
          return b.currentRate - a.currentRate;
        });
      }

      // Distribute rollover budget
      for (const s of activeStates) {
        if (availableRollover <= 0.005) break;
        const prepay = Math.min(availableRollover, s.balance);
        s.balance -= prepay;
        availableRollover -= prepay;
        monthPrepaymentPaidSum += prepay;
        totalPaid += prepay;

        if (s.balance <= 0.005) {
          s.balance = 0;
          if (payoffMonths[s.loan.id] === undefined) {
            payoffMonths[s.loan.id] = m;
          }
        }
      }
    }

    // E. Save final balances for the row
    for (const s of states) {
      monthBalances[s.loan.id] = round2(s.balance);
    }

    rows.push({
      month: m,
      opening: round2(monthOpeningSum),
      emi: round2(monthEmiPaidSum),
      interest: round2(monthInterestPaidSum),
      prepayment: round2(monthPrepaymentPaidSum),
      closing: round2(monthOpeningSum + monthInterestPaidSum - monthEmiPaidSum - monthPrepaymentPaidSum),
      balances: monthBalances,
    });
  }

  // Set payoff month for any loan not paid off (should not occur unless max months hit)
  for (const loan of loans) {
    if (payoffMonths[loan.id] === undefined) {
      payoffMonths[loan.id] = m;
    }
  }

  const monthsToPayoff = m;
  const totalInterestSaved = Math.max(0, baselineTotalInterest - totalInterestPaid);
  const monthsSaved = Math.max(0, baselineMonthsToPayoff - monthsToPayoff);

  return {
    payoffMonths,
    rows,
    totalInterestPaid: round2(totalInterestPaid),
    totalPaid: round2(totalPaid),
    baselineTotalInterest: round2(baselineTotalInterest),
    totalInterestSaved: round2(totalInterestSaved),
    monthsToPayoff,
    baselineMonthsToPayoff,
    monthsSaved,
  };
}
