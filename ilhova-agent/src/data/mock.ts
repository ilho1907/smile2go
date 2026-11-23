import { randomUUID } from "node:crypto";
import { CLIENT_TIMEZONE } from "../config.js";
import { formatInZone, localTime, weekdayDe } from "../time.js";
import type { ClientContext, CoachShare, DataLayer, DataType, Reminder } from "./types.js";
import { DATA_TYPES } from "./types.js";

/**
 * Mock-Datenschicht: ausschließlich ERFUNDENE Daten, nur im Speicher.
 * Zusätzlich zu DataLayer gibt es Test-Helfer (grantConsent, listReminders, …),
 * die in der echten Implementierung nicht existieren (dort setzt die App die Einwilligung).
 */
export const MOCK_CLIENT_ID = "mock-client-001";

export class MockDataLayer implements DataLayer {
  private consents = new Map<string, Set<DataType>>();
  private reminders: Reminder[] = [];
  private shares: CoachShare[] = [];
  private knownClients = new Set<string>([MOCK_CLIENT_ID]);

  constructor(private tz: string = CLIENT_TIMEZONE, private clock: () => Date = () => new Date()) {
    // Ausgangslage: Ziele + Termine dürfen geteilt werden, Journal + Stimmung NICHT.
    this.consents.set(MOCK_CLIENT_ID, new Set<DataType>(["goals", "appointments"]));
  }

  async getClientContext(clientId: string): Promise<ClientContext | null> {
    if (!this.knownClients.has(clientId)) return null;
    const now = this.clock();
    return {
      now: formatInZone(now, this.tz),
      weekday: weekdayDe(now, this.tz),
      timezone: this.tz,
      first_name: "Mia (Testdaten)",
      goals: [
        { id: "g1", title: "Jeden Morgen 10 Minuten Stille", status: "aktiv" },
        { id: "g2", title: "Klarer Nein sagen im Job", status: "aktiv" },
      ],
      recent_journal_summaries: [
        { date: formatInZone(localTime(now, -2, 20, 0, this.tz), this.tz).slice(0, 10), summary: "Erschöpft nach einer langen Woche, dankbar für einen ruhigen Spaziergang." },
        { date: formatInZone(localTime(now, -5, 20, 0, this.tz), this.tz).slice(0, 10), summary: "Streit im Team, danach Atemübung geholfen." },
      ],
      upcoming_appointments: [
        {
          id: "a1",
          starts_at: formatInZone(localTime(now, 3, 10, 0, this.tz), this.tz),
          title: "Coaching-Gespräch",
          coach_name: "Coachin Lena (Testdaten)",
          location: "Video-Call",
        },
        {
          id: "a2",
          starts_at: formatInZone(localTime(now, 10, 16, 30, this.tz), this.tz),
          title: "Mondritual-Workshop",
          coach_name: "Coachin Lena (Testdaten)",
          location: "Studio Mitte",
        },
      ],
    };
  }

  async createReminder(input: { clientId: string; sendAt: Date; text: string }): Promise<Reminder> {
    const r: Reminder = {
      id: `rem_${randomUUID().slice(0, 8)}`,
      client_id: input.clientId,
      send_at: formatInZone(input.sendAt, this.tz),
      text: input.text,
      created_at: formatInZone(this.clock(), this.tz),
    };
    this.reminders.push(r);
    return r;
  }

  async hasConsent(clientId: string, dataType: DataType): Promise<boolean> {
    return this.consents.get(clientId)?.has(dataType) ?? false;
  }

  async createCoachShare(input: { clientId: string; dataType: DataType; summary: string }): Promise<CoachShare> {
    const s: CoachShare = {
      id: `shr_${randomUUID().slice(0, 8)}`,
      client_id: input.clientId,
      data_type: input.dataType,
      summary: input.summary,
      shared_at: formatInZone(this.clock(), this.tz),
    };
    this.shares.push(s);
    return s;
  }

  // ---- nur für Tests / Mock ----
  grantConsent(clientId: string, dataType: DataType): void {
    if (!DATA_TYPES.includes(dataType)) throw new Error(`Unbekannter data_type: ${dataType}`);
    if (!this.consents.has(clientId)) this.consents.set(clientId, new Set());
    this.consents.get(clientId)!.add(dataType);
  }
  revokeConsent(clientId: string, dataType: DataType): void {
    this.consents.get(clientId)?.delete(dataType);
  }
  /** Legt eine (erfundene) Klientin an und setzt, wofür sie die Weitergabe an die Coachin erlaubt hat. */
  addClient(clientId: string, consents: DataType[] = []): void {
    this.knownClients.add(clientId);
    this.consents.set(clientId, new Set(consents));
  }
  listReminders(clientId?: string): Reminder[] {
    return this.reminders.filter((r) => !clientId || r.client_id === clientId);
  }
  listShares(clientId?: string): CoachShare[] {
    return this.shares.filter((s) => !clientId || s.client_id === clientId);
  }
}
