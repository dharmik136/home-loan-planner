import { useState } from "react";
import type { LoanResult } from "../engine/planning";

interface Props {
  results: LoanResult[];
}

const TIPS = [
  { trigger: "highRate", text: "Your interest rate is above 9%. Even a 0.25% reduction via balance transfer could save lakhs over tenure." },
  { trigger: "lowPrepay", text: "You have no prepayments configured. Adding even ₹5,000/month from Month 1 can save 2–3 years." },
  { trigger: "longTenure", text: "Tenure above 20 years means you'll pay more interest than principal. Front-load your EMIs in years 1–5 to dramatically cut total cost." },
  { trigger: "multiLoan", text: "With multiple loans, use the Avalanche strategy — clear the highest interest rate loan first to minimize total interest." },
  { trigger: "emiTooHigh", text: "Your combined EMI exceeds 40% of a typical income. Consider a windfall prepayment to reduce your monthly obligation." },
  { trigger: "goodSaver", text: "You're on track to save significant interest! Consider using the saved EMI budget to build an emergency fund (6 months of expenses)." },
  { trigger: "taxOptimize", text: "Don't forget Section 24b: claim up to ₹2L of home loan interest as a tax deduction. This lowers your effective interest cost." },
  { trigger: "balanceTransfer", text: "If your existing loan rate is 1%+ above current market rate, a balance transfer to a new lender could be worth exploring." },
];

export function SmartTipsPanel({ results }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (results.length === 0) return null;

  const totalInterestSaved = results.reduce((s, r) => s + r.comparison.interestSaved, 0);
  const avgRate = results.reduce((s, r) => s + r.loan.ratePct, 0) / results.length;
  const hasPrepay = results.some((r) => r.plan.rows.some((row) => row.prepayment > 0));
  const maxTenure = Math.max(...results.map((r) => r.loan.tenureMonths));
  const totalEmi = results.reduce((s, r) => s + r.emi, 0);

  const activeTips = TIPS.filter((tip) => {
    if (dismissed.has(tip.trigger)) return false;
    switch (tip.trigger) {
      case "highRate": return avgRate > 9.0;
      case "lowPrepay": return !hasPrepay;
      case "longTenure": return maxTenure > 240;
      case "multiLoan": return results.length >= 2;
      case "emiTooHigh": return totalEmi > 60_000;
      case "goodSaver": return totalInterestSaved > 200_000;
      case "taxOptimize": return results.some((r) => r.loan.ratePct > 0);
      case "balanceTransfer": return avgRate > 9.5;
      default: return false;
    }
  });

  if (activeTips.length === 0) return null;

  return (
    <div className="panel" style={{ marginTop: "16px", borderLeft: "3px solid var(--gold)" }}>
      <div className="panel-title">
        <span className="num">💡 / Insights</span>
        Smart Tips for You ({activeTips.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {activeTips.map((tip) => (
          <div key={tip.trigger} style={{
            background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px",
            padding: "9px 10px", fontSize: "0.78rem", lineHeight: "1.45",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px"
          }}>
            <span>💡 {tip.text}</span>
            <button
              onClick={() => setDismissed(new Set([...dismissed, tip.trigger]))}
              style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer", fontSize: "0.8rem", flexShrink: 0, padding: "0 2px" }}
              title="Dismiss"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
