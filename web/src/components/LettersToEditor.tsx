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
      a = `Your active loan rate is ${rate.toFixed(2)}%. Prepaying gives a certain benefit equal to avoided interest, while SIP returns are uncertain and taxable. Since this rate is ${isRateHigh ? "on the higher side" : "moderate"}, compare a split plan against full prepayment before deciding.`;
    } else if (type === "moratorium") {
      q = "How does a moratorium pause affect the long-term loan cost?";
      a = `A moratorium pauses payment; it usually does not waive interest. During the pause, interest continues to accrue on the outstanding balance. If unpaid interest is capitalized, the principal increases and the tenure can extend. Use the moratorium fields only for genuine cash-flow stress testing.`;
    } else if (type === "shock") {
      q = "How do I prepare for base-rate hikes on a floating-rate loan?";
      a = `A 1.5% rate increase on the current Rs ${(activeLoan.outstanding / 100000).toFixed(1)} lakh balance can increase tenure or EMI pressure. As a planning buffer, keep at least three EMIs (${formatINR(emi * 3)}) available and test the effect of an annual extra EMI or step-up payment.`;
    } else if (type === "reducing") {
      q = "What is the difference between Monthly Reducing and Daily Reducing interest?";
      a = `Monthly reducing loans calculate interest on the monthly opening balance. Daily reducing loans calculate interest on each day's outstanding balance. If a prepayment is made mid-month, a daily reducing method reflects the lower balance sooner.`;
    }

    setActiveQA({ question: q, answer: a });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const lower = query.toLowerCase();
    let reply = "";

    if (lower.includes("sip") || lower.includes("invest") || lower.includes("mutual")) {
      reply = `Your loan rate is ${rate.toFixed(2)}%. Prepayment gives a certain avoided-interest benefit. SIP returns are uncertain and taxable, so compare full prepayment with a split plan.`;
    } else if (lower.includes("moratorium") || lower.includes("pause") || lower.includes("holiday")) {
      reply = `Interest during a moratorium can continue to accrue and may be capitalized. Treat it as an emergency liquidity tool, not a cost-saving method.`;
    } else if (lower.includes("tax") || lower.includes("24") || lower.includes("80c") || lower.includes("regime")) {
      reply = `Under the old regime, home loan interest can qualify under Section 24 and principal can qualify under Section 80C, subject to limits and eligibility. Use the tax panel to estimate the post-tax effect for your income inputs.`;
    } else if (lower.includes("sbi") || lower.includes("hdfc") || lower.includes("maxgain") || lower.includes("daily")) {
      reply = `Daily reducing interest uses daily closing balances. Frequent payments can reflect sooner than in a monthly reducing method, depending on lender processing rules.`;
    } else if (lower.includes("prepay") || lower.includes("extra") || lower.includes("lump")) {
      reply = `Earlier prepayments usually save more interest because the outstanding balance is higher in the early years. Compare payment month options in the windfall tool.`;
    } else {
      reply = `Home loan interest is driven by outstanding balance, rate, and time. Test payment timing, tenure reduction, and rate changes before making a decision.`;
    }

    setActiveQA({ question: query, answer: reply });
    setQuery("");
  };

  return (
    <div className="panel" style={{ marginTop: "16px", borderLeft: "3px solid var(--ink)" }}>
      <div className="panel-title">
         <span className="num">Guidance</span>
         Loan planning Q&amp;A
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: "12px", lineHeight: "1.4" }}>
        Ask a loan-management question or use a preset topic:
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
        </div>
      )}
    </div>
  );
}
