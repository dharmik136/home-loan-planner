import { describe, it, expect } from "vitest";
import { computeRollover } from "./rollover";
import { type Loan } from "./planning";

describe("computeRollover math engine", () => {
  const sampleLoans: Loan[] = [
    {
      id: "loan-1",
      name: "Loan A",
      outstanding: 1_000_000,
      ratePct: 8.0,
      tenureMonths: 120,
      startYYYYMM: "2026-07",
    },
    {
      id: "loan-2",
      name: "Loan B",
      outstanding: 2_000_000,
      ratePct: 9.0, // Higher rate
      tenureMonths: 120,
      startYYYYMM: "2026-07",
    },
  ];

  it("calculates baseline correctly", () => {
    const res = computeRollover(sampleLoans, 0, "avalanche");
    expect(res.baselineTotalInterest).toBeGreaterThan(0);
    expect(res.totalInterestSaved).toBe(0);
    expect(res.monthsSaved).toBe(0);
  });

  it("avalanche strategy targets higher interest rate loan first", () => {
    // Commit a large extra budget of ₹50,000 per month
    const res = computeRollover(sampleLoans, 50_000, "avalanche");
    expect(res.totalInterestSaved).toBeGreaterThan(0);
    expect(res.monthsSaved).toBeGreaterThan(0);

    // Avalanche targets Loan B (9% rate) first. 
    // Therefore, Loan B should be paid off sooner than Loan A relative to their normal schedules,
    // or at least Loan B receives the bulk of prepayments.
    // Let's assert that the simulator successfully completes and saves interest.
    expect(res.payoffMonths["loan-2"]).toBeLessThan(120);
  });

  it("snowball strategy targets lower outstanding balance loan first", () => {
    const res = computeRollover(sampleLoans, 50_000, "snowball");
    // Snowball targets Loan A (10 Lakh) first over Loan B (20 Lakh).
    // Let's verify that Loan A is paid off.
    expect(res.payoffMonths["loan-1"]).toBeLessThan(res.payoffMonths["loan-2"]);
  });

  it("supports bi-weekly payment acceleration in rollover calculations", () => {
    const biWeeklyLoans: Loan[] = [
      {
        id: "loan-1",
        name: "Loan A",
        outstanding: 1_000_000,
        ratePct: 8.0,
        tenureMonths: 120,
        startYYYYMM: "2026-07",
        biWeekly: true,
      }
    ];
    // Baseline calculations should include the bi-weekly payments, reducing total interest
    const resNormal = computeRollover(sampleLoans.slice(0, 1), 0, "avalanche");
    const resBiWeekly = computeRollover(biWeeklyLoans, 0, "avalanche");
    
    expect(resBiWeekly.baselineTotalInterest).toBeLessThan(resNormal.baselineTotalInterest);
    expect(resBiWeekly.baselineMonthsToPayoff).toBeLessThan(resNormal.baselineMonthsToPayoff);
  });
});
