import type { ReactNode } from "react";
import { X, TriangleAlert, CheckCircle2, Info } from "lucide-react";

type Variant = "error" | "warning" | "success" | "info";

interface CalloutProps {
  variant: Variant;
  action?: ReactNode;
  children: ReactNode;
}

const VARIANTS: Record<
  Variant,
  { icon: typeof X; accent: string; wash: string; textTint: boolean; role: "alert" | "status"; pulse?: boolean }
> = {
  error: { icon: X, accent: "var(--warn)", wash: "var(--clay-wash)", textTint: true, role: "alert" },
  warning: { icon: TriangleAlert, accent: "var(--gold)", wash: "var(--gold-wash)", textTint: false, role: "status", pulse: true },
  success: { icon: CheckCircle2, accent: "var(--emerald)", wash: "var(--emerald-wash)", textTint: false, role: "status" },
  info: { icon: Info, accent: "var(--ink-soft)", wash: "var(--panel)", textTint: false, role: "status" },
};

export function Callout({ variant, action, children }: CalloutProps) {
  const { icon: Icon, accent, wash, textTint, role, pulse } = VARIANTS[variant];
  return (
    <div
      role={role}
      className={pulse ? "callout-warning-pulse" : undefined}
      style={{
        display: "flex",
        gap: "8px",
        alignItems: action ? "center" : "flex-start",
        background: wash,
        borderLeft: `3px solid ${accent}`,
        borderRadius: "2px",
        padding: "8px 12px",
        margin: "10px 0",
        fontSize: "0.78rem",
        color: textTint ? accent : "var(--ink)",
        lineHeight: 1.4,
      }}
    >
      <span style={{ color: accent, flex: "none", display: "flex", marginTop: action ? 0 : "1px" }}>
        <Icon size={14} strokeWidth={variant === "error" ? 2.5 : 2} />
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>{children}</div>
      {action && <div style={{ flex: "none" }}>{action}</div>}
    </div>
  );
}
