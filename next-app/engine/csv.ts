import type { LoanResult } from "./planning";
import { monthLabel } from "./format";

/** Download each loan's PLAN schedule as a CSV the user can open in Excel. */
export function downloadScheduleCSV(results: LoanResult[]) {
  const lines: string[] = [];
  for (const r of results) {
    lines.push(`Loan,${r.loan.name},EMI,${r.emi}`);
    lines.push("Month,Date,Opening,EMI,Interest,Principal,Prepayment,Closing");
    for (const row of r.plan.rows) {
      lines.push(
        [
          row.month,
          monthLabel(r.loan.startYYYYMM, row.month),
          row.opening,
          row.emi,
          row.interest,
          row.principalPaid,
          row.prepayment,
          row.closing,
        ].join(","),
      );
    }
    lines.push(""); // blank line between loans
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "prepayment-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/** General CSV downloader helper. */
export function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const lines: string[] = [];
  lines.push(headers.join(","));
  for (const r of rows) {
    lines.push(r.join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
