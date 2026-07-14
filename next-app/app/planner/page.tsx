/*
 * Home Loan Prepayment Planner
 * Copyright (C) 2026 Dharmik Shingala
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { computeLoan, type Loan, type PrepayEntry, type LoanResult } from "../../engine/planning";
import { downloadScheduleCSV } from "../../engine/csv";
import { formatINR } from "../../engine/format";
import { trackEvent } from "../../engine/analytics";
import { clearLocalLeads, loadLocalLeads, savePlanLead, loadSharedPlan, type LeadRecord } from "../../services/persistence";

// Component imports
import { SummaryCards } from "../../components/SummaryCards";
import { MilestoneStamp } from "../../components/MilestoneStamp";
import { DebtFreeCountdown } from "../../components/DebtFreeCountdown";
import { SavingsValueWidget } from "../../components/SavingsValueWidget";
import { PrepaymentControls } from "../../components/PrepaymentControls";
import { PortfolioBalanceChart } from "../../components/PortfolioBalanceChart";
import { BalanceChart } from "../../components/BalanceChart";
import { ScheduleTable } from "../../components/ScheduleTable";
import { YearlyScheduleTable } from "../../components/YearlyScheduleTable";
import { RolloverPlanner } from "../../components/RolloverPlanner";
import { DebtMilestones } from "../../components/DebtMilestones";
import { PlanningTipsPanel } from "../../components/PlanningTipsPanel";
import { PrepaymentScenarios } from "../../components/PrepaymentScenarios";
import { SharePlanButton } from "../../components/SharePlanButton";
import { WindfallSimulator } from "../../components/WindfallSimulator";
import { BonusWindfallPlanner } from "../../components/BonusWindfallPlanner";
import { PartPaymentPlanner } from "../../components/PartPaymentPlanner";
import { InvestmentVsPrepay } from "../../components/InvestmentVsPrepay";
import { SIPCorpusSimulator } from "../../components/SIPCorpusSimulator";
import { DebtStressMeter } from "../../components/DebtStressMeter";
import { InterestShockVisualizer } from "../../components/InterestShockVisualizer";
import { BalanceTransferAdvisor } from "../../components/BalanceTransferAdvisor";
import { RulesPanel } from "../../components/RulesPanel";
import { TaxSavingsDeductor } from "../../components/TaxSavingsDeductor";
import { PrepayGoalPlanner } from "../../components/PrepayGoalPlanner";
import { MonthlyBudgetPlanner } from "../../components/MonthlyBudgetPlanner";
import { ForeclosureCalculator } from "../../components/ForeclosureCalculator";
import { LoanEligibilityChecker } from "../../components/LoanEligibilityChecker";
import { BankEMIComparator } from "../../components/BankEMIComparator";
import { StampDutyCalculator } from "../../components/StampDutyCalculator";
import { RentVsBuyCalculator } from "../../components/RentVsBuyCalculator";
import { InflationAdjustedView } from "../../components/InflationAdjustedView";
import { NetWorthProjector } from "../../components/NetWorthProjector";
import { AchievementBadges } from "../../components/AchievementBadges";
import { LettersToEditor } from "../../components/LettersToEditor";
import { LoanCard } from "../../components/LoanCard";
import { PaywallModal } from "../../components/PaywallModal";

const STORAGE_KEY = "prepayment-ledger-v1";

const DEFAULT_LOANS: Loan[] = [
  { id: "A", name: "Loan A", outstanding: 3_500_000, ratePct: 7.25, tenureMonths: 180, startYYYYMM: "2026-07", preEmiInterest: 17877, ruleset: "hdfc", rateChanges: [] },
  { id: "B", name: "Loan B", outstanding: 5_000_000, ratePct: 7.5, tenureMonths: 180, startYYYYMM: "2026-07", preEmiInterest: 0, ruleset: "hdfc", rateChanges: [] },
];

interface State {
  loans: Loan[];
  entries: PrepayEntry[];
}

function load(): State {
  if (typeof window === "undefined") return { loans: DEFAULT_LOANS, entries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.loans && !Array.isArray(parsed.loans)) {
        parsed.loans = Object.values(parsed.loans);
      }
      if (Array.isArray(parsed.loans)) {
        parsed.loans = parsed.loans.map((l: Partial<Loan>) => ({
          ...l,
          preEmiInterest: l.preEmiInterest ?? 0,
          ruleset: l.ruleset ?? "hdfc",
          rateChanges: l.rateChanges ?? [],
        }));
      }
      return parsed as State;
    }
  } catch { /* ignore */ }
  return { loans: structuredClone(DEFAULT_LOANS), entries: [] };
}

