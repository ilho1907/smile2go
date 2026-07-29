-- smile2go · Katman 1 · Baustein 6: Knowledge Brain
-- Semantische Suche über die EIGENEN Inhalte der Coachin (Transkripte, Posts, Impulse, Workbooks).
-- Grundsatz: Es wird nur gefunden, was wirklich da ist. Kein Treffer = "nichts gefunden",
-- niemals erfundene Inhalte (das erzwingt der Prompt im Frontend).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  quelle TEXT NOT NULL,                   -- 'session_notiz' | 'impuls' | 'post' | 'workbook' | 'upload'
  quelle_id UUID,                          -- optionaler Rückbezug auf den Ursprungsdatensatz
  titel TEXT NOT NULL,                     -- für die Quellenangabe im Suchergebnis
  chunk TEXT NOT NULL,                     -- der eingebettete Textabschnitt
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(1536),                  -- OpenAI text-embedding-3-small / kompatible Dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coachin sieht nur eigene Inhalte" ON content_embeddings
  FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coachin legt nur eigene Inhalte an" ON content_embeddings
  FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coachin loescht nur eigene Inhalte" ON content_embeddings
  FOR DELETE USING (auth.uid() = coach_id);

-- Ähnlichkeitsindex (Cosine). ivfflat braucht Daten für gute Listen-Wahl —
-- bei kleinen Beständen ist der sequentielle Scan ohnehin schnell genug.
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vec
  ON content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_coach ON content_embeddings (coach_id);

-- Suchfunktion: SECURITY INVOKER, damit die RLS der Basistabelle greift und
-- keine Coachin je die Inhalte einer anderen sieht.
CREATE OR REPLACE FUNCTION suche_inhalte(
  anfrage_embedding vector(1536),
  treffer_limit INTEGER DEFAULT 5,
  min_aehnlichkeit FLOAT DEFAULT 0.25
)
RETURNS TABLE (id UUID, titel TEXT, quelle TEXT, chunk TEXT, aehnlichkeit FLOAT)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT ce.id, ce.titel, ce.quelle, ce.chunk,
         1 - (ce.embedding <=> anfrage_embedding) AS aehnlichkeit
  FROM content_embeddings ce
  WHERE ce.embedding IS NOT NULL
    AND 1 - (ce.embedding <=> anfrage_embedding) >= min_aehnlichkeit
  ORDER BY ce.embedding <=> anfrage_embedding
  LIMIT treffer_limit;
$$;

-- ── Fallback ohne Embedding-Anbieter ────────────────────────────────────────
-- Ehrlich: Für echte semantische Suche braucht es einen Embedding-Anbieter
-- (OpenAI/Voyage/Mistral — Claude bietet keine Embeddings). Solange kein Schlüssel
-- hinterlegt ist, arbeitet die Suche mit deutscher Volltextsuche. Damit ist der
-- Baustein ab Tag 1 nutzbar und wird später ohne Datenmigration semantisch.
ALTER TABLE content_embeddings
  ADD COLUMN IF NOT EXISTS such_vektor tsvector
  GENERATED ALWAYS AS (to_tsvector('german', coalesce(titel, '') || ' ' || coalesce(chunk, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_content_embeddings_fts
  ON content_embeddings USING gin (such_vektor);

CREATE OR REPLACE FUNCTION suche_inhalte_text(
  anfrage TEXT,
  treffer_limit INTEGER DEFAULT 5
)
RETURNS TABLE (id UUID, titel TEXT, quelle TEXT, chunk TEXT, aehnlichkeit FLOAT)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT ce.id, ce.titel, ce.quelle, ce.chunk,
         ts_rank(ce.such_vektor, websearch_to_tsquery('german', anfrage))::FLOAT AS aehnlichkeit
  FROM content_embeddings ce
  WHERE ce.such_vektor @@ websearch_to_tsquery('german', anfrage)
  ORDER BY aehnlichkeit DESC
  LIMIT treffer_limit;
$$;
