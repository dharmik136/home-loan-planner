import type { LenderRuleset } from "./planning";

export interface RuleContext {
  amount: number;
  monthIndex: number;     // 1-based month the prepayment is applied
  emi: number;            // current EMI for that loan
  openingBalance: number; // balance at the prepayment month (proxy for year-opening)
  ruleset?: LenderRuleset;
  customMinPrepay?: number;
}

export interface RuleVerdict {
  ok: boolean;
  message: string;
}

export const HDFC_MIN_FLOOR = 5_000;
export const HDFC_MAX_ABS = 5_000_000; // ₹50 lakh / month

/** Validate one prepayment against floating-rate part-payment rules. */
export function validatePrepayment(ctx: RuleContext): RuleVerdict {
  if (ctx.amount <= 0) return { ok: true, message: "" };
  if (ctx.amount > ctx.openingBalance) {
    return { ok: false, message: `Above remaining balance (₹${Math.round(ctx.openingBalance).toLocaleString("en-IN")})` };
  }
  
  const ruleset = ctx.ruleset || "hdfc";

  if (ruleset === "none") {
    return { ok: true, message: "Valid · no rules enforced" };
  }

  if (ctx.monthIndex < 2) {
    return { ok: false, message: "Not allowed in month 1 (after 1 EMI only)" };
  }

  if (ruleset === "rbi") {
    if (ctx.amount > ctx.openingBalance) {
      return { ok: false, message: `Above remaining balance (₹${Math.round(ctx.openingBalance).toLocaleString("en-IN")})` };
    }
    return { ok: true, message: "Within RBI rules · zero prepayment penalty" };
  }

  if (ruleset === "custom") {
    const min = ctx.customMinPrepay || 0;
    if (ctx.amount < min) {
      return { ok: false, message: `Below custom minimum (₹${min.toLocaleString("en-IN")})` };
    }
    if (ctx.amount > ctx.openingBalance) {
      return { ok: false, message: `Above remaining balance` };
    }
    return { ok: true, message: "Within custom rules" };
  }

  // Default: HDFC
  const min = Math.max(HDFC_MIN_FLOOR, ctx.emi);
  if (ctx.amount < min) {
    return { ok: false, message: `Below minimum (₹${min.toLocaleString("en-IN")} = 1 EMI or ₹5,000)` };
  }
  const max = Math.min(HDFC_MAX_ABS, 0.75 * ctx.openingBalance);
  if (ctx.amount > max) {
    return { ok: false, message: `Above maximum (₹${Math.round(max).toLocaleString("en-IN")} = 75% of balance / ₹50L)` };
  }
  return { ok: true, message: "Within HDFC rules · no penalty" };
}

export const HDFC_RULES: { rule: string; detail: string }[] = [
  { rule: "Prepayment penalty", detail: "NONE on floating-rate loans — RBI ban from 1 Jan 2026, any amount or source." },
  { rule: "Frequency", detail: "Once per calendar month (up to 12× a year)." },
  { rule: "Minimum", detail: "₹5,000 or 1 EMI — whichever is higher." },
  { rule: "Maximum", detail: "₹50 lakh/month or 75% of year-opening principal — whichever is lower." },
  { rule: "Timing", detail: "Only after the first EMI (not in month 1)." },
  { rule: "Source", detail: "From the repayment-tagged bank account, or a branch visit." },
];
