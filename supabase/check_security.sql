-- Verificación de protección de endpoints (solo lectura, seguro de ejecutar).
-- Pégalo en el SQL editor de Supabase y ejecútalo por bloques.
--
-- 1) RLS activado en las 6 tablas (todo debe salir rowsecurity = true).
--    Si alguna sale en false o no aparece, ese endpoint está DESPROTEGIDO.
SELECT tablename, rowsecurity AS rls_activado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('routines', 'exercises', 'routine_exercises', 'workout_sessions', 'set_logs', 'profiles')
ORDER BY tablename;

-- 2) Políticas por tabla: cada una debe tener 4 (select/insert/update/delete)
--    limitadas a sus propias filas (auth.uid() = user_id).
SELECT tablename, policyname, cmd AS operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('routines', 'exercises', 'routine_exercises', 'workout_sessions', 'set_logs', 'profiles')
ORDER BY tablename, operacion;

-- 3) Conteo rápido: debe dar 24 filas (6 tablas x 4 políticas).
SELECT count(*) AS total_politicas
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('routines', 'exercises', 'routine_exercises', 'workout_sessions', 'set_logs', 'profiles');
