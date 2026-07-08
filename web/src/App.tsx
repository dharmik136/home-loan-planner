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
import { computeLoan, type Loan, type PrepayEntry, type LoanResult } from "./engine/planning";
import { downloadScheduleCSV, downloadCSV } from "./engine/csv";
import { formatINR } from "./engine/format";

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
        parsed.loans = parsed.loans.map((l: any) => ({
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
    if ((import.meta as any).env.MODE === "test") {
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

  const results: LoanResult[] = useMemo(() => {
    return loans.map((loan) => {
      const loanEntries = entries.filter((e) => e.loanId === loan.id);
      return computeLoan(loan, loanEntries);
    });
  }, [loans, entries]);

  if (view === "landing") {
    return (
      <>
        <MarketingLandingPage
          onGoToPlanner={() => setView("app")}
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
            onClick={() => setView("landing")}
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
        <aside className="aside">
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
              />
            );
          })}
          <button className="add-btn" onClick={addLoan} style={{ marginTop: 8 }}>
            + Add another loan
          </button>
        </aside>

        <div className="col-main">
          <SummaryCards results={results} />

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

          {results.map((res, idx) => (
            <div key={res.loan.id} style={{ display: "contents" }}>
              <BalanceChart result={res} index={idx} />
              <ScheduleTable result={res} />
            </div>
          ))}

          {loans.length >= 1 && <WindfallSimulator loans={loans} />}

          {loans.length >= 1 && <RolloverPlanner loans={loans} />}

          <DebtMilestones results={results} />

          <RulesPanel />

          <div className="actions">
            <button className="btn" onClick={() => setIsPaywallOpen(true)}>📄 Save Plan & Get PDF (Free)</button>
            <button className="btn ghost" onClick={() => downloadScheduleCSV(results)}>↓ Download CSV</button>
            <button className="btn ghost" onClick={reset}>Reset to defaults</button>
          </div>
        </div>
      </div>

      <footer className="foot">
        <b>How to read this:</b> "Baseline" = paying only the EMI. "Your plan" = baseline plus the extra payments above.
        Prepaying early saves the most because early EMIs are almost all interest. Figures use a reducing-balance,
        tenure-reduction model and match a standard Excel reducing balance sheet to the rupee.<br />
        Set your real outstanding balances, rates and start months in the loan cards.
        Not financial advice; confirm current terms with your lender.
      </footer>
      
      {leads.length > 0 && (
        <div className="panel s6" style={{ marginTop: "30px", borderLeft: "4px solid var(--emerald)" }}>
          <h3 className="panel-title">
            <span className="num">Database</span> 📋 Captured Customer Leads ({leads.length})
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "16px" }}>
            This section simulates the Supabase backend lead database, collecting user emails and portfolio interest savings.
          </p>
          <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "3px", marginBottom: "14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "var(--ink)", color: "var(--paper)" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>Newsletter</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Portfolio Savings</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>{l.email}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{l.newsletter ? "Yes" : "No"}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "var(--emerald)", fontWeight: 700 }}>
                      {formatINR(l.calculatedSavings)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "var(--ink-faint)" }}>{l.capturedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn"
              onClick={() => {
                const headers = ["Email", "Newsletter Opt-In", "Calculated Interest Savings", "Captured At"];
                const rows = leads.map(l => [l.email, l.newsletter ? "Yes" : "No", l.calculatedSavings, `"${l.capturedAt}"`]);
                downloadCSV(headers, rows, "captured-customer-leads.csv");
              }}
              style={{ fontSize: "0.76rem", padding: "8px 14px" }}
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
              style={{ fontSize: "0.76rem", padding: "8px 14px" }}
            >
              Clear Database
            </button>
          </div>
        </div>
      )}

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onCapture={handleCaptureLead} />
    </div>
  );
}
