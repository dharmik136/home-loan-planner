import { useEffect, useMemo, useState } from "react";
import { LoanCard } from "./components/LoanCard";
import { PrepaymentControls } from "./components/PrepaymentControls";
import { SummaryCards } from "./components/SummaryCards";
import { BalanceChart } from "./components/BalanceChart";
import { ScheduleTable } from "./components/ScheduleTable";
import { WindfallSimulator } from "./components/WindfallSimulator";
import { RulesPanel } from "./components/RulesPanel";
import { DebtMilestones } from "./components/DebtMilestones";
import { RolloverPlanner } from "./components/RolloverPlanner";
import { PortfolioBalanceChart } from "./components/PortfolioBalanceChart";
import { PaywallModal } from "./components/PaywallModal";
import { MarketingLandingPage } from "./components/MarketingLandingPage";
import { TaxSavingsDeductor } from "./components/TaxSavingsDeductor";
import { InvestmentVsPrepay } from "./components/InvestmentVsPrepay";
import { DebtStressMeter } from "./components/DebtStressMeter";
import { ForeclosureCalculator } from "./components/ForeclosureCalculator";
import { YearlyScheduleTable } from "./components/YearlyScheduleTable";
import { SharePlanButton } from "./components/SharePlanButton";
import { LoanEligibilityChecker } from "./components/LoanEligibilityChecker";
import { PrepayGoalPlanner } from "./components/PrepayGoalPlanner";
import { BankEMIComparator } from "./components/BankEMIComparator";
import { AchievementBadges } from "./components/AchievementBadges";
import { InflationAdjustedView } from "./components/InflationAdjustedView";
import { StampDutyCalculator } from "./components/StampDutyCalculator";
import { BalanceTransferAdvisor } from "./components/BalanceTransferAdvisor";
import { RentVsBuyCalculator } from "./components/RentVsBuyCalculator";
import { MonthlyBudgetPlanner } from "./components/MonthlyBudgetPlanner";
import { SmartTipsPanel } from "./components/SmartTipsPanel";
import { NetWorthProjector } from "./components/NetWorthProjector";
import { BonusWindfallPlanner } from "./components/BonusWindfallPlanner";
import { SIPCorpusSimulator } from "./components/SIPCorpusSimulator";
import { PrepaymentScenarios } from "./components/PrepaymentScenarios";
import { InterestShockVisualizer } from "./components/InterestShockVisualizer";
import { SavingsValueWidget } from "./components/SavingsValueWidget";
import { DebtFreeCelebration } from "./components/DebtFreeCelebration";
import { DebtFreeCountdown } from "./components/DebtFreeCountdown";
import { OnboardingTour } from "./components/OnboardingTour";
import { LettersToEditor } from "./components/LettersToEditor";
import { PartPaymentPlanner } from "./components/PartPaymentPlanner";
import { computeLoan, type Loan, type PrepayEntry, type LoanResult } from "./engine/planning";
import { downloadScheduleCSV, downloadCSV } from "./engine/csv";
import { formatINR } from "./engine/format";
import { trackEvent } from "./engine/analytics";

export interface Lead {
  email: string;
  newsletter: boolean;
  calculatedSavings: number;
  capturedAt: string;
}

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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate from old formats if needed
      if (parsed.loans && !Array.isArray(parsed.loans)) {
        parsed.loans = Object.values(parsed.loans);
      }
      // Ensure fields exist for rateChanges and ruleset
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

