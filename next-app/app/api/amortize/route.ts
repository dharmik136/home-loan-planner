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
import { buildSchedule, compare, monthlyEmi } from "../engine/amortization";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
    } = body;

    // Validate required fields
    if (typeof principal !== "number" || principal <= 0) {
      return NextResponse.json({ error: "Invalid or missing 'principal'. Must be a positive number." }, { status: 400 });
    }
    if (typeof ratePct !== "number" || ratePct < 0) {
      return NextResponse.json({ error: "Invalid or missing 'ratePct'. Must be a non-negative number." }, { status: 400 });
    }
    if (typeof tenureMonths !== "number" || tenureMonths <= 0) {
      return NextResponse.json({ error: "Invalid or missing 'tenureMonths'. Must be a positive number." }, { status: 400 });
    }

    // Standardize prepayments record
    const prepaymentsMap: Record<number, number> = {};
    if (Array.isArray(prepayments)) {
      prepayments.forEach((p: { month: number; amount: number }) => {
        if (typeof p.month === "number" && typeof p.amount === "number") {
          prepaymentsMap[p.month] = p.amount;
        }
      });
    } else if (typeof prepayments === "object" && prepayments !== null) {
      Object.entries(prepayments).forEach(([k, v]) => {
        const monthNum = parseInt(k);
        if (!isNaN(monthNum) && typeof v === "number") {
          prepaymentsMap[monthNum] = v;
        }
      });
    }

    // Standardize rateChanges record
    const rateChangesMap: Record<number, number> = {};
    if (Array.isArray(rateChanges)) {
      rateChanges.forEach((rc: { month: number; rate: number }) => {
        if (typeof rc.month === "number" && typeof rc.rate === "number") {
          rateChangesMap[rc.month] = rc.rate;
        }
      });
    } else if (typeof rateChanges === "object" && rateChanges !== null) {
      Object.entries(rateChanges).forEach(([k, v]) => {
        const monthNum = parseInt(k);
        if (!isNaN(monthNum) && typeof v === "number") {
          rateChangesMap[monthNum] = v;
        }
      });
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
