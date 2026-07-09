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

"""Verify the live workbook's FORMULAS by recalculating it with the `formulas`
engine and comparing key outputs against the tested amortization core.

This catches formula bugs that openpyxl cannot (openpyxl writes formulas but
never evaluates them).
"""
from __future__ import annotations

import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(__file__))

import formulas  # noqa: E402
from amortization import build_schedule, compare  # noqa: E402

HERE = os.path.dirname(__file__)
WB = os.path.abspath(os.path.join(HERE, "..", "Home-Loan-Prepayment-Planner.xlsx"))


def calc(path):
    xl = formulas.ExcelModel().loads(path).finish()
    sol = xl.calculate()
    out = {}
    for k, v in sol.items():
        key = k.upper().split("!")[-1].replace("'", "")
        try:
            val = v.value[0, 0]
        except Exception:
            try:
                val = v.value[0][0]
            except Exception:
                val = v.value
        sheet = k.upper().split("!")[0].replace("'", "")
        sheet = re.sub(r"\[.*?\]", "", sheet).strip().upper()   # drop any [workbook.xlsx] prefix
        out[(sheet, key)] = val
    return out


def get(sol, sheet, cell):
    return sol[(sheet.upper(), cell.upper())]


def approx(a, b, tol=1.0):
    return abs(float(a) - float(b)) <= tol


def main():
    sol = calc(WB)
    fails = []

    # 1. EMIs match core
    emi_a = get(sol, "INPUTS", "B7")
    emi_b = get(sol, "INPUTS", "C7")
    from amortization import monthly_emi
    if not approx(emi_a, monthly_emi(3_500_000, 7.25, 180), 0):
        fails.append(f"EMI A {emi_a} != {monthly_emi(3_000_000,7.5,180)}")
    if not approx(emi_b, monthly_emi(5_000_000, 7.5, 180), 0):
        fails.append(f"EMI B {emi_b} != {monthly_emi(5_000_000,7.5,180)}")

    # 2. Baseline total interest (Summary B7 / C7) match core (no prepay)
    core_a = build_schedule(3_500_000, 7.25, 180)
    core_b = build_schedule(5_000_000, 7.5, 180)
    sum_base_a = get(sol, "SUMMARY", "B6")
    sum_base_b = get(sol, "SUMMARY", "C6")
    if not approx(sum_base_a, core_a.total_interest, 5):
        fails.append(f"Baseline interest A {sum_base_a} != core {core_a.total_interest:.2f}")
    if not approx(sum_base_b, core_b.total_interest, 5):
        fails.append(f"Baseline interest B {sum_base_b} != core {core_b.total_interest:.2f}")

    # 2b. Plan interest with no prepay must equal baseline (proves plan chain works)
    plan_base_a = get(sol, "SUMMARY", "B7")
    if not approx(plan_base_a, core_a.total_interest, 5):
        fails.append(f"Plan interest A (no prepay) {plan_base_a} != baseline {core_a.total_interest:.2f}")

    # 3. Baseline payoff months == 180
    if int(get(sol, "SUMMARY", "B9")) != 180:
        fails.append(f"Baseline months A = {get(sol,'SUMMARY','B9')} != 180")

    # 4. With NO prepay typed, plan==baseline so interest saved == 0
    if not approx(get(sol, "SUMMARY", "B8"), 0, 1):
        fails.append(f"Interest saved A should be 0 with no prepay, got {get(sol,'SUMMARY','B8')}")

    # 5. Windfall block: default 5,00,000 @ month 12 on each loan, vs core
    wf_a_core = compare(core_a, build_schedule(3_500_000, 7.25, 180, prepayments={12: 500_000}))
    wf_b_core = compare(core_b, build_schedule(5_000_000, 7.5, 180, prepayments={12: 500_000}))
    wf_a_saved = get(sol, "WINDFALL WHAT-IF", "B6")
    wf_b_saved = get(sol, "WINDFALL WHAT-IF", "B8")
    if not approx(wf_a_saved, wf_a_core["interest_saved"], 50):
        fails.append(f"Windfall A interest saved {wf_a_saved} != core {wf_a_core['interest_saved']}")
    if not approx(wf_b_saved, wf_b_core["interest_saved"], 50):
        fails.append(f"Windfall B interest saved {wf_b_saved} != core {wf_b_core['interest_saved']}")
    wf_a_months = get(sol, "WINDFALL WHAT-IF", "B7")
    if int(wf_a_months) != wf_a_core["months_saved"]:
        fails.append(f"Windfall A months saved {wf_a_months} != core {wf_a_core['months_saved']}")

    # 6. End-to-end PLAN path: type a prepay into Schedule_A's yellow column and
    #    confirm the Summary's interest-saved matches the core. Month 12 -> row 14.
    import openpyxl
    import tempfile
    wb = openpyxl.load_workbook(WB)
    wb["Schedule_A"]["H14"] = 500_000   # month 12 prepayment
    tmp = os.path.join(tempfile.gettempdir(), "verify_plan.xlsx")
    wb.save(tmp)
    sol2 = calc(tmp)
    plan_saved_a = get(sol2, "SUMMARY", "B8")
    plan_months_a = get(sol2, "SUMMARY", "B11")
    plan_core = compare(core_a, build_schedule(3_500_000, 7.25, 180, prepayments={12: 500_000}))
    if not approx(plan_saved_a, plan_core["interest_saved"], 50):
        fails.append(f"PLAN-column interest saved {plan_saved_a} != core {plan_core['interest_saved']}")
    if int(plan_months_a) != plan_core["months_saved"]:
        fails.append(f"PLAN-column months saved {plan_months_a} != core {plan_core['months_saved']}")

    print("=== VERIFICATION ===")
    print(f"EMI A:                 {float(emi_a):,.0f}   (core {monthly_emi(3_500_000, 7.25, 180):,})")
    print(f"EMI B:                 {float(emi_b):,.0f}   (core {monthly_emi(5_000_000, 7.5, 180):,})")
    print(f"Baseline interest A:   {float(sum_base_a):,.0f}   (core {core_a.total_interest:,.0f})")
    print(f"Baseline interest B:   {float(sum_base_b):,.0f}   (core {core_b.total_interest:,.0f})")
    print(f"Plan interest A (no prepay): {float(get(sol,'SUMMARY','B7')):,.0f}   (should equal baseline)")
    print(f"Baseline payoff A:     {int(get(sol,'SUMMARY','B9'))} months")
    print(f"Windfall 5L@m12 on A:  saves Rs {float(wf_a_saved):,.0f} interest, "
          f"{int(wf_a_months)} months  (core {wf_a_core['interest_saved']:,}, {wf_a_core['months_saved']})")
    print(f"Windfall 5L@m12 on B:  saves Rs {float(wf_b_saved):,.0f} interest  "
          f"(core {wf_b_core['interest_saved']:,})")
    print(f"PLAN col 5L@m12 on A:  saves Rs {float(plan_saved_a):,.0f} interest, "
          f"{int(plan_months_a)} months  (core {plan_core['interest_saved']:,}, {plan_core['months_saved']})")
    if fails:
        print("\nFAILURES:")
        for f in fails:
            print("  -", f)
        sys.exit(1)
    print("\nALL FORMULA CHECKS PASSED - live workbook matches the tested engine.")


if __name__ == "__main__":
    main()
