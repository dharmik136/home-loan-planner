import { useState, useEffect, useRef } from "react";
import { trackEvent } from "../engine/analytics";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (email: string, newsletter: boolean) => void;
}

export function PaywallModal({ isOpen, onClose, onCapture }: Props) {
  const [email, setEmail] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  // Click outside to dismiss
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    trackEvent("email_lead_captured", { email, newsletter: newsletterOptIn });
    onCapture(email, newsletterOptIn);
    setSubmitted(true);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="native-modal-dialog"
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line-strong)",
        borderRadius: "4px",
        width: "90%",
        maxWidth: "450px",
        padding: "24px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        position: "relative",
        outline: "none"
      }}
    >
      <button
        className="modal-close"
        onClick={onClose}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "none",
          border: "none",
          color: "var(--ink-faint)",
          fontSize: "1.2rem",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "8px", color: "var(--ink)" }}>
            📄 Save Plan & Download PDF (100% Free)
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "20px", lineHeight: "1.4" }}>
            Enter your email to save your debt-free timeline and generate a printable PDF payoff report.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "10px", fontSize: "0.84rem", alignItems: "flex-start" }}>
              <span>📋</span>
              <span><b>Printable Payoff Schedule</b>: Get a step-by-step month-by-month guide.</span>
            </div>
            <div style={{ display: "flex", gap: "10px", fontSize: "0.84rem", alignItems: "flex-start" }}>
              <span>💾</span>
              <span><b>Cloud Portfolio Save</b>: Re-access your configured loans anytime without re-typing.</span>
            </div>
            <div style={{ display: "flex", gap: "10px", fontSize: "0.84rem", alignItems: "flex-start" }}>
              <span>🎓</span>
              <span><b>Prepayment Hacks</b>: Receive occasional, verified interest-saving tips and calculator updates.</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <label style={{ fontSize: "0.74rem", color: "var(--ink-soft)", fontWeight: "600" }}>Your Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                fontFamily: "var(--body)",
                fontSize: "0.88rem",
                padding: "8px 10px",
                border: "1px solid var(--line-strong)",
                borderRadius: "2px",
                outline: "none",
                background: "var(--paper)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <input
              type="checkbox"
              id="newsletter"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="newsletter" style={{ fontSize: "0.76rem", color: "var(--ink-soft)", cursor: "pointer", userSelect: "none" }}>
              Sign me up for the Free Debt-Free newsletter (monthly tips).
            </label>
          </div>

          <button
            type="submit"
            className="add-btn"
            style={{ width: "100%", padding: "10px", fontSize: "0.88rem", height: "auto" }}
          >
            Generate My Free PDF Blueprint
          </button>

          <span style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-faint)", textAlign: "center", marginTop: "12px" }}>
            We respect your privacy. No spam. No selling your email.
          </span>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <span style={{ fontSize: "2.4rem" }}>✉️</span>
          <h3 style={{ fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: "bold", marginTop: "12px", marginBottom: "8px", color: "var(--ink)" }}>
            Check Your Inbox!
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "20px", lineHeight: "1.4" }}>
            We have saved your plan portfolio and sent your customized PDF payoff schedule to <b>{email}</b>.
          </p>
          <p style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginBottom: "20px", lineHeight: "1.4" }}>
            (Note: In this client-only offline MVP demo, check console logs to verify that the lead data was logged successfully).
          </p>
          <button
            onClick={onClose}
            className="add-btn secondary"
            style={{ width: "100%", padding: "8px", fontSize: "0.82rem", height: "auto" }}
          >
            Return to Planner
          </button>
        </div>
      )}
    </dialog>
  );
}
