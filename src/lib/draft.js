// Rutina activa en curso (borrador, UNA sola a la vez).
// Por qué localStorage y no Supabase: el borrador es efímero, debe abrir
// al instante, funcionar offline y sobrevivir a F5/cierre del SO sin
// migración, latencia ni RLS. Supabase sigue siendo la fuente de verdad
// para el historial (sesiones terminadas). El borrador vive por usuario:
// `tempolift-active-workout-{uid}`.
// Forma: { workoutId, series, weights, cardio, warmup, selectedDay,
// lastDay, dayStart, saveSig, updatedAt }. Solo se guarda UN workoutId:
// así es imposible tener ejercicios activos de dos días a la vez.
import { workoutDays } from '../data/plan.js'

export function activeWorkoutKey(userId) {
	return userId ? `tempolift-active-workout-${userId}` : 'tempolift-active-workout'
}

export function isValidSeriesMap(v) {
	return v && typeof v === 'object' && !Array.isArray(v)
}

// Entrada válida de ejercicio extra: { id, name, targetSets 1-4, sets[] }.
export function isValidCustom(c) {
	if (!c || typeof c !== 'object') return false
	if (typeof c.id !== 'string' || !c.id) return false
	if (typeof c.name !== 'string' || !c.name.trim()) return false
	const t = Number(c.targetSets)
	if (!Number.isFinite(t) || t < 1 || t > 4) return false
	if (!Array.isArray(c.sets)) return false
	return c.sets.every((s) => s && Number.isFinite(Number(s.weight)) && Number(s.weight) >= 0 && Number.isFinite(Number(s.reps)))
}

export function sanitizeCustoms(list) {
	if (!Array.isArray(list)) return []
	return list.filter(isValidCustom).map((c) => ({
		id: c.id,
		name: c.name.trim(),
		targetSets: Math.min(4, Math.max(1, Math.round(Number(c.targetSets)))),
		sets: c.sets.map((s) => ({ weight: Number(s.weight) || 0, reps: Math.round(Number(s.reps)) || 0 })),
	}))
}

export function readActiveWorkout(userId) {
	try {
		const raw = localStorage.getItem(activeWorkoutKey(userId))
		if (!raw) return null
		const p = JSON.parse(raw)
		if (!p || typeof p !== 'object') return null
		const workoutId = Number(p.workoutId)
		if (!Number.isFinite(workoutId)) return null
		if (!workoutDays.some((w) => w.id === workoutId)) return null
		const series = isValidSeriesMap(p.series) ? p.series : {}
		const weights = isValidSeriesMap(p.weights) ? p.weights : {}
		const cardio = p.cardio && typeof p.cardio === 'object' ? p.cardio : null
		const warmup = p.warmup && typeof p.warmup === 'object' ? p.warmup : null
		const customs = sanitizeCustoms(p.customs)
		const hasData = Object.keys(series).length > 0 || Object.keys(weights).length > 0 || cardio || warmup || customs.length > 0
		if (!hasData) return null
		return {
			workoutId,
			series,
			weights,
			cardio,
			warmup,
			customs,
			selectedDay: Number.isFinite(Number(p.selectedDay)) ? Number(p.selectedDay) : null,
			lastDay: Number.isFinite(Number(p.lastDay)) ? Number(p.lastDay) : workoutId,
			dayStart: typeof p.dayStart === 'string' ? p.dayStart : null,
			saveSig: typeof p.saveSig === 'string' ? p.saveSig : null,
		}
	} catch {
		return null
	}
}

export function persistActiveWorkout(userId, data) {
	try {
		if (!data || !Number.isFinite(Number(data.workoutId))) {
			localStorage.removeItem(activeWorkoutKey(userId))
			return
		}
		localStorage.setItem(activeWorkoutKey(userId), JSON.stringify({ ...data, updatedAt: Date.now() }))
	} catch {
		// sin localStorage: el borrador vive solo en memoria
	}
}

export function clearActiveWorkout(userId) {
	try {
		localStorage.removeItem(activeWorkoutKey(userId))
	} catch {
		// ignora
	}
}

// ¿Hay progreso en otro día distinto de `workoutId`? Sirve para avisar
// cuando se va a limpiar por la regla de una sola rutina activa.
export function hasNonEmptyValue(v) {
	if (v == null) return false
	if (typeof v !== 'object') return true
	return Object.keys(v).length > 0
}

export function hasOtherDayProgress(seriesByDay, weightsMap, cardioByDay, warmupByDay, workoutId, customByDay) {
	return [seriesByDay, weightsMap, cardioByDay, warmupByDay, customByDay].some(
		(m) => m && typeof m === 'object' && Object.keys(m).some((k) => Number(k) !== Number(workoutId) && hasNonEmptyValue(m[k])),
	)
}
