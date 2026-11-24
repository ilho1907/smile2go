#!/usr/bin/env bash
# Lokaler Testlauf: frische Datenbank, Supabase-Stubs, Migration, Tests.
# Voraussetzung: psql und ein laufendes Postgres (PGHOST/PGPORT/PGUSER setzen).
set -euo pipefail
export PGOPTIONS="--client-min-messages=warning"
cd "$(dirname "$0")"
DB=ilho_technik_test
psql -q -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB"
psql -q -v ON_ERROR_STOP=1 -d $DB -f stubs.sql
psql -q -v ON_ERROR_STOP=1 -d $DB -f ../../supabase/migrations/20261124_ilho_technik.sql
# Migration ein zweites Mal: muss wiederholbar sein
psql -q -v ON_ERROR_STOP=1 -d $DB -f ../../supabase/migrations/20261124_ilho_technik.sql
PGOPTIONS= psql -v ON_ERROR_STOP=1 -At -d $DB -f test.sql 2>&1 | grep -E "ok  |──|FEHL|ERROR|FATAL" | sed "s/^psql:[^:]*:[0-9]*: NOTICE:  /  /"
exit ${PIPESTATUS[0]}
