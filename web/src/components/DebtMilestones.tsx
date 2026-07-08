import type { LoanResult } from "../engine/planning";
import { formatDuration, monthLabel } from "../engine/format";

interface Props {
  results: LoanResult[];
}

export function DebtMilestones({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="panel s6">
      <div className="panel-title">
        <span className="num">Milestones</span>
        Debt-Free Milestones & Progress
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {results.map((res) => {
          const { loan, plan, comparison } = res;
          
          // Calculate crossover point
          let crossoverMonth = -1;
          let cumInterest = 0;
          let cumPrincipal = 0;
          for (const row of plan.rows) {
            cumInterest += row.interest;
            cumPrincipal += row.principalPaid;
            if (cumPrincipal > cumInterest && crossoverMonth === -1) {
              crossoverMonth = row.month;
            }
          }

          // Calculate halfway paid month
          let halfwayMonth = -1;
          const targetHalf = loan.outstanding / 2;
          for (const row of plan.rows) {
            if (row.closing <= targetHalf && halfwayMonth === -1) {
              halfwayMonth = row.month;
            }
          }

          return (
            <div key={loan.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
              <h4 style={{ fontFamily: "var(--display)", fontSize: "0.96rem", marginBottom: "10px", color: "var(--ink)" }}>
                {loan.name} Progress
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                
                {/* Milestone 1: Crossover */}
                <div style={{ background: "var(--panel)", padding: "8px 10px", borderRadius: "2px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "700" }}>Principal &gt; Interest</div>
                  <div style={{ fontSize: "0.86rem", fontWeight: "700", marginTop: "4px" }}>
                    {crossoverMonth !== -1 ? `Month ${crossoverMonth}` : "N/A"}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--ink-faint)", marginTop: "2px" }}>
                    {crossoverMonth !== -1 ? monthLabel(loan.startYYYYMM, crossoverMonth) : "Never"}
                  </div>
                </div>

                {/* Milestone 2: Halfway */}
                <div style={{ background: "var(--panel)", padding: "8px 10px", borderRadius: "2px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: "700" }}>50% Debt Cleared</div>
                  <div style={{ fontSize: "0.86rem", fontWeight: "700", marginTop: "4px" }}>
                    {halfwayMonth !== -1 ? `Month ${halfwayMonth}` : "N/A"}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--ink-faint)", marginTop: "2px" }}>
                    {halfwayMonth !== -1 ? monthLabel(loan.startYYYYMM, halfwayMonth) : "Never"}
                  </div>
                </div>

                {/* Milestone 3: Savings */}
                <div style={{ background: "var(--emerald-wash)", padding: "8px 10px", borderRadius: "2px", textAlign: "center", border: "1px solid #c4dac9" }}>
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: "var(--emerald)", fontWeight: "700" }}>Payoff Boost</div>
                  <div style={{ fontSize: "0.86rem", fontWeight: "700", marginTop: "4px", color: "var(--emerald)" }}>
                    {comparison.monthsSaved > 0 ? `${formatDuration(comparison.monthsSaved)} saved` : "No boost yet"}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--ink-faint)", marginTop: "2px" }}>
                    {comparison.monthsSaved > 0 ? `Clears loan early` : "Pay only EMI"}
                  </div>
                </div>

                {/* Milestone 4: Final payoff */}
                <div style={{ background: "var(--ink)", padding: "8px 10px", borderRadius: "2px", textAlign: "center", color: "var(--paper)" }}>
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: "var(--ink-faint)", fontWeight: "700" }}>Debt Free Date</div>
                  <div style={{ fontSize: "0.86rem", fontWeight: "700", marginTop: "4px", color: "var(--paper)" }}>
                    {monthLabel(loan.startYYYYMM, plan.monthsToPayoff)}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--ink-faint)", marginTop: "2px" }}>
                    {plan.monthsToPayoff} months total
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
