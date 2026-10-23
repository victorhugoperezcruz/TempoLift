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
	const names = [...new Set(workout.exercises.map(([name]) => name).filter(Boolean))]
	const { data: existingEx, error: exFetchErr } = await supabase
		.from('exercises')
		.select('id, name')
		.eq('user_id', userId)
		.in('name', names)
	if (exFetchErr) throw exFetchErr

	const idByName = {}
	for (const row of existingEx ?? []) {
		if (row?.name && row?.id != null && idByName[row.name] == null) {
			idByName[row.name] = row.id
		}
	}

	const missingNames = names.filter((n) => idByName[n] == null)
	if (missingNames.length > 0) {
		const { data: insertedEx, error: exInsertErr } = await supabase
			.from('exercises')
			.insert(missingNames.map((name) => ({ user_id: userId, name })))
			.select('id, name')
		if (exInsertErr) {
			// Fallback uno por uno si hubo carrera
			for (const name of missingNames) {
				idByName[name] = await findOrCreateExercise(supabase, userId, name)
			}
		} else {
			for (const row of insertedEx ?? []) {
				if (row?.name && row?.id != null) idByName[row.name] = row.id
			}
		}
	}

	const byIndex = {}
	const exerciseIds = []
	for (let i = 0; i < workout.exercises.length; i += 1) {
		const [name] = workout.exercises[i]
		const exId = idByName[name]
		byIndex[i] = exId
		if (exId != null) exerciseIds.push(exId)
	}

	const { data: existingLinks } = await supabase
		.from('routine_exercises')
		.select('exercise_id')
		.eq('user_id', userId)
		.eq('routine_id', routineId)
		.in('exercise_id', [...new Set(exerciseIds)])
	const linkedSet = new Set((existingLinks ?? []).map((r) => r.exercise_id))

	const missingLinks = []
	for (let i = 0; i < workout.exercises.length; i += 1) {
		const [, reps] = workout.exercises[i]
		const exerciseId = byIndex[i]
		if (exerciseId == null || linkedSet.has(exerciseId)) continue
		linkedSet.add(exerciseId)
		missingLinks.push({
			user_id: userId,
			routine_id: routineId,
			exercise_id: exerciseId,
			target_sets: 2,
			target_reps: parseTargetReps(reps),
			rest_seconds: 120,
			position: i,
		})
	}
	if (missingLinks.length > 0) {
		await supabase.from('routine_exercises').insert(missingLinks)
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

// Valores del aliasMap: un id o una lista de ids (varios nombres viejos).
function aliasIds(value) {
	return (Array.isArray(value) ? value : [value]).filter((v) => v != null)
}

function byRecent(a, b) {
	return String(b?.created_at ?? '').localeCompare(String(a?.created_at ?? ''))
}

// Rellena huecos: si el id nuevo no tiene dato y sus alias sí, lo hereda.
// aliasMap = { idNuevo: idViejo | [idViejo, ...] }. Con varios alias:
// listas → se mezclan por fecha (recorte a `limit`); objetos → el más reciente.
// Puro y testeable; vale para objetos (último peso) y listas (recientes).
export function applyHistoryAliases(map, aliasMap, limit = 4) {
	const out = { ...(map ?? {}) }
	for (const [newId, value] of Object.entries(aliasMap ?? {})) {
		if (newId == null) continue
		const cur = out[newId]
		const empty = cur == null || (Array.isArray(cur) && cur.length === 0)
		if (!empty) continue
		const found = aliasIds(value).map((id) => map?.[id]).filter((v) => v != null && !(Array.isArray(v) && v.length === 0))
		if (found.length === 0) continue
		if (found.length === 1) out[newId] = found[0]
		else if (Array.isArray(found[0])) out[newId] = found.flat().sort(byRecent).slice(0, limit)
		else out[newId] = [...found].sort(byRecent)[0]
	}
	return out
}

function allIdsWithAliases(exerciseIds, aliasMap) {
	return [...new Set([...(exerciseIds ?? []), ...Object.values(aliasMap ?? {}).flatMap(aliasIds)])]
}

export async function fetchLastWeights(supabase, userId, exerciseIds, aliasMap = {}) {
	const all = allIdsWithAliases(exerciseIds, aliasMap)
	if (all.length === 0) return {}
	const { data, error } = await supabase
		.from('set_logs')
		.select('exercise_id, weight_kg, reps, created_at')
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
	const all = allIdsWithAliases(exerciseIds, aliasMap)
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
	return applyHistoryAliases(map, aliasMap, perExercise)
}

// Última serie registrada por NOMBRE de ejercicio (todo el historial del
// usuario). Sirve al modal de sustitución para mostrar qué ejercicios ya
// tienen peso guardado: { [nombre]: { weight_kg, reps, created_at } }.
export async function fetchLastWeightsByName(supabase, userId) {
	const { data, error } = await supabase
		.from('set_logs')
		.select('weight_kg, reps, created_at, exercises (name)')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(2000)
	if (error) throw error
	const map = {}
	for (const row of data ?? []) {
		const name = row?.exercises?.name
		if (!name || map[name]) continue
		map[name] = { weight_kg: row.weight_kg, reps: row.reps, created_at: row.created_at }
	}
	return map
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
