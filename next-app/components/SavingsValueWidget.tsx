import { useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";
import { Target, Gift, Car, Plane, Smartphone, Coffee } from "lucide-react";

interface Props {
  results: LoanResult[];
}

export function SavingsValueWidget({ results }: Props) {
  const totalInterestSaved = useMemo(() => {
    return results.reduce((sum, r) => sum + r.comparison.interestSaved, 0);
  }, [results]);

  if (totalInterestSaved <= 0) {
    return (
      <div className="panel" style={{ marginTop: "16px", textAlign: "center", padding: "20px" }}>
        <Target size={32} style={{ color: "var(--gold)" }} />
        <h4 style={{ fontFamily: "var(--display)", margin: "8px 0" }}>What could you buy with your savings?</h4>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
          Configure prepayments above to save interest and see what tangible items your savings equal!
        </p>
      </div>
    );
  }

  const items = [
    { label: "Entry-level Cars (₹5L each)", value: Math.max(1, Math.floor(totalInterestSaved / 500_000)), icon: Car },
    { label: "International Vacations (₹1.5L each)", value: Math.max(1, Math.floor(totalInterestSaved / 150_000)), icon: Plane },
    { label: "Premium iPhones (₹80K each)", value: Math.max(1, Math.floor(totalInterestSaved / 80_000)), icon: Smartphone },
    { label: "Premium Coffee Cups (₹250 each)", value: Math.max(1, Math.floor(totalInterestSaved / 250)), icon: Coffee },
  ];

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Gift size={13} /> / Purchasing Power</span>
        What Your Saved Interest Can Buy
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "14px", lineHeight: "1.4" }}>
        By prepaying your home loan, you avoid paying interest to the bank. That saved money is yours to spend on life! Here is what your <b>{formatINR(Math.round(totalInterestSaved))}</b> saved interest is equivalent to:
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {items.map((item) => (
          <div key={item.label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "4px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <item.icon size={26} strokeWidth={1.5} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--emerald)" }}>
                {item.value.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", lineHeight: "1.2" }}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
