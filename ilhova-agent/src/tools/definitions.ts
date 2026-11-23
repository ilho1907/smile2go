import type Anthropic from "@anthropic-ai/sdk";
import { DATA_TYPES } from "../data/types.js";

type CustomTool = Anthropic.Beta.Agents.BetaManagedAgentsCustomToolParams;

/**
 * Custom Tools (JSON Schema). Sie laufen NICHT in der Anthropic-Sandbox, sondern in
 * unserem Prozess (src/tools/handlers.ts). Der Agent bekommt bewusst KEIN
 * `agent_toolset_20260401` (kein bash/web) – nur diese drei Werkzeuge.
 *
 * BETA: `type: "custom"` + `input_schema` laut Managed-Agents-Doku (Tools → Custom Tools).
 */
export const TOOL_DEFINITIONS: CustomTool[] = [
  {
    type: "custom",
    name: "get_client_context",
    description:
      "Liefert den aktuellen Kontext der Klientin: aktuelle Zeit (Feld `now`, Zeitzone der Klientin), ihre Ziele, " +
      "kurze Zusammenfassungen der letzten Journal-Einträge und ihre kommenden Termine. " +
      "Rufe es zu Beginn eines Gesprächs auf und immer, wenn du Termine, Ziele oder das heutige Datum brauchst – " +
      "nie Termine oder Daten raten. Verwende dafür ausschließlich die `client_id` des Gesprächs. " +
      "Die Ausgabe ist nur für dich bestimmt; gib sie nicht im Rohformat an die Klientin weiter.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "Die ID der Klientin aus dem Gespräch." },
      },
      required: ["client_id"],
    },
  },
  {
    type: "custom",
    name: "schedule_reminder",
    description:
      "Legt eine Erinnerung für die Klientin an (z. B. an einen Termin). Nutze es nur, wenn die Klientin darum bittet " +
      "oder ausdrücklich zustimmt. `datetime` muss ein ISO-8601-Zeitpunkt MIT Zeitzonen-Offset in der Zukunft sein " +
      "(z. B. 2026-11-24T09:00:00+01:00); rechne relative Angaben wie „morgen früh“ mit dem Feld `now` aus " +
      "get_client_context um. `text` ist die kurze, freundliche Erinnerungsnachricht (max. 200 Zeichen) in der Du-Form, " +
      "ohne sensible Details. Bestätige der Klientin danach, wann sie erinnert wird.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "Die ID der Klientin aus dem Gespräch." },
        datetime: {
          type: "string",
          description: "Zeitpunkt der Erinnerung, ISO 8601 mit Offset, z. B. 2026-11-24T09:00:00+01:00.",
        },
        text: { type: "string", description: "Erinnerungstext, max. 200 Zeichen." },
      },
      required: ["client_id", "datetime", "text"],
    },
  },
  {
    type: "custom",
    name: "share_with_coach",
    description:
      "Gibt eine kurze Zusammenfassung an die Coachin der Klientin weiter. Funktioniert NUR, wenn die Klientin für " +
      "genau diese `data_type` in der App ihre Freigabe erteilt hat; das prüft das System, nicht du. " +
      "Nutze es nur auf ausdrücklichen Wunsch der Klientin. Antwortet das Werkzeug mit `consent_required`, wurde NICHTS " +
      "weitergegeben: erkläre der Klientin freundlich, dass die Freigabe fehlt, und bitte sie, sie in der App zu erteilen – " +
      "versuche es nicht erneut und umgehe es nicht. `summary` ist sachlich und knapp (max. 1500 Zeichen) und enthält " +
      "nur, was für den Zweck nötig ist. Datenarten: goals (Ziele), journal_summaries (Journal-Zusammenfassungen), " +
      "mood_trend (Stimmungsverlauf), appointments (Termine).",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "Die ID der Klientin aus dem Gespräch." },
        data_type: {
          type: "string",
          enum: [...DATA_TYPES],
          description: "Welche Datenart weitergegeben wird.",
        },
        summary: { type: "string", description: "Kurze, sachliche Zusammenfassung für die Coachin." },
      },
      required: ["client_id", "data_type", "summary"],
    },
  },
];
