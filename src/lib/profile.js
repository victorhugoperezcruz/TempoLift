// Preferencias y perfil local (tema, unidad, peso corporal, perfil).
import { DEFAULT_BODY_KG } from '../data/plan.js'

export function readTheme() {
	try {
		return localStorage.getItem('tempolift-theme') === 'light' ? 'light' : 'dark'
	} catch {
		return 'dark'
	}
}

export function persistTheme(t) {
	try {
		localStorage.setItem('tempolift-theme', t)
	} catch {
		// sin localStorage: el tema vive solo en memoria
	}
}

export function profileStoreKey(userId) {
	return userId ? `tempolift-profile-${userId}` : 'tempolift-profile'
}

export function readProfileLocal(userId) {
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

export function persistProfileLocal(userId, profile) {
	try {
		localStorage.setItem(profileStoreKey(userId), JSON.stringify(profile ?? {}))
	} catch {
		// sin localStorage: el perfil vive solo en memoria
	}
}

// Peso corporal por usuario: clave propia, con fallback a la global histórica.
export function readBodyKg() {
	try {
		const v = parseFloat(localStorage.getItem('tempolift-body-kg') ?? '')
		if (Number.isFinite(v) && v > 0 && v < 500) return v
	} catch {
		// sin localStorage: usa el valor por defecto
	}
	return DEFAULT_BODY_KG
}

export function readBodyKgFor(userId) {
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

export function isProfileComplete(p) {
	if (!p) return false
	const w = Number(p.weight_kg)
	return Number.isFinite(w) && w > 0
}
