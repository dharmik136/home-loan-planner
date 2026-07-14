import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { LoanResult } from "../engine/planning";
import { monthLabel } from "../engine/format";

const n = (v: number) => Math.round(v).toLocaleString("en-IN");

/** Full month-by-month amortization table (the plan, with any prepayments).
 *  Rows are virtualized (only the visible slice + overscan is in the DOM) —
 *  a 30-year loan is 360 rows, a max-tenure one up to 600, and every one of
 *  those was previously rendered into the DOM at once despite the 220px
 *  scroll window only ever showing about 8 of them. */
export function ScheduleTable({ result }: { result: LoanResult }) {
  const { plan, loan } = result;
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: plan.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 12,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  return (
    <div className="panel">
      <div className="panel-title">
        <span className="num">Schedule</span>
        {loan.name}: every month (opening → closing)
      </div>
      <div className="sched-scroll" ref={parentRef}>
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
            {paddingTop > 0 && (
              <tr aria-hidden="true" style={{ height: paddingTop }}>
                <td colSpan={8} style={{ padding: 0, border: 0 }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const r = plan.rows[virtualRow.index];
              const isYearEnd = r.month % 12 === 0;
              return (
                <tr
                  key={r.month}
                  className={[r.prepayment > 0 ? "has-prepay" : "", isYearEnd ? "year-end" : ""].filter(Boolean).join(" ")}
                >
                  <td>{r.month}</td>
                  <td>{monthLabel(loan.startYYYYMM, r.month)}</td>
                  <td>{n(r.opening)}</td>
                  <td>{n(r.emi)}</td>
                  <td>{n(r.interest)}</td>
                  <td>{n(r.principalPaid)}</td>
                  <td>{r.prepayment > 0 ? n(r.prepayment) : "—"}</td>
                  <td>{n(r.closing)}</td>
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr aria-hidden="true" style={{ height: paddingBottom }}>
                <td colSpan={8} style={{ padding: 0, border: 0 }} />
              </tr>
            )}
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
