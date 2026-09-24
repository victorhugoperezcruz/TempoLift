// Sincroniza el plan semanal local con Supabase para poder guardar el historial.
// Crea la rutina, los ejercicios y sus vínculos si aún no existen para el usuario.

export function parseTargetReps(repsStr) {
	const m = /x\s*(\d+)/i.exec(repsStr ?? '')
	return m ? parseInt(m[1], 10) : null
}

async function findOrCreateRoutine(supabase, userId, workout) {
	const name = workout.name
	const { data: existing, error: findError } = await supabase
		.from('routines')
		.select('id')
		.eq('user_id', userId)
		.eq('name', name)
		.limit(1)
		.maybeSingle()
	if (findError) throw findError
	if (existing) return existing.id
	const { data: created, error: createError } = await supabase
		.from('routines')
		.insert({ user_id: userId, name, description: workout.focus ?? null })
		.select('id')
		.single()
	if (createError) throw createError
	return created.id
}

async function findOrCreateExercise(supabase, userId, name) {
	const { data: existing, error: findError } = await supabase
		.from('exercises')
		.select('id')
		.eq('user_id', userId)
		.eq('name', name)
		.limit(1)
		.maybeSingle()
	if (findError) throw findError
	if (existing) return existing.id
	const { data: created, error: createError } = await supabase
		.from('exercises')
		.insert({ user_id: userId, name })
		.select('id')
		.single()
	if (createError) throw createError
	return created.id
}

export async function ensureDayRows(supabase, userId, workout) {
	const routineId = await findOrCreateRoutine(supabase, userId, workout)
	const byIndex = {}
	for (let i = 0; i < workout.exercises.length; i += 1) {
		const [name, reps] = workout.exercises[i]
		const exerciseId = await findOrCreateExercise(supabase, userId, name)
		byIndex[i] = exerciseId
		const targetReps = parseTargetReps(reps)
		const { data: link } = await supabase
			.from('routine_exercises')
			.select('id')
			.eq('user_id', userId)
			.eq('routine_id', routineId)
			.eq('exercise_id', exerciseId)
			.limit(1)
			.maybeSingle()
		if (!link) {
			const { error: linkError } = await supabase.from('routine_exercises').insert({
				user_id: userId,
				routine_id: routineId,
				exercise_id: exerciseId,
				target_sets: 2,
				target_reps: targetReps,
				rest_seconds: 120,
				position: i,
			})
			if (linkError) throw linkError
		}
	}
	return { routineId, byIndex }
}

export async function fetchLastWeights(supabase, userId, exerciseIds) {
	if (exerciseIds.length === 0) return {}
	const { data, error } = await supabase
		.from('set_logs')
		.select('exercise_id, weight_kg, reps')
		.eq('user_id', userId)
		.in('exercise_id', exerciseIds)
		.order('created_at', { ascending: false })
	if (error) throw error
	const map = {}
	for (const row of data ?? []) {
		if (!map[row.exercise_id]) map[row.exercise_id] = row
	}
	return map
}

export async function saveDaySession(supabase, userId, routineId, byIndex, weights, startedAt) {
	const { data: session, error: sessionError } = await supabase
		.from('workout_sessions')
		.insert({
			user_id: userId,
			routine_id: routineId,
			started_at: startedAt ?? new Date().toISOString(),
			ended_at: new Date().toISOString(),
		})
		.select('id')
		.single()
	if (sessionError) throw sessionError
	const rows = []
	for (const [indexStr, exerciseId] of Object.entries(byIndex)) {
		const perSet = weights[indexStr] ?? {}
		for (const n of [1, 2]) {
			const entry = perSet[n]
			if (!entry) continue
			rows.push({
				user_id: userId,
				session_id: session.id,
				exercise_id: exerciseId,
				set_number: n,
				weight_kg: entry.weight,
				reps: entry.reps,
			})
		}
	}
	if (rows.length > 0) {
		const { error: logsError } = await supabase.from('set_logs').insert(rows)
		if (logsError) throw logsError
	}
	return session.id
}
