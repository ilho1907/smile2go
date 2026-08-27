#!/bin/bash
# smile2go · Alles-in-einem: Datenbank, Edge Functions, Secrets.
# Voraussetzung: das Supabase-Projekt ist wach (Dashboard → "Restore project").
# Aufruf:  bash backend/scripts/cloud-einrichten.sh
set -e
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH

echo "▸ 1/4 · Projektstatus"
if supabase projects list -o json 2>/dev/null | grep -q '"status": "INACTIVE"'; then
  echo "  ✗ Das Projekt schläft noch. Erst im Dashboard auf 'Restore project' drücken."
  exit 1
fi
echo "  ✓ wach"

echo "▸ 2/4 · Migrationen einspielen"
supabase db push --linked

echo "▸ 3/4 · Edge Functions ausrollen"
supabase functions deploy konto-loeschen
supabase functions deploy push

echo "▸ 4/4 · Push-Secrets setzen"
if [ -f .secrets.local ]; then
  # shellcheck disable=SC1091
  set -a; . ./.secrets.local; set +a
  supabase secrets set \
    VAPID_PUBLIC_KEY="$VAPID_PUBLIC_KEY" \
    VAPID_PRIVATE_KEY="$VAPID_PRIVATE_KEY" \
    VAPID_SUBJECT="mailto:hallo@smile2go.app"
  echo "  ✓ gesetzt"
else
  echo "  ! backend/.secrets.local fehlt — Push bleibt aus"
fi

echo
echo "Fertig. Jetzt noch einmalig backend/SETUP-EINMAL.sql im SQL-Editor ausführen"
echo "(legt Coach-Profil, Einladungscode und freie Zeitfenster an)."
