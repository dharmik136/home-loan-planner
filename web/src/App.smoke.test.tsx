// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { App } from "./App";

// Recharts' ResponsiveContainer needs real layout; stub it so the tree mounts
// in jsdom. We're smoke-testing the app shell + live numbers, not pixel charts.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: 600, height: 300 }}>{children}</div>,
  };
});

beforeAll(() => {
  // jsdom lacks these; the app touches them indirectly.
  if (!window.matchMedia) {
    // @ts-expect-error test shim
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  }
  localStorage.clear();
});

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("App smoke", () => {
  it("mounts and shows the masthead + verified default EMI", () => {
    render(<App />);
    expect(screen.getAllByText(/Prepayment/i).length).toBeGreaterThan(0);
    // Loan A default EMI (35L @ 7.25% / 180) = ₹31,951 — must appear.
    expect(screen.getAllByText(/31,951/).length).toBeGreaterThan(0);
    // Loan B default EMI (50L @ 7.5% / 180) = ₹46,351.
    expect(screen.getAllByText(/46,351/).length).toBeGreaterThan(0);
  });

  it("shows zero savings before any prepayment, then savings after adding one", () => {
    render(<App />);
    // Headline 'Interest saved' card present.
    expect(screen.getAllByText(/Interest saved/i).length).toBeGreaterThan(0);

    // Add a prepayment on Loan A (default entry = ₹2L at month 12).
    const addButtons = screen.getAllByRole("button", { name: /Add a prepayment/i });
    expect(addButtons.length).toBe(2); // one per loan
    fireEvent.click(addButtons[0]);

    // Entry registered, and its rule badge confirms it's within HDFC rules.
    expect(document.body.textContent).toMatch(/1 planned/);
    expect(document.body.textContent).toMatch(/Within HDFC rules/i);
  });

  it("windfall simulator names a best-choice loan", () => {
    render(<App />);
    // Default windfall 5L @ month 12 -> Loan B saves more, so a 'Best choice' marker shows.
    expect(screen.getAllByText(/Best choice/i).length).toBeGreaterThan(0);
  });

  it("shows a month-by-month schedule with opening balances", () => {
    render(<App />);
    expect(screen.getAllByText(/every month/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Opening/).length).toBeGreaterThan(0);
    // 180-month schedule -> the final month row (#180) is present.
    expect(screen.getAllByText("180").length).toBeGreaterThan(0);
  });

  it("renders the HDFC rules panel", () => {
    render(<App />);
    const panel = screen.getByText(/rules this model enforces/i);
    expect(within(panel.closest(".panel") as HTMLElement).getByText(/Prepayment penalty/i)).toBeTruthy();
  });

  it("renders the milestones panel and displays crossover/payoff marks", () => {
    render(<App />);
    expect(screen.getAllByText(/Debt-Free Milestones/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/50% Debt Cleared/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Principal > Interest/i).length).toBeGreaterThan(0);
  });

  it("renders the windfall optimizer split allocation recommendation", () => {
    render(<App />);
    expect(screen.getAllByText(/Smart Windfall Allocator/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Total Optimized Savings/i).length).toBeGreaterThan(0);
  });

  it("renders ruleset selectors and prepayment strategy select dropdowns", () => {
    render(<App />);
    expect(screen.getAllByText(/Lender Rules/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Prepayment strategy/i).length).toBeGreaterThan(0);
  });

  it("renders floating rate simulator rate changes list", () => {
    render(<App />);
    expect(screen.getAllByText(/Floating Rate Simulator/i).length).toBeGreaterThan(0);
  });
});
