#!/usr/bin/env bash
# Frische Datenbank für den Oberflächentest
set -euo pipefail
cd "$(dirname "$0")"
export PGOPTIONS="--client-min-messages=warning"
psql -q -d postgres -c "DROP DATABASE IF EXISTS ilho_technik_test WITH (FORCE)" -c "CREATE DATABASE ilho_technik_test"
psql -q -v ON_ERROR_STOP=1 -d ilho_technik_test -f stubs.sql -f ../../supabase/migrations/20261124_ilho_technik.sql -f ui_seed.sql
