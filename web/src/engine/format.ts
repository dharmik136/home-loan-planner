// Indian-format currency + date helpers.

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹30,00,000 — Indian lakh/crore grouping, no decimals. */
export function formatINR(n: number): string {
  return "₹" + inr.format(Math.round(n));
}

/** Compact: ₹7.39 L / ₹1.20 Cr for headline numbers. */
export function formatCompactINR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (abs >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  return formatINR(n);
}

/** months -> "3 yr 8 mo" */
export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** startDate 'YYYY-MM' + 1-based month index -> 'Mar 2028' */
export function monthLabel(startYYYYMM: string, monthIndex: number): string {
  const [y, m] = startYYYYMM.split("-").map(Number);
  const total = (y * 12 + (m - 1)) + (monthIndex - 1);
  return `${MONTHS[total % 12]} ${Math.floor(total / 12)}`;
}

/** Which calendar year-of-loan a 1-based month falls in (1-based). */
export function yearOfMonth(monthIndex: number): number {
  return Math.floor((monthIndex - 1) / 12) + 1;
}
