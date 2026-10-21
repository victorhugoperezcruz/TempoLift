// Semana de entreno + journal de rutinas terminadas.
// La semana de entreno NO es Lun-Dom de calendario: empieza el primer día
// con rutina del mapa del usuario (Lun..Dom). Si mueve sus rutinas, el
// inicio se adapta solo: plan de 5 (Mié-Dom) reinicia el miércoles, pero si
// pasa el día 1 al lunes, todo se desbloquea el lunes.
// Cada rutina se entrena UNA vez por semana de entreno: al terminarla se
// bloquea hasta el próximo inicio. La meta semanal limita las sesiones.
import { workoutDays } from '../data/plan.js'

export function trainingWeekStart(now, startIdx) {
	const d = new Date(now)
	d.setHours(0, 0, 0, 0)
	const todayIdx = (d.getDay() + 6) % 7 // Lun=0 .. Dom=6
	const s = Number.isFinite(Number(startIdx)) ? Number(startIdx) : 0
	const delta = (todayIdx - s + 7) % 7
	d.setDate(d.getDate() - delta)
	return d
}

// Journal local de rutinas terminadas: [{ w: workoutId, at: ISO }].
// Preciso por workoutId (bloqueo inmediato sin esperar el fetch + exacto
// aunque dos rutinas compartieran nombre). Se une con las sesiones de
// Supabase (respaldo entre dispositivos) al calcular doneIds.
export function doneJournalKey(userId) {
	return userId ? `tempolift-done-journal-${userId}` : 'tempolift-done-journal'
}

export function readDoneJournal(userId) {
	try {
		const raw = localStorage.getItem(doneJournalKey(userId))
		if (!raw) return []
		const arr = JSON.parse(raw)
		if (!Array.isArray(arr)) return []
		return arr.filter((e) => e && Number.isFinite(Number(e.w)) && typeof e.at === 'string')
	} catch {
		return []
	}
}

export function appendDoneJournal(userId, workoutId) {
	try {
		const prev = readDoneJournal(userId)
		const next = [...prev, { w: Number(workoutId), at: new Date().toISOString() }].slice(-30) // tope: solo importa la semana en curso
		localStorage.setItem(doneJournalKey(userId), JSON.stringify(next))
	} catch {
		// sin localStorage: el journal vive solo en memoria (respaldo Supabase)
	}
}

export function removeDoneJournalByName(userId, routineName) {
	try {
		const ids = new Set(workoutDays.filter((w) => w.name === routineName).map((w) => w.id))
		const next = readDoneJournal(userId).filter((e) => !ids.has(Number(e.w)))
		localStorage.setItem(doneJournalKey(userId), JSON.stringify(next))
	} catch {
		// ignora
	}
}

export function clearDoneJournal(userId) {
	try {
		localStorage.removeItem(doneJournalKey(userId))
	} catch {
		// ignora
	}
}

function dayStartMs(dateOrIso) {
	const d = new Date(dateOrIso)
	if (Number.isNaN(d.getTime())) return 0
	d.setHours(0, 0, 0, 0)
	return d.getTime()
}

// Calcula qué workoutIds están completados y bloqueados en el ciclo actual,
// contemplando automáticamente reposiciones y acarreos de días sin que el
// usuario tenga que marcar nada como "reposición":
// 1. Si una rutina programada en `slotIdx` (ej. Sábado) se hizo antes en la
//    semana como reposición (ej. Lunes) y hoy ya llegó su día `slotIdx`
//    (Sábado), su propio día la desbloquea (`doneDay < slotDayStart`).
// 2. Si hubo acarreo y una rutina de un día anterior del calendario semanal
//    (`otherSlot < slotIdx`, ej. Miércoles) se completó en una fecha posterior
//    a la reposición del Lunes, esa reposición pertenece al ciclo previo y
//    queda desbloqueada.
// 3. Si todas las rutinas programadas en la semana ya fueron completadas en
//    días anteriores a hoy, el ciclo semanal se da por concluido y se reinicia.
export function computeDoneWorkoutIds({ weekMap, sbSessions, sbRoutines, userId, now = new Date() }) {
	const safeMap = Array.isArray(weekMap) ? weekMap : []
	const firstIdx = safeMap.findIndex((s) => s && !s.rest)
	const weekStartIdx = firstIdx === -1 ? 0 : firstIdx
	const weekStart = trainingWeekStart(now, weekStartIdx)
	const weekStartISO = weekStart.toISOString()
	const todayMs = dayStartMs(now)

	const widToName = new Map(workoutDays.map((w) => [w.id, w.name]))
	const nameToWid = new Map(workoutDays.map((w) => [w.name, w.id]))
	const routineNameById = new Map((sbRoutines ?? []).map((r) => [r.id, r.name]))

	const lastDoneIsoByWid = new Map()
	const recordDone = (wid, iso) => {
		if (!widToName.has(wid) || typeof iso !== 'string' || iso < weekStartISO) return
		const prev = lastDoneIsoByWid.get(wid)
		if (!prev || iso > prev) lastDoneIsoByWid.set(wid, iso)
	}

	for (const entry of readDoneJournal(userId)) {
		recordDone(Number(entry.w), entry.at)
	}

	const journalNames = new Set([...lastDoneIsoByWid.keys()].map((id) => widToName.get(id)))
	for (const s of sbSessions ?? []) {
		if (!s?.ended_at || typeof s.started_at !== 'string' || s.started_at < weekStartISO) continue
		const nm = routineNameById.get(s.routine_id)
		if (!nm || journalNames.has(nm)) continue
		const wid = nameToWid.get(nm)
		if (wid != null) recordDone(wid, s.started_at)
	}

	const slotByWid = new Map()
	safeMap.forEach((slot, idx) => {
		if (slot && !slot.rest && Number.isFinite(Number(slot.workoutId))) {
			slotByWid.set(Number(slot.workoutId), idx)
		}
	})

	// Regla 3: si todas las rutinas programadas ya se hicieron antes de hoy, reinicia el ciclo
	const scheduledWids = [...slotByWid.keys()]
	if (
		scheduledWids.length > 0 &&
		scheduledWids.every((wid) => {
			const iso = lastDoneIsoByWid.get(wid)
			return iso && dayStartMs(iso) < todayMs
		})
	) {
		return new Set()
	}

	const doneIds = new Set()
	for (const [wid, iso] of lastDoneIsoByWid.entries()) {
		const doneDay = dayStartMs(iso)
		// Si se completó hoy mismo, siempre aparece completada hoy
		if (doneDay >= todayMs) {
			doneIds.add(wid)
			continue
		}

		const slotIdx = slotByWid.get(wid)
		if (slotIdx != null) {
			// Regla 1: llegó su día programado (ej. Sábado) y la sesión previa fue antes de este Sábado (ej. Lunes de reposición)
			const slotDayMs = trainingWeekStart(now, slotIdx).getTime()
			if (doneDay < slotDayMs) {
				continue
			}

			// Regla 2: acarreo — una rutina de un día anterior de la semana se completó en un día posterior a esta
			let supersededByEarlierSlot = false
			for (const [otherWid, otherSlotIdx] of slotByWid.entries()) {
				if (otherSlotIdx >= slotIdx) continue
				const otherIso = lastDoneIsoByWid.get(otherWid)
				if (otherIso && dayStartMs(otherIso) > doneDay) {
					supersededByEarlierSlot = true
					break
				}
			}
			if (supersededByEarlierSlot) {
				continue
			}
		}

		doneIds.add(wid)
	}

	return doneIds
}
