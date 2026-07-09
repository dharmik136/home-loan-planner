/**
 * tax.test.ts — Unit tests for the Indian home loan tax deduction engine
 */
import { describe, it, expect } from "vitest";
import {
  computeTaxSavings,
  buildYearlyLoanSummaries,
  mergeYearlySummaries,
  type LoanYearSummary,
  type OldSlabConfig,
  type NewSlabConfig,
} from "./tax";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeYears(n: number, interest: number, principal: number): LoanYearSummary[] {
  return Array.from({ length: n }, () => ({ annualInterest: interest, annualPrincipal: principal }));
}

// ─── buildYearlyLoanSummaries ─────────────────────────────────────────────────

describe("buildYearlyLoanSummaries", () => {
  it("groups 24 monthly rows into 2 yearly summaries", () => {
    const rows = Array.from({ length: 24 }, () => ({ interest: 5000, principalPaid: 3000 }));
    const result = buildYearlyLoanSummaries(rows);
    expect(result).toHaveLength(2);
    expect(result[0].annualInterest).toBeCloseTo(60_000);
    expect(result[0].annualPrincipal).toBeCloseTo(36_000);
  });

  it("handles a single month correctly", () => {
    const rows = [{ interest: 10_000, principalPaid: 5_000 }];
    const result = buildYearlyLoanSummaries(rows);
    expect(result).toHaveLength(1);
    expect(result[0].annualInterest).toBe(10_000);
    expect(result[0].annualPrincipal).toBe(5_000);
  });

  it("handles 13 months (partial second year)", () => {
    const rows = Array.from({ length: 13 }, () => ({
      interest: 1000,
      principalPaid: 500,
    }));
    const result = buildYearlyLoanSummaries(rows);
    expect(result).toHaveLength(2);
    expect(result[1].annualInterest).toBe(1000); // only month 13
  });
});

// ─── mergeYearlySummaries ─────────────────────────────────────────────────────

describe("mergeYearlySummaries", () => {
  it("merges two loan summaries of equal length by addition", () => {
    const loanA = makeYears(3, 50_000, 20_000);
    const loanB = makeYears(3, 30_000, 10_000);
    const merged = mergeYearlySummaries([loanA, loanB]);
    expect(merged).toHaveLength(3);
    expect(merged[0].annualInterest).toBe(80_000);
    expect(merged[0].annualPrincipal).toBe(30_000);
  });

  it("pads shorter loan with zeros when merging", () => {
    const long = makeYears(5, 40_000, 15_000);
    const short = makeYears(2, 20_000, 8_000);
    const merged = mergeYearlySummaries([long, short]);
    expect(merged).toHaveLength(5);
    expect(merged[4].annualInterest).toBe(40_000); // only long loan left
    expect(merged[4].annualPrincipal).toBe(15_000);
  });
});

// ─── computeTaxSavings — OLD REGIME ──────────────────────────────────────────

describe("computeTaxSavings — Old Regime", () => {
  const baseOldConfig: OldSlabConfig = {
    regime: "old",
    annualIncome: 1_500_000, // 15L — in 30% slab
    otherSection80C: 0,
    propertyType: "self",
  };

  it("produces non-zero tax savings for 15L income with home loan interest", () => {
    const years = makeYears(5, 200_000, 80_000); // 2L interest/yr, 80K principal
    const result = computeTaxSavings(years, baseOldConfig, 8.5);
    expect(result.totalTaxSaved).toBeGreaterThan(0);
    expect(result.regime).toBe("old");
    expect(result.noDeductionsApply).toBe(false);
  });

  it("caps Sec 24b interest deduction at ₹2L for self-occupied", () => {
    // Interest of ₹3L/yr — only ₹2L should be deductible
    const years = makeYears(1, 300_000, 50_000);
    const result = computeTaxSavings(years, baseOldConfig, 8.5);
    expect(result.yearRows[0].deductibleInterest).toBe(200_000);
    expect(result.yearRows[0].annualInterest).toBe(300_000);
  });

  it("has no Sec 24b cap for let-out property", () => {
    const letConfig: OldSlabConfig = { ...baseOldConfig, propertyType: "let" };
    const years = makeYears(1, 300_000, 50_000);
    const result = computeTaxSavings(years, letConfig, 8.5);
    expect(result.yearRows[0].deductibleInterest).toBe(300_000);
  });

  it("reduces 80C deductible principal by existing 80C investments", () => {
    const config: OldSlabConfig = {
      ...baseOldConfig,
      otherSection80C: 120_000, // already 1.2L used → only 30K room left
    };
    const years = makeYears(1, 150_000, 100_000);
    const result = computeTaxSavings(years, config, 8.5);
    expect(result.yearRows[0].deductiblePrincipal).toBe(30_000);
  });

  it("produces zero savings for income at or below basic exemption limit", () => {
    const zeroConfig: OldSlabConfig = {
      regime: "old",
      annualIncome: 250_000, // right at exemption — no tax
      otherSection80C: 0,
      propertyType: "self",
    };
    const years = makeYears(2, 100_000, 50_000);
    const result = computeTaxSavings(years, zeroConfig, 8.5);
    expect(result.totalTaxSaved).toBe(0);
  });

  it("post-tax effective rate is lower than pre-tax rate for taxable income", () => {
    const years = makeYears(3, 200_000, 60_000);
    const result = computeTaxSavings(years, baseOldConfig, 8.5);
    expect(result.postTaxEffectiveRate).toBeLessThan(result.avgPreTaxRate);
  });

  it("returns correct count of year rows", () => {
    const years = makeYears(10, 200_000, 80_000);
    const result = computeTaxSavings(years, baseOldConfig, 8.5);
    expect(result.yearRows).toHaveLength(10);
  });

  it("totalTaxSaved equals sum of yearRows taxSavedThisYear", () => {
    const years = makeYears(7, 180_000, 70_000);
    const result = computeTaxSavings(years, baseOldConfig, 8.5);
    const sumFromRows = result.yearRows.reduce((s, r) => s + r.taxSavedThisYear, 0);
    expect(result.totalTaxSaved).toBe(sumFromRows);
  });
});

// ─── computeTaxSavings — NEW REGIME ──────────────────────────────────────────

describe("computeTaxSavings — New Regime", () => {
  const newConfig: NewSlabConfig = {
    regime: "new",
    annualIncome: 1_200_000, // 12L
  };

  it("returns zero tax saved under new regime", () => {
    const years = makeYears(5, 200_000, 80_000);
    const result = computeTaxSavings(years, newConfig, 8.5);
    expect(result.totalTaxSaved).toBe(0);
    expect(result.noDeductionsApply).toBe(true);
  });

  it("regime is new and returns empty yearRows", () => {
    const years = makeYears(3, 150_000, 60_000);
    const result = computeTaxSavings(years, newConfig, 8.5);
    expect(result.regime).toBe("new");
    expect(result.yearRows).toHaveLength(0);
  });

  it("provides positive old regime counterfactual for taxable income", () => {
    const years = makeYears(5, 200_000, 80_000);
    const result = computeTaxSavings(years, newConfig, 8.5);
    expect(result.oldRegimeCounterfactual).toBeGreaterThan(0);
  });

  it("post-tax rate equals pre-tax rate (no benefit)", () => {
    const years = makeYears(3, 200_000, 80_000);
    const result = computeTaxSavings(years, newConfig, 8.5);
    expect(result.postTaxEffectiveRate).toBe(result.avgPreTaxRate);
  });
});
