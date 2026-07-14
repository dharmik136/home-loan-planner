import type { ReactNode } from "react";

interface CalloutProps {
  variant: "error" | "warning";
  children: ReactNode;
}

export function Callout({ variant, children }: CalloutProps) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={isError ? undefined : "callout-warning-pulse"}
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-start",
        background: isError ? "var(--clay-wash)" : "var(--gold-wash)",
        borderLeft: `3px solid ${isError ? "var(--warn)" : "var(--gold)"}`,
        borderRadius: "2px",
        padding: "8px 12px",
        margin: "10px 0",
        fontSize: "0.78rem",
        color: isError ? "var(--warn)" : "var(--ink)",
        lineHeight: 1.4,
      }}
    >
      <span style={{ fontWeight: 700, color: isError ? "var(--warn)" : "var(--gold)", flex: "none" }}>
        {isError ? "✕" : "!"}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{children}</div>
    </div>
  );
}