export function App() {
  const [state, setState] = useState<State>(load);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [view, setView] = useState<"landing" | "app">(() => {
    if ((import.meta as ImportMeta & { env: { MODE: string } }).env.MODE === "test") {
      return "app";
    }
    return "landing";
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const raw = localStorage.getItem("prepayment-ledger-leads");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("prepayment-ledger-leads", JSON.stringify(leads));
  }, [leads]);

  const handleCaptureLead = (email: string, newsletter: boolean) => {
    const totalSavings = results.reduce((sum, res) => sum + res.comparison.interestSaved, 0);
    const newLead: Lead = {
      email,
      newsletter,
      calculatedSavings: totalSavings,
      capturedAt: new Date().toLocaleString()
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const { loans, entries } = state;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loans.length > 0) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your prepayment plan. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loans]);

  const [activeLoanId, setActiveLoanId] = useState<string>(() => loans[0]?.id || "");
  const [yearlyView, setYearlyView] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [rightTab, setRightTab] = useState<"simulators" | "risk" | "tax" | "tools" | "editorial">("simulators");

  const applyScenario = (scenario: string) => {
    if (scenario === "prepayment_optimizer") {
      setState({
        loans: [
          {
            id: "A",
            name: "Home Loan (SBI)",
            outstanding: 4500000,
            ratePct: 8.25,
            tenureMonths: 240,
            startYYYYMM: "2026-07",
            preEmiInterest: 0,
            ruleset: "hdfc",
            rateChanges: [],
            extraEmiPerYear: true,
            biWeekly: false,
            stepUpPct: 5,
            interestMethod: "monthlyReducing",
            prepayBehavior: "reduceTenure",
          }
        ],
        entries: [
          { id: "pp-opt-1", loanId: "A", type: "oneTime", amount: 300000, monthIndex: 24 }
        ]
      });
      setActiveLoanId("A");
    } else if (scenario === "balance_transfer") {
      setState({
        loans: [
          {
            id: "A",
            name: "High Interest Loan",
            outstanding: 6000000,
            ratePct: 9.1,
            tenureMonths: 180,
            startYYYYMM: "2026-07",
            preEmiInterest: 0,
            ruleset: "hdfc",
            rateChanges: [],
            interestMethod: "monthlyReducing",
            prepayBehavior: "reduceTenure",
          }
        ],
        entries: []
      });
      setActiveLoanId("A");
    } else if (scenario === "rate_shock") {
      setState({
        loans: [
          {
            id: "A",
            name: "Floating Rate Loan",
            outstanding: 5000000,
            ratePct: 7.5,
            tenureMonths: 240,
            startYYYYMM: "2026-07",
            preEmiInterest: 0,
            ruleset: "hdfc",
            rateChanges: [
              { id: "rc-1", monthIndex: 12, newRatePct: 8.25 },
              { id: "rc-2", monthIndex: 24, newRatePct: 9.0 }
            ],
            moratoriumStart: 36,
            moratoriumDuration: 6,
            moratoriumType: "interestOnly",
            interestMethod: "dailyReducing",
            prepayBehavior: "reduceTenure",
          }
        ],
        entries: []
      });
      setActiveLoanId("A");
    } else if (scenario === "tax_optimizer") {
      setState({
        loans: [
          {
            id: "A",
            name: "Tax Saver Loan",
            outstanding: 3500000,
            ratePct: 8.5,
            tenureMonths: 180,
            startYYYYMM: "2026-07",
            preEmiInterest: 0,
            ruleset: "hdfc",
            rateChanges: [],
            interestMethod: "monthlyReducing",
            prepayBehavior: "reduceTenure",
          }
        ],
        entries: []
      });
      setActiveLoanId("A");
    }
    trackEvent("onboarding_scenario_applied", { scenario });
  };

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
            monthIndex: alloc.monthIndex
          });
        }
      }
      return { ...s, entries: newEntries };
    });
    trackEvent("windfall_split_applied", { count: allocations.length });
    alert("Optimized windfall prepayments successfully applied to your plan!");
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const nextLetter = String.fromCharCode(65 + loans.length); // A, B, C, D...
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
    if (loans.length + 1 > 1) {
      trackEvent("multiple_loans_configured", { count: loans.length + 1 });
    }
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

  const results: LoanResult[] = useMemo(() => {
    return loans.map((loan) => {
      const loanEntries = entries.filter((e) => e.loanId === loan.id);
      return computeLoan(loan, loanEntries);
    });
  }, [loans, entries]);

  const changeView = (newView: "landing" | "app") => {
    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        setView(newView);
      });
    } else {
      setView(newView);
    }
  };

  if (view === "landing") {
    return (
      <>
        <MarketingLandingPage
          onGoToPlanner={() => changeView("app")}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />
        <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onCapture={handleCaptureLead} />
      </>
    );
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <div>
          <div className="kicker">A planning ledger · est. 2026</div>
          <h1>The Prepayment <em>Ledger</em></h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <button
            onClick={() => changeView("landing")}
            className="nav-btn"
            style={{
              background: "none",
              border: "1px solid var(--line-strong)",
              borderRadius: "4px",
              padding: "6px 12px",
              cursor: "pointer",
              color: "var(--ink)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.2s"
            }}
          >
            ← Marketing Page
          </button>
          <button
            onClick={toggleDarkMode}
            className="theme-btn"
            style={{
              background: "none",
              border: "1px solid var(--line-strong)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--ink)",
              fontSize: "1.1rem",
              transition: "all 0.2s"
            }}
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => setIsTourActive(true)}
            className="theme-btn"
            style={{
              background: "none",
              border: "1px solid var(--line-strong)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--ink)",
              fontSize: "1.1rem",
              transition: "all 0.2s"
            }}
            title="Start Onboarding Tour"
          >
            ❓
          </button>
          <div className="edition">
            Interactive home loan planner<br />
            Pay early · cut years · keep interest<br />
            <b>No prepayment penalty (RBI 2026)</b>
          </div>
        </div>
      </header>
      <div className="rule-row">
        <span>{loans.length} loan{loans.length !== 1 ? 's' : ''} configured</span>
        <span>Tenure-reduction model</span>
        <span><b>Drag a slider →</b> watch the years fall</span>
        <span>Everything stays in your browser</span>
      </div>

      <div className="grid">
        <aside className="col-left">
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
          <SummaryCards results={results} />

          {loans.length >= 1 && <DebtFreeCelebration results={results} />}

          {loans.length >= 1 && <DebtFreeCountdown results={results} />}

          {loans.length >= 1 && <SavingsValueWidget results={results} />}

          {loans.length > 0 && (
            <div className="panel s3">
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
            <div className="panel s4">
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

          {loans.length >= 1 && <SmartTipsPanel results={results} />}

          {loans.length >= 1 && <PrepaymentScenarios results={results} />}

          <div className="actions" style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button className="btn" onClick={() => {
              const totalSavings = results.reduce((sum, res) => sum + res.comparison.interestSaved, 0);
              trackEvent("save_plan_cta_clicked", { savings: totalSavings });
              setIsPaywallOpen(true);
            }}>📄 Save Plan & Get PDF (Free)</button>
            <button className="btn ghost" onClick={() => downloadScheduleCSV(results)}>↓ Download CSV</button>
            <button className="btn ghost" onClick={exportWorkspaceJSON}>💾 Export JSON</button>
            <button className="btn ghost" onClick={() => document.getElementById("import-json-file")?.click()}>📤 Import JSON</button>
            <input type="file" id="import-json-file" accept=".json" onChange={importWorkspaceJSON} style={{ display: "none" }} />
            <button className="btn ghost" onClick={reset}>Reset to defaults</button>
          </div>

          {loans.length >= 1 && (
            <div style={{ marginTop: "8px" }}>
              <SharePlanButton results={results} />
            </div>
          )}
        </main>

        <aside className="col-right">
          {loans.length >= 1 && (
            <div className="panel" style={{ marginBottom: "16px", border: "2px solid var(--ink)", padding: "14px" }}>
              <div className="double-border-bottom" style={{ borderBottom: "3px double var(--line-strong)", paddingBottom: "6px", marginBottom: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-soft)" }}>Today's Issue Index</span>
                <h4 style={{ margin: "2px 0 0", fontFamily: "var(--display)", fontSize: "1.15rem", fontWeight: "900", color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  📰 The Ledger Directory
                </h4>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  onClick={() => setRightTab("simulators")}
                  style={{
                    padding: "8px 10px",
                    border: rightTab === "simulators" ? "1.5px solid var(--emerald)" : "1px solid var(--line)",
                    background: rightTab === "simulators" ? "var(--emerald-wash)" : "var(--paper)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { if (rightTab !== "simulators") e.currentTarget.style.borderColor = "var(--emerald)"; }}
                  onMouseLeave={(e) => { if (rightTab !== "simulators") e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "800", fontFamily: "var(--display)", color: "var(--ink)" }}>SECTION I. SURPLUS SIMULATORS</span>
                    {rightTab === "simulators" && <span style={{ fontSize: "0.74rem", color: "var(--emerald)", fontWeight: "700" }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginTop: "2px", lineHeight: "1.3" }}>
                    Windfall Simulator, Bonus Planner, Part-Payments, SIP vs Prepay, SIP Corpus.
                  </div>
                </div>

                <div
                  onClick={() => setRightTab("risk")}
                  style={{
                    padding: "8px 10px",
                    border: rightTab === "risk" ? "1.5px solid var(--emerald)" : "1px solid var(--line)",
                    background: rightTab === "risk" ? "var(--emerald-wash)" : "var(--paper)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { if (rightTab !== "risk") e.currentTarget.style.borderColor = "var(--emerald)"; }}
                  onMouseLeave={(e) => { if (rightTab !== "risk") e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "800", fontFamily: "var(--display)", color: "var(--ink)" }}>SECTION II. RISK & AUDITS</span>
                    {rightTab === "risk" && <span style={{ fontSize: "0.74rem", color: "var(--emerald)", fontWeight: "700" }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginTop: "2px", lineHeight: "1.3" }}>
                    Debt Stress Meter, Interest Hikes Shock, Balance Transfer Advisor, Lender Rules.
                  </div>
                </div>

                <div
                  onClick={() => setRightTab("tax")}
                  style={{
                    padding: "8px 10px",
                    border: rightTab === "tax" ? "1.5px solid var(--emerald)" : "1px solid var(--line)",
                    background: rightTab === "tax" ? "var(--emerald-wash)" : "var(--paper)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { if (rightTab !== "tax") e.currentTarget.style.borderColor = "var(--emerald)"; }}
                  onMouseLeave={(e) => { if (rightTab !== "tax") e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "800", fontFamily: "var(--display)", color: "var(--ink)" }}>SECTION III. TAX & PLANNING</span>
                    {rightTab === "tax" && <span style={{ fontSize: "0.74rem", color: "var(--emerald)", fontWeight: "700" }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginTop: "2px", lineHeight: "1.3" }}>
                    Income Tax Savings (Sec 24b/80C), Prepayment Goals, Budget Planner, Foreclosure Calculator.
                  </div>
                </div>

                <div
                  onClick={() => setRightTab("tools")}
                  style={{
                    padding: "8px 10px",
                    border: rightTab === "tools" ? "1.5px solid var(--emerald)" : "1px solid var(--line)",
                    background: rightTab === "tools" ? "var(--emerald-wash)" : "var(--paper)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { if (rightTab !== "tools") e.currentTarget.style.borderColor = "var(--emerald)"; }}
                  onMouseLeave={(e) => { if (rightTab !== "tools") e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "800", fontFamily: "var(--display)", color: "var(--ink)" }}>SECTION IV. REFERENCE TOOLS</span>
                    {rightTab === "tools" && <span style={{ fontSize: "0.74rem", color: "var(--emerald)", fontWeight: "700" }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginTop: "2px", lineHeight: "1.3" }}>
                    Loan Eligibility, Bank EMI Comparator, Stamp Duty, Rent vs Buy, Inflation adjustments, Net Worth.
                  </div>
                </div>

                <div
                  onClick={() => setRightTab("editorial")}
                  style={{
                    padding: "8px 10px",
                    border: rightTab === "editorial" ? "1.5px solid var(--emerald)" : "1px solid var(--line)",
                    background: rightTab === "editorial" ? "var(--emerald-wash)" : "var(--paper)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { if (rightTab !== "editorial") e.currentTarget.style.borderColor = "var(--emerald)"; }}
                  onMouseLeave={(e) => { if (rightTab !== "editorial") e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "800", fontFamily: "var(--display)", color: "var(--ink)" }}>SECTION V. EDITORIAL DESK</span>
                    {rightTab === "editorial" && <span style={{ fontSize: "0.74rem", color: "var(--emerald)", fontWeight: "700" }}>● Active</span>}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginTop: "2px", lineHeight: "1.3" }}>
                    Borrower Badges & Achievements, Letters to the Editor Q&A Advice Column.
                  </div>
                </div>
              </div>
            </div>
          )}

          {loans.length >= 1 && rightTab === "simulators" && (
            <>
              <WindfallSimulator loans={loans} onApplySplit={handleApplyWindfallSplit} />
              <BonusWindfallPlanner results={results} />
              <PartPaymentPlanner />
              <InvestmentVsPrepay results={results} />
              <SIPCorpusSimulator results={results} />
            </>
          )}

          {loans.length >= 1 && rightTab === "risk" && (
            <>
              <DebtStressMeter results={results} />
              <InterestShockVisualizer results={results} />
              <BalanceTransferAdvisor results={results} />
              <RulesPanel />
            </>
          )}

          {loans.length >= 1 && rightTab === "tax" && (
            <>
              <TaxSavingsDeductor results={results} />
              <PrepayGoalPlanner results={results} />
              <MonthlyBudgetPlanner results={results} />
              <ForeclosureCalculator results={results} />
            </>
          )}

          {loans.length >= 1 && rightTab === "tools" && (
            <>
              <LoanEligibilityChecker />
              <BankEMIComparator />
              <StampDutyCalculator />
              <RentVsBuyCalculator />
              <InflationAdjustedView results={results} />
              <NetWorthProjector results={results} />
            </>
          )}

          {loans.length >= 1 && rightTab === "editorial" && (
            <>
              <AchievementBadges results={results} />
              <LettersToEditor results={results} />
            </>
          )}

          {leads.length > 0 && (
            <div className="panel s6" style={{ borderLeft: "4px solid var(--emerald)", width: "100%" }}>
              <div className="panel-title">
                <span className="num">Database</span> 📋 Captured Leads ({leads.length})
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "14px", lineHeight: "1.4" }}>
                Simulates Supabase lead database, collecting user emails and portfolio savings.
              </p>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "3px", marginBottom: "14px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "var(--ink)", color: "var(--paper)" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>Email</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "8px", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }} title={l.email}>{l.email}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "var(--emerald)", fontWeight: 700 }}>
                          {formatINR(l.calculatedSavings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                <button
                  className="btn"
                  onClick={() => {
                    const headers = ["Email", "Newsletter Opt-In", "Calculated Interest Savings", "Captured At"];
                    const rows = leads.map(l => [l.email, l.newsletter ? "Yes" : "No", l.calculatedSavings, `"${l.capturedAt}"`]);
                    downloadCSV(headers, rows, "captured-customer-leads.csv");
                  }}
                  style={{ fontSize: "0.76rem", padding: "8px 14px", width: "100%" }}
                >
                  📥 Export Leads to CSV
                </button>
                <button
                  className="btn ghost"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear the captured leads database?")) {
                      setLeads([]);
                    }
                  }}
                  style={{ fontSize: "0.76rem", padding: "8px 14px", width: "100%" }}
                >
                  Clear Database
                </button>
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

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Scroll to Top"
        >
          ▲
        </button>
      )}

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onCapture={handleCaptureLead} />
      <OnboardingTour forceOpen={isTourActive} onClose={() => setIsTourActive(false)} onApplyScenario={applyScenario} />
    </div>
  );
}
