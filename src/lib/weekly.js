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
