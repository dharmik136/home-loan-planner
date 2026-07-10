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
    title: "1. Configure your loans",
    content: "Add balances, interest rates, tenure, start month, and lender rules in the loan cards. EMIs update as the inputs change.",
  },
  {
    title: "2. Add extra payments",
    content: "Set monthly extras, one-time payments, annual EMIs, or step-up assumptions. The planner compares the payoff effect.",
  },
  {
    title: "3. Review and save",
    content: "Compare payoff curves, view milestones, and save or export the plan when the numbers are ready.",
  },
];

const SCENARIO_STEPS: Record<string, Step[]> = {
  prepayment_optimizer: [
    {
      title: "Prepayment scenario applied",
      content: "The workspace now uses a Rs 45 lakh home loan at 8.25%, an annual extra EMI, a 5% yearly step-up, and a Rs 3 lakh payment in month 24.",
    },
    {
      title: "Review interest and tenure",
      content: "The summary cards show how much interest and time the current assumptions save compared with EMI-only repayment.",
    },
    {
      title: "Adjust the payment timeline",
      content: "Use the loan card presets to compare bi-weekly payments, extra annual EMIs, and step-up payments.",
    },
  ],
  balance_transfer: [
    {
      title: "Balance transfer scenario applied",
      content: "The workspace now uses a Rs 60 lakh loan at 9.1% so you can compare a lower-rate lender after transfer charges.",
    },
    {
      title: "Compare break-even",
      content: "Open the Balance Transfer Advisor to review processing, legal, and valuation charges against the interest saved.",
    },
  ],
  rate_shock: [
    {
      title: "Rate shock scenario applied",
      content: "The workspace now uses a Rs 50 lakh loan at 7.5%, two rate hikes, and a six-month moratorium using daily reducing balance.",
    },
    {
      title: "Review debt load",
      content: "Use the risk tools to review debt-to-income pressure and the EMI buffer needed for rate changes.",
    },
  ],
  tax_optimizer: [
    {
      title: "Tax scenario applied",
      content: "The workspace now uses a Rs 35 lakh home loan at 8.5% for old-regime deduction checks.",
    },
    {
      title: "Compare tax regimes",
      content: "Open the Tax Savings Deductor to compare Section 24 and 80C benefits against the new regime.",
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
      setCurrentStep(-1);
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
          {currentStep === -1 ? "Planner walkthrough" : `Step ${currentStep + 1} of ${activeSteps.length}`}
        </span>
        <button
          onClick={handleComplete}
          style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer", fontSize: "0.95rem" }}
          title="Skip Tour"
        >
          x
        </button>
      </div>

      {currentStep === -1 ? (
        <>
          <div className="double-border-bottom" style={{ borderBottom: "3px double var(--line-strong)", paddingBottom: "6px" }}>
            <h4 style={{ margin: 0, fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: "900", color: "var(--ink)", lineHeight: "1.2" }}>
              Welcome to Loan Plan Workspace
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            Choose a scenario to load sample inputs and review the workflow:
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
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>Prepayment plan</div>
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
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>Balance transfer check</div>
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
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>Rate shock check</div>
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
              <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>Tax deduction check</div>
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
              Start standard 3-step tour
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
