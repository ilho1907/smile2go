import type { DataLayer, DataType } from "../data/types.js";
import { DATA_TYPES } from "../data/types.js";
import { formatInZone } from "../time.js";

export interface ToolContext {
  /** Die Klientin, zu der DIESE Session gehört – nicht, was das Modell behauptet. */
  clientId: string;
  data: DataLayer;
  timezone: string;
  now?: () => Date;
}

export interface ToolOutcome {
  is_error: boolean;
  /** Wird als Text an den Agenten zurückgegeben. */
  payload: Record<string, unknown>;
}

const err = (error: string, message: string, extra: Record<string, unknown> = {}): ToolOutcome => ({
  is_error: true,
  payload: { ok: false, error, message, ...extra },
});
const ok = (payload: Record<string, unknown>): ToolOutcome => ({ is_error: false, payload: { ok: true, ...payload } });

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export async function runTool(name: string, rawInput: unknown, ctx: ToolContext): Promise<ToolOutcome> {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as Record<string, unknown>;

  // Sicherheitsnetz: Das Modell darf nur für die Klientin dieser Session handeln.
  if (input.client_id !== ctx.clientId) {
    return err(
      "client_id_mismatch",
      "Die client_id passt nicht zu diesem Gespräch. Verwende ausschließlich die client_id der aktuellen Klientin.",
    );
  }

  try {
    switch (name) {
      case "get_client_context":
        return await getClientContext(ctx);
      case "schedule_reminder":
        return await scheduleReminder(input, ctx);
      case "share_with_coach":
        return await shareWithCoach(input, ctx);
      default:
        return err("unknown_tool", `Unbekanntes Werkzeug: ${name}`);
    }
  } catch (e) {
    // Interne Fehler nicht im Detail an das Modell geben.
    console.error(`[tool:${name}] interner Fehler:`, e);
    return err("internal_error", "Das hat gerade technisch nicht geklappt. Sag der Klientin ehrlich Bescheid und biete an, es später erneut zu versuchen.");
  }
}

async function getClientContext(ctx: ToolContext): Promise<ToolOutcome> {
  const context = await ctx.data.getClientContext(ctx.clientId);
  if (!context) return err("unknown_client", "Zu dieser client_id sind keine Daten vorhanden.");
  return ok({ context });
}

async function scheduleReminder(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
  const datetime = input.datetime;
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (typeof datetime !== "string" || !ISO_WITH_OFFSET.test(datetime)) {
    return err("invalid_datetime", "datetime muss ISO 8601 mit Zeitzonen-Offset sein, z. B. 2026-11-24T09:00:00+01:00.");
  }
  const sendAt = new Date(datetime);
  if (Number.isNaN(sendAt.getTime())) return err("invalid_datetime", "datetime ist kein gültiger Zeitpunkt.");
  const now = (ctx.now ?? (() => new Date()))();
  if (sendAt.getTime() <= now.getTime() + 60_000) {
    return err("datetime_in_past", "Der Zeitpunkt liegt in der Vergangenheit. Prüfe `now` aus get_client_context.", {
      now: formatInZone(now, ctx.timezone),
    });
  }
  if (sendAt.getTime() > now.getTime() + 366 * 86_400_000) {
    return err("datetime_too_far", "Erinnerungen sind maximal 1 Jahr im Voraus möglich.");
  }
  if (text.length < 1 || text.length > 200) {
    return err("invalid_text", "text muss 1–200 Zeichen lang sein.");
  }
  const reminder = await ctx.data.createReminder({ clientId: ctx.clientId, sendAt, text });
  return ok({ reminder_id: reminder.id, send_at: reminder.send_at, text: reminder.text });
}

async function shareWithCoach(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
  const dataType = input.data_type;
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  if (typeof dataType !== "string" || !(DATA_TYPES as readonly string[]).includes(dataType)) {
    return err("invalid_data_type", `data_type muss einer von ${DATA_TYPES.join(", ")} sein.`);
  }
  if (summary.length < 1 || summary.length > 1500) {
    return err("invalid_summary", "summary muss 1–1500 Zeichen lang sein.");
  }
  const type = dataType as DataType;

  // Maßgebliche Einwilligungsprüfung – serverseitig, unabhängig vom Prompt.
  if (!(await ctx.data.hasConsent(ctx.clientId, type))) {
    return err(
      "consent_required",
      `Die Klientin hat für „${type}“ keine Freigabe für ihre Coachin erteilt. Es wurde NICHTS weitergegeben. ` +
        "Bitte die Klientin freundlich, die Freigabe in der App unter Datenschutz → Freigaben für meine Coachin zu erteilen. " +
        "Versuche es nicht erneut, bevor sie bestätigt, dass sie die Freigabe erteilt hat.",
      { data_type: type },
    );
  }
  const share = await ctx.data.createCoachShare({ clientId: ctx.clientId, dataType: type, summary });
  return ok({ share_id: share.id, data_type: share.data_type, shared_at: share.shared_at });
}
