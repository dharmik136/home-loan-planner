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

async function saveLeadToSupabase(payload: SavePlanPayload, capturedAtIso: string): Promise<boolean> {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const supabaseUrl = env?.VITE_SUPABASE_URL;
  const anonKey = env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return false;

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/lead_captures`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
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

  return response.ok;
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
    const savedRemote = await saveLeadToSupabase(payload, capturedAt.toISOString());
    if (savedRemote) {
      const record: LeadRecord = { ...baseRecord, savedTo: "supabase" };
      writeLeadLocal(record);
      return {
        ok: true,
        savedTo: "supabase",
        record,
        message: "Saved to Supabase and mirrored locally for this browser.",
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
    message: "Saved locally in this browser. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sync remotely.",
  };
}
