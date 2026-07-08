import { useState } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR } from "../engine/format";

interface Props {
  results: LoanResult[];
}

type TaxSlab = 0 | 10 | 20 | 30 | 39;
type PropertyType = "self" | "rented";

export function TaxSavingsDeductor({ results }: Props) {
  const [slab, setSlab] = useState<TaxSlab>(30);
  const [propType, setPropType] = useState<PropertyType>("self");

  if (results.length === 0) return null;

  // Group payments by years (12-month periods) to apply annual caps
  let totalTaxSaved = 0;
  results.forEach((r) => {
    const rows = r.plan.rows;
    const yearsCount = Math.ceil(rows.length / 12);
    
    for (let y = 0; y < yearsCount; y++) {
      const yearRows = rows.slice(y * 12, (y + 1) * 12);
      const annualInterest = yearRows.reduce((sum, row) => sum + row.interest, 0);
      const annualPrincipal = yearRows.reduce((sum, row) => sum + row.principalPaid, 0);

      // Section 24b: Interest deduction capped at 2L for self-occupied
      const interestCap = propType === "self" ? 200_000 : Infinity;
      const deductibleInterest = Math.min(annualInterest, interestCap);
      const taxSavedInterest = (deductibleInterest * slab) / 100;

      // Section 80C: Principal deduction capped at 1.5L
      const deductiblePrincipal = Math.min(annualPrincipal, 150_000);
      const taxSavedPrincipal = (deductiblePrincipal * slab) / 100;

      totalTaxSaved += (taxSavedInterest + taxSavedPrincipal);
    }
  });

  // Calculate weighted average post-tax interest rate
  const weightedRate = results.reduce((sum, r) => sum + r.loan.ratePct * r.loan.outstanding, 0);
  const totalOutstanding = results.reduce((sum, r) => sum + r.loan.outstanding, 0);
  const avgRate = totalOutstanding > 0 ? weightedRate / totalOutstanding : 0;
  const postTaxRate = avgRate * (1 - slab / 100);

  return (
    <div className="panel s6" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🇮🇳 / Tax Optimization</span>
        Home Loan Tax Deductor (Sec 24b / 80C)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>
            Tax Bracket
          </label>
          <select
            value={slab}
            onChange={(e) => setSlab(Number(e.target.value) as TaxSlab)}
            style={{
              width: "100%",
              fontFamily: "var(--body)",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "var(--ink)",
              background: "var(--paper)",
              border: "1px solid var(--line-strong)",
              borderRadius: "2px",
              padding: "7px 9px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value={0}>0% (No Tax)</option>
            <option value={10}>10% Slab</option>
            <option value={20}>20% Slab</option>
            <option value={30}>30% Slab</option>
            <option value={39}>39% (HNW Surcharge)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>
            Property Type
          </label>
          <select
            value={propType}
            onChange={(e) => setPropType(e.target.value as PropertyType)}
            style={{
              width: "100%",
              fontFamily: "var(--body)",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "var(--ink)",
              background: "var(--paper)",
              border: "1px solid var(--line-strong)",
              borderRadius: "2px",
              padding: "7px 9px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="self">Self-Occupied (2L Limit)</option>
            <option value="rented">Let-Out (No Limit)</option>
          </select>
        </div>
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "11px 13px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
          <span>Weighted Pre-Tax Rate:</span>
          <span><b>{avgRate.toFixed(2)}%</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem", color: "var(--emerald)" }}>
          <span>Post-Tax Effective Rate:</span>
          <span style={{ fontWeight: "700" }}>{postTaxRate.toFixed(2)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--line-strong)", paddingTop: "8px", fontSize: "0.82rem" }}>
          <span>Estimated Lifetime Tax Saved:</span>
          <span style={{ fontWeight: "700", color: "var(--ink)" }}>{formatINR(Math.round(totalTaxSaved))}</span>
        </div>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 <b>Section 24b</b> allows interest deductions up to ₹2 Lakh for self-occupied properties. <b>Section 80C</b> allows principal tax breaks up to ₹1.5 Lakh.
      </div>
    </div>
  );
}
