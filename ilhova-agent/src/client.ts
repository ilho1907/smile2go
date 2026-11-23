import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "./config.js";

// BETA: Managed Agents ist eine Beta-API. Das SDK setzt den Header
// `anthropic-beta: managed-agents-2026-04-01` automatisch bei allen
// client.beta.{agents,environments,sessions}.*-Aufrufen.
export function createClient(): Anthropic {
  return new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
}
