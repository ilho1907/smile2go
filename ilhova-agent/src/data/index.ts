import type { DataLayer } from "./types.js";
import { MockDataLayer } from "./mock.js";

/**
 * Einziger Austauschpunkt: Hier später die Supabase-/smile2go-API-Implementierung
 * zurückgeben (z. B. `new SupabaseDataLayer(...)`), sobald sie `DataLayer` erfüllt.
 */
export function createDataLayer(): DataLayer {
  return new MockDataLayer();
}
