"""Tests for the amortization core. Verified against independent calculation."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from amortization import monthly_emi, build_schedule, compare  # noqa: E402


def test_emi_30L_known_value():
    # 30,00,000 @ 7.5% for 180 months: exact 27,810.37, rounded UP -> 27,811
    assert monthly_emi(3_000_000, 7.5, 180) == 27811


def test_emi_50L_known_value():
    # 50,00,000 @ 7.5% for 180 months
    assert monthly_emi(5_000_000, 7.5, 180) == 46351


def test_zero_rate_emi():
    assert monthly_emi(120_000, 0, 12) == 10_000


def test_schedule_pays_off_in_full_term_no_prepay():
    s = build_schedule(3_000_000, 7.5, 180)
    assert s.months_to_payoff == 180
    assert s.rows[-1].closing == 0.0


def test_total_paid_equals_principal_plus_interest():
    s = build_schedule(3_000_000, 7.5, 180)
    # Sum of all payments should equal principal + total interest, to the rupee.
    assert round(s.total_paid) == round(3_000_000 + s.total_interest)


def test_interest_is_positive_and_large():
    s = build_schedule(3_000_000, 7.5, 180)
    # A 15-yr loan at 7.5% costs a substantial amount of interest.
    assert 2_000_000 < s.total_interest < 2_100_000


def test_prepayment_shortens_tenure_and_saves_interest():
    baseline = build_schedule(3_000_000, 7.5, 180)
    # A 5L lump sum in month 12.
    plan = build_schedule(3_000_000, 7.5, 180, prepayments={12: 500_000})
    c = compare(baseline, plan)
    assert c["months_saved"] > 0
    assert c["interest_saved"] > 0
    assert plan.months_to_payoff < 180


def test_early_prepayment_saves_more_than_late():
    base = build_schedule(3_000_000, 7.5, 180)
    early = build_schedule(3_000_000, 7.5, 180, prepayments={6: 300_000})
    late = build_schedule(3_000_000, 7.5, 180, prepayments={120: 300_000})
    saved_early = compare(base, early)["interest_saved"]
    saved_late = compare(base, late)["interest_saved"]
    assert saved_early > saved_late


def test_prepayment_capped_at_balance():
    # Huge prepayment closes the loan, never goes negative.
    plan = build_schedule(3_000_000, 7.5, 180, prepayments={2: 10_000_000})
    assert plan.rows[-1].closing == 0.0
    assert plan.months_to_payoff == 2


def test_larger_balance_saves_more_for_same_prepayment():
    # Same prepayment on the 50L loan saves more interest than on the 30L loan.
    base_a = build_schedule(3_000_000, 7.5, 180)
    plan_a = build_schedule(3_000_000, 7.5, 180, prepayments={12: 200_000})
    base_b = build_schedule(5_000_000, 7.5, 180)
    plan_b = build_schedule(5_000_000, 7.5, 180, prepayments={12: 200_000})
    assert compare(base_b, plan_b)["interest_saved"] > compare(base_a, plan_a)["interest_saved"]
