import { useEffect, useMemo, useState } from "react";
import { LoanCard } from "./components/LoanCard";
import { PrepaymentControls } from "./components/PrepaymentControls";
import { SummaryCards } from "./components/SummaryCards";
import { BalanceChart } from "./components/BalanceChart";
import { WindfallSimulator } from "./components/WindfallSimulator";
import { RulesPanel } from "./components/RulesPanel";
import { computeLoan, type Loan, type PrepayEntry } from "./engine/planning";
import { downloadScheduleCSV } from "./engine/csv";

const STORAGE_KEY = "prepayment-ledger-v1";

const DEFAULT_LOANS: Record<"A" | "B", Loan> = {
  A: { id: "A", name: "Loan A", outstanding: 3_000_000, ratePct: 7.5, tenureMonths: 180, startYYYYMM: "2025-01" },
  B: { id: "B", name: "Loan B", outstanding: 5_000_000, ratePct: 7.5, tenureMonths: 180, startYYYYMM: "2025-01" },
};

interface State {
  loans: Record<"A" | "B", Loan>;
  entries: PrepayEntry[];
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch { /* ignore */ }
  return { loans: structuredClone(DEFAULT_LOANS), entries: [] };
}

let idSeq = 1;
const newId = () => `pp-${Date.now()}-${idSeq++}`;

export function App() {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const { loans, entries } = state;

  const setLoan = (id: "A" | "B", patch: Partial<Loan>) =>
    setState((s) => ({ ...s, loans: { ...s.loans, [id]: { ...s.loans[id], ...patch } } }));

  const addEntry = (loanId: "A" | "B") =>
    setState((s) => ({
      ...s,
      entries: [...s.entries, { id: newId(), loanId, type: "oneTime", amount: 200_000, monthIndex: 12 }],
    }));

  const changeEntry = (id: string, patch: Partial<PrepayEntry>) =>
    setState((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const removeEntry = (id: string) =>
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));

  const reset = () => setState({ loans: structuredClone(DEFAULT_LOANS), entries: [] });

  const entriesA = entries.filter((e) => e.loanId === "A");
  const entriesB = entries.filter((e) => e.loanId === "B");

  const resA = useMemo(() => computeLoan(loans.A, entriesA), [loans.A, entriesA]);
  const resB = useMemo(() => computeLoan(loans.B, entriesB), [loans.B, entriesB]);

  return (
    <div className="wrap">
      <header className="masthead">
        <div>
          <div className="kicker">A planning ledger · est. 2026</div>
          <h1>The Prepayment <em>Ledger</em></h1>
        </div>
        <div className="edition">
          HDFC floating home loans<br />
          Pay early · cut years · keep interest<br />
          <b>No prepayment penalty (RBI 2026)</b>
        </div>
      </header>
      <div className="rule-row">
        <span>Two loans</span>
        <span>Tenure-reduction model</span>
        <span><b>Drag a slider →</b> watch the years fall</span>
        <span>Everything stays in your browser</span>
      </div>

      <div className="grid">
        <aside className="aside">
          <LoanCard loan={loans.A} emi={resA.emi} delay="s2" onChange={(p) => setLoan("A", p)} />
          <LoanCard loan={loans.B} emi={resB.emi} delay="s3" onChange={(p) => setLoan("B", p)} />
        </aside>

        <div className="col-main">
          <SummaryCards a={resA} b={resB} />

          <div className="panel s3">
            <div className="panel-title"><span className="num">02 / Your moves</span> Plan extra payments</div>
            <PrepaymentControls
              loan={loans.A} entries={entriesA}
              onAdd={() => addEntry("A")} onChange={changeEntry} onRemove={removeEntry}
            />
            <PrepaymentControls
              loan={loans.B} entries={entriesB}
              onAdd={() => addEntry("B")} onChange={changeEntry} onRemove={removeEntry}
            />
          </div>

          <BalanceChart result={resA} />
          <BalanceChart result={resB} />

          <WindfallSimulator loanA={loans.A} loanB={loans.B} />

          <RulesPanel />

          <div className="actions">
            <button className="btn" onClick={() => downloadScheduleCSV([resA, resB])}>↓ Download schedule (CSV)</button>
            <button className="btn ghost" onClick={reset}>Reset to defaults</button>
          </div>
        </div>
      </div>

      <footer className="foot">
        <b>How to read this:</b> "Baseline" = paying only the EMI. "Your plan" = baseline plus the extra payments above.
        Prepaying early saves the most because early EMIs are almost all interest. Figures use a reducing-balance,
        tenure-reduction model and match the companion Excel workbook to the rupee.<br />
        Set your real outstanding balances, rates and start months in the loan cards — defaults are ₹30L + ₹50L at 7.5%.
        Not financial advice; confirm current terms with HDFC.
      </footer>
    </div>
  );
}
