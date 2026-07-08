import { useState } from "react";
import { formatINR } from "../engine/format";


function monthlyEmiCalc(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / months);
  const f = Math.pow(1 + r, months);
  return Math.ceil((principal * r * f) / (f - 1));
}

export function RentVsBuyCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(8_000_000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRate, setLoanRate] = useState(8.75);
  const tenureYears = 20;
  const [monthlyRent, setMonthlyRent] = useState(25_000);
  const [rentIncreasePA, setRentIncreasePA] = useState(8);
  const [propertyApprecPA, setPropertyApprecPA] = useState(7);

  const loanAmount = propertyPrice * (1 - downPaymentPct / 100);
  const downPayment = propertyPrice * downPaymentPct / 100;
  const tenureMonths = tenureYears * 12;
  const emi = monthlyEmiCalc(loanAmount, loanRate, tenureMonths);

  // Compute cumulative cost year by year for up to 30 years
  const MAX_YEARS = 30;
  let cumulativeRent = 0;
  let cumulativeBuyCost = downPayment; // upfront down payment
  let buyWinsAt: number | null = null;
  let currentRent = monthlyRent;
  let propertyValue = propertyPrice;

  const yearData: { year: number; rent: number; buy: number; propertyValue: number }[] = [];

  for (let y = 1; y <= MAX_YEARS; y++) {
    // Rent accumulates with annual increase
    for (let m = 0; m < 12; m++) {
      cumulativeRent += currentRent;
    }
    currentRent *= (1 + rentIncreasePA / 100);

    // Buy cost: EMI for tenure, then 0; maintenance ~1% pa
    const yearEmiCost = y <= tenureYears ? emi * 12 : 0;
    const maintenanceCost = propertyPrice * 0.01; // ~1% pa maintenance
    cumulativeBuyCost += yearEmiCost + maintenanceCost;

    propertyValue *= (1 + propertyApprecPA / 100);

    // Net buy cost = cumulative payments - property appreciation gain
    const netBuyCost = cumulativeBuyCost - (propertyValue - propertyPrice);

    yearData.push({ year: y, rent: Math.round(cumulativeRent), buy: Math.round(netBuyCost), propertyValue: Math.round(propertyValue) });

    if (buyWinsAt === null && netBuyCost < cumulativeRent) {
      buyWinsAt = y;
    }
  }

  const finalRent = yearData[MAX_YEARS - 1].rent;
  const finalBuy = yearData[MAX_YEARS - 1].buy;

  return (
    <div className="panel" style={{ marginTop: "16px" }}>
      <div className="panel-title">
        <span className="num">🏠 / Decision</span>
        Rent vs Buy Calculator
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Property Price</span><span><b>{formatINR(propertyPrice)}</b></span></div>
          <input type="range" min={2_000_000} max={30_000_000} step={100_000} value={propertyPrice} onChange={(e) => setPropertyPrice(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Down Payment</span><span><b>{downPaymentPct}%</b></span></div>
          <input type="range" min={10} max={50} step={5} value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Home Loan Rate</span><span><b>{loanRate}%</b></span></div>
          <input type="range" min={7} max={14} step={0.25} value={loanRate} onChange={(e) => setLoanRate(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Monthly Rent</span><span><b>{formatINR(monthlyRent)}</b></span></div>
          <input type="range" min={5_000} max={150_000} step={1_000} value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Rent Inflation p.a.</span><span><b>{rentIncreasePA}%</b></span></div>
          <input type="range" min={3} max={15} step={1} value={rentIncreasePA} onChange={(e) => setRentIncreasePA(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <div className="slider-meta" style={{ marginBottom: "4px" }}><span>Property Appreciation p.a.</span><span><b>{propertyApprecPA}%</b></span></div>
          <input type="range" min={2} max={15} step={1} value={propertyApprecPA} onChange={(e) => setPropertyApprecPA(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginBottom: "4px" }}>30-YR RENT COST</div>
          <div style={{ fontWeight: "800", fontSize: "1rem", color: "var(--clay)" }}>{formatINR(finalRent)}</div>
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "3px", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginBottom: "4px" }}>30-YR NET BUY COST</div>
          <div style={{ fontWeight: "800", fontSize: "1rem", color: finalBuy < finalRent ? "var(--emerald)" : "var(--clay)" }}>{formatINR(Math.abs(finalBuy))}</div>
        </div>
      </div>

      <div style={{
        background: buyWinsAt ? "var(--emerald-wash)" : "var(--clay-wash)",
        border: `1px solid ${buyWinsAt ? "#c4dac9" : "var(--clay)"}`,
        borderRadius: "3px", padding: "10px 12px", fontSize: "0.8rem", fontWeight: "600", textAlign: "center"
      }}>
        {buyWinsAt
          ? `🏡 Buying becomes cheaper after Year ${buyWinsAt} — property appreciation pays off.`
          : `🏢 Renting is cheaper over 30 years at these parameters.`}
      </div>

      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: "8px", lineHeight: "1.3" }}>
        💡 Net Buy Cost = all EMIs + maintenance − property appreciation gain. Does not account for tax benefits (Sec 24b/80C), opportunity cost of down payment, or rental yield.
      </div>
    </div>
  );
}
