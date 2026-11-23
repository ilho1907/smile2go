/**
 * Legt fest, mit welcher Agent-Version NEUE Sessions starten (Rollback / Roll-forward).
 *
 *   npm run agent:pin -- 2
 *
 * Bestehende Klientinnen-Sessions mit anderer Version werden beim nächsten Chat durch eine
 * neue Session ersetzt (Kontext kommt dann wieder aus get_client_context).
 */
import { AGENT_CONFIG_PATH, loadAgentConfig, writeJsonAtomic } from "../src/config.js";
import { createClient } from "../src/client.js";

const target = Number(process.argv[2]);
if (!Number.isInteger(target) || target < 1) {
  console.error("Aufruf: npm run agent:pin -- <versionsnummer>   (Liste: npm run agent:versions)");
  process.exit(1);
}

const client = createClient();
const cfg = loadAgentConfig();

let exists = false;
// BETA: client.beta.agents.versions.list
for await (const v of client.beta.agents.versions.list(cfg.agent_id)) {
  if (v.version === target) exists = true;
}
if (!exists) {
  console.error(`Version ${target} existiert nicht. Siehe: npm run agent:versions`);
  process.exit(1);
}

writeJsonAtomic(AGENT_CONFIG_PATH, { ...cfg, pinned_version: target, updated_at: new Date().toISOString() });
console.log(`Neue Sessions nutzen ab jetzt Version ${target} (neueste vorhandene: ${cfg.agent_version}).`);
if (target !== cfg.agent_version) {
  console.log("Hinweis: prompts/ilho.md entspricht evtl. nicht mehr der gepinnten Version. Vor dem nächsten `agent:update` Datei per Git zurücksetzen.");
}
