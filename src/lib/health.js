// Estimación de kcal + agregados para stats. Sin dependencias de UI.
import { CARDIO_MET, DEFAULT_BODY_KG, KCAL_PER_KG_MOVED, LB_TO_KG, WARMUP_MET } from '../data/plan.js'

export function strengthKcalFromWeights(dayWeights) {
	let volumeKg = 0
	let sets = 0
	for (const perSet of Object.values(dayWeights ?? {})) {
		// Todas las series anotadas (el plan usa 1-2; los extras, 1-N).
		for (const entry of Object.values(perSet ?? {})) {
			if (!entry) continue
			const lb = Number(entry.weight) || 0
			const reps = Number(entry.reps) || 0
			volumeKg += lb * LB_TO_KG * reps
			sets += 1
		}
	}
	return { volumeKg, sets, kcal: volumeKg * KCAL_PER_KG_MOVED }
}

export function cardioKcalFor(minutes, bodyKg) {
	const m = Number(minutes) || 0
	const kg = Number(bodyKg) > 0 ? Number(bodyKg) : DEFAULT_BODY_KG
	return CARDIO_MET * kg * (m / 60)
}

export function warmupKcalFor(minutes, bodyKg) {
	const m = Number(minutes) || 0
	const kg = Number(bodyKg) > 0 ? Number(bodyKg) : DEFAULT_BODY_KG
	return WARMUP_MET * kg * (m / 60)
}

// El cardio y el calentamiento de cada sesión guardada viajan en
// workout_sessions.notes como JSON. Las sesiones antiguas (sin notes)
// simplemente aportan 0 kcal de cardio/calentamiento.
export function parseSessionExtras(notes) {
	if (!notes) return { cardio: null, warmup: null }
	try {
		const parsed = JSON.parse(notes)
		if (!parsed || typeof parsed !== 'object') return { cardio: null, warmup: null }
		return {
			cardio: parsed.cardioMin != null ? { minutes: Number(parsed.cardioMin) || 0, kcal: Number(parsed.cardioKcal) || 0, machineKcal: parsed.cardioMachineKcal != null ? Number(parsed.cardioMachineKcal) : null } : null,
			warmup: parsed.warmupMin != null ? { minutes: Number(parsed.warmupMin) || 0, kcal: Number(parsed.warmupKcal) || 0, machineKcal: parsed.warmupMachineKcal != null ? Number(parsed.warmupMachineKcal) : null } : null,
		}
	} catch {
		// notes con texto libre: sin datos extra
	}
	return { cardio: null, warmup: null }
}

// Racha de días consecutivos con al menos una sesión terminada.
export function dayStreak(startedAtList) {
	const days = new Set()
	for (const iso of startedAtList) {
		const t = new Date(iso)
		if (Number.isNaN(t.getTime())) continue
		days.add(`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`)
	}
	const key = (t) => `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`
	const cursor = new Date()
	if (!days.has(key(cursor))) {
		cursor.setDate(cursor.getDate() - 1)
		if (!days.has(key(cursor))) return 0
	}
	let streak = 0
	while (days.has(key(cursor))) {
		streak += 1
		cursor.setDate(cursor.getDate() - 1)
	}
	return streak
}

// Sesiones por semana (lunes a domingo), últimas N semanas, para la
// gráfica de constancia. Devuelve cronológico con la semana actual al final.
export function sessionsByWeek(startedAtList, weeks = 8) {
	const counts = new Map()
	for (const iso of startedAtList) {
		const t = new Date(iso)
		if (Number.isNaN(t.getTime())) continue
		const d = new Date(t.getFullYear(), t.getMonth(), t.getDate())
		d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // lunes=0
		const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
		counts.set(key, (counts.get(key) ?? 0) + 1)
	}
	const cursor = new Date()
	cursor.setHours(0, 0, 0, 0)
	cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
	const out = []
	for (let i = weeks - 1; i >= 0; i -= 1) {
		const d = new Date(cursor)
		d.setDate(d.getDate() - i * 7)
		const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
		out.push({
			id: key,
			label: `Sem. ${d.getDate()}/${d.getMonth() + 1}`,
			short: `${d.getDate()}/${d.getMonth() + 1}`,
			value: counts.get(key) ?? 0,
			current: i === 0,
		})
	}
	return out
}
