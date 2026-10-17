// Sustituciones de ejercicios dentro de una rutina, por usuario.
// Forma: { [workoutId]: { [index]: 'Nombre en español del catálogo' } }.
// Solo se guarda el NOMBRE nuevo: las reps/nota del plan se conservan, y el
// historial del ejercicio nuevo empieza desde cero (es otro movimiento).
// La rutina efectiva = base de workoutDays + overrides aplicados.

export function routineOverridesKey(userId) {
	return userId ? `tempolift-routine-overrides-${userId}` : 'tempolift-routine-overrides'
}

function isValidOverrides(obj) {
	if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
	for (const [wid, perIndex] of Object.entries(obj)) {
		if (!/^\d+$/.test(wid)) return false
		if (!perIndex || typeof perIndex !== 'object' || Array.isArray(perIndex)) return false
		for (const [idx, name] of Object.entries(perIndex)) {
			if (!/^\d+$/.test(idx)) return false
			if (typeof name !== 'string' || !name.trim()) return false
		}
	}
	return true
}

export function readRoutineOverrides(userId) {
	try {
		const raw = localStorage.getItem(routineOverridesKey(userId))
		if (!raw) return {}
		const obj = JSON.parse(raw)
		if (!isValidOverrides(obj)) return {}
		// Normaliza: recorta nombres y tira entradas vacías.
		const out = {}
		for (const [wid, perIndex] of Object.entries(obj)) {
			for (const [idx, name] of Object.entries(perIndex)) {
				const clean = String(name).trim()
				if (!clean) continue
				;(out[wid] ??= {})[idx] = clean
			}
		}
		return out
	} catch {
		return {}
	}
}

export function persistRoutineOverrides(userId, obj) {
	try {
		localStorage.setItem(routineOverridesKey(userId), JSON.stringify(obj ?? {}))
	} catch {
		// sin localStorage: vive solo en memoria
	}
}

// Aplica los overrides de una rutina a su lista base de ejercicios.
// Devuelve un array NUEVO [[name, reps, note], ...]; si no hay overrides,
// devuelve la misma referencia base (sin copiar).
export function applyRoutineOverrides(baseExercises, overridesForWorkout) {
	if (!overridesForWorkout || Object.keys(overridesForWorkout).length === 0) return baseExercises
	return baseExercises.map(([name, reps, note], i) => {
		const sub = overridesForWorkout[String(i)]
		if (typeof sub === 'string' && sub.trim() && sub.trim() !== name) return [sub.trim(), reps, note]
		return [name, reps, note]
	})
}

// Firma de la rutina efectiva (para re-sincronizar Supabase al sustituir).
export function routineSignature(exercises) {
	return (exercises ?? []).map(([n]) => n).join('|')
}
