/**
 * Datenschicht-Schnittstelle des ilhova agent.
 *
 * Die Tool-Handler sprechen NUR mit diesem Interface. Aktuell steckt dahinter
 * ein Mock (mock.ts). Später: eine zweite Implementierung (Supabase oder die
 * smile2go-API) schreiben und in src/data/index.ts austauschen – sonst ändert
 * sich nichts.
 */

export const DATA_TYPES = ["goals", "journal_summaries", "mood_trend", "appointments"] as const;
export type DataType = (typeof DATA_TYPES)[number];

export interface Goal {
  id: string;
  title: string;
  status: "aktiv" | "erreicht" | "pausiert";
}

export interface JournalSummary {
  date: string; // YYYY-MM-DD
  summary: string;
}

export interface Appointment {
  id: string;
  starts_at: string; // ISO 8601 mit Offset
  title: string;
  coach_name: string;
  location: string;
}

export interface ClientContext {
  /** Aktuelle Zeit der Klientin (ISO 8601 mit Offset) – Basis für relative Zeitangaben. */
  now: string;
  weekday: string;
  timezone: string;
  first_name: string;
  goals: Goal[];
  recent_journal_summaries: JournalSummary[];
  upcoming_appointments: Appointment[];
}

export interface Reminder {
  id: string;
  client_id: string;
  send_at: string; // ISO 8601 mit Offset
  text: string;
  created_at: string;
}

export interface CoachShare {
  id: string;
  client_id: string;
  data_type: DataType;
  summary: string;
  shared_at: string;
}

export interface DataLayer {
  /** null = Klientin unbekannt. */
  getClientContext(clientId: string): Promise<ClientContext | null>;
  createReminder(input: { clientId: string; sendAt: Date; text: string }): Promise<Reminder>;
  /** Maßgebliche Prüfung der Einwilligung (Quelle der Wahrheit ist die App/DB, nicht der Agent). */
  hasConsent(clientId: string, dataType: DataType): Promise<boolean>;
  createCoachShare(input: { clientId: string; dataType: DataType; summary: string }): Promise<CoachShare>;
}
