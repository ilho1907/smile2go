/**
 * Einmaliges Setup: legt Environment + Agent an und schreibt IDs/Version nach config/agent.json.
 *
 *   npm run setup            # nur wenn config/agent.json noch nicht existiert
 *
 * Der Agent wird NICHT bei jedem Start neu erzeugt. Änderungen am Prompt/an den Tools:
 * `npm run agent:update` (erzeugt eine neue Version desselben Agents).
 */
import { existsSync, readFileSync } from "node:fs";
import { AGENT_CONFIG_PATH, type AgentConfig, writeJsonAtomic } from "../src/config.js";
import { createClient } from "../src/client.js";
import { MODEL, buildAgentDefinition, loadSystemPrompt } from "../src/agent/definition.js";
// Modellwahl + Hinweis auf günstigere Modelle: siehe src/agent/definition.ts (MODEL).

const client = createClient();

let partial: Partial<AgentConfig> = {};
if (existsSync(AGENT_CONFIG_PATH)) {
  partial = JSON.parse(readFileSync(AGENT_CONFIG_PATH, "utf8"));
  if (partial.agent_id) {
    console.error(
      `config/agent.json existiert bereits (Agent ${partial.agent_id}, Version ${partial.agent_version}).\n` +
        "Setup läuft nur einmal. Für Änderungen: `npm run agent:update`.",
    );
    process.exit(1);
  }
  console.log("Unvollständige config/agent.json gefunden – vorhandenes Environment wird wiederverwendet.");
}

// 1) Environment (Cloud-Sandbox-Konfiguration). Der Agent nutzt keine Sandbox-Tools;
//    trotzdem verlangt jede Session ein Environment. Netzwerk: eingeschränkt, KEINE Hosts erlaubt.
// BETA: client.beta.environments.create
let environmentId = partial.environment_id;
if (!environmentId) {
  const env = await client.beta.environments.create({
    name: "ilhova-pilot",
    config: { type: "cloud", networking: { type: "limited", allow_package_managers: false, allow_mcp_servers: false } },
  });
  environmentId = env.id;
  writeJsonAtomic(AGENT_CONFIG_PATH, { environment_id: environmentId }); // Zwischenstand sichern
  console.log(`Environment angelegt: ${environmentId}`);
}

// 2) Agent (versioniert; Version startet bei 1)
// BETA: client.beta.agents.create
const agent = await client.beta.agents.create(buildAgentDefinition());
const now = new Date().toISOString();
const config: AgentConfig = {
  environment_id: environmentId,
  agent_id: agent.id,
  agent_version: agent.version,
  pinned_version: agent.version,
  model: MODEL,
  prompt_sha256: loadSystemPrompt().sha256,
  created_at: now,
  updated_at: now,
};
writeJsonAtomic(AGENT_CONFIG_PATH, config);

console.log(`Agent angelegt: ${agent.id} (Version ${agent.version}, Modell ${MODEL})`);
console.log("IDs und Version gespeichert in config/agent.json");
