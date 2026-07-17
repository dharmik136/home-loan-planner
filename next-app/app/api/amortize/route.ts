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

import { NextResponse } from "next/server";
import { buildSchedule, compare, monthlyEmi } from "../../../engine/amortization";

const MAX_TENURE_MONTHS = 600;
const MAX_PRINCIPAL = 1_000_000_000;
const MAX_RATE_PCT = 100;
const MAX_STEP_UP_PCT = 100;
const MAX_SCHEDULE_ENTRIES = 600;

type NumericMap = Record<number, number>;

function isFiniteNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isValidMonth(value: unknown): value is number {
  return Number.isInteger(value) && isFiniteNumber(value, 1, MAX_TENURE_MONTHS);
}

function parseNumericMap(value: unknown, valueName: "amount" | "rate", maxValue: number): NumericMap | null {
  const result: NumericMap = {};
  const addEntry = (month: unknown, amount: unknown): boolean => {
    if (!isValidMonth(month) || !isFiniteNumber(amount, 0, maxValue)) return false;
    result[month] = amount;
    return true;
  };

  if (Array.isArray(value)) {
    if (value.length > MAX_SCHEDULE_ENTRIES) return null;
    for (const item of value) {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      if (!addEntry(entry.month, entry[valueName])) return null;
    }
    return result;
  }

  if (!value || typeof value !== "object") return null;
  const entries = Object.entries(value);
  if (entries.length > MAX_SCHEDULE_ENTRIES) return null;
  for (const [month, amount] of entries) {
    const numericMonth = Number(month);
    if (!Number.isInteger(numericMonth) || !addEntry(numericMonth, amount)) return null;
  }
  return result;
}

function isValidStartMonth(value: unknown): value is string | undefined {
  if (value === undefined) return true;
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return !!match && Number(match[2]) >= 1 && Number(match[2]) <= 12;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const {
      principal,
      ratePct,
      tenureMonths,
      prepayments = {},
      prepayBehavior = "reduceTenure",
      rateChanges = {},
      stepUpPct = 0,
      moraStart,
      moraDuration,
      moraType,
      interestMethod = "monthlyReducing",
      startYYYYMM,
    } = body as Record<string, unknown>;

    if (!isFiniteNumber(principal, 1, MAX_PRINCIPAL)) {
      return NextResponse.json({ error: "Invalid or missing 'principal'. Must be a positive number." }, { status: 400 });
    }
    if (!isFiniteNumber(ratePct, 0, MAX_RATE_PCT)) {
      return NextResponse.json({ error: "Invalid or missing 'ratePct'. Must be a non-negative number." }, { status: 400 });
    }
    if (!Number.isInteger(tenureMonths) || !isFiniteNumber(tenureMonths, 1, MAX_TENURE_MONTHS)) {
      return NextResponse.json({ error: "Invalid or missing 'tenureMonths'. Must be a positive number." }, { status: 400 });
    }
    if (prepayBehavior !== "reduceTenure" && prepayBehavior !== "reduceEmi") {
      return NextResponse.json({ error: "Invalid 'prepayBehavior'." }, { status: 400 });
    }
    if (!isFiniteNumber(stepUpPct, 0, MAX_STEP_UP_PCT)) {
      return NextResponse.json({ error: "Invalid 'stepUpPct'." }, { status: 400 });
    }
    if ((moraStart !== undefined && !isValidMonth(moraStart)) ||
      (moraDuration !== undefined && !Number.isInteger(moraDuration)) ||
      (moraDuration !== undefined && !isFiniteNumber(moraDuration, 1, MAX_TENURE_MONTHS)) ||
      (moraType !== undefined && moraType !== "interestOnly" && moraType !== "fullHoliday") ||
      (interestMethod !== "monthlyReducing" && interestMethod !== "dailyReducing") ||
      !isValidStartMonth(startYYYYMM)) {
      return NextResponse.json({ error: "Invalid optional schedule settings." }, { status: 400 });
    }

    const prepaymentsMap = parseNumericMap(prepayments, "amount", principal);
    const rateChangesMap = parseNumericMap(rateChanges, "rate", MAX_RATE_PCT);
    if (!prepaymentsMap || !rateChangesMap) {
      return NextResponse.json({ error: "Invalid prepayments or rate changes." }, { status: 400 });
    }

    // Compute standard monthly EMI
    const emi = monthlyEmi(principal, ratePct, tenureMonths);

    // Build baseline schedule (without prepayments)
    const baseline = buildSchedule(
      principal,
      ratePct,
      tenureMonths,
      emi,
      {},
      "reduceTenure",
      rateChangesMap,
      0, // no step-up in baseline
      undefined,
      undefined,
      undefined,
      interestMethod,
      startYYYYMM
    );

    // Build plan schedule (with prepayments/step-up/moratoriums)
    const plan = buildSchedule(
      principal,
      ratePct,
      tenureMonths,
      emi,
      prepaymentsMap,
      prepayBehavior,
      rateChangesMap,
      stepUpPct,
      moraStart,
      moraDuration,
      moraType,
      interestMethod,
      startYYYYMM
    );

    // Compare baseline vs plan
    const comparison = compare(baseline, plan);

    return NextResponse.json({
      success: true,
      inputs: {
        principal,
        ratePct,
        tenureMonths,
        emi,
        prepayBehavior,
        stepUpPct,
        moraStart,
        moraDuration,
        moraType,
        interestMethod,
        startYYYYMM,
      },
      comparison,
      baselineSummary: {
        totalInterest: baseline.totalInterest,
        totalPaid: baseline.totalPaid,
        monthsToPayoff: baseline.monthsToPayoff,
      },
      planSummary: {
        totalInterest: plan.totalInterest,
        totalPaid: plan.totalPaid,
        monthsToPayoff: plan.monthsToPayoff,
      },
      schedule: plan.rows.map((row) => ({
        month: row.month,
        openingBalance: row.opening,
        interestPaid: row.interest,
        principalPaid: row.principalPaid,
        prepayment: row.prepayment,
        emiPaid: row.emi,
        closingBalance: row.closing,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute amortization schedule." }, { status: 500 });
  }
}
