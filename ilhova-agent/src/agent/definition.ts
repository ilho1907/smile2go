import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PROMPT_PATH } from "../config.js";
import { TOOL_DEFINITIONS } from "../tools/definitions.js";

// Modell des Agents.
// Günstigere Alternative (einfach austauschen, dann `npm run agent:update`):
//   "claude-sonnet-5-5"  → ca. 50 % günstiger ($2/$10 pro MTok statt $4/$20)
//   "claude-haiku-5-5"   → am günstigsten, für kurze, warme Antworten oft ausreichend
// Hinweis: Nach einem Modellwechsel Ton und Tool-Verhalten mit `npm run test:session` prüfen.
export const MODEL = "claude-opus-5-5";

/**
 * Liest prompts/ilho.md. Alles oberhalb der ersten "## "-Überschrift (Titel und
 * Bearbeitungshinweise) wird NICHT an die Agentin gesendet.
 */
export function loadSystemPrompt(): { text: string; sha256: string } {
  const raw = readFileSync(PROMPT_PATH, "utf8");
  const start = raw.search(/^## /m);
  const text = (start >= 0 ? raw.slice(start) : raw).trim();
  if (text.length < 200) throw new Error("prompts/ilho.md ist ungewöhnlich kurz – bitte prüfen.");
  return { text, sha256: createHash("sha256").update(text).digest("hex") };
}

export function buildAgentDefinition() {
  const prompt = loadSystemPrompt();
  return {
    name: "ilhova agent",
    description: "Persönliche Begleiterin für Klientinnen: Termine, Erinnerungen, Weitergabe an die Coachin mit Einwilligung.",
    model: MODEL,
    system: prompt.text,
    tools: TOOL_DEFINITIONS,
    metadata: { project: "ilhova-pilot", prompt_sha256: prompt.sha256.slice(0, 16) },
  };
}
