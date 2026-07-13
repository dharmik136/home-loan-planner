import { HDFC_RULES } from "../engine/rules";

export function RulesPanel() {
  return (
    <div className="panel s6">
      <div className="panel-title"><span className="num">06 / The fine print</span> HDFC rules this model enforces</div>
      <ul className="rules-list">
        {HDFC_RULES.map((r) => (
          <li key={r.rule}>
            <span className="rk">{r.rule}</span>
            <span className="rd">{r.detail}</span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: "0.72rem", color: "var(--ink-faint)", marginTop: 12, lineHeight: 1.6 }}>
        Verified June 2026 from HDFC's home-loan FAQ and the RBI directive effective 1 Jan 2026.
        The "maximum" check uses the prepayment-month balance as a proxy for year-opening principal.
      </p>
    </div>
  );
}
