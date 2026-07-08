import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Randomly assign a test price (₹299, ₹499, or ₹999) for this user session to test price sensitivity
  const testPrice = useMemo(() => {
    const prices = [299, 499, 999];
    return prices[Math.floor(Math.random() * prices.length)];
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    // In a live server-side app, this would send the email and testPrice to a database (e.g. Supabase)
    console.log(`[PAYWALL CONVERSION] Email: ${email}, Price Point: ₹${testPrice}`);
    setSubmitted(true);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line-strong)",
          borderRadius: "4px",
          width: "90%",
          maxWidth: "450px",
          padding: "24px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
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
            <h3 style={{ fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px", color: "var(--ink)" }}>
              👑 Upgrade to Premium Ledger
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "20px", lineHeight: "1.4" }}>
              Unlock professional debt payoff planning tools to secure your financial freedom.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.84rem" }}>
                <span>📄</span>
                <span><b>Download Branded PDF Reports</b> to print, share, or save offline.</span>
              </div>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.84rem" }}>
                <span>💾</span>
                <span><b>Save Unlimited Debt Portfolios</b> to compare different prepayment strategies.</span>
              </div>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.84rem" }}>
                <span>🚀</span>
                <span><b>Advanced Rollover Optimizer</b> with customizable tax-deduction adjustments.</span>
              </div>
            </div>

            <div style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: "12px 14px", borderRadius: "3px", textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                Special Launch Pricing
              </span>
              <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--emerald)", fontFamily: "var(--display)" }}>
                {formatINR(testPrice)}
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                One-time payment · Lifetime access
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.74rem", color: "var(--ink-soft)", fontWeight: "600" }}>Email address</label>
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

            <button
              type="submit"
              className="add-btn"
              style={{ width: "100%", marginTop: "16px", padding: "10px", fontSize: "0.88rem", height: "auto" }}
            >
              Get Premium Access
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <span style={{ fontSize: "2.4rem" }}>🎉</span>
            <h3 style={{ fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: "bold", marginTop: "12px", marginBottom: "8px", color: "var(--ink)" }}>
              Thank You!
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "20px", lineHeight: "1.4" }}>
              We have registered your interest for the <b>Premium Plan</b> at the <b>{formatINR(testPrice)}</b> pricing model. We are onboarding beta users in weekly batches and will email your activation link shortly!
            </p>
            <button
              onClick={onClose}
              className="add-btn secondary"
              style={{ width: "100%", padding: "8px", fontSize: "0.82rem", height: "auto" }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
