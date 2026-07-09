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

import { useState, useEffect } from "react";
import { trackEvent } from "../engine/analytics";

interface Props {
  onClose?: () => void;
  forceOpen?: boolean;
  onApplyScenario?: (scenario: string) => void;
}

interface Step {
  title: string;
  content: string;
}

const DEFAULT_STEPS: Step[] = [
  {
    title: "📋 1. Configure Your Loans",
    content: "Add, name, and edit your outstanding principal balances, interest rates, and loan age in the left sidebar cards. Watch your EMIs update instantly.",
  },
  {
    title: "💸 2. Plan Surplus Prepayments",
    content: "Set a regular monthly extra budget or configure one-time windfalls (like bonuses or ITR refunds). The engine automatically channels funds to optimize savings.",
  },
  {
    title: "📈 3. Track Payoff & Save Report",
    content: "Compare Avalanche vs. Snowball payoff curves, view crossover milestones, and hit 'Save Plan & Get PDF' to export your customized blueprint.",
  },
];

const SCENARIO_STEPS: Record<string, Step[]> = {
  prepayment_optimizer: [
    {
      title: "⚡ Prepayment Optimizer Scenario Applied!",
      content: "We configured a ₹45 Lakh Home Loan at 8.25% outstanding, set a 13th EMI prepayment every year, a 5% yearly step-up EMI, and a ₹3 Lakh one-time prepayment in Month 24. Let's see the math in action!",
    },
    {
      title: "📈 Interest & Tenure Saved!",
      content: "Look at the Summary Cards at the top of the dashboard. This prepayment plan saves you over ₹24 Lakhs in interest and shaves off more than 8 years of your life in debt. You pay off in 11.9 years instead of 20!",
    },
    {
      title: "🗓️ Custom Prepayment Timeline",
      content: "Look at the Loan Card prepayment preset checkboxes. Bi-weekly payments or extra annual EMIs keep your monthly EMI steady while compounding interest savings heavily in your favor.",
    },
  ],
  balance_transfer: [
    {
      title: "🔄 Balance Transfer Scenario Applied!",
      content: "We loaded a high-interest ₹60 Lakh loan at 9.1% interest. Let's evaluate if transferring it to a lower-interest lender (8.25%) is worth the transfer charges.",
    },
    {
      title: "📊 Compare Lender Offers & Break-Even",
      content: "Scroll down to the Balance Transfer Advisor. We have itemized the Processing fees, Legal charges, and Valuation fees. The stacked bar displays what portion of your remaining tenure goes toward paying back these upfront fees vs saving interest. Your break-even occurs in Month 8!",
    },
  ],
  rate_shock: [
    {
      title: "⚠️ Rate Hikes & Moratorium Scenario Applied!",
      content: "We set up a ₹50 Lakh loan at 7.5% outstanding. We simulated two rate hikes (+0.75% in Year 1 and +0.75% in Year 2) and a 6-month moratorium starting in Month 36 using Daily Reducing Balance.",
    },
    {
      title: "🛡️ DTI Risk Audit",
      content: "Check the Risk Audit panel. Your Debt-to-Income (DTI) ratio is calculated live. In the event of base rate shock hikes, the panel advises you on the exact emergency cache buffer size to maintain.",
    },
  ],
  tax_optimizer: [
    {
      title: "🛡️ Tax Optimization Scenario Applied!",
      content: "We set up a ₹35 Lakh home loan at 8.5% interest rate to check tax-saving structures under Indian tax laws.",
    },
    {
      title: "💰 Old vs New Regime Savings",
      content: "Scroll to the Tax Savings Deductor. Enter your income bracket and check the old regime Sec 24b (₹2 Lakh interest cap) and Sec 80C principal deduction benefits compared to the zero-deduction New Regime. Your post-tax effective interest rate drops to 6.35%!",
    },
  ],
};

