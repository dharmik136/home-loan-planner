import type { Loan, PrepayEntry } from "../engine/planning";
import { supabaseUrl, supabaseAnonKey } from "./supabase";

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

function isSharedPlan(value: unknown): value is { loans: Loan[]; entries: PrepayEntry[] } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { loans?: unknown; entries?: unknown };
  return Array.isArray(candidate.loans) && Array.isArray(candidate.entries);
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
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const shareId = crypto.randomUUID();

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/lead_captures`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        email: payload.email,
        newsletter_subscriber: payload.newsletter,
        calculated_savings: payload.calculatedSavings,
        portfolio_snapshot: payload.state,
        share_token: shareId,
        lead_source: "planner_save_flow",
        captured_at: capturedAtIso,
      }),
    });

    if (response.ok) {
      return shareId;
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
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(shareId)) {
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/get_shared_plan`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_share_token: shareId }),
    });

    if (response.ok) {
      const snapshot: unknown = await response.json();
      if (isSharedPlan(snapshot)) {
        return snapshot;
      }
    }
  } catch {
    // ignore
  }
  return null;
}
