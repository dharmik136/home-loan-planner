/**
 * TaxSavingsDeductor — Full UI Panel
 * ====================================
 * Tax Savings Deductor (Sec 24b / 80C)
 * - Old vs New Tax Regime comparison
 * - Per-year deduction breakdown table
 * - Post-tax effective interest rate
 * - Surcharge & cess-aware calculations
 */
import { useState, useMemo } from "react";
import type { LoanResult } from "../engine/planning";
import { formatINR, formatCompactINR } from "../engine/format";
import {
  computeTaxSavings,
  buildYearlyLoanSummaries,
  mergeYearlySummaries,
  computeRegimeVerdict,
  type TaxRegime,
  type TaxConfig,
} from "../engine/tax";

interface Props {
  results: LoanResult[];
}

// Number of years to show in the breakdown table before "Show More"
const TABLE_PREVIEW_YEARS = 5;

export function TaxSavingsDeductor({ results }: Props) {
  const [regime, setRegime] = useState<TaxRegime>("old");
  const [annualIncome, setAnnualIncome] = useState<number>(1_500_000); // 15L default
  const [otherSection80C, setOtherSection80C] = useState<number>(100_000); // 1L PF/ELSS
  const [propType, setPropType] = useState<"self" | "let">("self");
  const [showAllYears, setShowAllYears] = useState(false);

  if (results.length === 0) return null;

  // ─── Build yearly summaries from all home loan schedules ───
  const { yearlyMerged, avgPreTaxRate } = useMemo(() => {
    const allSummaries = results.map((r) => buildYearlyLoanSummaries(r.plan.rows));
    const merged = mergeYearlySummaries(allSummaries);

    const weightedRate = results.reduce((s, r) => s + r.loan.ratePct * r.loan.outstanding, 0);
    const totalOut = results.reduce((s, r) => s + r.loan.outstanding, 0);
    const avg = totalOut > 0 ? weightedRate / totalOut : 0;

    return { yearlyMerged: merged, avgPreTaxRate: avg };
  }, [results]);

  // ─── Tax config based on current regime selection ───
  const config: TaxConfig = useMemo(() => {
    if (regime === "new") {
      return { regime: "new", annualIncome };
    }
    return {
      regime: "old",
      annualIncome,
      otherSection80C,
      propertyType: propType,
    };
  }, [regime, annualIncome, otherSection80C, propType]);

  // ─── Main engine computation ───
  const taxResult = useMemo(
    () => computeTaxSavings(yearlyMerged, config, avgPreTaxRate),
    [yearlyMerged, config, avgPreTaxRate]
  );

  // ─── Regime Verdict calculation ───
  const verdict = useMemo(() => {
    return computeRegimeVerdict(yearlyMerged, annualIncome, otherSection80C, propType);
  }, [yearlyMerged, annualIncome, otherSection80C, propType]);

  // ─── Old regime counterfactual (for new regime banner) ───
  const oldCounterfactual = taxResult.oldRegimeCounterfactual;

  const visibleRows = showAllYears
    ? taxResult.yearRows
    : taxResult.yearRows.slice(0, TABLE_PREVIEW_YEARS);

  const incomeLakhs = annualIncome / 100_000;
  const interestCapLabel = propType === "self" ? "₹2L cap" : "No cap";
  const principalRoomLeft = Math.max(0, 150_000 - otherSection80C);

  return (
    <div className="panel s6" style={{ marginTop: "16px" }}>
      <style>{`
        .tax-regime-toggle {
          display: inline-flex;
          border: 1px solid var(--line-strong);
          padding: 3px;
          border-radius: 3px;
          background: var(--panel);
          gap: 0;
        }
        .tax-regime-btn {
          font-family: var(--body);
          font-size: 0.74rem;
          font-weight: 700;
          padding: 5px 12px;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          background: transparent;
          color: var(--ink-soft);
          transition: all 0.15s ease;
          letter-spacing: 0.03em;
        }
        .tax-regime-btn.active {
          background: var(--ink);
          color: var(--paper);
        }
        .tax-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        @media (max-width: 640px) {
          .tax-input-row { grid-template-columns: 1fr; }
        }
        .tax-label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-soft);
          display: block;
          margin-bottom: 4px;
        }
        .tax-select, .tax-number-input {
          width: 100%;
          font-family: var(--body);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--ink);
          background: var(--paper);
          border: 1px solid var(--line-strong);
          border-radius: 2px;
          padding: 7px 9px;
          outline: none;
          cursor: pointer;
        }
        .tax-select:focus, .tax-number-input:focus {
          border-color: var(--emerald);
          box-shadow: 0 0 0 2px var(--emerald-wash);
        }

        /* Summary metric tiles */
        .tax-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--line-strong);
          border: 1px solid var(--line-strong);
          border-radius: 3px;
          overflow: hidden;
          margin: 12px 0;
        }
        @media (max-width: 580px) {
          .tax-summary-grid { grid-template-columns: 1fr; }
        }
        .tax-tile {
          background: var(--paper-raised);
          padding: 12px 10px;
          text-align: center;
        }
        .tax-tile-val {
          font-family: var(--display);
          font-weight: 900;
          font-size: 1.15rem;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .tax-tile-label {
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--ink-soft);
          margin-top: 4px;
        }
        .tax-tile-sub {
          font-size: 0.62rem;
          color: var(--ink-faint);
          margin-top: 2px;
        }

        /* Year breakdown table */
        .tax-table {
          width: 100%;
          font-size: 0.72rem;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .tax-table th {
          text-align: right;
          padding: 4px 6px;
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-soft);
          border-bottom: 1px solid var(--line-strong);
          font-weight: 800;
          white-space: nowrap;
        }
        .tax-table th:first-child { text-align: left; }
        .tax-table td {
          text-align: right;
          padding: 5px 6px;
          border-bottom: 1px solid var(--line);
          color: var(--ink-soft);
          font-variant-numeric: tabular-nums;
        }
        .tax-table td:first-child { text-align: left; color: var(--ink); font-weight: 700; }
        .tax-table tr:last-child td { border-bottom: none; }
        .tax-table .saved-cell {
          color: var(--emerald);
          font-weight: 700;
        }

        /* New regime notice */
        .new-regime-notice {
          background: var(--clay-wash);
          border: 1px solid var(--clay);
          border-left: 4px solid var(--clay);
          border-radius: 3px;
          padding: 14px 16px;
          margin: 10px 0;
          font-size: 0.82rem;
          line-height: 1.5;
          color: var(--ink);
        }
        .new-regime-notice strong { color: var(--clay); }

        /* Old regime counterfactual warning */
        .regime-switch-nudge {
          background: var(--emerald-wash);
          border: 1px solid var(--emerald);
          border-left: 4px solid var(--emerald);
          border-radius: 3px;
          padding: 10px 14px;
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--ink);
          margin-top: 8px;
        }

        /* Regime verdict card styling */
        .tax-verdict-card {
          background: var(--paper-raised);
          border: 1.5px solid var(--line-strong);
          border-radius: 3px;
          padding: 14px;
          margin-top: 14px;
          margin-bottom: 14px;
          position: relative;
        }
        .tax-verdict-badge {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--paper);
          background: var(--ink);
          padding: 3px 7px;
          border-radius: 2px;
          margin-bottom: 8px;
        }
        .tax-verdict-title {
          font-family: var(--display);
          font-size: 1.15rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .tax-verdict-description {
          font-size: 0.8rem;
          line-height: 1.45;
          color: var(--ink-soft);
          margin-bottom: 10px;
        }
        .tax-verdict-breakdown {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          border-top: 1px dashed var(--line-strong);
          padding-top: 8px;
          margin-top: 8px;
        }
        @media (max-width: 480px) {
          .tax-verdict-breakdown { grid-template-columns: 1fr; }
        }
        .tax-verdict-col h5 {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 2px;
        }
        .tax-verdict-col p {
          font-family: var(--display);
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--ink);
        }
      `}</style>

      {/* ── Panel header ── */}
      <div className="panel-title">
        <span className="num">Tax planning</span>
        Home Loan Tax Deductor (Sec 24b / 80C)
      </div>

      {/* ── Regime Toggle ── */}
      <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div className="tax-regime-toggle">
          <button
            className={`tax-regime-btn${regime === "old" ? " active" : ""}`}
            onClick={() => setRegime("old")}
            id="tax-regime-old"
          >
            Old Regime
          </button>
          <button
            className={`tax-regime-btn${regime === "new" ? " active" : ""}`}
            onClick={() => setRegime("new")}
            id="tax-regime-new"
          >
            New Regime
          </button>
        </div>
        <span style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontStyle: "italic" }}>
          {regime === "old"
            ? "Sec 24b + 80C deductions apply"
            : "FY 2024-25: No home loan deductions"}
        </span>
      </div>

      {/* ── Inputs ── */}
      <div className="tax-input-row">
        <div>
          <label className="tax-label" htmlFor="tax-income-input">Annual Gross Income (₹)</label>
          <input
            id="tax-income-input"
            className="tax-number-input"
            type="number"
            inputMode="numeric"
            min={0}
            step={50000}
            value={annualIncome}
            onChange={(e) => setAnnualIncome(Math.max(0, Number(e.target.value)))}
          />
          <div style={{ fontSize: "0.62rem", color: "var(--ink-faint)", marginTop: "3px" }}>
            = {formatCompactINR(annualIncome)}
          </div>
        </div>

        {regime === "old" && (
          <div>
            <label className="tax-label" htmlFor="tax-other80c-input">Other 80C Investments (₹)</label>
            <input
              id="tax-other80c-input"
              className="tax-number-input"
              type="number"
              inputMode="numeric"
              min={0}
              max={150000}
              step={10000}
              value={otherSection80C}
              onChange={(e) => setOtherSection80C(Math.min(150_000, Math.max(0, Number(e.target.value))))}
            />
            <div style={{ fontSize: "0.62rem", color: "var(--ink-faint)", marginTop: "3px" }}>
              PF / ELSS / LIC — 80C room left: {formatCompactINR(principalRoomLeft)}
            </div>
          </div>
        )}
      </div>

      {regime === "old" && (
        <div className="tax-input-row" style={{ marginBottom: "14px" }}>
          <div>
            <label className="tax-label" htmlFor="tax-proptype-select">Property Type</label>
            <select
              id="tax-proptype-select"
              className="tax-select"
              value={propType}
              onChange={(e) => setPropType(e.target.value as "self" | "let")}
            >
              <option value="self">Self-Occupied — Sec 24b {interestCapLabel}</option>
              <option value="let">Let-Out — No Sec 24b Cap</option>
            </select>
          </div>
          <div>
            <label className="tax-label">Income Slab (computed)</label>
            <div style={{
              border: "1px solid var(--line-strong)",
              borderRadius: "2px",
              padding: "7px 9px",
              fontSize: "0.82rem",
              fontWeight: 700,
              background: "var(--paper-raised)",
              color: "var(--ink)",
            }}>
              {incomeLakhs <= 2.5 ? "0% — Exempt"
                : incomeLakhs <= 5   ? "5% slab"
                : incomeLakhs <= 10  ? "20% slab"
                : "30% slab"}
              {annualIncome > 5_000_000 ? " + Surcharge" : ""}
              {" + 4% Cess"}
            </div>
          </div>
        </div>
      )}

      {/* ── Regime Auto-Advisor Verdict Card ── */}
      <div className="tax-verdict-card">
        <div className="tax-verdict-badge">⚖️ Regime Advisor Verdict</div>
        {verdict.recommendation === "old" ? (
          <>
            <div className="tax-verdict-title" style={{ color: "var(--emerald)" }}>
              Recommend: Old Tax Regime
            </div>
            <div className="tax-verdict-description">
              Based on your home loan interest deductions (Sec 24b) and principal repayments (Sec 80C), the <strong>Old Tax Regime saves you more money</strong>.
              {verdict.crossoverYear ? (
                <span>
                  {" "}Interest paid declines over time. In <strong>Year {verdict.crossoverYear}</strong>, interest deductions fall enough that the <strong>New Regime becomes cheaper</strong>. Plan to switch your tax selection then.
                </span>
              ) : (
                <span> Deductions make the Old Regime superior for the entire planning timeline.</span>
              )}
            </div>
            <div className="tax-verdict-breakdown">
              <div className="tax-verdict-col">
                <h5>First-Year Tax Saved</h5>
                <p style={{ color: "var(--emerald)" }}>{formatINR(verdict.firstYearSavings)}</p>
              </div>
              <div className="tax-verdict-col">
                <h5>Estimated Lifetime Savings</h5>
                <p style={{ color: "var(--emerald)" }}>{formatINR(verdict.lifetimeSavings)}</p>
              </div>
            </div>
          </>
        ) : verdict.recommendation === "new" ? (
          <>
            <div className="tax-verdict-title" style={{ color: "var(--clay)" }}>
              Recommend: New Tax Regime
            </div>
            <div className="tax-verdict-description">
              Due to lower tax brackets, the <strong>New Tax Regime is cheaper</strong>. The tax bracket savings exceed the home loan interest and Section 80C deductions you would get under the Old Regime.
            </div>
            <div className="tax-verdict-breakdown">
              <div className="tax-verdict-col">
                <h5>First-Year Tax Saved</h5>
                <p style={{ color: "var(--clay)" }}>{formatINR(verdict.firstYearSavings)}</p>
              </div>
              <div className="tax-verdict-col">
                <h5>Estimated Lifetime Savings</h5>
                <p style={{ color: "var(--clay)" }}>{formatINR(verdict.lifetimeSavings)}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="tax-verdict-title">
              Recommend: Either Regime (Equal)
            </div>
            <div className="tax-verdict-description">
              Both regimes yield identical tax liabilities for your gross income.
            </div>
          </>
        )}
      </div>

      {/* ── New Regime Warning ── */}
      {regime === "new" && (
        <div className="new-regime-notice">
          <strong>No home loan deductions under New Tax Regime.</strong>
          <br />
          Sections 24b and 80C are <strong>not available</strong> under the New Tax Regime (FY 2024-25). Your tax bill is calculated purely on gross income.
          {oldCounterfactual > 0 && (
            <div className="regime-switch-nudge" style={{ marginTop: "10px" }}>
              If you switched to the <strong>Old Tax Regime</strong>, you would save an estimated{" "}
              <strong style={{ color: "var(--emerald)" }}>{formatINR(oldCounterfactual)}</strong>{" "}
              in lifetime taxes via Sec 24b + 80C home loan deductions.
            </div>
          )}
        </div>
      )}

      {/* ── Summary Tiles ── */}
      {regime === "old" && (
        <>
          <div className="tax-summary-grid">
            <div className="tax-tile">
              <div className="tax-tile-val" style={{ color: "var(--clay)" }}>
                {formatCompactINR(taxResult.totalInterestPaid)}
              </div>
              <div className="tax-tile-label">Total Interest Paid</div>
              <div className="tax-tile-sub">Lifetime (24b deductible)</div>
            </div>
            <div className="tax-tile">
              <div className="tax-tile-val" style={{ color: "var(--ink)" }}>
                {formatCompactINR(taxResult.totalPrincipalRepaid)}
              </div>
              <div className="tax-tile-label">Total Principal Repaid</div>
              <div className="tax-tile-sub">Lifetime (80C deductible)</div>
            </div>
            <div className="tax-tile">
              <div className="tax-tile-val" style={{ color: "var(--emerald)" }}>
                {formatCompactINR(taxResult.totalTaxSaved)}
              </div>
              <div className="tax-tile-label">Estimated Tax Saved</div>
              <div className="tax-tile-sub">Sec 24b + 80C combined</div>
            </div>
          </div>

          {/* Post-tax rate summary */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            padding: "11px 13px",
            fontSize: "0.82rem",
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            marginBottom: "12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-soft)" }}>Weighted Pre-Tax Interest Rate</span>
              <strong>{taxResult.avgPreTaxRate.toFixed(2)}%</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-soft)" }}>Post-Tax Effective Rate</span>
              <strong style={{ color: "var(--emerald)" }}>{taxResult.postTaxEffectiveRate.toFixed(2)}%</strong>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px dashed var(--line-strong)",
              paddingTop: "7px",
            }}>
              <span style={{ color: "var(--ink-soft)" }}>
                80C room remaining after other investments
              </span>
              <strong>{formatCompactINR(principalRoomLeft)}</strong>
            </div>
          </div>

          {/* ── Year-by-Year Breakdown Table ── */}
          {taxResult.yearRows.length > 0 && (
            <div>
              <div style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: "4px",
              }}>
                Year-by-Year Tax Deduction Breakdown
              </div>
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table className="tax-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Interest</th>
                      <th>24b Deductible</th>
                      <th>Principal</th>
                      <th>80C Deductible</th>
                      <th>Tax Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.year}>
                        <td>Yr {row.year}</td>
                        <td>{formatCompactINR(row.annualInterest)}</td>
                        <td style={{ color: row.deductibleInterest < row.annualInterest ? "var(--clay)" : "inherit" }}>
                          {formatCompactINR(row.deductibleInterest)}
                          {row.deductibleInterest < row.annualInterest && (
                            <span title="Capped at ₹2L (self-occupied)"> ⬆ capped</span>
                          )}
                        </td>
                        <td>{formatCompactINR(row.annualPrincipal)}</td>
                        <td>{formatCompactINR(row.deductiblePrincipal)}</td>
                        <td className="saved-cell">{formatCompactINR(row.taxSavedThisYear)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {taxResult.yearRows.length > TABLE_PREVIEW_YEARS && (
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", paddingTop: "8px" }}>
                          <button
                            onClick={() => setShowAllYears(!showAllYears)}
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "var(--emerald)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px 8px",
                              textDecoration: "underline",
                            }}
                          >
                            {showAllYears
                              ? `Show less`
                              : `Show all ${taxResult.yearRows.length} years`}
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* ── Regime comparison nudge ── */}
          {regime === "old" && taxResult.totalTaxSaved > 0 && (
            <div style={{
              marginTop: "10px",
              padding: "10px 13px",
              background: "var(--emerald-wash)",
              borderLeft: "3px solid var(--emerald)",
              borderRadius: "2px",
              fontSize: "0.76rem",
              lineHeight: 1.5,
              color: "var(--ink)",
            }}>
              <strong>Regime note:</strong> With{" "}
              {formatCompactINR(annualIncome)} income, home loan deductions save you{" "}
              <strong style={{ color: "var(--emerald)" }}>
                {formatCompactINR(taxResult.totalTaxSaved)}
              </strong>{" "}
              lifetime under the Old Regime. Compare this against any additional tax payable before
              choosing your regime for the financial year.
            </div>
          )}
        </>
      )}

      {/* ── Static footer disclaimer ── */}
      <div style={{
        fontSize: "0.62rem",
        color: "var(--ink-faint)",
        marginTop: "10px",
        lineHeight: 1.4,
        borderTop: "1px solid var(--line)",
        paddingTop: "8px",
      }}>
        <strong>Note:</strong> Estimates based on standard slabs for individuals under 60. Surcharge (10%–37%)
        and 4% Health &amp; Education Cess applied. Section 87A rebate applied where eligible.
        Section 80C ₹1.5L cap is shared across all investments. Always consult a CA for tax filing decisions.
      </div>
    </div>
  );
}
