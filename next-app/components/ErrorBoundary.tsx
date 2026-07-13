import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside Loan Plan Workspace:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper)",
          color: "var(--ink)",
          fontFamily: "var(--body)",
          padding: "24px",
          textAlign: "center"
        }}>
          <div style={{
            maxWidth: "480px",
            background: "var(--panel)",
            border: "1px solid var(--line-strong)",
            borderRadius: "6px",
            padding: "32px 24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <span aria-hidden="true" style={{ display: "block", width: "48px", height: "6px", borderRadius: "999px", background: "var(--clay)", margin: "0 auto" }} />
            <h2 style={{ fontFamily: "var(--display)", margin: "16px 0 8px 0", fontSize: "1.4rem" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", lineHeight: "1.5", marginBottom: "24px" }}>
              The prepayment planning engine encountered an unexpected rendering error. This could be due to invalid or corrupted local storage workspace data.
            </p>

            {this.state.error && (
              <pre style={{
                textAlign: "left",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                padding: "12px",
                borderRadius: "3px",
                fontSize: "0.74rem",
                overflowX: "auto",
                maxHeight: "120px",
                marginBottom: "24px",
                color: "var(--clay)"
              }}>
                {this.state.error.toString()}
              </pre>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                className="btn"
                onClick={this.handleReset}
                style={{ padding: "8px 16px" }}
              >
                Clear Workspace &amp; Reload
              </button>
              <button
                className="btn ghost"
                onClick={() => window.location.reload()}
                style={{ padding: "8px 16px" }}
              >
                Just Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
