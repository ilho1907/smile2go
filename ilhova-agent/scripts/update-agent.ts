/**
 * Aktualisiert den bestehenden Agent aus prompts/ilho.md + Tool-Definitionen + Modell.
 * Erzeugt eine NEUE Version (alte Versionen bleiben erhalten → Rollback möglich).
 *
 *   npm run agent:update            # neue Version erzeugen und für neue Sessions pinnen
 *   npm run agent:update -- --no-pin   # neue Version erzeugen, aber alte weiter verwenden (Canary)
 */
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_CONFIG_PATH, loadAgentConfig, writeJsonAtomic } from "../src/config.js";
import { createClient } from "../src/client.js";
import { MODEL, buildAgentDefinition, loadSystemPrompt } from "../src/agent/definition.js";

const noPin = process.argv.includes("--no-pin");
const client = createClient();
const cfg = loadAgentConfig();
const def = buildAgentDefinition();

try {
  // BETA: client.beta.agents.update – `version` = optimistische Nebenläufigkeitskontrolle (409 bei Abweichung).
  // Array-Felder (tools) werden komplett ersetzt, weggelassene Felder bleiben erhalten.
  const updated = await client.beta.agents.update(cfg.agent_id, {
    version: cfg.agent_version,
    name: def.name,
    description: def.description,
    model: def.model,
    system: def.system,
    tools: def.tools,
    metadata: def.metadata,
  });

  if (updated.version === cfg.agent_version) {
    console.log(`Keine Änderung gegenüber Version ${cfg.agent_version} – keine neue Version erzeugt.`);
    process.exit(0);
  }

  writeJsonAtomic(AGENT_CONFIG_PATH, {
    ...cfg,
    model: MODEL,
    prompt_sha256: loadSystemPrompt().sha256,
    agent_version: updated.version,
    pinned_version: noPin ? cfg.pinned_version : updated.version,
    updated_at: new Date().toISOString(),
  });
  console.log(`Neue Agent-Version: ${updated.version} (vorher ${cfg.agent_version}).`);
  console.log(
    noPin
      ? `Neue Sessions nutzen weiterhin Version ${cfg.pinned_version}. Zum Umschalten: npm run agent:pin -- ${updated.version}`
      : `Neue Sessions nutzen ab jetzt Version ${updated.version}. Bestehende Klientinnen-Sessions wechseln beim nächsten Chat automatisch.`,
  );
} catch (e) {
  if (e instanceof Anthropic.ConflictError) {
    console.error("409: Der Agent wurde zwischenzeitlich geändert. Prüfe `npm run agent:versions` und passe config/agent.json an.");
    process.exit(1);
  }
  throw e;
}
