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

/**
 * tax.ts — Indian Home Loan Tax Deduction Engine
 * =================================================
 * Computes net tax savings from:
 *   - Section 24b: Interest deduction (₹2L cap for self-occupied; unlimited for rented)
 *   - Section 80C: Principal repayment deduction (₹1.5L cap; shared with other 80C investments)
 *
 * Supports:
 *   - Old Tax Regime (slabs: 0/5/20/30%) with Sec 24b + 80C
 *   - New Tax Regime FY 2025-26 (slabs: 0/5/10/15/20/25/30%) — NO deductions (24b/80C not applicable)
 *   - Surcharge tiers (10%/15%/25%/37% on tax above ₹50L / ₹1Cr / ₹2Cr / ₹5Cr)
 *   - 4% Health & Education Cess on (tax + surcharge)
 *
 * All amounts in INR (₹).
 */

// ─── Tax Regime ──────────────────────────────────────────────────────────────

export type TaxRegime = "old" | "new";

export interface OldSlabConfig {
  regime: "old";
  annualIncome: number;        // gross annual income in ₹
  otherSection80C: number;     // other 80C investments (ELSS, PF, LIC etc.) up to 1.5L
  propertyType: "self" | "let"; // self-occupied vs let-out
}

export interface NewSlabConfig {
  regime: "new";
  annualIncome: number;        // gross annual income in ₹
  // New regime: no 24b/80C deductions apply
  otherSection80C?: number;    // used only for the old-regime comparison
  propertyType?: "self" | "let"; // used only for the old-regime comparison
}

export type TaxConfig = OldSlabConfig | NewSlabConfig;

// ─── Slab computation ────────────────────────────────────────────────────────

/** OLD REGIME slabs (for individuals under 60 years of age). */
const OLD_SLABS = [
  { upTo: 250_000,   rate: 0 },
  { upTo: 500_000,   rate: 0.05 },
  { upTo: 1_000_000, rate: 0.20 },
  { upTo: Infinity,  rate: 0.30 },
];

/** NEW REGIME slabs for FY 2025-26 (AY 2026-27). */
const NEW_SLABS = [
  { upTo: 400_000,   rate: 0.00 },
  { upTo: 800_000,   rate: 0.05 },
  { upTo: 1_200_000, rate: 0.10 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.20 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Infinity,  rate: 0.30 },
];

const OLD_STANDARD_DEDUCTION = 50_000;
const NEW_STANDARD_DEDUCTION = 75_000;
/** Old regime Section 87A rebate: if income ≤ 5L, tax = 0 */
const OLD_87A_LIMIT = 500_000;
/** New regime Section 87A rebate FY 2025-26: if income ≤ 12L, tax = 0 */
const NEW_87A_LIMIT = 1_200_000;

/** Compute surcharge rate based on income. New-regime surcharge is capped at 25%. */
function surchargeRate(income: number, isNewRegime: boolean): number {
  if (income <= 5_000_000)  return 0;
  if (income <= 10_000_000) return 0.10;
  if (income <= 20_000_000) return 0.15;
  if (isNewRegime || income <= 50_000_000) return 0.25;
  return 0.37;
}

/** Compute slab tax (before cess/surcharge) for a given taxable income */
function computeSlabTax(
  taxableIncome: number,
  slabs: Array<{ upTo: number; rate: number }>
): number {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const slice = Math.min(taxableIncome, slab.upTo) - prev;
    tax += slice * slab.rate;
    prev = slab.upTo;
  }
  return tax;
}

/** Full Indian tax with 87A/surcharge marginal relief and 4% cess. */
function totalTax(
  taxableIncome: number,
  slabs: typeof OLD_SLABS,
  rebateLimit: number,
  isNewRegime: boolean,
): number {
  let tax = computeSlabTax(taxableIncome, slabs);
  if (taxableIncome <= rebateLimit) return 0;

  // Section 87A marginal relief prevents a tax cliff immediately above the rebate limit.
  tax = Math.min(tax, taxableIncome - rebateLimit);

  let taxWithSurcharge = tax * (1 + surchargeRate(taxableIncome, isNewRegime));
  const surchargeThresholds = isNewRegime
    ? [5_000_000, 10_000_000, 20_000_000]
    : [5_000_000, 10_000_000, 20_000_000, 50_000_000];

  for (const threshold of surchargeThresholds) {
    if (taxableIncome <= threshold) continue;
    const taxAtThreshold = computeSlabTax(threshold, slabs);
    const previousRate = surchargeRate(threshold - 1, isNewRegime);
    const maxTaxAfterThreshold = taxAtThreshold * (1 + previousRate) + taxableIncome - threshold;
    taxWithSurcharge = Math.min(taxWithSurcharge, maxTaxAfterThreshold);
  }

  return Math.round(taxWithSurcharge * 1.04);
}

// ─── Per-Year deduction result ────────────────────────────────────────────────

