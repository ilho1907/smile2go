/**
 * Kostenabschätzung. Maßgeblich ist immer die Rechnung bzw. `usage.list_cost` der Session –
 * die Schätzung hier ist feiner aufgelöst (list_cost ist auf ganze Cent gerundet).
 *
 * Preise in USD pro 1 Mio. Token (Stand der Doku/Skill-Preistabelle). ANNAHME: Cache-Writes (5 min) =
 * 1,25 × Input-Preis. Bei Preisänderungen oder anderem Modell hier anpassen.
 */
interface Price {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export const PRICES_PER_MTOK: Record<string, Price> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  // ANNAHME (cacheRead = 0,1 × Input, cacheWrite = 1,25 × Input) – nicht in der Preistabelle bestätigt:
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

/** Laufzeit-Preis der Session (Managed Agents): 0,08 $/Stunde aktive Zeit. */
export const RUNTIME_USD_PER_HOUR = 0.08;

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export const emptyUsage = (): TokenUsage => ({
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
});

export interface CostEstimate {
  tokens_usd: number;
  runtime_usd: number;
  total_usd: number;
  known_model: boolean;
}

export function estimateCost(model: string, u: TokenUsage, activeSeconds: number): CostEstimate {
  const p = PRICES_PER_MTOK[model];
  const tokens_usd = p
    ? (u.input_tokens * p.input +
        u.output_tokens * p.output +
        u.cache_read_input_tokens * p.cacheRead +
        u.cache_creation_input_tokens * p.cacheWrite) /
      1_000_000
    : 0;
  const runtime_usd = (activeSeconds / 3600) * RUNTIME_USD_PER_HOUR;
  return { tokens_usd, runtime_usd, total_usd: tokens_usd + runtime_usd, known_model: Boolean(p) };
}

export const usd = (n: number) => `$${n.toFixed(n < 0.1 ? 4 : 2)}`;
