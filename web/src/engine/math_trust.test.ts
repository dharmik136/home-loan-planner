import { describe, it, expect } from "vitest";
import { monthlyEmi, buildSchedule, compare } from "./amortization";
import { computeRollover } from "./rollover";
import { type Loan, computeLoan } from "./planning";

describe("Math Trust Fixtures", () => {
  // 1. Single Loan Baseline Schedule
  it("Verify single loan baseline schedule reducing interest calculations", () => {
    const principal = 2_000_000;
    const ratePct = 9.0;
    const tenureMonths = 120;
    const emi = monthlyEmi(principal, ratePct, tenureMonths);
    
    const sched = buildSchedule(principal, ratePct, tenureMonths, emi);
    expect(sched.monthsToPayoff).toBe(120);
    
    // First month interest should be principal * (rate / 12)
    const firstRow = sched.rows[0];
    expect(firstRow.interest).toBe(Math.round(principal * (ratePct / 100 / 12)));
    expect(firstRow.principalPaid).toBe(emi - firstRow.interest);
    expect(firstRow.closing).toBe(principal - firstRow.principalPaid);
  });

  // 2. Multi-Loan Avalanche Strategy
  it("Verify multi-loan avalanche strategy rolls extra payment to highest interest first", () => {
    const loans: Loan[] = [
      { id: "L1", name: "Car Loan (High Rate)", outstanding: 500_000, ratePct: 11.5, tenureMonths: 60, startYYYYMM: "2026-07" },
      { id: "L2", name: "Home Loan (Low Rate)", outstanding: 3_000_000, ratePct: 8.5, tenureMonths: 180, startYYYYMM: "2026-07" }
    ];
    
    const res = computeRollover(loans, 15_000, "avalanche");
    // Avalanche should prioritize closing Car Loan L1 first because it has the higher rate (11.5% > 8.5%)
    expect(res.payoffMonths["L1"]).toBeLessThan(60);
  });

  // 3. Multi-Loan Snowball Strategy
  it("Verify multi-loan snowball strategy rolls extra payment to smallest outstanding first", () => {
    const loans: Loan[] = [
      { id: "L1", name: "Car Loan (High Balance)", outstanding: 1_200_000, ratePct: 10.0, tenureMonths: 60, startYYYYMM: "2026-07" },
      { id: "L2", name: "Credit Card (Low Balance)", outstanding: 100_000, ratePct: 18.0, tenureMonths: 12, startYYYYMM: "2026-07" }
    ];
    
    const res = computeRollover(loans, 10_000, "snowball");
    // Snowball prioritizes the lowest balance (L2, 100k) first, closing it rapidly
    expect(res.payoffMonths["L2"]).toBeLessThanOrEqual(6);
  });

  // 4. Windfall Allocation Split Math
  it("Verify windfall split logic matches optimal math distribution", () => {
    // Allocation should target loans based on maximizing total interest saved
    const loan: Loan = { id: "L1", name: "Home Loan", outstanding: 3_000_000, ratePct: 8.5, tenureMonths: 240, startYYYYMM: "2026-07" };
    const base = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths);
    const plan = buildSchedule(loan.outstanding, loan.ratePct, loan.tenureMonths, undefined, { 12: 200_000 });
    
    const diff = compare(base, plan);
    expect(diff.interestSaved).toBeGreaterThan(200_000); // prepaying home loan early compounding-saves more than the prepayment amount
  });

  // 5. Step-Up EMI
  it("Verify step-up EMI increases monthly payment yearly by step-up percentage", () => {
    const principal = 3_000_000;
    const ratePct = 8.5;
    const tenureMonths = 240;
    const baseEmi = monthlyEmi(principal, ratePct, tenureMonths);
    
    // 5% yearly step-up
    const sched = buildSchedule(principal, ratePct, tenureMonths, baseEmi, {}, "reduceTenure", {}, 5);
    
    // Month 1 EMI should be baseEmi
    expect(sched.rows[0].emi).toBe(baseEmi);
    // Month 13 EMI should be baseEmi * 1.05
    expect(sched.rows[12].emi).toBe(Math.round(baseEmi * 1.05 * 100) / 100);
    // Loan tenure should be significantly shorter than 240 months
    expect(sched.monthsToPayoff).toBeLessThan(240);
  });

  // 6. 13th EMI (Extra EMI Yearly)
  it("Verify 13th EMI prepayment occurs exactly every 12 months", () => {
    const principal = 2_000_000;
    const ratePct = 9.0;
    const tenureMonths = 120;
    const loans: Loan[] = [
      { id: "L1", name: "Test 13th EMI", outstanding: principal, ratePct: ratePct, tenureMonths: tenureMonths, startYYYYMM: "2026-07", extraEmiPerYear: true }
    ];
    
    const res = computeRollover(loans, 0, "avalanche");
    
    // Verify prepayment rows occur at multiples of 12
    const prepayRows = res.rows.filter(r => r.prepayment > 0);
    prepayRows.forEach(r => {
      expect(r.month % 12).toBe(0);
    });
  });

  // 7. EMI Too Low Failure State Guard
  it("Verify EMI-too-low condition is handled gracefully", () => {
    const principal = 1_000_000;
    const ratePct = 12.0; // 1% per month = 10,000 interest
    const tenureMonths = 120;
    
    // If we specify an EMI of 5,000 (which is less than 10,000 interest), principal paid is negative
    // The engine should either stop at tenure length limit or cap calculations
    const sched = buildSchedule(principal, ratePct, tenureMonths, 5_000);
    expect(sched.rows.length).toBeLessThanOrEqual(tenureMonths);
  });

  // 8. Zero & Negative Rate Inputs
  it("Verify zero interest rate splits principal evenly across tenure", () => {
    const principal = 120_000;
    const ratePct = 0;
    const tenureMonths = 12;
    const emi = monthlyEmi(principal, ratePct, tenureMonths);
    
    expect(emi).toBe(10_000);
    const sched = buildSchedule(principal, ratePct, tenureMonths, emi);
    expect(sched.rows[0].interest).toBe(0);
    expect(sched.rows[0].principalPaid).toBe(10_000);
    expect(sched.rows[0].closing).toBe(110_000);
  });

  // 9. Final Balance Never Below Zero
  it("Verify closing balance in final month rounds exactly to zero and never goes negative", () => {
    const principal = 1_500_000;
    const ratePct = 8.5;
    const tenureMonths = 180;
    const emi = monthlyEmi(principal, ratePct, tenureMonths);
    
    const sched = buildSchedule(principal, ratePct, tenureMonths, emi);
    const lastRow = sched.rows[sched.rows.length - 1];
    expect(lastRow.closing).toBe(0);
    expect(lastRow.emi).toBeGreaterThan(0);
  });

  // 10. Amortization Loop Limit Safety
  it("Verify simulator terminates at maximum tenure limit to prevent infinite loops", () => {
    const principal = 1_000_000;
    const ratePct = 20.0;
    const tenureMonths = 600; // max tenure allowed
    
    const sched = buildSchedule(principal, ratePct, tenureMonths, 1_000);
    expect(sched.rows.length).toBeLessThanOrEqual(600);
  });

  // 11. Principal Moratorium: Interest-Only Option
  it("Verify Interest-Only moratorium payments and tenure extension", () => {
    const principal = 1_000_000;
    const ratePct = 12.0; // 1% per month = 10,000 interest
    const tenureMonths = 120;
    const emi = monthlyEmi(principal, ratePct, tenureMonths);

    // moratorium starting at month 12 for 6 months
    const sched = buildSchedule(
      principal,
      ratePct,
      tenureMonths,
      emi,
      {},
      "reduceTenure",
      {},
      0,
      12,
      6,
      "interestOnly"
    );

    // Check moratorium month (month 12 is index 11)
    const m12 = sched.rows[11];
    expect(Math.round(m12.interest)).toBe(Math.round(m12.opening * 0.01));
    expect(Math.round(m12.emi)).toBe(Math.round(m12.interest));
    expect(m12.principalPaid).toBe(0);
    expect(m12.closing).toBe(m12.opening);

    // Tenure should be extended because of paused principal repayments
    expect(sched.monthsToPayoff).toBeGreaterThan(120);
    expect(sched.rows[sched.rows.length - 1].closing).toBe(0);
  });

  // 12. Principal Moratorium: Full Holiday Option
  it("Verify Full Holiday moratorium compounds interest and extends tenure", () => {
    const principal = 1_000_000;
    const ratePct = 12.0; // 1% per month = 10,000 interest
    const tenureMonths = 120;
    const emi = monthlyEmi(principal, ratePct, tenureMonths);

    // moratorium starting at month 12 for 6 months
    const sched = buildSchedule(
      principal,
      ratePct,
      tenureMonths,
      emi,
      {},
      "reduceTenure",
      {},
      0,
      12,
      6,
      "fullHoliday"
    );

    // Check moratorium month (month 12 is index 11)
    const m12 = sched.rows[11];
    expect(Math.round(m12.interest)).toBe(Math.round(m12.opening * 0.01));
    expect(m12.emi).toBe(0);
    expect(Math.round(m12.principalPaid)).toBe(Math.round(-m12.interest));
    expect(Math.round(m12.closing)).toBe(Math.round(m12.opening + m12.interest));

    // Balance should have increased
    expect(m12.closing).toBeGreaterThan(m12.opening);

    // Tenure should be extended even further than interest-only
    expect(sched.monthsToPayoff).toBeGreaterThan(120);
    expect(sched.rows[sched.rows.length - 1].closing).toBe(0);
  });

  // 13. Balloon Payment Calculator
  it("Verify Balloon Payment prepayments occur at year milestones and shorten tenure", () => {
    const loan: Loan = {
      id: "L1",
      name: "Test Balloon Loan",
      outstanding: 2_000_000,
      ratePct: 9.0,
      tenureMonths: 240,
      startYYYYMM: "2026-07",
      balloonPayments: [
        { id: "bp1", yearIndex: 5, amount: 200_000 } // ₹2L at Year 5 (Month 60)
      ]
    };

    const res = computeLoan(loan, []);
    
    // In the plan schedule, month 60 should have a prepayment of ₹2,00,000
    const m60 = res.plan.rows.find(r => r.month === 60);
    expect(m60).toBeDefined();
    expect(m60?.prepayment).toBe(200_000);

    // Baseline should not have this prepayment
    const baseM60 = res.baseline.rows.find(r => r.month === 60);
    expect(baseM60?.prepayment).toBe(0);

    // Total interest paid in plan should be less than baseline
    expect(res.plan.totalInterest).toBeLessThan(res.baseline.totalInterest);
    // Tenure should be shorter
    expect(res.plan.monthsToPayoff).toBeLessThan(240);
  });
});