let idSeq = 1;
const newId = () => `pp-${Date.now()}-${idSeq++}`;

type RightTab = "simulators" | "risk" | "tax" | "tools" | "guidance";

const WORKFLOW_STEPS = [
  { id: "loan-setup", label: "Setup", detail: "Loan inputs" },
  { id: "results", label: "Results", detail: "Savings impact" },
  { id: "prepayments", label: "Prepay", detail: "Extra payments" },
  { id: "schedule", label: "Schedule", detail: "Charts and table" },
  { id: "tools", label: "Tools", detail: "Advanced checks" },
  { id: "save-plan", label: "Save", detail: "Export or sync" },
] as const;

const TOOL_TABS: Record<RightTab, { title: string; detail: string }> = {
  simulators: {
    title: "Payment simulators",
    detail: "Windfall, bonus, part-payment, SIP comparison, and corpus checks.",
  },
  risk: {
    title: "Risk checks",
    detail: "Debt load, rate shock, transfer break-even, and lender rules.",
  },
  tax: {
    title: "Tax and budget",
    detail: "Section 24/80C, prepayment goals, monthly budget, and foreclosure estimate.",
  },
  tools: {
    title: "Reference tools",
    detail: "Eligibility, EMI comparison, stamp duty, rent vs buy, inflation, and net worth.",
  },
  guidance: {
    title: "Guidance",
    detail: "Progress badges and practical borrower questions.",
  },
};

