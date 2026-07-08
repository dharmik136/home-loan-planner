/**
 * Lightweight Launch Instrumentation Utility.
 * Logs analytics events to the developer console and local storage for verification.
 */
export function trackEvent(eventName: string, metadata?: Record<string, any>) {
  const timestamp = new Date().toLocaleString();
  console.log(`📊 [ANALYTICS] Event: ${eventName} | Timestamp: ${timestamp}`, metadata || {});

  try {
    const raw = localStorage.getItem("prepayment-ledger-analytics-events");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ eventName, metadata, timestamp });
    // Keep last 50 events
    localStorage.setItem("prepayment-ledger-analytics-events", JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    console.error("Failed to persist analytics event:", err);
  }
}

export interface AnalyticsEvent {
  eventName: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
