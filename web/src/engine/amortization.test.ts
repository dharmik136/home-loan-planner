import { describe, it, expect } from "vitest";
import { monthlyEmi, buildSchedule, compare } from "./amortization";
import { buildPrepayments } from "./planning";

// These pin the SAME verified numbers as the Python core and the Excel workbook.
describe("monthlyEmi", () => {
  it("30L @ 7.5% / 180mo -> 27811 (ceil)", () => {
    expect(monthlyEmi(3_000_000, 7.5, 180)).toBe(27811);
  });
  it("50L @ 7.5% / 180mo -> 46351", () => {
    expect(monthlyEmi(5_000_000, 7.5, 180)).toBe(46351);
  });
  it("zero-rate splits evenly", () => {
    expect(monthlyEmi(120_000, 0, 12)).toBe(10_000);
  });
});

describe("buildSchedule baseline", () => {
  it("pays off in exactly 180 months with no prepay", () => {
    const s = buildSchedule(3_000_000, 7.5, 180);
    expect(s.monthsToPayoff).toBe(180);
    expect(s.rows[s.rows.length - 1].closing).toBe(0);
  });
  it("total paid == principal + interest to the rupee", () => {
    const s = buildSchedule(3_000_000, 7.5, 180);
    expect(Math.round(s.totalPaid)).toBe(Math.round(3_000_000 + s.totalInterest));
  });
  it("baseline interest matches verified ~20.05L", () => {
    const s = buildSchedule(3_000_000, 7.5, 180);
    expect(Math.round(s.totalInterest)).toBe(2_005_772);
  });
});

describe("prepayment effects", () => {
  it("5L @ month 12 on 30L saves 7,39,363 interest and 44 months", () => {
    const base = buildSchedule(3_000_000, 7.5, 180);
    const plan = buildSchedule(3_000_000, 7.5, 180, undefined, { 12: 500_000 });
    const c = compare(base, plan);
    expect(c.interestSaved).toBe(739_363);
    expect(c.monthsSaved).toBe(44);
  });
  it("early prepay saves more than the same amount late", () => {
    const base = buildSchedule(3_000_000, 7.5, 180);
    const early = compare(base, buildSchedule(3_000_000, 7.5, 180, undefined, { 6: 300_000 }));
    const late = compare(base, buildSchedule(3_000_000, 7.5, 180, undefined, { 120: 300_000 }));
    expect(early.interestSaved).toBeGreaterThan(late.interestSaved);
  });
  it("larger balance saves more for the same prepayment", () => {
    const a = compare(
      buildSchedule(3_000_000, 7.5, 180),
      buildSchedule(3_000_000, 7.5, 180, undefined, { 12: 200_000 }),
    );
    const b = compare(
      buildSchedule(5_000_000, 7.5, 180),
      buildSchedule(5_000_000, 7.5, 180, undefined, { 12: 200_000 }),
    );
    expect(b.interestSaved).toBeGreaterThan(a.interestSaved);
  });
  it("prepayment is capped at the outstanding balance", () => {
    const plan = buildSchedule(3_000_000, 7.5, 180, undefined, { 2: 10_000_000 });
    expect(plan.rows[plan.rows.length - 1].closing).toBe(0);
    expect(plan.monthsToPayoff).toBe(2);
  });
  it("reduceEmi strategy lowers EMI and keeps original tenure", () => {
    const base = buildSchedule(3_000_000, 7.5, 180);
    const planEmi = buildSchedule(3_000_000, 7.5, 180, undefined, { 12: 500_000 }, "reduceEmi");
    expect(planEmi.monthsToPayoff).toBe(180);
    expect(planEmi.totalInterest).toBeLessThan(base.totalInterest);
    expect(planEmi.rows[12].emi).toBeLessThan(27811);
  });
  it("stepUpPct increases EMI yearly and shortens tenure", () => {
    const base = buildSchedule(3_000_000, 7.5, 180);
    const planStepUp = buildSchedule(3_000_000, 7.5, 180, undefined, {}, "reduceTenure", {}, 5);
    expect(planStepUp.rows[0].emi).toBe(27811);
    expect(planStepUp.rows[12].emi).toBeGreaterThan(27811);
    expect(planStepUp.monthsToPayoff).toBeLessThan(180);
    expect(planStepUp.totalInterest).toBeLessThan(base.totalInterest);
  });
  it("buildPrepayments aggregates extra emi per year correctly", () => {
    const map = buildPrepayments([], 180, true, 20_000);
    expect(map[12]).toBe(20_000);
    expect(map[24]).toBe(20_000);
    expect(map[180]).toBe(20_000);
    expect(map[6]).toBeUndefined();
  });
});