export default function PlannerPage() {
  const [state, setState] = useState<State>(load);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [leads, setLeads] = useState<LeadRecord[]>([]);

  useEffect(() => {
    setLeads(loadLocalLeads());
  }, []);

  const [sharedPlanLoading, setSharedPlanLoading] = useState(false);
  const [sharedPlanError, setSharedPlanError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get("share");
    if (shareId) {
      setSharedPlanLoading(true);
      setSharedPlanError("");
      loadSharedPlan(shareId).then((sharedState) => {
        setSharedPlanLoading(false);
        if (sharedState) {
          setState(sharedState);
          trackEvent("shared_plan_loaded", { shareId });
        } else {
          setSharedPlanError("Could not load the shared plan or link has expired.");
        }
      });
    }
  }, []);

  const { loans, entries } = state;

  const results: LoanResult[] = useMemo(() => {
    return loans.map((loan) => {
      const loanEntries = entries.filter((e) => e.loanId === loan.id);
      return computeLoan(loan, loanEntries);
    });
  }, [loans, entries]);

  const handleCaptureLead = async (email: string, newsletter: boolean) => {
    const totalSavings = results.reduce((sum, res) => sum + res.comparison.interestSaved, 0);
    const result = await savePlanLead({
      email,
      newsletter,
      calculatedSavings: totalSavings,
      state,
    });
    setLeads(loadLocalLeads());
    return result;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const [activeLoanId, setActiveLoanId] = useState<string>(() => loans[0]?.id || "");
  const [yearlyView, setYearlyView] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("simulators");
  const [toolsVisited, setToolsVisited] = useState(false);
  const [planActionTaken, setPlanActionTaken] = useState(false);

  // Real, data-derived progress for the workflow-nav stepper — not a linear
  // gate (this is a free-scroll workspace, not a wizard), just an honest
  // "have you actually done this" signal per section.
  const isSetupValid =
    loans.length > 0 &&
    loans.every(
      (l) => l.outstanding > 0 && l.ratePct > 0 && l.ratePct <= 100 && l.tenureMonths > 0 && l.tenureMonths <= 600
    );
  const stepComplete: Record<string, boolean> = {
    "loan-setup": isSetupValid,
    "results": isSetupValid,
    "prepayments": entries.length > 0,
    "schedule": isSetupValid,
    "tools": toolsVisited,
    "save-plan": planActionTaken,
  };
  const completedStepCount = WORKFLOW_STEPS.filter((step) => stepComplete[step.id]).length;

  const handleApplyWindfallSplit = (allocations: { loanId: string; amount: number; monthIndex: number }[]) => {
    setState((s) => {
      const newEntries = [...s.entries];
      for (const alloc of allocations) {
        if (alloc.amount > 0) {
          newEntries.push({
            id: `pp-${Date.now()}-${Math.random()}`,
            loanId: alloc.loanId,
            type: "oneTime",
            amount: alloc.amount,
            monthIndex: alloc.monthIndex,
          });
        }
      }
      return { ...s, entries: newEntries };
    });
    trackEvent("windfall_split_applied", { count: allocations.length });
  };

  const scrollToWorkflowStep = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sortLoans = (criteria: "rate" | "balance" | "name") => {
    setState((s) => {
      const sorted = [...s.loans].sort((a, b) => {
        if (criteria === "rate") return b.ratePct - a.ratePct;
        if (criteria === "balance") return b.outstanding - a.outstanding;
        return a.name.localeCompare(b.name);
      });
      return { ...s, loans: sorted };
    });
    trackEvent("loans_sorted", { criteria });
  };

  useEffect(() => {
    if (loans.length > 0 && !loans.some((l) => l.id === activeLoanId)) {
      setActiveLoanId(loans[0].id);
    }
  }, [loans, activeLoanId]);

  const setLoan = (id: string, patch: Partial<Loan>) =>
    setState((s) => ({
      ...s,
      loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));

  const addLoan = () => {
    const nextLetter = String.fromCharCode(65 + loans.length);
    const name = `Loan ${nextLetter}`;
    const id = `loan-${Date.now()}-${idSeq++}`;
    setState((s) => ({
      ...s,
      loans: [
        ...s.loans,
        { id, name, outstanding: 3_000_000, ratePct: 8.5, tenureMonths: 180, startYYYYMM: "2026-07", preEmiInterest: 0, ruleset: "none", rateChanges: [] },
      ],
    }));
    trackEvent("loan_created", { loanId: id, name });
  };

  const removeLoan = (id: string) => {
    setState((s) => ({
      ...s,
      loans: s.loans.filter((l) => l.id !== id),
      entries: s.entries.filter((e) => e.loanId !== id),
    }));
  };

  const addEntry = (loanId: string) =>
    setState((s) => ({
      ...s,
      entries: [...s.entries, { id: newId(), loanId, type: "oneTime", amount: 200_000, monthIndex: 12 }],
    }));

  const changeEntry = (id: string, patch: Partial<PrepayEntry>) =>
    setState((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const removeEntry = (id: string) =>
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));

  const reset = () => setState({ loans: structuredClone(DEFAULT_LOANS), entries: [] });

  const exportWorkspaceJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prepayment-ledger-workspace-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    trackEvent("workspace_exported", { loanCount: state.loans.length });
  };

  const importWorkspaceJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.loans) && Array.isArray(parsed.entries)) {
          setState(parsed);
          trackEvent("workspace_imported", { loanCount: parsed.loans.length });
        } else {
          alert("Invalid workspace backup file format.");
        }
      } catch (err) {
        alert("Failed to parse workspace backup file.");
      }
    };
  };

  return (
    <div className="wrap planner-page-container">
      {sharedPlanLoading && (
        <div className="loading-banner">
          Loading shared prepayment plan from cloud...
        </div>
      )}
      {sharedPlanError && (
        <div className="error-banner">
          <span>{sharedPlanError}</span>
          <button onClick={() => setSharedPlanError("")}>&times;</button>
        </div>
      )}
      
      <div className="rule-row">
        <span>{loans.length} loan{loans.length !== 1 ? 's' : ''} configured</span>
        <span>Tenure-reduction model</span>
        <span><b>Adjust inputs</b> and compare payoff dates</span>
        <span>Everything stays in your browser</span>
      </div>

      <nav className="workflow-nav" aria-label="Planner workflow">
        {WORKFLOW_STEPS.map((step, index) => {
          const done = stepComplete[step.id];
          return (
            <button key={step.id} type="button" onClick={() => scrollToWorkflowStep(step.id)} className={done ? "step-complete" : undefined}>
              <span className="workflow-index" style={done ? { color: "var(--emerald)" } : undefined}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <b>{step.label}</b>
                <small>{step.detail}</small>
              </span>
              {done && <Check size={13} className="step-check" style={{ color: "var(--emerald)" }} />}
            </button>
          );
        })}
        <div className="workflow-progress-track">
          <div
            className="workflow-progress-fill"
            style={{ width: `${(completedStepCount / WORKFLOW_STEPS.length) * 100}%` }}
          />
        </div>
      </nav>

      <div className="grid">
        <aside className="col-left" id="loan-setup">
          {loans.length > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
              <span>Sort priority:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn ghost" onClick={() => sortLoans("rate")} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>By Rate</button>
                <button className="btn ghost" onClick={() => sortLoans("balance")} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>By Balance</button>
                <button className="btn ghost" onClick={() => sortLoans("name")} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>By Name</button>
              </div>
            </div>
          )}
          {loans.map((loan, idx) => {
            const res = results[idx];
            if (!res) return null;
            return (
              <LoanCard
                key={loan.id}
                loan={loan}
                emi={res.emi}
                delay={`s${Math.min(idx + 2, 4)}`}
                onChange={(p) => setLoan(loan.id, p)}
                onDelete={loans.length > 1 ? () => removeLoan(loan.id) : undefined}
                result={res}
              />
            );
          })}
          <button className="add-btn" onClick={addLoan} style={{ marginTop: 8 }}>
            + Add another loan
          </button>
        </aside>

        <main className="col-mid">
          <section id="results" className="workflow-section">
            <SummaryCards results={results} />
          </section>

          {loans.length >= 1 && <MilestoneStamp results={results} />}

          {loans.length >= 1 && <DebtFreeCountdown results={results} />}

          {loans.length >= 1 && <SavingsValueWidget results={results} />}

          {loans.length > 0 && (
            <div className="panel s3" id="prepayments">
              <div className="panel-title"><span className="num">02 / Your moves</span> Plan extra payments</div>
              {loans.map((loan) => (
                <PrepaymentControls
                  key={loan.id}
                  loan={loan}
                  entries={entries.filter((e) => e.loanId === loan.id)}
                  onAdd={() => addEntry(loan.id)}
                  onChange={changeEntry}
                  onRemove={removeEntry}
                />
              ))}
            </div>
          )}

          {loans.length >= 1 && <PortfolioBalanceChart results={results} />}

          {loans.length > 0 && (
            <div className="panel s4" id="schedule">
              <div className="panel-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span>
                  <span className="num">04 / Detailed Analysis</span> Schedules & Charts
                </span>
                <div className="seg">
                  {loans.map((loan) => (
                    <button
                      key={loan.id}
                      className={activeLoanId === loan.id ? "active" : ""}
                      onClick={() => setActiveLoanId(loan.id)}
                    >
                      {loan.name}
                    </button>
                  ))}
                </div>
              </div>
              {results.filter((r) => r.loan.id === activeLoanId).map((res, idx) => {
                const loanIndex = loans.findIndex((l) => l.id === res.loan.id);
                return (
                  <div key={res.loan.id}>
                    <BalanceChart result={res} index={loanIndex >= 0 ? loanIndex : idx} />
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", marginTop: "8px" }}>
                      <button
                        className={`btn ghost${!yearlyView ? " active" : ""}`}
                        style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        onClick={() => setYearlyView(false)}
                      >Monthly</button>
                      <button
                        className={`btn ghost${yearlyView ? " active" : ""}`}
                        style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        onClick={() => setYearlyView(true)}
                      >Yearly Summary</button>
                    </div>
                    {yearlyView
                      ? <YearlyScheduleTable result={res} />
                      : <ScheduleTable result={res} />}
                  </div>
                );
              })}
            </div>
          )}

          {loans.length >= 1 && <RolloverPlanner loans={loans} />}

          <DebtMilestones results={results} />

          {loans.length >= 1 && <PlanningTipsPanel results={results} />}

          {loans.length >= 1 && <PrepaymentScenarios results={results} />}

          <div className="actions" id="save-plan" style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button className="btn" onClick={() => {
              const totalSavings = results.reduce((sum, res) => sum + res.comparison.interestSaved, 0);
              trackEvent("save_plan_cta_clicked", { savings: totalSavings });
              setIsPaywallOpen(true);
              setPlanActionTaken(true);
            }}>Save Plan & Get PDF (Free)</button>
            <button className="btn ghost" onClick={() => { downloadScheduleCSV(results); setPlanActionTaken(true); }}>Download CSV</button>
            <button className="btn ghost" onClick={() => { exportWorkspaceJSON(); setPlanActionTaken(true); }}>Export JSON</button>
            <button className="btn ghost" onClick={() => document.getElementById("import-json-file")?.click()}>Import JSON</button>
            <input type="file" id="import-json-file" accept=".json" onChange={(e) => { importWorkspaceJSON(e); setPlanActionTaken(true); }} style={{ display: "none" }} />
            <button className="btn ghost" onClick={reset}>Reset to defaults</button>
          </div>

          {loans.length >= 1 && (
            <div style={{ marginTop: "8px" }}>
              <SharePlanButton results={results} />
            </div>
          )}
        </main>

        <aside className="col-right" id="tools">
          {loans.length >= 1 && (
            <div className="panel tool-switcher" style={{ marginBottom: "16px" }}>
              <div className="tool-switcher-head">
                <span className="num">Tool groups</span>
                <h4>Planning workspace</h4>
              </div>
              <div className="tool-tabs">
                {(Object.keys(TOOL_TABS) as RightTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className="directory-tab"
                    aria-pressed={rightTab === tab}
                    onClick={() => { setRightTab(tab); setToolsVisited(true); }}
                  >
                    <span>
                      <b>{TOOL_TABS[tab].title}</b>
                      <small>{TOOL_TABS[tab].detail}</small>
                    </span>
                    {rightTab === tab && <em>Active</em>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loans.length >= 1 && rightTab === "simulators" && (
            <div className="entry-animated" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <WindfallSimulator loans={loans} onApplySplit={handleApplyWindfallSplit} />
              <BonusWindfallPlanner results={results} />
              <PartPaymentPlanner />
              <InvestmentVsPrepay results={results} />
              <SIPCorpusSimulator results={results} />
            </div>
          )}

          {loans.length >= 1 && rightTab === "risk" && (
            <div className="entry-animated" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <DebtStressMeter results={results} />
              <InterestShockVisualizer results={results} />
              <BalanceTransferAdvisor results={results} />
              <RulesPanel />
            </div>
          )}

          {loans.length >= 1 && rightTab === "tax" && (
            <div className="entry-animated" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <TaxSavingsDeductor results={results} />
              <PrepayGoalPlanner results={results} />
              <MonthlyBudgetPlanner results={results} />
              <ForeclosureCalculator results={results} />
            </div>
          )}

          {loans.length >= 1 && rightTab === "tools" && (
            <div className="entry-animated" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <LoanEligibilityChecker />
              <BankEMIComparator />
              <StampDutyCalculator />
              <RentVsBuyCalculator />
              <InflationAdjustedView results={results} />
              <NetWorthProjector results={results} />
            </div>
          )}

          {loans.length >= 1 && rightTab === "guidance" && (
            <div className="entry-animated" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <PlanningTipsPanel results={results} />
              <AchievementBadges results={results} />
              <LettersToEditor results={results} />
            </div>
          )}

          {leads.length > 0 && (
            <div className="panel s6" style={{ borderLeft: "4px solid var(--emerald)", width: "100%" }}>
              <div className="panel-title">
                <span className="num">Saved records</span> Captured plan requests ({leads.length})
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "14px", lineHeight: "1.4" }}>
                Keeps a privacy-safe local save record, then syncs submitted contact details to Supabase when configured.
              </p>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "3px", marginBottom: "14px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "var(--ink)", color: "var(--paper)" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>Contact</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Savings</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Store</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "8px", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }} title={l.email}>{l.email}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "var(--emerald)", fontWeight: 700 }}>
                          {formatINR(l.calculatedSavings)}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", textTransform: "capitalize" }}>{l.savedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="foot">
        <b>How to read this:</b> "Baseline" = paying only the EMI. "Your plan" = baseline plus the extra payments above.
        Prepaying early saves the most because early EMIs are almost all interest. Figures use a reducing-balance,
        tenure-reduction model and match a standard Excel reducing balance sheet to the rupee.<br />
        Set your real outstanding balances, rates and start months in the loan cards.
        Not financial advice; confirm current terms with your lender.
      </footer>

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onCapture={handleCaptureLead} />
    </div>
  );
}
