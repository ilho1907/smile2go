import { config as loadDotenv } from "dotenv";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ANTHROPIC_API_KEY wird nur aus .env gelesen (override: true → eine evtl. gesetzte
// Shell-Variable wird bewusst ignoriert).
loadDotenv({ path: join(ROOT, ".env"), override: true, quiet: true });

export const AGENT_CONFIG_PATH = process.env.AGENT_CONFIG_PATH
  ? resolve(ROOT, process.env.AGENT_CONFIG_PATH)
  : join(ROOT, "config", "agent.json");
export const PROMPT_PATH = join(ROOT, "prompts", "ilho.md");
export const SESSION_STORE_PATH = process.env.SESSION_STORE_PATH
  ? resolve(ROOT, process.env.SESSION_STORE_PATH)
  : join(ROOT, "data", "sessions.json");
export const USAGE_LOG_PATH = process.env.USAGE_LOG_PATH
  ? resolve(ROOT, process.env.USAGE_LOG_PATH)
  : join(ROOT, "logs", "usage.jsonl");

export function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`${name} fehlt. Kopiere .env.example nach .env und trage den Wert ein.`);
  }
  return v;
}

export const CLIENT_TIMEZONE = process.env.CLIENT_TIMEZONE?.trim() || "Europe/Berlin";
export const TURN_TIMEOUT_MS = (Number(process.env.TURN_TIMEOUT_SECONDS) || 120) * 1000;

/** Wird von scripts/setup.ts geschrieben. Enthält KEINE Geheimnisse – nur IDs. */
export interface AgentConfig {
  environment_id: string;
  agent_id: string;
  /** Neueste Agent-Version (für optimistische Updates). */
  agent_version: number;
  /** Version, mit der neue Sessions gestartet werden (Rollback = hier eine ältere Version eintragen). */
  pinned_version: number;
  model: string;
  prompt_sha256: string;
  created_at: string;
  updated_at: string;
}

export function loadAgentConfig(): AgentConfig {
  if (!existsSync(AGENT_CONFIG_PATH)) {
    throw new Error("config/agent.json fehlt. Führe zuerst `npm run setup` aus.");
  }
  const cfg = JSON.parse(readFileSync(AGENT_CONFIG_PATH, "utf8")) as Partial<AgentConfig>;
  if (!cfg.agent_id || !cfg.environment_id || !cfg.pinned_version) {
    throw new Error("config/agent.json ist unvollständig. Führe `npm run setup` erneut aus (siehe README).");
  }
  return cfg as AgentConfig;
}

export function writeJsonAtomic(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
  renameSync(tmp, path);
}
