// Timer de descanso persistido por usuario (`tempolift-rest-timer-{uid}`).
// El descanso se mide con un deadline (timestamp), no contando ticks de
// setTimeout: los navegadores limitan/pausan los timers en segundo plano
// (móvil y desktop) y el conteo "1s por tick" se atrasa o se reinicia.
// Con endsAt = Date.now() + segundos*1000 el tiempo restante siempre es
// real aunque la pestaña estuvo oculta, el teléfono bloqueado o se
// recargó la página. Así el descanso de una cuenta nunca se muestra en otra.

export const REST_TIMER_KEY = 'tempolift-rest-timer' // legado global (sin usuario); se migra a clave por usuario

export function restTimerKey(userId) {
	return userId ? `tempolift-rest-timer-${userId}` : REST_TIMER_KEY
}

export function parseRestTimer(raw) {
	if (!raw) return null
	const p = JSON.parse(raw)
	if (!p || typeof p !== 'object') return null
	const endsAt = Number(p.endsAt)
	if (!Number.isFinite(endsAt) || endsAt <= Date.now()) return null
	return {
		endsAt,
		label: typeof p.label === 'string' ? p.label : '',
		series: p.series === 2 ? 2 : 1,
	}
}

export function readRestTimer(userId) {
	try {
		const own = parseRestTimer(localStorage.getItem(restTimerKey(userId)))
		if (own) return own
		// Migración una sola vez: el timer global de versiones anteriores
		// (sin usuario) se adopta a esta cuenta y se elimina el global.
		if (userId) {
			const legacy = parseRestTimer(localStorage.getItem(REST_TIMER_KEY))
			if (legacy) {
				try {
					localStorage.setItem(restTimerKey(userId), JSON.stringify({ endsAt: legacy.endsAt, label: legacy.label, series: legacy.series }))
					localStorage.removeItem(REST_TIMER_KEY)
				} catch {
					// ignora
				}
				return legacy
			}
		}
	} catch {
		return null
	}
	return null
}

export function persistRestTimer(userId, endsAt, label, series) {
	try {
		localStorage.setItem(restTimerKey(userId), JSON.stringify({ endsAt, label: label ?? '', series: series === 2 ? 2 : 1 }))
		// Sin globales huérfanos: si ya hay dueño, el legado sobra.
		if (userId) localStorage.removeItem(REST_TIMER_KEY)
	} catch {
		// sin localStorage: el timer vive solo en memoria
	}
}

export function clearRestTimer(userId) {
	try {
		localStorage.removeItem(restTimerKey(userId))
		localStorage.removeItem(REST_TIMER_KEY)
	} catch {
		// ignora
	}
}
