import type { Loan, PrepayEntry } from "../engine/planning";

const LOCAL_LEADS_KEY = "prepayment-ledger-leads";

export interface LeadRecord {
  email: string;
  newsletter: boolean;
  calculatedSavings: number;
  capturedAt: string;
  savedTo: "local" | "supabase";
}

export interface SavePlanPayload {
  email: string;
  newsletter: boolean;
  calculatedSavings: number;
  state: {
    loans: Loan[];
    entries: PrepayEntry[];
  };
}

export interface SavePlanResult {
  ok: boolean;
  savedTo: "local" | "supabase";
  record: LeadRecord;
  message: string;
  shareId?: string;
}

function readJsonList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLeadLocal(record: LeadRecord) {
  const existing = readJsonList<LeadRecord>(LOCAL_LEADS_KEY);
  const next = [
    record,
    ...existing.filter((lead) => lead.email.toLowerCase() !== record.email.toLowerCase()),
  ];
  localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(next));
}

async function saveLeadToSupabase(payload: SavePlanPayload, capturedAtIso: string): Promise<string | null> {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const supabaseUrl = env?.VITE_SUPABASE_URL;
  const anonKey = env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/lead_captures`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        email: payload.email,
        newsletter_subscriber: payload.newsletter,
        calculated_savings: payload.calculatedSavings,
        portfolio_snapshot: payload.state,
        lead_source: "planner_save_flow",
        captured_at: capturedAtIso,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data[0]?.id || null;
    }
  } catch {
    // fallback
  }
  return null;
}

export function loadLocalLeads(): LeadRecord[] {
  return readJsonList<LeadRecord>(LOCAL_LEADS_KEY);
}

export function clearLocalLeads() {
  localStorage.removeItem(LOCAL_LEADS_KEY);
}

export async function savePlanLead(payload: SavePlanPayload): Promise<SavePlanResult> {
  const capturedAt = new Date();
  const baseRecord: LeadRecord = {
    email: payload.email,
    newsletter: payload.newsletter,
    calculatedSavings: payload.calculatedSavings,
    capturedAt: capturedAt.toLocaleString(),
    savedTo: "local",
  };

  try {
    const shareId = await saveLeadToSupabase(payload, capturedAt.toISOString());
    if (shareId) {
      const record: LeadRecord = { ...baseRecord, savedTo: "supabase" };
      writeLeadLocal(record);
      return {
        ok: true,
        savedTo: "supabase",
        record,
        shareId,
        message: "Saved to Supabase. Your share link is ready!",
      };
    }
  } catch {
    // Keep the user flow reliable when Supabase is not configured or offline.
  }

  writeLeadLocal(baseRecord);
  return {
    ok: true,
    savedTo: "local",
    record: baseRecord,
    message: "Saved locally in this browser. Configure Supabase to enable cloud shareable links.",
  };
}

export async function loadSharedPlan(shareId: string): Promise<{ loans: Loan[]; entries: PrepayEntry[] } | null> {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const supabaseUrl = env?.VITE_SUPABASE_URL;
  const anonKey = env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/lead_captures?id=eq.${shareId}`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const snapshot = data[0]?.portfolio_snapshot;
      if (snapshot && Array.isArray(snapshot.loans)) {
        return snapshot;
      }
    }
  } catch {
    // ignore
  }
  return null;
}
