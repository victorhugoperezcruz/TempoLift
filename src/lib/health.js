// Estimación de kcal + agregados para stats. Sin dependencias de UI.
import { CARDIO_MET, DEFAULT_BODY_KG, EXERCISE_RENAMES, KCAL_PER_KG_MOVED, LB_TO_KG, WARMUP_MET } from '../data/plan.js'
import { getExerciseMeta } from '../services/exercisesApi.js'

// Gráficas separadas de volumen (peso movido en kg) por parte del cuerpo
// + total general. Evita mezclar días de pierna (mucha carga) con días de
// brazo/hombro (menos carga) en una sola línea con picos artificiales.
export const VOLUME_CHARTS = [
	{ id: 'pierna', label: 'Pierna', color: '#f97316' },
	{ id: 'brazo', label: 'Brazo', color: '#38bdf8' },
	{ id: 'pecho', label: 'Pecho', color: '#ef4444' },
	{ id: 'espalda', label: 'Espalda', color: '#a78bfa' },
	{ id: 'hombro', label: 'Hombro', color: '#facc15' },
	{ id: 'total', label: 'Total', color: '#22c55e' },
]

export const DEFAULT_VOLUME_CHART_IDS = VOLUME_CHARTS.map((c) => c.id)

function volumeChartsKey(userId) {
	return userId ? `tempolift-volume-charts-${userId}` : 'tempolift-volume-charts'
}

export function readVolumeCharts(userId) {
	try {
		const raw = localStorage.getItem(volumeChartsKey(userId))
		if (!raw) return [...DEFAULT_VOLUME_CHART_IDS]
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return [...DEFAULT_VOLUME_CHART_IDS]
		const valid = new Set(DEFAULT_VOLUME_CHART_IDS)
		return parsed.filter((id) => valid.has(id))
	} catch {
		return [...DEFAULT_VOLUME_CHART_IDS]
	}
}

export function persistVolumeCharts(userId, list) {
	try {
		localStorage.setItem(volumeChartsKey(userId), JSON.stringify(list))
	} catch {
		// sin localStorage: vive en memoria
	}
}

const BODY_PART_LABEL = {
	pierna: 'Pierna',
	brazo: 'Brazo',
	pecho: 'Pecho',
	espalda: 'Espalda',
	hombro: 'Hombro',
}

// Mapa inverso de renombres antiguos → nombre actual del catálogo
const LEGACY_TO_CURRENT = (() => {
	const map = {}
	for (const [current, oldList] of Object.entries(EXERCISE_RENAMES ?? {})) {
		for (const oldName of oldList ?? []) {
			map[oldName.toLowerCase()] = current
		}
	}
	return map
})()

function mapCatalogBodyPart(bodyPart) {
	if (!bodyPart) return null
	const bp = String(bodyPart).toLowerCase()
	if (bp === 'upper legs' || bp === 'lower legs') return 'pierna'
	if (bp === 'upper arms' || bp === 'lower arms') return 'brazo'
	if (bp === 'chest') return 'pecho'
	if (bp === 'back') return 'espalda'
	if (bp === 'shoulders') return 'hombro'
	return null
}

// Clasifica un ejercicio en una de las 5 zonas ('pierna' | 'brazo' | 'pecho' | 'espalda' | 'hombro').
// Usa primero el catálogo oficial (+ alias de renombres), luego palabras clave
// para ejercicios extra libres y por último el nombre de la rutina como respaldo.
export function classifyExerciseBodyPart(exerciseName, routineName = '') {
	const raw = typeof exerciseName === 'string' ? exerciseName.trim() : ''
	if (raw) {
		const direct = getExerciseMeta(raw)
		const fromDirect = mapCatalogBodyPart(direct?.bodyPart)
		if (fromDirect) return fromDirect

		const canonical = LEGACY_TO_CURRENT[raw.toLowerCase()]
		if (canonical) {
			const fromAlias = mapCatalogBodyPart(getExerciseMeta(canonical)?.bodyPart)
			if (fromAlias) return fromAlias
		}

		if (/pierna|sentadilla|squat|prensa|cu[aá]driceps|isquio|femoral|gl[uú]teo|hip\s*thrust|pantorrilla|gemelo|aductor|abductor|zancada|desplante|peso\s*muerto|hiperextensi[oó]n/i.test(raw)) return 'pierna'
		if (/brazo|b[ií]ceps|tr[ií]ceps|curl|skull|predicador|martillo|fondos|kickback|patada\s*de\s*tr[ií]ceps|copa|franc[eé]s|antebrazo|polea\s*(alta|con\s*v)/i.test(raw)) return 'brazo'
		if (/hombro|deltoide|militar|lateral|frontal|p[aá]jaro|face\s*pull|encogimiento|apertura\s*posterior/i.test(raw)) return 'hombro'
		if (/pecho|pectoral|press\s*(plano|inclinado|declinado|banca)|apertura|fly|cruce/i.test(raw)) return 'pecho'
		if (/espalda|dorsal|remo|jal[oó]n|dominada|pull|trapecio/i.test(raw)) return 'espalda'
	}
	const rName = typeof routineName === 'string' ? routineName.trim() : ''
	if (/pierna|inferior|legs/i.test(rName)) return 'pierna'
	if (/brazo/i.test(rName)) return 'brazo'
	if (/pecho|empuje|push/i.test(rName)) return 'pecho'
	if (/espalda|tir[oó]n|pull/i.test(rName)) return 'espalda'
	if (/hombro/i.test(rName)) return 'hombro'
	return null
}

// Desglosa los kilos movidos de una sesión por parte del cuerpo.
// Devuelve { byPart: { pierna, brazo, pecho, espalda, hombro }, mainPartsLabel, breakdownLabel }.
export function sessionVolumeByBodyPart(logs, routineName = '') {
	const byPart = { pierna: 0, brazo: 0, pecho: 0, espalda: 0, hombro: 0 }
	for (const l of logs ?? []) {
		const lb = Number(l.weight_kg) || 0
		const reps = Number(l.reps) || 0
		const kg = lb * LB_TO_KG * reps
		if (kg <= 0) continue
		const exName = l.exercises?.name ?? ''
		const part = classifyExerciseBodyPart(exName, routineName)
		if (part && byPart[part] != null) {
			byPart[part] += kg
		}
	}
	const activeParts = Object.entries(byPart)
		.filter(([, kg]) => kg > 0)
		.sort((a, b) => b[1] - a[1])
	const mainPartsLabel = activeParts.length > 0
		? activeParts.map(([k]) => BODY_PART_LABEL[k]).join(' · ')
		: (routineName || 'General')
	const breakdownLabel = activeParts.length > 1
		? activeParts.map(([k, kg]) => `${BODY_PART_LABEL[k]} ${Math.round(kg).toLocaleString()} kg`).join(' · ')
		: ''
	return { byPart, mainPartsLabel, breakdownLabel }
}

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
