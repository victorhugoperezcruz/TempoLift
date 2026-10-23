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
			['Press inclinado con mancuernas', '2 x 8', 'Tempo 3-1-1'],
			['Remo inclinado con mancuernas', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano con mancuernas', '2 x 8', 'Tempo 3-1-1'],
			['Jalón al pecho en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Aperturas con mancuernas', '2 x 10-12', 'Tempo 3-1-1'],
			['Remo a una mano con mancuerna', '2 x 10-12', 'Por lado'],
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
			['Sentadilla goblet con mancuerna', '2 x 10', 'Mancuerna al pecho'],
			['Extensión de cuádriceps en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Curl de isquios tumbado en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo en polea', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Aductores en máquina', '2 x 12', 'Tempo 3-1-1'],
			['Abductores en máquina', '2 x 12', 'Tempo 3-1-1'],
			['Pantorrilla de pie en máquina', '2 x 12', 'De pie'],
		],
	},
	{
		id: 3,
		name: 'Hombro y brazo',
		focus: 'Torso',
		accent: 'bg-sky-300',
		exercises: [
			['Press militar con mancuernas', '2 x 8', 'Tempo 3-1-1'],
			['Elevaciones laterales con mancuernas', '2 x 12', 'Tempo 3-1-1'],
			['Skull crusher con mancuernas', '2 x 8-10', 'Codos fijos'],
			['Curl predicador con mancuernas', '2 x 10', 'Tempo 3-1-1'],
			['Patada de tríceps con mancuerna', '2 x 10', 'Codo fijo atrás'],
			['Curl martillo con mancuernas', '2 x 10', 'Agarre neutro'],
			['Curl de bíceps en máquina', '2 x 10', 'Tempo 3-1-1'],
		],
	},
	{
		id: 4,
		name: 'Pierna 2',
		focus: 'Isquiosurales y glúteo',
		accent: 'bg-rose-300',
		exercises: [
			['Prensa de piernas en máquina', '2 x 10', 'Pies altos'],
			['Curl de isquios sentado en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Extensión de cuádriceps en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo en máquina', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Aductores en máquina', '2 x 12', 'Tempo 3-1-1'],
			['Abductores en máquina', '2 x 12', 'Tempo 3-1-1'],
			['Pantorrilla de pie en máquina', '2 x 12', 'De pie'],
		],
	},
	{
		id: 5,
		name: 'Torso mixto',
		focus: 'Pecho, espalda y hombro',
		accent: 'bg-violet-300',
		exercises: [
			['Press inclinado en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Jalón agarre invertido en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Elevación lateral en máquina', '2 x 12', 'Tempo 3-1-1'],
		],
	},
	{
		id: 6,
		name: 'Cuerpo completo A',
		focus: 'Full body: pecho, espalda, pierna y brazo',
		accent: 'bg-emerald-300',
		exercises: [
			['Press inclinado con mancuernas', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Prensa de piernas en máquina', '2 x 10', 'Pies altos'],
			['Press militar en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Curl predicador en máquina', '2 x 10', 'Tempo 3-1-1'],
			['Tríceps en polea alta', '2 x 10', 'Aprieta abajo'],
			['Pantorrilla sentado en máquina', '2 x 12', 'Sentado'],
		],
	},
	{
		id: 7,
		name: 'Cuerpo completo B',
		focus: 'Full body: torso, glúteo e isquios',
		accent: 'bg-teal-300',
		exercises: [
			['Press plano en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Jalón agarre invertido en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Patada de glúteo en polea', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Curl de isquios tumbado en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Elevaciones laterales con mancuernas', '2 x 12', 'Tempo 3-1-1'],
			['Curl martillo en máquina', '2 x 10', 'Agarre neutro'],
			['Abductores en máquina', '2 x 12', 'Tempo 3-1-1'],
		],
	},
	// ---- Rutinas de splits famosos (ids 8-12, nombres únicos como el resto) ----
	{
		id: 8,
		name: 'Empuje',
		focus: 'Push: pecho, hombro y tríceps',
		accent: 'bg-amber-300',
		exercises: [
			['Press inclinado con mancuernas', '2 x 8', 'Tempo 3-1-1'],
			['Press plano en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Press militar con mancuernas', '2 x 8', 'Tempo 3-1-1'],
			['Elevaciones laterales con mancuernas', '2 x 12', 'Tempo 3-1-1'],
			['Skull crusher con mancuernas', '2 x 8-10', 'Codos fijos'],
			['Tríceps en polea alta', '2 x 10', 'Aprieta abajo'],
			['Fondos en máquina', '2 x 10-12', 'Tempo 3-1-1'],
		],
	},
	{
		id: 9,
		name: 'Tirón',
		focus: 'Pull: espalda y bíceps',
		accent: 'bg-indigo-300',
		exercises: [
			['Remo en T en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Jalón al pecho en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Remo sentado en máquina', '2 x 10', 'Tempo 3-1-1'],
			['Remo a una mano con mancuerna', '2 x 10-12', 'Por lado'],
			['Curl predicador en máquina', '2 x 10', 'Tempo 3-1-1'],
			['Curl martillo con mancuernas', '2 x 10', 'Agarre neutro'],
		],
	},
	{
		id: 10,
		name: 'Pierna PPL',
		focus: 'Pierna completa: quad, isquio y glúteo',
		accent: 'bg-lime-300',
		exercises: [
			['Prensa de piernas en máquina', '2 x 10', 'Pies altos'],
			['Extensión de cuádriceps en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Curl de isquios sentado en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo en máquina', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Pantorrilla de pie en máquina', '2 x 12', 'De pie'],
		],
	},
	{
		id: 11,
		name: 'Tren superior',
		focus: 'Upper: pecho, espalda, hombro y brazo',
		accent: 'bg-cyan-300',
		exercises: [
			['Press inclinado en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Press militar en máquina', '2 x 8', 'Tempo 3-1-1'],
			['Jalón agarre invertido en máquina', '2 x 8-10', 'Tempo 3-1-1'],
			['Curl predicador con mancuernas', '2 x 10', 'Tempo 3-1-1'],
			['Tríceps en polea alta', '2 x 10', 'Aprieta abajo'],
		],
	},
	{
		id: 12,
		name: 'Tren inferior',
		focus: 'Lower: pierna y glúteo',
		accent: 'bg-amber-300',
		exercises: [
			['Sentadilla goblet con mancuerna', '2 x 10', 'Mancuerna al pecho'],
			['Prensa de piernas en máquina', '2 x 10', 'Pies altos'],
			['Curl de isquios tumbado en máquina', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo en polea', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Abductores en máquina', '2 x 12', 'Tempo 3-1-1'],
			['Pantorrilla sentado en máquina', '2 x 12', 'Sentado'],
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

export const FULL_BODY_IDS = [6, 7]

export function isFullBodyWorkout(workoutId) {
	return FULL_BODY_IDS.includes(Number(workoutId))
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

// Ajusta el mapa semanal al cambiar la meta en el perfil conservando los días
// de la semana elegidos por el usuario y la rutina asignada a cada uno de esos
// días (sin desplazar ni mezclar las rutinas que el usuario ya acomodó, y sin
// mezclar full-body con rutinas divididas de 4-5 días). Si la meta es 1 día,
// fuerza Full Body.
export function adjustWeekMapForGoal(prevMap, nextGoal, protectedIds = new Set()) {
	const goal = Math.min(7, Math.max(1, Number(nextGoal) || 5))
	if (!Array.isArray(prevMap) || prevMap.length !== weekSchedule.length) {
		return buildWeekMapForGoal(goal)
	}

	const currentEntries = prevMap
		.map((s, idx) => (s && !s.rest ? { dayIdx: idx, workoutId: Number(s.workoutId) } : null))
		.filter(Boolean)

	if (currentEntries.length === 0) {
		return buildWeekMapForGoal(goal)
	}

	// 1. Si bajan los días, quita desde el final de la semana (respetando días completados/activos)
	const keptEntries = [...currentEntries]
	while (keptEntries.length > goal) {
		let removePos = -1
		for (let i = keptEntries.length - 1; i >= 0; i -= 1) {
			if (!protectedIds.has(keptEntries[i].workoutId)) {
				removePos = i
				break
			}
		}
		if (removePos === -1) removePos = keptEntries.length - 1
		keptEntries.splice(removePos, 1)
	}

	// 2. Caso especial: 1 solo día de entrenamiento → sí o sí Full Body (6 o 7)
	if (goal === 1) {
		const targetDay = keptEntries[0]?.dayIdx ?? TRAINING_DAYS_BY_GOAL[1][0]
		const existingFb = currentEntries.find((e) => isFullBodyWorkout(e.workoutId))?.workoutId
		const wid = existingFb ?? 6
		return weekSchedule.map((_, i) => (i === targetDay ? { workoutId: wid } : { rest: true }))
	}

	// 3. Caso especial: 2 días → prioriza Full Body A y B (salvo split custom 8..12)
	if (goal === 2) {
		const targetCurated = ROUTINES_BY_GOAL[2]
		const nextSlots = weekSchedule.map(() => ({ rest: true }))
		const chosenDays = keptEntries.map((e) => e.dayIdx)
		if (chosenDays.length < 2) {
			const last = chosenDays[chosenDays.length - 1] ?? 1
			for (let i = last + 1; i < weekSchedule.length && chosenDays.length < 2; i += 1) {
				if (!chosenDays.includes(i)) chosenDays.push(i)
			}
			for (let i = weekSchedule.length - 1; i >= 0 && chosenDays.length < 2; i -= 1) {
				if (!chosenDays.includes(i)) chosenDays.push(i)
			}
		}
		chosenDays.sort((a, b) => a - b)
		const used = new Set()
		chosenDays.forEach((dIdx, pos) => {
			const prevWid = keptEntries.find((e) => e.dayIdx === dIdx)?.workoutId
			if (prevWid && (isFullBodyWorkout(prevWid) || prevWid >= 8) && !used.has(prevWid)) {
				nextSlots[dIdx] = { workoutId: prevWid }
				used.add(prevWid)
			} else {
				const pick = targetCurated.find((id) => !used.has(id)) ?? workoutDays.map((w) => w.id).find((id) => !used.has(id)) ?? targetCurated[pos]
				nextSlots[dIdx] = { workoutId: pick }
				used.add(pick)
			}
		})
		return nextSlots
	}

	// 4. Metas de 3 a 7 días: conserva cada día ya configurado por el usuario
	//    en su misma posición, limpiando full-body (6, 7) si pasa a 4-5 días.
	const targetCurated = ROUTINES_BY_GOAL[goal] ?? ROUTINES_BY_GOAL[5]
	const targetAllowsFullBody = targetCurated.some((id) => isFullBodyWorkout(id))

	const result = weekSchedule.map(() => ({ rest: true }))
	const usedWids = new Set()
	const pendingFillDays = []

	for (const entry of keptEntries) {
		if (!targetAllowsFullBody && isFullBodyWorkout(entry.workoutId)) {
			pendingFillDays.push(entry.dayIdx)
		} else if (!usedWids.has(entry.workoutId)) {
			result[entry.dayIdx] = { workoutId: entry.workoutId }
			usedWids.add(entry.workoutId)
		} else {
			pendingFillDays.push(entry.dayIdx)
		}
	}

	// Si faltan días por activar (ej. subir de 4 a 5 días), agrega días libres
	// empezando después del último día activo y luego desde el final de la semana,
	// sin mover ni alterar los días que el usuario ya tenía configurados.
	const activeSet = new Set([...keptEntries.map((e) => e.dayIdx)])
	if (activeSet.size < goal) {
		const lastDay = keptEntries[keptEntries.length - 1].dayIdx
		const candidateDays = []
		for (let i = lastDay + 1; i < weekSchedule.length; i += 1) candidateDays.push(i)
		for (let i = weekSchedule.length - 1; i >= 0; i -= 1) candidateDays.push(i)
		for (const d of candidateDays) {
			if (activeSet.size >= goal) break
			if (!activeSet.has(d)) {
				activeSet.add(d)
				pendingFillDays.push(d)
			}
		}
	}

	pendingFillDays.sort((a, b) => a - b)
	const pool = [...targetCurated, ...workoutDays.map((w) => w.id)]
	for (const dIdx of pendingFillDays) {
		const pick = pool.find((id) => !usedWids.has(id))
		if (pick != null) {
			result[dIdx] = { workoutId: pick }
			usedWids.add(pick)
		}
	}

	return result
}

// Splits famosos para personalizar la semana. Cada uno trae su mapa
// Lun..Dom (sin rutinas repetidas: cada rutina se programa una sola vez por
// semana para que el bloqueo semanal por rutina siga funcionando), su nivel
// y una explicación para que el usuario sepa qué significa y qué trabaja.
// El preview animado de cada día se deriva del primer ejercicio de la rutina
// (ver SplitPickerModal), así que no se hardcodean GIFs aquí.
export const SPLIT_TEMPLATES = [
	{
		id: 'tempolift-5',
		name: 'TempoLift 5 días',
		tag: 'El plan de la casa',
		days: 5,
		level: 'Principiante · Intermedio',
		description: 'El plan original: pecho-espalda, dos días de pierna, hombro-brazo y torso mixto. Un músculo enfocado por día con fin de semana de pierna y torso.',
		map: [{ rest: true }, { rest: true }, { workoutId: 1 }, { workoutId: 2 }, { workoutId: 3 }, { workoutId: 4 }, { workoutId: 5 }],
	},
	{
		id: 'ppl-3',
		name: 'Push · Pull · Legs',
		tag: 'PPL clásico',
		days: 3,
		level: 'Intermedio',
		description: 'Empuje (pecho-hombro-tríceps), Tirón (espalda-bíceps) y Pierna completa. El split más famoso para 3 días: cada músculo una vez por semana con mucho volumen por sesión.',
		map: [{ workoutId: 8 }, { rest: true }, { workoutId: 9 }, { rest: true }, { workoutId: 10 }, { rest: true }, { rest: true }],
	},
	{
		id: 'upper-lower-4',
		name: 'Torso / Pierna ×2',
		tag: 'Upper · Lower',
		days: 4,
		level: 'Intermedio',
		description: 'Dos rotaciones con variantes distintas: Tren superior + Tren inferior, y luego Torso mixto + Pierna 1. Cada músculo dos veces por semana sin repetir el mismo día.',
		map: [{ workoutId: 11 }, { workoutId: 12 }, { rest: true }, { workoutId: 5 }, { workoutId: 2 }, { rest: true }, { rest: true }],
	},
	{
		id: 'arnold-3',
		name: 'Arnold',
		tag: 'Pecho+Espalda · Hombro+Brazo · Pierna',
		days: 3,
		level: 'Intermedio · Avanzado',
		description: 'El split de Arnold: pecho con espalda, hombro con brazo y pierna completa. Sesiones largas con mucho volumen, ideales si te gustan los días intensos.',
		map: [{ workoutId: 1 }, { rest: true }, { workoutId: 3 }, { rest: true }, { workoutId: 2 }, { rest: true }, { rest: true }],
	},
	{
		id: 'fullbody-2',
		name: 'Cuerpo completo',
		tag: 'Full-body 2 días',
		days: 2,
		level: 'Principiante',
		description: 'Dos full-body distintos (A y B) que tocan todo el cuerpo en cada sesión. Perfecto si retomas o tienes poco tiempo: con 2 días ya trabajas todo.',
		map: [{ rest: true }, { workoutId: 6 }, { rest: true }, { rest: true }, { workoutId: 7 }, { rest: true }, { rest: true }],
	},
	{
		id: 'ppl-ul-5',
		name: 'PPL + Torso/Pierna',
		tag: 'Híbrido 5 días',
		days: 5,
		level: 'Avanzado',
		description: 'Híbrido exigente: PPL entre semana (empuje, tirón, pierna) más torso y pierna con variantes el fin de semana. Cinco estímulos distintos sin repetir rutina.',
		map: [{ workoutId: 8 }, { workoutId: 9 }, { workoutId: 10 }, { rest: true }, { workoutId: 11 }, { workoutId: 12 }, { rest: true }],
	},
]

// ¿A qué split equivale el mapa actual? null si es personalizado manual.
export function findTemplateForMap(map) {
	if (!Array.isArray(map) || map.length !== weekSchedule.length) return null
	for (const t of SPLIT_TEMPLATES) {
		let same = true
		for (let i = 0; i < map.length; i += 1) {
			const a = map[i]
			const b = t.map[i]
			if (Boolean(a?.rest) !== Boolean(b?.rest)) { same = false; break }
			if (!a?.rest && a?.workoutId !== b?.workoutId) { same = false; break }
		}
		if (same) return t.id
	}
	return null
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
// Tras la separación por implemento (cada nombre = 1 movimiento + 1 equipo),
// el nombre genérico viejo (p. ej. "Press inclinado") se hereda en TODAS
// sus variantes nuevas (mancuernas y máquina): el usuario elige la que
// realmente hacía al sustituir y recupera su peso. Solo se usa el alias
// mientras el nombre nuevo no tenga historial propio.
// "Prensa de piernas" se hacía en máquina: NO se hereda en la goblet.
export const EXERCISE_RENAMES = {
	'Press inclinado con mancuernas': ['Press inclinado'],
	'Press inclinado en máquina': ['Press inclinado'],
	'Remo inclinado con mancuernas': ['Remo en T'],
	'Remo en T en máquina': ['Remo en T'],
	'Press plano con mancuernas': ['Press plano'],
	'Press plano en máquina': ['Press plano'],
	'Jalón al pecho en máquina': ['Jalón a pecho'],
	'Aperturas con mancuernas': ['Pec Fly'],
	'Pec Fly en máquina': ['Pec Fly'],
	'Remo a una mano con mancuerna': ['Jalón unilateral dorsal'],
	'Jalón unilateral en máquina': ['Jalón unilateral dorsal'],
	'Prensa de piernas en máquina': ['Prensa de piernas'],
	'Extensión de cuádriceps en máquina': ['Extensión de cuádriceps'],
	'Aductores en máquina': ['Máquina de aductores'],
	'Abductores en máquina': ['Máquina de abductores'],
	'Pantorrilla de pie en máquina': ['Pantorrilla', 'Biserie de pantorrillas'],
	'Pantorrilla sentado en máquina': ['Pantorrilla', 'Biserie de pantorrillas'],
	'Press militar con mancuernas': ['Press militar'],
	'Press militar en máquina': ['Press militar'],
	'Elevaciones laterales con mancuernas': ['Elevaciones laterales'],
	'Elevación lateral en máquina': ['Elevaciones laterales'],
	'Skull crusher con mancuernas': ['Skull crushers'],
	'Skull crusher con barra': ['Skull crushers'],
	'Curl predicador con mancuernas': ['Curl predicador'],
	'Curl predicador en máquina': ['Curl predicador'],
	'Curl predicador con barra': ['Curl predicador'],
	'Patada de tríceps con mancuerna': ['Tríceps en polea'],
	'Tríceps en polea alta': ['Tríceps en polea'],
	'Tríceps en polea con V': ['Tríceps en polea'],
	'Curl martillo con mancuernas': ['Curl martillo'],
	'Curl martillo en máquina': ['Curl martillo'],
	'Curl de isquios sentado en máquina': ['Curl de isquiosurales sentado'],
	'Patada de glúteo en máquina': ['Patada de glúteo'],
	'Patada de glúteo en polea': ['Patada de glúteo'],
}

// Último peso conocido para un NOMBRE del catálogo: el suyo propio o, si
// aún no tiene, el del nombre viejo más reciente del que hereda.
// lastByName = { [nombre]: { weight_kg, reps, created_at } }.
export function lastWeightForName(name, lastByName) {
	if (!name || !lastByName) return null
	if (lastByName[name]) return { ...lastByName[name], inherited: false }
	let best = null
	for (const old of EXERCISE_RENAMES[name] ?? []) {
		const row = lastByName[old]
		if (row && (!best || String(row.created_at ?? '') > String(best.created_at ?? ''))) best = row
	}
	return best ? { ...best, inherited: true } : null
}

// Peso de ejemplo realista por ejercicio (lb): solo orienta el placeholder
// del modal para no sugerir cargas absurdas. No es valor por defecto.
// Cada ejercicio separado tiene su propio hint según equipo.
export const WEIGHT_HINTS_LB = {
	// Pecho
	'Press inclinado con mancuernas': 95,
	'Press inclinado en máquina': 90,
	'Press plano con mancuernas': 95,
	'Press plano en máquina': 90,
	'Press declinado en máquina': 90,
	'Aperturas con mancuernas': 30,
	'Pec Fly en máquina': 70,
	// Espalda
	'Remo inclinado con mancuernas': 90,
	'Remo a una mano con mancuerna': 50,
	'Remo en T en máquina': 90,
	'Remo en T agarre invertido en máquina': 90,
	'Remo vertical agarre invertido en máquina': 90,
	'Remo sentado en máquina': 100,
	'Remo sentado agarre estrecho en máquina': 100,
	'Remo alterno en máquina': 50,
	'Jalón al pecho en máquina': 100,
	'Jalón agarre invertido en máquina': 90,
	'Jalón unilateral en máquina': 50,
	// Pierna / glúteo
	'Sentadilla goblet con mancuerna': 45,
	'Prensa de piernas en máquina': 270,
	'Extensión de cuádriceps en máquina': 90,
	'Aductores en máquina': 100,
	'Abductores en máquina': 100,
	'Curl de isquios sentado en máquina': 90,
	'Curl de isquios tumbado en máquina': 90,
	'Curl de isquios arrodillado en máquina': 70,
	'Patada de glúteo en máquina': 40,
	'Hiperextensión inversa en máquina': 40,
	'Peso muerto en máquina': 90,
	'Patada de glúteo en polea': 30,
	'Pantorrilla de pie en máquina': 90,
	'Pantorrilla sentado en máquina': 90,
	'Prensa de pantorrilla en máquina': 90,
	'Pantorrilla en prensa de piernas': 180,
	// Hombro
	'Press militar con mancuernas': 70,
	'Press militar en máquina': 70,
	'Press de hombro en máquina': 70,
	'Press de hombro a una mano en máquina': 35,
	'Elevaciones laterales con mancuernas': 15,
	'Elevación lateral en máquina': 50,
	'Apertura posterior en máquina': 60,
	// Brazo
	'Skull crusher con barra': 40,
	'Skull crusher con mancuernas': 40,
	'Extensión de tríceps en máquina': 60,
	'Fondos en máquina': 100,
	'Tríceps en polea alta': 50,
	'Tríceps en polea con V': 50,
	'Patada de tríceps con mancuerna': 20,
	'Curl predicador con mancuernas': 45,
	'Curl predicador con barra': 45,
	'Curl predicador en máquina': 45,
	'Curl de bíceps en máquina': 45,
	'Curl martillo con mancuernas': 25,
	'Curl martillo en máquina': 40,
}

export function weightHintFor(spanishName, unit) {
	const lb = WEIGHT_HINTS_LB[spanishName] ?? 45
	// Redondeado al paso del input (0.5): un hint como 43.1 el navegador lo
	// rechaza y no debe sugerirse.
	const raw = unit === 'kg' ? lb / LB_PER_KG : lb
	return String(Math.round(raw * 2) / 2)
}
