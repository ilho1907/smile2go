/**
 * Löscht die Session einer Klientin bei Anthropic (Transkript!) und den lokalen Eintrag.
 * Gedacht für Löschanfragen (DSGVO Art. 17) und Aufräumen nach Tests.
 *
 *   npm run session:delete -- <client_id>
 */
import { createClient } from "../src/client.js";
import { SessionStore } from "../src/sessionStore.js";

const clientId = process.argv[2];
if (!clientId) {
  console.error("Aufruf: npm run session:delete -- <client_id>");
  process.exit(1);
}
const store = new SessionStore();
const entry = store.get(clientId);
if (!entry) {
  console.error(`Keine Session für ${clientId} im lokalen Speicher.`);
  process.exit(1);
}
const client = createClient();
// BETA: client.beta.sessions.delete
await client.beta.sessions.delete(entry.session_id);
store.remove(clientId);
console.log(`Session ${entry.session_id} gelöscht.`);