export interface YearTaxRow {
  year: number;            // 1-indexed
  annualInterest: number;  // total interest paid this year
  annualPrincipal: number; // total principal repaid this year
  deductibleInterest: number;  // after Sec 24b cap
  deductiblePrincipal: number; // after Sec 80C cap (after subtracting other 80C)
  taxWithoutDeduction: number; // tax if no home loan
  taxWithDeduction: number;    // tax after home loan deductions
  taxSavedThisYear: number;    // delta
}

export interface TaxDeductorResult {
  regime: TaxRegime;
  yearRows: YearTaxRow[];
  totalInterestPaid: number;
  totalPrincipalRepaid: number;
  totalTaxSaved: number;
  avgPreTaxRate: number;
  postTaxEffectiveRate: number;
  /** true if new regime was chosen (no deductions available) */
  noDeductionsApply: boolean;
  /** Estimated tax saved if borrower SWITCHED to old regime (for comparison) */
  oldRegimeCounterfactual: number;
}

// ─── Main engine function ─────────────────────────────────────────────────────

export interface LoanYearSummary {
  annualInterest: number;
  annualPrincipal: number;
}

/**
 * Compute year-by-year tax savings.
 * @param yearlyLoanSummaries Array of {annualInterest, annualPrincipal} per year (across all home loans)
 * @param config Tax configuration (regime, income, property type, etc.)
 * @param avgPreTaxRate Weighted average pre-tax interest rate across all loans
 */