export function OnboardingTour({ onClose, forceOpen, onApplyScenario }: Props) {
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 = Persona selection page
  const [selectedPersona, setSelectedPersona] = useState<string>("default");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("prepayment-ledger-tour-completed");
    if (!completed) {
      setIsOpen(true);
      setCurrentStep(-1);
      trackEvent("onboarding_tour_started");
    }
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(-1);
      setSelectedPersona("default");
      trackEvent("onboarding_tour_started_forced");
    }
  }, [forceOpen]);

  const activeSteps = selectedPersona === "default" ? DEFAULT_STEPS : (SCENARIO_STEPS[selectedPersona] || DEFAULT_STEPS);

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      trackEvent("onboarding_tour_next", { persona: selectedPersona, step: currentStep + 1 });
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectPersona = (persona: string) => {
    setSelectedPersona(persona);
    if (persona !== "default" && onApplyScenario) {
      onApplyScenario(persona);
    }
    setCurrentStep(0);
    trackEvent("onboarding_persona_selected", { persona });
  };

  const handleComplete = () => {
    localStorage.setItem("prepayment-ledger-tour-completed", "true");
    setIsOpen(false);
    trackEvent("onboarding_tour_completed", { persona: selectedPersona });
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="panel"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "380px",
        maxHeight: "85vh",
        overflowY: "auto",
        background: "var(--paper-raised)",
        border: "2px solid var(--emerald)",
        borderRadius: "4px",
        padding: "20px",
        boxShadow: "var(--shadow)",
        zIndex: 999,
        fontFamily: "var(--body)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        animation: "rise 0.3s ease-out"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--emerald)" }}>
          {currentStep === -1 ? "Ledger Walkthrough Tour" : `Step ${currentStep + 1} of ${activeSteps.length}`}
        </span>
        <button
          onClick={handleComplete}
          style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer", fontSize: "0.95rem" }}
          title="Skip Tour"
        >
          ✕
        </button>
      </div>

      {currentStep === -1 ? (
        <>
          <div className="double-border-bottom" style={{ borderBottom: "3px double var(--line-strong)", paddingBottom: "6px" }}>
            <h4 style={{ margin: 0, fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: "900", color: "var(--ink)", lineHeight: "1.2" }}>
              Welcome to the Prepayment Ledger
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            Choose a guided financial scenario to immediately see how the math optimization handles your specific home loan needs:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <button
              onClick={() => handleSelectPersona("prepayment_optimizer")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                border: "1px solid var(--line-strong)",
                background: "var(--paper)",
                borderRadius: "3px",
                cursor: "pointer",
                fontFamily: "var(--body)",
                color: "var(--ink)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--emerald)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
            >
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>⚡ The Prepayment Optimizer</div>
              <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Walk through step-up EMIs, 13th EMIs, and windfall bonuses.</div>
            </button>

            <button
              onClick={() => handleSelectPersona("balance_transfer")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                border: "1px solid var(--line-strong)",
                background: "var(--paper)",
                borderRadius: "3px",
                cursor: "pointer",
                fontFamily: "var(--body)",
                color: "var(--ink)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--emerald)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
            >
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>🔄 The Balance Transfer Seeker</div>
              <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Calculate fee-adjusted break-even terms for moving lenders.</div>
            </button>

            <button
              onClick={() => handleSelectPersona("rate_shock")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                border: "1px solid var(--line-strong)",
                background: "var(--paper)",
                borderRadius: "3px",
                cursor: "pointer",
                fontFamily: "var(--body)",
                color: "var(--ink)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--emerald)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
            >
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>⚠️ The Rate Shock Planner</div>
              <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Simulate floating rate adjustments, moratoriums, and buffers.</div>
            </button>

            <button
              onClick={() => handleSelectPersona("tax_optimizer")}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                border: "1px solid var(--line-strong)",
                background: "var(--paper)",
                borderRadius: "3px",
                cursor: "pointer",
                fontFamily: "var(--body)",
                color: "var(--ink)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--emerald)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
            >
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>🛡️ The Tax Savings Optimizer</div>
              <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Compare tax savings under Old Regime Sec 24b vs New Regime.</div>
            </button>

            <button
              onClick={() => handleSelectPersona("default")}
              style={{
                textAlign: "center",
                padding: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--body)",
                fontSize: "0.78rem",
                color: "var(--ink-soft)",
                textDecoration: "underline"
              }}
            >
              Or start standard 3-step feature tour
            </button>
          </div>
        </>
      ) : (
        <>
          <h4 style={{ margin: 0, fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: "900", color: "var(--ink)", borderBottom: "1px dashed var(--line-strong)", paddingBottom: "6px" }}>
            {activeSteps[currentStep].title}
          </h4>

          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            {activeSteps[currentStep].content}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <button
              onClick={handlePrev}
              className="btn ghost"
              style={{ fontSize: "0.72rem", padding: "4px 8px", cursor: "pointer" }}
            >
              Back
            </button>
            <div style={{ display: "flex", gap: "4px" }}>
              {activeSteps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: i === currentStep ? "var(--emerald)" : "var(--line)"
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="btn"
              style={{ fontSize: "0.72rem", padding: "6px 12px" }}
            >
              {currentStep === activeSteps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
