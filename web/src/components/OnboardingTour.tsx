import { useState, useEffect } from "react";
import { trackEvent } from "../engine/analytics";

interface Props {
  onClose?: () => void;
  forceOpen?: boolean;
}

const STEPS = [
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

export function OnboardingTour({ onClose, forceOpen }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("prepayment-ledger-tour-completed");
    if (!completed) {
      setIsOpen(true);
      trackEvent("onboarding_tour_started");
    }
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      trackEvent("onboarding_tour_started_forced");
    }
  }, [forceOpen]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      trackEvent("onboarding_tour_next", { step: currentStep + 1 });
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("prepayment-ledger-tour-completed", "true");
    setIsOpen(false);
    trackEvent("onboarding_tour_completed");
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "360px",
        background: "var(--paper-raised)",
        border: "2px solid var(--emerald)",
        borderRadius: "4px",
        padding: "16px",
        boxShadow: "var(--shadow)",
        zIndex: 999,
        fontFamily: "var(--body)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        animation: "rise 0.3s ease-out"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--emerald)" }}>
          Step {currentStep + 1} of {STEPS.length}
        </span>
        <button
          onClick={handleComplete}
          style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer", fontSize: "0.95rem" }}
          title="Skip Tour"
        >
          ✕
        </button>
      </div>

      <h4 style={{ margin: 0, fontFamily: "var(--display)", fontSize: "1.05rem", fontWeight: "800", color: "var(--ink)" }}>
        {step.title}
      </h4>

      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
        {step.content}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="btn ghost"
          style={{ fontSize: "0.72rem", padding: "4px 8px", opacity: currentStep === 0 ? 0.3 : 1, cursor: currentStep === 0 ? "default" : "pointer" }}
        >
          Back
        </button>
        <div style={{ display: "flex", gap: "4px" }}>
          {STEPS.map((_, i) => (
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
          {currentStep === STEPS.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
