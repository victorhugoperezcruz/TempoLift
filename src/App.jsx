import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import ExerciseItem from './components/ExerciseItem.jsx'
import BottomNav from './components/BottomNav.jsx'
import { getExerciseBundle } from './services/exercisesApi.js'
import { ensureDayRows, fetchLastWeights, fetchRecentLogs, saveDaySession } from './services/planSync.js'

const globalPhases = {
	warmup: {
		title: 'Calentamiento',
		label: 'Fase 1',
		detail: '5-10 min · Caminadora',
		notes: 'Velocidad 5 km/h · Inclinación 0',
	},
	cardio: {
		title: 'Cardio final',
		label: 'Fase 3',
		detail: '20-30 min · Caminadora',
		notes: 'Velocidad 4-5 km/h · Inclinación 10-12',
	},
}

const globalRules = {
	tempo: '3-1-1',
	rest: '2-3 min',
}

const workoutDays = [
	{
		id: 1,
		name: 'Pecho y espalda',
		focus: 'Torso',
		accent: 'bg-red-500',
		exercises: [
			['Press inclinado', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano', '2 x 8', 'Tempo 3-1-1'],
			['Jalón a pecho', '2 x 8-10', 'Tempo 3-1-1'],
			['Pec Fly', '1 x al fallo', 'Tempo 3-1-1'],
			['Jalón unilateral dorsal', '1 x al fallo', 'Por lado'],
		],
	},
	{
		id: 2,
		name: 'Pierna',
		focus: 'Cuádriceps y glúteo',
		accent: 'bg-orange-300',
		exercises: [
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Extensión de cuádriceps', '2 x 10-12', 'Tempo 3-1-1'],
			['Máquina de aductores', '2 x 12', 'Tempo 3-1-1'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
			['Biserie de pantorrillas', '2 x 12 + 2 x 12', 'De pie + sentado'],
		],
	},
	{
		id: 3,
		name: 'Hombro y brazo',
		focus: 'Torso',
		accent: 'bg-sky-300',
		exercises: [
			['Press militar', '2 x 8', 'Tempo 3-1-1'],
			['Elevaciones laterales', '2 x 12', 'Tempo 3-1-1'],
			['Skull crushers', '2 x 8-10', 'Codos fijos'],
			['Curl predicador', '2 x 10', 'Tempo 3-1-1'],
			['Tríceps en polea', '2 x 10', 'Aprieta abajo'],
			['Curl martillo', '2 x 10', 'Agarre neutro'],
			['Curl de bíceps en máquina', '2 x 10', 'Tempo 3-1-1'],
		],
	},
	{
		id: 4,
		name: 'Pierna',
		focus: 'Isquiosurales y glúteo',
		accent: 'bg-rose-300',
		exercises: [
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Curl de isquiosurales sentado', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
			['Biserie de pantorrillas', '2 x 12 + 2 x 12', 'De pie + sentado'],
		],
	},
	{
		id: 5,
		name: 'Torso mixto',
		focus: 'Pecho, espalda y hombro',
		accent: 'bg-violet-300',
		exercises: [
			['Press inclinado', '2 x 8', 'Tempo 3-1-1'],
			['Jalón a pecho', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T', '2 x 8-10', 'Tempo 3-1-1'],
			['Elevaciones laterales', '2 x 12', 'Tempo 3-1-1'],
		],
	},
	{
		id: 6,
		name: 'Cuerpo completo A',
		focus: 'Full body: pecho, espalda, pierna y brazo',
		accent: 'bg-emerald-300',
		exercises: [
			['Press inclinado', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T', '2 x 8-10', 'Tempo 3-1-1'],
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Press militar', '2 x 8', 'Tempo 3-1-1'],
			['Curl predicador', '2 x 10', 'Tempo 3-1-1'],
			['Tríceps en polea', '2 x 10', 'Aprieta abajo'],
			['Biserie de pantorrillas', '2 x 12 + 2 x 12', 'De pie + sentado'],
		],
	},
	{
		id: 7,
		name: 'Cuerpo completo B',
		focus: 'Full body: torso, glúteo e isquios',
		accent: 'bg-teal-300',
		exercises: [
			['Press plano', '2 x 8', 'Tempo 3-1-1'],
			['Jalón a pecho', '2 x 8-10', 'Tempo 3-1-1'],
			['Patada de glúteo', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Curl de isquiosurales sentado', '2 x 10-12', 'Tempo 3-1-1'],
			['Elevaciones laterales', '2 x 12', 'Tempo 3-1-1'],
			['Curl martillo', '2 x 10', 'Agarre neutro'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
		],
	},
]

const weekSchedule = [
	{ day: 'Lun', fullDay: 'Lunes', rest: true },
	{ day: 'Mar', fullDay: 'Martes', rest: true },
	{ day: 'Mié', fullDay: 'Miércoles', workoutId: 1 },
	{ day: 'Jue', fullDay: 'Jueves', workoutId: 2 },
	{ day: 'Vie', fullDay: 'Viernes', workoutId: 3 },
	{ day: 'Sáb', fullDay: 'Sábado', workoutId: 4 },
	{ day: 'Dom', fullDay: 'Domingo', workoutId: 5 },
]

// Contenido por defecto de la semana: un slot por día en orden Lun..Dom.
// Cada slot es { workoutId } o { rest: true }. Los DÍAS son fijos (una semana
// siempre es Lun-Dom); lo que el usuario mueve es el CONTENIDO (la rutina o
// el descanso) de un día a otro. Así son imposibles semanas como Dom,Jue,Lun…
const DEFAULT_WEEK_MAP = [
	{ rest: true },
	{ rest: true },
	{ workoutId: 1 },
	{ workoutId: 2 },
	{ workoutId: 3 },
	{ workoutId: 4 },
	{ workoutId: 5 },
]

// Plan según la meta semanal: qué días (índices Lun=0..Dom=6) se entrena y con
// qué rutina, priorizando que cada parte del cuerpo se trabaje en la semana.
// Pocos días → full-body A/B; 4-5 días → rutinas enfocadas; 6-7 → todo + extra.
const TRAINING_DAYS_BY_GOAL = {
	1: [3],
	2: [2, 5],
	3: [1, 3, 5],
	4: [0, 1, 3, 4],
	5: [2, 3, 4, 5, 6],
	6: [0, 1, 2, 4, 5, 6],
	7: [0, 1, 2, 3, 4, 5, 6],
}

const ROUTINES_BY_GOAL = {
	1: [6],
	2: [6, 7],
	3: [6, 4, 3],
	4: [1, 2, 3, 4],
	5: [1, 2, 3, 4, 5],
	6: [1, 2, 3, 4, 5, 6],
	7: [1, 2, 3, 4, 5, 6, 7],
}

// Construye el mapa semanal para una meta (descanso donde no toca entrenar).
function buildWeekMapForGoal(goal) {
	const days = TRAINING_DAYS_BY_GOAL[goal] ?? TRAINING_DAYS_BY_GOAL[5]
	const routines = ROUTINES_BY_GOAL[goal] ?? ROUTINES_BY_GOAL[5]
	return weekSchedule.map((_, i) => {
		const pos = days.indexOf(i)
		return pos === -1 ? { rest: true } : { workoutId: routines[pos] }
	})
}

function weekMapKey(userId) {
	return userId ? `tempolift-week-map-${userId}` : 'tempolift-week-map'
}

function sameSlot(a, b) {
	if (!a || !b) return false
	if (a.rest || b.rest) return Boolean(a.rest && b.rest)
	return a.workoutId === b.workoutId
}

// Lee el mapa guardado de ese usuario. null si no hay o si es inválido
// (longitud distinta, rutinas duplicadas o desconocidas): así un cambio del
// plan no rompe nada y nunca hay semanas imposibles.
function readWeekMap(userId) {
	try {
		const raw = localStorage.getItem(weekMapKey(userId))
		if (!raw) return null
		const arr = JSON.parse(raw)
		if (!Array.isArray(arr) || arr.length !== weekSchedule.length) return null
		const validIds = new Set(workoutDays.map((w) => w.id))
		const seen = new Set()
		for (const s of arr) {
			if (!s || typeof s !== 'object') return null
			if (s.rest) continue
			if (!validIds.has(s.workoutId) || seen.has(s.workoutId)) return null
			seen.add(s.workoutId)
		}
		return arr.map((s) => (s.rest ? { rest: true } : { workoutId: s.workoutId }))
	} catch {
		return null
	}
}

function persistWeekMap(userId, map) {
	try {
		localStorage.setItem(weekMapKey(userId), JSON.stringify(map))
	} catch {
		// sin localStorage: el orden vive solo en memoria
	}
}

// Meta semanal de sesiones (1 a 7, por defecto 5): alimenta la gráfica de
// constancia y la sección Meta semanal del perfil. Por usuario, sin migración.
function weekGoalKey(userId) {
	return userId ? `tempolift-week-goal-${userId}` : 'tempolift-week-goal'
}

function readWeekGoal(userId) {
	try {
		const v = parseInt(localStorage.getItem(weekGoalKey(userId)), 10)
		if (Number.isFinite(v)) return Math.min(7, Math.max(1, v))
	} catch {
		// sin localStorage: usa el valor por defecto
	}
	return 5
}

function persistWeekGoal(userId, value) {
	try {
		localStorage.setItem(weekGoalKey(userId), String(value))
	} catch {
		// sin localStorage: la meta vive solo en memoria
	}
}

// Consejo según la meta elegida (sin emojis): orienta sin obligar.
function weekGoalTip(goal) {
	if (goal <= 1) return 'Un día es mejor que ninguno, pero tu cuerpo puede con más: prueba subir a 2 o 3 cuando te sientas listo.'
	if (goal === 2) return 'Buen punto de partida. Con 3 días a la semana el progreso se nota más rápido.'
	if (goal === 3) return 'Meta equilibrada: constancia sin quemarte. Ideal si vienes retomando.'
	if (goal === 4) return 'Ritmo sólido, a un paso del plan completo.'
	if (goal === 5) return 'El plan completo: así se construye la constancia semana a semana.'
	if (goal === 6) return 'Nivel exigente: cuida el sueño y la comida para sostenerlo.'
	return 'Cuidado: el cuerpo necesita descansar para crecer. Entrenar los 7 días sin pausa lleva al sobreentrenamiento.'
}

const REST_SECONDS = 120

function formatRest(total) {
	const m = Math.floor(total / 60)
	const s = total % 60
	return `${m}:${String(s).padStart(2, '0')}`
}

// Autofoco solo con puntero fino: en táctil abriría el teclado de golpe
// tapando medio modal. Se usa como autoFocus={FINE_POINTER}.
const FINE_POINTER = typeof window !== 'undefined'
	&& typeof window.matchMedia === 'function'
	&& window.matchMedia('(pointer: fine)').matches

// Muestra un aviso legible. El detalle técnico solo se imprime en desarrollo:
// en producción la consola queda limpia (nada de errores ni código interno).
function friendlyError(err) {
	if (import.meta.env.DEV) console.error(err)
	const msg = err?.message ?? String(err ?? '')
	if (/42501|permission denied|permiso/i.test(msg)) return 'tu usuario no tiene permiso en la base de datos'
	if (/Failed to fetch|Network|network|fetch/i.test(msg)) return 'no hay conexión con la base de datos'
	if (/relation .* does not exist|Could not find the table|PGRST/i.test(msg)) return 'falta crear las tablas en la base de datos'
	return 'inténtalo de nuevo'
}

// La tabla `profiles` puede no existir si la migración aún no se aplicó en
// Supabase (el endpoint responde 404). Se detecta una sola vez por sesión y
// a partir de ahí no se vuelve a intentar: cero ruido en consola/red y el
// perfil sigue funcionando en local hasta que se aplique la migración.
let profilesTableState = null // null = sin probar | true = existe | false = no existe
function isMissingTableError(err) {
	const code = err?.code ?? ''
	const msg = err?.message ?? ''
	return code === 'PGRST205' || /Could not find the table|relation .* does not exist/i.test(`${code} ${msg}`)
}
function markProfilesChecked(err) {
	if (err) {
		if (isMissingTableError(err)) profilesTableState = false
		return
	}
	profilesTableState = true
}
// Escritura tolerante a tabla ausente: nunca deja 404s repetidos.
function upsertProfile(uid, payload) {
	if (!uid || profilesTableState === false) return
	supabase.from('profiles').upsert(payload, { onConflict: 'user_id' }).then(
		({ error }) => markProfilesChecked(error),
		(err) => markProfilesChecked(err),
	)
}

// ---- Sistema de estimación de calorías (aproximado) ----
// Fuerza: ~1 kcal por cada 20 kg movidos (peso × reps sumado en todas las series).
// Cardio: fórmula MET × peso corporal × tiempo (caminadora 4-5 km/h, inclinación 10-12 ≈ 8 MET).
// Los pesos se anotan en lb: se convierten a kg para el cálculo.
const LB_TO_KG = 0.453592
const LB_PER_KG = 2.20462
const KCAL_PER_KG_MOVED = 0.05
const CARDIO_MET = 8
const WARMUP_MET = 3.5 // caminadora 5 km/h sin inclinación
const DEFAULT_BODY_KG = 75
const DEFAULT_CARDIO_MIN = 25
const DEFAULT_WARMUP_MIN = 7 // plan: 5-10 min

function strengthKcalFromWeights(dayWeights) {
	let volumeKg = 0
	let sets = 0
	for (const perSet of Object.values(dayWeights ?? {})) {
		for (const n of [1, 2]) {
			const entry = perSet?.[n]
			if (!entry) continue
			const lb = Number(entry.weight) || 0
			const reps = Number(entry.reps) || 0
			volumeKg += lb * LB_TO_KG * reps
			sets += 1
		}
	}
	return { volumeKg, sets, kcal: volumeKg * KCAL_PER_KG_MOVED }
}

function cardioKcalFor(minutes, bodyKg) {
	const m = Number(minutes) || 0
	const kg = Number(bodyKg) > 0 ? Number(bodyKg) : DEFAULT_BODY_KG
	return CARDIO_MET * kg * (m / 60)
}

// El cardio y el calentamiento de cada sesión guardada viajan en
// workout_sessions.notes como JSON. Las sesiones antiguas (sin notes)
// simplemente aportan 0 kcal de cardio/calentamiento.
function parseSessionExtras(notes) {
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

// ---- Unidad de peso (lb/kg) ----
// Todo se guarda en lb (columna weight_kg histórica); solo cambia lo que se muestra.
function readWeightUnit() {
	try {
		return localStorage.getItem('tempolift-weight-unit') === 'kg' ? 'kg' : 'lb'
	} catch {
		return 'lb'
	}
}

function persistWeightUnit(unit) {
	try {
		localStorage.setItem('tempolift-weight-unit', unit)
	} catch {
		// sin localStorage: la preferencia vive solo en memoria
	}
}

// lb (número) → texto en la unidad visible
function displayWeight(lb, unit) {
	const n = Number(lb)
	if (!Number.isFinite(n)) return ''
	if (unit === 'kg') return String(Math.round((n / LB_PER_KG) * 10) / 10)
	return String(Math.round(n * 10) / 10)
}

// texto visible → lb (número). NaN si no es válido.
function displayToLb(raw, unit) {
	const v = parseFloat(raw)
	if (!Number.isFinite(v)) return NaN
	return unit === 'kg' ? v * LB_PER_KG : v
}

// Convierte el texto de un input al cambiar de unidad.
function convertInputUnit(cur, from, to) {
	if (from === to || cur === '') return cur
	const lb = displayToLb(cur, from)
	return Number.isFinite(lb) ? displayWeight(lb, to) : cur
}

// Peso de ejemplo realista por ejercicio (lb): solo orienta el placeholder
// del modal para no sugerir cargas absurdas. No es valor por defecto.
const WEIGHT_HINTS_LB = {
	'Press inclinado': 95,
	'Remo en T': 90,
	'Press plano': 95,
	'Jalón a pecho': 100,
	'Pec Fly': 70,
	'Jalón unilateral dorsal': 50,
	'Prensa de piernas': 270,
	'Extensión de cuádriceps': 90,
	'Máquina de aductores': 100,
	'Máquina de abductores': 100,
	'Biserie de pantorrillas': 90,
	'Press militar': 70,
	'Elevaciones laterales': 15,
	'Skull crushers': 40,
	'Curl predicador': 45,
	'Tríceps en polea': 50,
	'Curl martillo': 25,
	'Curl de bíceps en máquina': 45,
	'Curl de isquiosurales sentado': 90,
	'Patada de glúteo': 40,
}

function weightHintFor(spanishName, unit) {
	const lb = WEIGHT_HINTS_LB[spanishName] ?? 45
	// Redondeado al paso del input (0.5): un hint como 43.1 el navegador lo
	// rechaza y no debe sugerirse.
	const raw = unit === 'kg' ? lb / LB_PER_KG : lb
	return String(Math.round(raw * 2) / 2)
}

function readTheme() {
	try {
		return localStorage.getItem('tempolift-theme') === 'light' ? 'light' : 'dark'
	} catch {
		return 'dark'
	}
}

function persistTheme(t) {
	try {
		localStorage.setItem('tempolift-theme', t)
	} catch {
		// sin localStorage: el tema vive solo en memoria
	}
}

function profileStoreKey(userId) {
	return userId ? `tempolift-profile-${userId}` : 'tempolift-profile'
}

function readProfileLocal(userId) {
	try {
		const raw = localStorage.getItem(profileStoreKey(userId))
		if (!raw) return null
		const p = JSON.parse(raw)
		if (!p || typeof p !== 'object') return null
		return p
	} catch {
		return null
	}
}

function persistProfileLocal(userId, profile) {
	try {
		localStorage.setItem(profileStoreKey(userId), JSON.stringify(profile ?? {}))
	} catch {
		// sin localStorage: el perfil vive solo en memoria
	}
}

// Peso corporal por usuario: clave propia, con fallback a la global histórica.
function readBodyKg() {
	try {
		const v = parseFloat(localStorage.getItem('tempolift-body-kg') ?? '')
		if (Number.isFinite(v) && v > 0 && v < 500) return v
	} catch {
		// sin localStorage: usa el valor por defecto
	}
	return DEFAULT_BODY_KG
}

function readBodyKgFor(userId) {
	try {
		if (userId) {
			const p = readProfileLocal(userId)
			const w = Number(p?.weight_kg)
			if (Number.isFinite(w) && w > 0 && w < 500) return w
		}
	} catch {
		// ignora y usa el global
	}
	return readBodyKg()
}

// kg (número) → texto en la unidad visible (lb/kg) para el peso corporal
function bodyKgToDisplay(bodyKg, unit) {
	const kg = Number(bodyKg)
	if (!Number.isFinite(kg)) return ''
	if (unit === 'kg') return String(Math.round(kg * 10) / 10)
	return String(Math.round(kg * LB_PER_KG * 10) / 10)
}

// texto visible → kg (número). NaN si no es válido.
function displayToBodyKg(raw, unit) {
	const v = parseFloat(raw)
	if (!Number.isFinite(v)) return NaN
	return unit === 'kg' ? v : v / LB_PER_KG
}

function isProfileComplete(p) {
	if (!p) return false
	const w = Number(p.weight_kg)
	return Number.isFinite(w) && w > 0
}

// Racha de días consecutivos con al menos una sesión terminada.
function dayStreak(startedAtList) {
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
function sessionsByWeek(startedAtList, weeks = 8) {
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

const Phase = memo(function Phase({ phase, open, onToggle, children }) {
	return (
		<section className="border-b border-white/10 last:border-b-0">
			<button
				type="button"
				className="phase-toggle flex min-h-20 w-full items-center justify-between gap-4 py-5 text-left"
				onClick={onToggle}
				aria-expanded={open}
			>
				<span className="flex items-center gap-4">
					<span className="glass-num flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-red-500">{phase.label.replace('Fase ', '0')}</span>
					<span>
						<strong className="block text-lg font-bold text-white">{phase.title}</strong>
						<span className="text-sm text-zinc-400">{phase.detail}</span>
					</span>
				</span>
				<span className={`phase-chevron ${open ? 'open' : ''}`} aria-hidden="true">
					<svg viewBox="0 0 16 16" className="phase-chevron-icon">
						<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
			</button>
			{open && (
				<div className="phase-collapse open" aria-hidden={false}>
					<div className="phase-collapse-inner">
						<div className="phase-content pb-5">{children}</div>
					</div>
				</div>
			)}
		</section>
	)
})

const ThemeToggle = memo(function ThemeToggle({ theme, onToggle }) {
	const isLight = theme === 'light'

	return (
		<button
			type="button"
			className="theme-toggle glass-pill flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:border-red-500/60 hover:text-red-500"
			onClick={onToggle}
			aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
		>
			<span>{isLight ? 'Claro' : 'Oscuro'}</span>
		</button>
	)
})

const BackgroundOrbs = memo(function BackgroundOrbs() {
	return (
		<div className="bg-orbs" aria-hidden="true">
			<span className="orb orb-a" />
			<span className="orb orb-b" />
		</div>
	)
})

// Mini-timer global: se ve en cualquier pantalla mientras descansas.
// Al volver al entrenamiento aparece la card completa.
// Se renderiza fuera del <main> animado para que `fixed` sea al viewport.
// Recibe `theme` por prop por el mismo motivo que BottomNav: fuera del
// <main> no hereda .theme-light y se quedaba siempre oscuro.
const RestPill = memo(function RestPill({ label, seconds, onReturn, theme = 'dark' }) {
	const isLight = theme === 'light'
	return (
		<button
			type="button"
			onClick={onReturn}
			role="status"
			aria-label={`Volver al entrenamiento, descanso ${formatRest(seconds)}`}
			className="glass-card fixed left-1/2 top-20 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 shadow-2xl shadow-black/40"
			style={{
				position: 'fixed',
				top: '5rem',
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 50,
				backgroundColor: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(11,13,12,0.94)',
			}}
		>
			<span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
			<span className="truncate text-xs font-bold uppercase tracking-widest text-red-400">
				Descanso{label ? ` · ${label}` : ''}
			</span>
			<span className={`text-sm font-black tabular-nums ${isLight ? 'text-zinc-900' : 'text-white'}`}>{formatRest(seconds)}</span>
			<span aria-hidden="true" className="text-xs text-zinc-500">→</span>
		</button>
	)
})

// Flechas para mover el contenido de un día en el modo editar del home.
// Etiquetas con destino ("Mover Pecho y espalda al Jueves") para que quede
// claro que se mueve la rutina, no el día.
const MoveButtons = memo(function MoveButtons({ upLabel, downLabel, canUp, canDown, onMove }) {
	const base = 'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-sm text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'
	return (
		<span className="flex shrink-0 flex-col gap-1">
			<button type="button" onClick={() => onMove(-1)} disabled={!canUp} aria-label={upLabel} title={upLabel} className={base}>↑</button>
			<button type="button" onClick={() => onMove(1)} disabled={!canDown} aria-label={downLabel} title={downLabel} className={base}>↓</button>
		</span>
	)
})

// Barras apiladas de kcal por sesión (fuerza + cardio + calentamiento). SVG puro, sin dependencias.
const CalorieBars = memo(function CalorieBars({ data }) {
	if (data.length === 0) return null
	const W = 340
	const H = 170
	const PAD_L = 34
	const PAD_B = 20
	const PAD_T = 24
	const max = Math.max(1, ...data.map((d) => d.strength + d.cardio + d.warmup))
	const totals = data.map((d) => d.strength + d.cardio + d.warmup)
	const avg = totals.reduce((a, v) => a + v, 0) / Math.max(1, totals.length)
	const innerW = W - PAD_L - 8
	const innerH = H - PAD_T - PAD_B
	const slot = innerW / data.length
	const bw = Math.min(30, slot * 0.52)
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Calorías estimadas por sesión">
			{[0.25, 0.5, 0.75, 1].map((f) => {
				const y = PAD_T + innerH * (1 - f)
				return (
					<g key={f}>
						<line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
						<text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#71717a">{Math.round(max * f)}</text>
					</g>
				)
			})}
			{avg > 0 && (() => {
				const y = PAD_T + innerH * (1 - avg / max)
				return (
					<g>
						<line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="#f87171" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
						<text x={W - 8} y={y - 4} textAnchor="end" fontSize="8" fontWeight="700" fill="#f87171">Prom ~{Math.round(avg)}</text>
					</g>
				)
			})()}
			{data.map((d, i) => {
				const total = d.strength + d.cardio + d.warmup
				const h = Math.max(total > 0 ? 3 : 0, (total / max) * innerH)
				const hs = (d.strength / max) * innerH
				const hc = (d.cardio / max) * innerH
				const hw = (d.warmup / max) * innerH
				const x = PAD_L + slot * i + (slot - bw) / 2
				const y = PAD_T + innerH - h
				return (
					<g key={d.id}>
						<title>{`${d.label}: ~${Math.round(total)} kcal (fuerza ~${Math.round(d.strength)} + cardio ~${Math.round(d.cardio)} + calent. ~${Math.round(d.warmup)})`}</title>
						<rect x={x} y={y} width={bw} height={h} rx="4" fill="rgba(255,255,255,0.06)" />
						{d.strength > 0 && (
							<rect x={x} y={PAD_T + innerH - hs} width={bw} height={hs} fill="#ef4444" />
						)}
						{d.cardio > 0 && (
							<rect x={x} y={PAD_T + innerH - hs - hc} width={bw} height={hc} fill="#f59e0b" />
						)}
						{d.warmup > 0 && (
							<rect x={x} y={y} width={bw} height={hw} rx="4" fill="#38bdf8" />
						)}
						<text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="8" fontWeight="800" fill="#e4e4e7">{Math.round(total)}</text>
						<text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#71717a">{d.short}</text>
					</g>
				)
			})}
		</svg>
	)
})

// Barras de constancia: sesiones por semana + línea de meta (5/semana). SVG puro.
const WeekBars = memo(function WeekBars({ data, goal = 5 }) {
	if (data.length === 0) return null
	const W = 340
	const H = 150
	const PAD_L = 22
	const PAD_B = 20
	const PAD_T = 22
	const max = Math.max(goal, 1, ...data.map((d) => d.value))
	const innerW = W - PAD_L - 8
	const innerH = H - PAD_T - PAD_B
	const slot = innerW / data.length
	const bw = Math.min(26, slot * 0.55)
	const goalY = PAD_T + innerH * (1 - goal / max)
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Sesiones por semana, meta ${goal}`}>
			<g>
				<line x1={PAD_L} y1={goalY} x2={W - 8} y2={goalY} stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
				<text x={W - 8} y={goalY - 4} textAnchor="end" fontSize="8" fontWeight="700" fill="#22c55e">Meta {goal}</text>
			</g>
			{data.map((d, i) => {
				const h = Math.max(d.value > 0 ? 4 : 0, (d.value / max) * innerH)
				const x = PAD_L + slot * i + (slot - bw) / 2
				const y = PAD_T + innerH - h
				return (
					<g key={d.id}>
						<title>{`${d.label}: ${d.value} ${d.value === 1 ? 'sesión' : 'sesiones'}`}</title>
						<text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="800" fill={d.current ? '#f87171' : '#e4e4e7'}>{d.value}</text>
						<rect x={x} y={y} width={bw} height={h} rx="4" fill={d.current ? '#ef4444' : d.value >= goal ? '#22c55e' : 'rgba(255,255,255,0.22)'} opacity={d.current ? 1 : 0.85} />
						<text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fontWeight={d.current ? 800 : 400} fill={d.current ? '#f87171' : '#71717a'}>{d.short}</text>
					</g>
				)
			})}
		</svg>
	)
})

// Línea de tendencia genérica (p. ej. peso total movido por sesión). SVG puro.
const TrendLine = memo(function TrendLine({ data, color = '#22c55e', unit = '' }) {
	if (data.length === 0) return null
	const W = 340
	const H = 130
	const PAD_L = 38
	const PAD_B = 20
	const PAD_T = 14
	const vals = data.map((d) => d.value)
	const max = Math.max(...vals)
	const min = Math.min(...vals)
	const span = max - min || 1
	const innerW = W - PAD_L - 8
	const innerH = H - PAD_T - PAD_B
	const px = (i) => PAD_L + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1))
	const py = (v) => PAD_T + innerH * (1 - (v - min) / span)
	const points = data.map((d, i) => `${px(i)},${py(d.value)}`).join(' ')
	const last = data[data.length - 1]
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tendencia ${unit}`}>
			{[0, 0.5, 1].map((f) => {
				const v = min + span * f
				const y = py(v)
				return (
					<g key={f}>
						<line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
						<text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#71717a">{Math.round(v)}</text>
					</g>
				)
			})}
			<polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
			{data.map((d, i) => (
				<g key={d.id}>
					<title>{`${d.label}: ${Math.round(d.value)} ${unit}`}</title>
					<circle cx={px(i)} cy={py(d.value)} r={i === data.length - 1 ? 4.5 : 3} fill={color} stroke="#0b0d0c" strokeWidth="1.5" />
					{i % Math.ceil(data.length / 6) === 0 && (
						<text x={px(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#71717a">{d.short}</text>
					)}
				</g>
			))}
			<text x={W - 10} y={py(last.value) - 8} textAnchor="end" fontSize="10" fontWeight="800" fill={color}>
				{Math.round(last.value)} {unit}
			</text>
		</svg>
	)
})

// Selector de unidad lb/kg para los modales de peso. Todo se guarda en lb.
const UnitToggle = memo(function UnitToggle({ unit, onSwitch }) {
	return (
		<div className="glass-inset flex rounded-xl p-1" role="group" aria-label="Unidad de peso">
			{['lb', 'kg'].map((u) => (
				<button
					key={u}
					type="button"
					onClick={() => onSwitch(u)}
					aria-pressed={unit === u}
					className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${unit === u ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
				>
					{u === 'lb' ? 'lb' : 'kg'}
				</button>
			))}
		</div>
	)
})

// Snackbar glassy para avisos (errores de validación en modales).
// Vive fuera del <main> como BottomNav/RestPill: fixed real al viewport y
// por encima de los modales (z-60). Estilo oscuro propio, legible en claro y oscuro.
const Snackbar = memo(function Snackbar({ snack, onClose }) {
	if (!snack) return null
	return (
		<div
			key={snack.key}
			role="alert"
			className={`snackbar glass-card ${snack.tone === 'warn' ? 'warn' : 'error'}`}
			style={{ position: 'fixed', zIndex: 60 }}
		>
			<span aria-hidden="true" className="snackbar-dot" />
			<p>{snack.msg}</p>
			<button type="button" onClick={onClose} aria-label="Cerrar aviso" className="snackbar-close">
				×
			</button>
		</div>
	)
})

// Opciones de sexo (mismo catálogo en onboarding y perfil).
const SEX_OPTIONS = [
	{ value: 'masculino', label: 'Masculino' },
	{ value: 'femenino', label: 'Femenino' },
	{ value: 'otro', label: 'Otro' },
]

// Combobox personalizado (reemplaza al <select> vanilla): botón + lista
// con el mismo sistema glassy de la app, navegable por teclado y con
// soporte de tema claro/oscuro vía .theme-light.
const CustomSelect = memo(function CustomSelect({ value, onChange, options = SEX_OPTIONS, placeholder = 'Selecciona…', ariaLabel = 'Seleccionar opción' }) {
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(-1)
	const rootRef = useRef(null)
	const selected = options.find((o) => o.value === value) ?? null

	useEffect(() => {
		if (!open) return
		const onPointer = (e) => {
			if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
		}
		const onKey = (e) => {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', onPointer)
		document.addEventListener('touchstart', onPointer)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onPointer)
			document.removeEventListener('touchstart', onPointer)
			document.removeEventListener('keydown', onKey)
		}
	}, [open ])

	const pick = (v) => {
		onChange(v)
		setOpen(false)
		setActive(-1)
	}

	const onTriggerKey = (e) => {
		if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			setOpen((v) => !v)
			setActive(options.findIndex((o) => o.value === value))
		}
	}

	const onListKey = (e) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActive((i) => (i + 1) % (options.length + 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActive((i) => (i <= 0 ? options.length : i - 1))
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			if (active === -1 || active === options.length) pick('')
			else if (options[active]) pick(options[active].value)
		}
	}

	return (
		<div ref={rootRef} className={`custom-select ${open ? 'open' : ''}`}>
			<button
				type="button"
				className="custom-select-btn glass-inset"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={ariaLabel}
				onClick={() => { setOpen((v) => !v); setActive(options.findIndex((o) => o.value === value)) }}
				onKeyDown={onTriggerKey}
			>
				<span className={selected ? 'custom-select-value' : 'custom-select-placeholder'}>
					{selected ? selected.label : placeholder}
				</span>
				<svg viewBox="0 0 16 16" aria-hidden="true" className={`custom-select-chevron ${open ? 'open' : ''}`}>
					<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>
			{open && (
				<ul className="custom-select-list glass-card" role="listbox" aria-label={ariaLabel} onKeyDown={onListKey} tabIndex={-1}>
					<li role="option" aria-selected={value === ''} className={`custom-select-option ${value === '' ? 'selected' : ''} ${active === options.length ? 'active' : ''}`}>
						<button type="button" className="custom-select-option-btn is-clear" onClick={() => pick('')} onMouseEnter={() => setActive(options.length)}>
							<span>{placeholder}</span>
							{value === '' && <span aria-hidden="true" className="custom-select-check">✓</span>}
						</button>
					</li>
					{options.map((opt, i) => {
						const isSel = opt.value === value
						return (
							<li key={opt.value} role="option" aria-selected={isSel} className={`custom-select-option ${isSel ? 'selected' : ''} ${active === i ? 'active' : ''}`}>
								<button type="button" className="custom-select-option-btn" onClick={() => pick(opt.value)} onMouseEnter={() => setActive(i)}>
									<span>{opt.label}</span>
									{isSel && <span aria-hidden="true" className="custom-select-check">✓</span>}
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
})

// Onboarding de cuentas nuevas: datos básicos para las stats (peso, altura, edad, sexo).
const OnboardingModal = memo(function OnboardingModal({ form, setForm, unit, onSwitchUnit, error, saving, onSubmit, onSkip }) {
	return (
		<div className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5" role="dialog" aria-modal="true" aria-label="Completa tus datos básicos">
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<h3 className="text-lg font-black text-white">Bienvenido · tus datos básicos</h3>
				<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Nos ayudan a calcular tus stats (kcal, IMC)</p>
				<form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
					<UnitToggle unit={unit} onSwitch={onSwitchUnit} />
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Tu peso ({unit}) *
						<input
							type="number"
							min="0"
							step="0.5"
							value={form.weight}
							onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
							placeholder={unit === 'kg' ? 'ej. 75' : 'ej. 165'}
							autoFocus={FINE_POINTER}
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<div className="grid grid-cols-2 gap-2">
						<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
							Altura (cm)
							<input
								type="number"
								min="100"
								max="250"
								step="0.5"
								value={form.height}
								onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
								placeholder="ej. 175"
								className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
							/>
						</label>
						<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
							Edad
							<input
								type="number"
								min="10"
								max="100"
								step="1"
								value={form.age}
								onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
								placeholder="ej. 28"
								className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
							/>
						</label>
					</div>
					<div className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						<span id="onboarding-sex-label">Sexo</span>
						<CustomSelect
							value={form.sex}
							onChange={(v) => setForm((p) => ({ ...p, sex: v }))}
							placeholder="Prefiero no decir"
							ariaLabel="Tu sexo"
						/>
					</div>
					{error && (
						<p className="text-sm text-red-400">{error}</p>
					)}
					<button
						type="submit"
						disabled={saving}
						className="min-h-12 w-full rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:opacity-60"
					>
						{saving ? 'Guardando…' : 'Guardar y empezar'}
					</button>
					<button
						type="button"
						onClick={onSkip}
						className="min-h-10 w-full rounded-xl border border-white/10 px-4 text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25"
					>
						Omitir por ahora
					</button>
				</form>
			</div>
		</div>
	)
})

function App() {
	const [session, setSession] = useState(null)
	const [selectedDay, setSelectedDay] = useState(null)
	// Contenido de la semana (rutina/descanso por día, Lun..Dom fijos).
	// Solo lista. Clave antigua `tempolift-week-order-*` ignorada a propósito:
	// el modelo cambió de "mover días" a "mover contenidos".
	const [weekMap, setWeekMap] = useState(() => readWeekMap(null) ?? DEFAULT_WEEK_MAP.map((s) => ({ ...s })))
	// Meta semanal de sesiones de este usuario (1 a 7).
	const [weekGoal, setWeekGoal] = useState(() => readWeekGoal(null))
	const [editingWeek, setEditingWeek] = useState(false)
	const [theme, setTheme] = useState(() => readTheme())
	const [openPhase, setOpenPhase] = useState('strength')
	// Series por ejercicio: { [workoutId]: { [index]: 1 | 2 } }. Solo suma al progreso con las 2 series.
	const [seriesByDay, setSeriesByDay] = useState({})
	const [expandedKey, setExpandedKey] = useState(null)
	const [dayComplete, setDayComplete] = useState(false)
	const [currentView, setCurrentView] = useState('home')
	// Un solo flujo de entreno: el plan semanal (selectedDay). El segundo flujo
	// paralelo ("Tus rutinas" → ActiveWorkout) se eliminó para que sea imposible
	// tener dos rutinas/sesiones activas a la vez y que cuenten doble.
	const [sbRoutines, setSbRoutines] = useState([])
	const [sbSessions, setSbSessions] = useState([])
	const [sbLoading, setSbLoading] = useState(false)
	// Detalle del historial: sesión abierta, sus series y edición de peso
	const [openSession, setOpenSession] = useState(null)
	const [sessionSets, setSessionSets] = useState({})
	const [setsLoading, setSetsLoading] = useState(false)
	const [editingSet, setEditingSet] = useState(null)
	const [editWeight, setEditWeight] = useState('')
	const [editReps, setEditReps] = useState('')
	const [setMsg, setSetMsg] = useState('')
	const [confirmDelete, setConfirmDelete] = useState(null)
	// Exportar / borrar todo el historial (sección Tus datos del perfil)
	const [dataMsg, setDataMsg] = useState('')
	const [confirmWipe, setConfirmWipe] = useState(false)
	const [restLeft, setRestLeft] = useState(0)
	const [restLabel, setRestLabel] = useState('')
	const [restSeries, setRestSeries] = useState(1)
	const [lastDay, setLastDay] = useState(null)
	// Peso anotado por serie: { [workoutId]: { [index]: { 1: { weight, reps }, 2: { weight, reps } } } }
	const [weights, setWeights] = useState({})
	// Modal para anotar peso: { workoutId, index, name, setNumber, planReps } o null
	const [weightModal, setWeightModal] = useState(null)
	const [weightInput, setWeightInput] = useState('')
	const [repsInput, setRepsInput] = useState('')
	// Cardio (Fase 3): se marca una sola vez por día + minutos (+ kcal reales
	// de la máquina, opcionales: si se anotan reemplazan la estimación).
	const [cardioByDay, setCardioByDay] = useState({})
	const [cardioModal, setCardioModal] = useState(null)
	const [cardioInput, setCardioInput] = useState('')
	const [cardioMachineInput, setCardioMachineInput] = useState('')
	// Calentamiento (Fase 1): igual que el cardio, una sola marca + minutos
	const [warmupByDay, setWarmupByDay] = useState({})
	const [warmupModal, setWarmupModal] = useState(null)
	const [warmupInput, setWarmupInput] = useState('')
	const [warmupMachineInput, setWarmupMachineInput] = useState('')
	// Snackbar de avisos (errores de validación en modales). Auto-cierre.
	const [snack, setSnack] = useState(null)
	const snackTimer = useRef(null)
	const showSnack = useCallback((msg, tone = 'error') => {
		if (snackTimer.current) clearTimeout(snackTimer.current)
		setSnack({ msg, tone, key: Date.now() })
		snackTimer.current = setTimeout(() => setSnack(null), 3500)
	}, [])
	const closeSnack = useCallback(() => {
		if (snackTimer.current) clearTimeout(snackTimer.current)
		setSnack(null)
	}, [])
	// Unidad visible del peso (lb/kg). Todo se guarda en lb.
	const [weightUnit, setWeightUnit] = useState(() => readWeightUnit())
	// Peso corporal (kg) para estimar las kcal del cardio. Por usuario (perfil + local).
	const [bodyKg, setBodyKg] = useState(() => readBodyKg())
	// Perfil básico para stats + onboarding de cuentas nuevas
	const [profile, setProfile] = useState(null)
	const [profileLoading, setProfileLoading] = useState(false)
	const [showOnboarding, setShowOnboarding] = useState(false)
	const [onboarding, setOnboarding] = useState({ weight: '', height: '', age: '', sex: '' })
	const [onboardingError, setOnboardingError] = useState('')
	const [onboardingSaving, setOnboardingSaving] = useState(false)
	// Edición del perfil en Mi perfil (peso con lb/kg + altura/edad/sexo)
	const [profileForm, setProfileForm] = useState({ weight: '', height: '', age: '', sex: '' })
	const [profileMsg, setProfileMsg] = useState('')
	const [profileSaving, setProfileSaving] = useState(false)
	// Stats del perfil: agregados por sesión terminada
	const [statsLoading, setStatsLoading] = useState(false)
	const [statsRows, setStatsRows] = useState([])
	const [statsError, setStatsError] = useState('')
	// Mejor marca por ejercicio (para la lista de récords del perfil)
	const [exerciseRecords, setExerciseRecords] = useState([])
	const [showAllRecords, setShowAllRecords] = useState(false)
	// Vínculos del plan en la base de datos + último peso por ejercicio
	const [planIds, setPlanIds] = useState(null)
	const [lastW, setLastW] = useState({})
	// Últimas series por ejercicio, para el historial del acordeón
	const [recentW, setRecentW] = useState({})
	const [syncError, setSyncError] = useState('')
	// Estado del guardado del día: idle | saving | saved | error
	const [saveStatus, setSaveStatus] = useState({ state: 'idle', msg: '' })
	const saveSigRef = useRef(null)
	const dayStartRef = useRef(null)

	const isResting = restLeft > 0

	const selectedWorkout = workoutDays.find((day) => day.id === selectedDay) ?? null

	const seriesMap = selectedWorkout ? (seriesByDay[selectedWorkout.id] ?? {}) : {}
	const checkedList = Object.entries(seriesMap).filter(([, v]) => v === 2).map(([k]) => Number(k))
	// El cardio y el calentamiento cuentan como un ítem más del día (una sola marca cada uno).
	const cardioEntry = selectedWorkout ? cardioByDay[selectedWorkout.id] : null
	const cardioDone = Boolean(cardioEntry)
	const cardioMinutes = cardioEntry?.minutes ?? 0
	const cardioMachineKcal = cardioEntry?.machineKcal ?? null
	const warmupEntry = selectedWorkout ? warmupByDay[selectedWorkout.id] : null
	const warmupDone = Boolean(warmupEntry)
	const warmupMinutes = warmupEntry?.minutes ?? 0
	const warmupMachineKcal = warmupEntry?.machineKcal ?? null
	const dayWeights = selectedWorkout ? (weights[selectedWorkout.id] ?? {}) : {}
	const { volumeKg: dayVolumeKg, kcal: dayStrengthKcal } = strengthKcalFromWeights(dayWeights)
	// Si el usuario anotó las calorías reales de la máquina, mandan sobre la estimación.
	const dayCardioKcal = cardioDone ? (cardioMachineKcal != null ? cardioMachineKcal : cardioKcalFor(cardioMinutes, bodyKg)) : 0
	const dayWarmupKcal = warmupDone ? (warmupMachineKcal != null ? warmupMachineKcal : WARMUP_MET * (Number(bodyKg) > 0 ? Number(bodyKg) : DEFAULT_BODY_KG) * (warmupMinutes / 60)) : 0
	const dayTotalKcal = dayStrengthKcal + dayCardioKcal + dayWarmupKcal
	const totalExercises = selectedWorkout ? selectedWorkout.exercises.length + 2 : 0
	const doneCount = checkedList.length + (cardioDone ? 1 : 0) + (warmupDone ? 1 : 0)
	const progress = totalExercises ? doneCount / totalExercises : 0
	const allDone = totalExercises > 0 && doneCount === totalExercises
	const missingLabels = [!warmupDone && 'calentamiento', !cardioDone && 'cardio'].filter(Boolean)

	const togglePhase = useCallback((phase) => {
		setOpenPhase((current) => (current === phase ? '' : phase))
	}, [])

	const toggleTheme = useCallback(() => {
		setTheme((current) => {
			const next = current === 'dark' ? 'light' : 'dark'
			persistTheme(next)
			return next
		})
	}, [])

	// Primer toque = anota peso (serie 1) + descanso. Segundo toque = anota peso (serie 2) + descanso. Tercer toque = desmarcar.
	const handleToggleCheck = (workoutId, index, exerciseName, planReps) => {
		if (restLeft > 0 || weightModal || cardioModal || warmupModal) return
		const current = seriesByDay[workoutId]?.[index] ?? 0
		if (current >= 2) {
			setDayComplete(false)
			setSeriesByDay((prev) => {
				const day = { ...(prev[workoutId] ?? {}) }
				delete day[index]
				return { ...prev, [workoutId]: day }
			})
			setWeights((prev) => {
				const day = { ...(prev[workoutId] ?? {}) }
				delete day[index]
				return { ...prev, [workoutId]: day }
			})
			return
		}
		const setNumber = current + 1
		// El modal abre vacío a propósito: sin peso ni reps por defecto para
		// no empujar al usuario a una marca (el último registro se muestra
		// como texto informativo y en el historial del ejercicio).
		setWeightInput('')
		setRepsInput('')
		setWeightModal({ workoutId, index, name: exerciseName ?? 'Ejercicio', setNumber, planReps })
	}

	// Cambia lb ↔ kg convirtiendo todo lo ya escrito (una sola vez por campo).
	// La preferencia persiste. Se convierten todos los inputs de peso visibles
	// u ocultos para que ninguno quede en la unidad vieja.
	const switchWeightUnit = (u) => {
		if (u === weightUnit) return
		const from = weightUnit
		setWeightInput((cur) => convertInputUnit(cur, from, u))
		setEditWeight((cur) => convertInputUnit(cur, from, u))
		setProfileForm((prev) => ({ ...prev, weight: convertInputUnit(prev.weight, from, u) }))
		setOnboarding((prev) => ({ ...prev, weight: convertInputUnit(prev.weight, from, u) }))
		setWeightUnit(u)
		persistWeightUnit(u)
	}

	const closeWeightModal = () => {
		setWeightModal(null)
		setWeightInput('')
		setRepsInput('')
	}

	const confirmWeightModal = (e) => {
		if (e) e.preventDefault()
		if (!weightModal) return
		// Los formularios llevan noValidate: el navegador no bloquea y el aviso
		// sale en el snackbar con estilo propio (incluida la regla del paso 0.5).
		const rawW = parseFloat(weightInput)
		const rawR = parseFloat(repsInput)
		if (!Number.isFinite(rawW) || rawW < 0) {
			showSnack(`Escribe un peso válido en ${weightUnit} (0 o más)`)
			return
		}
		if (Math.abs(rawW * 2 - Math.round(rawW * 2)) > 1e-9) {
			showSnack(`El peso va de 0.5 en 0.5 ${weightUnit} (ej. ${weightHintFor(weightModal.name, weightUnit)})`)
			return
		}
		if (!Number.isFinite(rawR) || rawR < 0 || Math.abs(rawR - Math.round(rawR)) > 1e-9) {
			showSnack('Escribe repeticiones enteras (0 o más)')
			return
		}
		const wLb = displayToLb(weightInput, weightUnit)
		const r = parseInt(repsInput, 10)
		const w = Math.round(wLb * 100) / 100
		const { workoutId, index, name, setNumber } = weightModal
		setSeriesByDay((prev) => ({
			...prev,
			[workoutId]: { ...(prev[workoutId] ?? {}), [index]: setNumber },
		}))
		setWeights((prev) => ({
			...prev,
			[workoutId]: { ...(prev[workoutId] ?? {}), [index]: { ...(prev[workoutId]?.[index] ?? {}), [setNumber]: { weight: w, reps: r } } },
		}))
		setDayComplete(false)
		setWeightModal(null)
		setWeightInput('')
		setRepsInput('')
		setRestLabel(name)
		setRestSeries(setNumber)
		setRestLeft(REST_SECONDS)
	}

	const skipRest = useCallback(() => setRestLeft(0), [])

	const resetDay = useCallback((workoutId) => {
		setSeriesByDay((prev) => ({ ...prev, [workoutId]: {} }))
		setWeights((prev) => ({ ...prev, [workoutId]: {} }))
		setCardioByDay((prev) => {
			const next = { ...prev }
			delete next[workoutId]
			return next
		})
		setWarmupByDay((prev) => {
			const next = { ...prev }
			delete next[workoutId]
			return next
		})
		setCardioModal(null)
		setCardioInput('')
		setCardioMachineInput('')
		setWarmupModal(null)
		setWarmupInput('')
		setWarmupMachineInput('')
		setDayComplete(false)
		setExpandedKey(null)
		setRestLeft(0)
		setSaveStatus({ state: 'idle', msg: '' })
		saveSigRef.current = null
	}, [])

	// Guarda el peso corporal (kg): memoria + perfil + local por usuario + Supabase.
	// No bloquea la UI si la tabla profiles aún no existe.
	const persistBodyKg = (kg, extraPatch) => {
		const v = Number(kg)
		if (!Number.isFinite(v) || v <= 0 || v >= 500) return
		const rounded = Math.round(v * 10) / 10
		setBodyKg(rounded)
		const uid = session?.user?.id
		const nextProfile = { ...(profile ?? {}), ...(extraPatch ?? {}), weight_kg: rounded, updated_at: new Date().toISOString() }
		setProfile(nextProfile)
		persistProfileLocal(uid, nextProfile)
		try {
			localStorage.setItem('tempolift-body-kg', String(rounded))
		} catch {
			// sin localStorage: el valor vive solo en memoria
		}
		upsertProfile(uid, { user_id: uid, weight_kg: rounded, updated_at: new Date().toISOString() })
	}

	// Cardio: un solo check por día. Abrir = pedir minutos (+ kcal reales
	// de la máquina, opcionales). El peso se toma del perfil del usuario.
	// Se puede marcar aunque haya descanso activo (es otra fase).
	const openCardio = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal) return
		const prev = cardioByDay[selectedWorkout.id]
		setCardioInput(prev ? String(prev.minutes) : String(DEFAULT_CARDIO_MIN))
		setCardioMachineInput(prev?.machineKcal != null ? String(prev.machineKcal) : '')
		setCardioModal({ workoutId: selectedWorkout.id })
	}

	const closeCardioModal = () => {
		setCardioModal(null)
		setCardioInput('')
		setCardioMachineInput('')
	}

	// Las kcal de la máquina son opcionales (0 a 5000, enteras). Si se anotan,
	// reemplazan la estimación en el total del día y en el historial.
	function parseMachineKcal(raw) {
		if (raw === '' || raw == null) return null
		const v = parseFloat(raw)
		if (!Number.isFinite(v) || v < 0 || v > 5000 || Math.abs(v - Math.round(v)) > 1e-9) return NaN
		return Math.round(v)
	}

	const confirmCardio = (e) => {
		if (e) e.preventDefault()
		if (!cardioModal) return
		const m = parseFloat(cardioInput)
		if (!Number.isFinite(m) || m <= 0 || m > 180 || Math.abs(m - Math.round(m)) > 1e-9) {
			showSnack('Escribe los minutos en enteros (1 a 180)')
			return
		}
		const machine = parseMachineKcal(cardioMachineInput)
		if (Number.isNaN(machine)) {
			showSnack('Calorías de la máquina inválidas (enteras, 0 a 5000, o vacío)')
			return
		}
		const { workoutId } = cardioModal
		setCardioByDay((prev) => ({ ...prev, [workoutId]: { minutes: m, machineKcal: machine } }))
		setDayComplete(false)
		setCardioModal(null)
		setCardioInput('')
		setCardioMachineInput('')
	}

	const unmarkCardio = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal) return
		setDayComplete(false)
		setCardioByDay((prev) => {
			const next = { ...prev }
			delete next[selectedWorkout.id]
			return next
		})
	}

	// Calentamiento: igual que el cardio, una sola marca + minutos + peso.
	const openWarmup = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal) return
		const prev = warmupByDay[selectedWorkout.id]
		setWarmupInput(prev ? String(prev.minutes) : String(DEFAULT_WARMUP_MIN))
		setWarmupMachineInput(prev?.machineKcal != null ? String(prev.machineKcal) : '')
		setWarmupModal({ workoutId: selectedWorkout.id })
	}

	const closeWarmupModal = () => {
		setWarmupModal(null)
		setWarmupInput('')
		setWarmupMachineInput('')
	}

	const confirmWarmup = (e) => {
		if (e) e.preventDefault()
		if (!warmupModal) return
		const m = parseFloat(warmupInput)
		if (!Number.isFinite(m) || m <= 0 || m > 60 || Math.abs(m - Math.round(m)) > 1e-9) {
			showSnack('Escribe los minutos en enteros (1 a 60)')
			return
		}
		const machine = parseMachineKcal(warmupMachineInput)
		if (Number.isNaN(machine)) {
			showSnack('Calorías de la máquina inválidas (enteras, 0 a 5000, o vacío)')
			return
		}
		const { workoutId } = warmupModal
		setWarmupByDay((prev) => ({ ...prev, [workoutId]: { minutes: m, machineKcal: machine } }))
		setDayComplete(false)
		setWarmupModal(null)
		setWarmupInput('')
		setWarmupMachineInput('')
	}

	const unmarkWarmup = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal) return
		setDayComplete(false)
		setWarmupByDay((prev) => {
			const next = { ...prev }
			delete next[selectedWorkout.id]
			return next
		})
	}

	const handleBodyKg = (raw) => {
		const v = parseFloat(raw)
		if (Number.isFinite(v) && v > 0 && v < 500) {
			persistBodyKg(v)
		}
	}

	const toggleExpand = useCallback((key) => {
		setExpandedKey((cur) => (cur === key ? null : key))
	}, [])

	const selectDay = useCallback((id) => {
		setSelectedDay(id)
		setLastDay(id)
		setEditingWeek(false)
	}, [])
	const goBack = useCallback(() => setSelectedDay(null), [])
	const returnToTraining = useCallback(() => {
		if (lastDay != null) setSelectedDay(lastDay)
		setCurrentView('home')
	}, [lastDay])
	const signInWithGoogle = useCallback(async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: window.location.origin,
			},
		})
	}, [])
	const signOut = useCallback(async () => {
		await supabase.auth.signOut()
	}, [])

	const handleNav = useCallback((view) => {
		setCurrentView(view)
		setSelectedDay(null)
		setOpenSession(null)
		setEditingSet(null)
		setSetMsg('')
		setConfirmDelete(null)
		setCardioModal(null)
		setWarmupModal(null)
		setEditingWeek(false)
		setDataMsg('')
		setConfirmWipe(false)
	}, [])

	// Mueve el CONTENIDO de un día (rutina o descanso) al día vecino,
	// intercambiándolos. Los días Lun..Dom nunca cambian de sitio.
	// Guarda el mapa para este usuario.
	const moveWeekDay = useCallback((from, dir) => {
		const to = from + dir
		setWeekMap((prev) => {
			if (to < 0 || to >= prev.length) return prev
			const next = prev.map((s) => ({ ...s }))
			const tmp = next[from]
			next[from] = next[to]
			next[to] = tmp
			persistWeekMap(session?.user?.id, next)
			return next
		})
	}, [session?.user?.id])

	const resetWeekOrder = useCallback(() => {
		const next = DEFAULT_WEEK_MAP.map((s) => ({ ...s }))
		setWeekMap(next)
		persistWeekMap(session?.user?.id, next)
	}, [session?.user?.id])

	// Cambiar la meta regenera la semana con el plan de esos días (qué días se
	// entrena y qué rutina toca, cubriendo todo el cuerpo). Los movimientos
	// manuales previos se reemplazan: el snackbar lo avisa.
	const changeWeekGoal = (dir) => {
		const next = Math.min(7, Math.max(1, weekGoal + dir))
		if (next === weekGoal) return
		setWeekGoal(next)
		persistWeekGoal(session?.user?.id, next)
		const map = buildWeekMapForGoal(next)
		setWeekMap(map)
		persistWeekMap(session?.user?.id, map)
		showSnack(`Plan de ${next} ${next === 1 ? 'día' : 'días'} aplicado en tu semana`)
	}

	// Filas del home: días fijos Lun..Dom con el contenido de este usuario.
	const dayRows = weekSchedule.map((entry, i) => {
		const slot = weekMap[i] ?? DEFAULT_WEEK_MAP[i]
		return slot.rest
			? { day: entry.day, fullDay: entry.fullDay, rest: true }
			: { day: entry.day, fullDay: entry.fullDay, workoutId: slot.workoutId }
	})
	// Días que entrenan esta semana (== meta salvo edición manual imposible):
	// alimenta contadores del home y el "Día X / N" del detalle.
	const trainingRows = dayRows.filter((r) => !r.rest)
	const trainingCount = trainingRows.length

	const deleteSession = async (s) => {
		if (confirmDelete !== s.id) {
			setConfirmDelete(s.id)
			return
		}
		setConfirmDelete(null)
		try {
			const { error: logsError } = await supabase
				.from('set_logs')
				.delete()
				.eq('user_id', session.user.id)
				.eq('session_id', s.id)
			if (logsError) throw logsError
			const { error: sessionError } = await supabase
				.from('workout_sessions')
				.delete()
				.eq('id', s.id)
				.eq('user_id', session.user.id)
			if (sessionError) throw sessionError
			setSbSessions((prev) => prev.filter((x) => x.id !== s.id))
			setSessionSets((prev) => {
				const next = { ...prev }
				delete next[s.id]
				return next
			})
			if (openSession === s.id) setOpenSession(null)
			setSetMsg('Entrenamiento eliminado')
		} catch (err) {
			setSetMsg(`No se pudo eliminar: ${friendlyError(err)}`)
		}
	}

	// Borra TODAS las sesiones y series del usuario (rutinas y perfil intactos).
	// Doble toque para confirmar, mismo patrón que borrar una sesión.
	const wipeHistory = async () => {
		if (!confirmWipe) {
			setConfirmWipe(true)
			setDataMsg('')
			return
		}
		setConfirmWipe(false)
		try {
			const uid = session.user.id
			const { error: logsError } = await supabase.from('set_logs').delete().eq('user_id', uid)
			if (logsError) throw logsError
			const { error: sessError } = await supabase.from('workout_sessions').delete().eq('user_id', uid)
			if (sessError) throw sessError
			setSbSessions([])
			setSessionSets({})
			setStatsRows([])
			setExerciseRecords([])
			setOpenSession(null)
			setDataMsg('Historial borrado')
		} catch (err) {
			setDataMsg(`No se pudo borrar: ${friendlyError(err)}`)
		}
	}

	const toggleSession = async (s) => {
		if (openSession === s.id) {
			setOpenSession(null)
			return
		}
		setOpenSession(s.id)
		setSetMsg('')
		if (sessionSets[s.id]) return
		setSetsLoading(true)
		try {
			const { data, error } = await supabase
				.from('set_logs')
				.select('id, session_id, set_number, weight_kg, reps, exercise_id, exercises (name)')
				.eq('user_id', session.user.id)
				.eq('session_id', s.id)
				.order('created_at', { ascending: true })
			if (error) throw error
			setSessionSets((prev) => ({ ...prev, [s.id]: data ?? [] }))
		} catch (err) {
			setSetMsg(`No se pudieron cargar las series: ${friendlyError(err)}`)
		} finally {
			setSetsLoading(false)
		}
	}

	const startEditSet = (row) => {
		setEditingSet(row.id)
		setEditWeight(displayWeight(row.weight_kg ?? '', weightUnit))
		setEditReps(String(row.reps ?? ''))
		setSetMsg('')
	}

	const saveEditSet = async (row) => {
		const wLb = displayToLb(editWeight, weightUnit)
		const r = parseInt(editReps, 10)
		if (!Number.isFinite(wLb) || wLb < 0 || Number.isNaN(r) || r < 0) {
			setSetMsg('Escribe peso y repeticiones válidos')
			return
		}
		const w = Math.round(wLb * 100) / 100
		try {
			const { error } = await supabase
				.from('set_logs')
				.update({ weight_kg: w, reps: r })
				.eq('id', row.id)
				.eq('user_id', session.user.id)
			if (error) throw error
			setSessionSets((prev) => ({
				...prev,
				[row.session_id ?? openSession]: (prev[row.session_id ?? openSession] ?? []).map((x) => (x.id === row.id ? { ...x, weight_kg: w, reps: r } : x)),
			}))
			setEditingSet(null)
			setSetMsg('Peso actualizado ✓')
		} catch (err) {
			setSetMsg(`No se pudo actualizar: ${friendlyError(err)}`)
		}
	}

	useEffect(() => {
		if (restLeft <= 0) return
		const t = setTimeout(() => setRestLeft((v) => Math.max(0, v - 1)), 1000)
		return () => clearTimeout(t)
	}, [restLeft])

	// Modal abierto = fondo bloqueado: sin scroll de la página detrás
	// (desktop con rueda, móvil con gesto). El overlay lleva
	// overflow-y-auto + overscroll-contain y la card .modal-card hace
	// scroll interno si supera el viewport (teclado móvil incluido).
	const anyModalOpen = weightModal != null || cardioModal != null || warmupModal != null || showOnboarding
	useEffect(() => {
		if (!anyModalOpen) return
		const prevOverflow = document.body.style.overflow
		const prevOverscroll = document.body.style.overscrollBehavior
		document.body.style.overflow = 'hidden'
		document.body.style.overscrollBehavior = 'none'
		return () => {
			document.body.style.overflow = prevOverflow
			document.body.style.overscrollBehavior = prevOverscroll
		}
	}, [anyModalOpen])

	const fetchSb = useCallback(async () => {
		if (!session?.user?.id) return
		setSbLoading(true)
		try {
			const { data: routines } = await supabase.from('routines').select('id, name').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
			if (routines) setSbRoutines(routines)
			const { data: sessions } = await supabase.from('workout_sessions').select('id, routine_id, started_at, ended_at, notes').eq('user_id', session.user.id).order('started_at', { ascending: false }).limit(20)
			if (sessions) setSbSessions(sessions)
		} catch {
			// silencioso: las vistas muestran estado vacío
		} finally {
			setSbLoading(false)
		}
	}, [session?.user?.id])

	useEffect(() => {
		fetchSb()
	}, [fetchSb, currentView])

	// Stats del perfil: agrega set_logs por sesión terminada (volumen, peso máx,
	// kcal de fuerza estimadas + cardio guardado en notes) + mejor marca por
	// ejercicio para la lista de récords. Sin migración.
	useEffect(() => {
		if (currentView !== 'profile' || !session?.user?.id) return
		const finished = sbSessions.filter((s) => s.ended_at)
		if (finished.length === 0) {
			setStatsRows([])
			setExerciseRecords([])
			return
		}
		let cancelled = false
		setStatsLoading(true)
		setStatsError('')
		;(async () => {
			const ids = finished.map((s) => s.id)
			const { data, error } = await supabase
				.from('set_logs')
				.select('session_id, weight_kg, reps, exercises (name)')
				.eq('user_id', session.user.id)
				.in('session_id', ids)
				.limit(1000)
			if (error) throw error
			const bySession = {}
			for (const row of data ?? []) {
				;(bySession[row.session_id] ??= []).push(row)
			}
			const sessionDate = {}
			for (const s of finished) sessionDate[s.id] = s.started_at
			const bestByExercise = {}
			for (const row of data ?? []) {
				const name = row.exercises?.name ?? 'Ejercicio'
				const lb = Number(row.weight_kg) || 0
				if (!bestByExercise[name] || lb > bestByExercise[name].maxLb) {
					bestByExercise[name] = { name, maxLb: lb, reps: Number(row.reps) || 0, date: sessionDate[row.session_id] ?? null }
				}
			}
			const records = Object.values(bestByExercise).sort((a, b) => b.maxLb - a.maxLb)
			const rows = finished.map((s) => {
				const logs = bySession[s.id] ?? []
				let volumeKg = 0
				let maxLb = 0
				for (const l of logs) {
					const lb = Number(l.weight_kg) || 0
					const reps = Number(l.reps) || 0
					volumeKg += lb * LB_TO_KG * reps
					if (lb > maxLb) maxLb = lb
				}
				const strengthKcal = volumeKg * KCAL_PER_KG_MOVED
				const extras = parseSessionExtras(s.notes)
				const cardioKcal = extras.cardio?.kcal ?? 0
				const warmupKcal = extras.warmup?.kcal ?? 0
				const t = new Date(s.started_at)
				const short = Number.isNaN(t.getTime()) ? '' : `${t.getDate()}/${t.getMonth() + 1}`
				return {
					id: s.id,
					date: s.started_at,
					label: Number.isNaN(t.getTime()) ? 'Sesión' : t.toLocaleDateString(),
					short,
					name: sbRoutines.find((r) => r.id === s.routine_id)?.name ?? 'Entrenamiento',
					sets: logs.length,
					volumeKg,
					maxLb,
					strengthKcal,
					cardioMin: extras.cardio?.minutes ?? 0,
					cardioKcal,
					warmupMin: extras.warmup?.minutes ?? 0,
					warmupKcal,
					totalKcal: strengthKcal + cardioKcal + warmupKcal,
				}
			})
			if (!cancelled) setStatsRows(rows)
			if (!cancelled) setExerciseRecords(records)
		})().catch((err) => {
			if (!cancelled) setStatsError(friendlyError(err))
		}).finally(() => {
			if (!cancelled) setStatsLoading(false)
		})
		return () => { cancelled = true }
	}, [currentView, session?.user?.id, sbSessions, sbRoutines])

	// Al abrir un día: prepara sus filas en la base de datos y trae el último peso de cada ejercicio.
	useEffect(() => {
		if (!session?.user?.id || selectedDay == null) {
			setPlanIds(null)
			setLastW({})
			setRecentW({})
			return
		}
		const workout = workoutDays.find((day) => day.id === selectedDay)
		if (!workout) return
		dayStartRef.current = new Date().toISOString()
		setSyncError('')
		let cancelled = false
		ensureDayRows(supabase, session.user.id, workout).then(async (ids) => {
			if (cancelled) return
			setPlanIds(ids)
			try {
				const map = await fetchLastWeights(supabase, session.user.id, Object.values(ids.byIndex))
				if (!cancelled) setLastW(map)
			} catch {
				// sin último peso: el modal queda vacío
			}
			try {
				const recent = await fetchRecentLogs(supabase, session.user.id, Object.values(ids.byIndex), 4)
				if (!cancelled) setRecentW(recent)
			} catch {
				// sin historial reciente: el acordeón no muestra la caja
			}
		}).catch((err) => {
			if (!cancelled) setSyncError(friendlyError(err))
		})
		return () => { cancelled = true }
	}, [session?.user?.id, selectedDay])

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
		})
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
		})
		return () => subscription.unsubscribe()
	}, [])

	// Orden de la semana por usuario: cada uno organiza sus días sin afectar
	// a otros. Al cambiar de cuenta se carga el suyo (o el orden por defecto).
	useEffect(() => {
		setWeekMap(readWeekMap(session?.user?.id) ?? DEFAULT_WEEK_MAP.map((s) => ({ ...s })))
		setWeekGoal(readWeekGoal(session?.user?.id))
		setEditingWeek(false)
	}, [session?.user?.id])

	// Perfil por usuario: Supabase (tabla profiles) + local por usuario.
	// Si es cuenta nueva sin peso, se abre el onboarding de datos básicos.
	useEffect(() => {
		const uid = session?.user?.id
		if (!uid) {
			setProfile(null)
			setShowOnboarding(false)
			return
		}
		let cancelled = false
		setProfileLoading(true)
		const local = readProfileLocal(uid)
		if (local && isProfileComplete(local)) {
			setProfile(local)
			if (Number(local.weight_kg) > 0) setBodyKg(Number(local.weight_kg))
			setProfileForm({
				weight: bodyKgToDisplay(local.weight_kg, weightUnit),
				height: local.height_cm != null ? String(local.height_cm) : '',
				age: local.age != null ? String(local.age) : '',
				sex: local.sex ?? '',
			})
		} else if (local) {
			setProfile(local)
			if (Number(local.weight_kg) > 0) setBodyKg(Number(local.weight_kg))
		}
		// Si no hay nada local, usa el peso global histórico como punto de partida.
		if (!local?.weight_kg) {
			setBodyKg(readBodyKgFor(uid))
		}
		setOnboarding((prev) => ({
			...prev,
			weight: prev.weight || bodyKgToDisplay(readBodyKgFor(uid), weightUnit),
		}))
		// Si ya se detectó que la tabla no existe, ni se intenta: cero 404s.
		if (profilesTableState === false) {
			setShowOnboarding(!isProfileComplete(local))
			setProfileLoading(false)
			return () => { cancelled = true }
		}
		;(async () => {
			try {
				const { data, error } = await supabase.from('profiles').select('weight_kg, height_cm, age, sex').eq('user_id', uid).maybeSingle()
				if (error) throw error
				markProfilesChecked(null)
				if (cancelled) return
				if (data && (data.weight_kg != null || data.height_cm != null || data.age != null || data.sex != null)) {
					const merged = {
						weight_kg: data.weight_kg != null ? Number(data.weight_kg) : local?.weight_kg ?? null,
						height_cm: data.height_cm != null ? Number(data.height_cm) : local?.height_cm ?? null,
						age: data.age != null ? Number(data.age) : local?.age ?? null,
						sex: data.sex ?? local?.sex ?? null,
					}
					setProfile(merged)
					persistProfileLocal(uid, merged)
					if (Number.isFinite(Number(merged.weight_kg)) && Number(merged.weight_kg) > 0) {
						setBodyKg(Number(merged.weight_kg))
						setProfileForm({
							weight: bodyKgToDisplay(merged.weight_kg, weightUnit),
							height: merged.height_cm != null ? String(merged.height_cm) : '',
							age: merged.age != null ? String(merged.age) : '',
							sex: merged.sex ?? '',
						})
					}
					setShowOnboarding(!isProfileComplete(merged))
					if (!isProfileComplete(merged)) {
						setOnboarding((prev) => ({
							weight: prev.weight || bodyKgToDisplay(merged.weight_kg ?? readBodyKgFor(uid), weightUnit),
							height: prev.height || (merged.height_cm != null ? String(merged.height_cm) : ''),
							age: prev.age || (merged.age != null ? String(merged.age) : ''),
							sex: prev.sex || merged.sex || '',
						}))
					}
				} else {
					// Sin fila en Supabase (cuenta nueva o tabla aún no creada): pide datos básicos.
					setShowOnboarding(!isProfileComplete(local))
					if (!isProfileComplete(local)) {
						setOnboarding((prev) => ({
							weight: prev.weight || bodyKgToDisplay(readBodyKgFor(uid), weightUnit),
							height: prev.height || (local?.height_cm != null ? String(local.height_cm) : ''),
							age: prev.age || (local?.age != null ? String(local.age) : ''),
							sex: prev.sex || local?.sex || '',
						}))
					}
				}
			} catch (err) {
				// Sin tabla profiles (migración pendiente) o sin conexión: se marca
				// una sola vez y se sigue en local, sin más intentos ni ruido.
				markProfilesChecked(err)
				if (!cancelled) setShowOnboarding(!isProfileComplete(readProfileLocal(uid)))
			} finally {
				if (!cancelled) setProfileLoading(false)
			}
		})()
		return () => { cancelled = true }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.id])

	const submitOnboarding = async (e) => {
		if (e) e.preventDefault()
		const kg = displayToBodyKg(onboarding.weight, weightUnit)
		const h = parseFloat(onboarding.height)
		const a = parseInt(onboarding.age, 10)
		if (!Number.isFinite(kg) || kg < 30 || kg > 300) {
			setOnboardingError(`Escribe tu peso válido en ${weightUnit} (30 a 300 ${weightUnit === 'kg' ? 'kg' : 'lb'} aprox.)`)
			return
		}
		if (onboarding.height !== '' && (!Number.isFinite(h) || h < 100 || h > 250)) {
			setOnboardingError('Escribe tu altura en cm (100 a 250) o déjala vacía')
			return
		}
		if (onboarding.age !== '' && (Number.isNaN(a) || a < 10 || a > 100)) {
			setOnboardingError('Escribe tu edad (10 a 100) o déjala vacía')
			return
		}
		setOnboardingError('')
		setOnboardingSaving(true)
		const uid = session?.user?.id
		const payload = {
			weight_kg: Math.round(kg * 10) / 10,
			height_cm: onboarding.height === '' ? null : Math.round(h * 10) / 10,
			age: onboarding.age === '' ? null : a,
			sex: onboarding.sex || null,
		}
		try {
			if (uid && profilesTableState !== false) {
				await supabase.from('profiles').upsert({ user_id: uid, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
				markProfilesChecked(null)
			}
		} catch (err) {
			// sin tabla (migración pendiente) o sin conexión: sigue en local
			markProfilesChecked(err)
		}
		const merged = { ...(profile ?? {}), ...payload }
		setProfile(merged)
		persistProfileLocal(uid, merged)
		setBodyKg(payload.weight_kg)
		try {
			localStorage.setItem('tempolift-body-kg', String(payload.weight_kg))
		} catch {
			// ignora
		}
		setProfileForm({
			weight: bodyKgToDisplay(payload.weight_kg, weightUnit),
			height: payload.height_cm != null ? String(payload.height_cm) : '',
			age: payload.age != null ? String(payload.age) : '',
			sex: payload.sex ?? '',
		})
		setShowOnboarding(false)
		setOnboardingSaving(false)
	}

	const saveProfileForm = async (e) => {
		if (e) e.preventDefault()
		const kg = displayToBodyKg(profileForm.weight, weightUnit)
		const h = parseFloat(profileForm.height)
		const a = parseInt(profileForm.age, 10)
		if (!Number.isFinite(kg) || kg < 30 || kg > 300) {
			setProfileMsg(`Escribe tu peso válido en ${weightUnit}`)
			return
		}
		if (profileForm.height !== '' && (!Number.isFinite(h) || h < 100 || h > 250)) {
			setProfileMsg('Altura inválida (100 a 250 cm)')
			return
		}
		if (profileForm.age !== '' && (Number.isNaN(a) || a < 10 || a > 100)) {
			setProfileMsg('Edad inválida (10 a 100)')
			return
		}
		setProfileSaving(true)
		setProfileMsg('')
		const uid = session?.user?.id
		const payload = {
			weight_kg: Math.round(kg * 10) / 10,
			height_cm: profileForm.height === '' ? null : Math.round(h * 10) / 10,
			age: profileForm.age === '' ? null : a,
			sex: profileForm.sex || null,
		}
		try {
			if (uid && profilesTableState !== false) {
				await supabase.from('profiles').upsert({ user_id: uid, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
				markProfilesChecked(null)
			}
		} catch (err) {
			// sin tabla (migración pendiente) o sin conexión: sigue en local
			markProfilesChecked(err)
		}
		const merged = { ...(profile ?? {}), ...payload }
		setProfile(merged)
		persistProfileLocal(uid, merged)
		setBodyKg(payload.weight_kg)
		try {
			localStorage.setItem('tempolift-body-kg', String(payload.weight_kg))
		} catch {
			// ignora
		}
		setProfileSaving(false)
		setProfileMsg('Datos actualizados ✓')
	}

	// Al marcar todo: guarda el día en tu historial + banner + auto-reset
	useEffect(() => {
		if (!selectedWorkout || !allDone) return
		setDayComplete(true)
		const wid = selectedWorkout.id
		const sig = `${wid}:${JSON.stringify(dayWeights)}:${cardioMinutes}:${cardioMachineKcal ?? ''}:${warmupMinutes}:${warmupMachineKcal ?? ''}:${bodyKg}`
		if (saveSigRef.current !== sig) {
			saveSigRef.current = sig
			if (!planIds?.routineId) {
				setSaveStatus({ state: 'error', msg: syncError || 'no se pudo preparar el guardado' })
			} else {
				setSaveStatus({ state: 'saving', msg: '' })
				const extras = {
					cardioMin: cardioDone ? cardioMinutes : null,
					cardioKcal: cardioDone ? Math.round(dayCardioKcal) : null,
					cardioMachineKcal: cardioMachineKcal ?? null,
					warmupMin: warmupDone ? warmupMinutes : null,
					warmupKcal: warmupDone ? Math.round(dayWarmupKcal) : null,
					warmupMachineKcal: warmupMachineKcal ?? null,
				}
				saveDaySession(supabase, session.user.id, planIds.routineId, planIds.byIndex, dayWeights, dayStartRef.current, extras).then(() => {
					setSaveStatus({ state: 'saved', msg: '' })
					fetchSb()
				}).catch((err) => {
					saveSigRef.current = null
					setSaveStatus({ state: 'error', msg: friendlyError(err) })
				})
			}
		}
		const t = setTimeout(() => {
			resetDay(wid)
		}, 6000)
		return () => clearTimeout(t)
	}, [allDone, selectedWorkout, weights, dayWeights, cardioDone, cardioMinutes, cardioMachineKcal, dayCardioKcal, warmupDone, warmupMinutes, warmupMachineKcal, dayWarmupKcal, bodyKg, planIds, syncError, session?.user?.id, fetchSb, resetDay])

	// El descanso es global: no se corta al cambiar de pantalla.
	// Solo se limpia al omitir, reiniciar el día o completar el día.
	useEffect(() => {
		setExpandedKey(null)
		setDayComplete(false)
	}, [selectedDay])

	// SPA sin router: cada pantalla empieza arriba. Sin esto se hereda el
	// scroll de la vista anterior (bajas en home y la rutina/perfil abre a mitad).
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [selectedDay, currentView])

	if (!session) {
		return (
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-10 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
				<BackgroundOrbs />
				<div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
					<div className="glass-card w-full max-w-sm rounded-2xl p-8 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-xl font-black text-white">T</div>
						<h1 className="mt-4 text-3xl font-black tracking-tight">TempoLift</h1>
						<p className="mt-2 text-sm leading-relaxed text-zinc-400">Inicia sesión para ver tu plan semanal de fuerza.</p>
						<button
							type="button"
							onClick={signInWithGoogle}
							className="glass-card mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 text-sm font-bold text-white transition hover:border-red-500/60"
						>
							<span aria-hidden="true">G</span>
							<span>Continuar con Google</span>
						</button>
						<p className="mt-4 text-xs uppercase tracking-widest text-zinc-600">Tempo 3-1-1 · 5 días</p>
					</div>
				</div>
			</main>
		)
	}

	if (selectedWorkout) {
		return (
			<>
				<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`}>
				<BackgroundOrbs />
				<header className="relative z-10 flex items-center justify-between py-6">
					<button type="button" onClick={goBack} className="back-btn flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400" aria-label="Volver a los días">
						<span className="text-2xl leading-none text-red-500">‹</span> Días
					</button>
					<button type="button" onClick={signOut} className="flex min-h-10 items-center rounded-xl border border-white/10 px-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition hover:border-white/25 hover:text-zinc-300">
						Cerrar sesión
					</button>
				</header>
				<div className="relative z-10 mb-6">
					<p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-red-500">Día {trainingRows.findIndex((r) => r.workoutId === selectedDay) + 1 || selectedWorkout.id} / {trainingCount}</p>
					<h1 className="text-4xl font-black tracking-tight">{selectedWorkout.name}</h1>
					<p className="mt-2 text-lg text-zinc-400">{selectedWorkout.focus}</p>
				</div>

				{/* Progreso fijo arriba al hacer scroll */}
				<div className="glass-card sticky top-2 z-20 mb-5 rounded-2xl p-4" style={{ backgroundColor: 'rgba(11,13,12,0.92)' }}>
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="font-bold uppercase tracking-widest text-zinc-400">Progreso del día</span>
						<strong className="text-red-500">{doneCount}/{totalExercises}</strong>
					</div>
					<div className="progress-track" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={totalExercises} aria-label="Progreso del día">
						<div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
					</div>
					<p className="mt-2 text-xs text-zinc-500">
						{allDone ? '¡Día completado! Reiniciando…' : doneCount === 0 ? 'Marca fuerza (2 series por ejercicio), calentamiento y cardio final' : `${totalExercises - doneCount} por completar${missingLabels.length > 0 ? ` · falta: ${missingLabels.join(' + ')}` : ''}`}
					</p>
					<p className="mt-1 text-xs font-bold text-zinc-400" aria-live="polite">
						~{Math.round(dayTotalKcal)} kcal est. (fuerza ~{Math.round(dayStrengthKcal)}{cardioDone ? ` + cardio ~${Math.round(dayCardioKcal)}` : ''}{warmupDone ? ` + calent. ~${Math.round(dayWarmupKcal)}` : ''}) · {Math.round(dayVolumeKg)} kg movidos
					</p>
					{syncError && !allDone && (
						<p className="mt-2 text-xs text-amber-400">Aviso: {syncError}. El día no se guardará en tu historial.</p>
					)}
					{isResting && (
						<div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center" role="status" aria-live="assertive">
							<p className="text-xs font-bold uppercase tracking-widest text-red-400">Descanso{restLabel ? ` · ${restLabel}` : ''}</p>
							<p className="mt-1 text-3xl font-black tabular-nums text-white">{formatRest(restLeft)}</p>
							<div className="mt-2 flex items-center justify-center gap-2">
								<p className="text-xs text-zinc-400">{restSeries === 1 ? 'Descansa y toca la casilla otra vez para la serie 2' : 'Ejercicio completado · descansa antes del siguiente'}</p>
								<button type="button" onClick={skipRest} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300 transition hover:border-white/25">
									Omitir
								</button>
							</div>
						</div>
					)}
				</div>

				{dayComplete && (
					<div className="complete-banner glass-card relative z-10 mb-5" role="status">
						<span className="complete-pop" aria-hidden="true">
							<svg viewBox="0 0 24 24" className="complete-svg"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
						</span>
						<div>
							<strong>¡Día terminado!</strong>
							<p>{saveStatus.state === 'saved' ? `Guardado en tu historial ✓ · ~${Math.round(dayTotalKcal)} kcal` : saveStatus.state === 'saving' ? 'Guardando en tu historial…' : saveStatus.state === 'error' ? `No se pudo guardar: ${saveStatus.msg}` : 'Todos los checks se reiniciarán solos, sin recargar la página.'}</p>
						</div>
						<button type="button" className="complete-btn" onClick={() => resetDay(selectedWorkout.id)}>Reiniciar ahora</button>
					</div>
				)}

				<div className="routine-card glass-card relative z-10 rounded-2xl px-5">
					<Phase phase={globalPhases.warmup} open={openPhase === 'warmup'} onToggle={() => togglePhase('warmup')}>
						<div className="glass-inset rounded-xl p-4 text-base text-zinc-300">{globalPhases.warmup.notes}</div>
						<div className={`exercise-row mt-2 ${warmupDone ? 'is-checked' : ''}`}>
							<div className="exercise-main">
								<button
									type="button"
									role="checkbox"
									aria-checked={warmupDone}
								aria-label={warmupDone ? 'Desmarcar calentamiento' : 'Marcar calentamiento y anotar minutos'}
								onClick={warmupDone ? unmarkWarmup : openWarmup}
								disabled={weightModal != null || cardioModal != null || warmupModal != null}
									className={`custom-check ${warmupDone ? 'checked' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true" className="check-svg">
										<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="check-ripple" aria-hidden="true" />
								</button>
								<span className="exercise-text">
									<span className="exercise-title">
										<span className={warmupDone ? 'line-through-anim' : ''}>Calentamiento</span>
									</span>
									<span className="exercise-note">{warmupDone ? (warmupMachineKcal != null ? `${warmupMinutes} min · ${warmupMachineKcal} kcal máquina` : `${warmupMinutes} min · ~${Math.round(dayWarmupKcal)} kcal`) : 'Una sola marca · te pide los minutos'}</span>
								</span>
								<span className="exercise-reps">{warmupDone ? '✓' : '1×'}</span>
							</div>
						</div>
					</Phase>
					<Phase phase={{ title: 'Fuerza', label: 'Fase 2', detail: `${selectedWorkout.exercises.length} ejercicios · toca para ver animación` }} open={openPhase === 'strength'} onToggle={() => togglePhase('strength')}>
						<div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm glass-inset">
							<span className="text-zinc-300">Regla global</span>
							<strong className="text-red-500">{globalRules.tempo} · {globalRules.rest}</strong>
						</div>
						<div className={`exercise-list ${isResting ? 'opacity-80' : ''}`}>
							{selectedWorkout.exercises.map(([name, reps, note], index) => {
								const key = `${selectedWorkout.id}-${index}`
								const series = seriesMap[index] ?? 0
								const exerciseId = planIds?.byIndex?.[index]
								const prev = exerciseId ? lastW[exerciseId] : null
								return (
									<ExerciseItem
										key={key}
										name={name}
										reps={reps}
										note={note}
										index={index}
										checked={series === 2}
										partial={series === 1}
										blocked={isResting || weightModal != null || cardioModal != null || warmupModal != null}
										lastWeight={prev?.weight_kg != null ? displayWeight(prev.weight_kg, weightUnit) : null}
										lastReps={prev?.reps ?? null}
										weightUnit={weightUnit}
										history={exerciseId ? (recentW[exerciseId] ?? null) : null}
										onToggle={() => handleToggleCheck(selectedWorkout.id, index, name, reps)}
										expanded={expandedKey === key}
										onExpand={() => toggleExpand(key)}
										bundle={getExerciseBundle(name)}
									/>
								)
							})}
						</div>
					</Phase>
					<Phase phase={globalPhases.cardio} open={openPhase === 'cardio'} onToggle={() => togglePhase('cardio')}>
						<div className="glass-inset rounded-xl p-4 text-base text-zinc-300">{globalPhases.cardio.notes}</div>
						<div className={`exercise-row mt-2 ${cardioDone ? 'is-checked' : ''}`}>
							<div className="exercise-main">
								<button
									type="button"
									role="checkbox"
									aria-checked={cardioDone}
								aria-label={cardioDone ? 'Desmarcar cardio' : 'Marcar cardio y anotar minutos'}
								onClick={cardioDone ? unmarkCardio : openCardio}
								disabled={weightModal != null || cardioModal != null || warmupModal != null}
									className={`custom-check ${cardioDone ? 'checked' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true" className="check-svg">
										<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="check-ripple" aria-hidden="true" />
								</button>
								<span className="exercise-text">
									<span className="exercise-title">
										<span className={cardioDone ? 'line-through-anim' : ''}>Cardio final</span>
									</span>
									<span className="exercise-note">{cardioDone ? (cardioMachineKcal != null ? `${cardioMinutes} min · ${cardioMachineKcal} kcal máquina` : `${cardioMinutes} min · ~${Math.round(dayCardioKcal)} kcal`) : 'Una sola marca · te pide los minutos'}</span>
								</span>
								<span className="exercise-reps">{cardioDone ? '✓' : '1×'}</span>
							</div>
						</div>
					</Phase>
				</div>
				<p className="relative z-10 mt-6 text-center text-xs uppercase tracking-widest text-zinc-600">Escucha tu cuerpo · Mantén el control</p>
				</main>
				{weightModal && (
					<div className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5" role="dialog" aria-modal="true" aria-label={`Anotar serie ${weightModal.setNumber}`}>
						<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
							<h3 className="text-lg font-black text-white">{weightModal.name} · Serie {weightModal.setNumber}/2</h3>
							<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
								{(() => {
									const exId = planIds?.byIndex?.[weightModal.index]
									const prev = exId ? lastW[exId] : null
									if (prev?.weight_kg == null) return 'Sin registros previos · marca tu base'
									return `Último: ${displayWeight(prev.weight_kg, weightUnit)} ${weightUnit} × ${prev.reps ?? '—'} reps`
								})()}
							</p>
							<form onSubmit={confirmWeightModal} noValidate className="mt-4 flex flex-col gap-3">
								<UnitToggle unit={weightUnit} onSwitch={switchWeightUnit} />
								<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									Peso ({weightUnit})
									<input
										type="number"
										min="0"
										step="0.5"
										value={weightInput}
										onChange={(e) => setWeightInput(e.target.value)}
										placeholder={`ej. ${weightHintFor(weightModal.name, weightUnit)}`}
										autoFocus={FINE_POINTER}
										className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
									/>
								</label>
								<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									Repeticiones
									<input
										type="number"
										min="0"
										step="1"
										value={repsInput}
										onChange={(e) => setRepsInput(e.target.value)}
										placeholder="ej. 8"
										className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
									/>
								</label>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={closeWeightModal}
										className="min-h-12 flex-1 rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25"
									>
										Cancelar
									</button>
									<button
										type="submit"
										className="min-h-12 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition"
									>
										Confirmar
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
				{cardioModal && (() => {
					const machinePreview = parseFloat(cardioMachineInput)
					const hasMachine = Number.isFinite(machinePreview) && machinePreview >= 0
					return (
						<div className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5" role="dialog" aria-modal="true" aria-label="Anotar cardio">
							<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
								<h3 className="text-lg font-black text-white">Cardio final · 1 marca</h3>
								<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Caminadora 4-5 km/h · inclinación 10-12</p>
								<div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3" role="note">
									<p className="text-xs font-bold uppercase tracking-widest text-amber-300">Revisa la máquina</p>
									<p className="mt-1 text-xs leading-relaxed text-zinc-300">Fíjate en la pantalla de la caminadora e introduce las calorías que muestra. Si lo dejas vacío, las estimamos con el peso de tu perfil ({bodyKg} kg).</p>
								</div>
								<form onSubmit={confirmCardio} noValidate className="mt-4 flex flex-col gap-3">
									<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
										Tiempo (min)
										<input
											type="number"
											min="1"
											max="180"
											step="1"
											value={cardioInput}
											onChange={(e) => setCardioInput(e.target.value)}
											placeholder="ej. 25"
											autoFocus={FINE_POINTER}
											className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
										/>
									</label>
									<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
										Calorías de la máquina (opcional)
										<input
											type="number"
											min="0"
											max="5000"
											step="1"
											value={cardioMachineInput}
											onChange={(e) => setCardioMachineInput(e.target.value)}
											placeholder="ej. 180"
											className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
										/>
									</label>
									<p className="text-sm text-zinc-400" aria-live="polite">
										{hasMachine ? `Usaremos ${Math.round(machinePreview)} kcal de la máquina` : `≈ ${Math.round(cardioKcalFor(cardioInput || 0, bodyKg))} kcal estimadas con ${bodyKg} kg`}
									</p>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={closeCardioModal}
											className="min-h-12 flex-1 rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25"
										>
											Cancelar
										</button>
										<button
											type="submit"
											className="min-h-12 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition"
										>
											Confirmar
										</button>
									</div>
								</form>
							</div>
						</div>
					)
				})()}
				{warmupModal && (() => {
					const machinePreview = parseFloat(warmupMachineInput)
					const hasMachine = Number.isFinite(machinePreview) && machinePreview >= 0
					return (
						<div className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5" role="dialog" aria-modal="true" aria-label="Anotar calentamiento">
							<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
								<h3 className="text-lg font-black text-white">Calentamiento · 1 marca</h3>
								<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Caminadora 5 km/h · inclinación 0</p>
								<div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3" role="note">
									<p className="text-xs font-bold uppercase tracking-widest text-amber-300">Revisa la máquina</p>
									<p className="mt-1 text-xs leading-relaxed text-zinc-300">Fíjate en la pantalla de la caminadora e introduce las calorías que muestra. Si lo dejas vacío, las estimamos con el peso de tu perfil ({bodyKg} kg).</p>
								</div>
								<form onSubmit={confirmWarmup} noValidate className="mt-4 flex flex-col gap-3">
									<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
										Tiempo (min)
										<input
											type="number"
											min="1"
											max="60"
											step="1"
											value={warmupInput}
											onChange={(e) => setWarmupInput(e.target.value)}
											placeholder="ej. 7"
											autoFocus={FINE_POINTER}
											className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
										/>
									</label>
									<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
										Calorías de la máquina (opcional)
										<input
											type="number"
											min="0"
											max="5000"
											step="1"
											value={warmupMachineInput}
											onChange={(e) => setWarmupMachineInput(e.target.value)}
											placeholder="ej. 60"
											className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
										/>
									</label>
									<p className="text-sm text-zinc-400" aria-live="polite">
										{hasMachine ? `Usaremos ${Math.round(machinePreview)} kcal de la máquina` : `≈ ${Math.round(WARMUP_MET * (Number(bodyKg) > 0 ? Number(bodyKg) : DEFAULT_BODY_KG) * ((parseFloat(warmupInput) || 0) / 60))} kcal estimadas con ${bodyKg} kg`}
									</p>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={closeWarmupModal}
											className="min-h-12 flex-1 rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25"
										>
											Cancelar
										</button>
										<button
											type="submit"
											className="min-h-12 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition"
										>
											Confirmar
										</button>
									</div>
								</form>
							</div>
						</div>
					)
				})()}
				<Snackbar snack={snack} onClose={closeSnack} />
				<BottomNav value={currentView} onChange={handleNav} theme={theme} />
				{showOnboarding && (
					<OnboardingModal
						form={onboarding}
						setForm={setOnboarding}
						unit={weightUnit}
						onSwitchUnit={switchWeightUnit}
						error={onboardingError}
						saving={onboardingSaving}
						onSubmit={submitOnboarding}
						onSkip={() => setShowOnboarding(false)}
					/>
				)}
			</>
		)
	}

	if (currentView !== 'home') {
		return (
			<>
				<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
				<BackgroundOrbs />
				<header className="relative z-10 flex items-center justify-between py-6">
					<div className="flex items-center gap-3">
						<div className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
						<span className="text-lg font-black tracking-tight">TempoLift</span>
					</div>
				</header>
				<div className="relative z-10">
					{currentView === 'history' && (
						<section className="glass-card rounded-2xl p-5">
							<h1 className="text-2xl font-black">Historial</h1>
							<p className="mt-1 text-sm text-zinc-400">{sbLoading ? 'Cargando…' : sbSessions.filter((s) => s.ended_at).length === 0 ? '0 entrenamientos' : `${sbSessions.filter((s) => s.ended_at).length} ${sbSessions.filter((s) => s.ended_at).length === 1 ? 'entrenamiento' : 'entrenamientos'}`}</p>
							<div className="mt-4 flex flex-col gap-2">
								{sbSessions.filter((s) => s.ended_at).length === 0 && !sbLoading && (
									<p className="text-sm text-zinc-500">Aún no tienes entrenamientos terminados. Completa tu primera rutina para verla aquí.</p>
								)}
								{sbSessions.filter((s) => s.ended_at).map((s) => {
									const routineName = sbRoutines.find((r) => r.id === s.routine_id)?.name
									const open = openSession === s.id
									const rows = sessionSets[s.id] ?? []
									const extras = parseSessionExtras(s.notes)
									const cardioInfo = extras.cardio
									const warmupInfo = extras.warmup
									return (
										<div key={s.id} className="glass-inset rounded-xl px-4 py-3">
											<button type="button" onClick={() => toggleSession(s)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
												<span>
													<span className="block text-sm font-bold text-white">{routineName ?? 'Entrenamiento'}</span>
													<span className="mt-1 block text-xs text-zinc-500">{new Date(s.started_at).toLocaleString()} · Terminada{warmupInfo ? (warmupInfo.machineKcal != null ? ` · Calent. ${warmupInfo.minutes} min (${warmupInfo.machineKcal} kcal máq.)` : ` · Calent. ${warmupInfo.minutes} min`) : ''}{cardioInfo ? (cardioInfo.machineKcal != null ? ` · Cardio ${cardioInfo.minutes} min (${cardioInfo.machineKcal} kcal máq.)` : ` · Cardio ${cardioInfo.minutes} min (~${Math.round(cardioInfo.kcal)} kcal)`) : ''}</span>
												</span>
												<span className="text-xl text-zinc-500">{open ? '▾' : '▸'}</span>
											</button>
											{open && (
												<div className="mt-3 border-t border-white/10 pt-3">
													{setsLoading && rows.length === 0 ? (
														<p className="text-sm text-zinc-500">Cargando series…</p>
													) : rows.length === 0 ? (
														<p className="text-sm text-zinc-500">Sin series registradas.</p>
													) : (
														<ul className="flex flex-col gap-2">
															{rows.map((row) => (
																<li key={row.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
																	{editingSet === row.id ? (
																		<div className="flex flex-col gap-2">
																			<p className="text-sm font-bold text-white">{row.exercises?.name ?? 'Ejercicio'} · Serie {row.set_number}</p>
																			<UnitToggle unit={weightUnit} onSwitch={switchWeightUnit} />
																			<div className="flex gap-2">
																				<input
																					type="number"
																					min="0"
																					step="0.5"
																					value={editWeight}
																					onChange={(e) => setEditWeight(e.target.value)}
																					placeholder={weightUnit === 'kg' ? 'kg' : 'lb'}
																					aria-label={`Peso en ${weightUnit === 'kg' ? 'kilogramos' : 'libras'}`}
																					className="glass-inset min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600"
																				/>
																				<input
																					type="number"
																					min="0"
																					step="1"
																					value={editReps}
																					onChange={(e) => setEditReps(e.target.value)}
																					placeholder="reps"
																					aria-label="Repeticiones"
																					className="glass-inset min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600"
																				/>
																			</div>
																			<div className="flex gap-2">
																				<button type="button" onClick={() => setEditingSet(null)} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300">
																					Cancelar
																				</button>
																				<button type="button" onClick={() => saveEditSet(row)} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">
																					Guardar
																				</button>
																			</div>
																		</div>
																	) : (
																		<div className="flex items-center justify-between gap-2">
																			<p className="text-sm text-zinc-300">{row.exercises?.name ?? 'Ejercicio'} · S{row.set_number} — <strong className="text-white">{displayWeight(row.weight_kg, weightUnit)} {weightUnit} × {row.reps}</strong></p>
																			<button type="button" onClick={() => startEditSet(row)} className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25 hover:text-white">
																				Editar
																			</button>
																		</div>
																	)}
																</li>
															))}
														</ul>
													)}
													<button
														type="button"
														onClick={() => deleteSession(s)}
														className={`mt-3 w-full rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition ${confirmDelete === s.id ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300'}`}
													>
														{confirmDelete === s.id ? 'Toca de nuevo para eliminar' : 'Eliminar entrenamiento'}
													</button>
													{setMsg && (
														<p className="mt-2 text-xs text-zinc-400">{setMsg}</p>
													)}
												</div>
											)}
										</div>
									)
								})}
							</div>
						</section>
					)}
					{currentView === 'profile' && (() => {
						const finished = sbSessions.filter((s) => s.ended_at)
						const last = finished[0]
						const email = session.user?.email ?? ''
						const initial = (email.charAt(0) || 'T').toUpperCase()
					// statsRows viene en orden reciente → antiguo: se invierte para graficar cronológico
					const chartData = [...statsRows].reverse().slice(-10)
					// Resúmenes en lenguaje simple para acompañar cada gráfica
					const kcalAvg = chartData.length > 0 ? chartData.reduce((a, r) => a + r.totalKcal, 0) / chartData.length : 0
					const kcalBest = chartData.length > 0 ? chartData.reduce((a, b) => (b.totalKcal > a.totalKcal ? b : a)) : null
					const weekData = sessionsByWeek(finished.map((s) => s.started_at), 8)
					const thisWeek = weekData.length > 0 ? weekData[weekData.length - 1].value : 0
					const volFirst = chartData.length > 0 ? chartData[0].volumeKg : 0
					const volLast = chartData.length > 0 ? chartData[chartData.length - 1].volumeKg : 0
					const volDelta = volFirst > 0 ? Math.round(((volLast - volFirst) / volFirst) * 100) : 0
					const visibleRecords = showAllRecords ? exerciseRecords : exerciseRecords.slice(0, 6)
						return (
							<div className="flex flex-col gap-4">
								<section className="glass-card rounded-2xl p-5 text-center">
									<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-xl font-black text-white">{initial}</div>
									<h1 className="mt-3 text-xl font-black">Mi perfil</h1>
									<p className="mt-1 break-all text-sm text-zinc-400">{email || session.user?.id}</p>
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Stats · últimas 20 sesiones</h2>
									<div className="mt-3 grid grid-cols-4 gap-2 text-center">
										<div className="glass-inset rounded-xl px-1 py-3">
											<p className="text-xl font-black text-white">{sbLoading ? '…' : finished.length}</p>
											<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Sesiones</p>
										</div>
										<div className="glass-inset rounded-xl px-1 py-3">
											<p className="text-xl font-black text-white">{statsLoading ? '…' : Math.round(statsRows.reduce((a, r) => a + r.totalKcal, 0)).toLocaleString()}</p>
											<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Kcal tot.</p>
										</div>
										<div className="glass-inset rounded-xl px-1 py-3">
											<p className="text-xl font-black text-white">{statsLoading || statsRows.length === 0 ? '…' : Math.round(statsRows.reduce((a, r) => a + r.totalKcal, 0) / statsRows.length)}</p>
											<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Kcal/ses.</p>
										</div>
										<div className="glass-inset rounded-xl px-1 py-3">
											<p className="text-xl font-black text-white">{sbLoading ? '…' : dayStreak(finished.map((s) => s.started_at))}</p>
											<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Racha días</p>
										</div>
									</div>
									<p className="mt-3 text-xs leading-relaxed text-zinc-500">
										{sbLoading ? 'Cargando tu actividad…' : last ? `Último entreno: ${new Date(last.started_at).toLocaleString()}` : 'Completa tu primera rutina y aparecerá aquí.'}
									</p>
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Meta semanal</h2>
									<div className="mt-3 flex items-center justify-between gap-3">
										<p className="text-sm text-zinc-400">Sesiones por semana</p>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => changeWeekGoal(-1)}
												disabled={weekGoal <= 1}
												aria-label="Bajar meta semanal"
												className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
											>
												−
											</button>
											<strong className="w-8 text-center text-xl font-black tabular-nums text-white" aria-live="polite">{weekGoal}</strong>
											<button
												type="button"
												onClick={() => changeWeekGoal(1)}
												disabled={weekGoal >= 7}
												aria-label="Subir meta semanal"
												className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
											>
												+
											</button>
										</div>
									</div>
									<span className={`day-progress mt-3 ${thisWeek >= weekGoal ? 'done' : ''}`} role="progressbar" aria-valuenow={Math.min(thisWeek, weekGoal)} aria-valuemin={0} aria-valuemax={weekGoal} aria-label="Progreso de la meta semanal">
										<span style={{ width: `${Math.round((Math.min(thisWeek, weekGoal) / weekGoal) * 100)}%` }} />
									</span>
									<p className="mt-2 text-xs leading-relaxed text-zinc-500">
										{thisWeek >= weekGoal
											? `Meta cumplida: ${thisWeek} de ${weekGoal}. Mantén el ritmo.`
											: `Esta semana llevas ${thisWeek} de ${weekGoal}. Te ${weekGoal - thisWeek === 1 ? 'falta 1' : `faltan ${weekGoal - thisWeek}`}.`}
									</p>
									<p className={`mt-1 text-xs leading-relaxed ${weekGoal >= 7 ? 'text-amber-300/90' : 'text-zinc-400'}`} aria-live="polite">
										{weekGoalTip(weekGoal)}
									</p>
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Gráficas</h2>
									{statsLoading ? (
										<p className="mt-3 text-sm text-zinc-500">Calculando tus stats…</p>
									) : statsError ? (
										<p className="mt-3 text-sm text-red-400">No se pudieron cargar: {statsError}</p>
									) : chartData.length === 0 ? (
										<p className="mt-3 text-sm text-zinc-500">Sin sesiones terminadas todavía. Tus gráficas aparecen aquí.</p>
									) : (
									<div className="mt-3 flex flex-col gap-5">
										<div>
											<div className="mb-1 flex items-center justify-between">
												<p className="text-sm font-bold text-white">Calorías por sesión</p>
												<p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
													<span className="inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden="true" /> Fuerza
													<span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> Cardio
													<span className="inline-block h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" /> Calent.
												</p>
											</div>
											<CalorieBars data={chartData.map((r) => ({ id: r.id, label: `${r.name} · ${r.label}`, short: r.short, strength: r.strengthKcal, cardio: r.cardioKcal, warmup: r.warmupKcal }))} />
											<p className="mt-1 text-xs leading-relaxed text-zinc-500">
												Promedio ~{Math.round(kcalAvg)} kcal por sesión{kcalBest ? ` · Tu mejor: ~${Math.round(kcalBest.totalKcal)} kcal el ${kcalBest.label}` : ''}. El número sobre cada barra es el total de esa sesión.
											</p>
										</div>
										<div>
											<p className="mb-1 text-sm font-bold text-white">Constancia semanal</p>
											<WeekBars data={weekData} goal={weekGoal} />
											<p className="mt-1 text-xs leading-relaxed text-zinc-500">
												Esta semana llevas {thisWeek} de {weekGoal} sesiones de tu meta. Las barras verdes la cumplen; la roja es la semana en curso.
											</p>
										</div>
										<div>
											<p className="mb-1 text-sm font-bold text-white">Peso total movido por sesión</p>
											<TrendLine data={chartData.map((r) => ({ id: r.id, label: `${r.name} · ${r.label}`, short: r.short, value: r.volumeKg }))} color="#38bdf8" unit="kg" />
											<p className="mt-1 text-xs leading-relaxed text-zinc-500">
												{chartData.length > 1 ? (volDelta >= 0 ? `Vas subiendo: +${volDelta}% desde tu primera sesión.` : `Vas ${volDelta}% respecto a tu primera sesión: toca superarla.`) : 'Tu base está marcada: completa más sesiones para ver tu progreso.'}
											</p>
										</div>
										<div>
											<p className="mb-1 text-sm font-bold text-white">Tus récords por ejercicio</p>
											{exerciseRecords.length === 0 ? (
												<p className="mt-2 text-sm text-zinc-500">Aún sin marcas registradas.</p>
											) : (
												<>
													<ul className="mt-2 flex flex-col gap-2">
														{visibleRecords.map((r) => (
															<li key={r.name} className="glass-inset flex items-center justify-between gap-3 rounded-xl px-4 py-3">
																<span className="min-w-0">
																	<span className="block truncate text-sm font-bold text-white">{r.name}</span>
																	<span className="mt-0.5 block text-xs text-zinc-500">{r.date ? new Date(r.date).toLocaleDateString() : 'Fecha desconocida'}</span>
																</span>
																<strong className="shrink-0 text-sm font-black text-amber-300">{displayWeight(r.maxLb, weightUnit)} {weightUnit} × {r.reps}</strong>
															</li>
														))}
													</ul>
													{exerciseRecords.length > 6 && (
														<button
															type="button"
															onClick={() => setShowAllRecords((v) => !v)}
															className="mt-2 w-full rounded-xl border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25 hover:text-white"
														>
															{showAllRecords ? 'Ver menos' : `Ver todos (${exerciseRecords.length})`}
														</button>
													)}
												</>
											)}
											<p className="mt-2 text-xs leading-relaxed text-zinc-500">Tu mejor marca en cada ejercicio, con las repeticiones que hiciste ese día.</p>
										</div>
										<p className="text-[11px] leading-relaxed text-zinc-600">Estimaciones aproximadas: fuerza ≈ 1 kcal por cada 20 kg movidos · cardio = 8 MET × tu peso × tiempo · calentamiento = 3.5 MET × tu peso × tiempo.</p>
									</div>
									)}
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mis datos · para tus stats</h2>
									<form onSubmit={saveProfileForm} className="mt-3 flex flex-col gap-3">
										<UnitToggle unit={weightUnit} onSwitch={switchWeightUnit} />
										<div className="grid grid-cols-2 gap-2">
											<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
												Peso ({weightUnit}) *
												<input
													type="number"
													min="0"
													step="0.5"
													value={profileForm.weight}
													onChange={(e) => setProfileForm((p) => ({ ...p, weight: e.target.value }))}
													placeholder={weightUnit === 'kg' ? 'ej. 75' : 'ej. 165'}
													aria-label={`Tu peso en ${weightUnit}`}
													className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
												/>
											</label>
											<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
												Altura (cm)
												<input
													type="number"
													min="100"
													max="250"
													step="0.5"
													value={profileForm.height}
													onChange={(e) => setProfileForm((p) => ({ ...p, height: e.target.value }))}
													placeholder="ej. 175"
													aria-label="Tu altura en centímetros"
													className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
												/>
											</label>
											<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
												Edad
												<input
													type="number"
													min="10"
													max="100"
													step="1"
													value={profileForm.age}
													onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
													placeholder="ej. 28"
													aria-label="Tu edad"
													className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
												/>
											</label>
											<div className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
												<span id="profile-sex-label">Sexo</span>
												<CustomSelect
													value={profileForm.sex}
													onChange={(v) => setProfileForm((p) => ({ ...p, sex: v }))}
													placeholder="Selecciona…"
													ariaLabel="Tu sexo"
												/>
											</div>
										</div>
										{(() => {
											const kg = Number(profile?.weight_kg ?? bodyKg)
											const hcm = Number(profile?.height_cm)
											if (Number.isFinite(kg) && kg > 0 && Number.isFinite(hcm) && hcm > 0) {
												const imc = kg / ((hcm / 100) * (hcm / 100))
												return <p className="text-xs text-zinc-500" aria-live="polite">IMC ≈ {Math.round(imc * 10) / 10} · {bodyKg} kg actuales para kcal de cardio/calentamiento</p>
											}
											return <p className="text-[11px] leading-relaxed text-zinc-600">Tu peso se usa para estimar las calorías del cardio y calentamiento. Puedes cambiarlo cuando quieras.</p>
										})()}
										{profileMsg && (
											<p className="text-sm text-zinc-300" aria-live="polite">{profileMsg}</p>
										)}
										<button
											type="submit"
											disabled={profileSaving}
											className="min-h-12 w-full rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:opacity-60"
										>
											{profileSaving ? 'Guardando…' : 'Guardar mis datos'}
										</button>
									</form>
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Apariencia</h2>
									<button type="button" onClick={toggleTheme} className="glass-inset mt-3 flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-bold text-white transition hover:border-red-500/60" aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}>
										<span>Tema {theme === 'light' ? 'claro' : 'oscuro'}</span>
										<span className="text-red-500">Cambiar</span>
									</button>
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tus datos</h2>
									<p className="mt-1 text-xs leading-relaxed text-zinc-500">Borrar tu historial no toca tus rutinas ni tu perfil.</p>
									<div className="mt-3 flex flex-col gap-2">
										<button
											type="button"
											onClick={wipeHistory}
											className={`min-h-12 w-full rounded-xl border px-4 text-[11px] font-bold uppercase tracking-widest transition ${confirmWipe ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300'}`}
										>
											{confirmWipe ? 'Toca de nuevo para borrar todo' : 'Borrar historial'}
										</button>
									</div>
									{dataMsg && (
										<p className="mt-2 text-xs text-zinc-400" aria-live="polite">{dataMsg}</p>
									)}
								</section>
								<section className="glass-card rounded-2xl p-5">
									<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cuenta</h2>
									<button type="button" onClick={signOut} className="mt-3 min-h-12 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-bold uppercase tracking-widest text-red-300 transition hover:border-red-500/60">
										Cerrar sesión
									</button>
								</section>
							</div>
						)
					})()}
				</div>
			</main>
				{isResting && (
					<RestPill label={restLabel} seconds={restLeft} onReturn={returnToTraining} theme={theme} />
				)}
				<Snackbar snack={snack} onClose={closeSnack} />
				<BottomNav value={currentView} onChange={handleNav} theme={theme} />
				{showOnboarding && (
					<OnboardingModal
						form={onboarding}
						setForm={setOnboarding}
						unit={weightUnit}
						onSwitchUnit={switchWeightUnit}
						error={onboardingError}
						saving={onboardingSaving}
						onSubmit={submitOnboarding}
						onSkip={() => setShowOnboarding(false)}
					/>
				)}
			</>
		)
	}

	return (
		<>
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-4xl overflow-hidden px-5 pb-28 text-white`}>
			<BackgroundOrbs />
			<header className="relative z-10 flex items-center justify-between py-6">
				<div className="flex items-center gap-3">
					<div className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
					<span className="text-lg font-black tracking-tight">TempoLift</span>
				</div>
			</header>
			<section className="relative z-10 pb-8 pt-8">
				<p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-red-500">Tu plan de hoy</p>
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
					<div>
						<h1 className="hero-title max-w-xs text-5xl font-black leading-[0.95] tracking-tight">Tu semana.</h1>
						<p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">Visualiza tu entrenamiento y llega preparado a cada sesión.</p>
					</div>
					<button
						type="button"
						onClick={() => setEditingWeek((v) => !v)}
						aria-pressed={editingWeek}
						className={`w-fit self-start rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${editingWeek ? 'border-red-500/60 bg-red-500 text-white' : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-white'}`}
					>
						{editingWeek ? 'Listo' : 'Editar'}
					</button>
				</div>
			</section>
			<section className="view-switch glass-card relative z-10 overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
				<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Calendario semanal</p>
						<h2 className="mt-1 text-xl font-black text-white">Lunes a domingo</h2>
					</div>
					{editingWeek ? (
						<button type="button" onClick={resetWeekOrder} className="text-xs font-bold uppercase tracking-widest text-zinc-500 transition hover:text-red-400">
							Restablecer
						</button>
					) : (
						<span className="text-xs font-bold uppercase tracking-widest text-red-500">{trainingCount} {trainingCount === 1 ? 'sesión' : 'sesiones'}</span>
					)}
				</div>
				{editingWeek && (
					<p className="border-b border-white/10 px-5 py-2 text-xs leading-relaxed text-zinc-500">Mueve cada rutina a otro día con las flechas. Los días quedan fijos (Lun-Dom), nada se abre mientras editas y el orden se guarda solo para tu usuario.</p>
				)}
				<div className="day-list">
					{dayRows.map((entry, idx) => {
						const day = workoutDays.find((workout) => workout.id === entry.workoutId)
						// Nombre del contenido para las etiquetas ("Mover X al Jueves").
						// Si el vecino tiene lo mismo (dos descansos), la flecha se apaga.
						const contentName = entry.rest ? 'Descanso' : (day?.name ?? 'Rutina')
						const upName = idx > 0 ? dayRows[idx - 1].fullDay : ''
						const downName = idx < dayRows.length - 1 ? dayRows[idx + 1].fullDay : ''
						const moveBox = editingWeek && (
							<MoveButtons
								upLabel={`Mover ${contentName} al ${upName}`}
								downLabel={`Mover ${contentName} al ${downName}`}
								canUp={idx > 0 && !sameSlot(weekMap[idx], weekMap[idx - 1])}
								canDown={idx < dayRows.length - 1 && !sameSlot(weekMap[idx], weekMap[idx + 1])}
								onMove={(dir) => moveWeekDay(idx, dir)}
							/>
						)
						if (entry.rest) {
							return (
								<div key={entry.day} style={{ '--d': `${idx * 45}ms` }} className="day-row is-rest flex min-h-24 items-center justify-between gap-2 px-5 py-4">
									<span className="flex items-center gap-4">
										<span className="w-10 text-xs font-bold uppercase tracking-widest text-zinc-500">{entry.day}</span>
										<span>
											<strong className="block text-lg font-black text-white">Descanso</strong>
											<span className="mt-1 block text-sm text-zinc-500">Recuperación y movilidad</span>
										</span>
									</span>
									{moveBox || <span className="text-sm text-zinc-600">—</span>}
								</div>
							)
						}
						const done = Object.values(seriesByDay[day.id] ?? {}).filter((v) => v === 2).length + (cardioByDay[day.id] ? 1 : 0) + (warmupByDay[day.id] ? 1 : 0)
						const total = day.exercises.length + 2
						const pct = total ? Math.round((done / total) * 100) : 0
						if (editingWeek) {
							return (
								<div key={entry.day} style={{ '--d': `${idx * 45}ms` }} className="day-row flex min-h-24 w-full flex-col justify-center gap-2 px-5 py-4 text-left">
									<span className="flex items-center justify-between gap-2">
										<span className="flex items-center gap-4">
											<span className={`day-badge flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
											<span>
												<strong className="block text-lg font-black text-white">{day.name}</strong>
												<span className="mt-1 block text-sm text-zinc-500">{day.focus} · {done}/{total} ✓</span>
											</span>
										</span>
										{moveBox}
									</span>
									<span className={`day-progress ${done === total ? 'done' : ''}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={`Progreso de ${day.name}`}>
										<span style={{ width: `${pct}%` }} />
									</span>
								</div>
							)
						}
						return (
							<button key={entry.day} type="button" onClick={() => selectDay(day.id)} style={{ '--d': `${idx * 45}ms` }} className="day-row group flex min-h-24 w-full flex-col justify-center gap-2 px-5 py-4 text-left">
								<span className="flex items-center justify-between gap-2">
									<span className="flex items-center gap-4">
										<span className={`day-badge flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
										<span>
											<strong className="block text-lg font-black text-white">{day.name}</strong>
											<span className="mt-1 block text-sm text-zinc-500">{day.focus} · {done}/{total} ✓</span>
										</span>
									</span>
									<span className="text-2xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-red-500">→</span>
								</span>
								<span className={`day-progress ${done === total ? 'done' : ''}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={`Progreso de ${day.name}`}>
									<span style={{ width: `${pct}%` }} />
								</span>
							</button>
						)
						})}
					</div>
			</section>
			<footer className="relative z-10 mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-widest text-zinc-600">
				<span>Plan de {trainingCount} {trainingCount === 1 ? 'día' : 'días'}</span>
				<span>Fuerza + cardio</span>
			</footer>
			</main>
			{isResting && (
				<RestPill label={restLabel} seconds={restLeft} onReturn={returnToTraining} theme={theme} />
			)}
			<Snackbar snack={snack} onClose={closeSnack} />
			<BottomNav value={currentView} onChange={handleNav} theme={theme} />
				{showOnboarding && (
					<OnboardingModal
						form={onboarding}
						setForm={setOnboarding}
						unit={weightUnit}
						onSwitchUnit={switchWeightUnit}
						error={onboardingError}
						saving={onboardingSaving}
						onSubmit={submitOnboarding}
						onSkip={() => setShowOnboarding(false)}
					/>
				)}
		</>
	)
}

export default App
