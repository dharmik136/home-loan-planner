# Home Loan Prepayment Planner
# Copyright (C) 2026 Dharmik Shingala
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

"""Home loan amortization core — reducing-balance, monthly compounding.

Pure functions, no I/O. The Excel generator and any future UI both build on this.
Tenure-reduction model: prepayments keep the EMI constant and shorten the loan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field


def monthly_emi(principal: float, annual_rate_pct: float, months: int) -> float:
    """Standard EMI for a reducing-balance loan.

    Rounded UP to whole rupees, as Indian banks do, so the loan closes within
    the sanctioned tenure rather than spilling into an extra residual month.
    """
    r = annual_rate_pct / 100 / 12
    if r == 0:
        return math.ceil(principal / months)
    factor = (1 + r) ** months
    return math.ceil(principal * r * factor / (factor - 1))


@dataclass
class MonthRow:
    month: int            # 1-based month index
    opening: float
    emi: float
    interest: float
    principal_paid: float
    prepayment: float
    closing: float


@dataclass
class ScheduleResult:
    rows: list[MonthRow] = field(default_factory=list)
    total_interest: float = 0.0
    total_paid: float = 0.0
    months_to_payoff: int = 0

    def summary(self) -> dict:
        return {
            "total_interest": round(self.total_interest),
            "total_paid": round(self.total_paid),
            "months_to_payoff": self.months_to_payoff,
        }


def build_schedule(
    principal: float,
    annual_rate_pct: float,
    months: int,
    emi: float | None = None,
    prepayments: dict[int, float] | None = None,
) -> ScheduleResult:
    """Build a month-by-month amortization schedule.

    prepayments: {month_index: extra_amount} applied AFTER the EMI in that month,
    reducing the closing balance (tenure-reduction model — EMI stays fixed).
    The loan ends early once the balance hits zero.
    """
    prepayments = prepayments or {}
    if emi is None:
        emi = monthly_emi(principal, annual_rate_pct, months)
    r = annual_rate_pct / 100 / 12

    result = ScheduleResult()
    balance = principal
    m = 0
    # Cap iterations at the original term; tenure reduction only shortens it.
    while balance > 0.005 and m < months:
        m += 1
        opening = balance
        interest = opening * r
        # Final EMI may be smaller than the standard EMI.
        payment = min(emi, opening + interest)
        principal_paid = payment - interest
        balance = opening - principal_paid

        prepay = min(prepayments.get(m, 0.0), balance)
        balance -= prepay

        result.rows.append(
            MonthRow(m, round(opening, 2), round(payment, 2), round(interest, 2),
                     round(principal_paid, 2), round(prepay, 2), round(balance, 2))
        )
        result.total_interest += interest
        result.total_paid += payment + prepay

    result.months_to_payoff = m
    return result


def compare(baseline: ScheduleResult, plan: ScheduleResult) -> dict:
    """Baseline vs with-prepayment headline numbers."""
    return {
        "interest_saved": round(baseline.total_interest - plan.total_interest),
        "months_saved": baseline.months_to_payoff - plan.months_to_payoff,
        "baseline_interest": round(baseline.total_interest),
        "plan_interest": round(plan.total_interest),
        "baseline_months": baseline.months_to_payoff,
        "plan_months": plan.months_to_payoff,
    }
