import type { LoanResult } from "../engine/planning";
import { monthLabel } from "../engine/format";

const n = (v: number) => Math.round(v).toLocaleString("en-IN");

interface Props {
  result: LoanResult;
}

interface YearSummary {
  year: number;
  label: string;
  emiPaid: number;
  interestPaid: number;
  principalPaid: number;
  prepaymentMade: number;
  closingBalance: number;
}

export function YearlyScheduleTable({ result }: Props) {
  const { plan, loan } = result;

  // Group rows into annual buckets
  const yearlySummaries: YearSummary[] = [];
  const rows = plan.rows;
  const yearsCount = Math.ceil(rows.length / 12);

  for (let y = 0; y < yearsCount; y++) {
    const yearRows = rows.slice(y * 12, (y + 1) * 12);
    const lastRow = yearRows[yearRows.length - 1];
    const firstRow = yearRows[0];
    const yearNumber = y + 1;

    yearlySummaries.push({
      year: yearNumber,
      label: monthLabel(loan.startYYYYMM, firstRow.month).slice(-4), // YYYY
      emiPaid: yearRows.reduce((sum, r) => sum + r.emi, 0),
      interestPaid: yearRows.reduce((sum, r) => sum + r.interest, 0),
      principalPaid: yearRows.reduce((sum, r) => sum + r.principalPaid, 0),
      prepaymentMade: yearRows.reduce((sum, r) => sum + r.prepayment, 0),
      closingBalance: lastRow.closing,
    });
  }

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">📆 / Annual View</span>
        {loan.name}: Year-by-Year Summary
      </div>
      <div className="sched-scroll">
        <table className="sched-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>EMI Paid ₹</th>
              <th>Interest ₹</th>
              <th>Principal ₹</th>
              <th>Prepaid ₹</th>
              <th>Closing ₹</th>
            </tr>
          </thead>
          <tbody>
            {yearlySummaries.map((ys) => (
              <tr key={ys.year} className={ys.prepaymentMade > 0 ? "has-prepay" : ""}>
                <td><b>Yr {ys.year}</b><br /><span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>{ys.label}</span></td>
                <td>{n(ys.emiPaid)}</td>
                <td style={{ color: "var(--clay)" }}>{n(ys.interestPaid)}</td>
                <td style={{ color: "var(--emerald)" }}>{n(ys.principalPaid)}</td>
                <td>{ys.prepaymentMade > 0 ? <b style={{ color: "var(--emerald)" }}>{n(ys.prepaymentMade)}</b> : "—"}</td>
                <td>{n(ys.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", borderTop: "2px solid var(--line-strong)" }}>
              <td>Total</td>
              <td>{n(yearlySummaries.reduce((s, y) => s + y.emiPaid, 0))}</td>
              <td style={{ color: "var(--clay)" }}>{n(yearlySummaries.reduce((s, y) => s + y.interestPaid, 0))}</td>
              <td style={{ color: "var(--emerald)" }}>{n(yearlySummaries.reduce((s, y) => s + y.principalPaid, 0))}</td>
              <td>{n(yearlySummaries.reduce((s, y) => s + y.prepaymentMade, 0))}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="sched-note">
        {yearlySummaries.length} years · {rows.length} months total. Rows with prepayments are highlighted green.
      </p>
    </div>
  );
}
