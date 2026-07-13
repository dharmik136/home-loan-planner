import type { LoanResult } from "../engine/planning";
import { monthLabel } from "../engine/format";

const n = (v: number) => Math.round(v).toLocaleString("en-IN");

/** Full month-by-month amortization table (the plan, with any prepayments). */
export function ScheduleTable({ result }: { result: LoanResult }) {
  const { plan, loan } = result;
  return (
    <div className="panel">
      <div className="panel-title">
        <span className="num">Schedule</span>
        {loan.name}: every month (opening → closing)
      </div>
      <div className="sched-scroll">
        <table className="sched-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Month</th>
              <th>Opening ₹</th>
              <th>EMI ₹</th>
              <th>Interest ₹</th>
              <th>Principal ₹</th>
              <th>Prepay ₹</th>
              <th>Closing ₹</th>
            </tr>
          </thead>
          <tbody>
            {plan.rows.map((r) => (
              <tr key={r.month} className={r.prepayment > 0 ? "has-prepay" : ""}>
                <td>{r.month}</td>
                <td>{monthLabel(loan.startYYYYMM, r.month)}</td>
                <td>{n(r.opening)}</td>
                <td>{n(r.emi)}</td>
                <td>{n(r.interest)}</td>
                <td>{n(r.principalPaid)}</td>
                <td>{r.prepayment > 0 ? n(r.prepayment) : "—"}</td>
                <td>{n(r.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sched-note">
        {plan.rows.length} months · loan clears {monthLabel(loan.startYYYYMM, plan.monthsToPayoff)}.
        Scroll to see all months; rows where you prepay are highlighted green.
      </p>
    </div>
  );
}