export function computeTaxSavings(
  yearlyLoanSummaries: LoanYearSummary[],
  config: TaxConfig,
  avgPreTaxRate: number
): TaxDeductorResult {
  const regime = config.regime;
  const income = config.annualIncome;

  // New regime: no deductions apply; compute gross tax for reference
  if (regime === "new") {
    const totalInterest = yearlyLoanSummaries.reduce((s, y) => s + y.annualInterest, 0);
    const totalPrincipal = yearlyLoanSummaries.reduce((s, y) => s + y.annualPrincipal, 0);

    // Gross tax on full income (new regime, no deductions)
    const taxableNew = Math.max(0, income - NEW_STANDARD_DEDUCTION);
    const _grossTaxNew = totalTax(taxableNew, NEW_SLABS, NEW_87A_LIMIT, true);
    void _grossTaxNew; // used for future "tax you'd pay" display

    // Compute what old regime would save (counterfactual)
    const oldConfig: OldSlabConfig = {
      regime: "old",
      annualIncome: income,
      otherSection80C: config.otherSection80C ?? 0,
      propertyType: config.propertyType ?? "self",
    };
    const oldResult = computeTaxSavings(yearlyLoanSummaries, oldConfig, avgPreTaxRate);

    return {
      regime: "new",
      yearRows: [],
      totalInterestPaid: totalInterest,
      totalPrincipalRepaid: totalPrincipal,
      totalTaxSaved: 0,
      avgPreTaxRate,
      postTaxEffectiveRate: avgPreTaxRate, // no benefit
      noDeductionsApply: true,
      oldRegimeCounterfactual: oldResult.totalTaxSaved,
    };
  }

  // Old regime
  const { otherSection80C, propertyType } = config as OldSlabConfig;

  const interestCap = propertyType === "self" ? 200_000 : Infinity;
  const remaining80C = Math.max(0, 150_000 - otherSection80C); // remaining 80C room

  const yearRows: YearTaxRow[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalSaved = 0;

  yearlyLoanSummaries.forEach((yr, idx) => {
    const year = idx + 1;
    totalInterest += yr.annualInterest;
    totalPrincipal += yr.annualPrincipal;

    // Deductible interest (Sec 24b)
    const deductibleInterest = Math.min(yr.annualInterest, interestCap);

    // Deductible principal (Sec 80C), subject to remaining room after other 80C
    const deductiblePrincipal = Math.min(yr.annualPrincipal, remaining80C);

    // Standard deduction in old regime is ₹50,000 from salary
    const stdDeduction = income > 0 ? OLD_STANDARD_DEDUCTION : 0;

    const taxableWithout = Math.max(0, income - stdDeduction);
    const deductionsApplied = deductibleInterest + deductiblePrincipal;
    const taxableWith = Math.max(0, income - stdDeduction - deductionsApplied);

    const taxWithout = totalTax(taxableWithout, OLD_SLABS, OLD_87A_LIMIT, false);
    const taxWith = totalTax(taxableWith, OLD_SLABS, OLD_87A_LIMIT, false);

    const saved = Math.max(0, taxWithout - taxWith);
    totalSaved += saved;

    yearRows.push({
      year,
      annualInterest: Math.round(yr.annualInterest),
      annualPrincipal: Math.round(yr.annualPrincipal),
      deductibleInterest: Math.round(deductibleInterest),
      deductiblePrincipal: Math.round(deductiblePrincipal),
      taxWithoutDeduction: taxWithout,
      taxWithDeduction: taxWith,
      taxSavedThisYear: saved,
    });
  });

  // Post-tax effective rate = avgRate * (1 - effective_tax_benefit_rate)
  // Simplified: effective slab on deductible interest
  const grossTaxable = Math.max(0, income - OLD_STANDARD_DEDUCTION);
  const slabTaxBaseline = computeSlabTax(grossTaxable, OLD_SLABS);
  const effectiveMarginalRate = grossTaxable > 0 ? slabTaxBaseline / grossTaxable : 0;
  const postTaxEffectiveRate = avgPreTaxRate * (1 - effectiveMarginalRate * (interestCap > 0 ? 1 : 0));

  return {
    regime: "old",
    yearRows,
    totalInterestPaid: Math.round(totalInterest),
    totalPrincipalRepaid: Math.round(totalPrincipal),
    totalTaxSaved: Math.round(totalSaved),
    avgPreTaxRate,
    postTaxEffectiveRate: Math.round(postTaxEffectiveRate * 100) / 100,
    noDeductionsApply: false,
    oldRegimeCounterfactual: 0,
  };
}

/**
 * Build year-by-year loan summaries from an amortization row array.
 * Sums interest + principal per 12-month window.
 */
export function buildYearlyLoanSummaries(
  rows: Array<{ interest: number; principalPaid: number }>
): LoanYearSummary[] {
  const summaries: LoanYearSummary[] = [];
  const yearsCount = Math.ceil(rows.length / 12);
  for (let y = 0; y < yearsCount; y++) {
    const slice = rows.slice(y * 12, (y + 1) * 12);
    summaries.push({
      annualInterest: slice.reduce((s, r) => s + r.interest, 0),
      annualPrincipal: slice.reduce((s, r) => s + r.principalPaid, 0),
    });
  }
  return summaries;
}

/**
 * Merge yearly summaries across multiple loans (add interest + principal per year,
 * padding shorter schedules with zeros).
 */
export function mergeYearlySummaries(allSummaries: LoanYearSummary[][]): LoanYearSummary[] {
  const maxYears = Math.max(...allSummaries.map((s) => s.length), 0);
  const merged: LoanYearSummary[] = [];
  for (let y = 0; y < maxYears; y++) {
    merged.push({
      annualInterest: allSummaries.reduce((s, loan) => s + (loan[y]?.annualInterest ?? 0), 0),
      annualPrincipal: allSummaries.reduce((s, loan) => s + (loan[y]?.annualPrincipal ?? 0), 0),
    });
  }
  return merged;
}

export interface RegimeVerdict {
  recommendation: "old" | "new" | "equal";
  firstYearSavings: number;
  lifetimeSavings: number;
  crossoverYear: number | null;
  firstYearOldTax: number;
  firstYearNewTax: number;
  lifetimeOldTax: number;
  lifetimeNewTax: number;
}

export function computeRegimeVerdict(
  yearlyLoanSummaries: LoanYearSummary[],
  income: number,
  otherSection80C: number,
  propertyType: "self" | "let"
): RegimeVerdict {
  const oldStandardDeduction = income > 0 ? OLD_STANDARD_DEDUCTION : 0;
  const newStandardDeduction = income > 0 ? NEW_STANDARD_DEDUCTION : 0;
  const interestCap = propertyType === "self" ? 200_000 : Infinity;
  const remaining80C = Math.max(0, 150_000 - otherSection80C);

  // Compute New Regime tax (constant each year since income is constant)
  const netTaxableNew = Math.max(0, income - newStandardDeduction);
  const taxNewPerYear = totalTax(netTaxableNew, NEW_SLABS, NEW_87A_LIMIT, true);

  let totalTaxOld = 0;
  let totalTaxNew = 0;
  let firstYearOldTax = 0;
  let firstYearNewTax = taxNewPerYear;

  let crossoverYear: number | null = null;

  yearlyLoanSummaries.forEach((yr, idx) => {
    const year = idx + 1;
    const deductibleInterest = Math.min(yr.annualInterest, interestCap);
    const deductiblePrincipal = Math.min(yr.annualPrincipal, remaining80C);

    const netTaxableOld = Math.max(0, income - oldStandardDeduction - deductibleInterest - deductiblePrincipal);
    const taxOldThisYear = totalTax(netTaxableOld, OLD_SLABS, OLD_87A_LIMIT, false);

    totalTaxOld += taxOldThisYear;
    totalTaxNew += taxNewPerYear;

    if (year === 1) {
      firstYearOldTax = taxOldThisYear;
    }

    if (crossoverYear === null && taxOldThisYear > taxNewPerYear) {
      crossoverYear = year;
    }
  });

  const firstYearSavings = Math.abs(firstYearNewTax - firstYearOldTax);
  const lifetimeSavings = Math.abs(totalTaxNew - totalTaxOld);

  let recommendation: "old" | "new" | "equal" = "equal";
  if (firstYearOldTax < firstYearNewTax) {
    recommendation = "old";
  } else if (firstYearNewTax < firstYearOldTax) {
    recommendation = "new";
  }

  return {
    recommendation,
    firstYearSavings,
    lifetimeSavings,
    crossoverYear,
    firstYearOldTax,
    firstYearNewTax,
    lifetimeOldTax: totalTaxOld,
    lifetimeNewTax: totalTaxNew,
  };
}
