CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS routines (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	muscle_group TEXT,
	equipment TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routine_exercises (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
	exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
	target_sets INT NOT NULL DEFAULT 2 CHECK (target_sets > 0),
	target_reps INT CHECK (target_reps > 0),
	rest_seconds INT NOT NULL CHECK (rest_seconds >= 0),
	position INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE(routine_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
	started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	ended_at TIMESTAMPTZ,
	notes TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS set_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
	exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
	set_number INT NOT NULL CHECK (set_number IN (1, 2)),
	weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 0),
	reps INT NOT NULL CHECK (reps >= 0),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE(session_id, exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_user_id ON routine_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_user_id ON set_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_session_id ON set_logs(session_id);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_routines"
	ON routines
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "insert_own_routines"
	ON routines
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_routines"
	ON routines
	FOR UPDATE
	USING (auth.uid() = user_id)
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_routines"
	ON routines
	FOR DELETE
	USING (auth.uid() = user_id);

CREATE POLICY "select_own_exercises"
	ON exercises
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "insert_own_exercises"
	ON exercises
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_exercises"
	ON exercises
	FOR UPDATE
	USING (auth.uid() = user_id)
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_exercises"
	ON exercises
	FOR DELETE
	USING (auth.uid() = user_id);

CREATE POLICY "select_own_routine_exercises"
	ON routine_exercises
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "insert_own_routine_exercises"
	ON routine_exercises
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_routine_exercises"
	ON routine_exercises
	FOR UPDATE
	USING (auth.uid() = user_id)
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_routine_exercises"
	ON routine_exercises
	FOR DELETE
	USING (auth.uid() = user_id);

CREATE POLICY "select_own_workout_sessions"
	ON workout_sessions
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "insert_own_workout_sessions"
	ON workout_sessions
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_workout_sessions"
	ON workout_sessions
	FOR UPDATE
	USING (auth.uid() = user_id)
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_workout_sessions"
	ON workout_sessions
	FOR DELETE
	USING (auth.uid() = user_id);

CREATE POLICY "select_own_set_logs"
	ON set_logs
	FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "insert_own_set_logs"
	ON set_logs
	FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_set_logs"
	ON set_logs
	FOR UPDATE
	USING (auth.uid() = user_id)
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_set_logs"
	ON set_logs
	FOR DELETE
	USING (auth.uid() = user_id);