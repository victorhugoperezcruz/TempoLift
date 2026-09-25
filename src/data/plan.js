// Plan semanal de fuerza TempoLift: datos estáticos + semana del usuario.
// Sin dependencias: el resto de la app importa desde aquí.

export const globalPhases = {
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

export const globalRules = {
	tempo: '3-1-1',
	rest: '2-3 min',
}

export const workoutDays = [
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
		// Nombres únicos por rutina (antes ambas eran "Pierna" y compartían
		// fila en Supabase): cada día de pierna se bloquea por separado.
		name: 'Pierna 1',
		focus: 'Cuádriceps y glúteo',
		accent: 'bg-orange-300',
		exercises: [
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Extensión de cuádriceps', '2 x 10-12', 'Tempo 3-1-1'],
			['Máquina de aductores', '2 x 12', 'Tempo 3-1-1'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
			['Pantorrilla', '2 x 12', 'De pie'],
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
		name: 'Pierna 2',
		focus: 'Isquiosurales y glúteo',
		accent: 'bg-rose-300',
		exercises: [
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Curl de isquiosurales sentado', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
			['Pantorrilla', '2 x 12', 'De pie'],
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
			['Pantorrilla', '2 x 12', 'De pie'],
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

export const weekSchedule = [
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
export const DEFAULT_WEEK_MAP = [
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
export const TRAINING_DAYS_BY_GOAL = {
	1: [3],
	2: [2, 5],
	3: [1, 3, 5],
	4: [0, 1, 3, 4],
	5: [2, 3, 4, 5, 6],
	6: [0, 1, 2, 4, 5, 6],
	7: [0, 1, 2, 3, 4, 5, 6],
}

export const ROUTINES_BY_GOAL = {
	1: [6],
	2: [6, 7],
	3: [6, 4, 3],
	4: [1, 2, 3, 4],
	5: [1, 2, 3, 4, 5],
	6: [1, 2, 3, 4, 5, 6],
	7: [1, 2, 3, 4, 5, 6, 7],
}

// Construye el mapa semanal para una meta (descanso donde no toca entrenar).
export function buildWeekMapForGoal(goal) {
	const days = TRAINING_DAYS_BY_GOAL[goal] ?? TRAINING_DAYS_BY_GOAL[5]
	const routines = ROUTINES_BY_GOAL[goal] ?? ROUTINES_BY_GOAL[5]
	return weekSchedule.map((_, i) => {
		const pos = days.indexOf(i)
		return pos === -1 ? { rest: true } : { workoutId: routines[pos] }
	})
}

export function weekMapKey(userId) {
	return userId ? `tempolift-week-map-${userId}` : 'tempolift-week-map'
}

export function sameSlot(a, b) {
	if (!a || !b) return false
	if (a.rest || b.rest) return Boolean(a.rest && b.rest)
	return a.workoutId === b.workoutId
}

// Lee el mapa guardado de ese usuario. null si no hay o si es inválido
// (longitud distinta, rutinas duplicadas o desconocidas): así un cambio del
// plan no rompe nada y nunca hay semanas imposibles.
export function readWeekMap(userId) {
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

export function persistWeekMap(userId, map) {
	try {
		localStorage.setItem(weekMapKey(userId), JSON.stringify(map))
	} catch {
		// sin localStorage: el orden vive solo en memoria
	}
}

// Meta semanal de sesiones (1 a 7, por defecto 5): alimenta la gráfica de
// constancia y la sección Meta semanal del perfil. Por usuario, sin migración.
export function weekGoalKey(userId) {
	return userId ? `tempolift-week-goal-${userId}` : 'tempolift-week-goal'
}

export function readWeekGoal(userId) {
	try {
		const v = parseInt(localStorage.getItem(weekGoalKey(userId)), 10)
		if (Number.isFinite(v)) return Math.min(7, Math.max(1, v))
	} catch {
		// sin localStorage: usa el valor por defecto
	}
	return 5
}

export function persistWeekGoal(userId, value) {
	try {
		localStorage.setItem(weekGoalKey(userId), String(value))
	} catch {
		// sin localStorage: la meta vive solo en memoria
	}
}

// Consejo según la meta elegida (sin emojis): orienta sin obligar.
export function weekGoalTip(goal) {
	if (goal <= 1) return 'Un día es mejor que ninguno, pero tu cuerpo puede con más: prueba subir a 2 o 3 cuando te sientas listo.'
	if (goal === 2) return 'Buen punto de partida. Con 3 días a la semana el progreso se nota más rápido.'
	if (goal === 3) return 'Meta equilibrada: constancia sin quemarte. Ideal si vienes retomando.'
	if (goal === 4) return 'Ritmo sólido, a un paso del plan completo.'
	if (goal === 5) return 'El plan completo: así se construye la constancia semana a semana.'
	if (goal === 6) return 'Nivel exigente: cuida el sueño y la comida para sostenerlo.'
	return 'Cuidado: el cuerpo necesita descansar para crecer. Entrenar los 7 días sin pausa lleva al sobreentrenamiento.'
}

export const REST_SECONDS = 120

// ---- Sistema de estimación de calorías (aproximado) ----
// Fuerza: ~1 kcal por cada 20 kg movidos (peso × reps sumado en todas las series).
// Cardio: fórmula MET × peso corporal × tiempo (caminadora 4-5 km/h, inclinación 10-12 ≈ 8 MET).
// Los pesos se anotan en lb: se convierten a kg para el cálculo.
export const LB_TO_KG = 0.453592
export const LB_PER_KG = 2.20462
export const KCAL_PER_KG_MOVED = 0.05
export const CARDIO_MET = 8
export const WARMUP_MET = 3.5 // caminadora 5 km/h sin inclinación
export const DEFAULT_BODY_KG = 75
export const DEFAULT_CARDIO_MIN = 25
export const DEFAULT_WARMUP_MIN = 7 // plan: 5-10 min

// Renombres de ejercicios del plan: el historial (último peso y series
// recientes) se hereda del nombre anterior para no empezar de cero ni
// mostrar el plan estático. Sin mutar datos: solo lectura con alias.
export const EXERCISE_RENAMES = {
	'Pantorrilla': ['Biserie de pantorrillas'],
}

// Peso de ejemplo realista por ejercicio (lb): solo orienta el placeholder
// del modal para no sugerir cargas absurdas. No es valor por defecto.
export const WEIGHT_HINTS_LB = {
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
	'Pantorrilla': 90,
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

export function weightHintFor(spanishName, unit) {
	const lb = WEIGHT_HINTS_LB[spanishName] ?? 45
	// Redondeado al paso del input (0.5): un hint como 43.1 el navegador lo
	// rechaza y no debe sugerirse.
	const raw = unit === 'kg' ? lb / LB_PER_KG : lb
	return String(Math.round(raw * 2) / 2)
}
