# Datenbank: Bestand und Zielmodell

Quelle Bestand: `backend/supabase/migrations/` (24 Dateien, 20260726–20261112), ausgewertet am 17.11.2026 per Textsuche (`CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`). **In diesem Inkrement wurde keine Migration angelegt oder ausgeführt.** Ob alle Migrationen im Supabase-Projekt tatsächlich angewendet sind, ist **unbekannt** (bekannt offen: `20261112_coach_codes.sql`).

## Bestehende Tabellen (41 Stück, per Textsuche)
`users, app_state, admins, coaches, coach_codes, coach_einladungen, coach_slots, coach_dossier, coach_beitraege, klientinnen, termine, nachrichten, anfragen, angebote, materialien, kurs_module, kurs_fortschritt, community_posts, community_herzen, community_meldungen, gemeinschaft, gemeinschaft_herz, gemeinschaft_gesehen, challenge, entries, journey_templates, journey_steps, journey_runs, session_notizen, stimm_profile, content_embeddings, chat_history, ki_nutzung, fairness_checks, app_events, push_abos, tageserinnerung, interessentinnen, einladungen, beduerfnis_profil, audio_cache …`

## Abgleich mit den Pflicht-Entities (Masterplan 11)

Legende: ✅ vorhanden · 🟡 teilweise / anders benannt · ❌ fehlt · ❓ unklar

| Domäne | Pflicht-Entities | Bestand | Bewertung |
|---|---|---|---|
| Identity | users, profiles, roles, user_roles, consents, sessions | `users`, Supabase `auth.users`, `admins`, `coaches` (Rolle als Flag) | 🟡 Rollen nicht generisch, **consents ❌** |
| Experts | expert_applications, interview_reviews, expert_profiles, credentials, expert_approvals, seller_accounts | `coaches`, `coach_dossier`, `coach_codes` | 🟡 Profil vorhanden, **Bewerbungs-/Prüfprozess ❌**, seller_accounts ❌ |
| Community | groups, group_members, posts, comments, reports, blocks, notifications | `community_posts`, `community_meldungen`, `community_herzen`, `gemeinschaft*` | 🟡 Posts/Meldungen ja; Gruppen, Kommentare, **Blockieren ❓** |
| Learning | courses, modules, lessons, media_assets, enrollments, learning_progress | `kurs_module`, `kurs_fortschritt`, `materialien` | 🟡 einfache Kursstruktur, keine Entitlements |
| Commerce | products, prices, orders, order_items, payments, refunds, payment_events, entitlements, commission_rules, payouts | `angebote` (Coach-Angebote) | ❌ praktisch vollständig offen |
| Live/Booking | events, registrations, zoom_connections, recordings, replay_approvals, services, availability, bookings | `termine`, `coach_slots`, `termin_erinnerungen` | 🟡 1:1-Termine ja, Live-Events/Zoom ❌ |
| AI | matching_preferences, recommendations, ai_usage | `ki_nutzung`, `beduerfnis_profil`, `fairness_checks` | 🟡 Nutzung/Fairness ja, Matching ❌ |
| Gamification | challenges, tasks, submissions, points_ledger, badges, rewards, redemptions | `challenge`; Punkte heute im `app_state`-JSON (clientseitig) | ❌ **kein Ledger** – Masterplan-Regel verletzt, Umbau in Phase 7 |
| Operations | webhook_events, job_runs, audit_logs, security_events | `app_events` (anonymisiert) | ❌ |

## Zielmodell – Grundsätze für alle neuen Tabellen
1. Primärschlüssel `uuid`, `created_at`, `updated_at` (Trigger), Besitzfeld (`user_id`/`expert_id`) wo sinnvoll, `status` als `CHECK`-Enum.
2. RLS im selben Migrationsfile wie `CREATE TABLE`; Policies mit `auth.uid()`, nie Rollenstring im Client.
3. Fremdschlüssel mit bewusster `ON DELETE`-Regel; Lösch-/Aufbewahrungsregel als Kommentar je Tabelle (`COMMENT ON TABLE`).
4. Ledger-Tabellen (`points_ledger`, `payment_events`, `audit_logs`) **append-only**: kein `UPDATE`/`DELETE`-Recht für `authenticated`.
5. Idempotenz: `webhook_events UNIQUE(provider, event_id)`; `points_ledger UNIQUE(user_id, task_completion_id, reward_type)`; `entitlements UNIQUE(user_id, product_id, order_item_id)`.

## Erste Migration Phase 2 (Entwurf, noch nicht geschrieben)
`roles(key text pk)` · `user_roles(user_id, role_key, granted_by, granted_at, revoked_at)` · `consents(id, user_id, zweck, version, erteilt_at, widerrufen_at, quelle)` · `audit_logs(id, actor_id, aktion, objekt, objekt_id, vorher jsonb, nachher jsonb, at)`.
Migrationspfad: bestehende `coaches.ist_coach = true` → `user_roles(role_key='expertin_legacy')`; `admins` → `role_key='admin'`. Rückwärtsplan: neue Tabellen droppen, Altspalten bleiben bis zur Abnahme unangetastet.
