/** Listet alle Versionen des Agents; markiert die gepinnte (npm run agent:versions). */
import { loadAgentConfig } from "../src/config.js";
import { createClient } from "../src/client.js";

const client = createClient();
const cfg = loadAgentConfig();

// BETA: client.beta.agents.versions.list
for await (const v of client.beta.agents.versions.list(cfg.agent_id)) {
  const marks = [v.version === cfg.pinned_version ? "◀ gepinnt (neue Sessions)" : "", v.version === cfg.agent_version ? "(neueste)" : ""]
    .filter(Boolean)
    .join(" ");
  const sha = (v.metadata as Record<string, string> | undefined)?.prompt_sha256 ?? "-";
  console.log(`v${v.version}  ${v.updated_at}  model=${typeof v.model === "string" ? v.model : v.model.id}  prompt=${sha}  ${marks}`);
}
