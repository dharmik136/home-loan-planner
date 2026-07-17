import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedule, compare, monthlyEmi } from './amortization.ts';

test('standard EMI matches the verified reducing-balance example', () => {
  assert.equal(monthlyEmi(3_500_000, 7.25, 180), 31_951);
});

test('a recurring payment shortens tenure and saves interest', () => {
  const principal = 5_000_000;
  const months = 240;
  const emi = monthlyEmi(principal, 8.5, months);
  const baseline = buildSchedule(principal, 8.5, months, emi);
  const plan = buildSchedule(principal, 8.5, months, emi + 10_000);
  const result = compare(baseline, plan);

  assert.ok(result.interestSaved > 2_000_000);
  assert.ok(result.monthsSaved > 70);
  assert.ok(plan.monthsToPayoff < baseline.monthsToPayoff);
});

test('reduce-EMI rate changes use every remaining payment month', () => {
  const principal = 1_000_000;
  const emi = monthlyEmi(principal, 10, 12);
  const plan = buildSchedule(
    principal,
    10,
    12,
    emi,
    {},
    'reduceEmi',
    { 2: 12 },
  );

  assert.equal(plan.monthsToPayoff, 12);
  assert.equal(Math.round(plan.rows[1].emi), 88_779);
});
