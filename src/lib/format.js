// Formato de tiempos + detección de puntero fino. Sin dependencias.

export function formatRest(total) {
	const t = Math.max(0, Math.ceil(Number(total) || 0))
	const m = Math.floor(t / 60)
	const s = t % 60
	return `${m}:${String(s).padStart(2, '0')}`
}

// Autofoco solo con puntero fino: en táctil abriría el teclado de golpe
// tapando medio modal. Se usa como autoFocus={FINE_POINTER}.
export const FINE_POINTER = typeof window !== 'undefined'
	&& typeof window.matchMedia === 'function'
	&& window.matchMedia('(pointer: fine)').matches
