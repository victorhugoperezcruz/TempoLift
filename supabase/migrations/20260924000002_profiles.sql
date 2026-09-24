-- Perfil básico para stats (peso, altura, edad, sexo). Una fila por usuario.
CREATE TABLE IF NOT EXISTS profiles (
	user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	weight_kg NUMERIC CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg < 500)),
	height_cm NUMERIC CHECK (height_cm IS NULL OR (height_cm > 50 AND height_cm < 300)),
	age INT CHECK (age IS NULL OR (age > 5 AND age < 120)),
	sex TEXT CHECK (sex IS NULL OR sex IN ('masculino', 'femenino', 'otro')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'select_own_profile' AND tablename = 'profiles') THEN
		CREATE POLICY "select_own_profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_own_profile' AND tablename = 'profiles') THEN
		CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update_own_profile' AND tablename = 'profiles') THEN
		CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_own_profile' AND tablename = 'profiles') THEN
		CREATE POLICY "delete_own_profile" ON profiles FOR DELETE USING (auth.uid() = user_id);
	END IF;
END $$;
