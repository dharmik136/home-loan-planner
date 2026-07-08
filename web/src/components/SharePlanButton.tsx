import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";
import { trackEvent } from "../engine/analytics";

interface Props {
  results: LoanResult[];
}

export function SharePlanButton({ results }: Props) {
  const [copied, setCopied] = useState(false);

  if (results.length === 0) return null;

  const totalInterestSaved = results.reduce((sum, r) => sum + r.comparison.interestSaved, 0);
  const totalMonthsSaved = Math.max(...results.map((r) => r.comparison.monthsSaved));
  const loanCount = results.length;

  const buildShareText = () => {
    const lines = [
      `🏠 My Home Loan Prepayment Plan`,
      ``,
      `I'm tracking ${loanCount} loan${loanCount > 1 ? "s" : ""} on Prepayment Ledger:`,
      ...results.map((r) => `  • ${r.loan.name}: ₹${Math.round(r.loan.outstanding / 100_000)}L @ ${r.loan.ratePct}% for ${r.loan.tenureMonths} months`),
      ``,
      `💰 With prepayments I'll save:`,
      `  → ${formatINR(Math.round(totalInterestSaved))} in interest`,
      `  → ${totalMonthsSaved} months off my loan tenure`,
      ``,
      `📊 Try the free calculator: https://prepaymentledger.in`,
    ];
    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackEvent("plan_shared", { method: "copy", loanCount, interestSaved: totalInterestSaved });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
    trackEvent("plan_shared", { method: "whatsapp", loanCount, interestSaved: totalInterestSaved });
  };

  const handleTwitter = () => {
    const tweet = encodeURIComponent(
      `I'm saving ${formatINR(Math.round(totalInterestSaved))} in home loan interest by prepaying strategically 🏠💰\n\nFree calculator: https://prepaymentledger.in #HomeLoan #PersonalFinance`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, "_blank", "noopener");
    trackEvent("plan_shared", { method: "twitter", loanCount });
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
      <button
        className="btn ghost"
        onClick={handleCopy}
        style={{ fontSize: "0.78rem" }}
      >
        {copied ? "✅ Copied!" : "📋 Copy Plan"}
      </button>
      <button
        className="btn ghost"
        onClick={handleWhatsApp}
        style={{ fontSize: "0.78rem", color: "#22c55e", borderColor: "#22c55e" }}
      >
        📱 Share on WhatsApp
      </button>
      <button
        className="btn ghost"
        onClick={handleTwitter}
        style={{ fontSize: "0.78rem", color: "#1d9bf0", borderColor: "#1d9bf0" }}
      >
        🐦 Share on X
      </button>
    </div>
  );
}
