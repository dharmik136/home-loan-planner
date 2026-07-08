import { useState, useMemo } from "react";
import { formatINR } from "../engine/format";

const STATES: Record<string, { stampPct: number; regPct: number; gstPct: number }> = {
  "Maharashtra":    { stampPct: 5.0, regPct: 1.0, gstPct: 5.0 },
  "Karnataka":      { stampPct: 5.6, regPct: 1.0, gstPct: 5.0 },
  "Delhi":          { stampPct: 4.0, regPct: 1.0, gstPct: 5.0 },
  "Tamil Nadu":     { stampPct: 7.0, regPct: 1.0, gstPct: 5.0 },
  "Gujarat":        { stampPct: 4.9, regPct: 1.0, gstPct: 5.0 },
  "Rajasthan":      { stampPct: 5.0, regPct: 1.0, gstPct: 5.0 },
  "Uttar Pradesh":  { stampPct: 7.0, regPct: 1.0, gstPct: 5.0 },
  "West Bengal":    { stampPct: 6.0, regPct: 1.0, gstPct: 5.0 },
  "Telangana":      { stampPct: 5.0, regPct: 0.5, gstPct: 5.0 },
  "Haryana":        { stampPct: 5.0, regPct: 0.5, gstPct: 5.0 },
};

export function StampDutyCalculator() {
  const [propertyValue, setPropertyValue] = useState(5_000_000);
  const [state, setState] = useState("Maharashtra");
  const [isUnderConstruction, setIsUnderConstruction] = useState(false);

  const { stampPct, regPct, gstPct } = STATES[state] ?? { stampPct: 5.0, regPct: 1.0, gstPct: 5.0 };

  const costs = useMemo(() => {
    const stampDuty = Math.round(propertyValue * stampPct / 100);
    const registration = Math.round(propertyValue * regPct / 100);
    const gst = isUnderConstruction ? Math.round(propertyValue * gstPct / 100) : 0;
    const legalMisc = Math.round(propertyValue * 0.005); // ~0.5% legal, processing
    const total = stampDuty + registration + gst + legalMisc;
    return { stampDuty, registration, gst, legalMisc, total };
  }, [propertyValue, state, isUnderConstruction, stampPct, regPct, gstPct]);

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">📋 / Hidden Costs</span>
        Stamp Duty &amp; Registration Cost Calculator
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", marginBottom: "4px" }}>State</label>
          <select
            value={state} onChange={(e) => setState(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--body)", fontSize: "0.82rem", color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: "2px", padding: "7px 9px", outline: "none" }}
          >
            {Object.keys(STATES).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", cursor: "pointer", paddingBottom: "8px" }}>
            <input type="checkbox" checked={isUnderConstruction} onChange={(e) => setIsUnderConstruction(e.target.checked)} />
            Under Construction (GST applies)
          </label>
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div className="slider-meta" style={{ marginBottom: "4px" }}>
          <span>Property Value / Agreement Value</span>
          <span><b>{formatINR(propertyValue)}</b></span>
        </div>
        <input type="range" min={500_000} max={50_000_000} step={100_000} value={propertyValue}
          onChange={(e) => setPropertyValue(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "11px 13px", display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Stamp Duty ({stampPct}%):</span>
          <span><b>{formatINR(costs.stampDuty)}</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Registration ({regPct}%):</span>
          <span><b>{formatINR(costs.registration)}</b></span>
        </div>
        {isUnderConstruction && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
            <span>GST on Construction ({gstPct}%):</span>
            <span><b>{formatINR(costs.gst)}</b></span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
          <span>Legal / Processing (~0.5%):</span>
          <span><b>{formatINR(costs.legalMisc)}</b></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: "800", borderTop: "1px dashed var(--line-strong)", paddingTop: "7px" }}>
          <span>Total Upfront Cost:</span>
          <span style={{ color: "var(--clay)" }}>{formatINR(costs.total)}</span>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
          = {((costs.total / propertyValue) * 100).toFixed(1)}% of property value
        </div>
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 Stamp duty rates change periodically. Women buyers get 1–2% concession in many states. Verify with your local sub-registrar office before closing.
      </div>
    </div>
  );
}
