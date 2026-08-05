import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table schemas (for reference)
export interface ConversationMessage {
  id: string;
  patient_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  nfb_signals?: Record<string, any>;
}

export interface NFBObservation {
  id: string;
  patient_id: string;
  domain: string; // cognitive, motor, speech, autonomic, etc.
  value: number;
  baseline: number;
  deviation: number;
  confidence: number;
  created_at: string;
}

export interface ClinicalEvent {
  id: string;
  patient_id: string;
  event_type: string; // ER visit, hospitalization, symptom onset
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: string;
  created_at: string;
}

export interface ALCSAction {
  id: string;
  patient_id: string;
  action_type: string; // call_gp, find_lab, etc.
  status: "pending" | "executed" | "failed";
  outcome: string;
  created_at: string;
}

export interface PCCAProfile {
  id: string;
  patient_id: string;
  communication_style: string;
  baseline_state: Record<string, any>;
  medical_context: Record<string, any>;
  preferences: Record<string, any>;
  system_prompt: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  patient_id: string;
  action: string;
  user_id: string;
  timestamp: string;
}