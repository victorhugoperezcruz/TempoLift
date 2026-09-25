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

// IDs de ejercicios por nombre (para heredar historial de renombres).
export async function fetchExerciseIdsByNames(supabase, userId, names) {
	const clean = [...new Set((names ?? []).filter(Boolean))]
	if (clean.length === 0) return {}
	const { data, error } = await supabase
		.from('exercises')
		.select('id, name')
		.eq('user_id', userId)
		.in('name', clean)
	if (error) throw error
	const map = {}
	for (const row of data ?? []) {
		if (row?.name && row?.id != null) map[row.name] = row.id
	}
	return map
}

// Rellena huecos: si el id nuevo no tiene dato y su alias sí, lo hereda.
// Puro y testeable; vale para objetos (último peso) y listas (recientes).
export function applyHistoryAliases(map, aliasMap) {
	const out = { ...(map ?? {}) }
	for (const [newId, oldId] of Object.entries(aliasMap ?? {})) {
		if (newId == null || oldId == null) continue
		const cur = out[newId]
		const empty = cur == null || (Array.isArray(cur) && cur.length === 0)
		if (empty && out[oldId] != null) out[newId] = out[oldId]
	}
	return out
}

export async function fetchLastWeights(supabase, userId, exerciseIds, aliasMap = {}) {
	const all = [...new Set([...(exerciseIds ?? []), ...Object.values(aliasMap ?? {}).filter((v) => v != null)])]
	if (all.length === 0) return {}
	const { data, error } = await supabase
		.from('set_logs')
		.select('exercise_id, weight_kg, reps')
		.eq('user_id', userId)
		.in('exercise_id', all)
		.order('created_at', { ascending: false })
	if (error) throw error
	const map = {}
	for (const row of data ?? []) {
		if (!map[row.exercise_id]) map[row.exercise_id] = row
	}
	return applyHistoryAliases(map, aliasMap)
}

// Últimas series por ejercicio (para el historial del acordeón).
// Devuelve { [exercise_id]: [{ weight_kg, reps, set_number, created_at }] }
// en orden reciente → antiguo, recortado a `perExercise` por ejercicio.
export async function fetchRecentLogs(supabase, userId, exerciseIds, perExercise = 4, aliasMap = {}) {
	const all = [...new Set([...(exerciseIds ?? []), ...Object.values(aliasMap ?? {}).filter((v) => v != null)])]
	if (all.length === 0) return {}
	const { data, error } = await supabase
		.from('set_logs')
		.select('exercise_id, set_number, weight_kg, reps, created_at')
		.eq('user_id', userId)
		.in('exercise_id', all)
		.order('created_at', { ascending: false })
		.limit(Math.max(20, all.length * perExercise * 2))
	if (error) throw error
	const map = {}
	for (const row of data ?? []) {
		const list = map[row.exercise_id] ?? (map[row.exercise_id] = [])
		if (list.length < perExercise) list.push(row)
	}
	return applyHistoryAliases(map, aliasMap)
}

// Nombres de ejercicios del usuario (para el combobox de extras).
export async function fetchUserExerciseNames(supabase, userId) {
	const { data, error } = await supabase
		.from('exercises')
		.select('name')
		.eq('user_id', userId)
		.order('name', { ascending: true })
		.limit(200)
	if (error) throw error
	return [...new Set((data ?? []).map((r) => r.name).filter(Boolean))]
}

export async function saveDaySession(supabase, userId, routineId, byIndex, weights, startedAt, extras = null, customSets = []) {
	const notes = extras
		? JSON.stringify({
			...(extras.cardioMin != null ? { cardioMin: extras.cardioMin, cardioKcal: extras.cardioKcal, ...(extras.cardioMachineKcal != null ? { cardioMachineKcal: extras.cardioMachineKcal } : {}) } : {}),
			...(extras.warmupMin != null ? { warmupMin: extras.warmupMin, warmupKcal: extras.warmupKcal, ...(extras.warmupMachineKcal != null ? { warmupMachineKcal: extras.warmupMachineKcal } : {}) } : {}),
		})
		: null
	const { data: session, error: sessionError } = await supabase
		.from('workout_sessions')
		.insert({
			user_id: userId,
			routine_id: routineId,
			started_at: startedAt ?? new Date().toISOString(),
			ended_at: new Date().toISOString(),
			// El cardio y el calentamiento (minutos + kcal) viajan en notes como JSON.
			// Las sesiones antiguas sin notes aportan 0 kcal extra.
			notes,
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
	// Ejercicios extra del día (no cuentan para el completado, sí para kcal
	// e historial). Los set_number continúan después de los del plan para el
	// mismo ejercicio y así respetar el UNIQUE(session, exercise, set).
	for (const c of customSets ?? []) {
		const name = typeof c?.name === 'string' ? c.name.trim() : ''
		const sets = Array.isArray(c?.sets) ? c.sets.filter((s) => s && Number.isFinite(Number(s.weight)) && Number.isFinite(Number(s.reps))) : []
		if (!name || sets.length === 0) continue
		const exerciseId = await findOrCreateExercise(supabase, userId, name)
		let next = rows.reduce((m, r) => (r.exercise_id === exerciseId ? Math.max(m, r.set_number) : m), 0)
		const customRows = sets.map((s) => ({
			user_id: userId,
			session_id: session.id,
			exercise_id: exerciseId,
			set_number: ++next,
			weight_kg: Math.round(Number(s.weight) * 100) / 100,
			reps: parseInt(s.reps, 10),
		}))
		const { error: customError } = await supabase.from('set_logs').insert(customRows)
		if (customError) throw customError
		rows.push(...customRows)
	}
	return session.id
}
