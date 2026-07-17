import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../engine/analytics";
import type { SavePlanResult } from "../services/persistence";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (email: string, newsletter: boolean) => Promise<SavePlanResult>;
}

export function PaywallModal({ isOpen, onClose, onCapture }: Props) {
  const [email, setEmail] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveResult, setSaveResult] = useState<SavePlanResult | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const shareLink = saveResult?.shareId
    ? window.location.origin + window.location.pathname + "?share=" + saveResult.shareId
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setError("");
      setSubmitted(false);
      setSaveResult(null);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      trackEvent("email_lead_capture_started", { newsletter: newsletterOptIn });
      const result = await onCapture(email, newsletterOptIn);
      setSaveResult(result);
      setSubmitted(true);
      trackEvent("email_lead_captured", { savedTo: result.savedTo, newsletter: newsletterOptIn });
    } catch {
      setError("We could not save your planner snapshot. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="native-modal-dialog"
      aria-labelledby="save-plan-title"
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line-strong)",
        borderRadius: "4px",
        width: "90%",
        maxWidth: "450px",
        padding: "24px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        position: "relative",
        outline: "none",
      }}
    >
      <button
        className="modal-close"
        aria-label="Close save plan dialog"
        onClick={onClose}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "none",
          border: "none",
          color: "var(--ink-faint)",
          fontSize: "1.2rem",
          cursor: "pointer",
        }}
      >
        x
      </button>

      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <h3 id="save-plan-title" style={{ fontFamily: "var(--display)", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "8px", color: "var(--ink)" }}>
            Save planner snapshot
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "20px", lineHeight: "1.4" }}>
            Enter your email to create a restorable snapshot of this plan.
          </p>

          <div className="save-flow-list">
            <div><b>Planner snapshot:</b> Stores the current loan cards and prepayment entries.</div>
            <div><b>Cloud sharing:</b> When Supabase is configured, your email and full planner snapshot are sent to the project database.</div>
            <div><b>Plan context:</b> Captures calculated savings with the saved record.</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <label htmlFor="lead-email" style={{ fontSize: "0.74rem", color: "var(--ink-soft)", fontWeight: "600" }}>Your Email Address</label>
            <input
              id="lead-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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

          {error && (
            <div role="alert" style={{ fontSize: "0.78rem", color: "var(--clay)", background: "var(--clay-wash)", borderLeft: "3px solid var(--clay)", padding: "8px 10px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <input
              type="checkbox"
              id="newsletter"
              checked={newsletterOptIn}
              onChange={(event) => setNewsletterOptIn(event.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="newsletter" style={{ fontSize: "0.76rem", color: "var(--ink-soft)", cursor: "pointer", userSelect: "none" }}>
              Send me occasional loan planning updates.
            </label>
          </div>

          <button
            type="submit"
            className="add-btn"
            disabled={isSaving}
            style={{ width: "100%", padding: "10px", fontSize: "0.88rem", height: "auto" }}
          >
            {isSaving ? "Saving your plan..." : "Save My Planner Snapshot"}
          </button>

          <span style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-faint)", textAlign: "center", marginTop: "12px" }}>
            No bank login is required. Newsletter consent is optional and off by default.
          </span>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <span aria-hidden="true" style={{ fontSize: "2rem" }}>Saved</span>
          <h3 style={{ fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: "bold", marginTop: "12px", marginBottom: "8px", color: "var(--ink)" }}>
            Plan Saved
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "20px", lineHeight: "1.4" }}>
            Your planner snapshot for <b>{email}</b> is saved.
          </p>
          <p style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginBottom: "20px", lineHeight: "1.4" }}>
            {saveResult?.message || "Saved locally in this browser."}
          </p>
          {shareLink && (
            <div style={{ background: "var(--amber-wash)", border: "1px solid var(--line-strong)", padding: "10px", margin: "14px 0", borderRadius: "2px", textAlign: "left" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: "600", display: "block", marginBottom: "4px", color: "var(--ink-soft)" }}>
                SHAREABLE PLAN LINK:
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  style={{ flex: 1, fontSize: "0.76rem", padding: "4px 6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", width: "0" }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="add-btn"
                  style={{ padding: "4px 8px", fontSize: "0.72rem", height: "auto" }}
                >
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
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
