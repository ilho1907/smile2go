import { existsSync, readFileSync } from "node:fs";
import { SESSION_STORE_PATH, writeJsonAtomic } from "./config.js";

export interface StoredSession {
  session_id: string;
  /** Agent-Version, mit der die Session erstellt wurde (Sessions bleiben an diese Version gepinnt). */
  agent_version: number;
  created_at: string;
  last_used_at: string;
  turns: number;
}

/**
 * client_id → session_id. Einfache JSON-Datei (reicht für den Pilot, ein Prozess).
 * Für Produktion mit mehreren Instanzen: in die Datenbank verlagern (gleiche Schnittstelle).
 */
export class SessionStore {
  private map: Record<string, StoredSession> = {};

  constructor(private path: string = SESSION_STORE_PATH) {
    if (existsSync(path)) {
      this.map = JSON.parse(readFileSync(path, "utf8")) as Record<string, StoredSession>;
    }
  }

  get(clientId: string): StoredSession | undefined {
    return this.map[clientId];
  }

  set(clientId: string, s: StoredSession): void {
    this.map[clientId] = s;
    writeJsonAtomic(this.path, this.map);
  }

  remove(clientId: string): void {
    delete this.map[clientId];
    writeJsonAtomic(this.path, this.map);
  }
}
