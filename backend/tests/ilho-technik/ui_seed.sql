-- Testpersonen für den Oberflächentest (nur lokal)
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'anna@example.org'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'berta@example.org'),
  ('cccccccc-0000-4000-8000-000000000003', 'coachin@example.org'),
  ('dddddddd-0000-4000-8000-000000000004', 'admin@example.org'),
  ('eeeeeeee-0000-4000-8000-000000000005', 'support@example.org');
INSERT INTO admins VALUES ('dddddddd-0000-4000-8000-000000000004');
INSERT INTO coaches VALUES ('cccccccc-0000-4000-8000-000000000003', true);
INSERT INTO support_team (user_id, anzeigename) VALUES
  ('dddddddd-0000-4000-8000-000000000004', 'ilho'), ('eeeeeeee-0000-4000-8000-000000000005', 'Sara (Technik)');
INSERT INTO support_regeln (kategorie, zustaendig, rang) VALUES ('technik', 'eeeeeeee-0000-4000-8000-000000000005', 10);
