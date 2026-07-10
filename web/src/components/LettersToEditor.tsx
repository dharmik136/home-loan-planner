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

import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  results: LoanResult[];
}

interface QAResponse {
  question: string;
  answer: string;
}

export function LettersToEditor({ results }: Props) {
  const [query, setQuery] = useState("");
  const [activeQA, setActiveQA] = useState<QAResponse | null>(null);

  if (results.length === 0) return null;

  // Query active loan properties
  const activeLoan = results[0].loan;
  const emi = results[0].emi;
  const rate = activeLoan.ratePct;

  const handlePresetQuestion = (type: "sip" | "moratorium" | "shock" | "reducing") => {
    let q = "";
    let a = "";

    if (type === "sip") {
      q = "Should I prepay my home loan or invest surplus cash in mutual fund SIPs?";
      const isRateHigh = rate >= 8.75;
      a = `Dear Reader, with your active loan rate at ${rate.toFixed(2)}%, the math is a balance of certainty vs. risk. Prepaying your loan yields a guaranteed, tax-free return of ${rate.toFixed(2)}% by avoiding compounding interest. While equity mutual funds can return 12% in the long term, they are subject to market volatility and a 12.5% Long-Term Capital Gains (LTCG) tax. If your interest rate is high (${isRateHigh ? "which it currently is" : "though yours is moderate"}), prepaying is highly recommended to secure immediate risk-free savings. For lower rates, a split strategy (50% prepay, 50% SIP) is ideal.`;
    } else if (type === "moratorium") {
      q = "Dear Editor, how does a moratorium pause affect my long-term debt?";
      a = `Dear Reader, a moratorium is not an interest waiver; it is merely a payment holiday. During a moratorium, interest continues to accrue daily on your outstanding balance. In a "Full Holiday", this accrued interest is capitalized (added back to your principal), causing you to pay interest on interest. For your loan, pausing for 6 months at ${rate.toFixed(2)}% will increase your principal balance, compounding your total interest liability and extending your tenure. Use moratoriums only for emergencies, and always opt for "Interest-Only" payments if possible.`;
    } else if (type === "shock") {
      q = "How do I shield my family against base rate hikes and floating rate shock?";
      a = `Dear Reader, floating-rate home loans are vulnerable to RBI repo rate cycles. A 1.5% hike on your current ₹${(activeLoan.outstanding / 100000).toFixed(1)} Lakh balance can inflate your tenure by 4–5 years or force your monthly EMI to surge. To shield yourself, build a "Rate Shock Buffer" cash reserve equal to 3 months of EMIs (₹${formatINR(emi * 3)}). Additionally, checking "Extra EMI per year" or adding a minor 5% annual step-up prepayment will neutralize any rate hikes the bank throws at you.`;
    } else if (type === "reducing") {
      q = "What is the difference between Monthly Reducing and Daily Reducing interest?";
      a = `Dear Reader, standard monthly reducing loans compute interest once a month on the opening balance. Daily reducing loans (like SBI MaxGain) calculate interest daily on the exact outstanding balance using calendar day counts (31, 30, or 28 days). If you prepay in the middle of a month (e.g. Day 10), a daily reducing method starts saving you interest from Day 11, whereas a monthly reducing method ignores it until the next month. Prepaying frequently makes daily reducing calculators significantly more rewarding!`;
    }

    setActiveQA({ question: q, answer: a });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const lower = query.toLowerCase();
    let reply = "";

    if (lower.includes("sip") || lower.includes("invest") || lower.includes("mutual")) {
      reply = `Dear Reader, regarding investing vs prepaying: your loan interest is ${rate.toFixed(2)}%. A mutual fund SIP yields ~12% but incurs LTCG tax and market risk. Prepaying saves a guaranteed ${rate.toFixed(2)}% risk-free. A balanced approach is to prepay a portion while maintaining a regular equity SIP.`;
    } else if (lower.includes("moratorium") || lower.includes("pause") || lower.includes("holiday")) {
      reply = `Dear Reader, interest accrued during moratorium pauses continues to compound daily on your outstanding loan balance. It is a tool for emergency cash preservation, not cost savings.`;
    } else if (lower.includes("tax") || lower.includes("24") || lower.includes("80c") || lower.includes("regime")) {
      reply = `Dear Reader, home loan interest qualifies for up to ₹2 Lakh deduction under Section 24b, and principal qualifies up to ₹1.5 Lakh under Section 80C. This tax shelter lowers your effective post-tax rate from ${rate.toFixed(2)}% to around ${(rate * 0.7).toFixed(2)}%, depending on your tax bracket (assuming 30% bracket).`;
    } else if (lower.includes("sbi") || lower.includes("hdfc") || lower.includes("maxgain") || lower.includes("daily")) {
      reply = `Dear Reader, daily reducing interest calculates your charge on daily closing balances. It is highly beneficial if you make multiple micro-prepayments throughout the month instead of a single monthly lump sum.`;
    } else if (lower.includes("prepay") || lower.includes("extra") || lower.includes("lump")) {
      reply = `Dear Reader, prepaying early in your loan tenure is mathematically most optimal. Because interest is front-loaded, an extra payment made in Year 2 saves 3x more interest than the exact same payment made in Year 12.`;
    } else {
      reply = `Dear Reader, home loans compound interest monthly on outstanding balances. Prepaying early, choosing tenure reduction over EMI reduction, and maintaining a rate-shock cache are the three pillars of debt freedom. Let amortization math work in your favor!`;
    }

    setActiveQA({ question: query, answer: reply });
    setQuery("");
  };

  return (
    <div className="panel" style={{ marginTop: "16px", borderLeft: "3px solid var(--ink)" }}>
      <div className="panel-title">
         <span className="num">✍️ / Editorial</span>
         Letters to the Editor
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: "12px", lineHeight: "1.4" }}>
        Amortization can be counter-intuitive. Ask the Editor a loan management question below:
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        <button
          onClick={() => handlePresetQuestion("sip")}
          className="btn ghost"
          style={{ fontSize: "0.7rem", padding: "4px 8px" }}
        >
          Prepay vs SIP?
        </button>
        <button
          onClick={() => handlePresetQuestion("moratorium")}
          className="btn ghost"
          style={{ fontSize: "0.7rem", padding: "4px 8px" }}
        >
          Moratorium Costs?
        </button>
        <button
          onClick={() => handlePresetQuestion("shock")}
          className="btn ghost"
          style={{ fontSize: "0.7rem", padding: "4px 8px" }}
        >
          Avoid Rate Shock?
        </button>
        <button
          onClick={() => handlePresetQuestion("reducing")}
          className="btn ghost"
          style={{ fontSize: "0.7rem", padding: "4px 8px" }}
        >
          Daily vs Monthly?
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question (e.g. 'tax deductions', 'daily reducing')..."
          style={{
            flexGrow: 1,
            fontSize: "0.78rem",
            padding: "6px 10px",
            border: "1px solid var(--line-strong)",
            borderRadius: "3px",
            background: "var(--paper)",
            color: "var(--ink)",
            outline: "none"
          }}
        />
        <button type="submit" className="btn" style={{ fontSize: "0.76rem", padding: "6px 12px" }}>
          Ask
        </button>
      </form>

      {activeQA && (
        <div
          className="entry-animated"
          style={{
            background: "var(--paper)",
            border: "1px dashed var(--line-strong)",
            borderRadius: "4px",
            padding: "12px 14px",
            fontFamily: "var(--body)"
          }}
        >
          <div style={{ fontWeight: "700", fontSize: "0.84rem", color: "var(--ink)", marginBottom: "6px", fontStyle: "italic" }}>
            Q: "{activeQA.question}"
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--ink-soft)",
              lineHeight: "1.5",
              textAlign: "justify",
              borderTop: "1px dashed var(--line)",
              paddingTop: "6px",
              whiteSpace: "pre-line"
            }}
          >
            {activeQA.answer}
          </div>
          <div style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--ink-faint)", marginTop: "8px", fontWeight: "700", fontStyle: "italic" }}>
            — The Editor
          </div>
        </div>
      )}
    </div>
  );
}
